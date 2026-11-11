/* AlphaStrats — live markets, charts, scanner and in-browser backtests.
   Market data comes from free public endpoints (no API key). Every market shown
   (crypto, tokenised stocks, commodities) is a USDT perpetual contract, which is
   where most of the trading volume is. Each page only starts the parts it contains. */

const API = { perp: {
  rest: 'https://fapi.binance.com/fapi/v1',
  data: 'https://fapi.binance.com/futures/data',
  ws: 'wss://fstream.binance.com/market/ws/!miniTicker@arr',
  stream: 'wss://fstream.binance.com/market/stream?streams=',
} };
const FEE = 0.0005;          // 0.05% per side in backtests
const PAGE = 20;             // table rows per page
const SCAN_TTL = 5 * 60e3;   // re-analyse a market after 5 minutes
const STABLES = new Set('USDC USD1 RLUSD RWUSD U FDUSD EUR BFUSD XUSD TUSD USDP DAI EURI AEUR USDE PYUSD BUSD USDEB'.split(' '));

const NAMES = {
  // crypto
  BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'BNB', XRP: 'XRP', DOGE: 'Dogecoin', ADA: 'Cardano', AVAX: 'Avalanche',
  LINK: 'Chainlink', SUI: 'Sui', LTC: 'Litecoin', DOT: 'Polkadot', TRX: 'TRON', ZEC: 'Zcash', PEPE: 'Pepe', NEAR: 'NEAR Protocol',
  UNI: 'Uniswap', HYPE: 'Hyperliquid', ENA: 'Ethena', ARB: 'Arbitrum', INJ: 'Injective', AAVE: 'Aave', WLD: 'Worldcoin', TAO: 'Bittensor',
  QNT: 'Quant', ONDO: 'Ondo', PAXG: 'PAX Gold', XAUT: 'Tether Gold', FIL: 'Filecoin', TRUMP: 'Official Trump', XLM: 'Stellar',
  FET: 'Fetch.ai', HBAR: 'Hedera', BCH: 'Bitcoin Cash', ICP: 'Internet Computer', SHIB: 'Shiba Inu', TON: 'Toncoin', APT: 'Aptos',
  OP: 'Optimism', ATOM: 'Cosmos', ETC: 'Ethereum Classic', POL: 'Polygon', RENDER: 'Render', SEI: 'Sei', TIA: 'Celestia', ALGO: 'Algorand',
  VET: 'VeChain', BONK: 'Bonk', WIF: 'dogwifhat', FLOKI: 'Floki', JUP: 'Jupiter', PENDLE: 'Pendle', LDO: 'Lido DAO', CRV: 'Curve',
  SAND: 'The Sandbox', MANA: 'Decentraland', GRT: 'The Graph', XTZ: 'Tezos', DASH: 'Dash', ASTER: 'Aster', PUMP: 'Pump.fun', ONE: 'Harmony',
  WBETH: 'Wrapped Beacon ETH', ZRO: 'LayerZero', ETHFI: 'Ether.fi', CAKE: 'PancakeSwap', STX: 'Stacks', IMX: 'Immutable', RUNE: 'THORChain',
};
const STOCK_NAMES = {
  AAPL: 'Apple', MSFT: 'Microsoft', NVDA: 'Nvidia', TSLA: 'Tesla', AMZN: 'Amazon', GOOGL: 'Alphabet', META: 'Meta Platforms', AMD: 'AMD',
  INTC: 'Intel', AVGO: 'Broadcom', TSM: 'TSMC', MU: 'Micron', QCOM: 'Qualcomm', ORCL: 'Oracle', NFLX: 'Netflix', COIN: 'Coinbase',
  MSTR: 'Strategy', PLTR: 'Palantir', HOOD: 'Robinhood', CRCL: 'Circle', BABA: 'Alibaba', PDD: 'PDD Holdings', SNDK: 'Sandisk',
  WDC: 'Western Digital', DELL: 'Dell', IBM: 'IBM', CRM: 'Salesforce', ADBE: 'Adobe', NOW: 'ServiceNow', CRWD: 'CrowdStrike',
  PANW: 'Palo Alto Networks', SNOW: 'Snowflake', SHOP: 'Shopify', UBER: 'Uber', DIS: 'Disney', WMT: 'Walmart', COST: 'Costco',
  HD: 'Home Depot', MCD: "McDonald's", KO: 'Coca-Cola', NKE: 'Nike', JPM: 'JPMorgan Chase', BAC: 'Bank of America', GS: 'Goldman Sachs',
  V: 'Visa', PYPL: 'PayPal', BRKB: 'Berkshire Hathaway', LLY: 'Eli Lilly', NVO: 'Novo Nordisk', PFE: 'Pfizer', MRK: 'Merck', ABBV: 'AbbVie',
  UNH: 'UnitedHealth', MRNA: 'Moderna', XOM: 'Exxon Mobil', OXY: 'Occidental', CAT: 'Caterpillar', ASML: 'ASML', ARM: 'Arm',
  SMCI: 'Super Micro', MRVL: 'Marvell', AMAT: 'Applied Materials', LRCX: 'Lam Research', KLAC: 'KLA', TXN: 'Texas Instruments',
  CSCO: 'Cisco', ANET: 'Arista Networks', NET: 'Cloudflare', DDOG: 'Datadog', MDB: 'MongoDB', ZS: 'Zscaler', ZM: 'Zoom', TEAM: 'Atlassian',
  RDDT: 'Reddit', GME: 'GameStop', AMC: 'AMC Entertainment', RIVN: 'Rivian', SOFI: 'SoFi', MARA: 'MARA Holdings', IREN: 'IREN', HUT: 'Hut 8',
  RKLB: 'Rocket Lab', ASTS: 'AST SpaceMobile', IONQ: 'IonQ', OKLO: 'Oklo', SMR: 'NuScale Power', CRWV: 'CoreWeave', NBIS: 'Nebius',
  APP: 'AppLovin', CVNA: 'Carvana', DKNG: 'DraftKings', HIMS: 'Hims & Hers', SONY: 'Sony', NOK: 'Nokia', MELI: 'MercadoLibre', EBAY: 'eBay',
  ACN: 'Accenture', AMGN: 'Amgen', GEV: 'GE Vernova', VST: 'Vistra', CEG: 'Constellation Energy', VRT: 'Vertiv', GLW: 'Corning',
  TTWO: 'Take-Two', STM: 'STMicroelectronics', TER: 'Teradyne', SNPS: 'Synopsys', LITE: 'Lumentum', COHR: 'Coherent', CIEN: 'Ciena',
  FLEX: 'Flex', HPE: 'HP Enterprise', AKAM: 'Akamai', PATH: 'UiPath', GTLB: 'GitLab', IBKR: 'Interactive Brokers', BX: 'Blackstone',
  MDT: 'Medtronic', MP: 'MP Materials', EQT: 'EQT', DJT: 'Trump Media', RUM: 'Rumble', GPRO: 'GoPro', WEN: "Wendy's", BE: 'Bloom Energy',
  FLNC: 'Fluence Energy', TEM: 'Tempus AI', VKTX: 'Viking Therapeutics', TWST: 'Twist Bioscience', BMNR: 'BitMine', APLD: 'Applied Digital',
  ALAB: 'Astera Labs', CRDO: 'Credo', AAOI: 'Applied Optoelectronics', USAR: 'USA Rare Earth', ONDS: 'Ondas', RDW: 'Redwire',
  SPY: 'S&P 500 ETF', QQQ: 'Nasdaq 100 ETF', IWM: 'Russell 2000 ETF', SOXL: 'Semiconductors 3x Bull ETF', SOXS: 'Semiconductors 3x Bear ETF',
  TQQQ: 'Nasdaq 3x Bull ETF', SQQQ: 'Nasdaq 3x Bear ETF', SMH: 'Semiconductor ETF', GDX: 'Gold Miners ETF', XLE: 'Energy ETF',
  XBI: 'Biotech ETF', EWY: 'South Korea ETF', EWJ: 'Japan ETF', EWT: 'Taiwan ETF', EWZ: 'Brazil ETF', BITO: 'Bitcoin Strategy ETF',
  NVDL: 'Nvidia 2x ETF', TSLL: 'Tesla 2x ETF', URNM: 'Uranium Miners ETF', KORU: 'South Korea 3x Bull ETF',
  SAMSUNG: 'Samsung Electronics', SKHYNIX: 'SK Hynix', HYUNDAI: 'Hyundai Motor', NAVER: 'Naver', LGELECTRONICS: 'LG Electronics',
  TENCENT: 'Tencent', MEITUAN: 'Meituan', BYD: 'BYD', POPMART: 'Pop Mart', KUAISHOU: 'Kuaishou', OPENAI: 'OpenAI', ANTHROPIC: 'Anthropic',
  XAU: 'Gold', XAG: 'Silver', XPT: 'Platinum', XPD: 'Palladium', COPPER: 'Copper', CL: 'WTI Crude Oil', BZ: 'Brent Crude Oil',
  NATGAS: 'Natural Gas', USDBRL: 'US Dollar / Brazilian Real',
};
const TYPE_LABEL = {
  EQUITY: 'US stock', HK_EQUITY: 'Hong Kong stock', KR_EQUITY: 'Korea stock', CN_EQUITY: 'China stock',
  PREMARKET: 'Pre-IPO', COMMODITY: 'Commodity', FX: 'Currency',
};

