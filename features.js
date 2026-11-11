/* Extra market tools for the home page: watchlist, heatmap, chart indicators,
   compare chart and funding rates. Loaded before app.js, which calls the init functions. */

const PERP = { tick: new Map() }; // 24h stats for every perpetual contract, filled by loadMarkets()
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  set(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private window: just not remembered */ } },
};

/* ---------- watchlist (kept in this browser only) ---------- */
const watch = new Set(store.get('as.watch', []));
const starBtn = (a) => `<button class="star${watch.has(a.id) ? ' is-on' : ''}" data-star="${a.id}" title="${watch.has(a.id) ? 'Remove from watchlist' : 'Add to watchlist'}" aria-label="Watchlist">★</button>`;
function toggleWatch(id) {
  if (watch.has(id)) watch.delete(id); else watch.add(id);
  store.set('as.watch', [...watch]);
  document.querySelectorAll(`[data-star="${id}"]`).forEach((b) => b.classList.toggle('is-on', watch.has(id)));
  const tab = document.querySelector('#kindSeg [data-kind="watch"]');
  if (tab) tab.textContent = `★ Watchlist${watch.size ? ' ' + watch.size : ''}`;
  if (tbl.kind === 'watch') buildTable();
}

/* ---------- indicator maths ---------- */
function sma(v, n) {
  const out = new Array(v.length).fill(null); let s = 0;
  for (let i = 0; i < v.length; i++) { s += v[i]; if (i >= n) s -= v[i - n]; if (i >= n - 1) out[i] = s / n; }
  return out;
}
function bollinger(c, n = 20, mult = 2) {
  const mid = sma(c, n), up = mid.slice(), lo = mid.slice();
  for (let i = n - 1; i < c.length; i++) {
    let q = 0;
    for (let j = i - n + 1; j <= i; j++) q += (c[j] - mid[i]) ** 2;
    const sd = Math.sqrt(q / n);
    up[i] = mid[i] + mult * sd; lo[i] = mid[i] - mult * sd;
  }
  return { mid, up, lo };
}
function macd(c, fast = 12, slow = 26, sig = 9) {
  const f = ema(c, fast), s = ema(c, slow), line = c.map((_, i) => (s[i] == null ? null : f[i] - s[i]));
  const start = line.findIndex((v) => v != null), sg = new Array(c.length).fill(null);
  if (start >= 0) ema(line.slice(start), sig).forEach((v, i) => { sg[start + i] = v; });
  return { line, signal: sg, hist: line.map((v, i) => (v == null || sg[i] == null ? null : v - sg[i])) };
}
function supertrend(k, n = 10, mult = 3) {
  const out = new Array(k.length).fill(null);
  if (k.length <= n) return out;
  let atr = 0, fu = 0, fl = 0, up = true;
  for (let i = 1; i < k.length; i++) {
    const tr = Math.max(k[i].h - k[i].l, Math.abs(k[i].h - k[i - 1].c), Math.abs(k[i].l - k[i - 1].c));
    if (i <= n) { atr += tr / n; if (i < n) continue; } else atr = (atr * (n - 1) + tr) / n;
    const mid = (k[i].h + k[i].l) / 2, ub = mid + mult * atr, lb = mid - mult * atr;
    if (i === n) { fu = ub; fl = lb; up = k[i].c >= mid; }
    else {
      const pu = fu, pl = fl;
      fu = ub < pu || k[i - 1].c > pu ? ub : pu;
      fl = lb > pl || k[i - 1].c < pl ? lb : pl;
      up = up ? k[i].c >= fl : k[i].c > fu;
    }
    out[i] = { v: up ? fl : fu, up };
  }
  return out;
}

