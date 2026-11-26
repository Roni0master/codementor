/* CodeMentor — lightweight code editor (textarea + highlighted overlay, line numbers, smart indent) */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util;

  CM.Editor = function (opts) {
    opts = opts || {};
    let lang = opts.lang || 'python';
    const el = U.html('<div class="editor' + (opts.compact ? ' compact' : '') + '"><div class="editor-gutter" aria-hidden="true"></div><div class="editor-area"><pre aria-hidden="true"><code></code></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Code editor"></textarea></div></div>');
    const ta = el.querySelector('textarea');
    const pre = el.querySelector('pre');
    const code = el.querySelector('code');
    const gutter = el.querySelector('.editor-gutter');
    let marks = {};
    const listeners = [];
    if (opts.placeholder) ta.placeholder = opts.placeholder;

    function render() {
      const v = ta.value;
      code.innerHTML = CM.hl.highlight(v, lang) + '\n';
      const n = v.split('\n').length;
      let g = '';
      for (let i = 1; i <= n; i++) g += '<span' + (marks[i] ? ' class="' + marks[i] + '"' : '') + '>' + i + '</span>';
      gutter.innerHTML = g;
      sync();
    }
    function sync() { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gutter.scrollTop = ta.scrollTop; }
    const changed = () => { render(); listeners.forEach((f) => f(ta.value)); };

    ta.addEventListener('input', changed);
    ta.addEventListener('scroll', sync);
    ta.addEventListener('keydown', (e) => {
      const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
      const unit = lang === 'python' || lang === 'java' || lang === 'c' || lang === 'cpp' ? '    ' : '  ';
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (opts.onRun) opts.onRun(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const cm = lang === 'python' || lang === 'bash' ? '# ' : lang === 'sql' ? '-- ' : '// ';
        const ls = v.lastIndexOf('\n', s - 1) + 1;
        let le = v.indexOf('\n', en); if (le < 0) le = v.length;
        const block = v.slice(ls, le).split('\n');
        const all = block.every((l) => !l.trim() || l.trimStart().startsWith(cm.trim()));
        const next = block.map((l) => (all ? l.replace(new RegExp('^(\\s*)' + cm.trim().replace(/[/#-]/g, '\\$&') + ' ?'), '$1') : (l.trim() ? l.replace(/^(\s*)/, '$1' + cm) : l))).join('\n');
        ta.setRangeText(next, ls, le, 'select');
        changed();
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (s !== en || e.shiftKey) {
          const ls = v.lastIndexOf('\n', s - 1) + 1;
          const block = v.slice(ls, en);
          const next = e.shiftKey ? block.replace(/^( {1,4}|\t)/gm, '') : block.replace(/^/gm, unit);
          ta.setRangeText(next, ls, en, 'select');
        } else ta.setRangeText(unit, s, en, 'end');
        changed();
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const ls = v.lastIndexOf('\n', s - 1) + 1;
        const line = v.slice(ls, s);
        let indent = (line.match(/^[ \t]*/) || [''])[0];
        const before = v[s - 1], after = v[s];
        if (/[:{[(]\s*$/.test(line)) indent += unit;
        if ((before === '{' && after === '}') || (before === '(' && after === ')') || (before === '[' && after === ']')) {
          const base = indent.slice(0, Math.max(0, indent.length - unit.length));
          ta.setRangeText('\n' + indent + '\n' + base, s, en, 'start');
          ta.selectionStart = ta.selectionEnd = s + 1 + indent.length;
        } else ta.setRangeText('\n' + indent, s, en, 'end');
        changed();
        return;
      }
      const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
      if (pairs[e.key] && s === en && !e.ctrlKey && !e.metaKey) {
        const nx = v[s];
        if ((e.key === '"' || e.key === "'") && (/\w/.test(v[s - 1] || '') || nx === e.key)) {
          if (nx === e.key) { e.preventDefault(); ta.selectionStart = ta.selectionEnd = s + 1; }
          return;
        }
        if (!nx || /[\s)\]};,]/.test(nx)) { e.preventDefault(); ta.setRangeText(e.key + pairs[e.key], s, en, 'start'); ta.selectionStart = ta.selectionEnd = s + 1; changed(); }
        return;
      }
      if ((e.key === ')' || e.key === ']' || e.key === '}') && v[s] === e.key && s === en) { e.preventDefault(); ta.selectionStart = ta.selectionEnd = s + 1; return; }
      if (e.key === 'Backspace' && s === en && s > 0) {
        const pairOpen = v[s - 1], pairClose = v[s];
        if (pairs[pairOpen] && pairs[pairOpen] === pairClose) { e.preventDefault(); ta.setRangeText('', s - 1, s + 1, 'end'); changed(); }
      }
    });

    render();
    return {
      el, textarea: ta,
      getValue: () => ta.value,
      setValue(v) { ta.value = v || ''; render(); },
      setLang(l) { lang = CM.hl.normalize(l); render(); },
      getLang: () => lang,
      onChange(fn) { listeners.push(fn); },
      focus() { ta.focus(); },
      mark(m) { marks = m || {}; render(); },
      goToLine(n) {
        const lines = ta.value.split('\n');
        let pos = 0; for (let i = 0; i < Math.min(n - 1, lines.length); i++) pos += lines[i].length + 1;
        ta.focus(); ta.setSelectionRange(pos, pos + (lines[n - 1] || '').length);
        const lh = parseFloat(getComputedStyle(ta).lineHeight) || 21;
        ta.scrollTop = Math.max(0, (n - 4) * lh);
        sync();
      }
    };
  };

  /** Modal with an editor for composing a code snippet. Resolves with {code, lang} or null. */
  CM.codeModal = function (initial) {
    initial = initial || {};
    return new Promise((resolve) => {
      const body = U.html('<div class="stack"><div class="row"><select class="select" style="width:auto"></select><span class="faint" style="font-size:12.5px">Paste or type your code. Press Ctrl+Enter to insert.</span></div><div class="cm-editor-host" style="height:340px;border-radius:12px;overflow:hidden;border:1px solid var(--border)"></div></div>');
      const sel = body.querySelector('select');
      U.LANGS.forEach((l) => sel.appendChild(new Option(l.name, l.id)));
      sel.value = initial.lang || 'python';
      let result = null;
      const ed = CM.Editor({ lang: sel.value, placeholder: 'Paste your code here…', onRun: () => { const b = m.el.querySelector('.btn-primary'); if (b) b.click(); } });
      ed.el.style.height = '100%';
      body.querySelector('.cm-editor-host').appendChild(ed.el);
      ed.setValue(initial.code || '');
      ed.onChange((v) => { if (sel.dataset.touched) return; const d = CM.analyzer.detectLanguage(v); if (d.lang && U.LANGS.some((l) => l.id === d.lang)) sel.value = d.lang; ed.setLang(sel.value); });
      sel.onchange = () => { sel.dataset.touched = '1'; ed.setLang(sel.value); };
      const m = U.modal({
        title: 'Insert code', icon: 'braces', size: 'lg', body,
        actions: [{ label: 'Cancel' }, { label: 'Insert code', kind: 'primary', icon: 'check', onClick: () => { const c = ed.getValue(); if (!c.trim()) { U.toast('The editor is empty', 'warn'); return false; } result = { code: c, lang: sel.value }; } }],
        onClose: () => resolve(result)
      });
      setTimeout(() => ed.focus(), 60);
    });
  };
})();