const A = new Map();   // every market, keyed "c:BTCUSDT" (crypto) or "p:NVDAUSDT" (stocks, commodities)
const stats = { ticks: 0, ticksWindow: 0, bars: 0, runs: 0, analysed: 0 };
const wsUp = { perp: false };
const all = (kind) => { const out = []; for (const a of A.values()) if (!kind || kind === 'all' || a.kind === kind) out.push(a); return out; };
const byVol = (x, y) => (y.vol || 0) - (x.vol || 0);
let sel = null;        // market shown in the chart terminal and backtest lab

/* ---------- indicators ---------- */
function ema(v, n) {
  const out = new Array(v.length).fill(null);
  if (v.length < n) return out;
  let e = 0;
  for (let i = 0; i < n; i++) e += v[i];
  e /= n; out[n - 1] = e;
  const k = 2 / (n + 1);
  for (let i = n; i < v.length; i++) { e = v[i] * k + e * (1 - k); out[i] = e; }
  return out;
}
function rsi(v, n = 14) {
  const out = new Array(v.length).fill(null);
  if (v.length <= n) return out;
  let g = 0, l = 0;
  for (let i = 1; i <= n; i++) { const d = v[i] - v[i - 1]; if (d > 0) g += d; else l -= d; }
  g /= n; l /= n;
  out[n] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
  for (let i = n + 1; i < v.length; i++) {
    const d = v[i] - v[i - 1];
    g = (g * (n - 1) + Math.max(d, 0)) / n;
    l = (l * (n - 1) + Math.max(-d, 0)) / n;
    out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  return out;
}
function analyse(c, k) {
  if (!c || c.length < 60) return null;
  const i = c.length - 1;
  const e20 = ema(c, 20)[i], e50 = ema(c, 50)[i], r = rsi(c)[i], price = c[i];
  const high = Math.max(...c), dd = ((high - price) / high) * 100, up = e20 > e50;
  let score = 50 + (up ? 18 : -18) + clamp((50 - r) * 0.8, -20, 20) + (price > e50 ? 6 : -6) + clamp(dd, 0, 10) * 0.6;
  score = Math.round(clamp(score, 0, 100));
  let setup, tone, why;
  if (r < 30 && up) { setup = 'Oversold in uptrend'; tone = 'good'; why = 'Deep pullback while the trend is still up.'; }
  else if (r < 30) { setup = 'Oversold'; tone = 'hot'; why = 'Stretched to the downside, but the trend has not turned yet.'; }
  else if (up && r < 45) { setup = 'Pullback in uptrend'; tone = 'good'; why = 'Trend is up and momentum has cooled: the classic dip-buy zone.'; }
  else if (r > 70) { setup = 'Overheated'; tone = 'hot'; why = 'Strong, but momentum is extended. Chasing here carries more risk.'; }
  else if (up) { setup = 'Uptrend'; tone = 'good'; why = 'EMA 20 above EMA 50 with healthy momentum.'; }
  else if (r < 40) { setup = 'Weak, near oversold'; tone = ''; why = 'Downtrend approaching oversold. Wait for a trend turn.'; }
  else { setup = 'Downtrend'; tone = 'bad'; why = 'EMA 20 below EMA 50. No long setup by these rules.'; }
  // Fear & greed (0-100), our own blend: momentum 35%, trend 25%, place in recent range 25%, volatility 15%
  const low = Math.min(...c), pos = high > low ? ((price - low) / (high - low)) * 100 : 50;
  const trendS = clamp(50 + (price / e50 - 1) * 800, 0, 100);
  const sd = (from) => { let m = 0, q = 0, n = 0; for (let j = Math.max(1, from); j < c.length; j++) { m += c[j] / c[j - 1] - 1; n++; } m /= n; for (let j = Math.max(1, from); j < c.length; j++) q += (c[j] / c[j - 1] - 1 - m) ** 2; return Math.sqrt(q / n); };
  const vLong = sd(1), volS = vLong > 0 ? clamp(50 - (sd(c.length - 24) / vLong - 1) * 50, 0, 100) : 50;
  const fg = Math.round(0.35 * r + 0.25 * trendS + 0.25 * pos + 0.15 * volS);
  let volRatio = null, breakout = false;
  if (k && k.length > 60) { // last completed candle against the 20 before it, and price against the prior 100-candle high
    const n = k.length - 2; let s = 0, hh = -Infinity;
    for (let j = n - 20; j < n; j++) s += k[j].v;
    volRatio = s > 0 ? k[n].v / (s / 20) : null;
    for (let j = Math.max(0, i - 100); j < i; j++) hh = Math.max(hh, k[j].h);
    breakout = price >= hh;
  }
  return { rsi: r, up, dd, score, setup, tone, why, e20, e50, volRatio, breakout, fg };
}

function fgInfo(v) { // label and colour for a fear & greed score
  return v < 25 ? ['Extreme fear', '#d63a3f'] : v < 45 ? ['Fear', '#f0883e'] : v <= 55 ? ['Neutral', '#c9a227'] : v < 75 ? ['Greed', '#4fb477'] : ['Extreme greed', '#0a9d6c'];
}
function fgGauge(v) {
  const [label, col] = fgInfo(v), ang = Math.PI * (1 - v / 100), x = 100 + 80 * Math.cos(ang), y = 96 - 80 * Math.sin(ang);
  return `<div class="fg"><svg viewBox="0 0 200 112"><defs><linearGradient id="fgG" x1="0" x2="1"><stop offset="0" stop-color="#e5484d"/><stop offset=".3" stop-color="#f0883e"/><stop offset=".5" stop-color="#e3c23c"/><stop offset=".75" stop-color="#7fca8f"/><stop offset="1" stop-color="#0a9d6c"/></linearGradient></defs>
    <path d="M20 96 A80 80 0 0 1 180 96" fill="none" stroke="url(#fgG)" stroke-width="13" stroke-linecap="round"/>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="#fff" stroke="${col}" stroke-width="5"/>
    <text x="100" y="82" text-anchor="middle" class="fg-num">${v}</text><text x="100" y="104" text-anchor="middle" class="fg-lbl" fill="${col}">${label}</text></svg></div>`;
}
const fgHistRows = (rows) => (rows.length ? `<div class="fg-hist">${rows.map(([l, v]) => `<div><span>${l}</span><b class="fg-chip" style="--c:${fgInfo(v)[1]}">${v}</b><em>${fgInfo(v)[0]}</em></div>`).join('')}</div>` : '');

/* ---------- data loading ---------- */
async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return r.json();
}
function setTicker(a, price, open, high, low, vol) {
  if (!isFinite(price) || price <= 0) return;
  a.price = price;
  if (open > 0) a.chg = ((price - open) / open) * 100;
  if (high) a.high = high;
  if (low) a.low = low;
  if (vol != null) a.vol = vol;
}
const coinName = (base) => base.replace(/^(1000000|1000|1M)(?=[A-Z])/, ''); // 1000PEPE is PEPE priced per thousand
async function loadMarkets() {
  const [info, rows] = await Promise.all([getJSON(API.perp.rest + '/exchangeInfo'), getJSON(API.perp.rest + '/ticker/24hr')]);
  const tick = new Map(rows.map((r) => [r.symbol, r]));
  PERP.tick = tick;
  for (const s of info.symbols) {
    if (s.status !== 'TRADING' || s.quoteAsset !== 'USDT') continue;
    const r = tick.get(s.symbol), t = s.baseAsset;
    if (!r) continue;
    let a;
    if (s.contractType === 'TRADIFI_PERPETUAL') {
      const kind = s.underlyingType === 'COMMODITY' || s.underlyingType === 'FX' ? 'commodities' : 'stocks';
      a = { t, kind, sub: TYPE_LABEL[s.underlyingType] || 'Stock', name: STOCK_NAMES[t] || '' };
    } else if (s.contractType === 'PERPETUAL' && s.underlyingType === 'COIN') {
      if (STABLES.has(t)) continue;
      const base = coinName(t);
      a = { t, ico: base, kind: 'crypto', sub: 'Crypto', name: NAMES[base] || '' };
    } else continue;
    Object.assign(a, { id: 'p:' + s.symbol, sym: s.symbol, src: 'perp', listed: s.onboardDate });
    setTicker(a, +r.lastPrice, +r.openPrice, +r.highPrice, +r.lowPrice, +r.quoteVolume);
    a.volBase = +r.volume;
    if (a.price && a.vol > 0) A.set(a.id, a);
  }
  return A.size;
}
async function refreshREST() { // fallback while the stream is down
  const rows = await getJSON(API.perp.rest + '/ticker/24hr');
  for (const r of rows) { const a = A.get('p:' + r.symbol); if (a) { setTicker(a, +r.lastPrice, +r.openPrice, +r.highPrice, +r.lowPrice, +r.quoteVolume); a.volBase = +r.volume; } }
}
let sock = null, lastMsg = 0;
function connect() {
  const retry = () => setTimeout(connect, 4000);
  let ws;
  try { ws = new WebSocket(API.perp.ws); } catch (e) { return retry(); }
  sock = ws;
  ws.onopen = () => { lastMsg = Date.now(); wsUp.perp = true; paintFeed(); };
  ws.onmessage = (ev) => {
    lastMsg = Date.now();
    const rows = JSON.parse(ev.data);
    if (!Array.isArray(rows)) return;
    for (const d of rows) {
      const a = A.get('p:' + d.s);
      if (!a) continue;
      stats.ticks++; stats.ticksWindow++;
      setTicker(a, +d.c, +d.o, +d.h, +d.l, +d.q);
      a.volBase = +d.v;
    }
  };
  ws.onclose = () => { wsUp.perp = false; paintFeed(); retry(); };
  ws.onerror = () => ws.close();
}
setInterval(() => { // safety net: if the stream is down or has gone silent, poll prices and reconnect
  if (!A.size) return;
  const silent = wsUp.perp && Date.now() - lastMsg > 12000;
  if (!wsUp.perp || silent) refreshREST().catch(() => {});
  if (silent && sock) sock.close();
}, 6000);

