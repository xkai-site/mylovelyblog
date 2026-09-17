import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkSite, htmlInfo } from './check-site.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-site-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'tags'));
  fs.mkdirSync(path.join(root, 'assets/images'), { recursive: true });
  fs.writeFileSync(path.join(root, 'assets/images/中文 image.png'), 'fixture');
  return root;
}

test('解析转义属性、单引号及包含 > 的属性；忽略注释和脚本内容', () => {
  const info = htmlInfo('<a title="a > b" id="a&amp;b" href=\'#a%26b\'>ok</a><!-- <img src="bad"> --><script src="/s.js">const t = \'<img src="bad">\';</script>');
  assert.ok(info.ids.has('a&b'));
  assert.deepEqual(info.refs, ['#a%26b', '/s.js']);
});

test('项目子路径、中文空格图片及特殊标签锚点均可检查', t => {
  const root = fixture(t);
  // 与 Liquid cgi_escape 相同：ID 编码一次，href 再编码一次。
  const id = `tag-${encodeURIComponent('C++ / 中文 & tag').replace(/%20/g, '+')}`;
  fs.writeFileSync(path.join(root, 'tags/index.html'), `<h2 id="${id}">标签</h2>`);
  fs.writeFileSync(path.join(root, 'index.html'), `<a href="/mylovelyblog/tags/#${encodeURIComponent(id)}">标签</a><img src="/mylovelyblog/assets/images/中文%20image.png"><a href="https://example.com/missing">外部</a>`);
  assert.deepEqual(checkSite({ root }).errors, []);
});

test('检测缺失图片、锚点和项目子路径', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'index.html'), '<a href="#missing">x</a><img src="/mylovelyblog/no.png"><a href="/tags/">x</a>');
  const errors = checkSite({ root }).errors.join('\n');
  assert.match(errors, /锚点不存在/);
  assert.match(errors, /目标不存在/);
  assert.match(errors, /缺少站点子路径/);
});

test('检测重复 ID、磁盘路径和泄漏的开发目录', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'index.html'), '<p id="same"></p><p id="same"></p><img src="file:///C:/temp.png">');
  const errors = checkSite({ root }).errors.join('\n');
  assert.match(errors, /重复锚点/);
  assert.match(errors, /非网站 URL/);
  assert.match(errors, /不应发布开发文件/);
});

test('支持站点根目录部署与同源完整 URL', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'index.html'), '<a href="https://xkai-site.github.io/#intro">x</a><h1 id="intro">Intro</h1>');
  assert.deepEqual(checkSite({ root, baseurl: '' }).errors, []);
});

test('没有真实 HTML 时失败，而不是空检查通过', t => {
  const root = fixture(t);
  assert.throws(() => checkSite({ root }), /没有 HTML/);
  assert.throws(() => checkSite({ root: path.join(root, 'missing') }), /找不到构建目录/);
});