/* ---------- chart indicator toggles ---------- */
const IND = [
  ['ema', 'EMA 20/50', '#f59e0b', 'Two average-price lines (last 20 and last 50 candles). When the orange line is above the blue one, the trend is up.'],
  ['bb', 'Bollinger', '#8b5cf6', 'A band around the average price. It widens when price swings a lot; touching the edges means price is stretched.'],
  ['st', 'Supertrend', '#0a9d6c', 'A trailing line that turns green under price in an uptrend and red above price in a downtrend.'],
  ['vma', 'Volume avg', '#64748b', 'The usual amount of trading. Bars taller than this line mean unusually busy candles.'],
  ['macd', 'MACD', '#3b82f6', 'Compares fast and slow momentum (bottom strip). Bars above zero mean buyers are gaining strength, below zero sellers are.'],
];
const ind = Object.assign({ ema: true, bb: false, st: false, vma: false, macd: false }, store.get('as.ind', {}));
function initIndicators() {
  $('indBar').innerHTML = IND.map(([id, label, col]) => `<button class="chip${ind[id] ? ' is-on' : ''}" data-ind="${id}"><i style="background:${col}"></i>${label}</button>`).join('');
  $('indBar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ind]');
    if (!b) return;
    ind[b.dataset.ind] = !ind[b.dataset.ind];
    b.classList.toggle('is-on', ind[b.dataset.ind]);
    store.set('as.ind', ind);
    applyIndicators(); paintIndExplain();
  });
  paintIndExplain();
  if (!ch.chart) return;
  const line = (color, extra = {}) => ch.chart.addLineSeries({ color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, ...extra });
  ch.bbU = line('#8b5cf6'); ch.bbM = line('rgba(139,92,246,.45)', { lineStyle: 2 }); ch.bbL = line('#8b5cf6');
  ch.st = line(UP, { lineWidth: 2 });
  ch.vma = line('#64748b', { priceScaleId: 'vol' });
  ch.macdH = ch.chart.addHistogramSeries({ priceScaleId: 'macd', priceLineVisible: false, lastValueVisible: false });
  ch.macdL = line('#3b82f6', { priceScaleId: 'macd' }); ch.macdS = line('#f59e0b', { priceScaleId: 'macd' });
}
function paintIndExplain() {
  setHTML('indExplain', `<div><i style="background:linear-gradient(90deg,#0a9d6c 50%,#e5484d 50%)"></i><b>Candles</b><span>Each candle is one period of trading. Green means price ended higher than it started, red means lower. The thin lines show the highest and lowest prices reached.</span></div>`
    + IND.filter(([id]) => ind[id]).map(([, label, col, line]) => `<div><i style="background:${col}"></i><b>${label}</b><span>${line}</span></div>`).join(''));
}
function applyIndicators() {
  if (!ch.chart || !ch.bbU) return;
  const k = ch.k, c = k.map((x) => x.c), T = (i) => k[i].t / 1000;
  const pts = (arr, on) => (on ? arr.map((v, i) => (v == null ? null : { time: T(i), value: v })).filter(Boolean) : []);
  ch.e20.setData(pts(ema(c, 20), ind.ema)); ch.e50.setData(pts(ema(c, 50), ind.ema));
  const bb = ind.bb ? bollinger(c) : { up: [], mid: [], lo: [] };
  ch.bbU.setData(pts(bb.up, ind.bb)); ch.bbM.setData(pts(bb.mid, ind.bb)); ch.bbL.setData(pts(bb.lo, ind.bb));
  ch.st.setData(ind.st ? supertrend(k).map((s, i) => (s ? { time: T(i), value: s.v, color: s.up ? UP : DOWN } : null)).filter(Boolean) : []);
  ch.vma.setData(pts(sma(k.map((x) => x.v), 20), ind.vma));
  const m = ind.macd ? macd(c) : { hist: [], line: [], signal: [] };
  ch.macdH.setData(ind.macd ? m.hist.map((v, i) => (v == null ? null : { time: T(i), value: v, color: v >= 0 ? 'rgba(10,157,108,.55)' : 'rgba(229,72,77,.55)' })).filter(Boolean) : []);
  ch.macdL.setData(pts(m.line, ind.macd)); ch.macdS.setData(pts(m.signal, ind.macd));
  // make room for the MACD strip at the bottom when it is on
  ch.chart.priceScale('right').applyOptions({ scaleMargins: ind.macd ? { top: 0.05, bottom: 0.4 } : { top: 0.06, bottom: 0.2 } });
  ch.chart.priceScale('vol').applyOptions({ scaleMargins: ind.macd ? { top: 0.62, bottom: 0.24 } : { top: 0.84, bottom: 0 } });
  ch.chart.priceScale('macd').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
}

/* ---------- market search used by the compare pickers ---------- */
function searchMarkets(text, n = 6) {
  const q = text.trim().toUpperCase();
  if (!q) return [];
  const rank = (a) => (a.t === q ? 0 : a.t.startsWith(q) ? 1 : a.t.includes(q) ? 2 : a.name.toUpperCase().includes(q) ? 3 : 9);
  return all().map((a) => [rank(a), a]).filter((x) => x[0] < 9).sort((x, y) => x[0] - y[0] || byVol(x[1], y[1])).slice(0, n).map((x) => x[1]);
}

