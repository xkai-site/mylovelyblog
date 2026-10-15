import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-publish-test-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, 'blog');
  const remote = path.join(temporary, 'remote.git');
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, '_posts'));
  fs.mkdirSync(path.join(root, 'empty-hooks'));
  fs.copyFileSync(path.join(sourceRoot, 'scripts/publish-articles.mjs'), path.join(root, 'scripts/publish-articles.mjs'));
  fs.writeFileSync(path.join(root, '_config.yml'), 'baseurl: "/mylovelyblog"\n');
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', shell: false });
    assert.equal(result.status, 0, result.error?.message || result.stderr);
    return result.stdout.trim();
  };
  git('init', '--initial-branch=main');
  git('config', 'user.name', 'Publish Test');
  git('config', 'user.email', 'publish-test@example.invalid');
  git('config', 'commit.gpgsign', 'false');
  git('config', 'push.gpgsign', 'false');
  git('config', 'core.hooksPath', path.join(root, 'empty-hooks'));
  git('init', '--bare', remote);
  git('remote', 'add', 'origin', remote); // Local disposable remote only; never GitHub.
  git('add', '_config.yml');
  git('commit', '-m', 'fixture baseline');
  const baseline = git('rev-parse', 'HEAD');
  const { publishArticles } = await import(pathToFileURL(path.join(root, 'scripts/publish-articles.mjs')).href);
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  };
  const article = '_posts/2026-01-01-fixture.md';
  const post = (body) => write(article, `---\ntitle: "测试文章"\n---\n${body}\n`);
  const unchanged = () => {
    assert.equal(git('rev-parse', 'HEAD'), baseline);
    assert.equal(git('diff', '--cached', '--name-only'), '');
  };
  return { root, remote, git, write, article, post, unchanged, publishArticles };
}

test('publishes the two historical articles with complete legacy image paths to a local remote', async (t) => {
  const f = await fixture(t);
  const articles = [
    '_posts/2026-04-07-第一性原理推导微服务组件.md',
    '_posts/2026-04-08-微服务项目快速入门.md',
  ];
  for (const file of articles) fs.copyFileSync(path.join(sourceRoot, file), path.join(f.root, file));
  for (const directory of ['第一性原理推导微服务组件', '微服务项目快速入门']) {
    const source = path.join(sourceRoot, 'assets/images', directory);
    const target = path.join(f.root, 'assets/images', directory);
    fs.mkdirSync(target, { recursive: true });
    for (const file of fs.readdirSync(source)) fs.copyFileSync(path.join(source, file), path.join(target, file));
  }
  const result = f.publishArticles(articles);
  const legacyImages = result.stagedPaths.filter((file) => file.includes('/Pasted image '));
  assert.equal(legacyImages.length, 10);
  assert.equal(result.stagedPaths.length, articles.length + 10);
  assert.equal(f.git('--git-dir', f.remote, 'rev-parse', 'refs/heads/main'), f.git('rev-parse', 'HEAD'));
  const committed = f.git('ls-tree', '-r', '-z', '--name-only', 'HEAD').split('\0');
  for (const file of result.stagedPaths) assert.ok(committed.includes(file), file);
  // Unreferenced images are not silently swept into the article commit.
  assert.equal(committed.filter((file) => file.startsWith('assets/images/')).length, 10);
});

test('handles literal/encoded spaces, angle brackets, titles and duplicate references', async (t) => {
  const f = await fixture(t);
  const image = 'assets/images/中文/Pasted image.png';
  f.write(image, 'image fixture');
  f.write('private-draft.txt', 'must not be committed');
  f.post([
    `![literal](/mylovelyblog/${image})`,
    `![encoded](/mylovelyblog/${encodeURI(image)})`,
    `![angle](</mylovelyblog/${image}>)`,
    `![double](/mylovelyblog/${image} "说明 (title)")`,
    `![single](/mylovelyblog/${image} '说明')`,
    `![parenthetical](/mylovelyblog/${image} (说明))`,
    `![root](/${image})`,
    `![relative](${image})`,
    '![external](https://example.invalid/a%20b.png "external")',
    '![inline](data:image/png;base64,AAAA)',
  ].join('\n'));
  const result = f.publishArticles([f.article, f.article]);
  assert.deepEqual(result.stagedPaths, [f.article, image]);
  assert.equal(result.commitMessage, '更新测试文章');
  assert.equal(f.git('status', '--short', '--', 'private-draft.txt'), '?? private-draft.txt');
});

test('works with an empty baseurl', async (t) => {
  const f = await fixture(t);
  f.write('_config.yml', 'baseurl: ""\n');
  f.write('assets/images/a b.png', 'image');
  f.post('![image](/assets/images/a b.png "title")');
  assert.deepEqual(f.publishArticles([f.article]).stagedPaths, [f.article, 'assets/images/a b.png']);
});

test('missing images with spaces fail before staging, committing or pushing', async (t) => {
  const f = await fixture(t);
  f.post('![missing](/mylovelyblog/assets/images/missing image.png)');
  assert.throws(() => f.publishArticles([f.article]), /图片不存在：assets\/images\/missing image\.png/);
  f.unchanged();
});

test('encoded traversal fails before Git mutation', async (t) => {
  const f = await fixture(t);
  f.post('![escape](/mylovelyblog/assets/%2e%2e/%2e%2e/outside.png)');
  assert.throws(() => f.publishArticles([f.article]), /路径必须位于博客仓库内/);
  f.unchanged();
});

test('non-main branches remain protected', async (t) => {
  const f = await fixture(t);
  f.git('checkout', '-b', 'feature');
  f.post('body');
  assert.throws(() => f.publishArticles([f.article]), /要求在 main 分支/);
  f.unchanged();
});

test('a nonempty index remains protected', async (t) => {
  const f = await fixture(t);
  f.write('unrelated.txt', 'unrelated');
  f.git('add', 'unrelated.txt');
  f.post('body');
  assert.throws(() => f.publishArticles([f.article]), /暂存区已有其他改动/);
  assert.equal(f.git('diff', '--cached', '--name-only'), 'unrelated.txt');
});

test('unchanged articles do not create a second commit or push', async (t) => {
  const f = await fixture(t);
  f.post('body');
  f.publishArticles([f.article]);
  const head = f.git('rev-parse', 'HEAD');
  assert.throws(() => f.publishArticles([f.article]), /没有新的 Git 改动/);
  assert.equal(f.git('rev-parse', 'HEAD'), head);
  assert.equal(f.git('--git-dir', f.remote, 'rev-parse', 'refs/heads/main'), head);
});
