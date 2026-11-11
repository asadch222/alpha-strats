/* Shared helpers used by every page: formatting, icons, sparklines and chart styling. */

const ICON_CDN = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/';
const UP = '#0a9d6c', DOWN = '#e5484d';

const $ = (id) => document.getElementById(id);
const has = (id) => !!document.getElementById(id);
const setT = (id, v) => { const e = $(id); if (e) e.textContent = v; };
const setHTML = (id, v) => { const e = $(id); if (e) e.innerHTML = v; };
const setC = (id, v) => { const e = $(id); if (e) e.className = v; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const decimals = (p) => (p >= 100 ? 2 : p >= 1 ? 3 : p >= 0.1 ? 4 : p >= 0.01 ? 5 : p >= 0.0001 ? 6 : 8);
function fmtPx(p) {
  if (p == null || !isFinite(p)) return '–';
  const d = decimals(p);
  return p.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
const fmtPct = (v, d = 2) => (v == null || !isFinite(v) ? '–' : (v >= 0 ? '+' : '') + v.toFixed(d) + '%');
function fmtVol(v) {
  if (v == null) return '–';
  if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
  return '$' + v.toFixed(0);
}
const usd = (v, d = 2) => '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const usdS = (v, d = 2) => (v >= 0 ? '+' : '-') + usd(v, d);
const cls = (v) => (v == null ? '' : v >= 0 ? 'up' : 'down');

// Round market icon: the real logo where one exists, coloured initials otherwise.
// Each icon has a list of image addresses to try in order; if all fail the initials stay.
const LOGO_COIN = 'https://assets.coincap.io/assets/icons/', LOGO_STOCK = 'https://financialmodelingprep.com/image-stock/';
const STOCK_LOGO = { // markets whose logo is filed under a different ticker
  BRKB: 'BRK-B', SAMSUNG: '005930.KS', SKHYNIX: '000660.KS', HYUNDAI: '005380.KS', NAVER: '035420.KS', LGELECTRONICS: '066570.KS',
  SAMSUNGEM: '009150.KS', HANMI: '042700.KS', TENCENT: '0700.HK', HK0700: '0700.HK', HK1810: '1810.HK', MEITUAN: '3690.HK',
  KUAISHOU: '1024.HK', POPMART: '9992.HK', HK0992: '0992.HK', BYD: '1211.HK',
};
const BADGE = { // commodities and currencies have no logo, so they get a clear symbol
  XAU: ['Au', '#c9971a'], XAG: ['Ag', '#8d99a8'], XPT: ['Pt', '#5f87a6'], XPD: ['Pd', '#7a7fa6'], COPPER: ['Cu', '#b8692e'],
  CL: ['Oil', '#1f2937'], BZ: ['Oil', '#44403c'], NATGAS: ['Gas', '#2563eb'], USDBRL: ['R$', '#0a9d6c'],
};
let CG_IMG = new Map(); // coin logos learned from the coin-info source, used when the first source has none
try { const saved = JSON.parse(localStorage.getItem('as.cgimg') || '[]'); CG_IMG = new Map(saved); } catch (e) { /* no saved logos yet */ }
const coinBase = (a) => (a.ico || a.t).replace(/^(1000000|1000|1M)(?=[A-Z])/, '');
function iconSources(a) {
  if (a.kind === 'crypto') { const b = coinBase(a), listed = typeof COIN_LOGO !== 'undefined' && COIN_LOGO[b]; return [listed && COIN_LOGO_BASE + listed, LOGO_COIN + b.toLowerCase() + '@2x.png', ICON_CDN + b.toLowerCase() + '.svg'].filter(Boolean); }
  if (a.kind === 'stocks') return [LOGO_STOCK + (STOCK_LOGO[a.t] || a.t) + '.png'];
  return [];
}
function iconNext(img) { // called when a logo fails to load: try the next address, or fall back to initials
  const rest = (img.dataset.alt || '').split('|').filter(Boolean);
  if (!rest.length) return img.remove();
  img.dataset.alt = rest.slice(1).join('|'); img.src = rest[0];
}
function icon(a, size = '') {
  if (BADGE[a.t]) return `<span class="ico badge-ico ${size}" style="background:${BADGE[a.t][1]}">${BADGE[a.t][0]}</span>`;
  let h = 0;
  for (const ch of a.t) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const txt = a.t.length > 4 ? a.t.slice(0, 3) : a.t, src = iconSources(a);
  const img = src.length ? `<img class="${a.kind === 'stocks' ? 'logo-stock' : ''}" src="${src[0]}" data-alt="${src.slice(1).join('|')}" alt="" loading="lazy" onerror="iconNext(this)">` : '';
  return `<span class="ico ${size}"${a.kind === 'crypto' ? ` data-coin="${esc(coinBase(a))}"` : ''} style="background:linear-gradient(135deg,hsl(${h} 62% 48%),hsl(${(h + 45) % 360} 68% 32%))">${esc(txt)}${img}</span>`;
}
function learnCoinLogos(pairs) { // [[SYMBOL, imageUrl], ...] from the coin-info source; fills any icons still showing initials
  for (const [k, v] of pairs) if (v && !CG_IMG.has(k)) CG_IMG.set(k, v);
  try { localStorage.setItem('as.cgimg', JSON.stringify([...CG_IMG])); } catch (e) { /* not remembered */ }
  document.querySelectorAll('.ico[data-coin]').forEach((el) => { if (!el.querySelector('img') && CG_IMG.has(el.dataset.coin)) el.insertAdjacentHTML('beforeend', `<img src="${CG_IMG.get(el.dataset.coin)}" alt="" onerror="this.remove()">`); });
}
const who = (a) => `<div class="who"><b>${esc(a.t)}</b><small>${esc(a.name || a.sub)}</small></div>`;

function sparkSVG(v, w = 110, h = 30, area = false, color = null) {
  const lo = Math.min(...v), hi = Math.max(...v);
  const pts = v.map((y, i) => `${((i / (v.length - 1)) * w).toFixed(1)},${(h - 3 - ((y - lo) / (hi - lo || 1)) * (h - 6)).toFixed(1)}`).join(' ');
  const col = color || (v[v.length - 1] >= v[0] ? UP : DOWN), gid = 'g' + Math.random().toString(36).slice(2, 8);
  const fill = area ? `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".22"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs><polygon points="0,${h} ${pts} ${w},${h}" fill="url(#${gid})"/>` : '';
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${fill}<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="${area ? 2 : 1.5}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}

const LW = window.LightweightCharts;
const chartBase = {
  autoSize: true,
  layout: { background: { color: 'transparent' }, textColor: '#5b677a', fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 11 },
  grid: { vertLines: { color: 'rgba(15,23,42,.05)' }, horzLines: { color: 'rgba(15,23,42,.05)' } },
  rightPriceScale: { borderColor: '#e6eaf0' },
  timeScale: { borderColor: '#e6eaf0', timeVisible: true, secondsVisible: false },
  crosshair: { mode: 0, vertLine: { color: '#94a0b2', labelBackgroundColor: '#0b1220' }, horzLine: { color: '#94a0b2', labelBackgroundColor: '#0b1220' } },
};