// Candle requests go through a small queue so we never flood the data source.
const queue = []; let active = 0;
function enqueue(fn) { return new Promise((res, rej) => { queue.push({ fn, res, rej }); pump(); }); }
function pump() {
  while (active < 6 && queue.length) {
    const j = queue.shift(); active++;
    j.fn().then(j.res, j.rej).finally(() => { active--; pump(); });
  }
}
function fetchKlines(a, interval, limit) {
  return enqueue(async () => {
    const rows = await getJSON(`${API[a.src].rest}/klines?symbol=${a.sym}&interval=${interval}&limit=${limit}`);
    stats.bars += rows.length;
    return rows.map((r) => ({ t: r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: +r[5] }));
  });
}
function ensureScan(a, tf = '1h') { // analysis per market and timeframe, cached
  a.ks = a.ks || {}; a._ps = a._ps || {};
  const hit = a.ks[tf];
  if (hit && Date.now() - hit.ts < SCAN_TTL) return Promise.resolve(hit);
  if (a._ps[tf]) return a._ps[tf];
  a._ps[tf] = fetchKlines(a, tf, 200).then((k) => {
    const closes = k.map((x) => x.c);
    if (!a.k && tf === '1h') stats.analysed++;
    a.ks[tf] = { closes, scan: analyse(closes, k), ts: Date.now() };
    if (tf === '1h') a.k = a.ks[tf]; // the table, flow diagram and readouts use the 1-hour view
    return a.ks[tf];
  }).catch(() => null).finally(() => { a._ps[tf] = null; });
  return a._ps[tf];
}

/* ---------- live painting ---------- */
// Anything with data-id is kept in sync with its market a few times a second.
function paint() {
  document.querySelectorAll('[data-id]').forEach((el) => {
    const a = A.get(el.dataset.id);
    if (!a || a.price == null) return;
    if (el._v === a.price && el._c === a.chg) return;
    const dir = el._v == null ? 0 : a.price > el._v ? 1 : a.price < el._v ? -1 : 0;
    el._v = a.price; el._c = a.chg;
    el.querySelectorAll('[data-f]').forEach((n) => {
      switch (n.dataset.f) {
        case 'p':
          n.textContent = fmtPx(a.price);
          if (dir) { n.classList.remove('flash-up', 'flash-down'); n.classList.add(dir > 0 ? 'flash-up' : 'flash-down'); clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove('flash-up', 'flash-down'), 380); }
          break;
        case 'c': n.textContent = fmtPct(a.chg); n.classList.toggle('up', a.chg >= 0); n.classList.toggle('down', a.chg < 0); break;
        case 'v': n.textContent = fmtVol(a.vol); break;
        case 'h': n.textContent = fmtPx(a.high); break;
        case 'l': n.textContent = fmtPx(a.low); break;
        case 'm': n.style.left = (a.high > a.low ? clamp(((a.price - a.low) / (a.high - a.low)) * 100, 0, 100) : 50) + '%'; break;
      }
    });
  });
  tickChart();
}
function paintFeed() {
  const c = 'dot ' + (wsUp.perp ? 'on' : 'off');
  if ($('feedPill')) { $('feedPill').querySelector('.dot').className = c; $('feedText').textContent = wsUp.perp ? 'Live' : 'Reconnecting'; }
  if ($('botFeedDot')) $('botFeedDot').className = c;
}

/* ---------- tape ---------- */
function buildTape() {
  const picks = [...all('crypto').sort(byVol).slice(0, 12), ...all('stocks').sort(byVol).slice(0, 14)];
  const html = picks.map((a) => `<span class="tape-item" data-id="${a.id}" data-go="${a.id}"><b>${esc(a.t)}</b><span data-f="p"></span><span data-f="c"></span></span>`).join('');
  $('tape').innerHTML = html + html;
}

