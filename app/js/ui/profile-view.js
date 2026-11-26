/* CodeMentor — profile: overview & stats, edit details, security & trusted devices */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, A = CM.auth, SEC = CM.security;
  const esc = U.esc;
  const V = (CM.views = CM.views || {});

  /* ---------------- stats helpers (also used by the sidebar) ---------------- */
  CM.stats = {
    streak(user) {
      const act = (user.stats && user.stats.activity) || {};
      const has = (d) => (act[U.dayKey(d)] || 0) > 0;
      const day = 86400000;
      let cur = 0;
      let t = Date.now();
      if (!has(t)) t -= day;               // streak still alive if you were active yesterday
      while (has(t)) { cur++; t -= day; }
      const keys = Object.keys(act).filter((k) => act[k] > 0).sort();
      let longest = 0, run = 0, prev = null;
      keys.forEach((k) => {
        const d = new Date(k + 'T00:00:00').getTime();
        run = prev != null && Math.round((d - prev) / day) === 1 ? run + 1 : 1;
        longest = Math.max(longest, run); prev = d;
      });
      return { current: cur, longest: Math.max(longest, cur), activeDays: keys.length };
    },
    achievements(user) {
      const s = user.stats || {};
      const st = CM.stats.streak(user);
      const learned = (s.learned || []).length;
      const perfect = Object.keys(s.quizzes || {}).some((id) => { const c = CM.kb.concept(id); return c && c.quiz && s.quizzes[id] >= c.quiz.length; });
      return [
        { id: 'first', icon: '🚀', name: 'First steps', desc: 'Ask your first question', ok: s.questions >= 1 },
        { id: 'curious', icon: '🧠', name: 'Curious mind', desc: 'Ask 25 questions', ok: s.questions >= 25, prog: [s.questions, 25] },
        { id: 'bugs', icon: '🐞', name: 'Bug squasher', desc: 'Decode 10 errors', ok: s.errors >= 10, prog: [s.errors, 10] },
        { id: 'streak3', icon: '🔥', name: 'On a roll', desc: '3-day learning streak', ok: st.longest >= 3, prog: [st.longest, 3] },
        { id: 'streak7', icon: '📅', name: 'Week warrior', desc: '7-day learning streak', ok: st.longest >= 7, prog: [st.longest, 7] },
        { id: 'concepts', icon: '📚', name: 'Concept collector', desc: 'Mark 5 concepts as learned', ok: learned >= 5, prog: [learned, 5] },
        { id: 'quiz', icon: '🎯', name: 'Quiz ace', desc: 'Get a perfect quiz score', ok: perfect },
        { id: 'poly', icon: '🌐', name: 'Polyglot', desc: 'Ask about 3 languages', ok: Object.keys(s.langs || {}).length >= 3, prog: [Object.keys(s.langs || {}).length, 3] },
        { id: 'runner', icon: '▶️', name: 'Hands-on coder', desc: 'Run code 10 times', ok: (s.runs || 0) >= 10, prog: [s.runs || 0, 10] },
        { id: 'critic', icon: '🔍', name: 'Code critic', desc: 'Get 5 code reviews', ok: (s.reviews || 0) >= 5, prog: [s.reviews || 0, 5] }
      ];
    }
  };

  const YEARS = ['', '1st year', '2nd year', '3rd year', '4th year', '5th year', 'Postgraduate', 'Working professional', 'Self-learner', 'School student'];
  const LEVELS = [['beginner', 'Beginner', 'New to programming. Analogies and simple steps.'], ['intermediate', 'Intermediate', 'Comfortable with basics. Balanced detail.'], ['advanced', 'Advanced', 'Wants internals, trade-offs and complexity.']];
  const GOALS = ['Fix my errors', 'Placements / interviews', 'DSA', 'Web development', 'AI / ML', 'College exams', 'Competitive programming', 'Build projects'];
  const LANG_CHOICES = ['python', 'javascript', 'java', 'cpp', 'c', 'typescript', 'csharp', 'sql', 'html', 'css'];
  const EVT = {
    signup: ['sparkles', 'ok', 'Account created'], login: ['logout', 'ok', 'Signed in'], logout: ['logout', '', 'Signed out'], login_failed: ['x-circle', 'err', 'Failed sign-in'],
    new_device: ['fingerprint', 'warn', 'New device'], session_blocked: ['shield', 'err', 'Session blocked'], password_changed: ['key', 'ok', 'Password changed'],
    device_revoked: ['trash', 'warn', 'Device removed'], device_trusted: ['shield-check', 'ok', 'Device trusted'], device_untrusted: ['shield', '', 'Trust removed'], logout_all: ['logout', 'warn', 'Signed out everywhere'], profile_updated: ['user', '', 'Profile updated']
  };
  let tab = 'overview';

  V.profile = {
    async render(container, params) {
      if (params && params.tab) tab = params.tab;
      const u = A.user;
      const p = u.profile;
      container.innerHTML = '';
      const el = U.html(`
<div class="page"><div class="page-inner">
  <div class="profile-hero">
    <div class="profile-cover"></div>
    <div class="profile-main">
      <div class="profile-avatar">${U.avatar(u, 104)}<button class="btn-icon" data-act="avatar" aria-label="Change photo" data-tip="Change photo">${CM.icon('camera', 16)}</button></div>
      <div class="profile-id">
        <h1>${esc(p.fullName || u.displayName)}</h1>
        <div class="handle"><span>@${esc(u.username)}</span><span class="badge badge-accent">${esc(U.cap(p.level || 'beginner'))}</span>${p.institution ? '<span>' + CM.icon('cap', 14) + ' ' + esc(p.institution) + '</span>' : ''}<span class="faint">${CM.icon('calendar', 14)} Joined ${esc(U.fmtDate(u.createdAt))}</span></div>
        ${p.bio ? '<p class="bio">' + esc(p.bio) + '</p>' : ''}
      </div>
      <button class="btn" data-act="edit">${CM.icon('edit', 16)}<span>Edit profile</span></button>
    </div>
  </div>
  <div class="tabs" role="tablist" style="margin-bottom:20px">
    <button class="tab" data-tab="overview">${CM.icon('activity', 16)}Overview</button>
    <button class="tab" data-tab="edit">${CM.icon('user', 16)}Details</button>
    <button class="tab" data-tab="security">${CM.icon('shield', 16)}Security & devices</button>
  </div>
  <div class="profile-body"></div>
</div></div>`);
      container.appendChild(el);
      const body = el.querySelector('.profile-body');
      const tabs = el.querySelectorAll('.tabs .tab');
      const show = (t) => { tab = t; tabs.forEach((x) => x.classList.toggle('on', x.dataset.tab === t)); body.innerHTML = ''; (t === 'overview' ? overview : t === 'edit' ? editForm : security)(body, el); };
      tabs.forEach((t) => t.onclick = () => show(t.dataset.tab));
      el.querySelector('[data-act=edit]').onclick = () => show('edit');
      el.querySelector('[data-act=avatar]').onclick = (e) => {
        U.menu(e.currentTarget, [
          { label: 'Upload photo', icon: 'upload', onClick: async () => {
            const f = await U.pickFile('image/*'); if (!f) return;
            try { p.avatar = await U.imageToAvatar(f, 256); await A.save(); A.rememberAccount(u); V.profile.render(container); CM.app.refreshSidebar(); U.toast('Photo updated', 'success'); }
            catch (err) { U.toast(err.message, 'error'); }
          } },
          { label: 'Change colour', icon: 'sparkles', onClick: async () => { p.hue = (p.hue + 47) % 360; p.avatar = null; await A.save(); A.rememberAccount(u); V.profile.render(container); CM.app.refreshSidebar(); } },
          p.avatar ? { label: 'Remove photo', icon: 'trash', danger: true, onClick: async () => { p.avatar = null; await A.save(); V.profile.render(container); CM.app.refreshSidebar(); } } : null
        ].filter(Boolean));
      };
      show(tab);
    }
  };

  /* ---------------- overview ---------------- */
  function overview(body) {
    const u = A.user, s = u.stats, p = u.profile;
    const st = CM.stats.streak(u);
    const learned = (s.learned || []).length;
    const el = U.html(`<div>
  <div class="stat-grid">
    <div class="stat"><div class="ic-wrap">${CM.icon('message', 18)}</div><b>${s.questions || 0}</b><span>Questions asked</span></div>
    <div class="stat err"><div class="ic-wrap">${CM.icon('bug', 18)}</div><b>${s.errors || 0}</b><span>Errors decoded</span></div>
    <div class="stat ok"><div class="ic-wrap">${CM.icon('check-circle', 18)}</div><b>${learned}<small class="faint" style="font-size:14px;font-weight:600"> / ${CM.kb.concepts.length}</small></b><span>Concepts learned</span></div>
    <div class="stat fire"><div class="ic-wrap">${CM.icon('flame', 18)}</div><b>${st.current}</b><span>Day streak · best ${st.longest}</span></div>
  </div>
  <div class="grid-2">
    <div class="stack">
      <div class="card card-pad"><div class="card-head"><h3>${CM.icon('calendar', 18)}Learning activity</h3><span class="faint" style="font-size:13px">${U.plural(st.activeDays, 'active day')}</span></div>
        <div class="heatmap"></div>
        <div class="heat-legend">Less <i style="background:var(--surface-3)"></i><i data-l="1" style="background:color-mix(in srgb,var(--accent) 30%,var(--surface-3))"></i><i style="background:color-mix(in srgb,var(--accent) 55%,var(--surface-3))"></i><i style="background:color-mix(in srgb,var(--accent) 78%,var(--surface-3))"></i><i style="background:var(--accent)"></i> More</div>
      </div>
      <div class="card card-pad"><div class="card-head"><h3>${CM.icon('award', 18)}Achievements</h3><span class="faint ach-count" style="font-size:13px"></span></div><div class="ach-grid"></div></div>
    </div>
    <div class="stack">
      <div class="card card-pad"><div class="card-head"><h3>${CM.icon('code', 18)}Languages you asked about</h3></div><div class="bars lang-bars"></div></div>
      <div class="card card-pad"><div class="card-head"><h3>${CM.icon('layers', 18)}What you ask about</h3></div><div class="bars type-bars"></div></div>
      <div class="card card-pad"><div class="card-head"><h3>${CM.icon('user', 18)}About</h3><button class="btn btn-sm btn-ghost" data-go="edit">${CM.icon('edit', 14)}<span>Edit</span></button></div>
        <dl class="kv">
          <dt>Name</dt><dd>${esc(p.fullName || '—')}</dd>
          <dt>Email</dt><dd>${esc(p.email || '—')}</dd>
          <dt>College / school</dt><dd>${esc(p.institution || '—')}</dd>
          <dt>Course</dt><dd>${esc([p.course, p.year].filter(Boolean).join(' · ') || '—')}</dd>
          <dt>Main language</dt><dd>${esc(U.langName(p.primaryLang))}</dd>
          <dt>Goals</dt><dd>${(p.goals || []).length ? p.goals.map((g) => '<span class="badge" style="margin:0 4px 4px 0">' + esc(g) + '</span>').join('') : '—'}</dd>
          <dt>GitHub</dt><dd>${p.github ? esc('@' + p.github.replace(/^@/, '')) : '—'}</dd>
        </dl>
      </div>
    </div>
  </div></div>`);
    body.appendChild(el);
    el.querySelector('[data-go=edit]').onclick = () => document.querySelector('.tabs .tab[data-tab=edit]').click();
    // heatmap: 18 weeks
    const hm = el.querySelector('.heatmap');
    const act = s.activity || {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today); start.setDate(start.getDate() - (17 * 7) - today.getDay());
    const max = Math.max(1, ...Object.values(act));
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const n = act[U.dayKey(d)] || 0;
      const lvl = n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4));
      const i = document.createElement('i');
      i.dataset.l = lvl;
      i.title = U.fmtDate(d.getTime()) + ': ' + U.plural(n, 'question');
      hm.appendChild(i);
    }
    // bars
    const bars = (host, data, label) => {
      const entries = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
      host.innerHTML = entries.length ? entries.map(([k, v]) => '<div class="bar-row"><span>' + esc(label(k)) + '</span><div class="progress"><span style="width:' + Math.round((v / total) * 100) + '%"></span></div><span class="faint">' + v + '</span></div>').join('') : '<p class="muted" style="font-size:13.5px">Ask a few questions and your stats will show up here.</p>';
    };
    bars(el.querySelector('.lang-bars'), s.langs || {}, (k) => U.langName(k));
    bars(el.querySelector('.type-bars'), { Errors: s.errors || 0, Concepts: s.concepts_q || 0, 'How-to': s.howto || 0, 'Code reviews': s.reviews || 0, Comparisons: s.compares || 0 }, (k) => k);
    // achievements
    const ach = CM.stats.achievements(u);
    el.querySelector('.ach-count').textContent = ach.filter((a) => a.ok).length + ' / ' + ach.length + ' unlocked';
    el.querySelector('.ach-grid').innerHTML = ach.map((a) => '<div class="ach ' + (a.ok ? '' : 'locked') + '" title="' + esc(a.desc) + '"><div class="ach-ic">' + a.icon + '</div><b>' + esc(a.name) + '</b><span>' + esc(a.desc) + (a.prog && !a.ok ? ' · ' + Math.min(a.prog[0] || 0, a.prog[1]) + '/' + a.prog[1] : '') + '</span></div>').join('');
  }

  /* ---------------- edit details ---------------- */
  function editForm(body, root) {
    const u = A.user, p = u.profile;
    const el = U.html(`<form class="card card-pad" novalidate>
  <div class="card-head"><h3>${CM.icon('user', 18)}Your details</h3><span class="faint" style="font-size:13px">Stored only on this device</span></div>
  <div class="form-grid">
    <label class="field"><span class="label">Full name</span><input class="input" name="fullName" maxlength="60" required></label>
    <label class="field"><span class="label">Email <span class="faint">(optional)</span></span><input class="input" name="email" type="email" maxlength="80" placeholder="you@college.edu"></label>
    <label class="field"><span class="label">College / school</span><input class="input" name="institution" maxlength="80" placeholder="e.g. City College of Engineering"></label>
    <label class="field"><span class="label">Course / branch</span><input class="input" name="course" maxlength="60" placeholder="e.g. B.E. Computer Science"></label>
    <label class="field"><span class="label">Year</span><select class="select" name="year">${YEARS.map((y) => '<option value="' + esc(y) + '">' + (y || 'Select…') + '</option>').join('')}</select></label>
    <label class="field"><span class="label">GitHub username <span class="faint">(optional)</span></span><input class="input" name="github" maxlength="40" placeholder="octocat"></label>
    <div class="field full"><span class="label">Experience level <span class="faint">(changes how answers are explained)</span></span><div class="pick-grid levels"></div></div>
    <div class="field full"><span class="label">Languages you use</span><div class="lang-picks"></div></div>
    <label class="field"><span class="label">Main language <span class="faint">(examples default to this)</span></span><select class="select" name="primaryLang"></select></label>
    <div class="field full"><span class="label">Goals</span><div class="lang-picks goal-picks"></div></div>
    <label class="field full"><span class="label">Bio</span><textarea class="input" name="bio" rows="3" maxlength="280" placeholder="A line about you and what you're learning"></textarea></label>
  </div>
  <div class="row" style="justify-content:flex-end;margin-top:20px"><button type="button" class="btn btn-ghost" data-act="reset">Reset</button><button class="btn btn-primary" type="submit">${CM.icon('check', 16)}<span>Save changes</span></button></div>
</form>`);
    body.appendChild(el);
    const f = el;
    ['fullName', 'email', 'institution', 'course', 'year', 'github', 'bio'].forEach((k) => { f.elements[k].value = p[k] || ''; });
    let level = p.level || 'beginner';
    let langs = (p.languages || []).slice();
    let goals = (p.goals || []).slice();
    const lv = f.querySelector('.levels');
    const drawLevels = () => { lv.innerHTML = LEVELS.map(([id, n, d]) => '<button type="button" class="pick ' + (level === id ? 'on' : '') + '" data-l="' + id + '"><b>' + n + '</b><span>' + d + '</span></button>').join(''); };
    lv.onclick = (e) => { const b = e.target.closest('[data-l]'); if (b) { level = b.dataset.l; drawLevels(); } };
    const lp = f.querySelector('.lang-picks:not(.goal-picks)');
    const prim = f.elements.primaryLang;
    const drawLangs = () => {
      lp.innerHTML = LANG_CHOICES.map((l) => '<button type="button" class="chip ' + (langs.indexOf(l) >= 0 ? 'on' : '') + '" data-lang="' + l + '">' + (langs.indexOf(l) >= 0 ? CM.icon('check', 13) : '') + esc(U.langName(l)) + '</button>').join('');
      const cur = prim.value || p.primaryLang;
      prim.innerHTML = '';
      (langs.length ? langs : ['python']).forEach((l) => prim.appendChild(new Option(U.langName(l), l)));
      prim.value = langs.indexOf(cur) >= 0 ? cur : (langs[0] || 'python');
    };
    lp.onclick = (e) => { const b = e.target.closest('[data-lang]'); if (!b) return; const l = b.dataset.lang; const i = langs.indexOf(l); if (i >= 0) langs.splice(i, 1); else langs.push(l); drawLangs(); };
    const gp = f.querySelector('.goal-picks');
    const drawGoals = () => { gp.innerHTML = GOALS.map((g) => '<button type="button" class="chip ' + (goals.indexOf(g) >= 0 ? 'on' : '') + '" data-g="' + esc(g) + '">' + esc(g) + '</button>').join(''); };
    gp.onclick = (e) => { const b = e.target.closest('[data-g]'); if (!b) return; const g = b.dataset.g; const i = goals.indexOf(g); if (i >= 0) goals.splice(i, 1); else goals.push(g); drawGoals(); };
    drawLevels(); drawLangs(); prim.value = p.primaryLang || prim.value; drawGoals();
    f.querySelector('[data-act=reset]').onclick = () => V.profile.render(root.parentElement, { tab: 'edit' });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = f.elements.fullName.value.trim();
      if (!name) { U.toast('Please enter your name', 'warn'); f.elements.fullName.focus(); return; }
      const email = f.elements.email.value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { U.toast('That email address looks invalid', 'warn'); f.elements.email.focus(); return; }
      Object.assign(p, {
        fullName: name, email, institution: f.elements.institution.value.trim(), course: f.elements.course.value.trim(), year: f.elements.year.value,
        github: f.elements.github.value.trim().replace(/^@/, ''), bio: f.elements.bio.value.trim(), level, languages: langs.length ? langs : ['python'], primaryLang: prim.value, goals
      });
      A.user.displayName = name;
      await A.save();
      A.rememberAccount(A.user);
      await A.logEvent(A.user.id, 'profile_updated', 'Profile details updated');
      U.toast('Profile saved', 'success');
      CM.app.refreshSidebar();
      V.profile.render(root.parentElement, { tab: 'overview' });
    });
  }

  /* ---------------- security ---------------- */
  async function security(body) {
    const u = A.user;
    const devices = await A.devices(u.id);
    const events = (await A.events(u.id)).slice(0, 25);
    const fp = A.fp;
    const el = U.html(`<div class="grid-2">
  <div class="stack">
    <div class="card card-pad">
      <div class="card-head"><h3>${CM.icon('fingerprint', 18)}This device</h3><button class="btn btn-sm" data-act="fp">${CM.icon('eye', 14)}<span>Fingerprint details</span></button></div>
      <div class="device"><div class="device-ic">${CM.icon(fp.kind === 'mobile' ? 'smartphone' : 'laptop', 20)}</div><div class="grow"><b>${esc(fp.label)} <span class="badge badge-ok">This device</span></b><span>Fingerprint <span class="fp-code">${esc(fp.short)}</span> · signature match ${A.device && A.device.match != null ? A.device.match : 100}%</span></div></div>
      <p class="muted" style="font-size:13px;margin-top:12px">Your session is bound to this device's fingerprint (graphics, canvas, fonts, screen, time zone and more, hashed with SHA-256). If someone copies your session to another computer, it is blocked automatically.</p>
    </div>
    <div class="card card-pad">
      <div class="card-head"><h3>${CM.icon('shield-check', 18)}Trusted devices</h3><span class="faint" style="font-size:13px">${U.plural(devices.filter((d) => !d.revoked).length, 'device')}</span></div>
      <div class="device-list"></div>
    </div>
    <div class="card card-pad">
      <div class="card-head"><h3>${CM.icon('key', 18)}Change password</h3></div>
      <form class="stack pw-form" novalidate>
        <label class="field"><span class="label">Current password</span><input class="input" type="password" name="old" autocomplete="current-password"></label>
        <label class="field"><span class="label">New password</span><input class="input" type="password" name="new1" autocomplete="new-password"><div class="strength" data-s="0"><i></i><i></i><i></i><i></i></div></label>
        <label class="field"><span class="label">Confirm new password</span><input class="input" type="password" name="new2" autocomplete="new-password"></label>
        <div class="row" style="justify-content:flex-end"><button class="btn btn-primary" type="submit">${CM.icon('check', 16)}<span>Update password</span></button></div>
      </form>
    </div>
  </div>
  <div class="stack">
    <div class="card card-pad"><div class="card-head"><h3>${CM.icon('activity', 18)}Recent security activity</h3></div><div class="timeline"></div></div>
    <div class="card card-pad" style="border-color:color-mix(in srgb,var(--err) 30%,transparent)">
      <div class="card-head"><h3 style="color:var(--err)">${CM.icon('alert', 18)}Danger zone</h3></div>
      <div class="stack">
        <div class="row-between"><div><b style="font-size:14px">Sign out everywhere</b><p class="muted" style="font-size:13px">End all saved sessions for your account.</p></div><button class="btn btn-sm" data-act="logout-all">${CM.icon('logout', 15)}<span>Sign out all</span></button></div>
        <hr class="divider" style="margin:4px 0">
        <div class="row-between"><div><b style="font-size:14px">Delete account</b><p class="muted" style="font-size:13px">Permanently erase your profile, chats, snippets and devices from this computer.</p></div><button class="btn btn-sm btn-danger" data-act="delete">${CM.icon('trash', 15)}<span>Delete</span></button></div>
      </div>
    </div>
  </div></div>`);
    body.appendChild(el);

    const list = el.querySelector('.device-list');
    const drawDevices = (devs) => {
      list.innerHTML = '';
      devs.filter((d) => !d.revoked).forEach((d) => {
        const isThis = A.device && A.device.id === d.id;
        const row = U.html(`<div class="device"><div class="device-ic">${CM.icon(d.kind === 'mobile' ? 'smartphone' : 'laptop', 20)}</div>
  <div class="grow"><b>${esc(d.label)} ${isThis ? '<span class="badge badge-ok">This device</span>' : ''}${d.trusted ? '<span class="badge badge-accent">' + CM.icon('shield-check', 11) + ' Trusted</span>' : ''}</b>
  <span>Fingerprint <span class="fp-code">${esc((d.hash || '').slice(0, 4) + '-' + (d.hash || '').slice(4, 8) + '-' + (d.hash || '').slice(8, 12))}</span> · ${U.plural(d.loginCount || 1, 'sign-in')}</span>
  <span>First seen ${esc(U.fmtDate(d.firstSeen))} · Last active ${esc(U.timeAgo(d.lastSeen))}</span></div>
  <button class="btn-icon sm" data-d="menu" aria-label="Device options">${CM.icon('more', 18)}</button></div>`);
        row.querySelector('[data-d=menu]').onclick = (e) => U.menu(e.currentTarget, [
          { label: d.trusted ? 'Remove trust' : 'Mark as trusted', icon: 'shield-check', onClick: async () => { await A.trustDevice(d.id, !d.trusted); drawDevices(await A.devices(u.id)); drawEvents(); } },
          { label: isThis ? 'Remove & sign out' : 'Remove device', icon: 'trash', danger: true, onClick: async () => {
            if (!await U.confirm({ title: 'Remove this device?', message: (isThis ? 'You will be signed out. ' : '') + 'Any session on “' + esc(d.label) + '” is ended. It will be treated as a new device next time.', confirmLabel: 'Remove', danger: true })) return;
            await A.revokeDevice(d.id);
            if (isThis) { CM.app.showAuth(); return; }
            drawDevices(await A.devices(u.id)); drawEvents(); U.toast('Device removed', 'success');
          } }
        ]);
        list.appendChild(row);
      });
    };
    drawDevices(devices);

    const tl = el.querySelector('.timeline');
    const drawEvents = async () => {
      const evs = (await A.events(u.id)).slice(0, 25);
      tl.innerHTML = evs.length ? evs.map((ev) => { const m = EVT[ev.type] || ['info', '', ev.type]; return '<div class="tl-item"><div class="tl-dot ' + m[1] + '">' + CM.icon(m[0], 14) + '</div><div><b>' + esc(ev.detail || m[2]) + '</b><span>' + esc(U.fmtDateTime(ev.at)) + (ev.device ? ' · ' + esc(ev.device) : '') + '</span></div></div>'; }).join('') : '<p class="muted">No activity yet.</p>';
    };
    void events;
    drawEvents();

    el.querySelector('[data-act=fp]').onclick = () => {
      const rows = Object.keys(SEC.WEIGHTS).map((k) => '<tr><td>' + esc(SEC.componentLabels[k] || k) + '</td><td>' + esc(String(fp.components[k]).slice(0, 220)) + '</td></tr>').join('');
      U.modal({ title: 'Device fingerprint', icon: 'fingerprint', size: 'lg', body: '<p class="muted" style="font-size:13.5px;margin-bottom:12px">These signals are combined and hashed (SHA-256) into your device ID <span class="fp-code">' + esc(fp.short) + '</span>. They never leave this computer. Sign-ins compare them with a weighted similarity score, so small changes such as a browser update don\'t lock you out.</p><table class="fp-table">' + rows + '<tr><td>Full hash</td><td>' + esc(fp.hash) + '</td></tr></table>', actions: [{ label: 'Close', kind: 'primary' }] });
    };

    const pw = el.querySelector('.pw-form');
    pw.elements.new1.addEventListener('input', () => { pw.querySelector('.strength').dataset.s = SEC.strength(pw.elements.new1.value).score; });
    pw.addEventListener('submit', async (e) => {
      e.preventDefault();
      const { old, new1, new2 } = pw.elements;
      if (new1.value !== new2.value) { U.toast('New passwords do not match', 'warn'); return; }
      const btn = pw.querySelector('button[type=submit]'); btn.disabled = true;
      try { await A.changePassword(old.value, new1.value); pw.reset(); pw.querySelector('.strength').dataset.s = 0; U.toast('Password updated. Other sessions were signed out.', 'success'); drawEvents(); }
      catch (err) { U.toast(err.message, 'error'); }
      finally { btn.disabled = false; }
    });

    el.querySelector('[data-act=logout-all]').onclick = async () => {
      if (await U.confirm({ title: 'Sign out everywhere?', message: 'All saved sessions for @' + esc(u.username) + ' will end, including this one.', confirmLabel: 'Sign out all', danger: true })) { await A.logoutEverywhere(); CM.app.showAuth(); }
    };
    el.querySelector('[data-act=delete]').onclick = async () => {
      const pwd = await U.prompt({ title: 'Delete account permanently', label: 'Enter your password to confirm. This cannot be undone.', type: 'password', confirmLabel: 'Delete my account', icon: 'alert' });
      if (pwd == null) return;
      try { await A.deleteAccount(pwd); U.toast('Account deleted', 'success'); CM.app.showAuth(); }
      catch (err) { U.toast(err.message, 'error'); }
    };
  }
})();
