/* Premium strategy results. The data lives in strategies.js.
   strategyCard() draws the summary card used on both pages;
   initStrategyPage() draws the full dashboard on premium.html. */

const ST = { list: window.STRATEGIES || [], i: 0, filter: 'all', chart: null };
const T = { n: 0, dir: 1, tIn: 2, pIn: 3, stop: 4, tOut: 5, pOut: 6, hrs: 7, why: 8, pos: 9, lev: 10, pnl: 11, pct: 12, bal: 13 };
const asTime = (s) => Date.parse(s.replace(' ', 'T') + ':00Z') / 1000; // keeps the report's own clock on the axis
const dayLabel = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const CROWN = '<svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor" style="vertical-align:-2px;margin-right:5px"><path d="M2.5 6.5 6.4 10 10 4l3.600 6 3.900-3.500-1.500 9h-12z"/></svg>';
const LOCK = '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M7 9V6.500a3 3 0 0 1 6 0V9"/></svg>';

function stStats(s) {
  const tr = s.trades, wins = tr.filter((t) => t[T.pnl] > 0), loss = tr.filter((t) => t[T.pnl] <= 0);
  const sum = (a) => a.reduce((x, t) => x + t[T.pnl], 0), end = tr[tr.length - 1][T.bal];
  const months = []; let prev = s.startBalance;
  for (const t of tr) {
    const key = t[T.tOut].slice(0, 7);
    let m = months[months.length - 1];
    if (!m || m.key !== key) { m = { key, from: prev, n: 0 }; months.push(m); }
    m.bal = t[T.bal]; m.n++; prev = t[T.bal];
  }
  months.forEach((m) => { m.chg = (m.bal / m.from - 1) * 100; });
  const side = (d) => { const x = tr.filter((t) => t[T.dir] === d); return { n: x.length, pnl: sum(x), wins: x.filter((t) => t[T.pnl] > 0).length }; };
  const why = {};
  for (const t of tr) { const w = (why[t[T.why]] = why[t[T.why]] || { n: 0, pnl: 0 }); w.n++; w.pnl += t[T.pnl]; }
  const to = tr[tr.length - 1][T.tOut].slice(0, 10);
  return {
    end, profit: end - s.startBalance, ret: (end / s.startBalance - 1) * 100, n: tr.length, wins: wins.length,
    winRate: (wins.length / tr.length) * 100, avgW: wins.length ? sum(wins) / wins.length : 0, avgL: loss.length ? sum(loss) / loss.length : 0,
    pf: loss.length && sum(loss) < 0 ? sum(wins) / -sum(loss) : null, months, long: side('LONG'), short: side('SHORT'), why,
    best: Math.max(...tr.map((t) => t[T.pnl])), worst: Math.min(...tr.map((t) => t[T.pnl])),
    from: s.startDate, to, open: tr.filter((t) => /open/i.test(t[T.why])).length,
    monthsSpan: Math.max(1, Math.round((Date.parse(to) - Date.parse(s.startDate)) / (30.44 * 864e5))),
    balances: [s.startBalance, ...tr.map((t) => t[T.bal])],
  };
}
ST.list.forEach((s) => { s.stats = stStats(s); });

function strategyCard(s, active = false) {
  const x = s.stats;
  return `<a class="panel pcard${active ? ' is-active' : ''}" href="premium.html#${esc(s.id)}">
    <div class="pcard-top">${icon({ t: s.market, kind: 'stocks' })}
      <div class="who"><b>${esc(s.name)}</b><small>${esc(s.market)} · ${esc(s.timeframe)} candles · ${esc(s.leverage)} leverage</small></div>
      <span class="badge prem">${CROWN}Premium</span></div>
    <div class="pcard-ret"><b class="${cls(x.ret)}">${fmtPct(x.ret, 0)}</b><span>backtested return over ${x.monthsSpan} months<br>${usd(s.startBalance, 0)} grew to ${usd(x.end, 0)}</span></div>
    ${sparkSVG(x.balances, 320, 70, true, UP)}
    <div class="pcard-facts">
      <div><small>Win rate</small><b>${x.winRate.toFixed(0)}%</b></div>
      <div><small>Profit factor</small><b>${x.pf == null ? '–' : x.pf.toFixed(2)}</b></div>
      <div><small>Trades</small><b>${x.n}</b></div>
      <div><small>Worst drop</small><b>${s.maxDrawdown.toFixed(1)}%</b></div>
    </div>
    <span class="pcard-link">See every trade →</span></a>`;
}