/* ---------- overview: breadth tiles, featured card, movers ---------- */
function paintBreadth() {
  const tile = (label, kind) => {
    const list = all(kind), up = list.filter((a) => a.chg >= 0).length, pct = list.length ? (up / list.length) * 100 : 0;
    return `<div class="panel tile"><small>${label} · ${list.length} markets</small>
      <div class="split"><i style="width:${pct}%"></i><u></u></div>
      <div class="split-lbl"><span class="up">${up} rising</span><span class="down">${list.length - up} falling</span></div></div>`;
  };
  const vol = (label, kind) => {
    const list = all(kind), v = list.reduce((s, a) => s + (a.vol || 0), 0);
    const avg = list.length ? list.reduce((s, a) => s + (a.chg || 0), 0) / list.length : 0;
    return `<div class="panel tile"><small>${label} 24h volume</small><b>${fmtVol(v)}</b><div class="split-lbl"><span style="color:var(--muted)">Average move</span><span class="${cls(avg)}">${fmtPct(avg)}</span></div></div>`;
  };
  const mfg = marketFG ? `<div class="panel tile"><small>Crypto fear &amp; greed</small><b style="color:${fgInfo(marketFG.v)[1]}">${marketFG.v}<span class="tile-sub">${esc(marketFG.label)}</span></b><div class="fg-bar"><i style="left:${marketFG.v}%"></i></div></div>` : '';
  $('breadth').classList.toggle('five', !!marketFG);
  $('breadth').innerHTML = tile('Crypto', 'crypto') + tile('Stocks', 'stocks') + vol('Crypto', 'crypto') + vol('Stocks', 'stocks') + mfg;
}
const feat = { list: [], i: 0, data: new Map(), timer: null };
const FLAME = '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.6 1.5c.5 3-1.2 4.300-2.600 5.900C6.700 8.800 5 10.400 5 13a5 5 0 0 0 10 0c0-1.600-.6-2.900-1.400-4-.3 1-.9 1.700-1.700 2 .5-3.300-.3-6.800-1.300-9.500Z"/></svg>';
function initFeature() {
  const picks = [...all('stocks').sort(byVol).slice(0, 3), A.get('p:BTCUSDT'), A.get('p:ETHUSDT')].filter(Boolean);
  feat.list = picks.length ? picks : all().sort(byVol).slice(0, 5);
  feat.list.forEach((a) => fetchKlines(a, '4h', 42).then((k) => { feat.data.set(a.id, k.map((x) => x.c)); if (feat.list[feat.i] === a) paintFeature(); }).catch(() => {}));
  paintFeature();
  feat.timer = setInterval(() => { if (!$('feature').matches(':hover')) { feat.i = (feat.i + 1) % feat.list.length; paintFeature(); } }, 7000);
  $('feature').addEventListener('click', (e) => {
    const d = e.target.closest('[data-fi]');
    if (d) { feat.i = +d.dataset.fi; paintFeature(); return; }
    go(feat.list[feat.i].id);
  });
}
function paintFeature() {
  const a = feat.list[feat.i];
  if (!a) return;
  const c = feat.data.get(a.id);
  const wk = c ? ((c[c.length - 1] - c[0]) / c[0]) * 100 : null;
  $('feature').innerHTML = `
    <div class="ft-top"><h3>${FLAME}Trending</h3><div class="ft-dots">${feat.list.map((_, i) => `<button data-fi="${i}" class="${i === feat.i ? 'is-active' : ''}" aria-label="Show market ${i + 1}"></button>`).join('')}</div></div>
    <div data-id="${a.id}">
      <div class="ft-id">${icon(a, 'lg')}<div><b>${esc(a.t)} <span class="kind">${esc(a.sub)}</span></b><small>${esc(a.name || a.sub)}</small></div></div>
      <div class="ft-px"><span class="p" data-f="p"></span><span class="c" data-f="c"></span></div>
    </div>
    <div class="ft-chart">${c ? sparkSVG(c, 300, 120, true) : ''}</div>
    <div class="ft-foot"><span>7 days ago</span><span>${wk == null ? '' : `7-day change <b class="mono ${cls(wk)}">${fmtPct(wk)}</b>`}</span><span>Now</span></div>`;
  paint();
}
const moverMode = { stocks: 'hot', crypto: 'hot' };
function paintMovers() {
  document.querySelectorAll('[data-movers]').forEach((box) => {
    const kind = box.dataset.movers, mode = moverMode[kind], floor = kind === 'crypto' ? 1e6 : 2e5;
    let list = all(kind);
    if (mode === 'hot') list.sort(byVol);
    else { list = list.filter((a) => a.vol > floor); list.sort((x, y) => (mode === 'gain' ? y.chg - x.chg : x.chg - y.chg)); }
    const ids = list.slice(0, 5).map((a) => a.id).join();
    if (box._ids === ids) return; // same five markets: live painting keeps the numbers fresh
    box._ids = ids;
    box.querySelector('.mv-list').innerHTML = list.slice(0, 5).map((a) => `
      <div class="mv" data-id="${a.id}" data-go="${a.id}">${icon(a)}${who(a)}
        <div class="pc"><b data-f="p"></b><span data-f="c"></span></div></div>`).join('') || '<div class="skeleton">No data</div>';
  });
  paint();
}

