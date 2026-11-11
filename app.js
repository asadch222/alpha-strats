/* AlphaStrats — live markets, charts, scanner and in-browser backtests.
   Market data comes from free public endpoints (no API key). The two feeds are:
   "spot" for crypto and "perp" for tokenised stocks and commodities. */

const API = {
  spot: { rest: 'https://data-api.binance.vision/api/v3', ws: 'wss://data-stream.binance.vision/ws/!miniTicker@arr' },
  perp: { rest: 'https://fapi.binance.com/fapi/v1', ws: 'wss://fstream.binance.com/ws/!miniTicker@arr' },
};
const ICON_CDN = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/';
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

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const A = new Map();   // every market, keyed "c:BTCUSDT" (crypto) or "p:NVDAUSDT" (stocks, commodities)
const stats = { ticks: 0, ticksWindow: 0, bars: 0, runs: 0, analysed: 0 };
const wsUp = { spot: false, perp: false };
const all = (kind) => { const out = []; for (const a of A.values()) if (!kind || kind === 'all' || a.kind === kind) out.push(a); return out; };
const byVol = (x, y) => (y.vol || 0) - (x.vol || 0);
let sel = null;        // market shown in the chart terminal and backtest lab

/* ---------- formatting ---------- */
const decimals = (p) => (p >= 100 ? 2 : p >= 1 ? 3 : p >= 0.1 ? 4 : p >= 0.01 ? 5 : p >= 0.0001 ? 6 : 8);
function fmtPx(p) {
  if (p == null || !isFinite(p)) return '–';
  const d = decimals(p);
  return p.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
const fmtPct = (v, d = 2) => (v == null || !isFinite(v) ? '–' : (v >= 0 ? '+' : '') + v.toFixed(d) + '%');
function fmtVol(v) {
  if (v == null) return '–';
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
  return '$' + v.toFixed(0);
}
const cls = (v) => (v == null ? '' : v >= 0 ? 'up' : 'down');
function icon(a, size = '') {
  let h = 0;
  for (const ch of a.t) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const txt = a.t.length > 4 ? a.t.slice(0, 3) : a.t;
  const img = a.kind === 'crypto' ? `<img src="${ICON_CDN}${a.t.toLowerCase()}.svg" alt="" loading="lazy" onerror="this.remove()">` : '';
  return `<span class="ico ${size}" style="background:linear-gradient(135deg,hsl(${h} 65% 46%),hsl(${(h + 45) % 360} 70% 28%))">${esc(txt)}${img}</span>`;
}

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
function analyse(c) {
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
  return { rsi: r, up, dd, score, setup, tone, why, e20, e50 };
}

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
async function loadMarkets() {
  const [info, perpRows, spotRows] = await Promise.all([
    getJSON(API.perp.rest + '/exchangeInfo').catch(() => null),
    getJSON(API.perp.rest + '/ticker/24hr').catch(() => null),
    getJSON(API.spot.rest + '/ticker/24hr').catch(() => null),
  ]);
  const stockBases = new Set();
  if (info && perpRows) {
    const tick = new Map(perpRows.map((r) => [r.symbol, r]));
    for (const s of info.symbols) {
      if (s.contractType !== 'TRADIFI_PERPETUAL' || s.status !== 'TRADING' || s.quoteAsset !== 'USDT') continue;
      const r = tick.get(s.symbol);
      if (!r) continue;
      const kind = s.underlyingType === 'COMMODITY' || s.underlyingType === 'FX' ? 'commodities' : 'stocks';
      const a = { id: 'p:' + s.symbol, sym: s.symbol, src: 'perp', t: s.baseAsset, kind, sub: TYPE_LABEL[s.underlyingType] || 'Stock', name: STOCK_NAMES[s.baseAsset] || '' };
      setTicker(a, +r.lastPrice, +r.openPrice, +r.highPrice, +r.lowPrice, +r.quoteVolume);
      if (a.price) { A.set(a.id, a); stockBases.add(s.baseAsset); }
    }
  }
  if (spotRows) {
    const fresh = Date.now() - 36 * 3600e3;
    for (const r of spotRows) {
      if (!r.symbol.endsWith('USDT') || +r.quoteVolume <= 0 || r.closeTime < fresh) continue;
      const t = r.symbol.slice(0, -4);
      if (STABLES.has(t)) continue;
      if (t.endsWith('B') && stockBases.has(t.slice(0, -1))) continue; // spot duplicate of a stock already listed
      const a = { id: 'c:' + r.symbol, sym: r.symbol, src: 'spot', t, kind: 'crypto', sub: 'Crypto', name: NAMES[t] || '' };
      setTicker(a, +r.lastPrice, +r.openPrice, +r.highPrice, +r.lowPrice, +r.quoteVolume);
      if (a.price) A.set(a.id, a);
    }
  }
  return A.size;
}
async function refreshREST(src) { // fallback while a stream is down
  const rows = await getJSON(API[src].rest + '/ticker/24hr');
  const pre = src === 'spot' ? 'c:' : 'p:';
  for (const r of rows) { const a = A.get(pre + r.symbol); if (a) setTicker(a, +r.lastPrice, +r.openPrice, +r.highPrice, +r.lowPrice, +r.quoteVolume); }
}
function connect(src) {
  const pre = src === 'spot' ? 'c:' : 'p:', label = src === 'spot' ? 'crypto' : 'stocks';
  let ws;
  const retry = () => setTimeout(() => connect(src), 4000);
  try { ws = new WebSocket(API[src].ws); } catch (e) { return retry(); }
  ws.onopen = () => { wsUp[src] = true; paintFeed(); log('feed', `${label} stream connected · ${all().filter((a) => a.src === src).length} markets`); };
  ws.onmessage = (ev) => {
    const rows = JSON.parse(ev.data);
    if (!Array.isArray(rows)) return;
    for (const d of rows) {
      const a = A.get(pre + d.s);
      if (!a) continue;
      stats.ticks++; stats.ticksWindow++;
      setTicker(a, +d.c, +d.o, +d.h, +d.l, +d.q);
    }
  };
  ws.onclose = () => { if (wsUp[src]) log('feed', `${label} stream dropped · reconnecting`); wsUp[src] = false; paintFeed(); retry(); };
  ws.onerror = () => ws.close();
}
setInterval(() => { for (const src of ['spot', 'perp']) if (!wsUp[src] && A.size) refreshREST(src).catch(() => {}); }, 10000);

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
function ensureScan(a) { // 1h analysis, cached per market
  if (a.k && Date.now() - a.k.ts < SCAN_TTL) return Promise.resolve(a.k);
  if (a._p) return a._p;
  a._p = fetchKlines(a, '1h', 200).then((k) => {
    const closes = k.map((x) => x.c);
    if (!a.k) stats.analysed++;
    a.k = { closes, scan: analyse(closes), ts: Date.now() };
    return a.k;
  }).catch(() => null).finally(() => { a._p = null; });
  return a._p;
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
  const n = (wsUp.spot ? 1 : 0) + (wsUp.perp ? 1 : 0);
  const c = 'dot ' + (n === 2 ? 'on' : n === 1 ? 'busy' : 'off');
  $('feedPill').querySelector('.dot').className = c;
  $('botFeedDot').className = c;
  $('feedText').textContent = n === 2 ? 'Live' : n === 1 ? 'Partial feed' : 'Reconnecting';
}

function sparkSVG(v, w = 110, h = 30, area = false) {
  const lo = Math.min(...v), hi = Math.max(...v);
  const pts = v.map((y, i) => `${((i / (v.length - 1)) * w).toFixed(1)},${(h - 3 - ((y - lo) / (hi - lo || 1)) * (h - 6)).toFixed(1)}`).join(' ');
  const up = v[v.length - 1] >= v[0], col = up ? '#2ee6a0' : '#ff5c7a', gid = 'g' + Math.random().toString(36).slice(2, 8);
  const fill = area ? `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".28"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs><polygon points="0,${h} ${pts} ${w},${h}" fill="url(#${gid})"/>` : '';
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${fill}<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="${area ? 2 : 1.5}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
const who = (a) => `<div class="who"><b>${esc(a.t)}</b><small>${esc(a.name || a.sub)}</small></div>`;

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
  $('breadth').innerHTML = tile('Crypto', 'crypto') + tile('Stocks', 'stocks') + vol('Crypto', 'crypto') + vol('Stocks', 'stocks');
}
const feat = { list: [], i: 0, data: new Map(), timer: null };
const FLAME = '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.6 1.5c.5 3-1.2 4.300-2.600 5.900C6.700 8.800 5 10.400 5 13a5 5 0 0 0 10 0c0-1.600-.6-2.900-1.400-4-.3 1-.9 1.700-1.700 2 .5-3.300-.3-6.800-1.300-9.500Z"/></svg>';
function initFeature() {
  const picks = [...all('stocks').sort(byVol).slice(0, 3), A.get('c:BTCUSDT'), A.get('c:ETHUSDT')].filter(Boolean);
  feat.list = picks.length ? picks : all().sort(byVol).slice(0, 5);
  feat.list.forEach((a) => fetchKlines(a, '4h', 42).then((k) => { feat.data.set(a.id, k.map((x) => x.c)); if (feat.list[feat.i] === a) paintFeature(); }).catch(() => {}));
  paintFeature();
  feat.timer = setInterval(() => { if (!$('feature').matches(':hover')) { feat.i = (feat.i + 1) % feat.list.length; paintFeature(); } }, 7000);
  $('feature').addEventListener('click', (e) => {
    const d = e.target.closest('[data-fi]');
    if (d) { feat.i = +d.dataset.fi; paintFeature(); return; }
    select(feat.list[feat.i].id, true);
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

/* ---------- markets table ---------- */
const tbl = { kind: 'all', q: '', sort: 'vol', dir: -1, page: 0 };
function tableRows() {
  const q = tbl.q.trim().toUpperCase();
  let list = all(tbl.kind);
  if (q) list = list.filter((a) => a.t.includes(q) || a.name.toUpperCase().includes(q));
  const k = tbl.sort;
  list.sort((x, y) => (k === 't' ? x.t.localeCompare(y.t) * tbl.dir : ((x[k] || 0) - (y[k] || 0)) * tbl.dir));
  return list;
}
function buildTable() {
  const list = tableRows(), pages = Math.max(1, Math.ceil(list.length / PAGE));
  tbl.page = clamp(tbl.page, 0, pages - 1);
  const rows = list.slice(tbl.page * PAGE, tbl.page * PAGE + PAGE);
  $('mktBody').innerHTML = rows.map((a, i) => `
    <tr data-id="${a.id}" data-go="${a.id}">
      <td class="rank c-s">${tbl.page * PAGE + i + 1}</td>
      <td><div class="asset">${icon(a)}<div><b>${esc(a.t)}</b><small>${esc(a.name || a.sub)}</small></div></div></td>
      <td class="num" data-f="p"></td>
      <td class="num" data-f="c"></td>
      <td class="c-m"><div class="range"><div class="trk"><i data-f="m"></i></div><div class="lh"><span data-f="l"></span><span data-f="h"></span></div></div></td>
      <td class="num c-s" data-f="v"></td>
      <td class="c-m" data-s="spark"></td>
      <td class="num c-s" data-s="rsi">·</td>
      <td data-s="setup"><span class="badge">…</span></td>
    </tr>`).join('') || `<tr><td colspan="9" class="skeleton">No markets match “${esc(tbl.q)}”.</td></tr>`;
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
  row.querySelector('[data-s="rsi"]').textContent = s.rsi.toFixed(1);
  row.querySelector('[data-s="setup"]').innerHTML = `<span class="badge ${s.tone}">${s.setup}</span>`;
}

/* ---------- opportunity scanner ---------- */
let oppKind = 'all';
async function runScanner() {
  $('botScanDot').className = 'dot busy';
  const pool = [...all('crypto').sort(byVol).slice(0, 30), ...all('stocks').sort(byVol).slice(0, 30)];
  await Promise.all(pool.map(ensureScan));
  const ok = pool.filter((a) => a.k && a.k.scan).length;
  $('botScanDot').className = ok ? 'dot on' : 'dot off';
  $('scanStamp').textContent = ok ? 'Scanned ' + new Date().toLocaleTimeString() : '';
  log('scan', ok ? `scan complete · ${ok} most active markets · 1h candles` : 'scan failed · market data unreachable');
  paintCards();
}
function paintCards() {
  const ranked = all(oppKind).filter((a) => a.k && a.k.scan && a.kind !== 'commodities' && a.vol > 2e5).sort((x, y) => y.k.scan.score - x.k.scan.score).slice(0, 8);
  $('oppCards').innerHTML = ranked.map((a) => {
    const s = a.k.scan;
    return `<article class="panel card" data-id="${a.id}" data-go="${a.id}">
      <div class="card-top">${icon(a)}${who(a)}<div class="ring" style="--v:${s.score}" title="Setup score"><span>${s.score}</span></div></div>
      ${sparkSVG(a.k.closes.slice(-72), 260, 44, true)}
      <span class="badge ${s.tone}" style="justify-self:start">${s.setup}</span>
      <p class="why">${s.why}</p>
      <div class="facts">
        <span>Price <b data-f="p"></b></span><span>24h <b data-f="c"></b></span>
        <span>RSI <b>${s.rsi.toFixed(1)}</b></span><span>From high <b>-${s.dd.toFixed(1)}%</b></span>
      </div>
    </article>`;
  }).join('') || '<div class="skeleton">Scanning the most active markets…</div>';
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
function pickSearch(id) { $('q').value = ''; $('qResults').hidden = true; $('q').blur(); select(id, true); }

/* ---------- chart terminal ---------- */
const LW = window.LightweightCharts;
const chartBase = {
  autoSize: true,
  layout: { background: { color: 'transparent' }, textColor: '#8492a6', fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 11 },
  grid: { vertLines: { color: 'rgba(255,255,255,.035)' }, horzLines: { color: 'rgba(255,255,255,.035)' } },
  rightPriceScale: { borderColor: '#1b2431' },
  timeScale: { borderColor: '#1b2431', timeVisible: true, secondsVisible: false },
  crosshair: { mode: 0, vertLine: { color: '#3a475a', labelBackgroundColor: '#18202c' }, horzLine: { color: '#3a475a', labelBackgroundColor: '#18202c' } },
};
const ch = { chart: null, candle: null, vol: null, e20: null, e50: null, k: [], tf: '1h', seq: 0 };
function initChart() {
  if (!LW) { $('chartMsg').hidden = false; $('chartMsg').textContent = 'The chart library could not be loaded. Check your connection and reload.'; return; }
  ch.chart = LW.createChart($('priceChart'), chartBase);
  ch.candle = ch.chart.addCandlestickSeries({ upColor: '#2ee6a0', downColor: '#ff5c7a', borderVisible: false, wickUpColor: '#2ee6a0', wickDownColor: '#ff5c7a' });
  ch.vol = ch.chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol', lastValueVisible: false, priceLineVisible: false });
  ch.chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.84, bottom: 0 } });
  const line = (color) => ch.chart.addLineSeries({ color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
  ch.e20 = line('#ffc24d'); ch.e50 = line('#7aa8ff');
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
  ch.vol.setData(k.map((x) => ({ time: T(x), value: x.v, color: x.c >= x.o ? 'rgba(46,230,160,.32)' : 'rgba(255,92,122,.32)' })));
  const c = k.map((x) => x.c), mk = (arr) => arr.map((v, i) => (v == null ? null : { time: T(k[i]), value: v })).filter(Boolean);
  ch.e20.setData(mk(ema(c, 20))); ch.e50.setData(mk(ema(c, 50)));
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
function paintReadout() {
  const k = ch.k, c = k.map((x) => x.c), s = analyse(c);
  if (!s) { $('readout').innerHTML = '<div class="skeleton">Not enough history on this timeframe yet.</div>'; return; }
  const last = k.slice(-20), hi = Math.max(...last.map((x) => x.h)), lo = Math.min(...last.map((x) => x.l));
  const row = (l, v) => `<div class="ro-row"><span>${l}</span><b>${v}</b></div>`;
  $('readout').innerHTML = `
    <div class="ro-score"><div class="ring" style="--v:${s.score}"><span>${s.score}</span></div>
      <div><span class="badge ${s.tone}">${s.setup}</span><small>${s.why}</small></div></div>
    <div><div class="ro-row" style="border:0;padding:0"><span>RSI 14</span><b>${s.rsi.toFixed(1)}</b></div><div class="gauge"><i style="left:${clamp(s.rsi, 0, 100)}%"></i></div></div>
    <div>${row('Trend', s.up ? '<span class="up">▲ Up</span>' : '<span class="down">▼ Down</span>')}
    ${row('EMA 20', fmtPx(s.e20))}${row('EMA 50', fmtPx(s.e50))}
    ${row('20-bar high', fmtPx(hi))}${row('20-bar low', fmtPx(lo))}
    ${row('From recent high', '-' + s.dd.toFixed(1) + '%')}</div>`;
}
function paintTermHead() {
  const a = sel;
  $('termHead').dataset.id = a.id; $('termHead')._v = null;
  $('termHead').innerHTML = `${icon(a, 'lg')}
    <div class="who"><b>${esc(a.t)}</b><span class="kind">${esc(a.sub)}</span><small>${esc(a.name || a.t + ' / USDT')}</small></div>
    <span class="p" data-f="p"></span><span class="c" data-f="c"></span>
    <div class="term-stats"><div><small>24h high</small><span data-f="h"></span></div><div><small>24h low</small><span data-f="l"></span></div><div><small>24h volume</small><span data-f="v"></span></div></div>`;
  $('btAsset').innerHTML = `${icon(a)}<div><b>${esc(a.t)}</b><small>${esc(a.name || a.sub)}</small></div>`;
}
function select(id, scroll) {
  const a = A.get(id);
  if (!a) return;
  sel = a;
  paintTermHead(); paint();
  loadChart(true);
  runBacktest();
  if (scroll) $('chart').scrollIntoView({ behavior: 'smooth' });
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
  bt.hLine = bt.chart.addLineSeries({ color: '#5b6a80', lineWidth: 1, priceFormat: pct, priceLineVisible: false });
  bt.sLine = bt.chart.addAreaSeries({ lineColor: '#2ee6a0', topColor: 'rgba(46,230,160,.22)', bottomColor: 'rgba(46,230,160,0)', lineWidth: 2, priceFormat: pct, priceLineVisible: false });
}
async function runBacktest() {
  if (!sel) return;
  const a = sel, tf = $('btTf').value, seq = ++bt.seq;
  $('botBtDot').className = 'dot busy';
  $('btNote').textContent = 'Loading candles…';
  let k;
  try { k = await fetchKlines(a, tf, 1000); } catch (e) {
    if (seq === bt.seq) { $('btNote').textContent = 'Could not load history for this market. Try another.'; $('botBtDot').className = 'dot off'; }
    return;
  }
  if (seq !== bt.seq) return;
  $('botBtDot').className = 'dot on';
  bt.k = k; bt.res = {};
  if (k.length < WARMUP + 30) {
    $('btNote').textContent = `Only ${k.length} candles of history on this timeframe, which is not enough to test. Try a shorter timeframe.`;
    $('btMetrics').innerHTML = '';
    if (bt.sLine) { bt.sLine.setData([]); bt.hLine.setData([]); }
    paintStrats(); return;
  }
  for (const id of Object.keys(STRATS)) bt.res[id] = backtest(k, STRATS[id]);
  stats.runs += 3; $('botBt').textContent = stats.runs;
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

/* ---------- bot console ---------- */
const TAGS = { feed: ['feed', 'FEED'], scan: ['', 'SCAN'], bt: ['bt', 'TEST'] };
function log(tag, msg) {
  const el = document.createElement('div'), [c, label] = TAGS[tag];
  el.innerHTML = `<time>${new Date().toLocaleTimeString('en-GB')}</time><span class="tg ${c}">${label}</span>${msg}`;
  $('log').appendChild(el);
  while ($('log').children.length > 40) $('log').firstChild.remove();
}
let rot = 0;
setInterval(() => { // narrate real analysis results, one market per beat
  const done = all().filter((a) => a.k && a.k.scan);
  if (!done.length) return;
  const a = done[rot++ % done.length], s = a.k.scan;
  log('scan', `${esc(a.t).padEnd(6)} ${fmtPx(a.price).padStart(10)}  rsi ${s.rsi.toFixed(1)}  ${s.up ? 'ema20&gt;50' : 'ema20&lt;50'}  → ${s.setup.toLowerCase()} (${s.score})`);
}, 1500);
setInterval(() => {
  $('botFeed').textContent = stats.ticksWindow; stats.ticksWindow = 0;
  $('botScan').textContent = stats.analysed;
  $('statTicks').textContent = stats.ticks.toLocaleString();
  $('statBars').textContent = stats.bars.toLocaleString();
  $('clock').textContent = new Date().toUTCString().slice(17, 25) + ' UTC';
}, 1000);

/* ---------- events and boot ---------- */
function segment(el, fn) {
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    el.querySelectorAll('button').forEach((x) => x.classList.toggle('is-active', x === b));
    fn(b.dataset);
  });
}
function wire() {
  document.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) return pickSearch(pick.dataset.pick);
    if (!e.target.closest('#search')) $('qResults').hidden = true;
    const go = e.target.closest('[data-go]');
    if (go) select(go.dataset.go, true);
  });
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
  segment($('kindSeg'), (d) => { tbl.kind = d.kind; tbl.page = 0; buildTable(); });
  segment($('oppSeg'), (d) => { oppKind = d.kind; paintCards(); });
  segment($('tfSeg'), (d) => { ch.tf = d.tf; loadChart(true); });
  document.querySelectorAll('[data-movers]').forEach((box) => segment(box.querySelector('.seg'), (d) => { moverMode[box.dataset.movers] = d.mode; box._ids = null; paintMovers(); }));
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
  $('btStrats').addEventListener('click', (e) => { const b = e.target.closest('[data-strat]'); if (b) { bt.strat = b.dataset.strat; paintBacktest(); } });
  $('btTf').addEventListener('change', runBacktest);
}
async function boot() {
  wire(); initChart(); initEq(); paintStrats();
  $('oppCards').innerHTML = '<div class="skeleton">Scanning the most active markets…</div>';
  log('feed', 'booting · requesting market list');
  let n = 0;
  try { n = await loadMarkets(); } catch (e) { /* handled below */ }
  if (!n) {
    log('feed', 'market data unreachable · retrying in 10s');
    $('mktCount').textContent = 'Market data is unreachable right now. Retrying…';
    setTimeout(boot2, 10000);
    return;
  }
  start();
}
async function boot2() { const n = await loadMarkets().catch(() => 0); if (n) start(); else setTimeout(boot2, 10000); }
function start() {
  const nC = all('crypto').length, nS = all('stocks').length, nM = all('commodities').length;
  $('statMarkets').textContent = A.size;
  $('mktCount').textContent = `${nC} crypto coins, ${nS} tokenised stocks and ${nM} commodities, all priced live in USDT. Click a column to sort.`;
  log('feed', `market list loaded · ${nC} crypto · ${nS} stocks · ${nM} commodities`);
  buildTape(); paintBreadth(); initFeature(); paintMovers(); buildTable();
  select(A.has('c:BTCUSDT') ? 'c:BTCUSDT' : all().sort(byVol)[0].id, false);
  connect('spot'); connect('perp');
  setInterval(paint, 300);
  setInterval(() => { paintBreadth(); paintMovers(); }, 5000);
  runScanner();
  setInterval(runScanner, SCAN_TTL + 5000);
}
boot();
