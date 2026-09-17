import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDate } from './new-post.mjs';

// 项目约定检查，不解析完整 YAML/Liquid/Markdown，也不替代 Jekyll 构建。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const errors = [];
const config = read('_config.yml');
const baseurl = config.match(/^baseurl:\s*"([^"]*)"/m)?.[1];
if (baseurl === undefined) errors.push('未识别 baseurl；本检查器要求双引号字符串。');
if (/^remote_theme:/m.test(config)) errors.push('仍然依赖 remote_theme。');
if (!/^permalink: \/:year\/:month\/:day\/:title:output_ext$/m.test(config)) errors.push('文章 permalink 规则发生变化，请检查稳定性。');
for (const name of ['docs', 'templates', 'scripts', 'PLAN.md', 'task_plan.md', 'findings.md', 'progress.md']) {
  if (!config.split(/\r?\n/).some(line => line.trim() === `- ${name}`)) errors.push(`缺少构建排除项：${name}`);
}
if (/^(?:show_drafts|future):\s*true\s*$/m.test(config)) errors.push('生产配置不应自动展示草稿／未来文章。');

let posts = 0;
let images = 0;
for (const name of fs.readdirSync(path.join(root, '_posts')).filter(name => name.endsWith('.md'))) {
  const source = read(`_posts/${name}`);
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) { errors.push(`${name}: 缺少元数据`); continue; }
  if (!/^title:\s*\S.*$/m.test(frontmatter[1])) errors.push(`${name}: 标题为空`);
  const date = frontmatter[1].match(/^date:\s*([\d-]+)\s*$/m)?.[1];
  try { validateDate(date ?? ''); } catch (error) { errors.push(`${name}: ${error.message}`); }
  if (date && !name.startsWith(`${date}-`)) errors.push(`${name}: 文件名日期与 date 不一致`);
  for (const image of source.slice(frontmatter[0].length).matchAll(/!\[[^\]]*\]\(([^\r\n]+?)\)/g)) {
    const url = image[1].trim().replace(/^<(.+)>$/, '$1').replace(/\s+["'][^"']*["']$/, '');
    if (/^https?:\/\//i.test(url)) continue;
    if (!url.startsWith(`${baseurl}/assets/images/`)) { errors.push(`${name}: 图片应使用站点根路径 ${url}`); continue; }
    let decoded;
    try { decoded = decodeURIComponent(url); } catch (_) { errors.push(`${name}: 图片转义无效 ${url}`); continue; }
    const target = path.resolve(root, '.' + decoded.slice(baseurl.length));
    const relative = path.relative(path.join(root, 'assets/images'), target);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(target)) errors.push(`${name}: 图片不存在或路径越界 ${url}`);
    const preview = path.resolve(root, '_posts', '../..', '.' + decoded);
    if (baseurl && preview !== target) errors.push(`${name}: Typora 根路径与站点路径不一致`);
    images++;
  }
  posts++;
}

const templates = ['index.html', 'archive.html', 'categories.html', 'tags.html'];
for (const folder of ['_layouts', '_includes']) {
  templates.push(...fs.readdirSync(path.join(root, folder)).filter(name => name.endsWith('.html')).map(name => `${folder}/${name}`));
}
const blocks = new Set(['if', 'unless', 'for', 'case', 'capture', 'comment', 'raw', 'tablerow']);
for (const file of templates) {
  const source = read(file);
  const stack = [];
  for (const match of source.matchAll(/{%-?\s*(\w+)([\s\S]*?)-?%}/g)) {
    const name = match[1];
    if (['comment', 'raw'].includes(stack.at(-1)) && name !== `end${stack.at(-1)}`) continue;
    if (blocks.has(name)) stack.push(name);
    else if (name.startsWith('end') && blocks.has(name.slice(3))) {
      if (stack.pop() !== name.slice(3)) errors.push(`${file}: Liquid 块不匹配 ${name}`);
    } else if (name === 'include') {
      const include = match[2].trim().split(/\s+/)[0];
      if (!fs.existsSync(path.join(root, '_includes', include))) errors.push(`${file}: include 不存在 ${include}`);
    }
  }
  if (stack.length) errors.push(`${file}: 未关闭的 Liquid 块 ${stack.join(', ')}`);
  for (const match of source.matchAll(/['"](\/assets\/[^'"]+)['"]\s*\|\s*relative_url/g)) {
    const asset = match[1].endsWith('.css') ? match[1].replace(/\.css$/, '.scss') : match[1];
    if (!fs.existsSync(path.join(root, '.' + asset))) errors.push(`${file}: 缺少资源 ${asset}`);
  }
}
const scss = read('assets/css/style.scss').replace(/\/\*[\s\S]*?\*\//g, '').replace(/"[^"]*"|'[^']*'/g, '');
let braces = 0;
for (const char of scss) { if (char === '{') braces++; if (char === '}') braces--; if (braces < 0) break; }
if (braces !== 0) errors.push('SCSS 花括号不配对。');
if (!/^---\r?\n---\r?\n/.test(read('assets/css/style.scss'))) errors.push('SCSS 缺少 Jekyll front matter。');
if (errors.length) {
  errors.forEach(error => console.error(error));
  process.exitCode = 1;
} else console.log(`通过：${posts} 篇文章、${images} 处本地 Markdown 图片、${templates.length} 个 Liquid 模板的约定检查。未执行 YAML/Liquid/Sass 编译或浏览器验收。`);
