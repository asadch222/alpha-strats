/* Heatmaps page: every market as a tile, grouped by sector, with real logos.
   Tile size = trading volume (or equal), colour = 24-hour change (or funding rate). */

const SECTORS = {
  'Chips & hardware': 'NVDA AMD INTC AVGO TSM MU QCOM ASML ARM SMCI MRVL AMAT LRCX KLAC TXN SNDK WDC STM TER ALAB CRDO AAOI COHR LITE CIEN AXTI DELL HPE GLW FLEX ANET CSCO NOK IBM SONY SKHY DRAM',
  'Software & internet': 'AAPL MSFT GOOGL META AMZN NFLX ORCL CRM ADBE NOW SNOW PLTR SHOP UBER PANW CRWD NET DDOG MDB ZS ZM TEAM PATH GTLB AKAM APP RDDT SNPS TTWO EBAY MELI PDD BABA DJT RUM',
  'Finance & crypto stocks': 'JPM BAC GS V PYPL PAYP BRKB BX IBKR HOOD COIN MSTR CRCL SOFI MARA IREN HUT BMNR APLD CRWV NBIS STRC',
  'Health': 'LLY NVO PFE MRK ABBV UNH MRNA AMGN MDT HIMS VKTX TWST TEM',
  'Consumer & autos': 'TSLA WMT COST HD MCD KO NKE DIS CVNA DKNG RIVN GME AMC WEN GPRO',
  'Energy, industry & space': 'XOM OXY CAT GEV VST CEG VRT OKLO SMR BE FLNC EQT MP USAR RKLB ASTS RDW ONDS IONQ SPCX',
  'Funds (ETFs)': 'SPY QQQ IWM SOXL SOXS TQQQ SQQQ SMH EWY EWJ EWT EWZ EWZS EIDO NVDL TSLL KORU UVXY TMF TBT TZA MSTU MUU MVLL INTW SKUU SKDD SNXX STXX XLE XBI GDX URNM BITO KSTR',
};
const SECTOR_OF = {};
for (const [name, list] of Object.entries(SECTORS)) list.split(' ').forEach((t) => { SECTOR_OF[t] = name; });
const COIN_GROUP = { 'Layer-1': 'Main blockchains', PoW: 'Mined coins (like Bitcoin)', 'Layer-2': 'Faster side networks', DeFi: 'Finance apps (DeFi)', Meme: 'Meme coins', AI: 'AI coins', Infrastructure: 'Infrastructure', Gaming: 'Gaming', Alpha: 'New and small', Crypto: 'Other coins', NFT: 'NFT and metaverse', Metaverse: 'NFT and metaverse', Payment: 'Payments', Storage: 'Storage', RWA: 'Real-world assets', Chinese: 'Other coins' };
function groupOf(a) {
  if (a.kind === 'crypto') return COIN_GROUP[a.cat] || 'Other coins';
  if (a.kind === 'commodities') return 'Commodities';
  if (a.sub === 'Pre-IPO') return 'Pre-IPO companies';
  if (a.sub !== 'US stock') return 'Asia: ' + a.sub.replace(' stock', '');
  return SECTOR_OF[a.t] || 'Other US stocks';
}

