/* CodeMentor — local accounts, sessions bound to a device fingerprint, security log */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, S = CM.security, db = CM.db;
  const A = (CM.auth = { user: null, session: null, device: null, fp: null, notices: [] });

  const SESSION_KEY = 'cm.session';
  const ACCOUNTS_KEY = 'cm.accounts';
  const MATCH_THRESHOLD = 0.72;      // fingerprint similarity needed to recognise a device
  const SAME_BROWSER_THRESHOLD = 0.5; // lower bar when the browser's device key also matches
  const MAX_ATTEMPTS = 5;
  const LOCK_SECONDS = 30;

  A.defaults = {
    profile: (name) => ({
      fullName: name || '', email: '', institution: '', course: '', year: '', level: 'beginner',
      languages: ['python'], primaryLang: 'python', goals: [], bio: '', github: '', avatar: null, hue: Math.floor(Math.random() * 360)
    }),
    settings: () => ({
      theme: 'dark', accent: 'violet', font: 'md', depth: 'balanced', typing: true, enterToSend: true,
      engine: 'builtin', llm: { provider: 'ollama', url: 'http://localhost:11434', model: '', temperature: 0.3 }
    }),
    stats: () => ({ questions: 0, errors: 0, concepts: 0, howto: 0, reviews: 0, activity: {}, langs: {}, learned: [], quizzes: {}, up: 0, down: 0, runs: 0 })
  };

  A.init = async () => {
    await db.open();
    A.fp = await S.fingerprint();
  };

  const norm = (u) => String(u || '').trim().toLowerCase();

  /* ---------- rate limiting ---------- */
  A.lockRemaining = (uname) => {
    const r = U.store.get('cm.attempts.' + norm(uname), null);
    if (!r || !r.until) return 0;
    const left = Math.ceil((r.until - Date.now()) / 1000);
    return left > 0 ? left : 0;
  };
  function recordFail(uname) {
    const key = 'cm.attempts.' + norm(uname);
    const r = U.store.get(key, { count: 0, until: 0 });
    r.count = (r.until && r.until < Date.now()) ? 1 : r.count + 1;
    if (r.count >= MAX_ATTEMPTS) { r.until = Date.now() + LOCK_SECONDS * 1000; r.count = 0; }
    U.store.set(key, r);
    return MAX_ATTEMPTS - r.count;
  }
  const clearFails = (uname) => U.store.del('cm.attempts.' + norm(uname));

  /* ---------- remembered accounts (quick pick on this device) ---------- */
  A.accounts = () => U.store.get(ACCOUNTS_KEY, []);
  A.rememberAccount = (user) => {
    const list = A.accounts().filter((a) => a.id !== user.id);
    list.unshift({ id: user.id, username: user.username, name: user.profile.fullName || user.displayName, hue: user.profile.hue, avatar: user.profile.avatar ? true : false, at: Date.now() });
    U.store.set(ACCOUNTS_KEY, list.slice(0, 4));
  };
  A.forgetAccount = (id) => U.store.set(ACCOUNTS_KEY, A.accounts().filter((a) => a.id !== id));

  /* ---------- events (security log) ---------- */
  A.logEvent = (userId, type, detail, extra) => db.put('events', Object.assign({ id: U.uid('e_'), userId, type, detail, at: Date.now(), device: A.fp ? A.fp.label : '' }, extra || {}));
  A.events = async (userId) => (await db.byIndex('events', 'userId', userId)).sort((a, b) => b.at - a.at);

  /* ---------- devices ---------- */
  A.devices = async (userId) => (await db.byIndex('devices', 'userId', userId)).sort((a, b) => b.lastSeen - a.lastSeen);

  A.registerDevice = async (user) => {
    const fp = A.fp;
    const devices = await db.byIndex('devices', 'userId', user.id);
    let best = null, bestSim = 0;
    for (const d of devices) {
      if (d.revoked) continue;
      const sim = S.similarity(d.components, fp.components);
      const need = d.deviceKey === fp.deviceKey ? SAME_BROWSER_THRESHOLD : MATCH_THRESHOLD;
      if (sim >= need && sim > bestSim) { bestSim = sim; best = d; }
    }
    if (best) {
      Object.assign(best, { lastSeen: Date.now(), components: fp.components, hash: fp.hash, deviceKey: fp.deviceKey, label: fp.label, kind: fp.kind, loginCount: (best.loginCount || 0) + 1, match: Math.round(bestSim * 100) });
      await db.put('devices', best);
      return { device: best, isNew: false };
    }
    const device = {
      id: U.uid('d_'), userId: user.id, hash: fp.hash, deviceKey: fp.deviceKey, components: fp.components, label: fp.label, kind: fp.kind,
      firstSeen: Date.now(), lastSeen: Date.now(), loginCount: 1, trusted: devices.filter((d) => !d.revoked).length === 0, match: 100
    };
    await db.put('devices', device);
    return { device, isNew: true };
  };

  A.revokeDevice = async (deviceId) => {
    const d = await db.get('devices', deviceId);
    if (!d) return;
    d.revoked = true; d.revokedAt = Date.now();
    await db.put('devices', d);
    const sessions = await db.byIndex('sessions', 'userId', d.userId);
    for (const s of sessions) if (s.deviceId === deviceId) await db.del('sessions', s.id);
    await A.logEvent(d.userId, 'device_revoked', 'Removed trusted device: ' + d.label);
    if (A.device && A.device.id === deviceId) await A.logout(true);
  };

  A.trustDevice = async (deviceId, trusted) => {
    const d = await db.get('devices', deviceId);
    if (!d) return;
    d.trusted = trusted; await db.put('devices', d);
    await A.logEvent(d.userId, trusted ? 'device_trusted' : 'device_untrusted', (trusted ? 'Marked as trusted: ' : 'Removed trust: ') + d.label);
  };

  /* ---------- sessions ---------- */
  function clearLocal() {
    try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  async function startSession(user, remember, kind) {
    const { device, isNew } = await A.registerDevice(user);
    const token = S.randomHex(24);
    const sess = { id: token, userId: user.id, deviceId: device.id, createdAt: Date.now(), lastActive: Date.now(), expiresAt: Date.now() + (remember ? 30 : 1) * 86400000, remember: !!remember };
    await db.put('sessions', sess);
    clearLocal();
    try { (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify({ token, userId: user.id })); } catch (e) { /* ignore */ }
    user.lastLoginAt = Date.now();
    await db.put('users', user);
    A.user = user; A.session = sess; A.device = device;
    await A.logEvent(user.id, kind, (kind === 'signup' ? 'Account created on ' : 'Signed in on ') + device.label, { deviceId: device.id, newDevice: isNew });
    if (isNew && kind === 'login') {
      A.notices.push({ type: 'new-device', device });
      await A.logEvent(user.id, 'new_device', 'New device recognised: ' + device.label + ' (' + device.hash.slice(0, 12) + ')', { deviceId: device.id });
    }
    A.rememberAccount(user);
    return user;
  }

  A.signup = async ({ username, displayName, password, remember }) => {
    const uname = norm(username);
    if (!displayName || !displayName.trim()) throw new Error('Please tell us your name.');
    if (!/^[a-z0-9_.]{3,24}$/.test(uname)) throw new Error('Username must be 3–24 characters using letters, numbers, _ or .');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (await db.one('users', 'username', uname)) throw new Error('That username is already used on this device.');
    const salt = S.randomHex(16);
    const iterations = 150000;
    const hash = await S.hashPassword(password, salt, iterations);
    const user = {
      id: U.uid('u_'), username: uname, displayName: displayName.trim(),
      pass: { hash, salt, iterations, algo: S.hasSubtle ? 'PBKDF2-SHA256' : 'fallback' },
      createdAt: Date.now(), updatedAt: Date.now(), onboarded: false,
      profile: A.defaults.profile(displayName.trim()), settings: A.defaults.settings(), stats: A.defaults.stats()
    };
    await db.put('users', user);
    return startSession(user, remember !== false, 'signup');
  };

  A.login = async ({ username, password, remember }) => {
    const uname = norm(username);
    if (!uname || !password) throw new Error('Enter your username and password.');
    const wait = A.lockRemaining(uname);
    if (wait) throw new Error('Too many attempts. Try again in ' + wait + 's.');
    const user = await db.one('users', 'username', uname);
    if (!user) { recordFail(uname); throw new Error('Incorrect username or password.'); }
    const hash = await S.hashPassword(password, user.pass.salt, user.pass.iterations);
    if (!S.safeEqual(hash, user.pass.hash)) {
      const left = recordFail(uname);
      await A.logEvent(user.id, 'login_failed', 'Failed sign-in attempt (wrong password)');
      throw new Error('Incorrect username or password.' + (left <= 2 && left > 0 ? ' ' + left + ' attempt' + (left === 1 ? '' : 's') + ' left before a short lock.' : ''));
    }
    clearFails(uname);
    return startSession(user, remember !== false, 'login');
  };

  /** Restores a saved session — only if this is still the same device. */
  A.restore = async () => {
    let raw = null;
    try { raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY); } catch (e) { raw = null; }
    if (!raw) return null;
    let ref; try { ref = JSON.parse(raw); } catch (e) { clearLocal(); return null; }
    const sess = await db.get('sessions', ref.token);
    if (!sess || sess.userId !== ref.userId || sess.expiresAt < Date.now()) {
      if (sess) await db.del('sessions', sess.id);
      clearLocal(); return null;
    }
    const user = await db.get('users', sess.userId);
    if (!user) { clearLocal(); return null; }
    const device = await db.get('devices', sess.deviceId);
    const sim = device ? S.similarity(device.components, A.fp.components) : 0;
    const need = device && device.deviceKey === A.fp.deviceKey ? SAME_BROWSER_THRESHOLD : MATCH_THRESHOLD;
    if (!device || device.revoked || sim < need) {
      await db.del('sessions', sess.id);
      clearLocal();
      await A.logEvent(user.id, 'session_blocked', 'Saved session blocked — device fingerprint did not match (' + Math.round(sim * 100) + '% similar)');
      A.notices.push({ type: 'blocked' });
      return null;
    }
    Object.assign(device, { lastSeen: Date.now(), components: A.fp.components, hash: A.fp.hash, match: Math.round(sim * 100) });
    await db.put('devices', device);
    sess.lastActive = Date.now();
    await db.put('sessions', sess);
    A.user = user; A.session = sess; A.device = device;
    return user;
  };

  A.logout = async (silent) => {
    if (A.session) { try { await db.del('sessions', A.session.id); } catch (e) { /* ignore */ } }
    if (A.user && !silent) await A.logEvent(A.user.id, 'logout', 'Signed out on ' + (A.fp ? A.fp.label : 'this device'));
    clearLocal();
    A.user = null; A.session = null; A.device = null;
  };

  A.logoutEverywhere = async () => {
    if (!A.user) return;
    await db.delByIndex('sessions', 'userId', A.user.id);
    await A.logEvent(A.user.id, 'logout_all', 'Signed out of all sessions');
    clearLocal();
    A.user = null; A.session = null; A.device = null;
  };

  A.verifyPassword = async (user, password) => {
    const hash = await S.hashPassword(password, user.pass.salt, user.pass.iterations);
    return S.safeEqual(hash, user.pass.hash);
  };

  A.changePassword = async (oldPw, newPw) => {
    const user = A.user;
    if (!(await A.verifyPassword(user, oldPw))) throw new Error('Current password is incorrect.');
    if (!newPw || newPw.length < 6) throw new Error('New password must be at least 6 characters.');
    const salt = S.randomHex(16);
    user.pass = { hash: await S.hashPassword(newPw, salt, 150000), salt, iterations: 150000, algo: S.hasSubtle ? 'PBKDF2-SHA256' : 'fallback' };
    user.updatedAt = Date.now();
    await db.put('users', user);
    // Invalidate every other session.
    const sessions = await db.byIndex('sessions', 'userId', user.id);
    for (const s of sessions) if (!A.session || s.id !== A.session.id) await db.del('sessions', s.id);
    await A.logEvent(user.id, 'password_changed', 'Password changed — other sessions signed out');
  };

  A.deleteAccount = async (password) => {
    const user = A.user;
    if (!(await A.verifyPassword(user, password))) throw new Error('Password is incorrect.');
    for (const store of ['devices', 'sessions', 'conversations', 'snippets', 'events']) await db.delByIndex(store, 'userId', user.id);
    await db.delByIndex('messages', 'userId', user.id);
    await db.del('users', user.id);
    A.forgetAccount(user.id);
    clearLocal();
    A.user = null; A.session = null; A.device = null;
  };

  /** Persist the current user after mutating it. */
  A.save = async () => { if (!A.user) return; A.user.updatedAt = Date.now(); await db.put('users', A.user); };

  /* ---------- appearance ---------- */
  A.applySettings = (s) => {
    s = s || (A.user && A.user.settings) || A.defaults.settings();
    let theme = s.theme;
    if (theme === 'system') theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const d = document.documentElement;
    d.setAttribute('data-theme', theme);
    d.setAttribute('data-accent', s.accent || 'violet');
    d.setAttribute('data-font', s.font || 'md');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f6fa' : '#0b0e15');
    try { localStorage.setItem('cm.theme', s.theme); localStorage.setItem('cm.accent', s.accent || 'violet'); localStorage.setItem('cm.font', s.font || 'md'); } catch (e) { /* ignore */ }
  };
})();
