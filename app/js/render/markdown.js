/* CodeMentor — safe Markdown renderer with code blocks, callouts, tabs, tables and spoilers.
   All input is HTML-escaped first, so user/LLM text can never inject markup. */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util;
  const esc = U.esc;
  const MD = (CM.md = {});

  const CALLOUT = {
    tip: ['lightbulb', 'Tip'], note: ['info', 'Note'], info: ['info', 'Info'], warning: ['alert', 'Watch out'],
    mistake: ['alert', 'Common mistake'], error: ['bug', 'Error'], concept: ['sparkles', 'The concept'],
    analogy: ['lightbulb', 'Think of it like this'], fix: ['wand', 'The fix'], success: ['check-circle', 'Looks good']
  };

  /* ---------------- inline ---------------- */
  function inline(src) {
    const codes = [];
    let s = String(src).replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_, ticks, c) => { codes.push(c.replace(/^ (.*) $/, '$1')); return '\u0000' + (codes.length - 1) + '\u0000'; });
    s = esc(s);
    // links: [text](url)
    s = s.replace(/\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (all, text, url) => {
      const raw = url.replace(/&amp;/g, '&');
      if (/^ask:/i.test(raw)) return '<a href="#" class="md-ask" data-ask="' + esc(raw.slice(4)) + '">' + CM.icon('arrow-right', 13) + text + '</a>';
      if (/^concept:/i.test(raw)) return '<a href="#/library/concept/' + esc(raw.slice(8)) + '" class="md-concept">' + text + '</a>';
      if (/^#/.test(raw)) return '<a href="' + esc(raw) + '">' + text + '</a>';
      if (/^(https?:|mailto:)/i.test(raw)) return '<a href="' + esc(raw) + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
      return text;
    });
    s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/(^|[^\w])_(?!\s)([^_\n]+?)_(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
    s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => '<code class="ic-code">' + esc(codes[+i]) + '</code>');
    return s;
  }
  MD.inline = inline;

  /* ---------------- blocks ---------------- */
  const RE_FENCE = /^(\s*)(`{3,}|~{3,})\s*([\w+#.-]*)\s*(.*)$/;
  const RE_LIST = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
  const RE_TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

  function isBlockStart(l, next) {
    return RE_FENCE.test(l) || /^#{1,6}\s/.test(l) || /^\s*>/.test(l) || RE_LIST.test(l) || /^:::/.test(l) ||
      /^\s*([-*_])(\s*\1){2,}\s*$/.test(l) || (/\|/.test(l) && next !== undefined && RE_TABLE_SEP.test(next));
  }
  const indentOf = (l) => (l.match(/^\s*/) || [''])[0].replace(/\t/g, '    ').length;

  function blocks(lines, opts) {
    let html = '';
    let i = 0;
    const n = lines.length;
    while (i < n) {
      const line = lines[i];
      let m = line.match(RE_FENCE);
      if (m) {
        const indent = m[1].length, fence = m[2], lang = m[3], meta = m[4] || '';
        const close = new RegExp('^\\s*' + (fence[0] === '`' ? '`' : '~') + '{' + fence.length + ',}\\s*$');
        const buf = []; i++;
        while (i < n && !close.test(lines[i])) { buf.push(indent ? lines[i].replace(new RegExp('^ {0,' + indent + '}'), '') : lines[i]); i++; }
        i++;
        html += codeBlock(buf.join('\n'), lang, meta, opts);
        continue;
      }
      m = line.match(/^:::\s*([\w-]+)\s*(.*)$/);
      if (m) {
        const kind = m[1], arg = m[2]; const buf = []; i++;
        let depth = 0, inFence = false;
        while (i < n) {
          const l = lines[i];
          if (RE_FENCE.test(l)) inFence = !inFence;
          if (!inFence) {
            if (/^:::\s*[\w-]+/.test(l)) depth++;
            else if (/^:::\s*$/.test(l)) { if (depth === 0) break; depth--; }
          }
          buf.push(l); i++;
        }
        i++;
        html += container(kind, arg, buf, opts);
        continue;
      }
      if (/^\s*$/.test(line)) { i++; continue; }
      m = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
      if (m) { const lv = m[1].length; html += '<h' + lv + '>' + inline(m[2]) + '</h' + lv + '>'; i++; continue; }
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { html += '<hr>'; i++; continue; }
      if (/^\s*>/.test(line)) {
        const buf = [];
        while (i < n && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        html += quote(buf, opts);
        continue;
      }
      if (/\|/.test(line) && i + 1 < n && RE_TABLE_SEP.test(lines[i + 1])) {
        const head = splitRow(line);
        const aligns = splitRow(lines[i + 1]).map((c) => /^:-+:$/.test(c.trim()) ? 'center' : /-+:$/.test(c.trim()) ? 'right' : '');
        i += 2;
        const rows = [];
        while (i < n && /\|/.test(lines[i]) && !/^\s*$/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        html += '<div class="table-wrap"><table><thead><tr>' + head.map((c, k) => '<th' + (aligns[k] ? ' style="text-align:' + aligns[k] + '"' : '') + '>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>' +
          rows.map((r) => '<tr>' + head.map((_, k) => '<td' + (aligns[k] ? ' style="text-align:' + aligns[k] + '"' : '') + '>' + inline(r[k] || '') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
        continue;
      }
      if (RE_LIST.test(line)) { const r = list(lines, i, opts); html += r.html; i = r.next; continue; }
      const buf = [line]; i++;
      while (i < n && !/^\s*$/.test(lines[i]) && !isBlockStart(lines[i], lines[i + 1])) { buf.push(lines[i]); i++; }
      html += '<p>' + buf.map((b) => inline(b.trim())).join('<br>') + '</p>';
    }
    return html;
  }

  function splitRow(line) {
    let s = line.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
    const cells = []; let cur = '', inCode = false;
    for (let k = 0; k < s.length; k++) {
      const ch = s[k];
      if (ch === '`') inCode = !inCode;
      if (ch === '\\' && s[k + 1] === '|') { cur += '|'; k++; continue; }
      if (ch === '|' && !inCode) { cells.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }

  function list(lines, start, opts) {
    const first = lines[start].match(RE_LIST);
    const base = indentOf(first[1]);
    const ordered = /\d/.test(first[2]);
    const startNum = ordered ? parseInt(first[2], 10) : 1;
    const items = [];
    let i = start, cur = null;
    while (i < lines.length) {
      const l = lines[i];
      const m = l.match(RE_LIST);
      const ind = indentOf(l);
      if (m && ind === base && /\d/.test(m[2]) === ordered) { cur = { lines: [m[3]] }; items.push(cur); i++; continue; }
      if (m && ind < base) break;
      if (/^\s*$/.test(l)) {
        const nx = lines[i + 1];
        if (nx !== undefined && !/^\s*$/.test(nx) && (indentOf(nx) > base || (RE_LIST.test(nx) && indentOf(nx) === base && /\d/.test(nx.match(RE_LIST)[2]) === ordered))) { if (cur) cur.lines.push(''); i++; continue; }
        break;
      }
      if (ind > base && cur) { cur.lines.push(l.slice(Math.min(ind, base + 2))); i++; continue; }
      if (m) break;
      if (cur && !isBlockStart(l, lines[i + 1])) { cur.lines.push(l); i++; continue; }
      break;
    }
    const tag = ordered ? 'ol' : 'ul';
    let html = '<' + tag + (ordered && startNum !== 1 ? ' start="' + startNum + '"' : '') + '>';
    items.forEach((it) => {
      let firstLine = it.lines[0];
      let cls = '';
      const task = firstLine.match(/^\[( |x|X)\]\s+(.*)$/);
      if (task) { cls = ' class="task"'; firstLine = '<input type="checkbox" disabled' + (task[1] !== ' ' ? ' checked' : '') + '>' + '\u0001' + task[2]; }
      let inner = task ? firstLine.split('\u0001')[0] + inline(firstLine.split('\u0001')[1]) : inline(firstLine);
      const rest = it.lines.slice(1);
      // Lazy paragraph continuation lines (not blocks) join the first line.
      let k = 0;
      while (k < rest.length && rest[k].trim() && !isBlockStart(rest[k], rest[k + 1])) { inner += '<br>' + inline(rest[k].trim()); k++; }
      const tail = rest.slice(k);
      if (tail.some((r) => r.trim())) inner += blocks(tail, opts);
      html += '<li' + cls + '>' + inner + '</li>';
    });
    return { html: html + '</' + tag + '>', next: i };
  }

  function quote(buf, opts) {
    const m = buf[0] && buf[0].match(/^\[!(\w+)\]\s*(.*)$/);
    if (m) {
      const kind = m[1].toLowerCase();
      const def = CALLOUT[kind] || CALLOUT.note;
      const title = m[2] || def[1];
      return '<div class="callout callout-' + esc(kind) + '"><div class="callout-title">' + CM.icon(def[0], 16) + '<span>' + inline(title) + '</span></div><div class="callout-body">' + blocks(buf.slice(1), opts) + '</div></div>';
    }
    return '<blockquote>' + blocks(buf, opts) + '</blockquote>';
  }

  function container(kind, arg, buf, opts) {
    if (kind === 'codetabs') {
      const tabs = [];
      let i = 0;
      while (i < buf.length) {
        const m = buf[i].match(RE_FENCE);
        if (m) {
          const fence = m[2]; const close = new RegExp('^\\s*' + (fence[0] === '`' ? '`' : '~') + '{' + fence.length + ',}\\s*$');
          const code = []; i++;
          while (i < buf.length && !close.test(buf[i])) { code.push(buf[i]); i++; }
          tabs.push({ lang: m[3], meta: m[4] || '', code: code.join('\n') });
        }
        i++;
      }
      if (!tabs.length) return '';
      if (tabs.length === 1) return codeBlock(tabs[0].code, tabs[0].lang, tabs[0].meta, opts);
      const gid = U.uid('ct');
      return '<div class="codetabs" data-group="' + gid + '"><div class="ct-tabs">' +
        tabs.map((t, k) => '<button class="ct-tab' + (k === 0 ? ' on' : '') + '" data-tab="' + k + '">' + esc(CM.hl.label(t.lang)) + '</button>').join('') + '</div>' +
        tabs.map((t, k) => '<div class="ct-pane' + (k === 0 ? ' on' : '') + '" data-pane="' + k + '">' + codeBlock(t.code, t.lang, t.meta, opts) + '</div>').join('') + '</div>';
    }
    if (kind === 'spoiler') {
      return '<details class="spoiler"><summary>' + inline(arg || 'Show answer') + '</summary><div>' + blocks(buf, opts) + '</div></details>';
    }
    if (CALLOUT[kind]) return quote(['[!' + kind + '] ' + arg].concat(buf), opts);
    return blocks(buf, opts);
  }

  function codeBlock(code, lang, meta, opts) {
    opts = opts || {};
    const L = CM.hl.normalize(lang);
    const isBad = /\b(bad|wrong|before|broken|error)\b/i.test(meta);
    const isGood = /\b(good|fixed|after|correct)\b/i.test(meta);
    const titleM = meta.match(/title="([^"]+)"/);
    const hlLines = new Set();
    const hm = meta.match(/\{([\d,\s-]+)\}/);
    if (hm) hm[1].split(',').forEach((p) => { const [a, b] = p.split('-').map((x) => parseInt(x, 10)); for (let k = a; k <= (b || a); k++) hlLines.add(k); });
    code = code.replace(/\s+$/, '');
    let hl = CM.hl.highlight(code, L);
    if (hlLines.size) hl = hl.split('\n').map((ln, k) => hlLines.has(k + 1) ? '<span class="t-hl-line">' + (ln || ' ') + '</span>' : ln).join('\n');
    const lines = code.split('\n').length;
    const gutter = lines >= 3 && opts.gutter !== false ? '<pre class="cb-gutter" aria-hidden="true">' + Array.from({ length: lines }, (_, k) => '<span>' + (k + 1) + '</span>').join('') + '</pre>' : '';
    const canRun = opts.actions !== false && CM.runner && CM.runner.canRunInline(L);
    const tag = isBad ? '<span class="cb-tag">Before</span>' : isGood ? '<span class="cb-tag">After</span>' : '';
    const actions = opts.actions === false ? '' :
      (canRun ? '<button class="cb-btn" data-cb="run" title="Run this code">' + CM.icon('play', 12) + 'Run</button>' : '') +
      (L !== 'text' && L !== 'bash' && L !== 'diff' ? '<button class="cb-btn" data-cb="playground" title="Open in Playground">' + CM.icon('terminal', 13) + 'Playground</button>' : '') +
      '<button class="cb-btn" data-cb="copy" title="Copy code">' + CM.icon('copy', 13) + 'Copy</button>';
    return '<div class="codeblock' + (isBad ? ' cb-bad' : isGood ? ' cb-good' : '') + '" data-lang="' + esc(L) + '">' +
      '<div class="cb-head"><span class="cb-lang">' + esc(titleM ? titleM[1] : CM.hl.label(L)) + tag + '</span><div class="cb-actions">' + actions + '</div></div>' +
      '<div class="cb-body">' + gutter + '<pre class="cb-pre"><code>' + hl + '</code></pre></div>' +
      '<div class="cb-output" hidden></div></div>';
  }
  MD.codeBlock = codeBlock;

  MD.render = (src, opts) => blocks(String(src || '').replace(/\r\n?/g, '\n').split('\n'), opts || {});

  /** Wires up interactive bits (copy, run, tabs, ask-links) inside a container. Call once per container. */
  MD.bind = (root, handlers) => {
    handlers = handlers || {};
    root.addEventListener('click', async (e) => {
      const tab = e.target.closest('.ct-tab');
      if (tab) {
        const g = tab.closest('.codetabs');
        g.querySelectorAll('.ct-tab').forEach((t) => t.classList.toggle('on', t === tab));
        g.querySelectorAll('.ct-pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === tab.dataset.tab));
        return;
      }
      const ask = e.target.closest('.md-ask');
      if (ask) { e.preventDefault(); let q = ask.dataset.ask; try { q = decodeURIComponent(q); } catch (_) { /* keep raw */ } if (handlers.ask) handlers.ask(q); return; }
      const btn = e.target.closest('.cb-btn');
      if (!btn) return;
      const block = btn.closest('.codeblock');
      const code = block.querySelector('.cb-pre code').textContent;
      const lang = block.dataset.lang;
      const act = btn.dataset.cb;
      if (act === 'copy') {
        const ok = await U.copy(code);
        btn.classList.add('ok'); btn.innerHTML = CM.icon('check', 13) + (ok ? 'Copied' : 'Failed');
        setTimeout(() => { btn.classList.remove('ok'); btn.innerHTML = CM.icon('copy', 13) + 'Copy'; }, 1600);
      } else if (act === 'playground') {
        if (handlers.playground) handlers.playground(code, lang);
      } else if (act === 'run') {
        const out = block.querySelector('.cb-output');
        let stdin = '';
        if (/\binput\s*\(|\bscanf\s*\(|\bScanner\b|\bcin\s*>>|\bprompt\s*\(|\bgetline\s*\(|\bfgets\s*\(.*stdin|\breadline\b/.test(code)) {
          stdin = await U.prompt({ title: 'This program reads input', label: 'Type the input it should receive, one value per line:', multiline: true, confirmLabel: 'Run', icon: 'keyboard' });
          if (stdin == null) return;
        }
        out.hidden = false;
        out.innerHTML = '<div class="out-head"><span class="spinner"></span> Running…</div>';
        btn.disabled = true;
        try {
          const r = await CM.runner.run(lang, code, stdin);
          out.innerHTML = CM.runner.formatOutput(r);
        } catch (err) {
          out.innerHTML = '<div class="out-head">Output</div><span class="out-err">' + esc(err.message || String(err)) + '</span>';
        } finally { btn.disabled = false; }
      }
    });
  };
})();
