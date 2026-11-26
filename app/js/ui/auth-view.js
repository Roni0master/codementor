/* CodeMentor — sign in / create account screen */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, A = CM.auth, S = CM.security;
  const esc = U.esc;

  CM.authView = {
    render(root, opts) {
      opts = opts || {};
      const fp = A.fp || {};
      const accounts = A.accounts();
      let mode = opts.mode || (accounts.length ? 'login' : 'signup');
      const blocked = A.notices.some((n) => n.type === 'blocked');
      A.notices = A.notices.filter((n) => n.type !== 'blocked');

      root.innerHTML = '';
      const el = U.html(`
<div class="auth">
  <section class="auth-hero">
    <div class="brand">${CM.logo(36)}<div>CodeMentor<small>Offline coding mentor</small></div></div>
    <div class="hero-copy">
      <h1>Stuck on a bug?<br><span class="grad-text">Understand it.</span> Then fix it.</h1>
      <p>Paste an error or your code. CodeMentor explains what went wrong, shows the fix, and teaches the concept behind it, all without an internet connection.</p>
      <div class="hero-feats">
        <div class="hero-feat">${CM.icon('bug', 18)}<div><b>Error decoder</b><span>Python, JS, Java, C/C++, SQL, Git</span></div></div>
        <div class="hero-feat">${CM.icon('lightbulb', 18)}<div><b>Concepts, simply</b><span>Analogies, examples, quizzes</span></div></div>
        <div class="hero-feat">${CM.icon('terminal', 18)}<div><b>Code playground</b><span>Run and analyze code locally</span></div></div>
        <div class="hero-feat">${CM.icon('wifi-off', 18)}<div><b>100% offline</b><span>Your data never leaves this device</span></div></div>
      </div>
      <div class="hero-demo" aria-hidden="true">
        <div class="hero-demo-head"><i></i><i></i><i></i></div>
        <div class="hero-demo-body">
          <div class="demo-msg u">TypeError: can only concatenate str (not "int") to str</div>
          <div class="demo-msg a"><b>In plain words:</b> you're adding text and a number. <code style="font-family:var(--mono);font-size:12px">input()</code> always returns a string, so wrap it in <code style="font-family:var(--mono);font-size:12px">int()</code> first.</div>
          <div class="demo-msg a">💡 <b>Concept:</b> Python never converts types silently. You choose with <code style="font-family:var(--mono);font-size:12px">int()</code> or <code style="font-family:var(--mono);font-size:12px">str()</code>.</div>
        </div>
      </div>
    </div>
    <div class="hero-foot"><span>${CM.icon('shield-check', 14)} PBKDF2-hashed passwords</span><span>${CM.icon('fingerprint', 14)} Device-bound sessions</span><span>${CM.icon('database', 14)} Stored locally</span></div>
  </section>
  <section class="auth-side">
    <div class="auth-card">
      <h2 class="auth-title"></h2>
      <p class="sub auth-sub"></p>
      <div class="auth-tabs" role="tablist">
        <button data-mode="login" role="tab">Sign in</button>
        <button data-mode="signup" role="tab">Create account</button>
      </div>
      ${blocked ? `<div class="notice" style="margin-bottom:14px">${CM.icon('shield', 18)}<div>Your saved session was blocked because this device's fingerprint did not match. Please sign in again.</div></div>` : ''}
      <div class="accounts"></div>
      <form class="auth-form" novalidate autocomplete="on"></form>
      <div class="device-chip">${CM.icon('fingerprint', 18)}<div class="grow">This device: <b>${esc(fp.label || 'Unknown')}</b><br><span class="mono" style="font-size:11.5px">ID ${esc(fp.short || '…')}</span></div><span class="badge badge-ok">Recognised offline</span></div>
    </div>
  </section>
</div>`);
      root.appendChild(el);
      const form = el.querySelector('.auth-form');
      const tabs = el.querySelectorAll('.auth-tabs button');
      const accBox = el.querySelector('.accounts');

      function renderAccounts() {
        accBox.innerHTML = '';
        if (mode !== 'login' || !accounts.length) return;
        accounts.forEach((a) => {
          const b = U.html(`<button type="button" class="account-pick">${U.avatar({ username: a.username, profile: { fullName: a.name, hue: a.hue } }, 38)}<div class="grow"><b>${esc(a.name)}</b><span>@${esc(a.username)}</span></div>${CM.icon('chevron-right', 16)}</button>`);
          b.onclick = () => { const u = form.querySelector('[name=username]'); u.value = a.username; form.querySelector('[name=password]').focus(); };
          accBox.appendChild(b);
        });
      }

      function setMode(m) {
        mode = m;
        tabs.forEach((t) => t.classList.toggle('on', t.dataset.mode === m));
        el.querySelector('.auth-title').textContent = m === 'login' ? 'Welcome back 👋' : 'Create your account';
        el.querySelector('.auth-sub').textContent = m === 'login' ? 'Sign in to continue learning where you left off.' : 'It takes 20 seconds, and everything stays on this device.';
        renderAccounts();
        form.innerHTML = m === 'login' ? `
          <div class="auth-error" role="alert">${CM.icon('alert', 16)}<span></span></div>
          <label class="field"><span class="label">Username</span>
            <div class="input-wrap">${CM.icon('user', 17)}<input class="input" name="username" autocomplete="username" placeholder="your_username" required></div></label>
          <label class="field"><span class="label">Password</span>
            <div class="input-wrap">${CM.icon('lock', 17)}<input class="input" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required>
            <button type="button" class="btn-icon sm input-action toggle-pw" aria-label="Show password">${CM.icon('eye', 16)}</button></div></label>
          <div class="auth-row"><label class="check"><input type="checkbox" name="remember" checked> Keep me signed in on this device</label></div>
          <button class="btn btn-grad btn-lg btn-block" type="submit">${CM.icon('arrow-right', 18)}<span>Sign in</span></button>` : `
          <div class="auth-error" role="alert">${CM.icon('alert', 16)}<span></span></div>
          <label class="field"><span class="label">Your name</span>
            <div class="input-wrap">${CM.icon('user', 17)}<input class="input" name="name" autocomplete="name" placeholder="e.g. Asha Sharma" required></div></label>
          <label class="field"><span class="label">Username</span>
            <div class="input-wrap">${CM.icon('at', 17)}<input class="input" name="username" autocomplete="username" placeholder="letters, numbers, _ or ." required></div>
            <span class="hint">3–24 characters. Used to sign in.</span></label>
          <label class="field"><span class="label">Password</span>
            <div class="input-wrap">${CM.icon('lock', 17)}<input class="input" name="password" type="password" autocomplete="new-password" placeholder="At least 6 characters" required>
            <button type="button" class="btn-icon sm input-action toggle-pw" aria-label="Show password">${CM.icon('eye', 16)}</button></div>
            <div class="strength" data-s="0"><i></i><i></i><i></i><i></i></div><span class="hint pw-hint">Use 8+ characters with a mix of letters, numbers and symbols.</span></label>
          <button class="btn btn-grad btn-lg btn-block" type="submit">${CM.icon('sparkles', 18)}<span>Create account</span></button>
          <p class="hint" style="text-align:center">Your account lives only on this device. There is no email verification and no cloud.</p>`;
        form.querySelectorAll('.toggle-pw').forEach((b) => b.onclick = () => {
          const i = b.parentElement.querySelector('input');
          i.type = i.type === 'password' ? 'text' : 'password';
          b.innerHTML = CM.icon(i.type === 'password' ? 'eye' : 'eye-off', 16);
        });
        const pw = form.querySelector('[name=password]');
        if (m === 'signup') pw.addEventListener('input', () => {
          const st = S.strength(pw.value);
          form.querySelector('.strength').dataset.s = st.score;
          form.querySelector('.pw-hint').textContent = pw.value ? st.label + (st.hints.length ? ' · add ' + st.hints.slice(0, 2).join(', ') : ' password 💪') : 'Use 8+ characters with a mix of letters, numbers and symbols.';
        });
        setTimeout(() => { const f = form.querySelector('input'); if (f) f.focus(); }, 50);
      }

      tabs.forEach((t) => t.onclick = () => setMode(t.dataset.mode));

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type=submit]');
        const errBox = form.querySelector('.auth-error');
        errBox.classList.remove('show');
        const data = Object.fromEntries(new FormData(form).entries());
        btn.disabled = true;
        const label = btn.querySelector('span').textContent;
        btn.querySelector('span').textContent = mode === 'login' ? 'Verifying…' : 'Securing your account…';
        try {
          if (mode === 'login') await A.login({ username: data.username, password: data.password, remember: !!data.remember });
          else await A.signup({ username: data.username, displayName: data.name, password: data.password, remember: true });
          CM.app.start();
        } catch (err) {
          errBox.querySelector('span').textContent = err.message || String(err);
          errBox.classList.remove('show'); void errBox.offsetWidth; errBox.classList.add('show');
          btn.disabled = false; btn.querySelector('span').textContent = label;
        }
      });

      setMode(mode);
    }
  };
})();
