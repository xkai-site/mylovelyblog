(() => {
  'use strict';
  const body = document.getElementById('post-body');
  if (!body) return;

  // 只增强独立图片，不拆散带正文的段落，也不修改图片 URL。
  body.querySelectorAll('img').forEach(image => {
    image.loading = 'lazy';
    image.decoding = 'async';
    const paragraph = image.closest('p');
    if (!paragraph || paragraph.querySelectorAll('img').length !== 1 || paragraph.textContent.trim()) return;
    if (paragraph.children.length !== 1) return;
    const onlyChild = paragraph.firstElementChild;
    if (onlyChild !== image && !(onlyChild.tagName === 'A' && onlyChild.children.length === 1)) return;
    const figure = document.createElement('figure');
    while (paragraph.firstChild) figure.appendChild(paragraph.firstChild);
    if (image.alt.trim()) {
      const caption = document.createElement('figcaption');
      caption.textContent = image.alt;
      figure.appendChild(caption);
    }
    paragraph.replaceWith(figure);
  });

  body.querySelectorAll('table').forEach((table, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', table.caption?.textContent.trim() || `表格 ${index + 1}，可横向滚动`);
    table.before(wrapper);
    wrapper.appendChild(table);
  });
  body.querySelectorAll('pre').forEach(pre => {
    pre.tabIndex = 0;
    pre.setAttribute('aria-label', '代码片段，可横向滚动');
  });

  const headings = [...body.querySelectorAll('h2, h3')];
  const toc = document.querySelector('.toc');
  const nav = document.getElementById('toc-links');
  const details = document.getElementById('toc-details');
  if (!toc || !nav || !details || !headings.length) return;
  const list = document.createElement('ol');
  const links = headings.map((heading, index) => {
    if (!heading.id) {
      let id = `section-${index + 1}`;
      while (document.getElementById(id)) id += '-section';
      heading.id = id;
    }
    const item = document.createElement('li');
    if (heading.tagName === 'H3') item.className = 'toc-sub';
    const link = document.createElement('a');
    link.href = `#${encodeURIComponent(heading.id)}`;
    link.textContent = heading.textContent;
    item.appendChild(link);
    list.appendChild(item);
    return link;
  });
  nav.appendChild(list);
  toc.hidden = false;

  const narrow = window.matchMedia('(max-width: 1000px)');
  const resizeToc = () => { details.open = !narrow.matches; };
  resizeToc();
  if (narrow.addEventListener) narrow.addEventListener('change', resizeToc);
  else if (narrow.addListener) narrow.addListener(resizeToc);

  let scheduled = false;
  let previous = -1;
  function updateCurrent() {
    scheduled = false;
    let active = 0;
    headings.forEach((heading, index) => {
      if (heading.getBoundingClientRect().top <= 140) active = index;
    });
    if (active === previous) return;
    if (previous >= 0) links[previous].removeAttribute('aria-current');
    links[active].setAttribute('aria-current', 'location');
    previous = active;
  }
  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateCurrent);
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate, { once: true });
  updateCurrent();
})();
