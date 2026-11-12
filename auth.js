/* Accounts. Two modes:
   - LIVE: a Supabase project is set in config.js. Real accounts that work on any device.
   - PREVIEW: nothing is set. Accounts live only in this browser, to try the members area.
   Every page gets the same small API: Auth.ready, Auth.user(), Auth.plan(), Auth.signUp(...),
   Auth.signIn(...), Auth.signOut(), Auth.get(key), Auth.set(key, value). */
const Auth = (() => {
  const cfg = window.AS_CONFIG || {}, live = !!(cfg.supabaseUrl && cfg.supabaseKey);
  let sb = null, user = null, plan = 'free', role = 'user', data = {};
  const ls = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } } };
  const loadLib = () => new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'; s.onload = res; s.onerror = () => rej(new Error('The login service could not be reached.')); document.head.appendChild(s); });
  async function hash(pw, salt) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pw)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }

  async function loadProfile(u) {
    user = { id: u.id, email: u.email, name: (u.user_metadata && u.user_metadata.name) || u.email.split('@')[0] };
    const [p, d] = await Promise.all([sb.from('profiles').select('*').eq('id', u.id).maybeSingle(), sb.from('user_data').select('data').eq('id', u.id).maybeSingle()]);
    plan = (p.data && p.data.plan) || 'free'; role = (p.data && p.data.role) || 'user'; data = (d.data && d.data.data) || {};
    if (p.data && p.data.name) user.name = p.data.name;
  }
  const ready = (async () => {
    if (live) {
      try { await loadLib(); sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey); const { data: s } = await sb.auth.getSession(); if (s.session) await loadProfile(s.session.user); } catch (e) { /* stay signed out */ }
    } else {
      const email = ls.get('as.session', null), u = email && ls.get('as.users', {})[email];
      if (u) { user = { id: email, email, name: u.name }; plan = 'pro'; data = u.data || {}; }
    }
    paintAccount();
  })();

  function paintAccount() { // the button in the top menu
    const b = document.getElementById('acctBtn');
    if (!b) return;
    b.textContent = user ? user.name.split(' ')[0] : 'Log in';
    b.href = user ? 'members.html' : 'login.html';
    b.classList.toggle('is-in', !!user);
  }
  const fail = (m) => { throw new Error(m); };

  return {
    live, ready, user: () => user, plan: () => plan,
    planLabel: () => (live ? plan[0].toUpperCase() + plan.slice(1) : 'Pro (preview)'),
    isPro: () => plan === 'pro' || plan === 'elite',
    // the admin portal: with the login service, only accounts marked admin; in preview mode, whoever is logged in on this browser
    isAdmin: () => !!user && (live ? role === 'admin' : true),
    client: () => sb,
    async signUp(name, email, pw) {
      email = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) fail('Please enter a valid email address.');
      if (pw.length < 8) fail('Please choose a password with at least 8 characters.');
      if (live) {
        const { data: r, error } = await sb.auth.signUp({ email, password: pw, options: { data: { name } } });
        if (error) fail(error.message);
        if (!r.session) return 'confirm'; // email confirmation is switched on
        await loadProfile(r.user);
      } else {
        const users = ls.get('as.users', {});
        if (users[email]) fail('An account with this email already exists in this browser.');
        const salt = Math.random().toString(36).slice(2);
        users[email] = { name: name || email.split('@')[0], salt, hash: await hash(pw, salt), data: {} };
        ls.set('as.users', users); ls.set('as.session', email);
        user = { id: email, email, name: users[email].name }; plan = 'pro'; data = {};
      }
      paintAccount(); return 'ok';
    },
    async signIn(email, pw) {
      email = email.trim().toLowerCase();
      if (live) {
        const { data: r, error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) fail(error.message === 'Invalid login credentials' ? 'That email and password do not match.' : error.message);
        await loadProfile(r.user);
      } else {
        const u = ls.get('as.users', {})[email];
        if (!u || u.hash !== await hash(pw, u.salt)) fail('That email and password do not match an account in this browser.');
        ls.set('as.session', email); user = { id: email, email, name: u.name }; plan = 'pro'; data = u.data || {};
      }
      paintAccount();
    },
    async reset(email) {
      if (!live) fail('Password reset needs the real login service. In preview mode, create a new account instead.');
      const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: location.origin + location.pathname.replace(/[^/]*$/, 'login.html') });
      if (error) fail(error.message);
    },
    async signOut() { if (live && sb) await sb.auth.signOut(); else ls.set('as.session', null); user = null; plan = 'free'; role = 'user'; data = {}; paintAccount(); },
    get: (key, fallback) => (key in data ? data[key] : fallback),
    async set(key, value) { // each user's own saved items (alerts, settings)
      if (!user) return;
      data[key] = value;
      if (live) await sb.from('user_data').upsert({ id: user.id, data, updated_at: new Date().toISOString() });
      else { const users = ls.get('as.users', {}); if (users[user.email]) { users[user.email].data = data; ls.set('as.users', users); } }
    },
    async request(market, idea) {
      if (live) { const { error } = await sb.from('requests').insert({ user_id: user.id, market, idea }); if (error) fail(error.message); return 'saved'; }
      location.href = `mailto:${cfg.contactEmail || ''}?subject=${encodeURIComponent('Strategy request: ' + market)}&body=${encodeURIComponent(idea + '\n\nFrom: ' + user.email)}`;
      return 'email';
    },
  };
})();