// A small search box with a dropdown: type, pick a market, get a callback.
function mountPicker(input, box, onPick) {
  if (!input) return;
  let list = [];
  const show = () => {
    list = searchMarkets(input.value, 7);
    box.hidden = !input.value.trim();
    box.innerHTML = list.map((m) => `<div class="sr" data-id="${m.id}" data-m="${m.id}">${icon(m, 'sm')}<div class="who"><b>${esc(m.t)}</b><small>${esc(m.name)}</small><div>${esc(m.sub)}</div></div><div class="pc"><div data-f="p"></div><div data-f="c"></div></div></div>`).join('') || '<div class="sr-empty">No coin or stock matches that.</div>';
    paint();
  };
  const pick = (m) => { input.value = ''; box.hidden = true; input.blur(); onPick(m); };
  input.addEventListener('input', show);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && list[0]) pick(list[0]); if (e.key === 'Escape') { input.value = ''; box.hidden = true; input.blur(); } });
  input.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 180));
  box.addEventListener('mousedown', (e) => { const r = e.target.closest('[data-m]'); if (r) pick(A.get(r.dataset.m)); });
}

/* ---------- compare two markets ---------- */
const CMP_PERIODS = { '1W': ['1h', 168], '1M': ['4h', 180], '3M': ['1d', 90], '1Y': ['1d', 365] };
const cmp = { a: null, b: null, period: '1M', chart: null, la: null, lb: null, seq: 0 };
function initCompare() {
  cmp.a = A.get('p:NVDAUSDT') || A.get('p:BTCUSDT') || all().sort(byVol)[0];
  cmp.b = A.get('p:SOXLUSDT') || A.get('p:ETHUSDT') || all().sort(byVol)[1];
  if (LW) {
    const pct = { type: 'custom', formatter: (v) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%', minMove: 0.1 };
    cmp.chart = LW.createChart($('cmpChart'), { ...chartBase, handleScroll: false, handleScale: false });
    cmp.la = cmp.chart.addLineSeries({ color: '#f7931a', lineWidth: 2, priceFormat: pct, priceLineVisible: false });
    cmp.lb = cmp.chart.addLineSeries({ color: '#3b82f6', lineWidth: 2, priceFormat: pct, priceLineVisible: false });
  }
  for (const side of ['a', 'b']) {
    const input = $('cmp' + side.toUpperCase()), box = $('cmp' + side.toUpperCase() + 'Box');
    const show = () => {
      const list = searchMarkets(input.value);
      box.hidden = !input.value.trim();
      box.innerHTML = list.map((m) => `<div class="sr" data-cmp="${m.id}">${icon(m, 'sm')}<div class="who"><b>${esc(m.t)}</b><small>${esc(m.name)}</small><div>${esc(m.sub)}</div></div></div>`).join('') || '<div class="sr-empty">No match.</div>';
    };
    input.addEventListener('input', show);
    input.addEventListener('focus', () => { input.select(); });
    input.addEventListener('blur', () => setTimeout(() => { box.hidden = true; input.value = cmp[side].t; }, 180));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const first = searchMarkets(input.value)[0]; if (first) { cmp[side] = first; input.blur(); loadCompare(); } } });
    box.addEventListener('mousedown', (e) => { const r = e.target.closest('[data-cmp]'); if (r) { cmp[side] = A.get(r.dataset.cmp); loadCompare(); } });
  }
  $('cmpSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $('cmpSeg').querySelectorAll('button').forEach((x) => x.classList.toggle('is-active', x === b));
    cmp.period = b.dataset.p; loadCompare();
  });
  loadCompare();
}
async function loadCompare() {
  const { a, b } = cmp, seq = ++cmp.seq, [tf, n] = CMP_PERIODS[cmp.period];
  $('cmpA').value = a.t; $('cmpB').value = b.t;
  $('cmpNote').textContent = 'Loading…';
  let ka, kb;
  try { [ka, kb] = await Promise.all([fetchKlines(a, tf, n), fetchKlines(b, tf, n)]); } catch (e) { if (seq === cmp.seq) $('cmpNote').textContent = 'Could not load one of these markets.'; return; }
  if (seq !== cmp.seq) return;
  const mb = new Map(kb.map((x) => [x.t, x.c])), common = ka.filter((x) => mb.has(x.t));
  if (common.length < 5) { $('cmpNote').textContent = 'These two markets do not share enough history for this period.'; return; }
  const a0 = common[0].c, b0 = mb.get(common[0].t);
  const pa = common.map((x) => ({ time: x.t / 1000, value: (x.c / a0 - 1) * 100 })), pb = common.map((x) => ({ time: x.t / 1000, value: (mb.get(x.t) / b0 - 1) * 100 }));
  if (cmp.chart) { cmp.la.setData(pa); cmp.lb.setData(pb); cmp.chart.timeScale().fitContent(); }
  const ra = pa[pa.length - 1].value, rb = pb[pb.length - 1].value;
  const chip = (m, r, col) => `<div class="cmp-chip"><i style="background:${col}"></i>${icon(m, 'sm')}<b>${esc(m.t)}</b><span class="mono ${cls(r)}">${fmtPct(r, 1)}</span></div>`;
  $('cmpResult').innerHTML = chip(a, ra, '#f7931a') + chip(b, rb, '#3b82f6');
  const d = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const lead = Math.abs(ra - rb) < 0.05 ? 'Both moved about the same' : `${ra > rb ? a.t : b.t} is ahead by ${Math.abs(ra - rb).toFixed(1)} points`;
  $('cmpNote').textContent = `${lead} · ${d(common[0].t)} to ${d(common[common.length - 1].t)} · percentage change from the first shared candle.`;
}

