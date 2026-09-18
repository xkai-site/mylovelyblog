(() => {
  'use strict';
  const key = 'lovely-blog-theme';
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => ['light', 'dark', 'system'].includes(value);
  let preference = 'system';
  try {
    const saved = localStorage.getItem(key);
    if (valid(saved)) preference = saved;
  } catch (_) { /* 隐私模式或禁用存储时，仍支持当前页面切换。 */ }

  function apply() {
    const theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-value]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeValue === preference));
    });
  }
  apply();

  const onSystemChange = () => { if (preference === 'system') apply(); };
  if (media.addEventListener) media.addEventListener('change', onSystemChange);
  else if (media.addListener) media.addListener(onSystemChange);

  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : 'system';
    apply();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const controls = document.getElementById('theme-controls');
    if (!controls) return;
    controls.querySelectorAll('[data-theme-value]').forEach(button => {
      button.addEventListener('click', () => {
        preference = valid(button.dataset.themeValue) ? button.dataset.themeValue : 'system';
        try {
          if (preference === 'system') localStorage.removeItem(key);
          else localStorage.setItem(key, preference);
        } catch (_) { /* 保留本次切换，不阻止阅读。 */ }
        apply();
      });
    });
    apply();
    controls.hidden = false;
  });
})();
