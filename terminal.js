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
  const seen = new Set(); learnCoinLogos(pages.flat().filter((c) => { const k = c.symbol.toUpperCase(); if (seen.has(k)) return false; seen.add(k); return true; }).map((c) => [c.symbol.toUpperCase(), c.image && c.image.replace('/large/', '/small/')]));
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

/* ---------- this market's own bot: five wired cards, the same idea as the home page ---------- */
function paintMarketBot(s, hi, lo) {
  const a = sel, fg = fgInfo(s.fg), nm = esc(a.name || a.t);
  const chk = (state, text) => `<li class="${state}">${text}</li>`;
  const verdict = s.tone === 'good' ? 'Conditions favour buyers' : s.tone === 'bad' ? 'Conditions favour sellers' : s.tone === 'hot' ? 'Stretched: handle with care' : 'Mixed picture: wait for clarity';
  const tone = s.tone === 'good' ? 'good' : s.tone === 'bad' ? 'bad' : 'mid';
  const box = $('mbot');
  box.dataset.id = a.id; box._v = null;
  box.innerHTML = `<svg class="flow-wires" aria-hidden="true"></svg>
    <div class="flow-col">
      <div class="fcard" id="fA"><span class="fstep"><b>1</b>Live price</span>
        <div class="mb-px">${icon(a)}<div><b>${esc(a.t)}</b><small>${nm}</small></div></div>
        <strong class="mb-big" data-f="p"></strong>
        <div class="frow"><b>24h change</b><span class="mono" data-f="c"></span></div>
        <footer><i class="dot on"></i><b id="mbTps">–</b> trades a second</footer></div>
      <div class="fcard" id="fB"><span class="fstep"><b>2</b>Chart check</span>
        <div class="frow"><b>Trend</b><span>${s.up ? '<em class="up">▲ Rising</em>' : '<em class="down">▼ Falling</em>'}</span></div>
        <div class="frow"><b>Momentum</b><span class="mono">${s.rsi.toFixed(0)}/100</span></div>
        <div class="gauge"><i style="left:${clamp(s.rsi, 0, 100)}%"></i></div>
        <footer><i class="dot on"></i><b>${ch.k.length}</b> candles of ${TF_WORDS[ch.tf]} read</footer></div>
    </div>
    <div class="fengine" id="fE"><span class="fstep"><b>3</b>${esc(a.t)} bot decides</span>
      <div class="fgear"><span></span></div>
      <div><h3>${nm} bot</h3><p>Reads this market live</p>
        <ul class="fchecks">
          ${chk(s.up ? 'ok' : 'no', s.up ? 'Trend is rising' : 'Trend is falling')}
          ${chk(s.rsi > 70 || s.rsi < 30 ? 'mid' : s.rsi >= 50 ? 'ok' : 'no', s.rsi > 70 ? 'Bought very hard' : s.rsi < 30 ? 'Sold very hard' : s.rsi >= 50 ? 'Buyers slightly ahead' : 'Sellers slightly ahead')}
          ${chk(s.volRatio > 1.5 ? 'ok' : 'mid', s.volRatio == null ? 'Activity unknown' : s.volRatio > 1.5 ? `Busy: ${s.volRatio.toFixed(1)}x normal` : `Activity ${s.volRatio.toFixed(1)}x normal`)}
          ${chk(s.fg > 55 ? 'ok' : s.fg < 45 ? 'no' : 'mid', `Mood: ${fg[0].toLowerCase()} (${s.fg})`)}
        </ul></div>
      <footer><i class="dot on"></i>Setup score <b>${s.score}</b> / 100</footer></div>
    <div class="flow-col">
      <div class="fcard" id="fC"><span class="fstep"><b>4</b>Buyers vs sellers</span>
        <div id="mbPress" class="fscan">Waiting for trades…</div>
        <div class="frow"><b>Mood</b><span class="fg-pill" style="--c:${fg[1]}"><b>${s.fg}</b>${fg[0]}</span></div></div>
      <div class="fcard fresult ${tone}" id="fD"><span class="fstep"><b>5</b>Reading</span>
        <b class="mb-verdict">${s.setup}</b><p>${verdict}</p>
        ${sparkSVG(ch.k.slice(-90).map((x) => x.c), 200, 46, true)}
        <a href="#analysis">See the full analysis ↓</a></div>
    </div>`;
  paint(); paintBotLive(); drawWires('mbot');
}
function paintBotLive() { // the parts of the bot that move every second
  const now = Date.now(), recent = pro.trades.filter((t) => now - t.t < 5000).length;
  setT('mbTps', pro.trades.length ? (recent / 5).toFixed(recent < 50 ? 1 : 0) : '–');
  if (!pro.trades.length) return;
  const buy = pro.trades.reduce((s, t) => s + (t.buy ? t.usd : 0), 0), tot = pro.trades.reduce((s, t) => s + t.usd, 0), pct = tot ? (buy / tot) * 100 : 50;
  setHTML('mbPress', `<div class="split"><i style="width:${pct}%"></i><u></u></div><div class="split-lbl"><span class="up">Buyers ${pct.toFixed(0)}%</span><span class="down">Sellers ${(100 - pct).toFixed(0)}%</span></div>`);
}

