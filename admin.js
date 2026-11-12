/* The admin portal.
   Overview: animated numbers for the trades posted so far.
   Trading desk: laid out like an exchange. Pick a market, see its live chart, fill in the ticket
   (long or short, entry, leverage, take profit, stop loss) and the trade appears on the website.
   Website / Texts / Members: switch pages and sections on or off, edit texts, manage members. */
const Admin = (() => {
  const d = { a: null, side: 'long', type: 'market', tf: '1h', tab: 'open', chart: null, candle: null, last: null, lines: [], seq: 0 };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const num = (id) => { const v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : null; };
  function say(text, bad) {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div'); el.className = 'toast'; if (bad) el.style.borderLeftColor = '#e5484d'; el.textContent = text;
    box.appendChild(el); setTimeout(() => el.remove(), 3200);
  }
  async function save(msg) {
    try { await Site.save(); say(msg || 'Saved'); } catch (e) { say('Could not save: ' + e.message, true); }
    paintAll();
  }
  const sw = (on, attrs, label) => `<label class="sw"><input type="checkbox" ${on ? 'checked' : ''} ${attrs}><i></i>${label ? `<span>${label}</span>` : ''}</label>`;
  const open = () => Site.trades().filter((t) => t.status !== 'closed' && A.has(t.market));
  const closed = () => Site.trades().filter((t) => t.status === 'closed' && A.has(t.market)).sort((x, y) => (y.closed || 0) - (x.closed || 0));

  /* ================= overview ================= */
  function paintOverview() {
    const o = open(), c = closed();
    const pls = o.map((t) => Site.pl(t, A.get(t.market).price)).filter((x) => x != null), avg = pls.length ? pls.reduce((s, x) => s + x, 0) / pls.length : 0;
    const wins = c.filter((t) => Site.pl(t) > 0).length, total = c.reduce((s, t) => s + Site.pl(t), 0), rate = c.length ? (wins / c.length) * 100 : 0;
    const hid = Site.get().hide.length;
    const tile = (id, label, sub, extra = '') => `<div class="panel kpi5"><small>${label}</small><b id="${id}">–</b><em>${sub}</em>${extra}</div>`;
    if (!$('ovOpen')) {
      $('admKpis').innerHTML = tile('ovOpen', 'Open positions', 'trades running now') + tile('ovPl', 'Open profit / loss', 'average across open trades')
        + tile('ovRate', 'Win rate', '<span id="ovRateSub"></span>', '<i class="kring" id="ovRing"></i>') + tile('ovTotal', 'Closed result', 'all closed trades added up') + tile('ovHid', 'Hidden on website', '<span id="ovHidSub"></span>');
    }
    countUp($('ovOpen'), o.length); countUp($('ovPl'), avg, (v) => fmtPct(v)); $('ovPl').className = cls(avg);
    countUp($('ovRate'), rate, (v) => Math.round(v) + '%'); $('ovRing').style.setProperty('--v', rate);
    setT('ovRateSub', c.length ? `${wins} of ${c.length} closed in profit` : 'no closed trades yet');
    countUp($('ovTotal'), total, (v) => fmtPct(v)); $('ovTotal').className = cls(total);
    countUp($('ovHid'), hid); setT('ovHidSub', `${Site.get().announce.on ? 'announcement on' : 'announcement off'}`);
    // closed trades added up, oldest first
    const seq = c.slice().reverse(); let run = 0; const pts = [0, ...seq.map((t) => (run += Site.pl(t)))];
    $('admCurve').innerHTML = seq.length ? `<div class="curve">${sparkSVG(pts, 600, 150, true, run >= 0 ? UP : DOWN)}</div><div class="curve-x"><span>Start</span><span>${seq.length} closed trade${seq.length === 1 ? '' : 's'}</span><span class="${cls(run)}">${fmtPct(run)}</span></div>`
      : '<div class="skeleton">Close your first trade and its result is drawn here.</div>';
    const ev = [];
    Site.trades().forEach((t) => { const a = A.get(t.market); if (!a) return; ev.push([t.opened, a, `Opened ${t.side === 'short' ? 'short' : 'long'} at ${fmtPx(t.entry)}`, '']); if (t.status === 'closed') ev.push([t.closed, a, `Closed at ${fmtPx(t.exit)}`, fmtPct(Site.pl(t))]); });
    ev.sort((x, y) => y[0] - x[0]);
    $('admFeed').innerHTML = ev.slice(0, 7).map(([ts, a, text, res]) => `<li>${icon(a, 'sm')}<div><b>${esc(a.t)}</b><small>${text}</small></div><span>${res ? `<b class="${res[0] === '-' ? 'down' : 'up'}">${res}</b>` : ''}<small>${new Date(ts).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></span></li>`).join('')
      || '<li class="dimtxt">Nothing yet. Open a trade on the trading desk.</li>';
  }
  function tickOverview() {
    if ($('pane-overview').hidden || !$('ovPl')) return;
    const pls = open().map((t) => Site.pl(t, A.get(t.market).price)).filter((x) => x != null);
    if (pls.length) { const avg = pls.reduce((s, x) => s + x, 0) / pls.length; $('ovPl').textContent = fmtPct(avg); $('ovPl').className = cls(avg); }
    setT('admClock', new Date().toLocaleTimeString());
  }

  /* ================= trading desk ================= */
  function setMarket(a) {
    if (!a) return;
    d.a = a;
    const bar = $('dkBar'); bar.dataset.id = a.id; bar._v = null;
    setHTML('dkIcon', icon(a, 'lg')); setT('dkT', a.t + 'USDT'); setT('dkName', (a.name || a.sub || '') + ' · perpetual');
    document.querySelectorAll('#dkFavs button').forEach((b) => b.classList.toggle('is-active', b.dataset.m === a.id));
    $('admMarket').value = '';
    if (d.type === 'market' || !num('admEntry')) $('admEntry').value = a.price;
    $('admTarget').value = ''; $('admStop').value = '';
    paint(); loadChart(); paintTicket();
  }
  function initChart() {
    if (!LW) { $('dkChart').innerHTML = '<div class="skeleton">Chart library could not load.</div>'; return; }
    d.chart = LW.createChart($('dkChart'), { ...chartBase });
    d.candle = d.chart.addCandlestickSeries({ upColor: '#0a9d6c', downColor: '#e5484d', borderVisible: false, wickUpColor: '#0a9d6c', wickDownColor: '#e5484d' });
  }
  async function loadChart() {
    if (!d.candle) return;
    const seq = ++d.seq, a = d.a;
    try {
      const k = await fetchKlines(a, d.tf, 300);
      if (seq !== d.seq) return;
      d.candle.setData(k.map((x) => ({ time: x.t / 1000, open: x.o, high: x.h, low: x.l, close: x.c })));
      d.last = { ...k[k.length - 1], time: k[k.length - 1].t / 1000 };
      d.candle.applyOptions({ priceFormat: { type: 'price', precision: a.price < 1 ? 5 : a.price < 100 ? 3 : 2, minMove: a.price < 1 ? 0.00001 : a.price < 100 ? 0.001 : 0.01 } });
      d.chart.timeScale().setVisibleLogicalRange({ from: k.length - 130, to: k.length + 6 }); drawLines();
    } catch (e) { /* the price header still works without the chart */ }
  }
  function drawLines() { // the ticket's entry, stop and target, plus open trades on this market
    if (!d.candle) return;
    d.lines.forEach((l) => d.candle.removePriceLine(l)); d.lines = [];
    const add = (price, color, title, style = 2) => { if (price) d.lines.push(d.candle.createPriceLine({ price, color, lineWidth: 1, lineStyle: style, axisLabelVisible: true, title })); };
    add(num('admEntry'), '#0b1220', 'entry'); add(num('admTarget'), '#0a9d6c', 'take profit'); add(num('admStop'), '#e5484d', 'stop');
    open().filter((t) => t.market === d.a.id).forEach((t) => add(t.entry, '#3b82f6', (t.side === 'short' ? 'short' : 'long') + ' open', 0));
  }
  function paintTicket() {
    const a = d.a; if (!a) return;
    const long = d.side === 'long', entry = num('admEntry'), tp = num('admTarget'), sl = num('admStop'), lev = +$('admLev').value || 1;
    document.querySelectorAll('#dkSide button').forEach((b) => b.classList.toggle('is-active', b.dataset.s === d.side));
    $('dkTicket').classList.toggle('is-short', !long);
    $('admEntry').readOnly = d.type === 'market'; $('admEntry').parentNode.classList.toggle('is-live', d.type === 'market');
    setT('dkLevV', lev + '×'); $('admLev').style.setProperty('--p', ((lev - 1) / 49) * 100 + '%');
    document.querySelectorAll('#dkLevChips button').forEach((b) => b.classList.toggle('is-active', +b.dataset.l === lev));
    const pct = (p) => (entry && p ? (p / entry - 1) * 100 * (long ? 1 : -1) * lev : null);
    const rw = pct(tp), rk = pct(sl);
    setT('dkTpPct', rw == null ? '' : fmtPct(rw, 1)); setT('dkSlPct', rk == null ? '' : fmtPct(rk, 1));
    const liq = lev > 1 && entry ? entry * (1 + (long ? -1 : 1) / lev) : null;
    $('dkCalc').innerHTML = `<div><span>Reward if target is hit</span><b class="up">${rw == null ? '–' : fmtPct(rw, 1)}</b></div><div><span>Risk if stop is hit</span><b class="down">${rk == null ? '–' : fmtPct(rk, 1)}</b></div>
      <div><span>Reward for each 1 of risk</span><b>${rw != null && rk != null && rk < 0 ? (rw / -rk).toFixed(2) : '–'}</b></div><div><span>Rough wipe-out price at ${lev}×</span><b>${liq ? fmtPx(liq) : 'none at 1×'}</b></div>`;
    const go = $('admOpen'); go.className = 'dk-go ' + (long ? 'long' : 'short'); go.textContent = `${long ? 'Open Long' : 'Open Short'} ${a.t}`;
    drawLines();
  }
  function submit() {
    const a = d.a, long = d.side === 'long', lev = +$('admLev').value || 1;
    if (!a) return say('Pick a market first.', true);
    const entry = d.type === 'market' ? a.price : num('admEntry'), stop = num('admStop'), target = num('admTarget');
    if (!entry) return say('Enter the entry price.', true);
    if (stop && (long ? stop >= entry : stop <= entry)) return say(long ? 'For a long trade the stop must be below the entry.' : 'For a short trade the stop must be above the entry.', true);
    if (target && (long ? target <= entry : target >= entry)) return say(long ? 'For a long trade the target must be above the entry.' : 'For a short trade the target must be below the entry.', true);
    const t = { id: uid(), market: a.id, side: d.side, entry, stop, target, lev, note: $('admNote').value.trim().slice(0, 160), status: 'open', show: $('admShowNew').checked, opened: Date.now() };
    Site.get().trades.push(t);
    ['admStop', 'admTarget', 'admNote'].forEach((id) => { $(id).value = ''; });
    d.tab = 'open'; d.fresh = t.id;
    const go = $('admOpen'); go.classList.add('is-done'); setTimeout(() => go.classList.remove('is-done'), 900);
    save(`${long ? 'Long' : 'Short'} ${a.t} opened at ${fmtPx(entry)}`);
  }

  function paintPositions() {
    const o = open().sort((x, y) => y.opened - x.opened), c = closed();
    setT('dkNOpen', o.length); setT('dkNClosed', c.length);
    document.querySelectorAll('#dkPosTabs button').forEach((b) => b.classList.toggle('is-active', b.dataset.p === d.tab));
    $('admTradesOn').checked = !Site.hidden('home.trades');
    const side = (t) => `<em class="dk-tag ${t.side === 'short' ? 'short' : 'long'}">${t.side === 'short' ? 'Short' : 'Long'}${t.lev > 1 ? ' ' + t.lev + '×' : ''}</em>`;
    const head = d.tab === 'open' ? ['Market', 'Entry', 'Mark price', 'Profit / loss', 'Stop → target', 'On website', ''] : ['Market', 'Entry', 'Exit', 'Result', 'Closed', 'On website', ''];
    const rows = (d.tab === 'open' ? o : c).map((t) => {
      const a = A.get(t.market), isOpen = t.status !== 'closed';
      const track = isOpen && t.stop && t.target ? `<div class="lt-track sm"><i class="lt-fill"></i><u class="lt-entry" style="left:${clamp(((t.entry - t.stop) / (t.target - t.stop)) * 100, 0, 100)}%"></u><b class="lt-mark"></b></div><small>${fmtPx(t.stop)} → ${fmtPx(t.target)}</small>` : isOpen ? `<small>${t.stop ? 'stop ' + fmtPx(t.stop) : ''}${t.target ? ' target ' + fmtPx(t.target) : ''}${!t.stop && !t.target ? 'not set' : ''}</small>` : `<small>${new Date(t.closed).toLocaleDateString()}</small>`;
      return `<div class="dk-row ${t.id === d.fresh ? 'is-new' : ''}" data-t="${t.id}" data-m="${a.id}">
        <div class="cell-asset">${icon(a, 'sm')}<div><b>${esc(a.t)}</b>${side(t)}</div></div>
        <span class="mono" data-l="${head[1]}">${fmtPx(t.entry)}</span>
        <span class="mono" data-l="${head[2]}" ${isOpen ? `data-mark="${t.id}"` : ''}>${isOpen ? '–' : fmtPx(t.exit)}</span>
        <b class="dk-pl mono ${isOpen ? '' : cls(Site.pl(t))}" data-l="${head[3]}" ${isOpen ? `data-pl="${t.id}"` : ''}>${isOpen ? '–' : fmtPct(Site.pl(t))}</b>
        <div class="dk-range" data-l="${head[4]}">${track}</div>
        <div data-l="${head[5]}">${sw(t.show !== false, `data-show="${t.id}"`)}</div>
        <div class="adm-acts">${isOpen ? `<button class="btn btn-dark btn-sm" data-close="${t.id}">Close</button><button class="btn btn-ghost btn-sm" data-closeat="${t.id}">Close at…</button>` : `<button class="btn btn-ghost btn-sm" data-reopen="${t.id}">Reopen</button>`}<button class="dk-x" data-del="${t.id}" aria-label="Delete trade">✕</button></div>
      </div>`;
    }).join('');
    $('admTradeList').innerHTML = rows ? `<div class="dk-row dk-rhead">${head.map((h) => `<span>${h}</span>`).join('')}</div>${rows}` : `<div class="skeleton">${d.tab === 'open' ? 'No open positions. Use the ticket above to open one.' : 'No closed trades yet.'}</div>`;
    d.fresh = null; tickPositions(true);
  }
  function tickPositions(first) {
    open().forEach((t) => {
      const a = A.get(t.market), el = document.querySelector(`[data-pl="${t.id}"]`);
      if (!el || a.price == null) return;
      const pl = Site.pl(t, a.price), row = el.closest('.dk-row');
      if (el._v !== pl) {
        if (!first && el._v != null) { el.classList.remove('pop-up', 'pop-down'); void el.offsetWidth; el.classList.add(pl > el._v ? 'pop-up' : 'pop-down'); }
        el._v = pl; el.textContent = fmtPct(pl); el.classList.toggle('up', pl >= 0); el.classList.toggle('down', pl < 0);
        row.classList.toggle('in-profit', pl >= 0); row.classList.toggle('in-loss', pl < 0);
        row.querySelector('[data-mark]').textContent = fmtPx(a.price);
        const mark = row.querySelector('.lt-mark');
        if (mark) { const pos = clamp(((a.price - t.stop) / (t.target - t.stop)) * 100, 0, 100), ent = clamp(((t.entry - t.stop) / (t.target - t.stop)) * 100, 0, 100); mark.style.left = pos + '%'; const f = row.querySelector('.lt-fill'); f.style.left = Math.min(pos, ent) + '%'; f.style.width = Math.abs(pos - ent) + '%'; f.style.background = pl >= 0 ? '#0a9d6c' : '#e5484d'; mark.style.borderColor = pl >= 0 ? '#0a9d6c' : '#e5484d'; }
      }
    });
  }
  function tickDesk() {
    const a = d.a; if (!a || a.price == null) return;
    if (d.type === 'market' && document.activeElement !== $('admEntry') && +$('admEntry').value !== a.price) { $('admEntry').value = a.price; if (!$('pane-desk').hidden) paintTicket(); }
    if (d.last && d.candle && !$('pane-desk').hidden) { d.last.close = a.price; d.last.high = Math.max(d.last.high ?? d.last.h, a.price); d.last.low = Math.min(d.last.low ?? d.last.l, a.price); d.candle.update({ time: d.last.time, open: d.last.o, high: d.last.high, low: d.last.low, close: a.price }); }
    tickPositions();
  }
  function wireDesk() {
    initChart();
    const favs = [...all('crypto').sort(byVol).slice(0, 5), ...all('stocks').sort(byVol).slice(0, 5)];
    $('dkFavs').innerHTML = favs.map((a) => `<button data-m="${a.id}" data-id="${a.id}">${icon(a, 'sm')}<b>${esc(a.t)}</b><span data-f="c"></span></button>`).join('');
    $('dkFavs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setMarket(A.get(b.dataset.m)); });
    mountPicker($('admMarket'), $('admMarketBox'), setMarket);
    segment($('dkTf'), (x) => { d.tf = x.tf; loadChart(); });
    $('dkSide').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; d.side = b.dataset.s; $('admTarget').value = ''; $('admStop').value = ''; paintTicket(); });
    segment($('dkType'), (x) => { d.type = x.o; if (d.type === 'market' && d.a) $('admEntry').value = d.a.price; paintTicket(); });
    $('admLev').addEventListener('input', paintTicket);
    $('dkLevChips').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { $('admLev').value = b.dataset.l; paintTicket(); } });
    ['admEntry', 'admTarget', 'admStop'].forEach((id) => $(id).addEventListener('input', paintTicket));
    $('dkTicket').addEventListener('click', (e) => { // quick percentage buttons for take profit and stop
      const b = e.target.closest('[data-pct]'); if (!b) return;
      const entry = d.type === 'market' ? d.a.price : num('admEntry'); if (!entry) return say('Enter the entry price first.', true);
      const p = +b.dataset.pct / 100, long = d.side === 'long', isTp = b.parentNode.dataset.for === 'tp';
      const px = entry * (1 + (isTp === long ? 1 : -1) * p);
      $(isTp ? 'admTarget' : 'admStop').value = +px.toPrecision(6); paintTicket();
    });
    $('admOpen').addEventListener('click', submit);
    segment($('dkPosTabs'), (x) => { d.tab = x.p; paintPositions(); });
    $('admTradesOn').addEventListener('change', (e) => { Site.setHidden('home.trades', !e.target.checked); save(e.target.checked ? 'Trades are shown on the website' : 'Trades are hidden from the website'); });
    $('admTradeList').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) { const r = e.target.closest('.dk-row[data-m]'); if (r && !e.target.closest('label')) { setMarket(A.get(r.dataset.m)); $('dkBar').scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
      const id = b.dataset.close || b.dataset.closeat || b.dataset.del || b.dataset.reopen, list = Site.get().trades, t = list.find((x) => x.id === id);
      if (!t) return;
      if (b.dataset.del) { if (!confirm('Delete this trade for good? It will disappear from the website.')) return; Site.get().trades = list.filter((x) => x.id !== id); return save('Trade deleted'); }
      if (b.dataset.reopen) { t.status = 'open'; t.exit = null; t.closed = null; d.tab = 'open'; return save('Trade reopened'); }
      let px = A.get(t.market) && A.get(t.market).price;
      if (b.dataset.closeat) { const v = parseFloat(prompt('Exit price for this trade:', px || '')); if (!isFinite(v) || v <= 0) return; px = v; }
      if (!px) return say('No live price yet. Use "Close at…" instead.', true);
      t.status = 'closed'; t.exit = px; t.closed = Date.now();
      save('Closed at ' + fmtPx(px) + ' (' + fmtPct(Site.pl(t)) + ')');
    });
    $('admTradeList').addEventListener('change', (e) => {
      const id = e.target.dataset.show; if (!id) return;
      const t = Site.get().trades.find((x) => x.id === id); t.show = e.target.checked;
      save(t.show ? 'Trade is shown on the website' : 'Trade is hidden from the website');
    });
    setMarket(A.get('p:BTCUSDT') || favs[0]);
    setInterval(tickDesk, 700);
  }

  /* ================= website: pages, sections, announcement ================= */
  function paintShow() {
    $('admPages').innerHTML = Site.PAGES.map(([p, label]) => `<div class="adm-line">${sw(!Site.hidden('page.' + p), `data-key="page.${p}"`)}<div><b>${label}</b><small>${p}.html and every link to it</small></div><a class="lnk" href="${p}.html" target="_blank" data-keep>View</a></div>`).join('');
    const groups = {};
    Site.SECTIONS.forEach(([key, where, label]) => { (groups[where] = groups[where] || []).push([key, label]); });
    $('admSections').innerHTML = Object.entries(groups).map(([where, rows]) => `<h4>${where}</h4>${rows.map(([key, label]) => `<div class="adm-line">${sw(!Site.hidden(key), `data-key="${key}"`)}<div><b>${label}</b></div></div>`).join('')}`).join('');
    const a = Site.get().announce;
    $('admAnnOn').checked = !!a.on; $('admAnnText').value = a.text || ''; $('admAnnLink').value = a.link || '';
  }
  function wireShow() {
    $('pane-show').addEventListener('change', (e) => {
      const key = e.target.dataset.key; if (!key) return;
      Site.setHidden(key, !e.target.checked);
      save(e.target.checked ? 'Now shown on the website' : 'Now hidden from the website');
    });
    $('admAnnSave').addEventListener('click', () => {
      Site.get().announce = { on: $('admAnnOn').checked, text: $('admAnnText').value.trim().slice(0, 140), link: $('admAnnLink').value.trim() };
      save('Announcement saved');
    });
  }

  /* ================= texts ================= */
  const TEXTS = [['h1a', 'admH1a'], ['h1b', 'admH1b'], ['lede', 'admLede'], ['pricePro', 'admPrice'], ['contact', 'admContact']];
  function paintText() { const t = Site.get().text || {}; TEXTS.forEach(([k, id]) => { $(id).value = t[k] || ''; }); }
  function wireText() {
    $('admTextSave').addEventListener('click', () => {
      const t = {}; TEXTS.forEach(([k, id]) => { const v = $(id).value.trim(); if (v) t[k] = v; });
      if (t.contact && !/^\S+@\S+\.\S+$/.test(t.contact)) return say('That contact email does not look right.', true);
      Site.get().text = t; save('Texts saved');
    });
    $('admReset').addEventListener('click', () => {
      if (!confirm('Reset everything? All pages and sections are shown again, the announcement and texts are cleared, and ALL trades are deleted.')) return;
      Site.reset(); save('Everything reset');
    });
  }

  /* ================= members (needs the login service) ================= */
  async function paintMembers() {
    const box = $('admMembers');
    if (!Auth.live) { box.innerHTML = '<div class="auth-preview">Members can be listed and upgraded here once the login service is connected. In preview mode accounts exist only in each visitor\'s own browser, so there is nothing to list.</div>'; return; }
    box.innerHTML = '<div class="skeleton">Loading members…</div>';
    const { data, error } = await Auth.client().from('profiles').select('id,name,plan,role,created_at').order('created_at', { ascending: false }).limit(500);
    if (error) { box.innerHTML = `<div class="auth-preview">Could not load members: ${esc(error.message)}</div>`; return; }
    box.innerHTML = `<p class="xp">${data.length} member${data.length === 1 ? '' : 's'}. Changing a plan takes effect the next time that member opens the site.</p>` + data.map((m) => `<div class="adm-line"><div><b>${esc(m.name || 'No name')}</b><small>Joined ${new Date(m.created_at).toLocaleDateString()}${m.role === 'admin' ? ' · admin' : ''}</small></div>
      <select data-plan="${m.id}">${['free', 'pro', 'elite'].map((p) => `<option ${p === m.plan ? 'selected' : ''}>${p}</option>`).join('')}</select></div>`).join('');
  }
  function wireMembers() {
    $('admMembers').addEventListener('change', async (e) => {
      const id = e.target.dataset.plan; if (!id) return;
      const { error } = await Auth.client().from('profiles').update({ plan: e.target.value }).eq('id', id);
      say(error ? 'Could not change the plan: ' + error.message : 'Plan changed to ' + e.target.value, !!error);
    });
  }

  function paintAll() { paintOverview(); paintPositions(); paintShow(); paintText(); drawLines(); }
  const NAV = [['overview', 'Overview', 'home'], ['desk', 'Trading desk', 'desk'], ['show', 'Website', 'eye'], ['text', 'Texts and prices', 'text'], ['members', 'Members', 'users']];
  function show(t) {
    document.querySelectorAll('#admTabs button').forEach((x) => x.classList.toggle('is-active', x.dataset.t === t));
    document.querySelectorAll('.adm-pane').forEach((p) => { p.hidden = p.id !== 'pane-' + t; });
    if (t === 'members') paintMembers();
    if (t === 'overview') paintOverview();
    if (t === 'desk') paintTicket();
    try { history.replaceState(null, '', '#' + t); } catch (e) { /* fine */ }
  }
  async function init() {
    await Auth.ready;
    if (!Auth.user()) { $('admGate').hidden = false; return; }
    if (!Auth.isAdmin()) { $('admGate').hidden = false; $('admGate').querySelector('p').textContent = 'This account is not an admin. Log in with the admin account to open the portal.'; return; }
    await Site.pull();
    $('admApp').hidden = false; $('admPreview').hidden = Auth.live;
    setT('admWho', Auth.user().name); setT('admAva', Auth.user().name.slice(0, 1).toUpperCase());
    $('admTabs').innerHTML = NAV.map(([t, label, ic]) => `<button data-t="${t}">${pIcon(ic)}<span>${label}</span></button>`).join('');
    $('admTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(b.dataset.t); });
    document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => show(b.dataset.goto)));
    $('admOut').addEventListener('click', async () => { await Auth.signOut(); location.href = 'index.html'; });
    wireDesk(); wireShow(); wireText(); wireMembers(); paintAll();
    show(NAV.some((n) => n[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'overview');
    setInterval(tickOverview, 1000);
  }
  return { init };
})();
