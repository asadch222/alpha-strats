/* Live trades on the home page. The admin posts a trade in the admin portal; each card here
   follows the live price and shows the profit or loss since the entry price. */
const Trades = (() => {
  const shown = {}; // trade id -> the number currently on screen, so changes can be animated
  const ago = (ts) => { const m = Math.max(1, Math.round((Date.now() - ts) / 60000)); return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'; };
  const visible = () => Site.trades().filter((t) => t.show !== false && A.has(t.market));

  function card(t) {
    const a = A.get(t.market), long = t.side !== 'short';
    const track = t.stop && t.target ? `<div class="lt-track"><i class="lt-fill"></i><u class="lt-entry" style="left:${clamp(((t.entry - t.stop) / (t.target - t.stop)) * 100, 0, 100)}%"></u><b class="lt-mark"></b></div>
      <div class="lt-ends"><span>Stop ${fmtPx(t.stop)}</span><span>Entry</span><span>Target ${fmtPx(t.target)}</span></div>` : '';
    return `<article class="lt" data-t="${esc(t.id)}">
      <div class="lt-glow"></div><div class="lt-bub">${'<i></i>'.repeat(7)}</div>
      <header><a class="lt-who" href="chart.html?m=${encodeURIComponent(a.id)}">${icon(a)}<div><b>${esc(a.t)}</b><small>${esc(a.name || a.sub || '')}</small></div></a>
        <span class="lt-side ${long ? 'long' : 'short'}">${long ? '▲ Long' : '▼ Short'}${t.lev > 1 ? ' · ' + t.lev + '×' : ''}</span></header>
      <div class="lt-pl"><b class="lt-pct">–</b><span class="lt-word">waiting for price</span></div>
      <div class="lt-spark"></div>
      ${track}
      <dl><div><dt>Entry</dt><dd>${fmtPx(t.entry)}</dd></div><div><dt>Now</dt><dd class="lt-now">–</dd></div><div><dt>Opened</dt><dd>${ago(t.opened)}</dd></div></dl>
      ${t.note ? `<p class="lt-note">${esc(t.note)}</p>` : ''}
      <footer><i class="dot on"></i>Live · ${long ? 'profits if the price rises' : 'profits if the price falls'}</footer>
    </article>`;
  }
  function closedRow(t) {
    const a = A.get(t.market), pl = Site.pl(t);
    return `<tr><td><div class="cell-asset">${icon(a, 'sm')}<b>${esc(a.t)}</b></div></td><td>${t.side === 'short' ? 'Short' : 'Long'}</td><td class="num">${fmtPx(t.entry)}</td><td class="num">${fmtPx(t.exit)}</td><td class="num ${cls(pl)}"><b>${fmtPct(pl)}</b></td><td class="dimtxt">${new Date(t.closed || t.opened).toLocaleDateString()}</td></tr>`;
  }

  function render() {
    const box = $('trades'); if (!box) return;
    const list = visible(), open = list.filter((t) => t.status !== 'closed'), closed = list.filter((t) => t.status === 'closed').sort((x, y) => (y.closed || 0) - (x.closed || 0));
    box.hidden = !list.length || Site.hidden('home.trades');
    if (box.hidden) return;
    $('ltGrid').innerHTML = open.map(card).join('') || '<p class="dimtxt">No trade is open right now. The last closed trades are below.</p>';
    $('ltClosed').innerHTML = closed.length ? `<h3>Closed trades</h3><div class="table-wrap"><table class="lt-table"><thead><tr><th>Market</th><th>Side</th><th class="num">Entry</th><th class="num">Exit</th><th class="num">Result</th><th>Closed</th></tr></thead><tbody>${closed.slice(0, 12).map(closedRow).join('')}</tbody></table></div>` : '';
    Object.keys(shown).forEach((k) => delete shown[k]);
    open.forEach((t) => { // a small chart of the last three days, with the entry price as a dotted line
      ensureScan(A.get(t.market)).then((k) => {
        const el = document.querySelector(`.lt[data-t="${CSS.escape(t.id)}"] .lt-spark`);
        if (!el || !k) return;
        const v = k.closes.slice(-72), lo = Math.min(...v), hi = Math.max(...v), y = clamp(57 - ((t.entry - lo) / (hi - lo || 1)) * 54, 2, 58);
        el.innerHTML = sparkSVG(v, 300, 60, true) + `<svg class="lt-eline" viewBox="0 0 300 60" preserveAspectRatio="none"><line x1="0" x2="300" y1="${y}" y2="${y}"/></svg>`;
      });
    });
    tick(); paintSummary(open, closed);
  }
  function paintSummary(open, closed) {
    const pls = open.map((t) => Site.pl(t, A.get(t.market).price)).filter((x) => x != null);
    const avg = pls.length ? pls.reduce((s, x) => s + x, 0) / pls.length : null, wins = closed.filter((t) => Site.pl(t) > 0).length;
    $('ltSum').innerHTML = `<div><b>${open.length}</b><span>open trade${open.length === 1 ? '' : 's'}</span></div>
      <div><b class="${cls(avg)}">${avg == null ? '–' : fmtPct(avg)}</b><span>average on open trades</span></div>
      <div><b>${closed.length ? wins + ' of ' + closed.length : '–'}</b><span>closed trades in profit</span></div>`;
  }

  // count the number up or down to its new value instead of jumping
  function tween(el, from, to) {
    const t0 = performance.now();
    cancelAnimationFrame(el._raf);
    const step = (now) => { const k = Math.min(1, (now - t0) / 600), e = 1 - (1 - k) ** 3; el.textContent = fmtPct(from + (to - from) * e); if (k < 1) el._raf = requestAnimationFrame(step); };
    el._raf = requestAnimationFrame(step);
  }
  function tick() {
    const open = visible().filter((t) => t.status !== 'closed');
    open.forEach((t) => {
      const el = document.querySelector(`.lt[data-t="${CSS.escape(t.id)}"]`), a = A.get(t.market);
      if (!el || a.price == null) return;
      const pl = Site.pl(t, a.price), was = shown[t.id];
      if (was != null && Math.abs(was - pl) < 0.005) return;
      shown[t.id] = pl;
      el.classList.toggle('up', pl >= 0); el.classList.toggle('down', pl < 0);
      tween(el.querySelector('.lt-pct'), was == null ? 0 : was, pl);
      el.querySelector('.lt-word').textContent = pl >= 0 ? 'profit so far' : 'loss so far';
      el.querySelector('.lt-now').textContent = fmtPx(a.price);
      if (was != null) { el.classList.remove('tick-up', 'tick-down'); void el.offsetWidth; el.classList.add(pl > was ? 'tick-up' : 'tick-down'); }
      const mark = el.querySelector('.lt-mark');
      if (mark) {
        const pos = clamp(((a.price - t.stop) / (t.target - t.stop)) * 100, 0, 100), ent = clamp(((t.entry - t.stop) / (t.target - t.stop)) * 100, 0, 100);
        mark.style.left = pos + '%';
        const f = el.querySelector('.lt-fill'); f.style.left = Math.min(pos, ent) + '%'; f.style.width = Math.abs(pos - ent) + '%';
      }
    });
    if ($('ltSum') && open.length) paintSummary(open, visible().filter((t) => t.status === 'closed'));
  }
  function init() {
    render();
    setInterval(tick, 700);
    window.addEventListener('site:change', render);
  }
  return { init, render };
})();
