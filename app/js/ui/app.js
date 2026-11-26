/* CodeMentor — app shell, router, data layer, onboarding and boot */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, A = CM.auth, db = CM.db;
  const esc = U.esc;
  const APP = (CM.app = CM.app || {});

  /* ================================================================== */
  /* data layer                                                         */
  /* ================================================================== */
  CM.data = {
    convs: (uid) => db.byIndex('conversations', 'userId', uid),
    getConv: (id) => db.get('conversations', id),
    saveConv: (c) => db.put('conversations', c),
    async deleteConv(id) { await db.delByIndex('messages', 'convId', id); await db.del('conversations', id); },
    messages: async (convId) => (await db.byIndex('messages', 'convId', convId)).sort((a, b) => a.createdAt - b.createdAt),
    allMessages: (uid) => db.byIndex('messages', 'userId', uid),
    saveMessage: (m) => db.put('messages', m),
    snippets: (uid) => db.byIndex('snippets', 'userId', uid),
    saveSnippet: (s) => db.put('snippets', Object.assign({ createdAt: Date.now() }, s, { id: s.id || U.uid('s_'), userId: A.user.id })),
    putSnippet: (s) => db.put('snippets', s),
    deleteSnippet: (id) => db.del('snippets', id),
    exportConv(conv, msgs) {
      const lines = ['# ' + conv.title, '', '_Exported from CodeMentor · ' + U.fmtDateTime(Date.now()) + '_', ''];
      msgs.forEach((m) => { lines.push('---', '', '**' + (m.role === 'user' ? 'You' : 'CodeMentor') + '** · ' + U.fmtDateTime(m.createdAt), '', m.content, ''); });
      U.download((conv.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 50) || 'chat') + '.md', lines.join('\n'), 'text/markdown');
      U.toast('Chat exported as Markdown', 'success');
    },
    async importHistory(data) {
      const idMap = {};
      let n = 0;
      for (const c of data.conversations || []) {
        if (!c || !c.id || !c.title) continue;
        const nid = U.uid('c_');
        idMap[c.id] = nid;
        await db.put('conversations', Object.assign({}, c, { id: nid, userId: A.user.id, title: String(c.title).slice(0, 120) }));
        n++;
      }
      for (const m of data.messages || []) {
        if (!m || !idMap[m.convId] || typeof m.content !== 'string') continue;
        await db.put('messages', Object.assign({}, m, { id: U.uid('m_'), convId: idMap[m.convId], userId: A.user.id }));
      }
      return n;
    }
  };

  /* ================================================================== */
  /* routing                                                            */
  /* ================================================================== */
  const ROUTES = [
    [/^#\/chat\/([\w-]+)$/, (m) => ['chat', { id: m[1] }]],
    [/^#\/chat\/?$/, () => ['chat', {}]],
    [/^#\/history\/?$/, () => ['history', {}]],
    [/^#\/library\/(concept|error|recipe|compare)\/([\w-]+)$/, (m) => ['library', { kind: m[1], id: m[2] }]],
    [/^#\/library(?:\/(concepts|errors|recipes|compares))?\/?$/, (m) => ['library', { tab: m[1] }]],
    [/^#\/playground\/?$/, () => ['playground', {}]],
    [/^#\/saved\/?$/, () => ['saved', {}]],
    [/^#\/profile(?:\/(overview|edit|security))?\/?$/, (m) => ['profile', { tab: m[1] }]],
    [/^#\/settings\/?$/, () => ['settings', {}]]
  ];
  let current = null;

  APP.navigate = function (hash, opts) {
    opts = opts || {};
    if (opts.silent) { history.replaceState(null, '', hash); highlightNav(hash); return; }
    if (location.hash === hash) { route(); return; }
    if (opts.replace) { history.replaceState(null, '', hash); route(); }
    else location.hash = hash;
  };

  function highlightNav(hash) {
    const name = (hash.match(/^#\/(\w+)/) || [])[1] || 'chat';
    U.$$('.sb-link').forEach((a) => a.classList.toggle('on', a.dataset.view === name));
    const cid = (hash.match(/^#\/chat\/([\w-]+)/) || [])[1];
    U.$$('.sb-recent-item').forEach((b) => b.classList.toggle('on', b.dataset.id === cid));
  }

  async function route() {
    if (!A.user || !U.$('.shell')) return;
    const hash = location.hash || '#/chat';
    let match = null;
    for (const [re, fn] of ROUTES) { const m = hash.match(re); if (m) { match = fn(m); break; } }
    if (!match) { APP.navigate('#/chat', { replace: true }); return; }
    const [name, params] = match;
    if (current && current.view && current.view.destroy) current.view.destroy();
    const view = CM.views[name];
    const host = U.$('#view');
    host.style.animation = 'none'; void host.offsetWidth; host.style.animation = '';
    current = { name, view };
    highlightNav(hash);
    U.$('.shell').classList.remove('mobile-open');
    if (name !== 'chat') document.title = U.cap(name) + ' · CodeMentor';
    try { await view.render(host, params); }
    catch (e) { console.error(e); host.innerHTML = '<div class="empty"><div class="empty-ic">' + CM.icon('alert', 26) + '</div><h3>Something went wrong</h3><p>' + esc(e.message) + '</p></div>'; }
  }
  window.addEventListener('hashchange', route);

  /* ================================================================== */
  /* shell                                                              */
  /* ================================================================== */
  const NAV = [['chat', 'message', 'Chat'], ['history', 'history', 'History'], ['library', 'book', 'Library'], ['playground', 'terminal', 'Playground'], ['saved', 'bookmark', 'Saved'], ['profile', 'user', 'Profile'], ['settings', 'settings', 'Settings']];

  function renderShell() {
    const root = U.$('#root');
    root.innerHTML = '';
    const shell = U.html(`
<div class="shell${U.store.get('cm.sidebarCollapsed', false) ? ' collapsed' : ''}">
  <aside class="sidebar" aria-label="Main navigation">
    <div class="sb-top">
      <a class="brand" href="#/chat" aria-label="CodeMentor home">${CM.logo(30)}<span class="hide-collapsed">CodeMentor</span></a>
      <button class="btn-icon sb-collapse" aria-label="Toggle sidebar" data-tip="Toggle sidebar (Ctrl+B)" data-tip-pos="bottom">${CM.icon('sidebar', 18)}</button>
    </div>
    <a class="btn btn-grad sb-new" href="#/chat" data-new>${CM.icon('plus', 18)}<span class="hide-collapsed">New chat</span><kbd class="hide-collapsed">Alt N</kbd></a>
    <button class="sb-search">${CM.icon('search', 16)}<span class="hide-collapsed">Search…</span><kbd class="hide-collapsed">Ctrl K</kbd></button>
    <nav class="sb-nav">${NAV.map(([id, ic, label]) => '<a class="sb-link" href="#/' + id + '" data-view="' + id + '" data-label="' + label + '">' + CM.icon(ic, 18) + '<span class="hide-collapsed">' + label + '</span>' + (id === 'library' ? '<span class="sb-count hide-collapsed lib-count"></span>' : '') + '</a>').join('')}</nav>
    <div class="sb-section hide-collapsed"><span>Recent</span><a href="#/history">View all</a></div>
    <div class="sb-recent hide-collapsed"></div>
    <div class="sb-foot">
      <div class="sb-offline hide-collapsed" title="Everything runs on this device"><i></i>Offline-ready · on-device</div>
      <button class="sb-user" aria-label="Account menu"></button>
    </div>
  </aside>
  <div class="scrim"></div>
  <main class="main">
    <div class="mobile-bar">
      <button class="btn-icon" data-act="menu" aria-label="Open menu">${CM.icon('menu', 20)}</button>
      <a class="brand" href="#/chat">${CM.logo(26)}<span>CodeMentor</span></a>
      <div class="grow"></div>
      <button class="btn-icon" data-act="search" aria-label="Search">${CM.icon('search', 19)}</button>
      <a class="btn-icon" href="#/chat" data-new aria-label="New chat">${CM.icon('plus', 20)}</a>
    </div>
    <div class="view" id="view"></div>
  </main>
</div>`);
    root.appendChild(shell);
    shell.querySelector('.sb-collapse').onclick = APP.toggleSidebar;
    shell.querySelector('.sb-search').onclick = () => CM.palette.open();
    shell.querySelector('[data-act=search]').onclick = () => CM.palette.open();
    shell.querySelector('[data-act=menu]').onclick = () => shell.classList.add('mobile-open');
    shell.querySelector('.scrim').onclick = () => shell.classList.remove('mobile-open');
    shell.querySelectorAll('[data-new]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); APP.navigate('#/chat'); }));
    shell.querySelector('.sb-user').onclick = (e) => U.menu(e.currentTarget, [
      { label: 'Profile', icon: 'user', onClick: () => APP.navigate('#/profile') },
      { label: 'Security & devices', icon: 'shield', onClick: () => APP.navigate('#/profile/security') },
      { label: 'Settings', icon: 'settings', onClick: () => APP.navigate('#/settings') },
      { label: 'Toggle theme', icon: 'moon', onClick: APP.toggleTheme },
      '-',
      { label: 'Sign out', icon: 'logout', danger: true, onClick: APP.logout }
    ]);
    shell.querySelector('.sb-recent').addEventListener('click', (e) => { const b = e.target.closest('.sb-recent-item'); if (b) APP.navigate('#/chat/' + b.dataset.id); });
    applyCollapsedTips();
    APP.refreshSidebar();
  }

  function applyCollapsedTips() {
    const collapsed = U.$('.shell') && U.$('.shell').classList.contains('collapsed');
    U.$$('.sb-link').forEach((a) => { if (collapsed) { a.dataset.tip = a.dataset.label; a.dataset.tipPos = 'right'; } else { delete a.dataset.tip; delete a.dataset.tipPos; } });
  }

  APP.toggleSidebar = function () {
    const sh = U.$('.shell'); if (!sh) return;
    if (innerWidth <= 780) { sh.classList.toggle('mobile-open'); return; }
    sh.classList.toggle('collapsed');
    U.store.set('cm.sidebarCollapsed', sh.classList.contains('collapsed'));
    applyCollapsedTips();
  };

  APP.refreshSidebar = async function () {
    if (!A.user || !U.$('.shell')) return;
    const u = A.user;
    const st = CM.stats.streak(u);
    const userBtn = U.$('.sb-user');
    userBtn.innerHTML = U.avatar(u, 34) + '<div class="grow hide-collapsed"><b>' + esc(u.profile.fullName || u.displayName) + '</b><span>' + (st.current ? '<span class="streak">' + CM.icon('flame', 12) + ' ' + st.current + '-day streak</span>' : '@' + esc(u.username)) + '</span></div><span class="hide-collapsed faint">' + CM.icon('more', 16) + '</span>';
    const lc = U.$('.lib-count');
    if (lc) lc.textContent = (u.stats.learned || []).length + '/' + CM.kb.concepts.length;
    const convs = (await CM.data.convs(u.id)).sort((a, b) => (b.pinned - a.pinned) || b.updatedAt - a.updatedAt).slice(0, 12);
    const box = U.$('.sb-recent');
    if (!box) return;
    const cid = (location.hash.match(/^#\/chat\/([\w-]+)/) || [])[1];
    box.innerHTML = convs.length ? convs.map((c) => '<button class="sb-recent-item' + (c.id === cid ? ' on' : '') + '" data-id="' + c.id + '" title="' + esc(c.title) + '">' + CM.icon(c.pinned ? 'pin' : 'message', 15) + '<span>' + esc(c.title) + '</span></button>').join('') : '<div class="sb-recent-empty">Your chats will show up here.</div>';
  };

  /* ================================================================== */
  /* stats, achievements, theme, session                                 */
  /* ================================================================== */
  APP.track = async function (ev) {
    const u = A.user; if (!u) return;
    const before = new Set(CM.stats.achievements(u).filter((a) => a.ok).map((a) => a.id));
    const s = u.stats;
    s.questions = (s.questions || 0) + 1;
    s.activity = s.activity || {};
    const k = U.dayKey();
    s.activity[k] = (s.activity[k] || 0) + 1;
    s.langs = s.langs || {};
    if (ev.lang && ['text', 'bash', 'nameerror'].indexOf(ev.lang) < 0) s.langs[ev.lang] = (s.langs[ev.lang] || 0) + 1;
    const bump = (key) => { s[key] = (s[key] || 0) + 1; };
    ({ error: () => bump('errors'), debug: () => bump('errors'), concept: () => bump('concepts_q'), complexity: () => bump('concepts_q'), howto: () => bump('howto'), review: () => bump('reviews'), explain: () => bump('reviews'), compare: () => bump('compares') }[ev.intent] || (() => {}))();
    await A.save();
    CM.stats.achievements(u).filter((a) => a.ok && !before.has(a.id)).forEach((a, i) => setTimeout(() => U.toast('🏆 Achievement unlocked: ' + a.name, 'success', 4000), 800 + i * 600));
  };

  APP.toggleTheme = async function () {
    const s = A.user.settings;
    const effective = document.documentElement.getAttribute('data-theme');
    s.theme = effective === 'dark' ? 'light' : 'dark';
    A.applySettings(s);
    await A.save();
  };

  APP.openPlayground = function (code, lang) { CM.openPlaygroundWith(code, lang); APP.navigate('#/playground'); if (location.hash === '#/playground') route(); };

  APP.logout = async function () { await A.logout(); APP.showAuth(); U.toast('Signed out', 'success'); };

  APP.showAuth = function () {
    if (current && current.view && current.view.destroy) current.view.destroy();
    current = null;
    history.replaceState(null, '', location.pathname + location.search);
    document.title = 'CodeMentor · Sign in';
    A.applySettings({ theme: U.store.get('cm.theme', 'dark'), accent: U.store.get('cm.accent', 'violet'), font: U.store.get('cm.font', 'md') });
    CM.authView.render(U.$('#root'));
  };

  APP.start = function () {
    const u = A.user;
    u.settings = Object.assign(A.defaults.settings(), u.settings || {});
    u.settings.llm = Object.assign(A.defaults.settings().llm, u.settings.llm || {});
    u.stats = Object.assign(A.defaults.stats(), u.stats || {});
    u.profile = Object.assign(A.defaults.profile(u.displayName), u.profile || {});
    A.applySettings(u.settings);
    renderShell();
    if (!location.hash || !/^#\//.test(location.hash)) APP.navigate('#/chat', { replace: true }); else route();
    const nd = A.notices.find((n) => n.type === 'new-device');
    if (nd) setTimeout(() => U.toast('New device recognised: ' + nd.device.label + '. You can review it in Profile → Security.', 'warn', 6000), 900);
    A.notices = [];
    if (!u.onboarded) setTimeout(onboarding, 350);
  };

  /* ================================================================== */
  /* onboarding                                                         */
  /* ================================================================== */
  function onboarding() {
    const u = A.user, p = u.profile;
    let step = 0;
    const data = { level: p.level || 'beginner', languages: (p.languages || ['python']).slice(), primary: p.primaryLang || 'python', goals: (p.goals || []).slice() };
    const body = U.html('<div><div class="onb-steps"><i></i><i></i><i></i></div><div class="onb-body"></div></div>');
    const LV = [['beginner', '🌱', 'Beginner', 'I\'m new to coding. Explain things simply.'], ['intermediate', '🚀', 'Intermediate', 'I know the basics and want clear depth.'], ['advanced', '🧠', 'Advanced', 'Show me internals and trade-offs.']];
    const LG = [['python', '🐍'], ['javascript', '🟨'], ['java', '☕'], ['cpp', '⚙️'], ['c', '🔧'], ['typescript', '🔷'], ['sql', '🗃️'], ['html', '🌐']];
    const GL = [['Fix my errors', '🐞'], ['Placements / interviews', '💼'], ['DSA', '🧩'], ['Web development', '🌐'], ['AI / ML', '🤖'], ['College exams', '📝'], ['Competitive programming', '🏁'], ['Build projects', '🛠️']];
    const m = U.modal({
      title: 'Welcome to CodeMentor, ' + (p.fullName || u.displayName).split(' ')[0] + '! 👋', icon: 'sparkles', size: 'md', body, dismissable: false,
      actions: [
        { label: 'Skip', onClick: async () => { u.onboarded = true; await A.save(); } },
        { label: 'Continue', kind: 'primary', icon: 'arrow-right', onClick: async ({ el }) => {
          if (step < 2) { step++; draw(); if (step === 2) el.querySelector('.modal-foot .btn-primary span').textContent = 'Start learning'; return false; }
          Object.assign(p, { level: data.level, languages: data.languages.length ? data.languages : ['python'], primaryLang: data.languages.indexOf(data.primary) >= 0 ? data.primary : (data.languages[0] || 'python'), goals: data.goals });
          u.onboarded = true;
          await A.save();
          U.toast('You\'re all set! Ask your first question 🎉', 'success');
          APP.refreshSidebar();
        } }
      ]
    });
    function draw() {
      body.querySelectorAll('.onb-steps i').forEach((i, k) => i.classList.toggle('on', k <= step));
      const host = body.querySelector('.onb-body');
      if (step === 0) {
        host.innerHTML = '<p class="muted" style="margin-bottom:14px">How comfortable are you with programming? I\'ll tune my explanations to match.</p><div class="pick-grid">' + LV.map(([id, e, n, d]) => '<button class="pick ' + (data.level === id ? 'on' : '') + '" data-v="' + id + '"><span class="emoji">' + e + '</span><b>' + n + '</b><span>' + d + '</span></button>').join('') + '</div>';
        host.querySelector('.pick-grid').onclick = (e) => { const b = e.target.closest('[data-v]'); if (b) { data.level = b.dataset.v; draw(); } };
      } else if (step === 1) {
        host.innerHTML = '<p class="muted" style="margin-bottom:14px">Which languages do you use? Tap to select. The <b>first</b> one becomes your default for examples.</p><div class="pick-grid">' + LG.map(([id, e]) => { const i = data.languages.indexOf(id); return '<button class="pick ' + (i >= 0 ? 'on' : '') + '" data-v="' + id + '"><span class="emoji">' + e + '</span><b>' + esc(U.langName(id)) + '</b><span>' + (i === 0 ? 'Default' : i > 0 ? 'Selected' : '&nbsp;') + '</span></button>'; }).join('') + '</div>';
        host.querySelector('.pick-grid').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; const i = data.languages.indexOf(b.dataset.v); if (i >= 0) data.languages.splice(i, 1); else data.languages.push(b.dataset.v); data.primary = data.languages[0] || 'python'; draw(); };
      } else {
        host.innerHTML = '<p class="muted" style="margin-bottom:14px">What are you working towards? (optional, pick any)</p><div class="pick-grid">' + GL.map(([g, e]) => '<button class="pick ' + (data.goals.indexOf(g) >= 0 ? 'on' : '') + '" data-v="' + esc(g) + '"><span class="emoji">' + e + '</span><b>' + esc(g) + '</b></button>').join('') + '</div>';
        host.querySelector('.pick-grid').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; const i = data.goals.indexOf(b.dataset.v); if (i >= 0) data.goals.splice(i, 1); else data.goals.push(b.dataset.v); draw(); };
      }
    }
    draw();
    void m;
  }

  /* ================================================================== */
  /* global shortcuts & boot                                             */
  /* ================================================================== */
  document.addEventListener('keydown', (e) => {
    if (!A.user || !U.$('.shell')) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); CM.palette.open(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B') && !/TEXTAREA|INPUT/.test((e.target || {}).tagName || '')) { e.preventDefault(); APP.toggleSidebar(); }
    else if (e.altKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); APP.navigate('#/chat'); }
  });

  try {
    matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (A.user && A.user.settings.theme === 'system') A.applySettings(A.user.settings); });
  } catch (e) { /* old browsers */ }

  async function boot() {
    const bootEl = U.$('#boot');
    const hideBoot = () => { if (bootEl) { bootEl.classList.add('out'); setTimeout(() => bootEl.remove(), 400); } };
    try {
      await Promise.all([A.init(), CM.runner.detect()]);
      CM.search.build();
      const user = await A.restore();
      hideBoot();
      if (user) APP.start(); else APP.showAuth();
    } catch (e) {
      console.error(e);
      hideBoot();
      U.$('#root').innerHTML = '<div class="empty" style="height:100vh"><div class="empty-ic">' + CM.icon('alert', 28) + '</div><h3>CodeMentor could not start</h3><p>' + esc(e.message || String(e)) + '</p><p class="faint">Private/incognito windows may block local storage. Try a normal window, or start the app with “Start CodeMentor.bat”.</p></div>';
    }
    CM.runner.detect();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache is optional */ });
    }
  }
  boot();
})();
