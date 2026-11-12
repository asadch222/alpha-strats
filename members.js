/* Members area: the premium tools, shown after logging in.
   Daily brief, dip alerts, strategy signals, personal price alerts, risk calculator, requests. */

const mem = { alerts: [], notify: false, seenDips: new Set(), tab: 'home' };
function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = text;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 7000);
  if (mem.notify && 'Notification' in window && Notification.permission === 'granted') new Notification('AlphaStrats', { body: text });
}

/* ---------- daily brief, written from live data ---------- */
function paintBrief() {
  const top = (kind, dir, n = 3) => all(kind).filter((a) => a.vol > (kind === 'crypto' ? 5e6 : 1e6)).sort((x, y) => (y.chg - x.chg) * dir).slice(0, n);
  const names = (list) => list.map((a) => `<a data-go="${a.id}"><b>${esc(a.t)}</b> <span class="${cls(a.chg)}">${fmtPct(a.chg, 1)}</span></a>`).join(', ');
  const share = (kind) => { const l = all(kind); return l.length ? Math.round((l.filter((a) => a.chg >= 0).length / l.length) * 100) : 0; };
  const sc = all().filter((a) => a.k && a.k.scan).sort((x, y) => x.k.scan.fg - y.k.scan.fg);
  const btc = A.get('p:BTCUSDT'), sC = share('crypto'), sS = share('stocks');
  const mood = marketFG ? `The crypto mood index reads <b style="color:${fgInfo(marketFG.v)[1]}">${marketFG.v} (${esc(marketFG.label)})</b>${marketFG.hist[1] ? `, ${marketFG.v > marketFG.hist[1].v ? 'up' : marketFG.v < marketFG.hist[1].v ? 'down' : 'unchanged'} from ${marketFG.hist[1].v} yesterday` : ''}.` : '';
  const line = (h, body) => `<div class="br-item"><h4>${h}</h4><p>${body}</p></div>`;
  $('briefBody').innerHTML = `<p class="br-date">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · updates live</p>
    ${line('The big picture', `${btc ? `Bitcoin is at <b>${fmtPx(btc.price)}</b>, <span class="${cls(btc.chg)}">${fmtPct(btc.chg, 1)}</span> over 24 hours. ` : ''}${sC}% of coins and ${sS}% of stocks are higher than a day ago, so the day is ${sC > 60 && sS > 60 ? 'broadly positive' : sC < 40 && sS < 40 ? 'broadly negative' : 'mixed'}. ${mood}`)}
    ${line('Stocks on the move', `Leading: ${names(top('stocks', 1))}. Lagging: ${names(top('stocks', -1))}.`)}
    ${line('Crypto on the move', `Leading: ${names(top('crypto', 1))}. Lagging: ${names(top('crypto', -1))}.`)}
    ${sc.length ? line('Mood extremes', `Most fearful right now: ${sc.slice(0, 3).map((a) => `<a data-go="${a.id}"><b>${esc(a.t)}</b> (${a.k.scan.fg})</a>`).join(', ')}. Most greedy: ${sc.slice(-3).reverse().map((a) => `<a data-go="${a.id}"><b>${esc(a.t)}</b> (${a.k.scan.fg})</a>`).join(', ')}.`) : ''}
    <p class="note">Written automatically from live market data. It describes what has happened; it is not a forecast or advice.</p>`;
}

/* ---------- dip-buying alerts ---------- */
function paintDips() {
  const list = all().filter((a) => a.k && a.k.scan && a.vol > 2e5 && a.kind !== 'commodities').filter((a) => { const s = a.k.scan; return (s.up && s.rsi < 45) || s.rsi < 30; }).sort((x, y) => x.k.scan.rsi - y.k.scan.rsi);
  $('dipList').innerHTML = list.map((a) => { const s = a.k.scan; return `<div class="fund-row" data-id="${a.id}" data-go="${a.id}">${icon(a, 'sm')}${who(a)}<span class="mono" data-f="p"></span><span class="mono" data-f="c"></span><span class="badge ${s.tone}">${s.setup}</span><span class="mono dimtxt">RSI ${s.rsi.toFixed(0)}</span></div>`; }).join('')
    || '<div class="skeleton">No market matches the dip rules right now. This list refreshes every few minutes.</div>';
  setT('dipCount', list.length ? `${list.length} now` : '');
  const fresh = list.filter((a) => !mem.seenDips.has(a.id));
  if (mem.seenDips.size && fresh.length) toast(`New dip setup: ${fresh.slice(0, 3).map((a) => a.t).join(', ')}`);
  list.forEach((a) => mem.seenDips.add(a.id)); if (!mem.seenDips.size) mem.seenDips.add('-');
  paint();
}

