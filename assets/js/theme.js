(() => {
  'use strict';
  const key = 'lovely-blog-theme';
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const isTheme = value => value === 'light' || value === 'dark';

  // null 表示访客还没手动选择过：进入网站时跟随系统，系统外观变化也继续跟随。
  let preference = null;
  try {
    const saved = localStorage.getItem(key);
    if (isTheme(saved)) preference = saved;
  } catch (_) { /* 隐私模式或禁用存储时，按系统配色打开；本次会话内仍可切换。 */ }

  const current = () => preference || (media.matches ? 'dark' : 'light');

  function apply() {
    const theme = current();
    document.documentElement.dataset.theme = theme;
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const target = theme === 'dark' ? '浅色' : '深色';
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute('aria-label', `切换到${target}模式`);
    button.title = `切换到${target}模式`;
  }
  apply();

  const onSystemChange = () => { if (!preference) apply(); };
  if (media.addEventListener) media.addEventListener('change', onSystemChange);
  else if (media.addListener) media.addListener(onSystemChange);

  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = isTheme(event.newValue) ? event.newValue : null;
    apply();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const controls = document.getElementById('theme-controls');
    const button = document.getElementById('theme-toggle');
    if (!controls || !button) return;
    button.addEventListener('click', () => {
      preference = current() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(key, preference);
      } catch (_) { /* 保留本次切换，不阻止阅读。 */ }
      apply();
    });
    apply();
    controls.hidden = false;
  });
})();
