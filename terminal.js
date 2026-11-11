/* Market page (chart.html?m=...): one page per coin or stock.
   Header with live stats, market picker, live trades, top movers, coin info,
   trading-data charts and the per-market "bot" strip at the top. */

const pro = { ws: null, a: null, mark: null, index: null, fund: null, next: null, oi: null, trades: [], dirty: false, tab: 'chart', period: '1h', charts: {}, fundAll: new Map(), fundTs: 0, pick: { tab: 'all', q: '', sort: 'vol', dir: -1 }, cg: null };
const TIP = {
  mark: 'A fair price worked out from several exchanges. It is used so one odd trade cannot distort things.',
  index: 'The average price of the real asset across major exchanges.',
  fund: 'A small fee swapped between traders every few hours. Positive: those betting on a rise pay those betting on a fall. The timer shows when it is next paid.',
  high: 'The highest price in the last 24 hours.', low: 'The lowest price in the last 24 hours.',
  volB: 'How many units changed hands in the last 24 hours.', vol: 'The dollar value of everything traded in the last 24 hours.',
  oi: 'The total value of positions that are still open. Rising open interest means more money is entering this market.',
};
const hhmmss = (t) => new Date(t).toLocaleTimeString('en-GB');

/* ---------- header ---------- */
function paintProHead() {
  const a = pro.a, stat = (label, inner, tip) => `<div class="ph-stat" data-tip="${tip}"><small>${label}</small>${inner}</div>`;
  $('proHead').dataset.id = a.id; $('proHead')._v = null;
  $('proHead').innerHTML = `<div class="ph-id">${starBtn(a)}${icon(a, 'lg')}
      <button class="ph-sym" data-open-pick aria-label="Choose another market"><span><b>${esc(a.t)}</b><em>${esc(a.name || a.sub)}</em></span><span class="kind">${a.kind === 'crypto' ? 'Crypto' : esc(a.sub)}</span><svg viewBox="0 0 12 8" width="12"><path d="M1 1.500 6 6.500l5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <div class="ph-px"><b data-f="p"></b><span data-f="c"></span></div></div>
    <div class="ph-stats">
      ${stat('Mark price', '<span id="phMark">–</span>', TIP.mark)}${stat('Index price', '<span id="phIndex">–</span>', TIP.index)}
      ${stat('Funding / next in', '<span id="phFund">–</span>', TIP.fund)}
      ${stat('24h high', '<span data-f="h"></span>', TIP.high)}${stat('24h low', '<span data-f="l"></span>', TIP.low)}
      ${stat(`24h volume (${esc(a.t)})`, '<span id="phVolB">–</span>', TIP.volB)}${stat('24h volume (USDT)', '<span data-f="v"></span>', TIP.vol)}
      ${stat('Open interest', '<span id="phOI">–</span>', TIP.oi)}
    </div>`;
  paint();
}
function tickPro() { // once a second: header numbers, countdown, trades list
  const a = pro.a;
  if (!a) return;
  setT('phMark', fmtPx(pro.mark)); setT('phIndex', fmtPx(pro.index));
  if (pro.fund != null && $('phFund')) {
    const left = Math.max(0, pro.next - Date.now()), p = (n) => String(Math.floor(n)).padStart(2, '0');
    $('phFund').innerHTML = `<b class="${cls(pro.fund)}">${pro.fund.toFixed(4)}%</b> / ${p(left / 3600e3)}:${p((left / 60e3) % 60)}:${p((left / 1e3) % 60)}`;
  }
  setT('phVolB', a.volBase ? a.volBase.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '–');
  setT('phOI', pro.oi ? fmtVol(pro.oi) : '–');
  if (pro.dirty) { pro.dirty = false; paintTrades(); }
}
function pollOI() {
  const a = pro.a;
  if (!a) return;
  getJSON(`${API.perp.rest}/openInterest?symbol=${a.sym}`).then((d) => { if (pro.a === a) pro.oi = +d.openInterest * (pro.mark || a.price); }).catch(() => {});
}