/* ---------- heatmap ---------- */
const heat = { kind: 'stocks' };
function squarify(items, W, H) {
  const total = items.reduce((s, i) => s + i.v, 0), out = [];
  let rest = items.map((i) => ({ i, a: (i.v / total) * W * H })), x = 0, y = 0, w = W, h = H;
  const worst = (row, sum, side) => { const mx = Math.max(...row.map((r) => r.a)), mn = Math.min(...row.map((r) => r.a)), s2 = side * side; return Math.max((s2 * mx) / (sum * sum), (sum * sum) / (s2 * mn)); };
  while (rest.length) {
    const side = Math.min(w, h); let n = 1, sum = rest[0].a, best = worst([rest[0]], sum, side);
    while (n < rest.length) { const s2 = sum + rest[n].a, r2 = worst(rest.slice(0, n + 1), s2, side); if (r2 > best) break; sum = s2; best = r2; n++; }
    const row = rest.slice(0, n);
    if (w >= h) { const cw = sum / h; let cy = y; for (const r of row) { const rh = r.a / cw; out.push({ i: r.i, x, y: cy, w: cw, h: rh }); cy += rh; } x += cw; w -= cw; }
    else { const rh = sum / w; let cx = x; for (const r of row) { const cw = r.a / rh; out.push({ i: r.i, x: cx, y, w: cw, h: rh }); cx += cw; } y += rh; h -= rh; }
    rest = rest.slice(n);
  }
  return out;
}
const mixRGB = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',');
function paintHeat() {
  const box = $('heat'), W = box.clientWidth, H = box.clientHeight;
  if (!W) return;
  const list = all(heat.kind).sort(byVol).slice(0, W < 600 ? 22 : 40).filter((a) => a.vol > 0);
  const span = heat.kind === 'crypto' ? 8 : 6; // % move that gets the strongest colour
  $('heatLo').textContent = `-${span}%`; $('heatHi').textContent = `+${span}%`;
  box.innerHTML = squarify(list.map((a) => ({ a, v: Math.pow(a.vol, 0.55) })), W, H).map((r) => {
    const a = r.i.a, up = (a.chg || 0) >= 0, m = clamp(Math.abs(a.chg || 0) / span, 0, 1);
    const bg = up ? mixRGB([214, 244, 232], [6, 122, 84], m) : mixRGB([253, 226, 227], [196, 44, 50], m);
    const ink = m > 0.42 ? '#fff' : up ? '#075c41' : '#9b1c21';
    const w = r.w - 4, h = r.h - 4, size = w > 150 && h > 110 ? 'xl' : w > 88 && h > 62 ? 'lg' : w > 50 && h > 36 ? 'md' : w > 30 && h > 18 ? 'sm' : 'xs';
    const body = size === 'xl' ? `<div class="hc-top">${icon(a, 'sm')}<b>${esc(a.t)}</b></div><em>${esc(a.name || a.sub)}</em><strong>${fmtPct(a.chg)}</strong><span>${fmtPx(a.price)} · ${fmtVol(a.vol)}</span>`
      : size === 'lg' ? `<b>${esc(a.t)}</b><strong>${fmtPct(a.chg)}</strong><span>${fmtPx(a.price)}</span>`
      : size === 'md' ? `<b>${esc(a.t)}</b><span>${fmtPct(a.chg, 1)}</span>` : size === 'sm' ? `<b>${esc(a.t.slice(0, 5))}</b>` : '';
    return `<button class="heat-cell hc-${size}" data-go="${a.id}" title="${esc(a.t)}${a.name ? ' · ' + esc(a.name) : ''} · ${fmtPct(a.chg)} · ${fmtVol(a.vol)}" style="left:${r.x + 2}px;top:${r.y + 2}px;width:${w}px;height:${h}px;background-color:rgb(${bg});color:${ink}">${body}</button>`;
  }).join('');
}
function initHeat() {
  $('heatSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $('heatSeg').querySelectorAll('button').forEach((x) => x.classList.toggle('is-active', x === b));
    heat.kind = b.dataset.kind; paintHeat();
  });
  new ResizeObserver(paintHeat).observe($('heat'));
  setInterval(paintHeat, 10000);
}