/* ---------- strategy signals ---------- */
function paintSignals() {
  $('sigBody').innerHTML = ST.list.map((s) => {
    const last = s.trades[s.trades.length - 1], open = /open/i.test(last[T.why]), long = last[T.dir] === 'LONG';
    return `<div class="sig"><div class="sig-top">${icon({ t: s.market, kind: 'stocks' })}<div class="who"><b>${esc(s.name)}</b><small>${esc(s.market)} · ${esc(s.timeframe)} candles</small></div><span class="badge ${open ? 'hot' : ''}">${open ? 'Position open' : 'No open position'}</span></div>
      <div class="sig-now"><div><small>Latest signal</small><b class="${long ? 'up' : 'down'}">${long ? '▲ Long' : '▼ Short'}</b></div><div><small>Entry</small><b class="mono">${last[T.pIn].toFixed(2)}</b></div><div><small>Stop-loss</small><b class="mono">${last[T.stop].toFixed(2)}</b></div><div><small>${open ? 'Marked at' : 'Exit'}</small><b class="mono">${last[T.pOut].toFixed(2)}</b></div><div><small>Result</small><b class="mono ${cls(last[T.pnl])}">${fmtPct(last[T.pct])}</b></div></div>
      <small class="dimtxt">Entered ${last[T.tIn]} (${esc(s.timezone)}). Previous five: ${s.trades.slice(-6, -1).reverse().map((t) => `<span class="${cls(t[T.pnl])}">${fmtPct(t[T.pct], 1)}</span>`).join(' · ')}</small>
      <a class="lnk" href="premium.html#${esc(s.id)}">Full trade record →</a></div>`;
  }).join('') + '<p class="note">Signals shown here come from the published strategy records and update when a new trade is added to the record. They are rule-based results, not personal advice.</p>';
}

/* ---------- personal price alerts ---------- */
function paintAlerts() {
  $('alertList').innerHTML = mem.alerts.map((r, i) => { const a = A.get(r.id); return a ? `<div class="fund-row" data-id="${a.id}">${icon(a, 'sm')}${who(a)}<span>${r.dir === 'above' ? 'rises above' : 'falls below'} <b class="mono">${fmtPx(r.px)}</b></span><span class="mono" data-f="p"></span><span class="badge ${r.hit ? 'good' : ''}">${r.hit ? 'Triggered' : 'Watching'}</span><button class="x" data-del="${i}" aria-label="Remove alert">✕</button></div>` : ''; }).join('')
    || '<div class="skeleton">No alerts yet. Add your first one above.</div>';
  paint();
}
function checkAlerts() {
  let changed = false;
  for (const r of mem.alerts) {
    const a = A.get(r.id);
    if (!a || r.hit || a.price == null) continue;
    if ((r.dir === 'above' && a.price >= r.px) || (r.dir === 'below' && a.price <= r.px)) { r.hit = true; changed = true; toast(`${a.t} ${r.dir === 'above' ? 'rose above' : 'fell below'} ${fmtPx(r.px)} (now ${fmtPx(a.price)})`); }
  }
  if (changed) { Auth.set('alerts', mem.alerts); paintAlerts(); }
}

