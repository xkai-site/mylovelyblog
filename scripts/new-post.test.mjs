import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPost, parseArgs, validateDate, imageRoot } from './new-post.mjs';

const templatePath = fileURLToPath(new URL('../templates/post.md', import.meta.url));
function fixture(t, folder = 'mylovelyblog') {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-post-test-'));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  const root = path.join(parent, folder);
  fs.mkdirSync(path.join(root, 'templates'), { recursive: true });
  fs.mkdirSync(path.join(root, '_posts'));
  fs.copyFileSync(templatePath, path.join(root, 'templates/post.md'));
  fs.writeFileSync(path.join(root, '_config.yml'), 'baseurl: "/mylovelyblog"\n');
  return root;
}
const options = { title: '第一篇："你好"', id: 'hello-notes', date: '2026-04-25', category: '技术', tags: 'AI, Agent，AI' };

test('生成草稿、合法 YAML 标量、去重标签及固定图片目录', t => {
  const root = fixture(t);
  const result = createPost(options, root);
  const text = fs.readFileSync(result.draft, 'utf8');
  assert.match(text, /title: "第一篇：\\"你好\\""/);
  assert.match(text, /tags: \["AI","Agent"\]/);
  assert.match(text, /typora-root-url: \.\.\/\.\./);
  assert.match(text, /typora-copy-images-to: \.\.\/assets\/images\/hello-notes/);
  assert.match(text, /slug: hello-notes/);
  assert.ok(fs.existsSync(path.join(result.images, '.gitkeep')));
  assert.equal(result.publishName, '2026-04-25-hello-notes.md');
  assert.equal(fs.readdirSync(path.join(root, '_posts')).length, 0);
});

test('改显示标题不改变资源路径或 slug；发布后拒绝重复标识', t => {
  const root = fixture(t);
  const result = createPost(options, root);
  const original = fs.readFileSync(result.draft, 'utf8');
  const renamed = original.replace(/^title:.*$/m, 'title: 新标题');
  fs.writeFileSync(result.draft, renamed);
  fs.renameSync(result.draft, path.join(root, '_posts', result.publishName));
  assert.match(renamed, /slug: hello-notes/);
  assert.match(renamed, /images\/hello-notes/);
  assert.throws(() => createPost({ ...options, date: '2026-04-26' }, root), /已使用/);
});

test('拒绝覆盖草稿和已有资源目录，保留原文件', t => {
  const root = fixture(t);
  const result = createPost(options, root);
  const original = fs.readFileSync(result.draft, 'utf8');
  assert.throws(() => createPost(options, root), /已使用|已存在/);
  assert.equal(fs.readFileSync(result.draft, 'utf8'), original);
  fs.mkdirSync(path.join(root, 'assets/images/reserved'));
  assert.throws(() => createPost({ ...options, id: 'reserved' }, root), /已存在/);
});

test('拒绝无效日期，正确处理闰年', () => {
  for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-1', '../file', '0000-01-01']) {
    assert.throws(() => validateDate(date), /日期/);
  }
  assert.equal(validateDate('2024-02-29'), '2024-02-29');
});

test('拒绝路径穿越、绝对路径、Windows 保留名和空标题', t => {
  const root = fixture(t);
  for (const id of ['../escape', '/tmp/file', 'C:\\bad', 'has space', 'bad--slug', 'CON', 'con', 'nul', '.hidden']) {
    assert.throws(() => createPost({ ...options, id }, root), /标识/);
  }
  assert.throws(() => createPost({ ...options, title: ' ' }, root), /标题/);
  assert.throws(() => createPost({ ...options, title: 'title\npermalink: /' }, root), /标题/);
  assert.equal(fs.existsSync(path.join(root, '_drafts')), false);
});

test('检测元数据保留的标识，而不仅检查文件名', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, '_posts/2026-01-01-other.md'), '---\nslug: hello-notes\n---\n');
  assert.throws(() => createPost(options, root), /已使用/);
});

test('baseurl 与目录名不匹配时提示，不写入文件', t => {
  const root = fixture(t, 'renamed-repo');
  assert.throws(() => createPost(options, root), /文件夹名/);
  assert.equal(fs.existsSync(path.join(root, '_drafts')), false);
  fs.writeFileSync(path.join(root, '_config.yml'), 'baseurl: ""\n');
  assert.equal(imageRoot(root), '..');
});

test('拒绝经过符号链接的写入目录', t => {
  const root = fixture(t);
  const outside = path.join(path.dirname(root), 'outside');
  fs.mkdirSync(outside);
  try {
    fs.symlinkSync(outside, path.join(root, '_drafts'), process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { t.skip('本机不允许创建符号链接'); return; }
    throw error;
  }
  assert.throws(() => createPost(options, root), /符号链接/);
  assert.deepEqual(fs.readdirSync(outside), []);
});

test('命令行拒绝未知／重复／缺值参数', () => {
  assert.deepEqual(parseArgs(['--title', '一篇笔记', '--id', 'note']), { title: '一篇笔记', id: 'note' });
  for (const args of [['--publish', 'yes'], ['--title'], ['--id', 'a', '--id', 'b'], ['id', 'a']]) assert.throws(() => parseArgs(args), /参数/);
});
