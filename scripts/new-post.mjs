import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function today() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
}

export function validateDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('日期必须是 YYYY-MM-DD。');
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || Number(value.slice(0, 4)) < 1900) {
    throw new Error('日期无效，请使用 1900 年以后的真实日期。');
  }
  return value;
}

function text(value, label, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max || /[\x00-\x1f\x7f]/.test(value)) {
    throw new Error(`${label}不能为空、过长或包含换行／控制字符。`);
  }
  return value.trim();
}

// 所有写入路径均从固定目录与受限标识组成；拒绝经过符号链接或 junction。
function safePath(root, relative) {
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`拒绝符号链接路径：${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return current;
}

export function imageRoot(root) {
  const config = fs.readFileSync(path.join(root, '_config.yml'), 'utf8');
  const match = config.match(/^baseurl:\s*(?:"([^"]*)"|'([^']*)'|([^\s#]*))\s*(?:#.*)?$/m);
  if (!match) throw new Error('_config.yml 需要一个简单的 baseurl 字符串。');
  const baseurl = match[1] ?? match[2] ?? match[3];
  if (!baseurl) return '..';
  if (!/^\/[a-zA-Z0-9_-]+$/.test(baseurl) || path.basename(root) !== baseurl.slice(1)) {
    throw new Error('图片路径要求仓库文件夹名与单层 baseurl 一致（当前应为 mylovelyblog）；请先核对 docs/writing.md。');
  }
  return '../..';
}

export function createPost(options, root = defaultRoot) {
  root = fs.realpathSync(root);
  const title = text(options.title, '标题');
  const id = text(options.id, '标识', 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(id)) {
    throw new Error('标识只能使用小写英文字母、数字和单个连接符，不得使用 Windows 保留名称。');
  }
  const date = validateDate(options.date ?? today());
  const category = text(options.category ?? '随想', '分类', 50);
  const rawTags = options.tags ?? '';
  if (typeof rawTags !== 'string') throw new Error('标签请用逗号分隔的字符串。');
  const tags = [...new Set(rawTags.split(/[,，]/).filter(tag => tag.trim()).map(tag => text(tag, '标签', 50)))];
  const rootUrl = imageRoot(root);
  for (const folder of ['_posts', '_drafts']) {
    const directory = safePath(root, folder);
    if (!fs.existsSync(directory)) continue;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const name = entry.name.toLowerCase();
      if (name === `${id}.md` || name.endsWith(`-${id}.md`)) throw new Error(`标识已使用：${entry.name}`);
      const frontmatter = fs.readFileSync(path.join(directory, entry.name), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? '';
      if (new RegExp(`^(?:image_id|slug):\\s*["']?${id}["']?\\s*$`, 'mi').test(frontmatter)) throw new Error(`标识已使用：${entry.name}`);
    }
  }
  const images = safePath(root, `assets/images/${id}`);
  const draft = safePath(root, `_drafts/${id}.md`);
  if (fs.existsSync(images) || fs.existsSync(draft)) throw new Error('草稿或图片目录已存在；不会覆盖。');
  const template = fs.readFileSync(path.join(root, 'templates/post.md'), 'utf8');
  const values = {
    __TITLE_JSON__: JSON.stringify(title), __DATE__: date,
    __CATEGORY_JSON__: JSON.stringify(category), __TAGS_JSON__: JSON.stringify(tags),
    __ID__: id, __ROOT_URL__: rootUrl,
  };
  const content = template.replace(/__[A-Z_]+__/g, token => {
    if (!(token in values)) throw new Error(`未知模板占位符：${token}`);
    return values[token];
  });
  fs.mkdirSync(safePath(root, '_drafts'), { recursive: true });
  fs.mkdirSync(safePath(root, 'assets/images'), { recursive: true });
  fs.mkdirSync(images); // 独占资源标识，失败时不覆盖其他目录。
  try {
    fs.writeFileSync(path.join(images, '.gitkeep'), '', { flag: 'wx' });
    fs.writeFileSync(draft, content, { flag: 'wx' });
  } catch (error) {
    // 仅清理本次创建的空目录，不删除用户已有文件。
    try { fs.unlinkSync(path.join(images, '.gitkeep')); fs.rmdirSync(images); } catch (_) { /* 目录有新内容时保留。 */ }
    throw error;
  }
  return { draft, images, publishName: `${date}-${id}.md` };
}

export function parseArgs(args) {
  const allowed = new Set(['title', 'id', 'date', 'category', 'tags']);
  const result = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]?.replace(/^--/, '');
    if (!args[index]?.startsWith('--') || !allowed.has(key) || key in result || args[index + 1] === undefined || args[index + 1].startsWith('--')) {
      throw new Error('参数无效。使用 --title "标题" --id stable-id [--date YYYY-MM-DD] [--category 技术] [--tags "AI,Agent"]。');
    }
    result[key] = args[index + 1];
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.includes('--help')) {
      console.log('node scripts/new-post.mjs --title "标题" --id stable-id [--date YYYY-MM-DD] [--category 技术] [--tags "AI,Agent"]\n只生成草稿，不提交、不发布。详见 docs/writing.md。');
    } else {
      const result = createPost(parseArgs(process.argv.slice(2)));
      console.log(`草稿：${result.draft}\n图片：${result.images}\n发布时移至 _posts/${result.publishName}（先核对日期）。\n私密草稿请勿提交到公开仓库。`);
    }
  } catch (error) {
    console.error(`未创建文章：${error.message}`);
    process.exitCode = 1;
  }
}