/* ---------- risk calculator ---------- */
function paintRisk() {
  const v = (id) => parseFloat($(id).value), acct = v('rkAcct'), risk = v('rkRisk'), entry = v('rkEntry'), stop = v('rkStop');
  if (!(acct > 0 && risk > 0 && entry > 0 && stop > 0) || entry === stop) { $('rkOut').innerHTML = '<div class="skeleton">Fill in all four boxes. Entry and stop must be different prices.</div>'; return; }
  const lose = acct * risk / 100, dist = Math.abs(entry - stop), units = lose / dist, size = units * entry, lev = size / acct;
  const cell = (l, val, line) => `<div class="metric"><small>${l}</small><b>${val}</b><em>${line}</em></div>`;
  $('rkOut').innerHTML = cell('Position size', usd(size, 0), `${units.toLocaleString('en-US', { maximumFractionDigits: 4 })} units`) + cell('If the stop is hit you lose', usd(lose, 2), `${risk}% of your account`)
    + cell('Stop distance', ((dist / entry) * 100).toFixed(2) + '%', entry > stop ? 'Long trade (stop below entry)' : 'Short trade (stop above entry)') + cell('Leverage needed', lev.toFixed(2) + 'x', lev > 1 ? 'More than your account: needs borrowed money' : 'No borrowing needed');
}

/* ---------- overview: the first screen after logging in ---------- */
function paintHome() {
  const mk = all(), up = mk.length ? (mk.filter((a) => a.chg >= 0).length / mk.length) * 100 : 0;
  const dips = mk.filter((a) => a.k && a.k.scan && a.vol > 2e5 && a.kind !== 'commodities').filter((a) => { const s = a.k.scan; return (s.up && s.rsi < 45) || s.rsi < 30; }).sort((x, y) => x.k.scan.rsi - y.k.scan.rsi);
  const watching = mem.alerts.filter((r) => !r.hit).length, desk = Site.trades().filter((t) => t.status !== 'closed' && t.show !== false && A.has(t.market)).length;
  if (!$('mkMood')) {
    const tile = (id, label, sub) => `<div class="panel kpi5"><small>${label}</small><b id="${id}">–</b><em id="${id}S">${sub}</em></div>`;
    $('memKpis').innerHTML = tile('mkMood', 'Market mood', 'crypto fear and greed') + tile('mkUp', 'Markets rising', 'of all markets, last 24 hours') + tile('mkDips', 'Dip setups', 'matching the rules now') + tile('mkAl', 'My alerts', 'watching a price') + tile('mkDesk', 'Desk trades', 'open right now');
  }
  if (marketFG) { countUp($('mkMood'), marketFG.v); $('mkMood').style.color = fgInfo(marketFG.v)[1]; setT('mkMoodS', marketFG.label + ' today'); }
  countUp($('mkUp'), up, (v) => Math.round(v) + '%'); countUp($('mkDips'), dips.length); countUp($('mkAl'), watching); countUp($('mkDesk'), desk);
  const row = (a, tail) => `<div class="fund-row" data-id="${a.id}" data-go="${a.id}">${icon(a, 'sm')}${who(a)}<span class="mono" data-f="p"></span><span class="mono" data-f="c"></span>${tail}</div>`;
  const mine = [...watch].map((id) => A.get(id)).filter(Boolean).slice(0, 8);
  $('memWatch').innerHTML = mine.map((a) => row(a, '')).join('') || '<div class="skeleton">Nothing starred yet. Tap ★ next to any market on the <a class="lnk" href="markets.html">markets page</a>.</div>';
  $('memDipTop').innerHTML = dips.slice(0, 5).map((a) => row(a, `<span class="badge ${a.k.scan.tone}">${a.k.scan.setup}</span>`)).join('') || '<div class="skeleton">No market matches the dip rules right now.</div>';
  paint();
}