/* ---------- market showcase: category list, featured market, gainers, most-active grid ---------- */
const GLYPH = {
  stocks: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="8" width="5" height="9" rx="1"/><rect x="6.900" y="4" width="1.200" height="17"/><rect x="14" y="6" width="5" height="8" rx="1"/><rect x="15.900" y="3" width="1.200" height="15"/></svg>',
  crypto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M9.500 9.500h4a1.500 1.500 0 0 1 0 3h-4zm0 3h4.500a1.500 1.500 0 0 1 0 3H9.500zm0-5v9" stroke-width="1.600"/></svg>',
  commodities: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5h8l2 5H6zM3 13h7l2 6H1zm11 0h7l2 6H12z"/></svg>',
};
const BENTO = [
  ['stocks', 'Stocks', (n) => `${n} tokenised stocks and ETFs from the US, Hong Kong, Korea and China, trading around the clock.`],
  ['crypto', 'Crypto', (n) => `${n} coins priced live against USDT, from Bitcoin to the newest listings.`],
  ['commodities', 'Commodities', () => 'Gold, silver, oil, gas and copper as tokenised contracts, charted next to everything else.'],
];
const bento = { kind: 'stocks', data: new Map(), ids: '' };
function setKind(kind) {
  tbl.kind = kind; tbl.page = 0;
  $('kindSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('is-active', b.dataset.kind === kind));
  buildTable();
}
function initBento() {
  $('bentoNav').addEventListener('click', (e) => {
    const ex = e.target.closest('[data-explore]');
    if (ex) { location.href = 'markets.html?kind=' + ex.dataset.explore; return; }
    const it = e.target.closest('[data-bk]');
    if (it && it.dataset.bk !== bento.kind) { bento.kind = it.dataset.bk; paintBento(); }
  });
  paintBento();
}
function paintBento() {
  const kind = bento.kind, list = all(kind).sort(byVol), top = list[0];
  $('bentoNav').innerHTML = BENTO.map(([k, title, desc]) => {
    const items = k === kind ? list : all(k).sort(byVol);
    if (k !== kind) return `<button class="bn-item" data-bk="${k}"><h3>${title}</h3><span>${items.length}</span></button>`;
    return `<div class="bn-item is-active"><span class="bn-glyph">${GLYPH[k]}</span><h3>${title}</h3><p>${desc(items.length)}</p>
      <div class="bn-foot"><div class="stack">${items.slice(0, 4).map((a) => icon(a)).join('')}</div><button class="btn btn-dark" data-explore="${k}">Explore all ${items.length}</button></div></div>`;
  }).join('');
  if (!top) return;
  const c = bento.data.get(top.id);
  if (!c) fetchKlines(top, '4h', 42).then((k) => { bento.data.set(top.id, k.map((x) => x.c)); if (bento.kind === kind) paintBento(); }).catch(() => {});
  $('bentoFeature').dataset.go = top.id;
  $('bentoFeature').innerHTML = `<div class="bf-top" data-id="${top.id}">${icon(top, 'lg')}
      <div class="who"><b>${esc(top.t)}</b><small>${esc(top.name || top.sub)} · most traded today</small></div>
      <div class="bf-px"><b data-f="p"></b><span data-f="c"></span></div></div>
    <div class="bf-chart">${c ? sparkSVG(c, 600, 150, true) : ''}</div>`;
  $('bentoGrid').innerHTML = `<h3>Most active</h3><p>The ${Math.min(24, list.length)} busiest ${kind === 'crypto' ? 'coins' : kind === 'stocks' ? 'stocks' : 'commodities'} by volume. Tap one to chart it.</p>
    <div class="bt-grid">${list.slice(0, 24).map((a) => `<button data-go="${a.id}" title="${esc(a.t)}${a.name ? ' · ' + esc(a.name) : ''}">${icon(a)}</button>`).join('')}</div>`;
  bento.ids = '';
  paintBentoMovers();
}
function paintBentoMovers() {
  const kind = bento.kind, floor = kind === 'crypto' ? 1e6 : kind === 'stocks' ? 2e5 : 0;
  const list = all(kind).filter((a) => a.vol > floor).sort((x, y) => y.chg - x.chg).slice(0, 4), ids = kind + list.map((a) => a.id).join();
  if (ids === bento.ids) return;
  bento.ids = ids;
  $('bentoMovers').innerHTML = `<h3>Top gainers</h3><p>Biggest 24-hour moves right now.</p>
    <div class="mv-list">${list.map((a) => `<div class="mv" data-id="${a.id}" data-go="${a.id}">${icon(a)}${who(a)}<div class="pc"><b data-f="p"></b><span data-f="c"></span></div></div>`).join('')}</div>`;
  paint();
}
function paintTeaser() {
  if (!ST.list.length) { $('premium').hidden = true; return; }
  $('premiumCards').innerHTML = ST.list.map((s) => strategyCard(s)).join('');
}

/* ---------- markets table ---------- */
const tbl = { kind: 'all', q: '', sort: 'vol', dir: -1, page: 0 };
function tableRows() {
  const q = tbl.q.trim().toUpperCase();
  let list = tbl.kind === 'watch' ? all().filter((a) => watch.has(a.id)) : all(tbl.kind);
  if (q) list = list.filter((a) => a.t.includes(q) || a.name.toUpperCase().includes(q));
  const k = tbl.sort;
  list.sort((x, y) => (watch.has(y.id) - watch.has(x.id)) || (k === 't' ? x.t.localeCompare(y.t) * tbl.dir : ((x[k] || 0) - (y[k] || 0)) * tbl.dir)); // starred markets first
  return list;
}
function buildTable() {
  const list = tableRows(), pages = Math.max(1, Math.ceil(list.length / PAGE));
  tbl.page = clamp(tbl.page, 0, pages - 1);
  const rows = list.slice(tbl.page * PAGE, tbl.page * PAGE + PAGE);
  $('mktBody').innerHTML = rows.map((a, i) => `
    <tr data-id="${a.id}" data-go="${a.id}">
      <td class="rank c-s">${tbl.page * PAGE + i + 1}</td>
      <td><div class="asset">${starBtn(a)}${icon(a)}<div><b>${esc(a.t)}</b><small>${esc(a.name || a.sub)}</small></div></div></td>
      <td class="num" data-f="p"></td>
      <td class="num" data-f="c"></td>
      <td class="c-m"><div class="range"><div class="trk"><i data-f="m"></i></div><div class="lh"><span data-f="l"></span><span data-f="h"></span></div></div></td>
      <td class="num c-s" data-f="v"></td>
      <td class="c-m" data-s="spark"></td>
      <td class="c-s" data-s="fg">·</td>
      <td data-s="setup"><span class="badge">…</span></td>
    </tr>`).join('') || `<tr><td colspan="9" class="skeleton">${tbl.kind === 'watch' && !tbl.q ? 'Your watchlist is empty. Tap the ★ next to any market to add it.' : `No markets match “${esc(tbl.q)}”.`}</td></tr>`;
  $('pager').innerHTML = `<button id="pgPrev" ${tbl.page ? '' : 'disabled'}>Previous</button><span>Page ${tbl.page + 1} of ${pages} · ${list.length} markets</span><button id="pgNext" ${tbl.page < pages - 1 ? '' : 'disabled'}>Next</button>`;
  document.querySelectorAll('.mkt th[data-sort]').forEach((th) => th.classList.toggle('sorted', th.dataset.sort === tbl.sort));
  paint();
  rows.forEach((a) => ensureScan(a).then(() => paintScanRow(a)));
}
function paintScanRow(a) {
  const row = document.querySelector(`#mktBody tr[data-id="${a.id}"]`);
  if (!row) return;
  const s = a.k && a.k.scan;
  if (!s) { row.querySelector('[data-s="setup"]').innerHTML = '<span class="badge">New listing</span>'; return; }
  row.querySelector('[data-s="spark"]').innerHTML = sparkSVG(a.k.closes.slice(-168));
  const [fl, fc] = fgInfo(s.fg);
  row.querySelector('[data-s="fg"]').innerHTML = `<span class="fg-pill" style="--c:${fc}"><b>${s.fg}</b>${fl}</span>`;
  row.querySelector('[data-s="setup"]').innerHTML = `<span class="badge ${s.tone}">${s.setup}</span>`;
}

/* ---------- opportunity scanner ---------- */
const opp = { kind: 'all', tf: '1h', mode: 'best', seq: 0 };
const TF_LABEL = { '15m': '15-minute', '1h': '1-hour', '4h': '4-hour', '1d': 'daily' };
async function runScanner() {
  const tf = opp.tf, seq = ++opp.seq;
  if ($('botScanDot')) $('botScanDot').className = 'dot busy';
  setT('scanStamp', 'Scanning…');
  const pool = [...all('crypto').sort(byVol).slice(0, 30), ...all('stocks').sort(byVol).slice(0, 30)];
  await Promise.all(pool.map((a) => ensureScan(a, tf)));
  if (tf !== '1h') await Promise.all(pool.map((a) => ensureScan(a))); // keep the 1-hour view fresh for the rest of the page
  if (seq !== opp.seq) return;
  const ok = pool.filter((a) => a.ks && a.ks[tf] && a.ks[tf].scan).length;
  setC('botScanDot', ok ? 'dot on' : 'dot off');
  setT('scanStamp', ok ? `${ok} markets · ${TF_LABEL[tf]} candles · ${new Date().toLocaleTimeString()}` : 'Market data unreachable');
  paintCards();
  if (has('flow')) paintFlowScan();
  if (has('moodFear')) paintMood();
}
function paintCards() {
  if (!has('oppCards')) return;
  const tf = opp.tf, S = (a) => a.ks[tf].scan;
  let list = all(opp.kind).filter((a) => a.ks && a.ks[tf] && a.ks[tf].scan && a.kind !== 'commodities' && a.vol > 2e5);
  if (opp.mode === 'breakout') list = list.filter((a) => S(a).breakout).sort((x, y) => (S(y).volRatio || 0) - (S(x).volRatio || 0));
  else if (opp.mode === 'volume') list = list.filter((a) => S(a).volRatio >= 1.5).sort((x, y) => S(y).volRatio - S(x).volRatio);
  else if (opp.mode === 'oversold') list = list.filter((a) => S(a).rsi < 35).sort((x, y) => S(x).rsi - S(y).rsi);
  else list.sort((x, y) => S(y).score - S(x).score);
  const empty = { best: 'Scanning the most active markets…', breakout: `No market is at a new 100-candle high on ${TF_LABEL[tf]} candles right now.`, volume: `No market has unusual volume on ${TF_LABEL[tf]} candles right now.`, oversold: `Nothing is oversold on ${TF_LABEL[tf]} candles right now.` };
  $('oppCards').innerHTML = list.slice(0, 8).map((a) => {
    const s = S(a), tag = opp.mode === 'breakout' ? ['good', 'New 100-candle high'] : opp.mode === 'volume' ? ['hot', `Volume ${s.volRatio.toFixed(1)}x normal`] : [s.tone, s.setup];
    return `<article class="panel card" data-id="${a.id}" data-go="${a.id}">
      <div class="card-top">${icon(a)}${who(a)}<div class="ring" style="--v:${s.score}" title="Setup score"><span>${s.score}</span></div></div>
      ${sparkSVG(a.ks[tf].closes.slice(-72), 260, 44, true)}
      <span class="badge ${tag[0]}" style="justify-self:start">${tag[1]}</span>
      <p class="why">${s.why}</p>
      <div class="facts">
        <span>Price <b data-f="p"></b></span><span>24h <b data-f="c"></b></span>
        <span>RSI <b>${s.rsi.toFixed(1)}</b></span><span>Volume <b>${s.volRatio == null ? '–' : s.volRatio.toFixed(1) + 'x'}</b></span>
      </div>
    </article>`;
  }).join('') || `<div class="skeleton">${empty[opp.mode]}</div>`;
  paint();
}

/* ---------- search ---------- */
const srch = { list: [], i: 0 };
function runSearch() {
  const q = $('q').value.trim().toUpperCase(), box = $('qResults');
  if (!q) { box.hidden = true; return; }
  const rank = (a) => (a.t === q ? 0 : a.t.startsWith(q) ? 1 : a.t.includes(q) ? 2 : a.name.toUpperCase().includes(q) ? 3 : 9);
  srch.list = all().map((a) => [rank(a), a]).filter((x) => x[0] < 9).sort((x, y) => x[0] - y[0] || byVol(x[1], y[1])).slice(0, 8).map((x) => x[1]);
  srch.i = 0;
  box.hidden = false;
  box.innerHTML = srch.list.map((a, i) => `
    <div class="sr${i ? '' : ' is-on'}" data-id="${a.id}" data-pick="${a.id}">${icon(a, 'sm')}
      <div class="who"><b>${esc(a.t)}</b><small>${esc(a.name)}</small><div>${esc(a.sub)}</div></div>
      <div class="pc"><div data-f="p"></div><div data-f="c"></div></div></div>`).join('') || '<div class="sr-empty">No coin or stock matches that.</div>';
  paint();
}
function pickSearch(id) { $('q').value = ''; $('qResults').hidden = true; $('q').blur(); go(id); }

/* ---------- chart terminal ---------- */
const ch = { chart: null, candle: null, vol: null, e20: null, e50: null, k: [], tf: '1h', seq: 0 };
function initChart() {
  if (!LW) { $('chartMsg').hidden = false; $('chartMsg').textContent = 'The chart library could not be loaded. Check your connection and reload.'; return; }
  ch.chart = LW.createChart($('priceChart'), chartBase);
  ch.candle = ch.chart.addCandlestickSeries({ upColor: '#0a9d6c', downColor: '#e5484d', borderVisible: false, wickUpColor: '#0a9d6c', wickDownColor: '#e5484d' });
  ch.vol = ch.chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol', lastValueVisible: false, priceLineVisible: false });
  ch.chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.84, bottom: 0 } });
  const line = (color) => ch.chart.addLineSeries({ color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
  ch.e20 = line('#f59e0b'); ch.e50 = line('#3b82f6');
  ch.chart.subscribeCrosshairMove((p) => {
    const d = p.seriesData && p.seriesData.get(ch.candle);
    $('ohlc').textContent = d ? `O ${fmtPx(d.open)}  H ${fmtPx(d.high)}  L ${fmtPx(d.low)}  C ${fmtPx(d.close)}` : '';
  });
}
async function loadChart(reset = true) {
  if (!ch.chart || !sel) return;
  const a = sel, seq = ++ch.seq;
  if (reset) { $('chartMsg').hidden = false; $('chartMsg').textContent = 'Loading candles…'; }
  let k;
  try { k = await fetchKlines(a, ch.tf, 500); } catch (e) {
    if (seq === ch.seq && reset) $('chartMsg').textContent = 'Could not load candles for this market.';
    return;
  }
  if (seq !== ch.seq || a !== sel) return;
  ch.k = k;
  $('chartMsg').hidden = true;
  const d = decimals(k[k.length - 1].c), T = (x) => x.t / 1000;
  ch.candle.applyOptions({ priceFormat: { type: 'price', precision: d, minMove: +(10 ** -d).toFixed(d) } });
  ch.candle.setData(k.map((x) => ({ time: T(x), open: x.o, high: x.h, low: x.l, close: x.c })));
  ch.vol.setData(k.map((x) => ({ time: T(x), value: x.v, color: x.c >= x.o ? 'rgba(10,157,108,.32)' : 'rgba(229,72,77,.32)' })));
  applyIndicators();
  if (reset) ch.chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, k.length - 130), to: k.length + 5 });
  paintReadout();
}
function tickChart() { // move the last candle with the live price
  if (!ch.candle || !sel || !ch.k.length || sel.price == null) return;
  const last = ch.k[ch.k.length - 1];
  if (last.c === sel.price) return;
  last.c = sel.price; last.h = Math.max(last.h, sel.price); last.l = Math.min(last.l, sel.price);
  ch.candle.update({ time: last.t / 1000, open: last.o, high: last.h, low: last.l, close: last.c });
}
setInterval(() => loadChart(false), 60000); // picks up newly opened candles
let marketFG = null; // the public crypto-wide index, shown next to our per-market score
function loadMarketFG() {
  getJSON('https://api.alternative.me/fng/?limit=31').then((d) => {
    const h = d.data.map((x) => ({ v: +x.value, t: +x.timestamp }));
    marketFG = { v: h[0].v, label: d.data[0].value_classification, hist: h };
    if (ch.k.length) paintReadout();
    if (has('breadth')) paintBreadth();
    if (has('sentGauge')) paintSentiment();
  }).catch(() => {});
}
const BARS_PER_DAY = { '15m': 96, '1h': 24, '4h': 6, '1d': 1, '1w': 1 / 7 };
const TF_WORDS = { '15m': '15 minutes', '1h': '1 hour', '4h': '4 hours', '1d': '1 day', '1w': '1 week' };
function paintReadout() { // chart page: every number comes with one plain sentence
  if (!has('readout')) return;
  const k = ch.k, c = k.map((x) => x.c), s = analyse(c, k);
  if (!s) { $('readout').innerHTML = '<div class="skeleton">Not enough history on this candle size yet. Try a shorter one.</div>'; setHTML('simple', ''); return; }
  const past = (label, bars) => { const n = Math.round(bars); if (n < 1 || c.length - n < 60) return null; const p = analyse(c.slice(0, c.length - n)); return p ? [label, p.fg] : null; };
  const bpd = BARS_PER_DAY[ch.tf], hist = [past('Yesterday', bpd), past('7 days ago', 7 * bpd), past('30 days ago', 30 * bpd)].filter(Boolean);
  const last = k.slice(-20), hi = Math.max(...last.map((x) => x.h)), lo = Math.min(...last.map((x) => x.l));
  const card = (title, value, line, extra = '') => `<div class="panel xcard"><small>${title}</small><b>${value}</b>${extra}<p>${line}</p></div>`;
  const rsiLine = s.rsi < 30 ? 'Sellers have pushed very hard lately. Price is "oversold": bounces often start here, but not always.' : s.rsi > 70 ? 'Buyers have pushed very hard lately. Price is "overbought": it often cools off after this.' : s.rsi >= 50 ? 'Buyers have had the upper hand recently, without being extreme.' : 'Sellers have had the upper hand recently, without being extreme.';
  $('readout').innerHTML = `<div class="panel xcard fg-card"><small>Fear &amp; greed · this market</small>${fgGauge(s.fg)}${fgHistRows(hist)}
      <p>One mood score from 0 to 100. Low means traders are fearful and selling; high means they are greedy and buying.</p>
      ${sel && sel.kind === 'crypto' && marketFG ? `<div class="fg-mkt">Whole crypto market today: <b style="color:${fgInfo(marketFG.v)[1]}">${marketFG.v} · ${esc(marketFG.label)}</b></div>` : ''}</div>`
    + card('Trend', s.up ? '<span class="up">▲ Rising</span>' : '<span class="down">▼ Falling</span>', s.up ? 'The recent average price is above the longer-term average, so price has been climbing.' : 'The recent average price is below the longer-term average, so price has been sliding.')
    + card('Momentum (RSI)', s.rsi.toFixed(0) + '<i>/100</i>', rsiLine, `<div class="gauge"><i style="left:${clamp(s.rsi, 0, 100)}%"></i></div>`)
    + card('Setup score', s.score + '<i>/100</i>', `${s.why} Higher means a cleaner buying setup by our rules.`, `<span class="badge ${s.tone}">${s.setup}</span>`)
    + card('Ceiling (resistance)', fmtPx(hi), 'The highest price of the last 20 candles. Price often pauses or turns back near here.')
    + card('Floor (support)', fmtPx(lo), 'The lowest price of the last 20 candles. Buyers often step in around here.')
    + card('Activity vs normal', s.volRatio == null ? '–' : s.volRatio.toFixed(1) + '<i>x</i>', s.volRatio > 1.5 ? 'Much more trading than usual in the last finished candle. Big moves need big activity.' : 'Trading in the last finished candle compared with the usual amount. Around 1x is normal.');
  const li = (ico, text) => `<li><span>${ico}</span><div>${text}</div></li>`, f = typeof pro !== 'undefined' ? pro.fund : null;
  setHTML('simple', `<h3>In simple words</h3><ul>
    ${li(s.up ? '📈' : '📉', `On ${TF_WORDS[ch.tf]} candles, <b>${esc(sel.t)}</b> is in ${s.up ? 'an <b class="up">uptrend</b>' : 'a <b class="down">downtrend</b>'} and sits <b>${s.dd.toFixed(1)}%</b> below its highest point on this chart.`)}
    ${li('⚡', rsiLine)}
    ${li('🧭', `The mood score is <b style="color:${fgInfo(s.fg)[1]}">${s.fg} (${fgInfo(s.fg)[0].toLowerCase()})</b>. ${s.fg < 45 ? 'Fearful markets can be cheap, but they can also keep falling.' : s.fg > 55 ? 'Greedy markets can keep rising, but they are easier to disappoint.' : 'Neither fear nor greed is in control right now.'}`)}
    ${f == null ? '' : li('⚖️', f >= 0 ? `Traders betting on a rise are paying a fee of <b>${f.toFixed(4)}%</b> to those betting on a fall. More people are positioned for a rise.` : `Traders betting on a fall are paying a fee of <b>${Math.abs(f).toFixed(4)}%</b> to those betting on a rise. More people are positioned for a fall.`)}
    ${li('🧱', `Watch <b>${fmtPx(hi)}</b> as the ceiling and <b>${fmtPx(lo)}</b> as the floor. A clear break of either often starts the next move.`)}
  </ul><p class="note">This is a plain reading of the chart, not a prediction and not financial advice.</p>`);
  if (has('mbot')) paintMarketBot(s, hi, lo);
}
function go(id) { // open a market: load it into the chart on this page, or go to the chart page
  if (has('priceChart')) select(id, true); else location.href = 'chart.html?m=' + encodeURIComponent(id);
}
function select(id, scroll) {
  const a = A.get(id);
  if (!a) return;
  sel = a;
  if (has('btAsset')) { $('btAsset').innerHTML = `${icon(a)}<div><b>${esc(a.t)}</b><small>${esc(a.name || a.sub)}</small></div>`; runBacktest(); }
  if (has('priceChart')) {
    loadChart(true);
    history.replaceState(null, '', 'chart.html?m=' + encodeURIComponent(a.id));
    document.title = `${a.t} live chart — AlphaStrats`;
    if (typeof onMarketSelect === 'function') onMarketSelect(a);
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  paint();
}

/* ---------- backtests ---------- */
const STRATS = {
  ema: {
    name: 'EMA Trend 20/50',
    desc: 'Long while EMA 20 is above EMA 50. Flat otherwise. Catches sustained trends, gives some back in chop.',
    run(k) { const c = k.map((x) => x.c), a = ema(c, 20), b = ema(c, 50); return c.map((_, i) => b[i] != null && a[i] > b[i]); },
  },
  rsi: {
    name: 'RSI Dip Buyer',
    desc: 'Buy when RSI 14 closes below 30. Exit when it recovers above 55. A mean-reversion rule.',
    run(k) { const r = rsi(k.map((x) => x.c)); let pos = false; return r.map((v) => { if (v == null) return false; if (!pos && v < 30) pos = true; else if (pos && v > 55) pos = false; return pos; }); },
  },
  don: {
    name: 'Breakout 20/10',
    desc: 'Buy a close above the prior 20-bar high. Exit on a close below the prior 10-bar low. A classic channel breakout.',
    run(k) {
      let pos = false;
      return k.map((x, i) => {
        if (i < 20) return false;
        let hi = -Infinity, lo = Infinity;
        for (let j = i - 20; j < i; j++) hi = Math.max(hi, k[j].h);
        for (let j = i - 10; j < i; j++) lo = Math.min(lo, k[j].l);
        if (!pos && x.c > hi) pos = true; else if (pos && x.c < lo) pos = false;
        return pos;
      });
    },
  },
};
const WARMUP = 50;
function backtest(k, strat) {
  const want = strat.run(k);
  let eq = 1, pos = false, entry = 0, eqIn = 0;
  const curve = [], bh = [], trades = [];
  for (let i = WARMUP; i < k.length; i++) {
    const sig = want[i - 1]; // decided on the previous close, filled at this open
    if (sig && !pos) { pos = true; entry = k[i].o; eqIn = eq * (1 - FEE); }
    else if (!sig && pos) { pos = false; const before = eq; eq = eqIn * (k[i].o / entry) * (1 - FEE); trades.push(eq / before - 1); }
    curve.push(pos ? eqIn * (k[i].c / entry) : eq);
    bh.push(k[i].c / k[WARMUP].o);
  }
  let peak = 0, maxDD = 0;
  for (const v of curve) { peak = Math.max(peak, v); maxDD = Math.max(maxDD, (peak - v) / peak); }
  const wins = trades.filter((t) => t > 0), losses = trades.filter((t) => t <= 0);
  const gw = wins.reduce((a, b) => a + b, 0), gl = -losses.reduce((a, b) => a + b, 0);
  return {
    curve, bh, trades: trades.length,
    ret: (curve[curve.length - 1] - 1) * 100, bhRet: (bh[bh.length - 1] - 1) * 100, maxDD: maxDD * 100,
    win: trades.length ? (wins.length / trades.length) * 100 : null, pf: gl > 0 ? gw / gl : null,
  };
}
const bt = { strat: 'ema', seq: 0, k: null, res: {}, chart: null, sLine: null, hLine: null };
function initEq() {
  if (!LW) return;
  const pct = { type: 'custom', formatter: (v) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%', minMove: 0.1 };
  bt.chart = LW.createChart($('eqChart'), { ...chartBase, handleScroll: false, handleScale: false });
  bt.hLine = bt.chart.addLineSeries({ color: '#94a3b8', lineWidth: 1, priceFormat: pct, priceLineVisible: false });
  bt.sLine = bt.chart.addAreaSeries({ lineColor: '#0a9d6c', topColor: 'rgba(10,157,108,.22)', bottomColor: 'rgba(10,157,108,0)', lineWidth: 2, priceFormat: pct, priceLineVisible: false });
}
async function runBacktest() {
  if (!sel) return;
  const a = sel, tf = $('btTf').value, seq = ++bt.seq;
  setC('botBtDot', 'dot busy');
  $('btNote').textContent = 'Loading candles…';
  let k;
  try { k = await fetchKlines(a, tf, 1000); } catch (e) {
    if (seq === bt.seq) { $('btNote').textContent = 'Could not load history for this market. Try another.'; setC('botBtDot', 'dot off'); }
    return;
  }
  if (seq !== bt.seq) return;
  setC('botBtDot', 'dot on');
  bt.k = k; bt.res = {};
  if (k.length < WARMUP + 30) {
    $('btNote').textContent = `Only ${k.length} candles of history on this timeframe, which is not enough to test. Try a shorter timeframe.`;
    $('btMetrics').innerHTML = '';
    if (bt.sLine) { bt.sLine.setData([]); bt.hLine.setData([]); }
    paintStrats(); return;
  }
  for (const id of Object.keys(STRATS)) bt.res[id] = backtest(k, STRATS[id]);
  stats.runs += 3; setT('botBt', stats.runs);
  const best = Object.keys(bt.res).sort((x, y) => bt.res[y].ret - bt.res[x].ret)[0];
  log('bt', `${a.t} ${tf} · ${k.length} bars · 3 strategies · best ${STRATS[best].name} ${fmtPct(bt.res[best].ret, 1)} vs hold ${fmtPct(bt.res[best].bhRet, 1)}`);
  paintBacktest();
}
function paintStrats() {
  $('btStrats').innerHTML = Object.entries(STRATS).map(([id, s]) => {
    const r = bt.res[id];
    return `<button class="strat${id === bt.strat ? ' is-active' : ''}" data-strat="${id}">${s.name}<span class="${r ? cls(r.ret) : ''}">${r ? fmtPct(r.ret, 1) : ''}</span></button>`;
  }).join('');
  $('btDesc').textContent = STRATS[bt.strat].desc;
}
function paintBacktest() {
  paintStrats();
  const r = bt.res[bt.strat], k = bt.k;
  if (!r) return;
  const m = (label, val, c = '') => `<div class="metric"><small>${label}</small><b class="${c}">${val}</b></div>`;
  $('btMetrics').innerHTML =
    m('Strategy return', fmtPct(r.ret, 1), cls(r.ret)) + m('Buy & hold', fmtPct(r.bhRet, 1), cls(r.bhRet)) +
    m('Max drawdown', '-' + r.maxDD.toFixed(1) + '%') + m('Closed trades', r.trades) +
    m('Win rate', r.win == null ? '–' : r.win.toFixed(0) + '%') + m('Profit factor', r.pf == null ? '–' : r.pf.toFixed(2));
  const d = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  $('btNote').textContent = `${sel.t} · ${$('btTf').value} candles · ${d(k[WARMUP].t)} to ${d(k[k.length - 1].t)} · ${k.length - WARMUP} bars · long-only · 0.05% fee per side · no slippage or funding. Hypothetical results; past performance does not guarantee future results.`;
  if (bt.sLine) {
    const pts = (arr) => arr.map((v, i) => ({ time: k[i + WARMUP].t / 1000, value: (v - 1) * 100 }));
    bt.hLine.setData(pts(r.bh)); bt.sLine.setData(pts(r.curve));
    bt.chart.timeScale().fitContent();
  }
}

/* ---------- hero flow: live prices -> trend scan -> strategy -> trades -> result ---------- */
function log() {} // the old text console is gone; the flow diagram shows the same activity
function paintFlow() {
  const s = ST.list[0];
  const picks = ['p:BTCUSDT', s ? 'p:' + s.market + 'USDT' : 'p:ETHUSDT', 'p:NVDAUSDT'].map((id) => A.get(id)).filter(Boolean);
  $('flowPrices').innerHTML = picks.map((a) => `<div class="frow" data-id="${a.id}" data-go="${a.id}">${icon(a, 'sm')}<b>${esc(a.t)}</b><span><em data-f="p"></em><small data-f="c"></small></span></div>`).join('');
  if (s) {
    const x = s.stats, last = s.trades.slice(-4).reverse();
    $('flowEngine').innerHTML = `<h3>${esc(s.name)}</h3><p>${esc(s.market)} · ${esc(s.timeframe)} candles</p>
      <ul class="fchecks"><li>Trend filter</li><li>Entry signal</li><li>Stop-loss placed</li><li>${esc(s.risk)}</li></ul>`;
    $('flowTrades').innerHTML = last.map((t) => `<div class="frow"><span class="badge ${t[T.dir] === 'LONG' ? 'good' : 'bad'}">${t[T.dir] === 'LONG' ? '▲ Long' : '▼ Short'}</span><b class="mono ${cls(t[T.pnl])}">${fmtPct(t[T.pct], 1)}</b></div>`).join('');
    $('flowResult').innerHTML = `<b class="fbig ${cls(x.ret)}">${fmtPct(x.ret, 0)}</b><p>${usd(s.startBalance, 0)} grew to ${usd(x.end, 0)}</p>${sparkSVG(x.balances, 200, 54, true, UP)}<a href="premium.html#${esc(s.id)}">Backtest · see all ${x.n} trades →</a>`;
  }
  paint(); paintFlowScan(); drawWires();
  new ResizeObserver(() => drawWires()).observe($('flow'));
}
function paintFlowScan() {
  const done = all().filter((a) => a.k && a.k.scan);
  if (!done.length) return;
  const up = done.filter((a) => a.k.scan.up).length;
  $('flowScan').innerHTML = `<div class="split"><i style="width:${(up / done.length) * 100}%"></i><u></u></div>
    <div class="split-lbl"><span class="up">▲ ${up} uptrend</span><span class="down">▼ ${done.length - up} down</span></div>`;
}
function drawWires(boxId = 'flow') { // draws the animated wires between the five cards of a flow diagram
  const box = $(boxId), svg = box && box.querySelector('.flow-wires');
  if (!svg || !$('fE')) return;
  const o = box.getBoundingClientRect();
  if (!o.width) return;
  const r = (id) => { const b = $(id).getBoundingClientRect(); return { l: b.left - o.left, r: b.right - o.left, t: b.top - o.top, b: b.bottom - o.top, cx: b.left - o.left + b.width / 2, cy: b.top - o.top + b.height / 2 }; };
  const A1 = r('fA'), E = r('fE'), stacked = E.l < A1.r; // phone layout: cards in one column
  const pairs = stacked ? [['fA', 'fB'], ['fB', 'fE'], ['fE', 'fC'], ['fC', 'fD']] : [['fA', 'fE'], ['fB', 'fE'], ['fE', 'fC'], ['fE', 'fD']];
  svg.setAttribute('viewBox', `0 0 ${o.width} ${o.height}`);
  svg.innerHTML = pairs.map(([a, b], i) => {
    const p = r(a), q = r(b);
    let d;
    if (stacked) d = `M${p.cx} ${p.b} L${q.cx} ${q.t}`;
    else { const y2 = a === 'fE' ? p.cy + (q.cy - p.cy) * 0.25 : q.cy + (p.cy - q.cy) * 0.25, y1 = a === 'fE' ? y2 : p.cy, yEnd = a === 'fE' ? q.cy : y2, m = (p.r + q.l) / 2; d = `M${p.r} ${y1} C${m} ${y1} ${m} ${yEnd} ${q.l} ${yEnd}`; }
    return `<path class="wire" d="${d}"/><path class="wire-flow" d="${d}"/><circle r="4" class="wire-dot"><animateMotion dur="${2.2 + i * 0.3}s" repeatCount="indefinite" path="${d}"/></circle>
      <circle r="4.500" class="wire-end" cx="${d.match(/M([\d.-]+)/)[1]}" cy="${d.match(/M[\d.-]+ ([\d.-]+)/)[1]}"/>`;
  }).join('');
}

setInterval(() => {
  setT('botFeed', stats.ticksWindow); stats.ticksWindow = 0;
  setT('botScan', stats.analysed);
  setT('statTicks', stats.ticks.toLocaleString());
  setT('statBars', stats.bars.toLocaleString());
}, 1000);

/* ---------- events and boot ---------- */
function segment(el, fn) {
  if (!el) return;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    el.querySelectorAll('button').forEach((x) => x.classList.toggle('is-active', x === b));
    fn(b.dataset);
  });
}
function wire() {
  document.addEventListener('click', (e) => {
    const star = e.target.closest('[data-star]');
    if (star) return toggleWatch(star.dataset.star);
    const pick = e.target.closest('[data-pick]');
    if (pick) return pickSearch(pick.dataset.pick);
    if (has('qResults') && !e.target.closest('#search')) $('qResults').hidden = true;
    const g = e.target.closest('[data-go]');
    if (g) go(g.dataset.go);
  });
  if (has('q')) {
    $('q').addEventListener('input', runSearch);
    $('q').addEventListener('focus', runSearch);
    $('q').addEventListener('keydown', (e) => {
      const n = srch.list.length;
      if (e.key === 'Escape') { $('q').value = ''; $('qResults').hidden = true; $('q').blur(); }
      else if (e.key === 'Enter' && n && !$('qResults').hidden) pickSearch(srch.list[srch.i].id);
      else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && n) {
        e.preventDefault();
        srch.i = (srch.i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
        $('qResults').querySelectorAll('.sr').forEach((el, i) => el.classList.toggle('is-on', i === srch.i));
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $('q').focus(); }
    });
  }
  segment($('tfSeg'), (d) => { ch.tf = d.tf; loadChart(true); });
  segment($('kindSeg'), (d) => { tbl.kind = d.kind; tbl.page = 0; buildTable(); });
  segment($('oppSeg'), (d) => { opp.kind = d.kind; paintCards(); });
  segment($('oppMode'), (d) => { opp.mode = d.mode; paintCards(); });
  segment($('oppTf'), (d) => { opp.tf = d.tf; $('oppCards').innerHTML = '<div class="skeleton">Scanning…</div>'; runScanner(); });
  document.querySelectorAll('[data-movers]').forEach((box) => segment(box.querySelector('.seg'), (d) => { moverMode[box.dataset.movers] = d.mode; box._ids = null; paintMovers(); }));
  if (has('mktBody')) {
    $('mktFilter').addEventListener('input', (e) => { tbl.q = e.target.value; tbl.page = 0; buildTable(); });
    document.querySelector('.mkt thead').addEventListener('click', (e) => {
      const th = e.target.closest('[data-sort]');
      if (!th) return;
      if (tbl.sort === th.dataset.sort) tbl.dir *= -1; else { tbl.sort = th.dataset.sort; tbl.dir = th.dataset.sort === 't' ? 1 : -1; }
      tbl.page = 0; buildTable();
    });
    $('pager').addEventListener('click', (e) => {
      if (e.target.id === 'pgPrev') tbl.page--; else if (e.target.id === 'pgNext') tbl.page++; else return;
      buildTable();
      $('markets').scrollIntoView({ behavior: 'smooth' });
    });
  }
  if (has('btStrats')) {
    $('btStrats').addEventListener('click', (e) => { const b = e.target.closest('[data-strat]'); if (b) { bt.strat = b.dataset.strat; paintBacktest(); } });
    $('btTf').addEventListener('change', runBacktest);
    mountPicker($('btQ'), $('btQBox'), (m) => select(m.id, false));
  }
}
async function boot() {
  wire();
  if (has('priceChart')) { initChart(); initIndicators(); }
  if (has('eqChart')) { initEq(); paintStrats(); }
  if (has('premiumCards')) paintTeaser();
  while (!(await loadMarkets().catch(() => 0))) { // keep trying until the market list arrives
    setT('mktCount', 'Market data is unreachable right now. Retrying…');
    if (has('chartMsg')) { $('chartMsg').hidden = false; $('chartMsg').textContent = 'Market data is unreachable. Retrying…'; }
    await new Promise((r) => setTimeout(r, 8000));
  }
  start();
}
function start() {
  const nC = all('crypto').length, nS = all('stocks').length, nM = all('commodities').length, q = new URLSearchParams(location.search);
  setT('statMarkets', A.size);
  setT('mktCount', `${nC} crypto coins, ${nS} tokenised stocks and ${nM} commodities, all priced live in USDT. Click a column to sort.`);
  if (has('tape')) buildTape();
  if (has('breadth')) paintBreadth();
  if (has('feature')) initFeature();
  if (document.querySelector('[data-movers]')) paintMovers();
  if (has('mktBody')) {
    if (['crypto', 'stocks', 'commodities', 'watch'].includes(q.get('kind'))) setKind(q.get('kind')); else buildTable();
    document.querySelector('#kindSeg [data-kind="watch"]').textContent = `★ Watchlist${watch.size ? ' ' + watch.size : ''}`;
  }
  if (has('bentoNav')) initBento();
  if (has('flow')) paintFlow();
  if (has('heat')) { initHeat(); paintHeat(); }
  if (has('cmpChart')) initCompare();
  if (has('fundLong')) initFunding();
  if (has('tradesList')) initTerminal();
  if (has('sentGauge')) initSentiment();
  if (has('priceChart') || has('btStrats')) select(A.has(q.get('m')) ? q.get('m') : A.has('p:BTCUSDT') ? 'p:BTCUSDT' : all().sort(byVol)[0].id, false);
  connect(); loadMarketFG();
  setInterval(paint, 300);
  setInterval(() => {
    if (has('breadth')) paintBreadth();
    if (document.querySelector('[data-movers]')) paintMovers();
    if (has('bentoMovers')) paintBentoMovers();
  }, 5000);
  if (has('oppCards') || has('flow') || has('moodFear')) { runScanner(); setInterval(runScanner, SCAN_TTL + 5000); }
}
boot();