/* ---------- live stream for the open market: trades + mark price ---------- */
function connectPro(a) {
  if (pro.ws) { pro.ws.onclose = null; pro.ws.close(); }
  const s = a.sym.toLowerCase(), ws = new WebSocket(`${API.perp.stream}${s}@aggTrade/${s}@markPrice@1s`);
  pro.ws = ws;
  ws.onmessage = (ev) => {
    const d = JSON.parse(ev.data).data;
    if (!d || pro.a !== a) return;
    if (d.e === 'aggTrade') { pro.trades.unshift({ p: +d.p, usd: +d.p * +d.q, t: d.T, buy: !d.m }); if (pro.trades.length > 300) pro.trades.length = 300; pro.dirty = true; }
    else if (d.e === 'markPriceUpdate') { const first = pro.fund == null; pro.mark = +d.p; pro.index = +d.i; pro.fund = +d.r * 100; pro.next = d.T; if (first) { pollOI(); paintReadout(); } }
  };
  ws.onclose = () => { if (pro.a === a) setTimeout(() => { if (pro.a === a) connectPro(a); }, 3000); };
  ws.onerror = () => ws.close();
}
function loadTrades(a) {
  getJSON(`${API.perp.rest}/trades?symbol=${a.sym}&limit=60`).then((rows) => {
    if (pro.a !== a || pro.trades.length) return;
    pro.trades = rows.map((r) => ({ p: +r.price, usd: +r.quoteQty, t: r.time, buy: !r.isBuyerMaker })).reverse();
    paintTrades();
  }).catch(() => {});
}
function paintTrades() {
  const all = pro.trades, buy = all.reduce((s, t) => s + (t.buy ? t.usd : 0), 0), tot = all.reduce((s, t) => s + t.usd, 0), pct = tot ? (buy / tot) * 100 : 50;
  setHTML('tradePressure', `<div class="split"><i style="width:${pct}%"></i><u></u></div><div class="split-lbl"><span class="up">Buyers ${pct.toFixed(0)}%</span><span class="down">Sellers ${(100 - pct).toFixed(0)}%</span></div><small>Share of money in the last ${all.length} trades</small>`);
  setHTML('tradesList', all.slice(0, 40).map((t) => `<div class="tr"><b class="${t.buy ? 'up' : 'down'}">${fmtPx(t.p)}</b><span>${fmtVol(t.usd)}</span><em>${hhmmss(t.t)}</em></div>`).join('') || '<div class="skeleton">Waiting for trades…</div>');
}

/* ---------- market picker (search, favourites, categories, funding) ---------- */
function togglePick(open) {
  const box = $('mktPanel');
  box.hidden = open === undefined ? !box.hidden : !open;
  if (box.hidden) return;
  if (Date.now() - pro.fundTs > 60e3) getJSON(API.perp.rest + '/premiumIndex').then((rows) => { pro.fundTs = Date.now(); rows.forEach((r) => pro.fundAll.set(r.symbol, +r.lastFundingRate * 100)); paintPick(); }).catch(() => {});
  paintPick(); $('pickQ').focus();
}
function paintPick() {
  const s = pro.pick, q = s.q.trim().toUpperCase(), val = (a) => (s.sort === 'fund' ? pro.fundAll.get(a.sym) || 0 : s.sort === 't' ? 0 : a[s.sort] || 0);
  let list = s.tab === 'fav' ? all().filter((a) => watch.has(a.id)) : all(s.tab);
  if (q) list = list.filter((a) => a.t.includes(q) || a.name.toUpperCase().includes(q));
  list.sort((x, y) => (s.sort === 't' ? x.t.localeCompare(y.t) * s.dir : (val(x) - val(y)) * s.dir));
  $('pickList').innerHTML = list.slice(0, 70).map((a) => {
    const f = pro.fundAll.get(a.sym);
    return `<div class="pk-row" data-id="${a.id}" data-pk="${a.id}">${starBtn(a)}${icon(a, 'sm')}<div class="who"><b>${esc(a.t)}</b><small>${fmtVol(a.vol)}</small></div>
      <span class="mono" data-f="p"></span><span class="mono" data-f="c"></span><span class="mono ${cls(f)}">${f == null ? '–' : f.toFixed(4) + '%'}</span></div>`;
  }).join('') || `<div class="skeleton">${s.tab === 'fav' ? 'No favourites yet. Tap a ★ to add one.' : 'No market matches that.'}</div>`;
  document.querySelectorAll('#pickHead [data-ps]').forEach((b) => b.classList.toggle('sorted', b.dataset.ps === s.sort));
  paint();
}

