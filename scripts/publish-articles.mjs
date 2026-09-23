import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runGit(args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', shell: false });
  if (result.error) throw result.error;
  if (!allowFailure && result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `git ${args.join(' ')} failed`).trim());
  }
  return result;
}

function repoPath(input) {
  const absolute = path.resolve(root, input);
  const relative = path.relative(root, absolute);
  if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`路径必须位于博客仓库内：${input}`);
  }
  return relative.split(path.sep).join('/');
}

function getTitle(file) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  const title = frontmatter?.match(/^title:\s*(.*?)\s*$/m)?.[1];
  if (!title) return path.basename(file).replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/i, '');
  return title.replace(/^("([\s\S]*)"|'([\s\S]*)')$/, (_, _quoted, double, single) => double ?? single);
}

function relatedImages(file) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  const config = fs.readFileSync(path.join(root, '_config.yml'), 'utf8');
  const baseurl = config.match(/^baseurl:\s*["']?([^"'\s#]*)/m)?.[1]?.replace(/\/$/, '') ?? '';
  const paths = [];
  for (const match of content.matchAll(/!\[[^\]]*\]\(<?([^\s)>]+)>?(?:\s+[^)]*)?\)/g)) {
    let url = match[1];
    if (/^(?:https?:|data:|#)/i.test(url)) continue;
    try { url = decodeURIComponent(url); } catch { /* Keep the original path. */ }
    if (baseurl && url.startsWith(`${baseurl}/`)) url = url.slice(baseurl.length + 1);
    else url = url.replace(/^\//, '');
    if (!url.startsWith('assets/')) continue;
    const imagePath = repoPath(url);
    if (!fs.existsSync(path.join(root, imagePath)) || !fs.statSync(path.join(root, imagePath)).isFile()) {
      throw new Error(`文章引用的图片不存在：${imagePath}（文章：${file}）`);
    }
    paths.push(imagePath);
  }
  return paths;
}

export function publishArticles(inputs) {
  if (!inputs.length) throw new Error('请至少提供一个 _posts/ 下的 Markdown 文章路径。');
  const branch = runGit(['branch', '--show-current']).stdout.trim();
  if (branch !== 'main') throw new Error(`当前分支为 ${branch || '(未知)'}，要求在 main 分支发布；未执行提交或推送。`);
  if (runGit(['diff', '--cached', '--quiet'], { allowFailure: true }).status !== 0) {
    throw new Error('暂存区已有其他改动。请先提交或取消暂存，再运行；避免把无关文件带入文章提交。');
  }

  const articles = [...new Set(inputs.map(repoPath))];
  for (const file of articles) {
    if (!file.startsWith('_posts/') || !file.toLowerCase().endsWith('.md')) {
      throw new Error(`只接受 _posts/ 下的 Markdown 文件：${file}`);
    }
    if (!fs.existsSync(path.join(root, file)) || !fs.statSync(path.join(root, file)).isFile()) {
      throw new Error(`文章文件不存在：${file}`);
    }
  }
  const stagedPaths = [...new Set([...articles, ...articles.flatMap(relatedImages)])];
  const titles = articles.map(getTitle);
  const commitMessage = `更新${titles.join('、')}`;

  runGit(['add', '--', ...stagedPaths]);
  if (runGit(['diff', '--cached', '--quiet'], { allowFailure: true }).status === 0) {
    throw new Error('所选文章和配图没有新的 Git 改动；未创建提交。');
  }
  runGit(['commit', '-m', commitMessage]);
  runGit(['push', 'origin', 'main']);
  return { articles, stagedPaths, commitMessage };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.includes('--help') || process.argv.length < 3) {
      console.log('用法：node scripts/publish-articles.mjs _posts/日期-文章.md [更多文章路径...]\n仅暂存指定文章与其 assets/ 图片，提交“更新[文章标题]”，然后推送 origin main。要求当前分支为 main，且暂存区为空。');
      process.exitCode = process.argv.includes('--help') ? 0 : 2;
    } else {
      const result = publishArticles(process.argv.slice(2));
      console.log(`已推送：${result.commitMessage}\n文件：${result.stagedPaths.join(', ')}`);
    }
  } catch (error) {
    console.error(`发布失败：${error.message}`);
    process.exitCode = 1;
  }
}