/* ---------- funding rates and open interest ---------- */
const fund = { kind: 'all', rows: [], oi: new Map() };
async function loadFunding() {
  let rows;
  try { rows = await getJSON(API.perp.rest + '/premiumIndex'); } catch (e) { if (!fund.rows.length) $('fundLong').innerHTML = $('fundShort').innerHTML = '<div class="skeleton">Funding data is unreachable right now.</div>'; return; }
  const now = Date.now();
  fund.rows = rows.filter((r) => r.symbol.endsWith('USDT') && now - r.time < 600e3).map((r) => {
    const stock = A.get('p:' + r.symbol), tk = PERP.tick.get(r.symbol), t = r.symbol.slice(0, -4);
    return {
      sym: r.symbol, t, rate: +r.lastFundingRate * 100, mark: +r.markPrice, vol: tk ? +tk.quoteVolume : 0, chg: tk ? +tk.priceChangePercent : null,
      kind: stock ? stock.kind : 'crypto', name: stock ? stock.name : NAMES[t] || '', go: stock ? stock.id : '',
    };
  }).filter((r) => r.rate !== 0 && r.vol > (r.kind === 'crypto' ? 2e7 : 3e6));
  paintFunding();
}
function paintFunding() {
  const pool = fund.rows.filter((r) => fund.kind === 'all' || r.kind === fund.kind);
  const side = (id, list) => {
    $(id).innerHTML = list.map((r) => `<div class="fund-row"${r.go ? ` data-go="${r.go}"` : ''}>${icon({ t: r.t, kind: r.kind }, 'sm')}
      <div class="who"><b>${esc(r.t)}</b><small>${esc(r.name || (r.kind === 'crypto' ? 'Crypto' : 'Stock'))}</small></div>
      <div class="fund-oi"><small>Open interest</small><span class="mono" data-oi="${r.sym}">${fund.oi.has(r.sym) ? fmtVol(fund.oi.get(r.sym)) : '…'}</span></div>
      <b class="mono fund-rate ${cls(r.rate)}">${(r.rate >= 0 ? '+' : '') + r.rate.toFixed(4)}%</b></div>`).join('') || '<div class="skeleton">Nothing stands out right now.</div>';
    list.forEach((r) => getJSON(`${API.perp.rest}/openInterest?symbol=${r.sym}`).then((d) => {
      fund.oi.set(r.sym, +d.openInterest * r.mark);
      document.querySelectorAll(`[data-oi="${r.sym}"]`).forEach((el) => { el.textContent = fmtVol(fund.oi.get(r.sym)); });
    }).catch(() => {}));
  };
  side('fundLong', pool.filter((r) => r.rate > 0).sort((x, y) => y.rate - x.rate).slice(0, 7));
  side('fundShort', pool.filter((r) => r.rate < 0).sort((x, y) => x.rate - y.rate).slice(0, 7));
  $('fundStamp').textContent = 'Updated ' + new Date().toLocaleTimeString();
}
function initFunding() {
  $('fundSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $('fundSeg').querySelectorAll('button').forEach((x) => x.classList.toggle('is-active', x === b));
    fund.kind = b.dataset.kind; paintFunding();
  });
  loadFunding();
  setInterval(loadFunding, 120000);
}