/* ---------- Info tab ---------- */
async function loadCG() {
  if (pro.cg) return pro.cg;
  const saved = store.get('as.cg', null);
  if (saved && Date.now() - saved.ts < 15 * 60e3) return (pro.cg = new Map(saved.rows));
  const pages = await Promise.all([1, 2].map((p) => getJSON(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${p}`).catch(() => [])));
  const m = new Map();
  for (const c of pages.flat()) { const k = c.symbol.toUpperCase(); if (!m.has(k)) m.set(k, [c.name, c.market_cap_rank, c.market_cap, c.fully_diluted_valuation, c.total_volume, c.circulating_supply, c.max_supply, c.total_supply, c.ath, c.ath_change_percentage]); }
  if (m.size) store.set('as.cg', { ts: Date.now(), rows: [...m] });
  return (pro.cg = m);
}
async function paintInfo() {
  const a = pro.a, row = (label, value, line) => `<div class="info-row"><div><b>${label}</b><small>${line}</small></div><span class="mono">${value}</span></div>`;
  const big = (v) => (v == null ? '–' : fmtVol(v)), units = (v) => (v == null ? 'No limit' : Math.round(v).toLocaleString('en-US') + ' ' + esc(a.ico || a.t));
  const listed = a.listed ? new Date(a.listed).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';
  if (a.kind !== 'crypto') {
    $('tab-info').innerHTML = `<h3>${icon(a)} ${esc(a.name || a.t)}</h3><div class="info-grid"><div>
      ${row('What this is', esc(a.sub), 'A tokenised contract that follows the price of the real asset. You are not buying the share itself.')}
      ${row('Trading hours', '24 hours, 7 days', 'It keeps trading when the stock exchange is closed, so the price can move overnight and at weekends.')}
      ${row('Priced in', 'USDT', 'A digital dollar. 1 USDT is designed to stay worth 1 US dollar.')}
      ${row('Listed here since', listed, 'When this market first started trading.')}
      </div><div>
      ${row('Trades in 24 hours', fmtVol(a.vol), 'The dollar value traded in the last day. Higher means it is easier to buy and sell.')}
      ${row('Open interest', pro.oi ? fmtVol(pro.oi) : '–', TIP.oi)}
      ${row('Funding fee', pro.fund == null ? '–' : pro.fund.toFixed(4) + '%', TIP.fund)}
      </div></div><p class="note">Company figures such as market value and earnings are not shown because this is a price-tracking contract, not the share.</p>`;
    return;
  }
  $('tab-info').innerHTML = '<div class="skeleton">Loading coin information…</div>';
  const c = (await loadCG()).get((a.ico || a.t).toUpperCase());
  if (pro.a !== a) return;
  if (!c) { $('tab-info').innerHTML = `<h3>${icon(a)} ${esc(a.name || a.t)}</h3><div class="info-grid"><div>${row('Listed here since', listed, 'When this market first started trading.')}${row('Trades in 24 hours', fmtVol(a.vol), 'The dollar value traded here in the last day.')}</div></div><p class="note">This is a smaller or newer coin, so wider market figures are not available for it.</p>`; return; }
  const [name, rank, cap, fdv, vol, circ, max, total, ath, athChg] = c;
  $('tab-info').innerHTML = `<h3>${icon(a)} ${esc(name)}</h3><div class="info-grid"><div>
    ${row('Rank', rank ? 'No. ' + rank : '–', 'Its position among all coins by total value. No. 1 is the biggest.')}
    ${row('Market value', big(cap), 'Price multiplied by all coins in circulation: what the whole coin is worth today.')}
    ${row('Value if all coins existed', big(fdv), 'The same sum using every coin that will ever exist, including ones not released yet.')}
    ${row('Traded in 24 hours', big(vol), 'Dollar value traded across all exchanges in the last day.')}
    ${row('Trading vs value', cap ? ((vol / cap) * 100).toFixed(2) + '%' : '–', 'How much of the coin\'s value changed hands today. Higher means a busier market.')}
    </div><div>
    ${row('Coins in circulation', units(circ), 'How many coins people can actually hold and trade right now.')}
    ${row('Maximum ever', units(max), 'The hard limit on coins that can ever exist. "No limit" means more can keep being created.')}
    ${row('Created so far', units(total), 'All coins made to date, including any that are locked up.')}
    ${row('Highest price ever', ath ? fmtPx(ath) : '–', 'The record price this coin has reached.')}
    ${row('Below its record', athChg == null ? '–' : athChg.toFixed(1) + '%', 'How far today\'s price is from that record.')}
    </div></div><p class="note">Coin figures from CoinGecko, for reference only.</p>`;
}

/* ---------- Trading data tab ---------- */
const DATA = [
  ['oi', 'Open interest', 'Total value of positions still open. Rising with price = new money backing the move; falling = traders are closing out.', 'openInterestHist', '#f7931a', (r) => +r.sumOpenInterestValue, (v) => fmtVol(v)],
  ['ls', 'Long vs short (all traders)', 'The share of all accounts betting on a rise. Very one-sided crowds are often wrong at turning points.', 'globalLongShortAccountRatio', '#3b82f6', (r) => +r.longAccount * 100, (v) => `${v.toFixed(0)}% betting on a rise`],
  ['ta', 'Top traders by account', 'The same split, but only for the largest accounts. Shows what the big players are doing.', 'topLongShortAccountRatio', '#8b5cf6', (r) => +r.longAccount * 100, (v) => `${v.toFixed(0)}% betting on a rise`],
  ['tp', 'Top traders by money', 'How much of the big players\' money is on the rising side, rather than how many of them.', 'topLongShortPositionRatio', '#0a9d6c', (r) => +r.longAccount * 100, (v) => `${v.toFixed(0)}% of money on a rise`],
  ['tk', 'Buyers vs sellers in a hurry', 'Of the trades where someone paid up to trade immediately, the share that were buys. Above 50% means buyers are more eager.', 'takerlongshortRatio', '#e5484d', (r) => (+r.buyVol / (+r.buyVol + +r.sellVol || 1)) * 100, (v) => `${v.toFixed(0)}% eager buyers`],
];
function loadTradingData() {
  const a = pro.a;
  if (!$('dataGrid').children.length) $('dataGrid').innerHTML = DATA.map(([k, title, line]) => `<div class="data-card"><h4>${title}</h4><b id="dv-${k}">–</b><p>${line}</p><div class="data-chart"><div id="dc-${k}"></div></div></div>`).join('');
  DATA.forEach(([k, , , ep, col, pick, words]) => {
    getJSON(`${API.perp.data}/${ep}?symbol=${a.sym}&period=${pro.period}&limit=60`).then((rows) => {
      if (pro.a !== a) return;
      if (!rows.length) { setT('dv-' + k, 'No data for this market'); if (pro.charts[k]) pro.charts[k].s.setData([]); return; }
      const pts = rows.map((r) => ({ time: r.timestamp / 1000, value: pick(r) }));
      setT('dv-' + k, words(pts[pts.length - 1].value));
      if (!LW) return;
      if (!pro.charts[k]) {
        const c = LW.createChart($('dc-' + k), { ...chartBase, handleScroll: false, handleScale: false });
        pro.charts[k] = { c, s: c.addAreaSeries({ lineColor: col, topColor: col + '33', bottomColor: col + '00', lineWidth: 2, priceLineVisible: false, priceFormat: k === 'oi' ? { type: 'volume' } : { type: 'custom', formatter: (v) => v.toFixed(0) + '%', minMove: 0.1 } }) };
      }
      pro.charts[k].s.setData(pts); pro.charts[k].c.timeScale().fitContent();
    }).catch(() => setT('dv-' + k, 'No data for this market'));
  });
}

/* ---------- top movers: built from the live price stream ---------- */
const movers = { events: [], filter: 'all', snaps: new Map(), hi: new Map(), lo: new Map(), last: new Map() };
const moverPool = () => all().filter((a) => a.vol > (a.kind === 'crypto' ? 5e6 : 1e6));
function addMover(a, pct, label, up, key, cool) {
  const now = Date.now();
  if (now - (movers.last.get(key) || 0) < cool) return;
  movers.last.set(key, now);
  movers.events.unshift({ id: a.id, t: a.t, kind: a.kind, pct, label, up, at: now });
  if (movers.events.length > 80) movers.events.length = 80;
}
function scanMovers() {
  for (const a of moverPool()) {
    const arr = movers.snaps.get(a.id) || [];
    arr.push(a.price); if (arr.length > 16) arr.shift(); movers.snaps.set(a.id, arr);
    if (arr.length >= 4) {
      const chg = (a.price / arr[0] - 1) * 100, mins = Math.max(1, Math.round(((arr.length - 1) * 20) / 60));
      if (Math.abs(chg) >= (a.kind === 'crypto' ? 1.5 : 0.8)) addMover(a, chg, `${mins}-minute ${chg > 0 ? 'jump' : 'drop'}`, chg > 0, a.id + (chg > 0 ? 'u' : 'd'), 5 * 60e3);
    }
    const h = movers.hi.get(a.id), l = movers.lo.get(a.id);
    if (h && a.high > h * 1.00001) addMover(a, a.chg, 'New 24-hour high', true, a.id + 'h', 10 * 60e3);
    if (l && a.low < l * 0.99999) addMover(a, a.chg, 'New 24-hour low', false, a.id + 'l', 10 * 60e3);
    movers.hi.set(a.id, a.high); movers.lo.set(a.id, a.low);
  }
  paintMoversList();
}
function initMovers() {
  const pool = moverPool().sort((x, y) => y.chg - x.chg);
  pool.slice(0, 6).forEach((a) => addMover(a, a.chg, 'Up most in 24 hours', true, a.id + 's', 0));
  pool.slice(-6).reverse().forEach((a) => addMover(a, a.chg, 'Down most in 24 hours', false, a.id + 's', 0));
  scanMovers();
  setInterval(scanMovers, 20000);
}
function paintMoversList() {
  const list = movers.events.filter((e) => movers.filter === 'all' || (movers.filter === 'up') === e.up);
  setHTML('moversList', list.slice(0, 40).map((e) => `<div class="mvr" data-go="${e.id}"><div><b>${esc(e.t)}</b><span class="kind">${e.kind === 'crypto' ? 'Crypto' : e.kind === 'stocks' ? 'Stock' : 'Commodity'}</span><small>${hhmmss(e.at)}</small></div>
    <div><b class="mono ${e.up ? 'up' : 'down'}">${fmtPct(e.pct)}</b><small>${e.label}</small></div></div>`).join('') || '<div class="skeleton">Nothing yet.</div>');
}

/* ---------- the "bot" strip: this market's own five-step reading ---------- */
function paintMarketBot(s, hi, lo) {
  const a = sel, fg = fgInfo(s.fg), node = (n, title, value, line, c = '') => `<div class="mb-node ${c}"><span class="fstep"><b>${n}</b>${title}</span><strong>${value}</strong><small>${line}</small></div>`;
  const verdict = s.tone === 'good' ? 'Conditions favour buyers' : s.tone === 'bad' ? 'Conditions favour sellers' : 'Mixed picture: wait for clarity';
  $('mbot').dataset.id = a.id; $('mbot')._v = null;
  $('mbot').innerHTML = `<div class="mb-title">${icon(a, 'sm')}<b>${esc(a.t)} bot</b><span>reads this market live, on ${TF_WORDS[ch.tf]} candles</span></div><div class="mb-row">
    ${node(1, 'Live price', '<span data-f="p"></span>', '<span data-f="c"></span> in 24 hours')}
    ${node(2, 'Trend', s.up ? '<span class="up">▲ Rising</span>' : '<span class="down">▼ Falling</span>', s.up ? 'Price is above its average' : 'Price is below its average')}
    ${node(3, 'Momentum', s.rsi.toFixed(0) + '<i>/100</i>', s.rsi < 30 ? 'Sold very hard' : s.rsi > 70 ? 'Bought very hard' : s.rsi >= 50 ? 'Buyers slightly ahead' : 'Sellers slightly ahead')}
    ${node(4, 'Mood', `<span style="color:${fg[1]}">${s.fg}</span>`, fg[0])}
    ${node(5, 'Reading', s.setup, verdict, 'mb-out ' + (s.tone || 'flat'))}</div>`;
  paint();
}

/* ---------- start ---------- */
function onMarketSelect(a) {
  pro.a = a; pro.mark = pro.index = pro.fund = pro.oi = null; pro.trades = [];
  paintProHead(); paintTrades(); connectPro(a); loadTrades(a); pollOI(); togglePick(false);
  if (pro.tab === 'info') paintInfo();
  if (pro.tab === 'data') loadTradingData();
}
function initTerminal() {
  segment($('proTabs'), (d) => { pro.tab = d.tab; ['chart', 'info', 'data'].forEach((t) => { $('tab-' + t).hidden = t !== d.tab; }); if (d.tab === 'info') paintInfo(); if (d.tab === 'data') loadTradingData(); });
  segment($('sideTabs'), (d) => { $('tradesBox').hidden = d.side !== 'trades'; $('moversBox').hidden = d.side !== 'movers'; });
  segment($('dataPeriod'), (d) => { pro.period = d.p; loadTradingData(); });
  segment($('moverSeg'), (d) => { movers.filter = d.f; paintMoversList(); });
  segment($('pickTabs'), (d) => { pro.pick.tab = d.k; paintPick(); });
  $('pickQ').addEventListener('input', (e) => { pro.pick.q = e.target.value; paintPick(); });
  $('pickHead').addEventListener('click', (e) => { const b = e.target.closest('[data-ps]'); if (!b) return; const s = pro.pick; if (s.sort === b.dataset.ps) s.dir *= -1; else { s.sort = b.dataset.ps; s.dir = s.sort === 't' ? 1 : -1; } paintPick(); });
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-star]')) return;
    const row = e.target.closest('[data-pk]');
    if (row) return select(row.dataset.pk, false);
    if (e.target.closest('[data-open-pick]')) return togglePick();
    if (!e.target.closest('#mktPanel')) togglePick(false);
  });
  setInterval(tickPro, 1000);
  setInterval(pollOI, 15000);
  initMovers();
}