const hm = { kind: 'stocks', size: 'vol', color: 'chg', group: true, fund: new Map() };
const hmMix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',');
function hmColor(a) {
  const v = hm.color === 'fund' ? hm.fund.get(a.sym) : a.chg;
  if (v == null) return ['40,48,62', null];
  const span = hm.color === 'fund' ? 0.03 : a.kind === 'crypto' ? 8 : 5, m = clamp(Math.abs(v) / span, 0, 1);
  return [v >= 0 ? hmMix([30, 70, 52], [38, 196, 118], m) : hmMix([92, 36, 42], [240, 82, 82], m), v];
}
function hmTile(r, ox, oy) {
  const a = r.i.a, [rgb, v] = hmColor(a), w = r.w - 2, h = r.h - 2;
  const label = v == null ? '–' : hm.color === 'fund' ? v.toFixed(3) + '%' : fmtPct(v);
  const size = w > 120 && h > 96 ? 'xl' : w > 70 && h > 58 ? 'lg' : w > 42 && h > 34 ? 'md' : w > 24 && h > 20 ? 'sm' : 'xs';
  const body = size === 'xl' ? `${icon(a, 'lg')}<b>${esc(a.t)}</b><span>${label}</span>` : size === 'lg' ? `${icon(a)}<b>${esc(a.t)}</b><span>${label}</span>` : size === 'md' ? `<b>${esc(a.t.slice(0, 6))}</b><span>${label}</span>` : size === 'sm' ? icon(a, 'sm') : '';
  return `<button class="hm-tile hm-${size}" data-go="${a.id}" title="${esc(a.t)}${a.name ? ' · ' + esc(a.name) : ''} · ${fmtPct(a.chg)} · ${fmtVol(a.vol)}" style="left:${ox + r.x + 1}px;top:${oy + r.y + 1}px;width:${w}px;height:${h}px;background:rgb(${rgb})">${body}</button>`;
}
function paintHeatPage() {
  const box = $('hmap'), W = box.clientWidth, H = box.clientHeight;
  if (!W) return;
  let list = all(hm.kind).filter((a) => a.vol > 0).sort(byVol);
  if (hm.kind === 'crypto') list = list.slice(0, W < 700 ? 60 : 160);
  else if (W < 700) list = list.slice(0, 70);
  const val = (a) => (hm.size === 'equal' ? 1 : Math.pow(a.vol, 0.5));
  let html = '';
  if (hm.group && hm.kind !== 'commodities') {
    const groups = new Map();
    for (const a of list) { const g = groupOf(a); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(a); }
    const gs = [...groups].map(([name, items]) => ({ name, items, v: items.reduce((s, a) => s + val(a), 0) })).sort((x, y) => y.v - x.v);
    for (const g of squarify(gs, W, H)) {
      const head = g.h > 46 && g.w > 60 ? 20 : 0, iw = g.w - 4, ih = g.h - head - 4;
      if (head) html += `<div class="hm-group" style="left:${g.x + 3}px;top:${g.y + 2}px;width:${iw - 2}px">${esc(g.i.name)} <i>${g.i.items.length}</i></div>`;
      if (iw > 4 && ih > 4) html += squarify(g.i.items.map((a) => ({ a, v: val(a) })), iw, ih).map((r) => hmTile(r, g.x + 2, g.y + head + 2)).join('');
    }
  } else html = squarify(list.map((a) => ({ a, v: val(a) })), W, H).map((r) => hmTile(r, 0, 0)).join('');
  box.innerHTML = html;
  const up = list.filter((a) => a.chg >= 0).length;
  $('hmStats').innerHTML = `<b>${list.length}</b> markets shown · <b class="up">${up} rising</b> · <b class="down">${list.length - up} falling</b>`;
  const span = hm.color === 'fund' ? '0.03%' : (hm.kind === 'crypto' ? 8 : 5) + '%';
  setT('hmLo', '-' + span); setT('hmHi', '+' + span);
  setT('hmLegend', hm.color === 'fund' ? 'Funding rate: green means most traders are betting on a rise' : 'Price change over the last 24 hours');
}
function initHeatPage() {
  const k = new URLSearchParams(location.search).get('kind');
  if (['stocks', 'crypto', 'commodities'].includes(k)) hm.kind = k;
  document.querySelectorAll('#hmKinds button').forEach((b) => b.classList.toggle('is-active', b.dataset.kind === hm.kind));
  $('hmKinds').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    hm.kind = b.dataset.kind;
    document.querySelectorAll('#hmKinds button').forEach((x) => x.classList.toggle('is-active', x === b));
    paintHeatPage();
  });
  $('hmSize').addEventListener('change', (e) => { hm.size = e.target.value; paintHeatPage(); });
  $('hmColor').addEventListener('change', (e) => {
    hm.color = e.target.value;
    if (hm.color === 'fund' && !hm.fund.size) getJSON(API.perp.rest + '/premiumIndex').then((rows) => { rows.forEach((r) => hm.fund.set(r.symbol, +r.lastFundingRate * 100)); paintHeatPage(); }).catch(() => {});
    paintHeatPage();
  });
  $('hmGroup').addEventListener('change', (e) => { hm.group = e.target.checked; paintHeatPage(); });
  $('hmFull').addEventListener('click', () => { const p = $('hmPanel'); if (document.fullscreenElement) document.exitFullscreen(); else if (p.requestFullscreen) p.requestFullscreen(); });
  document.addEventListener('fullscreenchange', () => setTimeout(paintHeatPage, 120));
  new ResizeObserver(paintHeatPage).observe($('hmap'));
  setInterval(paintHeatPage, 8000);
  paintHeatPage();
}