/* ---------- performance tiles, money-flow donut, daily bars ---------- */
const perf = { nb: null, oi: null };
function barLineChart(id, barFmt) {
  const c = LW.createChart($(id), { ...chartBase, handleScroll: false, handleScale: false, leftPriceScale: { visible: true, borderColor: '#e6eaf0' }, timeScale: { ...chartBase.timeScale, timeVisible: false } });
  return { c, bars: c.addHistogramSeries({ priceScaleId: 'left', priceFormat: { type: 'custom', formatter: barFmt, minMove: 1 }, priceLineVisible: false, lastValueVisible: false }), line: c.addLineSeries({ color: '#0b1220', lineWidth: 2, priceLineVisible: false, lastValueVisible: false }) };
}
async function loadPerf(a) {
  setT('perfTitle', `${a.t} price performance`);
  const money = (v) => (v < 0 ? '-' : '') + fmtVol(Math.abs(v));
  // 1) performance tiles from daily candles
  fetchKlines(a, '1d', 366).then((k) => {
    if (pro.a !== a) return;
    const c = k.map((x) => x.c), n = c.length, yStart = k.findIndex((x) => new Date(x.t).getUTCFullYear() === new Date().getUTCFullYear());
    const tile = (label, back) => {
      if (back == null || back < 1 || back >= n) return `<div class="ptile na"><small>${label}</small><b>–</b><em>Not listed that long</em></div>`;
      const seg = c.slice(n - 1 - back), chg = (seg[seg.length - 1] / seg[0] - 1) * 100;
      return `<div class="ptile"><div><small>${label}</small><b class="${cls(chg)}">${fmtPct(chg)}</b></div>${sparkSVG(seg, 120, 44, true)}</div>`;
    };
    $('perfTiles').innerHTML = tile('7 days', 7) + tile('30 days', 30) + tile('90 days', 90) + tile('180 days', 180) + tile('This year', yStart >= 0 && yStart < n - 1 ? n - 1 - yStart : null) + tile('1 year', 365);
    const price = k.slice(-31).map((x) => ({ time: Math.floor(x.t / 864e5) * 86400, value: x.c }));
    if (!LW) return;
    // 2) net buying per day
    getJSON(`${API.perp.data}/takerlongshortRatio?symbol=${a.sym}&period=1d&limit=30`).then((rows) => {
      if (pro.a !== a) return;
      if (!perf.nb) perf.nb = barLineChart('nbChart', money);
      const px = new Map(k.map((x) => [Math.floor(x.t / 864e5), x.c]));
      const pts = rows.map((r) => { const d = Math.floor(r.timestamp / 864e5), v = (+r.buyVol - +r.sellVol) * (px.get(d) || a.price); return { time: d * 86400, value: v, color: v >= 0 ? 'rgba(10,157,108,.75)' : 'rgba(229,72,77,.75)' }; });
      perf.nb.bars.setData(pts); perf.nb.line.setData(price.filter((p) => pts.length && p.time >= pts[0].time)); perf.nb.c.timeScale().fitContent();
      const sum = pts.reduce((s, p) => s + p.value, 0);
      $('nbNow').innerHTML = pts.length ? `<span class="${cls(sum)}">${money(sum)} net over ${pts.length} days</span>` : '';
    }).catch(() => {});
    // 3) open interest per day
    getJSON(`${API.perp.data}/openInterestHist?symbol=${a.sym}&period=1d&limit=30`).then((rows) => {
      if (pro.a !== a) return;
      if (!perf.oi) perf.oi = barLineChart('oiChart', (v) => fmtVol(v));
      const pts = rows.map((r) => ({ time: Math.floor(r.timestamp / 864e5) * 86400, value: +r.sumOpenInterestValue, color: 'rgba(247,147,26,.7)' }));
      perf.oi.bars.setData(pts); perf.oi.line.setData(price.filter((p) => pts.length && p.time >= pts[0].time)); perf.oi.c.timeScale().fitContent();
      if (pts.length > 1) { const d = (pts[pts.length - 1].value / pts[0].value - 1) * 100; $('oiNow').innerHTML = `<span class="${cls(d)}">${fmtPct(d, 1)} in ${pts.length} days</span>`; }
    }).catch(() => {});
  }).catch(() => { setHTML('perfTiles', '<div class="skeleton">No history available.</div>'); });
  // 4) money flow by order size, from the latest 1,000 trades
  getJSON(`${API.perp.rest}/aggTrades?symbol=${a.sym}&limit=1000`).then((rows) => {
    if (pro.a !== a || !rows.length) return;
    const tr = rows.map((r) => ({ usd: +r.p * +r.q, buy: !r.m })), sorted = tr.map((x) => x.usd).sort((x, y) => x - y);
    const p50 = sorted[Math.floor(sorted.length * 0.5)], p95 = sorted[Math.floor(sorted.length * 0.95)];
    const b = { in: [0, 0, 0], out: [0, 0, 0] };
    for (const x of tr) b[x.buy ? 'in' : 'out'][x.usd >= p95 ? 0 : x.usd >= p50 ? 1 : 2] += x.usd;
    const tin = b.in.reduce((s, v) => s + v, 0), tout = b.out.reduce((s, v) => s + v, 0), tot = tin + tout || 1, net = tin - tout;
    const segs = [[b.in[0], '#0a9d6c'], [b.in[1], '#3fc79a'], [b.in[2], '#9be3c9'], [b.out[2], '#f7b5b7'], [b.out[1], '#ee7b7f'], [b.out[0], '#e5484d']];
    let off = 0; const C = 2 * Math.PI * 54;
    const arcs = segs.map(([v, col]) => { const len = (v / tot) * C, s = `<circle cx="70" cy="70" r="54" fill="none" stroke="${col}" stroke-width="20" stroke-dasharray="${Math.max(0, len - 2)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`; off += len; return s; }).join('');
    const names = ['Large orders', 'Medium orders', 'Small orders'], row = (v, col, name) => `<div class="fl-row"><i style="background:${col}"></i><span>${name}</span><b class="mono">${fmtVol(v)}</b><em>${((v / tot) * 100).toFixed(1)}%</em></div>`;
    $('flowBox').innerHTML = `<div class="fl-col"><div class="fl-head"><small>Money in (buys)</small><b class="mono up">${fmtVol(tin)}</b></div>${[0, 1, 2].map((i) => row(b.in[i], segs[i][1], names[i])).join('')}</div>
      <div class="fl-donut"><svg viewBox="0 0 140 140">${arcs}</svg><div><b class="mono ${cls(net)}">${money(net)}</b><small>Net flow</small></div></div>
      <div class="fl-col"><div class="fl-head"><small>Money out (sells)</small><b class="mono down">${fmtVol(tout)}</b></div>${[0, 1, 2].map((i) => row(b.out[i], segs[5 - i][1], names[i])).join('')}</div>`;
  }).catch(() => setHTML('flowBox', '<div class="skeleton">No recent trades.</div>'));
}

/* ---------- start ---------- */
function onMarketSelect(a) {
  pro.a = a; pro.mark = pro.index = pro.fund = pro.oi = null; pro.trades = [];
  paintProHead(); paintTrades(); connectPro(a); loadTrades(a); pollOI(); togglePick(false);
  if (pro.tab === 'info') paintInfo();
  if (pro.tab === 'data') loadTradingData();
  if (has('perfTiles')) loadPerf(a);
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
  setInterval(() => { tickPro(); paintBotLive(); }, 1000);
  new ResizeObserver(() => drawWires('mbot')).observe($('mbot'));
  setInterval(pollOI, 15000);
  initMovers();
}
