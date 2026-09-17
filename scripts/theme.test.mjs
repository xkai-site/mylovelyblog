import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script = fs.readFileSync(new URL('../assets/js/theme.js', import.meta.url), 'utf8');
function setup({ dark = false, saved = null, blocked = false } = {}) {
  const events = {};
  const selectEvents = {};
  const select = { value: '', hidden: true, addEventListener: (name, fn) => { selectEvents[name] = fn; } };
  const media = { matches: dark, addEventListener: (name, fn) => { events.media = fn; } };
  const values = new Map(saved === null ? [] : [['lovely-blog-theme', saved]]);
  let ready = false;
  const document = {
    documentElement: { dataset: {} },
    getElementById: () => ready ? select : null,
    addEventListener: (name, fn) => { events[name] = fn; },
  };
  const localStorage = {
    getItem(key) { if (blocked) throw new Error('blocked'); return values.get(key) ?? null; },
    setItem(key, value) { if (blocked) throw new Error('blocked'); values.set(key, value); },
    removeItem(key) { if (blocked) throw new Error('blocked'); values.delete(key); },
  };
  const window = { matchMedia: () => media, addEventListener: (name, fn) => { events[name] = fn; } };
  vm.runInNewContext(script, { window, document, localStorage });
  return {
    document, select, media, values, events,
    ready() { ready = true; events.DOMContentLoaded(); },
    choose(value) { select.value = value; selectEvents.change(); },
    theme() { return document.documentElement.dataset.theme; },
  };
}

test('首次跟随系统并在 DOM 出现前设置主题', () => {
  const env = setup({ dark: true });
  assert.equal(env.theme(), 'dark');
  assert.equal(env.select.hidden, true);
  env.ready();
  assert.equal(env.select.hidden, false);
  assert.equal(env.select.value, 'system');
});

test('保存的手动选择覆盖系统，切换后可恢复', () => {
  const env = setup({ dark: true, saved: 'light' });
  assert.equal(env.theme(), 'light');
  env.ready();
  env.choose('dark');
  assert.equal(env.values.get('lovely-blog-theme'), 'dark');
  const refreshed = setup({ saved: env.values.get('lovely-blog-theme') });
  assert.equal(refreshed.theme(), 'dark');
});

test('跟随系统会清除覆盖值并响应系统变化', () => {
  const env = setup({ saved: 'dark' });
  env.ready();
  env.choose('system');
  assert.equal(env.theme(), 'light');
  assert.equal(env.values.has('lovely-blog-theme'), false);
  env.media.matches = true;
  env.events.media();
  assert.equal(env.theme(), 'dark');
});

test('手动模式不随系统改变', () => {
  const env = setup({ saved: 'light' });
  env.ready();
  env.media.matches = true;
  env.events.media();
  assert.equal(env.theme(), 'light');
});

test('禁止存储时仍可以在当前页面切换', () => {
  const env = setup({ dark: true, blocked: true });
  env.ready();
  env.choose('light');
  assert.equal(env.theme(), 'light');
});

test('无效存储值降级，跨标签页事件同步', () => {
  const env = setup({ saved: 'invalid' });
  env.ready();
  assert.equal(env.select.value, 'system');
  env.events.storage({ key: 'other', newValue: 'dark' });
  assert.equal(env.theme(), 'light');
  env.events.storage({ key: 'lovely-blog-theme', newValue: 'dark' });
  assert.equal(env.theme(), 'dark');
  env.events.storage({ key: null, newValue: null });
  assert.equal(env.theme(), 'light');
});

function luminance(hex) {
  const rgb = hex.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
test('两套色板的正文、次级文字、链接、行内代码达到 4.5:1', () => {
  const scss = fs.readFileSync(new URL('../assets/css/style.scss', import.meta.url), 'utf8');
  const palettes = [scss.match(/:root \{([\s\S]*?)\}/)[1], scss.match(/@mixin dark-palette \{([\s\S]*?)\}/)[1]];
  for (const palette of palettes) {
    const colors = Object.fromEntries([...palette.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map(match => [match[1], match[2]]));
    for (const foreground of ['text', 'muted', 'accent', 'code']) {
      for (const background of ['bg', 'surface']) {
        const values = [luminance(colors[foreground]), luminance(colors[background])].sort((a, b) => b - a);
        const ratio = (values[0] + .05) / (values[1] + .05);
        assert.ok(ratio >= 4.5, `${foreground} on ${background}: ${ratio.toFixed(2)}`);
      }
    }
  }
});
