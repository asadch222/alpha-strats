/* The phone "app shell". It adds a bottom tab bar, a slide-up More sheet, full-screen search,
   swipe dots under card rows and gentle reveal animations. All of it is styled by mobile.css,
   which only loads on small screens, so the desktop site is unchanged. */
(function () {
  const page = document.body.dataset.page || '';
  const ico = (d, extra = '') => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${extra}<path d="${d}"/></svg>`;
  const I = {
    home: ico('M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'),
    markets: ico('M5 20v-9M12 20V4M19 20v-6'),
    chart: ico('M3 17l5-6 4 3 6-8 3 3'),
    scan: ico('m20 20-3.600-3.600', '<circle cx="10.500" cy="10.500" r="6.500"/>'),
    more: ico('M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'),
    crown: ico('M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5z'),
    pulse: ico('M2 12h4l3-8 4 16 3-8h6'),
    heat: ico('M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z'),
    mood: ico('M4 17a8 8 0 1 1 16 0M12 17l4-6'),
    blog: ico('M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7'),
    learn: ico('M2 9l10-5 10 5-10 5zM6 11.500V16c2 2 10 2 12 0v-4.500'),
    user: ico('M4 21c0-4 4-6 8-6s8 2 8 6', '<circle cx="12" cy="8" r="4"/>'),
    tag: ico('M3 12V4h8l10 10-8 8z', '<circle cx="7.500" cy="7.500" r="1.300"/>'),
    search: ico('m20 20-3.600-3.600', '<circle cx="10.500" cy="10.500" r="6.500"/>'),
  };
  const TABS = [['home', 'index.html', 'Home', I.home], ['markets', 'markets.html', 'Markets', I.markets], ['chart', 'chart.html', 'Charts', I.chart], ['tools', 'tools.html', 'Scanner', I.scan]];
  const MORE = [['premium', 'premium.html', 'Premium', I.crown, 'gold'], ['trades', 'index.html#trades', 'Live trades', I.pulse], ['heatmaps', 'heatmaps.html', 'Heatmaps', I.heat], ['sentiment', 'sentiment.html', 'Sentiment', I.mood],
    ['blog', 'blog.html', 'Blog', I.blog], ['learn', 'learn.html', 'Learn', I.learn], ['plans', 'index.html#pricing', 'Plans', I.tag], ['members', 'login.html', 'Account', I.user]];
  const inTabs = TABS.some((t) => t[0] === page);

  /* ---------- bottom tab bar and More sheet ---------- */
  document.body.insertAdjacentHTML('beforeend', `
    <nav class="tabbar" aria-label="Main">
      ${TABS.map(([id, href, label, svg]) => `<a href="${href}" class="${id === page ? 'is-here' : ''}">${svg}<span>${label}</span></a>`).join('')}
      <button type="button" id="tabMore" class="${inTabs ? '' : 'is-here'}" aria-haspopup="dialog">${I.more}<span>More</span></button>
    </nav>
    <div class="sheet-back" id="sheetBack"></div>
    <div class="sheet" id="sheet" role="dialog" aria-label="More pages" aria-hidden="true">
      <i class="sheet-grip"></i>
      <h3>More</h3>
      <div class="sheet-grid">${MORE.map(([id, href, label, svg, tone]) => `<a href="${href}" class="${tone || ''} ${id === page ? 'is-here' : ''}" data-more="${id}"><i>${svg}</i><span>${label}</span></a>`).join('')}</div>
      <p class="sheet-tip">Tip: add AlphaStrats to your home screen from your browser's Share or menu button to open it like an app.</p>
    </div>`);
  const sheet = document.getElementById('sheet'), back = document.getElementById('sheetBack');
  const openSheet = (on) => {
    document.body.classList.toggle('sheet-open', on); sheet.setAttribute('aria-hidden', on ? 'false' : 'true'); sheet.style.transform = '';
    if (on) { const acct = document.getElementById('acctBtn'), tile = sheet.querySelector('[data-more="members"]'); if (acct && tile) { tile.href = acct.getAttribute('href'); tile.querySelector('span').textContent = acct.classList.contains('is-in') ? 'My account' : 'Log in'; } }
  };
  document.getElementById('tabMore').addEventListener('click', () => openSheet(!document.body.classList.contains('sheet-open')));
  back.addEventListener('click', () => openSheet(false));
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) openSheet(false); });
  let y0 = null, dy = 0; // drag the sheet down to close it
  sheet.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; dy = 0; sheet.style.transition = 'none'; }, { passive: true });
  sheet.addEventListener('touchmove', (e) => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sheet.style.transform = `translateY(${dy}px)`; }, { passive: true });
  sheet.addEventListener('touchend', () => { sheet.style.transition = ''; if (dy > 80) openSheet(false); else sheet.style.transform = ''; y0 = null; });

  /* ---------- full-screen search ---------- */
  const search = document.getElementById('search'), right = document.querySelector('.nav-right');
  if (search && right) {
    right.insertAdjacentHTML('afterbegin', `<button type="button" class="m-ico" id="mSearch" aria-label="Search markets">${I.search}</button>`);
    search.insertAdjacentHTML('beforeend', '<button type="button" class="m-cancel" id="mCancel">Cancel</button><p class="m-hint">Type a coin or stock, for example <b>BTC</b>, <b>Nvidia</b> or <b>Gold</b>.</p>');
    const q = document.getElementById('q');
    const close = () => { document.body.classList.remove('search-open'); q.value = ''; q.dispatchEvent(new Event('input')); q.blur(); };
    document.getElementById('mSearch').addEventListener('click', () => { document.body.classList.add('search-open'); q.focus(); });
    document.getElementById('mCancel').addEventListener('click', close);
    document.getElementById('qResults').addEventListener('click', () => setTimeout(() => document.body.classList.remove('search-open'), 60));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  const phone = window.matchMedia('(max-width: 760px)');
  if (!phone.matches) return; // everything below is only worth doing on a phone

  /* ---------- top bar hides while scrolling down, returns when scrolling up ---------- */
  let last = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    document.body.classList.toggle('nav-away', y > 160 && y > last && !document.body.classList.contains('search-open'));
    document.body.classList.toggle('scrolled', y > 8);
    last = y;
  }, { passive: true });

  /* ---------- swipe dots under card rows ---------- */
  const ROWS = '#flow, #mbot, .pcards, .plans, #ltGrid, .dash, #oppCards';
  function dots(row) {
    const n = [...row.children].filter((c) => c.offsetWidth > 40 && getComputedStyle(c).position !== 'absolute').length;
    let bar = row.nextElementSibling && row.nextElementSibling.classList.contains('swipe-dots') ? row.nextElementSibling : null;
    if (n < 2 || row.scrollWidth <= row.clientWidth + 8) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.className = 'swipe-dots'; row.after(bar); }
    if (bar.children.length !== n) bar.innerHTML = '<i></i>'.repeat(n);
    const at = Math.round((row.scrollLeft / (row.scrollWidth - row.clientWidth)) * (n - 1));
    [...bar.children].forEach((d, i) => d.classList.toggle('on', i === at));
  }
  function wireRows() {
    document.querySelectorAll(ROWS).forEach((row) => {
      if (!row._dots) { row._dots = true; row.addEventListener('scroll', () => dots(row), { passive: true }); new MutationObserver(() => dots(row)).observe(row, { childList: true }); }
      dots(row);
    });
  }

  /* ---------- sections glide in as they come into view ---------- */
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = 'IntersectionObserver' in window && !still ? new IntersectionObserver((list) => {
    list.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 }) : null;
  function reveal() {
    if (!io) return;
    document.querySelectorAll('main > section > *, main > article > *, .post-body > *').forEach((el, i) => {
      if (el._rv || el.tagName === 'SCRIPT' || el.hidden) return;
      el._rv = true; el.classList.add('rv'); el.style.setProperty('--rv', Math.min(i % 6, 4) * 60 + 'ms'); io.observe(el);
    });
  }
  document.addEventListener('DOMContentLoaded', () => { reveal(); wireRows(); setTimeout(wireRows, 2500); setTimeout(() => { reveal(); wireRows(); }, 6000); });
  window.addEventListener('site:change', () => setTimeout(wireRows, 300));
})();
