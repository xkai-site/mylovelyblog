import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// 针对本站 Jekyll 输出的轻量静态检查，不是通用 HTML 验证器，不执行脚本或网络请求。
function decodeHtml(value) {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (all, code) => {
    if (!code.startsWith('#')) return named[code.toLowerCase()] ?? all;
    const number = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : all;
  });
}

export function htmlInfo(html) {
  const ids = new Set();
  const duplicates = [];
  const refs = [];
  const source = html.replace(/<!--[\s\S]*?-->/g, '').replace(/(<(?:script|style)\b[^>]*>)[\s\S]*?(<\/(?:script|style)>)/gi, '$1$2');
  const tags = /<([a-z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
  for (const tag of source.matchAll(tags)) {
    const attrs = /([^\s=/'"<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    for (const attr of tag[2].matchAll(attrs)) {
      const name = attr[1].toLowerCase();
      const value = decodeHtml(attr[2] ?? attr[3] ?? attr[4] ?? '');
      if (name === 'id' || (tag[1].toLowerCase() === 'a' && name === 'name')) {
        if (ids.has(value)) duplicates.push(value);
        ids.add(value);
      }
      if (['href', 'src', 'poster'].includes(name)) refs.push(value);
    }
  }
  return { ids, duplicates, refs };
}

function filesUnder(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`构建目录不应包含符号链接：${entry.name}`);
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(target));
    else if (entry.isFile()) files.push(target);
  }
  return files;
}

export function checkSite({ root = '_site', baseurl = '/mylovelyblog', origin = 'https://xkai-site.github.io' } = {}) {
  root = path.resolve(root);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error(`找不到构建目录 ${root}；请先获取真实 Jekyll 构建产物。本工具不执行构建。`);
  if (baseurl && !/^\/(?:[^/?#]+\/)*[^/?#]+$/.test(baseurl)) throw new Error('baseurl 应为空或以 / 开头且无尾部 /。');
  const siteOrigin = new URL(origin).origin;
  const allFiles = filesUnder(root);
  const htmlFiles = allFiles.filter(file => /\.html?$/i.test(file));
  if (!htmlFiles.length) throw new Error('构建目录没有 HTML，不能作为通过的验收。');
  const parsed = new Map(htmlFiles.map(file => [file, htmlInfo(fs.readFileSync(file, 'utf8'))]));
  const errors = [];
  let checked = 0;
  const prefix = baseurl || '';
  for (const [file, info] of parsed) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const pageUrl = `${siteOrigin}${prefix}/${relative.split('/').map(encodeURIComponent).join('/')}`;
    for (const duplicate of info.duplicates) errors.push(`${relative}: 重复锚点 ${duplicate}`);
    for (const value of info.refs) {
      if (!value || /^(?:mailto|tel|data|blob):/i.test(value)) continue;
      if (/^javascript:/i.test(value)) { errors.push(`${relative}: 不应使用 javascript: 链接`); continue; }
      let url;
      try { url = new URL(value, pageUrl); } catch (_) { errors.push(`${relative}: 无效 URL ${value}`); continue; }
      if (!['http:', 'https:'].includes(url.protocol)) { errors.push(`${relative}: 非网站 URL ${value}`); continue; }
      if (url.origin !== siteOrigin) continue;
      let pathname;
      let fragment;
      try { pathname = decodeURIComponent(url.pathname); fragment = decodeURIComponent(url.hash.slice(1)); }
      catch (_) { errors.push(`${relative}: URL 转义无效 ${value}`); continue; }
      if (prefix && pathname !== prefix && !pathname.startsWith(`${prefix}/`)) {
        errors.push(`${relative}: 缺少站点子路径 ${value}`);
        continue;
      }
      const inside = pathname.slice(prefix.length).replace(/^\/+/, '');
      let target = path.resolve(root, inside);
      const within = path.relative(root, target);
      if (within.startsWith(`..${path.sep}`) || within === '..' || path.isAbsolute(within)) {
        errors.push(`${relative}: 路径越界 ${value}`);
        continue;
      }
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      checked++;
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) errors.push(`${relative}: 目标不存在 ${value}`);
      else if (fragment && !fragment.startsWith(':~:text=') && parsed.has(target) && !parsed.get(target).ids.has(fragment)) {
        errors.push(`${relative}: 锚点不存在 ${value}`);
      }
    }
  }
  for (const name of ['docs', 'templates', 'scripts', '_drafts', 'PLAN.md', 'task_plan.md', 'findings.md', 'progress.md', 'README.md']) {
    if (fs.existsSync(path.join(root, name))) errors.push(`不应发布开发文件：${name}`);
  }
  return { pages: htmlFiles.length, checked, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    const options = {};
    if (args.includes('--help')) {
      console.log('node scripts/check-site.mjs [--site _site] [--baseurl /mylovelyblog] [--origin https://xkai-site.github.io]\n只检查已有 HTML，不构建、不访问网络。');
    } else {
      const keys = { '--site': 'root', '--baseurl': 'baseurl', '--origin': 'origin' };
      for (let i = 0; i < args.length; i += 2) {
        const key = keys[args[i]];
        if (!key || key in options || args[i + 1] === undefined) throw new Error('参数无效，使用 --help 查看用法。');
        options[key] = args[i + 1];
      }
      const result = checkSite(options);
      if (result.errors.length) {
        result.errors.forEach(error => console.error(error));
        process.exitCode = 1;
      } else console.log(`通过：${result.pages} 个 HTML 页面，${result.checked} 个内部链接／资源引用。未检查浏览器视觉或外部链接。`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
