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

// Round market icon: a real coin icon where a free one exists, coloured initials otherwise.
function icon(a, size = '') {
  let h = 0;
  for (const ch of a.t) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const txt = a.t.length > 4 ? a.t.slice(0, 3) : a.t;
  const img = a.kind === 'crypto' ? `<img src="${ICON_CDN}${(a.ico || a.t).toLowerCase()}.svg" alt="" loading="lazy" onerror="this.remove()">` : '';
  return `<span class="ico ${size}" style="background:linear-gradient(135deg,hsl(${h} 62% 48%),hsl(${(h + 45) % 360} 68% 32%))">${esc(txt)}${img}</span>`;
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
