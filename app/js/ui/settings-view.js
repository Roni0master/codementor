/* CodeMentor — settings */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, A = CM.auth;
  const esc = U.esc;
  const V = (CM.views = CM.views || {});
  const ACCENTS = [['violet', '#8b7bff'], ['blue', '#4f8cff'], ['emerald', '#10b981'], ['cyan', '#06b6d4'], ['rose', '#f43f5e'], ['amber', '#f59e0b']];

  V.settings = {
    async render(container) {
      const s = A.user.settings;
      s.llm = s.llm || A.defaults.settings().llm;
      container.innerHTML = '';
      const el = U.html(`
<div class="page"><div class="page-inner">
  <div class="page-head"><div><h1>Settings</h1><p>Make CodeMentor work the way you like. Settings are saved to your profile on this device.</p></div></div>
  <div class="settings">
    <nav class="set-nav">
      <a href="#set-appearance" class="on">${CM.icon('sun', 17)}Appearance</a>
      <a href="#set-chat">${CM.icon('message', 17)}Chat</a>
      <a href="#set-ai">${CM.icon('cpu', 17)}AI engine</a>
      <a href="#set-runner">${CM.icon('terminal', 17)}Code runner</a>
      <a href="#set-data">${CM.icon('database', 17)}Data & privacy</a>
      <a href="#set-keys">${CM.icon('keyboard', 17)}Shortcuts</a>
      <a href="#set-about">${CM.icon('info', 17)}About</a>
    </nav>
    <div>
      <section class="card card-pad set-section" id="set-appearance">
        <div class="card-head"><h3>${CM.icon('sun', 18)}Appearance</h3></div>
        <div class="set-row" style="flex-direction:column;align-items:stretch"><div class="grow"><b>Theme</b><span>Choose light, dark, or follow your system.</span></div>
          <div class="theme-cards">
            <button class="theme-card" data-theme="light"><div class="prev prev-light"><i></i><i></i></div>Light</button>
            <button class="theme-card" data-theme="dark"><div class="prev prev-dark"><i></i><i></i></div>Dark</button>
            <button class="theme-card" data-theme="system"><div class="prev prev-system"><i></i><i></i></div>System</button>
          </div></div>
        <div class="set-row"><div class="grow"><b>Accent colour</b><span>Used for highlights, buttons and the logo.</span></div><div class="swatches"></div></div>
        <div class="set-row"><div class="grow"><b>Text size</b><span>Make answers easier to read.</span></div>
          <div class="seg font-seg"><button data-font="sm">Small</button><button data-font="md">Medium</button><button data-font="lg">Large</button></div></div>
      </section>

      <section class="card card-pad set-section" id="set-chat">
        <div class="card-head"><h3>${CM.icon('message', 18)}Chat</h3></div>
        <div class="set-row"><div class="grow"><b>Default answer depth</b><span>Simple for quick help, Deep for thorough explanations.</span></div>
          <div class="seg depth-seg"><button data-depth="simple">Simple</button><button data-depth="balanced">Balanced</button><button data-depth="deep">Deep</button></div></div>
        <div class="set-row"><div class="grow"><b>Typing animation</b><span>Reveal answers progressively.</span></div><label class="switch"><input type="checkbox" data-k="typing"><span></span></label></div>
        <div class="set-row"><div class="grow"><b>Enter to send</b><span>When off, use Ctrl + Enter to send and Enter for new lines.</span></div><label class="switch"><input type="checkbox" data-k="enterToSend"><span></span></label></div>
      </section>

      <section class="card card-pad set-section" id="set-ai">
        <div class="card-head"><h3>${CM.icon('cpu', 18)}AI engine</h3><span class="badge badge-ok">${CM.icon('wifi-off', 12)} Always offline</span></div>
        <div class="set-row"><div class="grow"><b>Answer engine</b><span>The built-in engine always works. Optionally connect a local AI model running on this computer for open-ended questions.</span></div>
          <select class="select" data-k="engine"><option value="builtin">Built-in engine (default)</option><option value="local">Local AI model + built-in backup</option></select></div>
        <div class="llm-box">
          <div class="set-row"><div class="grow"><b>Provider</b><span>Ollama (ollama.com) or any OpenAI-compatible local server (LM Studio, llama.cpp, Jan).</span></div>
            <select class="select" data-llm="provider"><option value="ollama">Ollama</option><option value="openai">OpenAI-compatible (LM Studio…)</option></select></div>
          <div class="set-row"><div class="grow"><b>Server address</b><span>Must be on this machine (localhost).</span></div><input class="input" data-llm="url" style="max-width:280px"></div>
          <div class="set-row"><div class="grow"><b>Model</b><span class="model-hint">Click “Test connection” to load the models you have installed.</span></div>
            <div class="row"><select class="select" data-llm="model" style="min-width:200px"></select><button class="btn btn-sm" data-act="test">${CM.icon('refresh', 15)}<span>Test connection</span></button></div></div>
          <div class="set-row"><div class="grow"><b>Creativity (temperature)</b><span>Lower is more precise and better for code.</span></div><div class="row"><input type="range" min="0" max="1" step="0.1" data-llm="temperature" style="accent-color:var(--accent)"><span class="temp-val mono faint"></span></div></div>
          <div class="notice notice-info" style="margin-top:8px">${CM.icon('info', 18)}<div><b>Setup tip:</b> install Ollama, run <code class="mono">ollama pull qwen2.5-coder:7b</code> (or another model) once while online, and it works offline from then on. CodeMentor feeds the model its own verified analysis and knowledge-base facts, then falls back to the built-in engine if the model is unavailable.</div></div>
        </div>
      </section>

      <section class="card card-pad set-section" id="set-runner">
        <div class="card-head"><h3>${CM.icon('terminal', 18)}Code runner</h3><button class="btn btn-sm" data-act="rescan">${CM.icon('refresh', 15)}<span>Re-check</span></button></div>
        <p class="muted" style="font-size:13.5px;margin-bottom:12px">JavaScript runs in a built-in sandbox. Python, Java, C and C++ run through the CodeMentor launcher using the compilers installed on your computer, with no internet needed.</p>
        <div class="runner-list"></div>
      </section>

      <section class="card card-pad set-section" id="set-data">
        <div class="card-head"><h3>${CM.icon('database', 18)}Data & privacy</h3></div>
        <div class="set-row"><div class="grow"><b>Storage used</b><span class="storage-info">Calculating…</span></div></div>
        <div class="set-row"><div class="grow"><b>Export everything</b><span>Download your profile, chats and snippets as a JSON backup.</span></div><button class="btn btn-sm" data-act="export">${CM.icon('download', 15)}<span>Export</span></button></div>
        <div class="set-row"><div class="grow"><b>Import backup</b><span>Restore chats and snippets from a CodeMentor export.</span></div><button class="btn btn-sm" data-act="import">${CM.icon('upload', 15)}<span>Import</span></button></div>
        <div class="set-row"><div class="grow"><b>Reset learning stats</b><span>Clear streaks, counters and quiz scores (chats are kept).</span></div><button class="btn btn-sm btn-danger" data-act="reset-stats">${CM.icon('refresh', 15)}<span>Reset</span></button></div>
      </section>

      <section class="card card-pad set-section" id="set-keys">
        <div class="card-head"><h3>${CM.icon('keyboard', 18)}Keyboard shortcuts</h3></div>
        <div class="shortcut-list">
          <span>Command palette / search</span><span><kbd>Ctrl</kbd> <kbd>K</kbd></span>
          <span>New chat</span><span><kbd>Alt</kbd> <kbd>N</kbd></span>
          <span>Toggle sidebar</span><span><kbd>Ctrl</kbd> <kbd>B</kbd></span>
          <span>Insert code in chat</span><span><kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>K</kbd></span>
          <span>Send message</span><span><kbd>Enter</kbd> (new line: <kbd>Shift</kbd> <kbd>Enter</kbd>)</span>
          <span>Run code in Playground</span><span><kbd>Ctrl</kbd> <kbd>Enter</kbd></span>
          <span>Toggle comment in editor</span><span><kbd>Ctrl</kbd> <kbd>/</kbd></span>
        </div>
      </section>

      <section class="card card-pad set-section" id="set-about">
        <div class="card-head"><h3>${CM.icon('info', 18)}About CodeMentor</h3></div>
        <div class="row" style="gap:14px;align-items:flex-start">${CM.logo(48)}<div><b>CodeMentor 1.0</b><p class="muted" style="font-size:13.5px;margin-top:4px">An offline coding mentor for students. Knowledge base: <b>${CM.kb.concepts.length}</b> concepts, <b>${CM.kb.errors.length}</b> error types, <b>${CM.kb.recipes.length}</b> code recipes and <b>${CM.kb.compares.length}</b> comparisons, plus a static analyzer for Python, JavaScript, Java, C and C++.</p>
        <p class="muted" style="font-size:13px;margin-top:8px">Built-in answers come from a curated knowledge base and heuristics. Always test the code it suggests, and use it to learn the <i>why</i>.</p></div></div>
      </section>
    </div>
  </div>
</div></div>`);
      container.appendChild(el);
      const save = async () => { await A.save(); };

      // nav highlighting
      const nav = el.querySelectorAll('.set-nav a');
      nav.forEach((a) => a.onclick = (e) => { e.preventDefault(); el.querySelector(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth', block: 'start' }); nav.forEach((x) => x.classList.toggle('on', x === a)); });

      // appearance
      const themeCards = el.querySelectorAll('.theme-card');
      const drawTheme = () => themeCards.forEach((c) => c.classList.toggle('on', c.dataset.theme === s.theme));
      themeCards.forEach((c) => c.onclick = async () => { s.theme = c.dataset.theme; A.applySettings(s); drawTheme(); await save(); });
      drawTheme();
      const sw = el.querySelector('.swatches');
      const drawSw = () => { sw.innerHTML = ACCENTS.map(([k, col]) => '<button class="swatch ' + (s.accent === k ? 'on' : '') + '" data-acc="' + k + '" style="background:' + col + '" aria-label="' + k + '" title="' + U.cap(k) + '"></button>').join(''); };
      sw.onclick = async (e) => { const b = e.target.closest('[data-acc]'); if (!b) return; s.accent = b.dataset.acc; A.applySettings(s); drawSw(); await save(); };
      drawSw();
      const fontSeg = el.querySelector('.font-seg');
      const drawFont = () => fontSeg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.font === (s.font || 'md')));
      fontSeg.onclick = async (e) => { const b = e.target.closest('button'); if (!b) return; s.font = b.dataset.font; A.applySettings(s); drawFont(); await save(); };
      drawFont();

      // chat
      const depthSeg = el.querySelector('.depth-seg');
      const drawDepth = () => depthSeg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.depth === (s.depth || 'balanced')));
      depthSeg.onclick = async (e) => { const b = e.target.closest('button'); if (!b) return; s.depth = b.dataset.depth; drawDepth(); await save(); };
      drawDepth();
      el.querySelectorAll('input[data-k]').forEach((i) => { i.checked = s[i.dataset.k] !== false; i.onchange = async () => { s[i.dataset.k] = i.checked; await save(); }; });

      // AI engine
      const engineSel = el.querySelector('select[data-k=engine]');
      const llmBox = el.querySelector('.llm-box');
      engineSel.value = s.engine || 'builtin';
      const drawEngine = () => { llmBox.style.display = engineSel.value === 'local' ? '' : 'none'; };
      engineSel.onchange = async () => { s.engine = engineSel.value; drawEngine(); await save(); if (s.engine === 'local' && !s.llm.model) U.toast('Now test the connection and choose a model', 'info'); };
      drawEngine();
      const prov = el.querySelector('[data-llm=provider]');
      const url = el.querySelector('[data-llm=url]');
      const model = el.querySelector('[data-llm=model]');
      const temp = el.querySelector('[data-llm=temperature]');
      prov.value = s.llm.provider || 'ollama';
      url.value = s.llm.url || 'http://localhost:11434';
      temp.value = s.llm.temperature != null ? s.llm.temperature : 0.3;
      el.querySelector('.temp-val').textContent = temp.value;
      const setModels = (list) => { model.innerHTML = ''; if (!list.length) model.appendChild(new Option(s.llm.model || 'No models found', s.llm.model || '')); list.forEach((m) => model.appendChild(new Option(m, m))); if (s.llm.model && list.indexOf(s.llm.model) >= 0) model.value = s.llm.model; };
      setModels(s.llm.model ? [s.llm.model] : []);
      prov.onchange = async () => { s.llm.provider = prov.value; if (/11434|1234/.test(url.value)) url.value = prov.value === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234'; s.llm.url = url.value; await save(); };
      url.onchange = async () => {
        const v = url.value.trim();
        if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/.*)?$/i.test(v)) { U.toast('For privacy and offline use, the AI server must be on localhost.', 'warn', 4000); url.value = s.llm.url; return; }
        s.llm.url = v; await save();
      };
      model.onchange = async () => { s.llm.model = model.value; await save(); U.toast('Model set to ' + model.value, 'success'); };
      temp.oninput = () => { el.querySelector('.temp-val').textContent = temp.value; };
      temp.onchange = async () => { s.llm.temperature = parseFloat(temp.value); await save(); };
      el.querySelector('[data-act=test]').onclick = async (e) => {
        const b = e.currentTarget; b.disabled = true;
        const hint = el.querySelector('.model-hint');
        hint.textContent = 'Connecting…';
        const r = await CM.llm.test(s.llm);
        b.disabled = false;
        if (r.ok) {
          setModels(r.models);
          if (!s.llm.model && r.models[0]) { s.llm.model = r.models[0]; model.value = r.models[0]; await save(); }
          hint.innerHTML = '<span class="status-dot ok"></span> Connected · ' + U.plural(r.models.length, 'model') + ' available';
          U.toast('Connected to local AI', 'success');
        } else {
          hint.innerHTML = '<span class="status-dot err"></span> ' + esc(r.error || 'Could not connect');
          U.toast('Could not reach the local AI server', 'error');
        }
      };

      // runners
      const drawRunners = () => {
        const list = el.querySelector('.runner-list');
        const st = CM.runner.status();
        const via = !!CM.runner.server;
        list.innerHTML = (via ? '' : '<div class="notice" style="margin-bottom:12px">' + CM.icon('info', 18) + '<div>The CodeMentor launcher is not running, so only JavaScript can run right now. Start the app with <b>Start CodeMentor.bat</b> to run Python, Java, C and C++.</div></div>') +
          st.map((r) => '<div class="set-row"><div class="grow"><b>' + esc(r.name) + '</b><span>' + (r.ok ? esc(r.note || 'available') : 'Not available' + (r.lang !== 'javascript' && via ? ': install it and click Re-check' : '')) + '</span></div><span class="badge ' + (r.ok ? 'badge-ok' : '') + '">' + (r.ok ? CM.icon('check', 12) + ' Ready' : 'Off') + '</span></div>').join('');
      };
      drawRunners();
      el.querySelector('[data-act=rescan]').onclick = async () => {
        if (CM.runner.server) { try { await fetch('api/rescan', { method: 'POST', headers: { 'X-CodeMentor': '1' } }); } catch (e) { /* ignore */ } }
        await CM.runner.detect(true); drawRunners(); U.toast('Runner status refreshed', 'success', 1500);
      };

      // data
      (async () => {
        let txt = 'Saved in your browser\'s local database (IndexedDB) on this device.';
        try {
          if (navigator.storage && navigator.storage.estimate) { const est = await navigator.storage.estimate(); txt = U.formatBytes(est.usage || 0) + ' used on this device · nothing is uploaded.'; }
        } catch (e) { /* ignore */ }
        const convs = await CM.data.convs(A.user.id);
        const snips = await CM.data.snippets(A.user.id);
        el.querySelector('.storage-info').textContent = U.plural(convs.length, 'chat') + ', ' + U.plural(snips.length, 'snippet') + ' · ' + txt;
      })();
      el.querySelector('[data-act=export]').onclick = async () => {
        const u = Object.assign({}, A.user); delete u.pass;
        const data = { app: 'codementor', kind: 'full', version: 1, exportedAt: new Date().toISOString(), user: u, conversations: await CM.data.convs(A.user.id), messages: await CM.data.allMessages(A.user.id), snippets: await CM.data.snippets(A.user.id) };
        U.download('codementor-backup-' + U.dayKey() + '.json', JSON.stringify(data, null, 2), 'application/json');
        U.toast('Backup downloaded', 'success');
      };
      el.querySelector('[data-act=import]').onclick = async () => {
        const f = await U.pickFile('.json,application/json'); if (!f) return;
        try {
          const data = JSON.parse(await U.readFile(f));
          if (data.app !== 'codementor') throw new Error('Not a CodeMentor backup');
          const n = await CM.data.importHistory(data);
          let k = 0;
          for (const sn of data.snippets || []) { await CM.data.saveSnippet(Object.assign({}, sn, { id: undefined })); k++; }
          CM.app.refreshSidebar();
          U.toast('Imported ' + U.plural(n, 'chat') + ' and ' + U.plural(k, 'snippet'), 'success');
        } catch (err) { U.toast('Import failed: ' + err.message, 'error'); }
      };
      el.querySelector('[data-act=reset-stats]').onclick = async () => {
        if (!await U.confirm({ title: 'Reset learning stats?', message: 'Streaks, counters, learned concepts and quiz scores will be cleared. Your chats stay.', confirmLabel: 'Reset', danger: true })) return;
        A.user.stats = A.defaults.stats(); await save(); CM.app.refreshSidebar(); U.toast('Stats reset', 'success');
      };
    }
  };
})();
