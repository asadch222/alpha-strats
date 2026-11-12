/* The admin portal: post and close trades, switch pages and sections on or off,
   edit the announcement and a few texts, and (with the login service connected) manage members. */
const Admin = (() => {
  let pick = null;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function say(text, bad) {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div'); el.className = 'toast'; if (bad) el.style.borderLeftColor = '#e5484d'; el.textContent = text;
    box.appendChild(el); setTimeout(() => el.remove(), 3200);
  }
  async function save(msg) {
    try { await Site.save(); say(msg || 'Saved'); } catch (e) { say('Could not save: ' + e.message, true); }
    paintAll();
  }
  const sw = (on, attrs, label) => `<label class="sw"><input type="checkbox" ${on ? 'checked' : ''} ${attrs}><i></i>${label ? `<span>${label}</span>` : ''}</label>`;

  /* ---------- trades ---------- */
  function paintTrades() {
    const list = Site.trades().slice().sort((x, y) => (x.status === 'closed') - (y.status === 'closed') || y.opened - x.opened);
    $('admTradesOn').checked = !Site.hidden('home.trades');
    $('admTradeList').innerHTML = list.map((t) => {
      const a = A.get(t.market), closed = t.status === 'closed';
      if (!a) return `<div class="adm-row"><div><b>${esc(t.market)}</b><small>This market is no longer listed.</small></div><span></span><span></span><button class="btn btn-ghost btn-sm" data-del="${t.id}">Delete</button></div>`;
      return `<div class="adm-row ${closed ? 'is-closed' : ''}" data-t="${t.id}">
        <div class="cell-asset">${icon(a, 'sm')}<div><b>${esc(a.t)} <em class="${t.side === 'short' ? 'down' : 'up'}">${t.side === 'short' ? 'Short' : 'Long'}${t.lev > 1 ? ' ' + t.lev + '×' : ''}</em></b>
          <small>Entry ${fmtPx(t.entry)}${t.stop ? ' · stop ' + fmtPx(t.stop) : ''}${t.target ? ' · target ' + fmtPx(t.target) : ''}${closed ? ' · closed at ' + fmtPx(t.exit) : ''}</small></div></div>
        <b class="adm-pl mono" data-pl="${t.id}">–</b>
        ${sw(t.show !== false, `data-show="${t.id}"`, 'On website')}
        <div class="adm-acts">${closed ? `<button class="btn btn-ghost btn-sm" data-reopen="${t.id}">Reopen</button>` : `<button class="btn btn-dark btn-sm" data-close="${t.id}">Close at live price</button><button class="btn btn-ghost btn-sm" data-closeat="${t.id}">Close at…</button>`}<button class="btn btn-ghost btn-sm" data-del="${t.id}">Delete</button></div>
      </div>`;
    }).join('') || '<p class="dimtxt">No trades yet. Open your first one above.</p>';
    tickTrades();
  }
  function tickTrades() {
    Site.trades().forEach((t) => {
      const el = document.querySelector(`[data-pl="${t.id}"]`), a = A.get(t.market);
      if (!el || !a) return;
      const pl = Site.pl(t, a.price);
      el.textContent = pl == null ? '–' : fmtPct(pl); el.className = 'adm-pl mono ' + cls(pl);
    });
    if (pick && pick.price != null) setT('admLive', 'Live price: ' + fmtPx(pick.price));
  }
  function wireTrades() {
    const setPick = (m) => { pick = m; $('admMarket').value = m.t; $('admEntry').value = m.price; tickTrades(); };
    mountPicker($('admMarket'), $('admMarketBox'), setPick);
    $('admMarket').addEventListener('blur', () => setTimeout(() => { if (pick) $('admMarket').value = pick.t; }, 200));
    $('admUseLive').addEventListener('click', () => { if (pick) $('admEntry').value = pick.price; });
    $('admOpen').addEventListener('click', () => {
      const n = (id) => { const v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : null; };
      const side = $('admSide').value, entry = n('admEntry'), stop = n('admStop'), target = n('admTarget'), lev = n('admLev') || 1;
      if (!pick) return say('Pick a market first.', true);
      if (!entry) return say('Enter the entry price.', true);
      const long = side === 'long';
      if (stop && (long ? stop >= entry : stop <= entry)) return say(long ? 'For a long trade the stop must be below the entry.' : 'For a short trade the stop must be above the entry.', true);
      if (target && (long ? target <= entry : target >= entry)) return say(long ? 'For a long trade the target must be above the entry.' : 'For a short trade the target must be below the entry.', true);
      Site.get().trades.push({ id: uid(), market: pick.id, side, entry, stop, target, lev, note: $('admNote').value.trim().slice(0, 160), status: 'open', show: $('admShowNew').checked, opened: Date.now() });
      ['admStop', 'admTarget', 'admNote'].forEach((id) => { $(id).value = ''; });
      save('Trade opened');
    });
    $('admTradesOn').addEventListener('change', (e) => { Site.setHidden('home.trades', !e.target.checked); save(e.target.checked ? 'Trades are shown on the website' : 'Trades are hidden from the website'); });
    $('admTradeList').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const id = b.dataset.close || b.dataset.closeat || b.dataset.del || b.dataset.reopen, all = Site.get().trades, t = all.find((x) => x.id === id);
      if (!t) return;
      if (b.dataset.del) { if (!confirm('Delete this trade for good? It will disappear from the website.')) return; Site.get().trades = all.filter((x) => x.id !== id); return save('Trade deleted'); }
      if (b.dataset.reopen) { t.status = 'open'; t.exit = null; t.closed = null; return save('Trade reopened'); }
      let px = A.get(t.market) && A.get(t.market).price;
      if (b.dataset.closeat) { const v = parseFloat(prompt('Exit price for this trade:', px || '')); if (!isFinite(v) || v <= 0) return; px = v; }
      if (!px) return say('No live price yet. Use "Close at…" instead.', true);
      t.status = 'closed'; t.exit = px; t.closed = Date.now();
      save('Trade closed at ' + fmtPx(px) + ' (' + fmtPct(Site.pl(t)) + ')');
    });
    $('admTradeList').addEventListener('change', (e) => {
      const id = e.target.dataset.show; if (!id) return;
      const t = Site.get().trades.find((x) => x.id === id); t.show = e.target.checked;
      save(t.show ? 'Trade is shown on the website' : 'Trade is hidden from the website');
    });
    setInterval(tickTrades, 800);
  }

  /* ---------- pages and sections ---------- */
  function paintShow() {
    $('admPages').innerHTML = Site.PAGES.map(([p, label]) => `<div class="adm-line">${sw(!Site.hidden('page.' + p), `data-key="page.${p}"`)}<div><b>${label}</b><small>${p}.html and every link to it</small></div><a class="lnk" href="${p}.html" target="_blank" data-keep>View</a></div>`).join('');
    const groups = {};
    Site.SECTIONS.forEach(([key, where, label]) => { (groups[where] = groups[where] || []).push([key, label]); });
    $('admSections').innerHTML = Object.entries(groups).map(([where, rows]) => `<h4>${where}</h4>${rows.map(([key, label]) => `<div class="adm-line">${sw(!Site.hidden(key), `data-key="${key}"`)}<div><b>${label}</b></div></div>`).join('')}`).join('');
    const a = Site.get().announce;
    $('admAnnOn').checked = !!a.on; $('admAnnText').value = a.text || ''; $('admAnnLink').value = a.link || '';
  }
  function wireShow() {
    $('pane-show').addEventListener('change', (e) => {
      const key = e.target.dataset.key; if (!key) return;
      Site.setHidden(key, !e.target.checked);
      save(e.target.checked ? 'Now shown on the website' : 'Now hidden from the website');
    });
    $('admAnnSave').addEventListener('click', () => {
      Site.get().announce = { on: $('admAnnOn').checked, text: $('admAnnText').value.trim().slice(0, 140), link: $('admAnnLink').value.trim() };
      save('Announcement saved');
    });
  }

  /* ---------- texts ---------- */
  const TEXTS = [['h1a', 'admH1a'], ['h1b', 'admH1b'], ['lede', 'admLede'], ['pricePro', 'admPrice'], ['contact', 'admContact']];
  function paintText() { const t = Site.get().text || {}; TEXTS.forEach(([k, id]) => { $(id).value = t[k] || ''; }); }
  function wireText() {
    $('admTextSave').addEventListener('click', () => {
      const t = {}; TEXTS.forEach(([k, id]) => { const v = $(id).value.trim(); if (v) t[k] = v; });
      if (t.contact && !/^\S+@\S+\.\S+$/.test(t.contact)) return say('That contact email does not look right.', true);
      Site.get().text = t; save('Texts saved');
    });
    $('admReset').addEventListener('click', () => {
      if (!confirm('Reset everything? All pages and sections are shown again, the announcement and texts are cleared, and ALL trades are deleted.')) return;
      Site.reset(); save('Everything reset');
    });
  }

  /* ---------- members (needs the login service) ---------- */
  async function paintMembers() {
    const box = $('admMembers');
    if (!Auth.live) { box.innerHTML = '<div class="auth-preview">Members can be listed and upgraded here once the login service is connected. In preview mode accounts exist only in each visitor\'s own browser, so there is nothing to list.</div>'; return; }
    box.innerHTML = '<div class="skeleton">Loading members…</div>';
    const { data, error } = await Auth.client().from('profiles').select('id,name,plan,role,created_at').order('created_at', { ascending: false }).limit(500);
    if (error) { box.innerHTML = `<div class="auth-preview">Could not load members: ${esc(error.message)}</div>`; return; }
    box.innerHTML = `<p class="xp">${data.length} member${data.length === 1 ? '' : 's'}. Changing a plan takes effect the next time that member opens the site.</p>` + data.map((m) => `<div class="adm-line"><div><b>${esc(m.name || 'No name')}</b><small>Joined ${new Date(m.created_at).toLocaleDateString()}${m.role === 'admin' ? ' · admin' : ''}</small></div>
      <select data-plan="${m.id}">${['free', 'pro', 'elite'].map((p) => `<option ${p === m.plan ? 'selected' : ''}>${p}</option>`).join('')}</select></div>`).join('');
  }
  function wireMembers() {
    $('admMembers').addEventListener('change', async (e) => {
      const id = e.target.dataset.plan; if (!id) return;
      const { error } = await Auth.client().from('profiles').update({ plan: e.target.value }).eq('id', id);
      say(error ? 'Could not change the plan: ' + error.message : 'Plan changed to ' + e.target.value, !!error);
    });
  }

  function paintAll() { paintTrades(); paintShow(); paintText(); }
  async function init() {
    await Auth.ready;
    if (!Auth.user()) { $('admGate').hidden = false; return; }
    if (!Auth.isAdmin()) { $('admGate').hidden = false; $('admGate').querySelector('p').textContent = 'This account is not an admin. Log in with the admin account to open the portal.'; return; }
    await Site.pull();
    $('admApp').hidden = false; $('admPreview').hidden = Auth.live;
    setT('admWho', Auth.user().name);
    $('admTabs').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      document.querySelectorAll('#admTabs button').forEach((x) => x.classList.toggle('is-active', x === b));
      document.querySelectorAll('.adm-pane').forEach((p) => { p.hidden = p.id !== 'pane-' + b.dataset.t; });
      if (b.dataset.t === 'members') paintMembers();
    });
    $('admOut').addEventListener('click', async () => { await Auth.signOut(); location.href = 'index.html'; });
    wireTrades(); wireShow(); wireText(); wireMembers(); paintAll();
  }
  return { init };
})();
