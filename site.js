/* What the admin portal controls, read by every page.
   One small document holds it all: which pages and sections are hidden, the announcement bar,
   a few editable texts, and the trades posted by the admin.
   - LIVE (login service connected in config.js): the document is stored online, so every visitor sees it.
   - PREVIEW (nothing connected): it is stored in this browser only. */
const Site = (() => {
  const KEY = 'as.site';
  const PAGES = [['premium', 'Premium'], ['markets', 'Markets'], ['heatmaps', 'Heatmaps'], ['chart', 'Charts and market pages'], ['tools', 'Scanner and tools'], ['sentiment', 'Sentiment'], ['blog', 'Blog'], ['learn', 'Learn'], ['members', 'Members area']];
  // key, where it is, what it is, how to find it on the page. The part of the key before the dot is the page it lives on.
  const SECTIONS = [
    ['home.hero', 'Home page', 'Top banner with the strategy flow', 'main > .hero'],
    ['home.engine', 'Home page', 'Live decision engine', '#engine'],
    ['home.trades', 'Home page', 'Live trades', '#trades'],
    ['home.premium', 'Home page', 'Premium strategies', '#premium'],
    ['home.explore', 'Home page', 'Every market in one place', '#explore'],
    ['home.overview', 'Home page', 'Market overview', '#overview'],
    ['home.pages', 'Home page', 'Tool cards', '#pages'],
    ['home.pricing', 'Home page', 'Plans and prices', '#pricing'],
    ['tools.scanner', 'Scanner page', 'Opportunity scanner', '#scanner'],
    ['tools.compare', 'Scanner page', 'Compare two markets', '#compare'],
    ['tools.backtest', 'Scanner page', 'Backtest lab', '#backtest'],
    ['sentiment.funding', 'Sentiment page', 'Funding and open interest', '#funding'],
    ['all.tape', 'Every page', 'Moving price strip under the menu', '.tape'],
    ['all.feed', 'Every page', '"Live" indicator in the menu', '#feedPill'],
    ['all.cta', 'Every page', '"Get strategies" button in the menu', '.nav-right .btn-primary'],
  ];
  const blank = () => ({ hide: [], announce: { on: false, text: '', link: '' }, text: {}, trades: [], v: 0 });
  const page = () => (document.body && document.body.dataset.page) || '';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cfg = () => window.AS_CONFIG || {};
  const live = () => !!(cfg().supabaseUrl && cfg().supabaseKey);

  let state = blank();
  try { state = { ...blank(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch (e) { /* first visit */ }
  const hidden = (key) => state.hide.includes(key);

  /* ---------- putting the settings on the page ---------- */
  const css = document.createElement('style'); document.head.appendChild(css);
  function linkSel(p) { return p === 'blog' ? 'a[href^="blog.html"], a[href^="blog-"]' : `a[href^="${p}.html"]`; }
  function applyCss() { // hides things before they are drawn, so nothing flashes
    const here = page(), rules = [];
    SECTIONS.forEach(([key, , , sel]) => { const scope = key.split('.')[0]; if (hidden(key) && (scope === 'all' || scope === here)) rules.push(sel); });
    PAGES.forEach(([p]) => { if (hidden('page.' + p)) rules.push(...linkSel(p).split(', ').map((s) => `${s}:not([data-keep])`)); });
    css.textContent = rules.length ? rules.join(',') + '{display:none!important}' : '';
  }
  let admin = false;
  function applyDom() {
    const here = page(), main = document.querySelector('main');
    // a hidden page: visitors get a short notice, the admin still sees it with a reminder
    const off = hidden('page.' + here) && here !== 'admin' && here !== 'login';
    let note = document.getElementById('siteOff');
    if (main) main.hidden = off && !admin;
    if (off && !note && main) { note = document.createElement('div'); note.id = 'siteOff'; main.before(note); }
    if (note) {
      note.hidden = !off;
      note.className = admin ? 'site-flag' : 'site-gone';
      note.innerHTML = admin ? 'This page is hidden from visitors. You can see it because you are the admin. <a href="admin.html" data-keep>Open admin</a>'
        : '<h1>This page is not available right now.</h1><p>Please come back later.</p><a class="btn btn-primary" href="index.html">Back to the home page</a>';
    }
    // announcement bar
    let bar = document.getElementById('siteBar');
    const a = state.announce || {};
    if (a.on && a.text) {
      if (!bar) { bar = document.createElement('div'); bar.id = 'siteBar'; bar.className = 'site-bar'; document.body.prepend(bar); }
      const safe = /^(https?:\/\/|[a-z0-9-]+\.html|#)/i.test(a.link || '') ? a.link : '';
      bar.innerHTML = `<span>${esc(a.text)}</span>${safe ? ` <a href="${esc(safe)}" data-keep>Learn more →</a>` : ''}`;
    } else if (bar) bar.remove();
    // editable texts
    const t = state.text || {};
    if (here === 'home') {
      const h = document.querySelector('.hero h1'), l = document.querySelector('.hero .lede'), p = document.querySelector('.plan-hot .price');
      if (h && (t.h1a || t.h1b)) h.innerHTML = `${esc(t.h1a || 'Tested strategies.')}<br><em>${esc(t.h1b || 'Every trade shown.')}</em>`;
      if (l && t.lede) l.textContent = t.lede;
      if (p && t.pricePro) p.innerHTML = `${esc(t.pricePro)}<small>/month</small>`;
    }
    if (t.contact && /^\S+@\S+\.\S+$/.test(t.contact)) document.querySelectorAll('a.mail').forEach((m) => { m.href = 'mailto:' + t.contact; m.textContent = t.contact; });
  }
  function apply() { applyCss(); if (document.body) applyDom(); window.dispatchEvent(new Event('site:change')); }

  /* ---------- loading and saving ---------- */
  function take(doc) {
    if (!doc || typeof doc !== 'object') return;
    const next = { ...blank(), ...doc };
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = next;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* not remembered */ }
    apply();
  }
  async function pull() {
    if (!live()) return;
    try {
      const r = await fetch(`${cfg().supabaseUrl}/rest/v1/site_settings?select=data&id=eq.1`, { headers: { apikey: cfg().supabaseKey, Authorization: 'Bearer ' + cfg().supabaseKey } });
      const rows = await r.json();
      if (Array.isArray(rows) && rows[0]) take(rows[0].data);
    } catch (e) { /* keep the last known settings */ }
  }
  async function save() { // only the admin portal calls this
    state.v = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* not remembered */ }
    apply();
    if (live()) {
      const sb = typeof Auth !== 'undefined' && Auth.client();
      if (!sb) throw new Error('You are not logged in.');
      const { error } = await sb.from('site_settings').upsert({ id: 1, data: state, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
    }
  }

  applyCss();
  document.addEventListener('DOMContentLoaded', async () => {
    applyDom();
    if (typeof Auth !== 'undefined') { try { await Auth.ready; } catch (e) { /* signed out */ } admin = !!Auth.isAdmin && Auth.isAdmin(); if (admin) applyDom(); }
    await pull();
    if (live()) setInterval(pull, 60000);
  });
  window.addEventListener('storage', (e) => { if (e.key === KEY && e.newValue) { try { take(JSON.parse(e.newValue)); } catch (err) { /* ignore */ } } });

  return {
    PAGES, SECTIONS, live, hidden, save, pull,
    get: () => state,
    setHidden(key, off) { state.hide = state.hide.filter((k) => k !== key); if (off) state.hide.push(key); },
    reset() { state = blank(); },
    trades: () => state.trades || [],
    // profit or loss of a trade in percent, at a given price
    pl(t, price) { const p = t.status === 'closed' ? t.exit : price; return p ? (p / t.entry - 1) * 100 * (t.side === 'short' ? -1 : 1) * (t.lev || 1) : null; },
  };
})();
