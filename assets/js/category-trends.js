(() => {
  'use strict';
  const charts = [...document.querySelectorAll('[data-category-trend]')];
  if (!charts.length) return;

  const namespace = 'http://www.w3.org/2000/svg';
  const tooltip = document.createElement('div');
  tooltip.id = 'category-trend-tooltip';
  tooltip.className = 'category-trend-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.append(tooltip);
  let active;
  let renderedMonth;

  function svgElement(name, attributes) {
    const element = document.createElementNS(namespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  // 使用年月整数避免月底溢出、闰年和日期字符串的 UTC 时区偏移。
  function recentMonths(now) {
    const end = now.getFullYear() * 12 + now.getMonth();
    return Array.from({ length: 12 }, (_, index) => {
      const month = end - 11 + index;
      return `${Math.floor(month / 12)}-${String(month % 12 + 1).padStart(2, '0')}`;
    });
  }

  function hideTooltip() {
    if (active) {
      active.point.setAttribute('visibility', 'hidden');
      active.chart.removeAttribute('aria-describedby');
    }
    active = undefined;
    tooltip.hidden = true;
  }

  function showMonth(state, index) {
    if (active && active !== state) hideTooltip();
    active = state;
    state.index = index;
    const point = state.points[index];
    state.point.setAttribute('cx', point.x);
    state.point.setAttribute('cy', point.y);
    state.point.setAttribute('visibility', 'visible');
    tooltip.textContent = `${state.months[index]} · ${state.counts[index]} 篇`;
    tooltip.hidden = false;
    state.chart.setAttribute('aria-describedby', tooltip.id);

    // 提示放在 body 下，避免桌面分类索引的 overflow-y 裁剪它。
    const rect = state.chart.getBoundingClientRect();
    const box = tooltip.getBoundingClientRect();
    const x = rect.left + point.x / 112 * rect.width;
    const left = Math.max(8, Math.min(x - box.width / 2, window.innerWidth - box.width - 8));
    const top = rect.top >= box.height + 8 ? rect.top - box.height - 6 : rect.bottom + 6;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function showPointerMonth(state, event) {
    const rect = state.chart.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 112;
    const index = Math.max(0, Math.min(11, Math.round((x - 4) / 104 * 11)));
    showMonth(state, index);
  }

  const states = charts.flatMap(chart => {
    let monthCounts;
    try { monthCounts = JSON.parse(chart.dataset.monthCounts); } catch (_) { return []; }
    const svg = svgElement('svg', { viewBox: '0 0 112 32', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const path = svgElement('path', { class: 'category-trend-line', 'vector-effect': 'non-scaling-stroke' });
    const point = svgElement('circle', { class: 'category-trend-point', r: 2.5, visibility: 'hidden' });
    svg.append(path, point);
    chart.append(svg);
    chart.setAttribute('role', 'img');
    chart.setAttribute('tabindex', '0');
    chart.parentElement.classList.add('category-trend-link');
    const state = { chart, monthCounts, path, point, index: 11 };

    chart.addEventListener('pointermove', event => showPointerMonth(state, event));
    chart.addEventListener('pointerleave', hideTooltip);
    chart.addEventListener('focus', () => showMonth(state, state.index));
    chart.addEventListener('blur', hideTooltip);
    chart.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        hideTooltip();
        event.preventDefault();
      } else if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? 11 :
          Math.max(0, Math.min(11, state.index + (event.key === 'ArrowLeft' ? -1 : 1)));
        showMonth(state, index);
      }
    });
    // 触屏点图查看月份，点分类名称仍沿用原来的导航／面板切换。
    let touch = false;
    chart.addEventListener('pointerdown', event => {
      touch = event.pointerType === 'touch' || event.pointerType === 'pen';
      if (touch) showPointerMonth(state, event);
    });
    chart.addEventListener('pointercancel', () => { touch = false; });
    chart.addEventListener('click', event => {
      if (!touch || event.detail === 0) return;
      event.preventDefault();
      event.stopPropagation();
      showPointerMonth(state, event);
      touch = false;
    });
    return [state];
  });

  function refresh() {
    const months = recentMonths(new Date());
    if (renderedMonth === months[11]) return;
    renderedMonth = months[11];
    hideTooltip();
    states.forEach(state => {
      const counts = months.map(month => state.monthCounts[month] || 0);
      const max = Math.max(1, ...counts);
      const points = counts.map((count, index) => ({ x: 4 + index * 104 / 11, y: 28 - count / max * 24 }));
      // 水平切线的三次贝塞尔：平滑且不在两个计数间过冲（不会画出负值）。
      const segments = points.slice(1).map((point, index) => {
        const previous = points[index];
        const middle = (previous.x + point.x) / 2;
        return `C${middle},${previous.y} ${middle},${point.y} ${point.x},${point.y}`;
      });
      state.path.setAttribute('d', `M${points[0].x},${points[0].y} ${segments.join(' ')}`);
      state.chart.setAttribute('aria-label', `${state.chart.dataset.categoryName}，最近 12 个月发布趋势：${months.map((month, index) => `${month} ${counts[index]} 篇`).join('；')}。左右方向键查看月份`);
      Object.assign(state, { months, counts, points });
      state.chart.hidden = false;
    });
  }

  document.addEventListener('pointerdown', event => {
    if (active && !active.chart.contains(event.target)) hideTooltip();
  });
  window.addEventListener('scroll', hideTooltip, true);
  window.addEventListener('resize', hideTooltip);
  window.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
  refresh();
})();
