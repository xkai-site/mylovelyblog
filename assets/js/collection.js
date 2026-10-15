(() => {
  'use strict';
  const collection = document.querySelector('[data-collection]');
  if (!collection) return;

  const index = collection.querySelector('.topic-index');
  const status = collection.querySelector('[data-collection-status]');
  if (!index) return;

  const groups = [...index.querySelectorAll('a[aria-controls]')].map(link => ({
    link,
    section: document.getElementById(link.getAttribute('aria-controls')),
  })).filter(group => group.section && collection.contains(group.section));
  if (!groups.length) return;

  let current;
  function select(group) {
    if (current === group) return;
    groups.forEach(item => {
      item.section.hidden = item !== group;
      if (item === group) item.link.setAttribute('aria-current', 'true');
      else item.link.removeAttribute('aria-current');
    });
    current = group;
    if (status) {
      const count = group.section.querySelectorAll('.post-list > li').length;
      status.textContent = `${group.link.textContent.trim()}，${count} 篇文章`;
    }
  }

  function syncFromHash() {
    const hash = window.location.hash.slice(1);
    let id = hash;
    // 现有链接的中文被编码两次，分组 ID 编码一次；空格保留为 +。
    try { id = decodeURIComponent(hash); } catch (_) { /* 忽略无效编码。 */ }
    const group = groups.find(item => item.section.id === hash || item.section.id === id);
    if (group) select(group);
    else if (!current || !hash) select(groups[0]);
  }

  index.addEventListener('click', event => {
    // 保留在新标签页打开等原生链接行为，键盘 Enter 与普通点击共用切换逻辑。
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a');
    const group = groups.find(item => item.link === link);
    if (!group) return;
    event.preventDefault();
    if (window.location.hash !== link.hash) history.pushState(null, '', link.hash);
    select(group);
    // 从长列表中途切换时，让新列表开头仍在视野内；首屏切换不滚动。
    if (collection.getBoundingClientRect().top < 0) collection.scrollIntoView({ block: 'start' });
  });

  collection.setAttribute('data-collection-ready', '');
  window.addEventListener('popstate', syncFromHash);
  window.addEventListener('hashchange', syncFromHash);
  window.addEventListener('pageshow', syncFromHash);
  syncFromHash();
})();
