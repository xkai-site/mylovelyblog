(() => {
  'use strict';
  const search = document.getElementById('archive-search');
  const input = document.getElementById('archive-query');
  const results = document.getElementById('archive-results');
  const clear = document.getElementById('search-clear');
  const status = document.getElementById('search-status');
  const empty = document.getElementById('search-empty');
  if (!search || !input || !results || !clear || !status || !empty) return;

  const normalize = text => text.normalize('NFKC').toLocaleLowerCase().trim();
  // 只检索已渲染的公开文章元数据，不依赖网络，也不改写文章链接。
  const groups = [...results.querySelectorAll('.collection-group')].map(section => ({
    section,
    link: document.querySelector(`.topic-index a[href="#${section.id}"]`),
    entries: [...section.querySelectorAll('[data-search]')].map(element => ({
      element,
      text: normalize(element.dataset.search),
    })),
  }));

  function filter() {
    const terms = normalize(input.value).split(/\s+/).filter(Boolean);
    let total = 0;
    groups.forEach(group => {
      let count = 0;
      group.entries.forEach(entry => {
        const matches = terms.every(term => entry.text.includes(term));
        entry.element.hidden = !matches;
        if (matches) count++;
      });
      group.section.hidden = count === 0;
      if (group.link) group.link.hidden = count === 0;
      total += count;
    });
    clear.hidden = input.value.length === 0;
    empty.hidden = total > 0;
    status.textContent = terms.length ? `${total} 篇结果` : '';
  }

  input.addEventListener('input', filter);
  clear.addEventListener('click', () => {
    input.value = '';
    filter();
    input.focus();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      input.value = '';
      filter();
    }
  });
  window.addEventListener('pageshow', filter);
  search.hidden = false;
  filter();
})();