function initStrategyPage() {
  if (!ST.list.length) { $('stDetail').innerHTML = '<div class="skeleton">No strategies have been published yet.</div>'; return; }
  const fromHash = () => { const i = ST.list.findIndex((s) => '#' + s.id === location.hash); if (i >= 0) ST.i = i; };
  fromHash();
  window.addEventListener('hashchange', () => { fromHash(); ST.filter = 'all'; paintStrategy(); });
  $('stDetail').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tf]');
    if (!b) return;
    ST.filter = b.dataset.tf;
    b.parentElement.querySelectorAll('button').forEach((q) => q.classList.toggle('is-active', q === b));
    paintTrades();
  });
  const all = ST.list.map((s) => s.stats);
  $('pgStats').innerHTML = `
    <div><dt>${ST.list.length}</dt><dd>premium ${ST.list.length === 1 ? 'strategy' : 'strategies'}</dd></div>
    <div><dt>${all.reduce((n, x) => n + x.n, 0)}</dt><dd>trades on the record</dd></div>
    <div><dt class="up">${fmtPct(Math.max(...all.map((x) => x.ret)), 0)}</dt><dd>best backtested return</dd></div>`;
  paintStrategy();
}

function paintStrategy() {
  const s = ST.list[ST.i], x = s.stats;
  $('stList').innerHTML = ST.list.map((q, i) => strategyCard(q, i === ST.i)).join('');
  const kpi = (label, val, sub = '', c = '') => `<div class="panel kpi"><small>${label}</small><b class="${c}">${val}</b><span>${sub}</span></div>`;
  const maxM = Math.max(...x.months.map((m) => Math.abs(m.chg)), 1);
  const monthName = (k) => new Date(k + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const sideRow = (label, d, c) => `<div class="side-row"><span class="badge ${c}">${label}</span><span>${d.n} trades · ${d.wins} won</span><b class="mono ${cls(d.pnl)}">${usdS(d.pnl)}</b></div>`;
  const rules = s.rules && s.rules.length
    ? `<h3>How the strategy trades</h3><ol class="rules">${s.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>`
    : `<h3>How the strategy trades</h3><p class="st-sum">${esc(s.summary || '')}</p>
       <div class="locked"><span class="lock-ico">${LOCK}</span><div><b>Exact rules are for members</b><small>Entry and exit conditions, indicator settings and position sizing are included with the Pro plan.</small></div><a class="btn btn-primary btn-sm" href="index.html#pricing">Unlock</a></div>`;
  $('stDetail').innerHTML = `
    <div class="panel st-head">
      ${icon({ t: s.market, kind: 'stocks' }, 'lg')}
      <div class="who"><b>${esc(s.name)}</b><small>${esc(s.market)} · ${esc(s.marketName)} · ${esc(s.instrument)}</small></div>
      <div class="chips"><span class="badge prem">${CROWN}Premium</span><span class="badge hot">Backtest</span><span class="badge">${esc(s.timeframe)} candles</span><span class="badge">${esc(s.leverage)} leverage</span><span class="badge">${esc(s.risk)}</span><span class="badge">${dayLabel(x.from)} to ${dayLabel(x.to)}</span></div>
    </div>
    <div class="kpis">
      ${kpi('Total return', fmtPct(x.ret, 0), `${usd(s.startBalance, 0)} grew to ${usd(x.end, 0)}`, cls(x.ret))}
      ${kpi('Net profit', usdS(x.profit, 0), 'after fees, slippage and funding', cls(x.profit))}
      ${kpi('Win rate', x.winRate.toFixed(0) + '%', `${x.wins} winners of ${x.n} trades`)}
      ${kpi('Profit factor', x.pf == null ? '–' : x.pf.toFixed(2), 'gross profit ÷ gross loss')}
      ${kpi('Worst drop from a peak', s.maxDrawdown.toFixed(1) + '%', 'largest fall in the account', 'down')}
      ${kpi('Average winner', usdS(x.avgW, 0), `best trade ${usdS(x.best, 0)}`, 'up')}
      ${kpi('Average loser', usdS(x.avgL, 0), `worst trade ${usdS(x.worst, 0)}`, 'down')}
      ${kpi('Trades', x.n, `${x.long.n} long · ${x.short.n} short`)}
    </div>
    <div class="st-grid">
      <div class="panel st-box"><div class="st-box-head"><h3>Account balance</h3><span class="stamp">USDT · times in ${esc(s.timezone)}</span></div><div class="st-chart"><div id="stChart"></div></div></div>
      <div class="panel st-box">
        <h3>Month by month</h3>
        <div class="months">${x.months.map((m) => `<div class="month"><span>${monthName(m.key)}</span><div class="mbar"><i class="${m.chg >= 0 ? 'pos' : 'neg'}" style="width:${(Math.abs(m.chg) / maxM) * 100}%"></i></div><b class="mono ${cls(m.chg)}">${fmtPct(m.chg, 1)}</b><em class="mono">${usd(m.bal, 0)}</em></div>`).join('')}</div>
        <h3 style="margin-top:22px">Long vs short</h3>
        <div class="sides">${sideRow('LONG', x.long, 'good')}${sideRow('SHORT', x.short, 'bad')}</div>
      </div>
    </div>
    <div class="st-grid even">
      <div class="panel st-box">${rules}<p class="note">${esc(s.costs)}</p></div>
      <div class="panel st-box"><h3>Why trades closed</h3>
        <div class="sides">${Object.entries(x.why).sort((p, q) => q[1].n - p[1].n).map(([w, d]) => `<div class="side-row"><span>${esc(w)}</span><span>${d.n} ${d.n === 1 ? 'trade' : 'trades'}</span><b class="mono ${cls(d.pnl)}">${usdS(d.pnl)}</b></div>`).join('')}</div>
      </div>
    </div>
    <div class="st-trades-head">
      <h3>All ${x.n} trades</h3>
      <div class="seg"><button class="is-active" data-tf="all">All</button><button data-tf="LONG">Long</button><button data-tf="SHORT">Short</button><button data-tf="win">Winners</button><button data-tf="loss">Losers</button></div>
    </div>
    <div class="table-wrap st-table"><table class="mkt trades">
      <thead><tr><th>#</th><th>Direction</th><th>Entry (${esc(s.timezone)})</th><th class="num">Entry $</th><th class="num">Stop $</th><th>Exit (${esc(s.timezone)})</th><th class="num">Exit $</th><th class="num">Hours</th><th>Why closed</th><th class="num">Position $</th><th class="num">Lev.</th><th class="num">Profit $</th><th>Profit %</th><th class="num">Balance after</th></tr></thead>
      <tbody id="stBody"></tbody>
    </table></div>
    <p class="note">Backtest only: no real orders were placed.${x.open ? ' The last trade was still open and is valued at the latest price.' : ''} "Lev." is position size divided by the balance at entry, and "Profit %" is the change in the whole account from that trade. Past results do not guarantee future results, and leverage can lose money fast if price gaps past the stop-loss. Not financial advice.</p>
    <div class="panel cta-band"><div><h3>Trade this strategy with the full rule set</h3><p>Pro members get the exact rules, settings and every new premium strategy as it is published.</p></div><a class="btn btn-primary" href="index.html#pricing">See plans</a></div>`;
  paintTrades();
  if (LW) {
    ST.chart = LW.createChart($('stChart'), { ...chartBase, handleScroll: false, handleScale: false, timeScale: { ...chartBase.timeScale, timeVisible: false } });
    const line = ST.chart.addBaselineSeries({
      baseValue: { type: 'price', price: s.startBalance }, lineType: 1, lineWidth: 2,
      topLineColor: UP, topFillColor1: 'rgba(10,157,108,.22)', topFillColor2: 'rgba(10,157,108,.02)',
      bottomLineColor: DOWN, bottomFillColor1: 'rgba(229,72,77,.02)', bottomFillColor2: 'rgba(229,72,77,.2)',
      priceFormat: { type: 'custom', formatter: (v) => '$' + Math.round(v).toLocaleString('en-US'), minMove: 1 },
    });
    const pts = [{ time: asTime(s.startDate + ' 00:00'), value: s.startBalance }];
    for (const t of s.trades) pts.push({ time: Math.max(asTime(t[T.tOut]), pts[pts.length - 1].time + 1), value: t[T.bal] });
    line.setData(pts);
    ST.chart.timeScale().fitContent();
  }
}

function paintTrades() {
  const s = ST.list[ST.i], f = ST.filter;
  const rows = s.trades.filter((t) => f === 'all' || (f === 'win' ? t[T.pnl] > 0 : f === 'loss' ? t[T.pnl] <= 0 : t[T.dir] === f));
  const maxP = Math.max(...s.trades.map((t) => Math.abs(t[T.pct])), 1);
  $('stBody').innerHTML = rows.map((t) => {
    const c = cls(t[T.pnl]), long = t[T.dir] === 'LONG';
    return `<tr>
      <td class="rank">${t[T.n]}</td>
      <td><span class="badge ${long ? 'good' : 'bad'}">${long ? '▲ LONG' : '▼ SHORT'}</span></td>
      <td class="mono">${t[T.tIn]}</td><td class="num">${t[T.pIn].toFixed(2)}</td><td class="num dim">${t[T.stop].toFixed(2)}</td>
      <td class="mono">${t[T.tOut]}</td><td class="num">${t[T.pOut].toFixed(2)}</td><td class="num dim">${t[T.hrs]}</td>
      <td class="dim why">${esc(t[T.why])}</td>
      <td class="num">${t[T.pos].toLocaleString('en-US')}</td><td class="num dim">${t[T.lev].toFixed(2)}x</td>
      <td class="num ${c}"><b>${usdS(t[T.pnl])}</b></td>
      <td><div class="pbar"><i class="${t[T.pnl] > 0 ? 'pos' : 'neg'}" style="width:${(Math.abs(t[T.pct]) / maxP) * 100}%"></i><span class="mono ${c}">${fmtPct(t[T.pct])}</span></div></td>
      <td class="num">${usd(t[T.bal])}</td></tr>`;
  }).join('') || '<tr><td colspan="14" class="skeleton">No trades in this filter.</td></tr>';
}
