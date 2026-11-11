/* The live "decision engine" on the home page.
   One market at a time travels through five columns (data, checks, score, gate, verdict).
   The glowing line shows which checks it passed, using the same analysis as the rest of the site. */
const PIPE = (() => {
  const W = 1500, H = 640, NW = 200;
  const COLS = [
    { x: 40, name: '1 · Data in', nodes: [['price', 'Live price'], ['chg', '24h change'], ['vol', '24h volume'], ['bars', 'Hourly candles']] },
    { x: 345, name: '2 · Checks', nodes: [['trend', 'Trend'], ['rsi', 'Momentum (RSI)'], ['dd', 'Pullback from high'], ['volr', 'Volume vs normal'], ['brk', 'Breakout']] },
    { x: 650, name: '3 · Score', nodes: [['score', 'Setup score'], ['mood', 'Fear & greed']] },
    { x: 955, name: '4 · Gate', nodes: [['g1', 'Trend up?'], ['g2', 'Not overheated?'], ['g3', 'Score 60 or more?']] },
    { x: 1260, name: '5 · Verdict', nodes: [['vGood', 'Setup found'], ['vWatch', 'Watch'], ['vBad', 'No setup']] },
  ];
  const HINT = { // one plain line under each box
    price: 'the latest traded price', chg: 'move over the last day', vol: 'money traded in a day', bars: 'price history we read',
    trend: 'fast average vs slow average', rsi: 'how stretched the move is', dd: 'how far below the recent top', volr: 'is trading busier than usual', brk: 'is price at a new high',
    score: 'all checks in one number', mood: 'are traders scared or greedy',
    g1: 'only trade with the trend', g2: 'do not chase a hot move', g3: 'only strong setups pass',
    vGood: 'the rules like this market', vWatch: 'close, but not yet', vBad: 'the rules say stay out',
  };
  const TONE = { good: ['#b4ff39', 'PASS'], watch: ['#ffb224', 'WATCH'], bad: ['#ff4d6a', 'FAIL'] };
  const LINKS = [ // which box feeds which
    ['price', 'trend'], ['bars', 'trend'], ['bars', 'rsi'], ['price', 'dd'], ['bars', 'dd'], ['vol', 'volr'], ['chg', 'brk'], ['price', 'brk'],
    ['trend', 'score'], ['rsi', 'score'], ['dd', 'score'], ['volr', 'score'], ['brk', 'score'], ['rsi', 'mood'], ['trend', 'mood'],
    ['score', 'g1'], ['score', 'g2'], ['score', 'g3'], ['mood', 'g2'],
  ];
  const N = {}; // node id -> { x, y, w, h, col, el }
  let stage, world, cv, ctx, bg, dpr = 1, ready = false, visible = true;
  let cam = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2, s: 1 };
  let t0 = 0, queue = [], qi = -1, cur = null, edges = [], sparks = [], timers = [], checks = 0, log = [], rate = [], lastTicks = 0, ring = null;
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function build() {
    stage = $('pipeStage'); world = $('pipeWorld');
    world.style.width = W + 'px'; world.style.height = H + 'px';
    let html = '<canvas id="pipeCv"></canvas>';
    COLS.forEach((c, ci) => {
      html += `<span class="pn-col" style="left:${c.x}px">${c.name}</span>`;
      const gap = (H - 70) / c.nodes.length;
      c.nodes.forEach(([id, label], i) => {
        const y = 62 + gap * i + (gap - 78) / 2;
        N[id] = { x: c.x, y, w: NW, h: 78, col: ci };
        html += `<div class="pn" id="pn-${id}" style="left:${c.x}px;top:${y}px"><b>${label}</b><em data-v>–</em><small>${HINT[id]}</small></div>`;
      });
    });
    world.innerHTML = html;
    Object.keys(N).forEach((id) => { N[id].el = $('pn-' + id); });
    cv = $('pipeCv'); ctx = cv.getContext('2d');
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    drawBackground();
    for (let i = 0; i < 70; i++) sparks.push(newSpark());
  }

  // a wire from the right edge of one box to the left edge of another
  function curve(a, b) {
    const p = N[a], q = N[b];
    const x0 = p.x + p.w, y0 = p.y + p.h / 2, x3 = q.x, y3 = q.y + q.h / 2, m = (x0 + x3) / 2;
    return [x0, y0, m, y0, m, y3, x3, y3];
  }
  function at(c, t) {
    const u = 1 - t;
    return [u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6], u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7]];
  }
  const allPairs = [];
  function drawBackground() {
    bg = document.createElement('canvas'); bg.width = cv.width; bg.height = cv.height;
    const g = bg.getContext('2d'); g.scale(dpr, dpr);
    g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 1; // floor grid
    for (let x = 0; x <= W; x += 50) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y <= H; y += 50) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const tint = ['rgba(150,190,255,', 'rgba(255,255,255,', 'rgba(255,120,190,'];
    for (let ci = 0; ci < COLS.length - 1; ci++) {
      COLS[ci].nodes.forEach(([a], i) => COLS[ci + 1].nodes.forEach(([b], j) => {
        const c = curve(a, b); allPairs.push(c);
        g.strokeStyle = tint[(i + j + ci) % 3] + '.13)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(c[0], c[1]); g.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]); g.stroke();
      }));
      const gx = COLS[ci].x + NW + (COLS[ci + 1].x - COLS[ci].x - NW) / 2; // bright bundle of wires between two columns
      for (let k = 0; k < 4; k++) {
        g.strokeStyle = tint[k % 3] + (k ? '.16)' : '.5)'); g.lineWidth = k ? 1 : 1.4;
        g.beginPath(); g.moveTo(gx + (k - 1.5) * 5, 0);
        for (let y = 0; y <= H; y += 40) g.lineTo(gx + (k - 1.5) * 5 + Math.sin(y / 70 + k * 2 + ci) * (4 + k * 3), y);
        g.stroke();
      }
    }
  }
  function newSpark() { return { c: allPairs[Math.floor(Math.random() * allPairs.length)], t: Math.random(), v: 0.0015 + Math.random() * 0.004, r: 0.8 + Math.random() * 1.4 }; }

  /* ---------- one market's journey ---------- */
  function verdictOf(s) { return s.tone === 'good' ? 'good' : s.tone === 'bad' ? 'bad' : 'watch'; }
  function valuesFor(a) {
    const s = a.k.scan, [fl] = fgInfo(s.fg);
    const hot = s.rsi > 70;
    return {
      price: [fmtPx(a.price)], chg: [fmtPct(a.chg), a.chg >= 0], vol: ['$' + fmtVol(a.vol)], bars: [a.k.closes.length + ' read'],
      trend: [s.up ? 'Up' : 'Down', s.up], rsi: [Math.round(s.rsi) + (s.rsi < 30 ? ' · oversold' : hot ? ' · overheated' : ' · normal'), !hot],
      dd: ['−' + s.dd.toFixed(1) + '%'], volr: [s.volRatio == null ? 'n/a' : s.volRatio.toFixed(1) + '× normal', s.volRatio > 1.2], brk: [s.breakout ? 'Yes, new high' : 'No', s.breakout],
      score: [s.score + ' / 100', s.score >= 60], mood: [s.fg + ' · ' + fl],
      g1: [s.up ? '✓ Yes' : '✕ No', s.up], g2: [hot ? '✕ No' : '✓ Yes', !hot], g3: [s.score >= 60 ? '✓ Yes' : '✕ No', s.score >= 60],
    };
  }
  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function light(id, val, color) {
    const n = N[id], v = n.el.querySelector('[data-v]');
    if (val) { v.textContent = val[0]; v.className = val[1] === true ? 'ok' : val[1] === false ? 'no' : ''; }
    n.el.style.setProperty('--c', color); n.el.classList.add('on');
    cam.tx = n.x + n.w / 2 + 90; cam.ty = n.y + n.h / 2;
    ring = { x: n.x + n.w - 26, y: n.y + n.h / 2, t: performance.now(), color };
    checks++; setT('pipeChecks', checks.toLocaleString());
  }
  function stageChip(i) { document.querySelectorAll('#pipeSteps i').forEach((e, k) => e.classList.toggle('on', k <= i)); }
  function addEdge(a, b, color) { edges.push({ c: curve(a, b), t0: performance.now(), color }); }

  function run(a) {
    const s = a.k.scan, v = verdictOf(s), [color, badge] = TONE[v], val = valuesFor(a);
    cur = { a, s, v, color };
    timers.forEach(clearTimeout); timers = []; edges = [];
    Object.values(N).forEach((n) => { n.el.classList.remove('on', 'end'); n.el.querySelector('[data-v]').textContent = '–'; n.el.querySelector('[data-v]').className = ''; });
    const box = $('pipe'); box.style.setProperty('--c', color);
    setHTML('pipeCase', `<span class="pc-tag">Market ${qi + 1} / ${queue.length}</span>${icon(a, 'sm')}<b>${esc(a.t)}</b><span class="pc-name">${esc(a.name || a.sub || '')}</span>`);
    $('pipeCase').onclick = () => go(a.id);
    setT('pipePath', 'Reading live data…'); setT('pipeScore', '–'); setHTML('pipeBadge', '');
    paintQueue(); paintBars(null);
    let t = 300;
    stageChip(0);
    ['price', 'chg', 'vol', 'bars'].forEach((id) => { later(t, () => light(id, val[id], color)); t += 260; });
    later(t, () => { stageChip(1); setT('pipePath', 'Running the five checks…'); });
    ['trend', 'rsi', 'dd', 'volr', 'brk'].forEach((id) => {
      later(t, () => LINKS.filter((l) => l[1] === id).forEach((l) => addEdge(l[0], id, color)));
      later(t + 330, () => light(id, val[id], color)); t += 520;
    });
    later(t, () => { stageChip(2); setT('pipePath', `Trend ${s.up ? 'up' : 'down'} · RSI ${Math.round(s.rsi)} · adding it up…`); LINKS.filter((l) => l[1] === 'score' || l[1] === 'mood').forEach((l) => addEdge(l[0], l[1], color)); });
    later(t + 380, () => { light('mood', val.mood, color); });
    later(t + 620, () => { light('score', val.score, color); setT('pipeScore', s.score); paintBars(s); }); t += 1150;
    later(t, () => { stageChip(3); setT('pipePath', `Score ${s.score} · checking the three safety rules…`); });
    ['g1', 'g2', 'g3'].forEach((id) => {
      later(t, () => LINKS.filter((l) => l[1] === id).forEach((l) => addEdge(l[0], id, color)));
      later(t + 330, () => light(id, val[id], color)); t += 520;
    });
    const end = v === 'good' ? 'vGood' : v === 'bad' ? 'vBad' : 'vWatch';
    later(t, () => { stageChip(4); ['g1', 'g2', 'g3'].forEach((g) => addEdge(g, end, color)); });
    later(t + 420, () => {
      light(end, [s.setup], color); N[end].el.classList.add('end');
      setT('pipePath', s.why);
      setHTML('pipeBadge', `<span class="pbadge">${badge}</span>`);
      a._pv = v; paintQueue();
      log.unshift(`<li><span>${new Date().toLocaleTimeString([], { hour12: false })}</span><b>${esc(a.t)}</b><span>score ${s.score}</span><i style="color:${color}">${esc(s.setup)}</i></li>`); log.length = Math.min(log.length, 5);
      setHTML('pipeLog', log.join(''));
    });
    later(t + 3000, next);
  }

  function next() {
    if (!visible) { later(1500, next); return; } // do not burn through markets while nobody is looking
    qi++;
    if (qi >= queue.length || !queue.length) {
      const scanned = all().filter((a) => a.k && a.k.scan).length; // wait for coins and stocks, but not for ever
      if (scanned < 40 && performance.now() - t0 < 15000) { qi = -1; setT('pipePath', 'Loading price history for the first markets…'); later(800, next); return; }
      buildQueue(); qi = 0;
    }
    if (!queue.length) { setT('pipePath', 'Loading price history for the first markets…'); later(1500, next); return; }
    run(queue[qi]);
  }
  function buildQueue() { // six most-traded coins and six most-traded stocks, taking turns
    const ok = (k) => all(k).filter((a) => a.k && a.k.scan && a.price != null).sort(byVol).slice(0, 6);
    const c = ok('crypto'), s = ok('stocks'); queue = [];
    for (let i = 0; i < 6; i++) { if (c[i]) queue.push(c[i]); if (s[i]) queue.push(s[i]); }
    queue.forEach((a) => { a._pv = null; });
    paintSplit(); paintStream();
  }

  /* ---------- the small panels under the stage ---------- */
  function paintQueue() {
    setHTML('pipeQueue', queue.map((a, i) => `<span class="${i === qi ? 'now' : ''}" style="${a._pv ? '--q:' + TONE[a._pv][0] : ''}" data-go="${a.id}">${esc(a.t)}</span>`).join(''));
  }
  function paintBars(s) {
    const rows = s ? [['Trend', clamp(50 + (cur.a.price / s.e50 - 1) * 800, 0, 100)], ['Momentum', s.rsi], ['Mood', s.fg], ['Volume', s.volRatio == null ? 0 : clamp(s.volRatio * 40, 0, 100)], ['Score', s.score]] : [['Trend', 0], ['Momentum', 0], ['Mood', 0], ['Volume', 0], ['Score', 0]];
    setHTML('pipeBars', rows.map(([l, v]) => `<div><span>${l}</span><u><i style="width:${Math.round(v)}%"></i></u><b>${s ? Math.round(v) : '–'}</b></div>`).join(''));
  }
  function paintSplit() {
    const done = all().filter((a) => a.k && a.k.scan), n = done.length || 1;
    const c = { good: 0, watch: 0, bad: 0 }; done.forEach((a) => { c[verdictOf(a.k.scan)]++; });
    setHTML('pipeSplit', [['Setup found', 'good'], ['Watch', 'watch'], ['No setup', 'bad']].map(([l, k]) => `<div><span>${l}</span><u><i style="width:${(c[k] / n) * 100}%;background:${TONE[k][0]}"></i></u><b>${c[k]}</b></div>`).join(''));
    setT('pipeAnalysed', done.length);
  }
  function paintStream() { // every analysed market's score as one line, busiest markets first
    const el = $('pipeStream'); if (!el) return;
    const v = all().filter((a) => a.k && a.k.scan).sort(byVol).map((a) => a.k.scan.score);
    if (v.length < 2) return;
    const w = 300, h = 70, pts = v.map((y, i) => `${((i / (v.length - 1)) * w).toFixed(1)},${(h - 6 - (y / 100) * (h - 12)).toFixed(1)}`).join(' ');
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="0" x2="${w}" y1="${h - 6 - 0.6 * (h - 12)}" y2="${h - 6 - 0.6 * (h - 12)}" class="ps-gate"/><polyline points="${pts}" class="ps-line"/></svg><small>Dotted line = the score of 60 a market needs to pass</small>`;
  }
  function paintRate() {
    const d = stats.ticks - lastTicks; lastTicks = stats.ticks; rate.push(d); if (rate.length > 40) rate.shift();
    setT('pipeRate', d.toLocaleString());
    const m = Math.max(1, ...rate);
    setHTML('pipeRateSpark', `<svg viewBox="0 0 80 22" preserveAspectRatio="none"><polyline points="${rate.map((y, i) => `${(i / 39) * 80},${21 - (y / m) * 19}`).join(' ')}"/></svg>`);
    setT('pipeAnalysed', stats.analysed);
  }

  /* ---------- drawing ---------- */
  function glow(c, upTo, color) {
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) { const p = at(c, (i / 26) * upTo); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
    ctx.strokeStyle = color; ctx.globalAlpha = 0.1; ctx.lineWidth = 16; ctx.stroke();
    ctx.globalAlpha = 0.22; ctx.lineWidth = 7; ctx.stroke();
    ctx.globalAlpha = 0.95; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.7; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function dot(x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, '#fff'); g.addColorStop(0.25, color); g.addColorStop(1, 'transparent');
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || !ready) return;
    // camera: glide towards the box being checked, with a slow sway
    const sw = stage.clientWidth, sh = stage.clientHeight;
    cam.s = clamp(sw / 1180, 0.56, 0.98);
    const halfW = sw / cam.s / 2, halfH = sh / cam.s / 2;
    const tx = halfW >= W / 2 ? W / 2 : clamp(cam.tx, halfW - 30, W - halfW + 30), ty = halfH >= H / 2 ? H / 2 : clamp(cam.ty, halfH - 20, H - halfH + 20);
    cam.x += (tx - cam.x) * 0.045; cam.y += (ty - cam.y) * 0.045;
    const sway = still ? 0 : Math.sin(now / 5200);
    world.style.transform = `rotateX(${still ? 0 : 9 + sway * 2}deg) rotateY(${still ? 0 : -7 + sway * 5}deg) scale(${cam.s}) translate(${-cam.x}px,${-cam.y}px)`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    sparks.forEach((s, i) => { s.t += s.v; if (s.t > 1) sparks[i] = newSpark(), sparks[i].t = 0; const p = at(s.c, s.t); dot(p[0], p[1], s.r * 3, '#cfe0ff', 0.55); });
    edges.forEach((e) => {
      const k = clamp((now - e.t0) / 330, 0, 1);
      glow(e.c, k, e.color);
      const p = at(e.c, k < 1 ? k : ((now - e.t0) / 900) % 1); dot(p[0], p[1], k < 1 ? 20 : 11, e.color, 0.95);
    });
    if (ring) {
      const k = (now - ring.t) / 900;
      if (k < 1) { ctx.strokeStyle = ring.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ring.x, ring.y, 10 + k * 46, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      dot(ring.x, ring.y, 16, ring.color, Math.max(0.35, 1 - k));
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function init() {
    build();
    $('pipeQueue').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
    paintBars(null);
    new IntersectionObserver((en) => { visible = en[0].isIntersecting && !document.hidden; }, { threshold: 0.05 }).observe($('pipe'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) visible = false; else { const r = $('pipe').getBoundingClientRect(); visible = r.bottom > 0 && r.top < innerHeight; } });
    lastTicks = stats.ticks;
    setInterval(paintRate, 1000);
    setInterval(() => { paintSplit(); paintStream(); }, 15000);
    ready = true; t0 = performance.now();
    requestAnimationFrame(frame);
    next();
  }
  return { init };
})();