/* ---------- start ---------- */
async function initMembers() {
  await Auth.ready;
  const u = Auth.user();
  $('memGate').hidden = !!u; $('memApp').hidden = !u;
  if (!u) return;
  setT('memName', u.name); setT('memPlan', Auth.planLabel()); setT('memEmail', u.email);
  const hr = new Date().getHours(), first = u.name.split(' ')[0];
  setT('memAva', first.slice(0, 1).toUpperCase()); setT('memFirst', first); setT('memHello', hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening');
  setT('memDate', new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }));
  const NAV = [['home', 'Overview', 'home'], ['brief', 'Daily brief', 'brief'], ['dips', 'Dip alerts', 'dip'], ['signals', 'Strategy signals', 'signal'], ['alerts', 'My price alerts', 'bell'], ['risk', 'Risk calculator', 'calc'], ['more', 'Community', 'chat']];
  $('memTabs').innerHTML = NAV.map(([t, label, ic], i) => `<button data-t="${t}" class="${i ? '' : 'is-active'}">${pIcon(ic)}<span>${label}</span></button>`).join('');
  document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => $('memTabs').querySelector(`[data-t="${b.dataset.goto}"]`).click()));
  $('memPreview').hidden = Auth.live;
  const locked = Auth.live && !Auth.isPro();
  $('memUpgrade').hidden = !locked;
  document.querySelectorAll('[data-pro]').forEach((el) => el.classList.toggle('is-locked', locked));
  mem.alerts = Auth.get('alerts', []); mem.notify = Auth.get('notify', false);
  $('ntToggle').checked = mem.notify && 'Notification' in window && Notification.permission === 'granted';
  $('ntToggle').addEventListener('change', async (e) => {
    if (e.target.checked && 'Notification' in window && Notification.permission !== 'granted') { const p = await Notification.requestPermission(); if (p !== 'granted') e.target.checked = false; }
    mem.notify = e.target.checked; Auth.set('notify', mem.notify);
  });
  $('memOut').addEventListener('click', async () => { await Auth.signOut(); location.href = 'index.html'; });
  segment($('memTabs'), (d) => { mem.tab = d.t; document.querySelectorAll('.mem-pane').forEach((p) => { p.hidden = p.id !== 'pane-' + d.t; }); });
  // alerts form
  let pick = A.get('p:BTCUSDT');
  const setPick = (m) => { pick = m; $('alMarket').value = m.t; $('alPrice').value = +m.price.toPrecision(5); };
  mountPicker($('alMarket'), $('alMarketBox'), setPick); if (pick) setPick(pick);
  $('alMarket').addEventListener('blur', () => setTimeout(() => { if (pick) $('alMarket').value = pick.t; }, 200));
  $('alAdd').addEventListener('click', () => {
    const px = parseFloat($('alPrice').value);
    if (!pick || !(px > 0)) return toast('Choose a market and enter a price first.');
    mem.alerts.push({ id: pick.id, dir: $('alDir').value, px, hit: false }); Auth.set('alerts', mem.alerts); paintAlerts();
  });
  $('alertList').addEventListener('click', (e) => { const b = e.target.closest('[data-del]'); if (!b) return; e.stopPropagation(); mem.alerts.splice(+b.dataset.del, 1); Auth.set('alerts', mem.alerts); paintAlerts(); });
  ['rkAcct', 'rkRisk', 'rkEntry', 'rkStop'].forEach((id) => $(id).addEventListener('input', paintRisk));
  $('rqSend').addEventListener('click', async () => {
    const m = $('rqMarket').value.trim(), idea = $('rqIdea').value.trim();
    if (!m || idea.length < 10) return toast('Tell us the market and describe the idea in a sentence or two.');
    try { const r = await Auth.request(m, idea); toast(r === 'saved' ? 'Request sent. We will reply by email.' : 'Your email app should now open with the request.'); if (r === 'saved') $('rqIdea').value = ''; } catch (e) { toast(e.message); }
  });
  const inv = (window.AS_CONFIG || {}).discordInvite;
  $('discordBtn').textContent = inv ? 'Join the Discord' : 'Invite link coming soon';
  if (inv) $('discordBtn').href = inv; else $('discordBtn').classList.add('is-off');
  paintBrief(); paintSignals(); paintAlerts(); paintRisk(); paintDips(); paintHome();
  setInterval(paintHome, 15000);
  setInterval(paintBrief, 20000); setInterval(checkAlerts, 2000);
}
function onScan() { if (has('memApp') && !$('memApp').hidden) { paintDips(); paintBrief(); paintHome(); } }
