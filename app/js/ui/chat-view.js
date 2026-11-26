/* CodeMentor — chat view */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, A = CM.auth;
  const esc = U.esc;
  const V = (CM.views = CM.views || {});

  const POOL = [
    { icon: 'bug', t: 't-err', title: 'Decode an error', text: 'Why do I get "IndexError: list index out of range"?' },
    { icon: 'bug', t: 't-err', title: 'Fix a JS error', text: "TypeError: Cannot read properties of undefined (reading 'map')" },
    { icon: 'bug', t: 't-err', title: 'Java crash', text: 'What is a NullPointerException and how do I fix it?' },
    { icon: 'lightbulb', t: '', title: 'Learn a concept', text: "Explain recursion like I'm a beginner" },
    { icon: 'lightbulb', t: '', title: 'Understand closures', text: 'What is a closure in JavaScript?' },
    { icon: 'lightbulb', t: '', title: 'OOP basics', text: 'What are the 4 pillars of OOP?' },
    { icon: 'compare', t: 't-warn', title: 'Compare ideas', text: 'Difference between == and === in JavaScript' },
    { icon: 'compare', t: 't-warn', title: 'Data structures', text: 'Stack vs queue: what is the difference?' },
    { icon: 'code', t: 't-ok', title: 'Write a program', text: 'Write a program to check if a number is prime in Java' },
    { icon: 'code', t: 't-ok', title: 'Pattern printing', text: 'How to print a pyramid star pattern in C' },
    { icon: 'search', t: 't-info', title: 'Review my code', text: "What's wrong with my code?\n```python\ndef average(nums)\n    total = 0\n    for n in nums:\n        total += n\n    return total / len(nums)\n```" },
    { icon: 'search', t: 't-info', title: 'Debug C code', text: "My program crashes with a segmentation fault\n```c\n#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", n);\n    printf(\"%d\\n\", n * 2);\n    return 0;\n}\n```" },
    { icon: 'zap', t: '', title: 'Complexity', text: 'What is the time complexity of binary search?' },
    { icon: 'cap', t: '', title: 'Study plan', text: 'How do I start learning DSA?' }
  ];
  const THINKING = {
    error: ['Reading the error message…', 'Matching it against known errors…', 'Checking your code…'],
    code: ['Analyzing your code…', 'Checking syntax and common mistakes…', 'Estimating complexity…'],
    other: ['Thinking…', 'Searching the knowledge base…', 'Preparing an explanation…']
  };
  const LANG_OPTS = [['auto', 'Auto language'], ['python', 'Python'], ['javascript', 'JavaScript'], ['java', 'Java'], ['cpp', 'C++'], ['c', 'C'], ['typescript', 'TypeScript'], ['sql', 'SQL']];

  let S = null; // view state

  function settings() { return (A.user && A.user.settings) || A.defaults.settings(); }

  V.chat = {
    async render(container, params) {
      if (S && S.typing) S.typing.finish();
      S = { conv: null, messages: [], busy: false, abort: null, typing: null, langPref: (S && S.langPref) || 'auto', container };
      if (params && params.id) {
        const conv = await CM.data.getConv(params.id);
        if (conv && conv.userId === A.user.id) { S.conv = conv; S.messages = await CM.data.messages(conv.id); }
        else { U.toast('That chat was not found', 'warn'); CM.app.navigate('#/chat', { replace: true }); return; }
      }
      container.innerHTML = '';
      const el = U.html(`
<div class="chat">
  <header class="chat-head">
    <button class="chat-title btn-ghost" style="border-radius:8px;padding:4px 8px" title="Rename chat"></button>
    <span class="chat-badges row" style="gap:6px"></span>
    <div class="grow"></div>
    <button class="btn-icon" data-act="export" data-tip="Export as Markdown" data-tip-pos="bottom">${CM.icon('download', 18)}</button>
    <button class="btn-icon" data-act="pin" data-tip="Pin chat" data-tip-pos="bottom">${CM.icon('pin', 18)}</button>
    <button class="btn-icon" data-act="delete" data-tip="Delete chat" data-tip-pos="bottom">${CM.icon('trash', 18)}</button>
    <button class="btn btn-sm" data-act="new">${CM.icon('plus', 16)}<span>New chat</span></button>
  </header>
  <div class="chat-scroll"><div class="chat-inner"></div></div>
  <div class="composer-wrap">
    <div class="composer">
      <textarea rows="1" placeholder="Ask anything, or paste an error message or code…"></textarea>
      <div class="composer-bar">
        <button class="btn-icon sm" data-act="code" data-tip="Insert code (Ctrl+Shift+K)">${CM.icon('braces', 17)}</button>
        <button class="btn-icon sm" data-act="file" data-tip="Attach a code file">${CM.icon('file', 17)}</button>
        <select class="select lang-pref" aria-label="Answer language"></select>
        <div class="seg depth-seg" role="radiogroup" aria-label="Answer depth">
          <button data-depth="simple" title="Short and simple">Simple</button>
          <button data-depth="balanced" title="Balanced explanation">Balanced</button>
          <button data-depth="deep" title="Thorough, with internals and practice">Deep</button>
        </div>
        <button class="send-btn" aria-label="Send" disabled>${CM.icon('arrow-up', 19)}</button>
      </div>
    </div>
    <div class="composer-foot">${CM.icon('lock', 12)}<span class="engine-label"></span></div>
  </div>
</div>`);
      container.appendChild(el);
      S.el = el;
      S.scroll = el.querySelector('.chat-scroll');
      S.inner = el.querySelector('.chat-inner');
      S.ta = el.querySelector('textarea');
      S.send = el.querySelector('.send-btn');

      // language select
      const sel = el.querySelector('.lang-pref');
      LANG_OPTS.forEach(([v, l]) => sel.appendChild(new Option(l, v)));
      sel.value = S.langPref;
      sel.onchange = () => { S.langPref = sel.value; };
      // depth
      const seg = el.querySelector('.depth-seg');
      const setDepth = (d) => seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.depth === d));
      setDepth(settings().depth || 'balanced');
      seg.onclick = async (e) => { const b = e.target.closest('button'); if (!b) return; setDepth(b.dataset.depth); A.user.settings.depth = b.dataset.depth; await A.save(); };
      S.getDepth = () => (seg.querySelector('.on') || {}).dataset ? seg.querySelector('.on').dataset.depth : 'balanced';

      updateEngineLabel();
      wireComposer();
      el.querySelector('.chat-head').addEventListener('click', onHeadClick);
      CM.md.bind(S.inner, { ask: (q) => V.chat.ask(q), playground: (code, lang) => CM.app.openPlayground(code, lang) });
      S.inner.addEventListener('click', onMsgAction);
      renderAll();
      setTimeout(() => S.ta.focus(), 30);
      if (params && params.prefill) { S.ta.value = params.prefill; autosize(); S.send.disabled = false; }
    },
    destroy() { if (S && S.abort) S.abort.abort(); if (S && S.typing) S.typing.finish(); },
    /** Send a question from elsewhere (suggestion chips, ask-links, playground). */
    ask(text) {
      if (!S || !S.el || !S.el.isConnected) { CM.app.navigate('#/chat'); setTimeout(() => V.chat.ask(text), 60); return; }
      send(text);
    },
    newChat() { CM.app.navigate('#/chat'); }
  };

  function updateEngineLabel() {
    const lbl = S.el.querySelector('.engine-label');
    const llm = CM.llm.enabled(A.user);
    lbl.textContent = llm ? 'Local AI · ' + A.user.settings.llm.model + ' · runs on your device, with the built-in engine as backup' : 'Built-in offline engine · nothing leaves your device';
  }

  /* ---------------- header ---------------- */
  function updateHeader() {
    const t = S.el.querySelector('.chat-title');
    t.textContent = S.conv ? S.conv.title : 'New chat';
    const badges = S.el.querySelector('.chat-badges');
    badges.innerHTML = S.conv && S.conv.lang ? '<span class="badge badge-accent">' + esc(U.langName(S.conv.lang)) + '</span>' : '';
    S.el.querySelectorAll('[data-act=export],[data-act=delete],[data-act=pin]').forEach((b) => { b.style.display = S.conv ? '' : 'none'; });
    const pin = S.el.querySelector('[data-act=pin]');
    if (S.conv) { pin.classList.toggle('active', !!S.conv.pinned); pin.dataset.tip = S.conv.pinned ? 'Unpin chat' : 'Pin chat'; }
    document.title = (S.conv ? S.conv.title + ' · ' : '') + 'CodeMentor';
  }

  async function onHeadClick(e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('chat-title')) {
      if (!S.conv) return;
      const v = await U.prompt({ title: 'Rename chat', label: 'Title', value: S.conv.title, icon: 'edit' });
      if (v && v.trim()) { S.conv.title = v.trim().slice(0, 80); await CM.data.saveConv(S.conv); updateHeader(); CM.app.refreshSidebar(); }
      return;
    }
    const act = b.dataset.act;
    if (act === 'new') CM.app.navigate('#/chat');
    if (act === 'export' && S.conv) CM.data.exportConv(S.conv, S.messages);
    if (act === 'pin' && S.conv) { S.conv.pinned = !S.conv.pinned; await CM.data.saveConv(S.conv); updateHeader(); CM.app.refreshSidebar(); U.toast(S.conv.pinned ? 'Chat pinned' : 'Chat unpinned', 'success'); }
    if (act === 'delete' && S.conv) {
      if (await U.confirm({ title: 'Delete this chat?', message: 'This permanently removes “' + esc(S.conv.title) + '” and all its messages from this device.', confirmLabel: 'Delete', danger: true })) {
        await CM.data.deleteConv(S.conv.id); U.toast('Chat deleted', 'success'); CM.app.refreshSidebar(); CM.app.navigate('#/chat');
      }
    }
  }

  /* ---------------- composer ---------------- */
  function autosize() { S.ta.style.height = 'auto'; S.ta.style.height = Math.min(260, S.ta.scrollHeight) + 'px'; }

  function wireComposer() {
    const ta = S.ta;
    ta.addEventListener('input', () => { autosize(); if (!S.busy) S.send.disabled = !ta.value.trim(); });
    ta.addEventListener('keydown', (e) => {
      const ets = settings().enterToSend !== false;
      if (e.key === 'Enter' && !e.isComposing && ((ets && !e.shiftKey && !e.ctrlKey) || (!ets && (e.ctrlKey || e.metaKey)))) {
        e.preventDefault();
        if (!S.busy) send(ta.value);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'K' || e.key === 'k')) { e.preventDefault(); insertCode(); }
    });
    ta.addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text');
      if (!text || text.split('\n').length < 3 || /```/.test(ta.value + text)) return;
      const det = CM.analyzer.detectLanguage(text);
      const errorish = /Traceback|Exception in thread|^\s*at .+:\d+/m.test(text) || (text.match(/(Error|Exception)\b/g) || []).length > 1;
      if (det.lang && det.score >= 5 && !errorish) {
        e.preventDefault();
        const block = (ta.value && !/\n$/.test(ta.value) ? '\n' : '') + '```' + det.lang + '\n' + text.replace(/\s+$/, '') + '\n```\n';
        ta.setRangeText(block, ta.selectionStart, ta.selectionEnd, 'end');
        autosize(); S.send.disabled = false;
        U.toast('Pasted as ' + U.langName(det.lang) + ' code', 'info', 1800);
      }
    });
    S.send.onclick = () => { if (S.busy) stop(); else send(ta.value); };
    S.el.querySelector('[data-act=code]').onclick = insertCode;
    S.el.querySelector('[data-act=file]').onclick = async () => {
      const f = await U.pickFile('.py,.js,.ts,.java,.c,.cpp,.cc,.h,.hpp,.cs,.sql,.html,.css,.txt,.json,.jsx,.tsx');
      if (f) attachFile(f);
    };
    const comp = S.el.querySelector('.composer');
    comp.addEventListener('dragover', (e) => { e.preventDefault(); comp.classList.add('drag'); });
    comp.addEventListener('dragleave', () => comp.classList.remove('drag'));
    comp.addEventListener('drop', (e) => { e.preventDefault(); comp.classList.remove('drag'); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) attachFile(f); });
  }

  async function attachFile(f) {
    if (f.size > 200 * 1024) { U.toast('That file is too large (max 200 KB)', 'warn'); return; }
    const text = await U.readFile(f);
    const lang = U.langFromExt(f.name) || CM.analyzer.detectLanguage(text).lang || '';
    const ta = S.ta;
    ta.value += (ta.value && !/\n$/.test(ta.value) ? '\n' : '') + '```' + lang + ' title="' + f.name.replace(/"/g, '') + '"\n' + text.replace(/\s+$/, '') + '\n```\n';
    autosize(); S.send.disabled = false; ta.focus();
    U.toast('Attached ' + f.name, 'success', 1800);
  }

  async function insertCode() {
    const r = await CM.codeModal({ lang: S.langPref !== 'auto' ? S.langPref : (A.user.profile.primaryLang || 'python') });
    if (!r) return;
    const ta = S.ta;
    ta.value += (ta.value && !/\n$/.test(ta.value) ? '\n' : '') + '```' + r.lang + '\n' + r.code.replace(/\s+$/, '') + '\n```\n';
    autosize(); S.send.disabled = false; ta.focus();
  }

  /* ---------------- rendering ---------------- */
  function renderAll() {
    updateHeader();
    S.inner.innerHTML = '';
    if (!S.messages.length) { renderWelcome(); return; }
    S.messages.forEach((m, i) => S.inner.appendChild(msgEl(m, i === S.messages.length - 1)));
    requestAnimationFrame(() => { S.scroll.scrollTop = S.scroll.scrollHeight; });
  }

  function renderWelcome() {
    const name = (A.user.profile.fullName || A.user.displayName || '').split(/\s+/)[0];
    const picks = POOL.slice().sort(() => Math.random() - 0.5);
    const chosen = [];
    ['t-err', 't-info', '', 't-warn', 't-ok', ''].forEach((t) => { const i = picks.findIndex((p) => p.t === t && chosen.indexOf(p) < 0); if (i >= 0) chosen.push(picks[i]); });
    const w = U.html(`
<div class="welcome">
  <div class="welcome-mark">${CM.logo(56)}</div>
  <h1>${esc(U.greeting())}${name ? ', <span class="grad-text">' + esc(name) + '</span>' : ''} 👋</h1>
  <p>What are we debugging or learning today? Paste an error, drop in your code, or ask about any concept. I'll explain the <b>why</b>, not just the fix.</p>
  <div class="welcome-caps">
    <span class="chip chip-sm">${CM.icon('bug', 14)} Error decoding</span>
    <span class="chip chip-sm">${CM.icon('wand', 14)} Auto-fix suggestions</span>
    <span class="chip chip-sm">${CM.icon('lightbulb', 14)} Concept explanations</span>
    <span class="chip chip-sm">${CM.icon('target', 14)} Quizzes</span>
    <span class="chip chip-sm">${CM.icon('wifi-off', 14)} Works offline</span>
  </div>
  <div class="suggest-grid"></div>
</div>`);
    const grid = w.querySelector('.suggest-grid');
    chosen.forEach((s) => {
      const preview = s.text.split('\n')[0];
      const b = U.html(`<button class="suggest ${s.t}"><span class="suggest-ic">${CM.icon(s.icon, 18)}</span><b>${esc(s.title)}</b><span>${esc(U.truncate(preview, 90))}</span></button>`);
      b.onclick = () => send(s.text);
      grid.appendChild(b);
    });
    S.inner.appendChild(w);
  }

  function sourceBadge(m) {
    if (m.meta && m.meta.source === 'llm') return '<span class="badge badge-info" title="Answered by your local AI model">' + CM.icon('cpu', 12) + esc(m.meta.model || 'Local AI') + '</span>';
    return '<span class="badge badge-accent" title="Answered by the built-in offline engine">' + CM.icon('wifi-off', 12) + 'Offline engine</span>';
  }

  function msgEl(m, isLast) {
    if (m.role === 'user') {
      const el = U.html('<div class="msg msg-user" data-id="' + m.id + '"><div class="bubble"><div class="md"></div></div></div>');
      el.querySelector('.md').innerHTML = CM.md.render(m.content, { actions: true });
      return el;
    }
    const el = U.html(`
<div class="msg msg-assistant${isLast ? ' last' : ''}" data-id="${m.id}">
  <div class="msg-avatar">${CM.logo(32)}</div>
  <div class="msg-body">
    <div class="msg-meta"><b>CodeMentor</b>${sourceBadge(m)}<span class="faint">${esc(U.fmtTime(m.createdAt))}</span></div>
    <div class="md"></div>
    <div class="followups"></div>
    <div class="msg-actions">
      <button class="btn-icon" data-mact="copy" data-tip="Copy answer">${CM.icon('copy', 16)}</button>
      <button class="btn-icon" data-mact="save" data-tip="Save to snippets">${CM.icon('bookmark', 16)}</button>
      <button class="btn-icon ${m.feedback === 'up' ? 'voted' : ''}" data-mact="up" data-tip="Helpful">${CM.icon('thumbs-up', 16)}</button>
      <button class="btn-icon ${m.feedback === 'down' ? 'voted' : ''}" data-mact="down" data-tip="Not helpful">${CM.icon('thumbs-down', 16)}</button>
      <button class="btn-icon" data-mact="regen" data-tip="Regenerate">${CM.icon('refresh', 16)}</button>
    </div>
  </div>
</div>`);
    el.querySelector('.md').innerHTML = CM.md.render(m.content);
    renderFollowups(el, m, isLast);
    return el;
  }

  function renderFollowups(el, m, isLast) {
    const box = el.querySelector('.followups');
    box.innerHTML = '';
    const sug = (m.meta && m.meta.suggestions) || [];
    if (!isLast || !sug.length) { box.style.display = 'none'; return; }
    box.style.display = '';
    sug.forEach((s) => { const c = U.html('<button class="chip">' + CM.icon('sparkles', 14) + '<span>' + esc(s) + '</span></button>'); c.onclick = () => send(s); box.appendChild(c); });
  }

  const nearBottom = () => S.scroll.scrollHeight - S.scroll.scrollTop - S.scroll.clientHeight < 140;
  const toBottom = (force) => { if (force || nearBottom()) S.scroll.scrollTop = S.scroll.scrollHeight; };

  function typeOut(mdEl, content, done) {
    if (settings().typing === false || content.length > 14000 || matchMedia('(prefers-reduced-motion: reduce)').matches) { mdEl.innerHTML = CM.md.render(content); done(); return; }
    const total = content.length;
    const dur = Math.min(1500, 260 + total * 0.9);
    const start = performance.now();
    let last = 0, raf = 0, finished = false;
    const finish = () => { if (finished) return; finished = true; cancelAnimationFrame(raf); mdEl.innerHTML = CM.md.render(content); S.typing = null; done(); };
    S.typing = { finish };
    const step = (now) => {
      if (finished) return;
      const p = Math.min(1, (now - start) / dur);
      const n = Math.floor(total * (1 - Math.pow(1 - p, 2)));
      if (now - last > 40) { mdEl.innerHTML = CM.md.render(content.slice(0, n)); last = now; toBottom(); }
      if (p < 1) raf = requestAnimationFrame(step); else finish();
    };
    raf = requestAnimationFrame(step);
  }

  /* ---------------- sending ---------------- */
  function setBusy(b) {
    S.busy = b;
    S.send.classList.toggle('stop', b);
    S.send.innerHTML = b ? CM.icon('stop', 17) : CM.icon('arrow-up', 19);
    S.send.setAttribute('aria-label', b ? 'Stop' : 'Send');
    S.send.disabled = b ? false : !S.ta.value.trim();
  }

  function stop() {
    if (S.abort) S.abort.abort();
    if (S.typing) S.typing.finish();
  }

  async function ensureConv() {
    if (S.conv) return S.conv;
    S.conv = { id: U.uid('c_'), userId: A.user.id, title: 'New chat', createdAt: Date.now(), updatedAt: Date.now(), pinned: false, lang: null, tags: [], count: 0, preview: '', state: {} };
    await CM.data.saveConv(S.conv);
    CM.app.navigate('#/chat/' + S.conv.id, { silent: true });
    return S.conv;
  }

  async function getAnswer(text, depth, onToken, signal) {
    const user = A.user;
    const builtin = () => CM.brain.respond({ text, state: S.conv.state, user, depth, langPref: S.langPref });
    if (CM.llm.enabled(user)) {
      try {
        const ctx = CM.brain.contextFor(text, S.langPref);
        const hist = S.messages.slice(-9, -1).map((m) => ({ role: m.role, content: String(m.content).slice(0, 2500) }));
        const msgs = [{ role: 'system', content: CM.llm.systemPrompt(user, depth, S.langPref, ctx.context) }].concat(hist, [{ role: 'user', content: text }]);
        const full = await CM.llm.chat({ cfg: user.settings.llm, messages: msgs, onToken, signal });
        if (!full.trim()) throw new Error('empty response');
        const b = builtin();
        return { content: full, meta: Object.assign({}, b.meta, { source: 'llm', model: user.settings.llm.model }), streamed: true };
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        U.toast('Local AI unavailable (' + e.message + '). Answered with the built-in engine instead.', 'warn', 5000);
      }
    }
    await U.sleep(320 + Math.min(500, text.length));
    return builtin();
  }

  /** "What's wrong with my code?" with no code pasted → use the code currently in the Playground. */
  function attachPlaygroundCode(text) {
    const p = CM.brain.parse(text);
    if (p.code || p.errorText) return null;
    if (text.split(/\s+/).length > 30 || /\b(understanding|quiz|concept of)\b/i.test(text)) return null;
    const asksAboutCode = /\b(my|this|the|our) (code|program|script|function|solution|loop|logic)\b|\bwhat'?s wrong\b|\bwhat is wrong\b|\b(not|isn'?t|doesn'?t|won'?t|can'?t|cannot) (work|working|run|running|compile|compiling)\b|\b(fix|debug|check|review|correct|explain) (it|this|that|my)\b|\b(any|find|the|these) (errors?|bugs?|mistakes?|problems?|warnings?)\b|\bwhy (is|does|am|do|did)\b.*\b(error|wrong|fail|crash|not|stuck)/i;
    if (!asksAboutCode.test(text)) return null;
    // Inside an ongoing topic, "explain it" means the current topic, so only attach on an explicit reference.
    const st = (S.conv && S.conv.state) || {};
    const explicit = /\b(my|playground) (code|program|script|function|solution)\b|\bplayground\b/i.test(text);
    if ((st.topic || st.code) && !explicit) return null;
    if (Date.now() - U.store.get('cm.pg.updated', 0) > 24 * 3600 * 1000) return null;
    const lang = U.store.get('cm.pg.lang', 'python');
    const code = U.store.get('cm.pg.code.' + lang, '');
    if (!code || !code.trim()) return null;
    const last = U.store.get('cm.pg.lastRun', null);
    let out = text;
    if (last && last.lang === lang && last.code === code && last.stderr) out += '\n```text\n' + last.stderr + '\n```';
    out += '\n```' + lang + '\n' + code.replace(/\s+$/, '') + '\n```';
    return { text: out, lang, withError: !!(last && last.lang === lang && last.code === code && last.stderr) };
  }

  async function send(raw) {
    let text = CM.runner.stripAnsi(String(raw || '')).trim();
    if (!text || S.busy) return;
    const att = attachPlaygroundCode(text);
    if (att) { text = att.text; U.toast('Using your ' + U.langName(att.lang) + ' code from the Playground' + (att.withError ? ' (with its last error)' : ''), 'info', 3200); }
    if (S.typing) S.typing.finish();
    S.ta.value = ''; autosize();
    setBusy(true);
    const conv = await ensureConv();
    if (!S.messages.length) S.inner.innerHTML = '';
    // previous assistant message loses its follow-up chips
    const prevLast = S.inner.querySelector('.msg.last');
    if (prevLast) { prevLast.classList.remove('last'); const f = prevLast.querySelector('.followups'); if (f) f.style.display = 'none'; }

    const um = { id: U.uid('m_'), convId: conv.id, userId: A.user.id, role: 'user', content: text, createdAt: Date.now(), stateBefore: JSON.parse(JSON.stringify(conv.state || {})) };
    S.messages.push(um);
    await CM.data.saveMessage(um);
    S.inner.appendChild(msgEl(um));
    toBottom(true);

    const ctx = CM.brain.parse(text);
    const phrases = ctx.errorText ? THINKING.error : ctx.code ? THINKING.code : THINKING.other;
    const think = U.html('<div class="msg msg-assistant"><div class="msg-avatar">' + CM.logo(32) + '</div><div class="msg-body"><div class="thinking"><span class="dots"><i></i><i></i><i></i></span><span class="th-text">' + esc(phrases[0]) + '</span></div></div></div>');
    S.inner.appendChild(think);
    toBottom(true);
    let pi = 0;
    const rot = setInterval(() => { pi = (pi + 1) % phrases.length; const t = think.querySelector('.th-text'); if (t) t.textContent = phrases[pi]; }, 900);

    S.abort = new AbortController();
    const depth = S.getDepth();
    let res, streamEl = null;
    try {
      res = await getAnswer(text, depth, (partial) => {
        if (!streamEl) {
          clearInterval(rot);
          const tmp = { id: 'tmp', role: 'assistant', content: '', createdAt: Date.now(), meta: { source: 'llm', model: A.user.settings.llm.model } };
          streamEl = msgEl(tmp, true);
          think.replaceWith(streamEl);
        }
        streamEl.querySelector('.md').innerHTML = CM.md.render(partial);
        toBottom();
      }, S.abort.signal);
    } catch (e) {
      clearInterval(rot);
      think.remove(); if (streamEl) streamEl.remove();
      setBusy(false);
      if (e.name !== 'AbortError') U.toast('Something went wrong: ' + e.message, 'error');
      return;
    }
    clearInterval(rot);

    const am = { id: U.uid('m_'), convId: conv.id, userId: A.user.id, role: 'assistant', content: res.content, meta: stripMeta(res.meta), createdAt: Date.now() };
    S.messages.push(am);
    const el = msgEl(Object.assign({}, am, { content: '' }), true);
    el.querySelector('.followups').style.display = 'none';
    if (streamEl) streamEl.replaceWith(el); else think.replaceWith(el);
    const mdEl = el.querySelector('.md');
    const finalize = async () => {
      renderFollowups(el, am, true);
      toBottom();
      setBusy(false);
      S.ta.focus();
    };
    if (res.streamed) { mdEl.innerHTML = CM.md.render(res.content); finalize(); }
    else typeOut(mdEl, res.content, finalize);

    // persist conversation
    const meta = res.meta || {};
    conv.state = meta.state || conv.state || {};
    if (conv.title === 'New chat') conv.title = (meta.title && meta.title.trim()) || U.truncate(ctx.prose || text, 52) || 'New chat';
    if (meta.lang && !conv.lang) conv.lang = meta.lang;
    const tag = { error: 'error', debug: 'error', concept: 'concept', howto: 'howto', recipe: 'howto', review: 'review', explain: 'review', compare: 'compare', complexity: 'concept' }[meta.intent];
    if (tag && conv.tags.indexOf(tag) < 0) conv.tags.push(tag);
    conv.count = S.messages.length;
    conv.preview = U.truncate(text.replace(/```[\s\S]*?```/g, '[code]'), 120);
    conv.updatedAt = Date.now();
    await CM.data.saveMessage(am);
    await CM.data.saveConv(conv);
    updateHeader();
    CM.app.track({ intent: meta.intent, lang: meta.lang || conv.lang });
    CM.app.refreshSidebar();
  }

  function stripMeta(meta) {
    if (!meta) return {};
    const out = Object.assign({}, meta);
    delete out.state;
    return out;
  }

  /* ---------------- message actions ---------------- */
  async function onMsgAction(e) {
    const b = e.target.closest('[data-mact]');
    if (!b) return;
    const el = b.closest('.msg');
    const m = S.messages.find((x) => x.id === el.dataset.id);
    if (!m) return;
    const act = b.dataset.mact;
    if (act === 'copy') { await U.copy(m.content); U.toast('Answer copied', 'success', 1600); }
    if (act === 'save') {
      const title = await U.prompt({ title: 'Save to snippets', label: 'Title', value: (S.conv && S.conv.title) || 'Saved answer', icon: 'bookmark' });
      if (title == null) return;
      const code = (m.content.match(/```(\w+)?[^\n]*\n([\s\S]*?)```/) || []);
      await CM.data.saveSnippet({ title: title.trim() || 'Saved answer', content: m.content, lang: (m.meta && m.meta.lang) || code[1] || '', source: 'chat', convId: S.conv && S.conv.id });
      U.toast('Saved to snippets', 'success');
    }
    if (act === 'up' || act === 'down') {
      const prev = m.feedback;
      m.feedback = prev === act ? null : act;
      await CM.data.saveMessage(m);
      el.querySelector('[data-mact=up]').classList.toggle('voted', m.feedback === 'up');
      el.querySelector('[data-mact=down]').classList.toggle('voted', m.feedback === 'down');
      const st = A.user.stats;
      if (prev) st[prev] = Math.max(0, (st[prev] || 0) - 1);
      if (m.feedback) st[m.feedback] = (st[m.feedback] || 0) + 1;
      await A.save();
      if (m.feedback === 'down') U.toast('Thanks! Try “Regenerate → Simpler/Deeper”, or rephrase with more detail.', 'info', 4000);
      else if (m.feedback === 'up') U.toast('Glad it helped! 🎉', 'success', 1600);
    }
    if (act === 'regen') {
      U.menu(b, [
        { label: 'Explain simpler', icon: 'lightbulb', onClick: () => regenerate(m, el, 'simple') },
        { label: 'Balanced', icon: 'layers', onClick: () => regenerate(m, el, 'balanced') },
        { label: 'Go deeper', icon: 'sparkles', onClick: () => regenerate(m, el, 'deep') }
      ]);
    }
  }

  async function regenerate(m, el, depth) {
    if (S.busy) return;
    const idx = S.messages.indexOf(m);
    const userMsg = S.messages.slice(0, idx).reverse().find((x) => x.role === 'user');
    if (!userMsg) return;
    setBusy(true);
    const prevState = S.conv.state;
    const isLast = idx === S.messages.length - 1;
    S.conv.state = userMsg.stateBefore || {};
    let res;
    try { S.abort = new AbortController(); res = await getAnswer(userMsg.content, depth, null, S.abort.signal); }
    catch (e) { S.conv.state = prevState; setBusy(false); return; }
    m.content = res.content;
    m.meta = stripMeta(res.meta);
    S.conv.state = isLast ? (res.meta.state || prevState) : prevState;
    await CM.data.saveMessage(m);
    await CM.data.saveConv(S.conv);
    const fresh = msgEl(Object.assign({}, m, { content: '' }), isLast);
    el.replaceWith(fresh);
    typeOut(fresh.querySelector('.md'), m.content, () => { renderFollowups(fresh, m, isLast); setBusy(false); });
  }
})();
