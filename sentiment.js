/* Sentiment page: the crypto-wide fear & greed index, mood by market,
   and how traders are positioned (long vs short). */

const sent = { chart: null, line: null };
function paintSentiment() { // called when the public index arrives
  if (!marketFG) return;
  const h = marketFG.hist, at = (i) => (h[i] ? h[i].v : null);
  const rows = [['Yesterday', at(1)], ['7 days ago', at(7)], ['30 days ago', at(30)]].filter((r) => r[1] != null);
  $('sentGauge').innerHTML = fgGauge(marketFG.v) + fgHistRows(rows);
  const v = marketFG.v;
  setT('sentWords', v < 25 ? 'People are very scared and many are selling. Prices are often low in times like this, but they can still fall further.'
    : v < 45 ? 'People are nervous. Buyers are careful and bad news hits prices harder than good news lifts them.'
    : v <= 55 ? 'The market is calm. Neither fear nor excitement is driving prices right now.'
    : v < 75 ? 'People are confident and buying. Prices tend to rise, but the risk of a pullback grows as greed builds.'
    : 'People are very excited and rushing to buy. Markets often cool down sharply after this much greed.');
  if (!LW) return;
  if (!sent.chart) {
    sent.chart = LW.createChart($('sentChart'), { ...chartBase, handleScroll: false, handleScale: false, timeScale: { ...chartBase.timeScale, timeVisible: false } });
    sent.line = sent.chart.addAreaSeries({ lineColor: '#f7931a', topColor: 'rgba(247,147,26,.25)', bottomColor: 'rgba(247,147,26,0)', lineWidth: 2, priceLineVisible: false, priceFormat: { type: 'custom', formatter: (x) => x.toFixed(0), minMove: 1 } });
    [25, 75].forEach((p) => sent.line.createPriceLine({ price: p, color: '#d3dae4', lineStyle: 2, lineWidth: 1, axisLabelVisible: false }));
  }
  sent.line.setData(h.slice().reverse().map((x) => ({ time: x.t, value: x.v })));
  sent.chart.timeScale().fitContent();
}
function paintMood() { // called after each scan of the most active markets
  const done = all().filter((a) => a.k && a.k.scan && a.vol > 2e5).sort((x, y) => x.k.scan.fg - y.k.scan.fg);
  const row = (a) => { const s = a.k.scan, [label, col] = fgInfo(s.fg); return `<div class="fund-row" data-id="${a.id}" data-go="${a.id}">${icon(a, 'sm')}${who(a)}<span class="mono" data-f="c"></span><span class="fg-pill" style="--c:${col}"><b>${s.fg}</b>${label}</span></div>`; };
  $('moodFear').innerHTML = done.slice(0, 8).map(row).join('') || '<div class="skeleton">Scanning…</div>';
  $('moodGreed').innerHTML = done.slice(-8).reverse().map(row).join('') || '<div class="skeleton">Scanning…</div>';
  paint();
}
function loadLongShort() {
  const picks = all('crypto').sort(byVol).slice(0, 8);
  $('lsList').innerHTML = picks.map((a) => `<div class="ls-row" data-go="${a.id}">${icon(a, 'sm')}<b>${esc(a.t)}</b><div class="ls-bar" id="ls-${a.sym}"><span class="skel">…</span></div></div>`).join('');
  picks.forEach((a) => getJSON(`${API.perp.data}/globalLongShortAccountRatio?symbol=${a.sym}&period=1h&limit=1`).then((r) => {
    if (!r.length) return;
    const l = +r[0].longAccount * 100;
    $('ls-' + a.sym).innerHTML = `<i style="width:${l}%">${l.toFixed(0)}% rise</i><u>${(100 - l).toFixed(0)}% fall</u>`;
  }).catch(() => {}));
}
function initSentiment() {
  loadLongShort();
  setInterval(loadLongShort, 5 * 60e3);
}
