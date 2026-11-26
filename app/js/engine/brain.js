/* CodeMentor — the offline answer engine ("brain").
   Parses a message into prose / code / error text, classifies intent, routes to a handler,
   and renders a structured markdown answer tuned to the student's level and chosen depth. */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, KB = CM.kb, S = CM.search, AN = CM.analyzer;
  const B = (CM.brain = {});

  /* ------------------------------------------------------------------ */
  /* small helpers                                                       */
  /* ------------------------------------------------------------------ */
  const LANG_ORDER = ['python', 'javascript', 'java', 'cpp', 'c', 'typescript', 'csharp', 'sql', 'bash', 'html'];
  const LANG_WORDS = [
    ['typescript', /\b(typescript|\.ts)\b/i],
    ['javascript', /\b(javascript|js|node\.?js|nodejs|react|jsx|es6)\b/i],
    ['python', /\b(python3?|py)\b/i],
    ['java', /\bjava\b/i],
    ['cpp', /c\+\+|\bcpp\b/i],
    ['csharp', /c#|\bcsharp\b/i],
    ['c', /\b(in|using|with|for|into|language|program|code|of)\s+c\b(?![+#]|\s*\+)|^c\b(?![+#])|\bc\s+(language|program|code|programming)\b|\bansi c\b/i],
    ['sql', /\b(sql|mysql|postgres(ql)?|sqlite)\b/i]
  ];
  const langMention = (t) => { for (const [l, re] of LANG_WORDS) if (re.test(t)) return l; return null; };
  const ask = KB.ask;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const firstName = (user) => { const n = (user && (user.profile.fullName || user.displayName)) || ''; return n.trim().split(/\s+/)[0] || ''; };

  function fence(code, lang, meta) {
    const f = /```/.test(code) ? '~~~' : '```';
    return f + (lang || '') + (meta ? ' ' + meta : '') + '\n' + String(code).replace(/\s+$/, '') + '\n' + f;
  }

  /** Converts «x» to `x` outside code fences. */
  function finalize(md) {
    const parts = md.split(/(^(?:```|~~~)[^\n]*\n[\s\S]*?^(?:```|~~~)\s*$)/m);
    return parts.map((p, i) => (i % 2 ? p : p.replace(/[«»]/g, '`'))).join('').replace(/\n{3,}/g, '\n\n').trim();
  }

  function pickCode(code, lang, fallbackLang) {
    if (!code) return [null, null];
    const order = [lang, fallbackLang].concat(LANG_ORDER).filter(Boolean);
    for (const l of order) if (code[l]) return [l, code[l]];
    const k = Object.keys(code)[0];
    return [k, code[k]];
  }

  function otherTabs(code, except) {
    const keys = Object.keys(code || {}).filter((k) => k !== except);
    if (!keys.length) return '';
    return ':::codetabs\n' + keys.map((k) => fence(code[k], k)).join('\n') + '\n:::';
  }

  function resolveRelated(ids) {
    return (ids || []).map((id) => {
      if (/^compare:/.test(id)) { const c = KB.get('compares', id.slice(8)); return c && { label: c.title.replace(/[«»`]/g, ''), q: c.title.replace(/[«»`]/g, '') }; }
      const c = KB.concept(id); if (c) return { label: c.title, q: 'Explain ' + c.title };
      const r = KB.get('recipes', id); if (r) return { label: r.title, q: r.title };
      return null;
    }).filter(Boolean);
  }
  const relatedLine = (ids) => { const r = resolveRelated(ids).slice(0, 5); return r.length ? '**Related:** ' + r.map((x) => ask(x.label, x.q)).join(' ') : ''; };

  function firstSection(md) {
    const idx = md.search(/\n#{2,4}\s/);
    return idx > 0 ? md.slice(0, idx).trim() : md.trim();
  }

  /* ------------------------------------------------------------------ */
  /* parsing the message                                                 */
  /* ------------------------------------------------------------------ */
  const ERR_RE = /(Traceback \(most recent call last\)|^\s*File ".+", line \d+|\b[A-Z][A-Za-z]*(Error|Exception)\b\s*(:|$)|^\s*at [\w$.<>]+ ?\(.+:\d+(:\d+)?\)|^\s+at .+:\d+:\d+|Exception in thread|\berror(\[\w+\])?:|\.\w+:\d+(:\d+)?:\s*(fatal )?(warning|error|note):|\bwarning:|\b(error|warning) [A-Z]+\d+:|Segmentation fault|segfault|undefined reference|is not recognized as|command not found|npm ERR!|^fatal:|Uncaught |\[rejected\]|CONFLICT \(|core dumped|stack smashing|double free|EADDRINUSE|Cannot find module|Module not found|ld returned|Process finished with exit code [1-9]|exited with code [1-9]|NullPointerException|IndexOutOfBounds)/m;

  function looksLikeCodeLine(l) {
    const t = l.trim();
    if (!t) return false;
    // an English sentence that merely quotes code ("the problem is scanf(...) but…") is prose, not code
    const words = t.split(/\s+/);
    const english = (t.replace(/"[^"]*"|'[^']*'/g, ' ').match(/\b(the|a|is|are|was|this|that|but|my|why|what|how|it|its|found|find|problem|probleme|issue|wrong|please|help|in|of|and|not|does|did|code|getting|gets|shows?|says?|should|instead|main|something|somthing|else|error)\b/gi) || []).length;
    if (words.length >= 7 && english >= 4 && !/^(#|def |class |import |from |public |private |static |int |void |char |float |double |for\s*\(|while\s*\(|if\s*\(|return\b|\/\/|\/\*)/.test(t)) return false;
    if (/^(def |class |import |from \S+ import|#include|#define|public |private |protected |static |using namespace|package )/.test(t)) return true;
    if (/^(if|elif|else|for|while|switch|try|except|catch|finally|return|const|let|var|function|int|void|double|float|char|bool|boolean|String|long|auto)\b/.test(t) && /[(){};:=]/.test(t)) return true;
    if (/(print|console\.log|System\.out\.print\w*|printf|scanf|cout|cin|input)\s*(\(|<<|>>)/.test(t)) return true;
    if (/[;{}]\s*$/.test(t) && !/[.?!]\s*$/.test(t)) return true;
    if (/^[\w.\[\]]+\s*([+\-*/%]|\/\/)?=\s*[^=\s].*$/.test(t) && t.split(/\s+/).length <= 8 && !/\b(i|my|is|the|why|how)\b/i.test(t)) return true;
    if (/^\w[\w.]*\(.*\)\s*;?$/.test(t) && t.split(/\s+/).length <= 6) return true;
    if (/^[)\]}]+[;,)]*$/.test(t)) return true;
    return false;
  }

  // Lines that are unmistakably error output (not code that merely mentions an error name).
  const STRONG_ERR = /^(Traceback \(most recent call last\)|File ".+", line \d+|[\w.$]*(Error|Exception|Warning)\b(:\s.*|:?\s*$)|Exception in thread|at [\w$.<>]+ ?\(.*:\d+|[^\s:]+\.\w+:\d+(:\d+)?:\s*(fatal\s+)?(error|warning|note)\b|Uncaught\b|npm ERR!|fatal:|Segmentation fault|(error|warning)(\[\w+\])?:\s)/;
  function isErrorLine(l) {
    if (!ERR_RE.test(l)) return false;
    const t = l.trim();
    // code like `except ValueError:` or `println("error: …")` is code, not an error message
    if (looksLikeCodeLine(l) && !STRONG_ERR.test(t)) return false;
    return true;
  }
  const ANALYZABLE = new Set(['python', 'javascript', 'typescript', 'java', 'c', 'cpp', 'csharp', 'sql', 'html', 'css', 'go', 'rust', 'php', 'ruby']);

  B.parse = function (text) {
    // strip terminal colour codes (Python 3.13+, gcc, npm) that come along with pasted error output
    const raw = String(text || '').replace(/\r\n?/g, '\n').replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '').replace(/\u001b\][^\u0007]*\u0007/g, '');
    const fences = [];
    let prose = raw.replace(/(```|~~~)[ \t]*([\w+#.-]*)[^\n]*\n([\s\S]*?)(\1|$)/g, (_, f, lang, code) => { fences.push({ lang: lang.toLowerCase(), code: code.replace(/\n$/, '') }); return '\n'; });
    let code = '', codeLang = null, errorText = '';
    fences.forEach((f) => {
      const errLines = f.code.split('\n').filter(isErrorLine).length;
      const codeLines = f.code.split('\n').filter(looksLikeCodeLine).length;
      if ((errLines && errLines >= codeLines) || /^(text|error|console|output|log|bash|shell|sh|powershell|cmd)$/.test(f.lang) && errLines) errorText += f.code + '\n';
      else { code += (code ? '\n\n' : '') + f.code; if (!codeLang && f.lang) codeLang = CM.hl.normalize(f.lang); }
    });
    // Unfenced content: separate code-like lines and error lines from prose.
    const lines = prose.split('\n');
    const kept = [], codeBuf = [], errBuf = [];
    let inTrace = false, inErr = false;
    lines.forEach((l, i) => {
      const t = l.trim();
      if (/Traceback \(most recent call last\)/.test(l)) inTrace = true;
      if (inTrace) { errBuf.push(l); if (/^\w*(Error|Exception|Exit|Interrupt)\b.*$/.test(t)) inTrace = false; return; }
      const prosey = /^(i|i'm|im|i am|my|we|you|it|this|that|please|why|how|what|getting|got|having|when|so|but|and|can|could|hey|hi|help)\b/i.test(t) && !/^\w*(Error|Exception)\b/.test(t);
      if (isErrorLine(l) && !prosey && (!/[?]\s*$/.test(t) || /Error:|Exception/.test(t)) && !(t.split(/\s+/).length > 14 && !/:/.test(t))) { errBuf.push(l); inErr = true; return; }
      // compiler detail lines that belong to the error above (symbol:, location:, ^ markers, indented "at" frames)
      if (inErr && t && (/^\s*\^[\s^~]*$/.test(l) || /^\s*(symbol|location|required|found|reason|note|caused by)\s*:/i.test(t) || (/^\s+\S/.test(l) && !looksLikeCodeLine(l)))) { errBuf.push(l); return; }
      inErr = false;
      if (!fences.length && looksLikeCodeLine(l)) { codeBuf.push({ i, l }); return; }
      if (!fences.length && codeBuf.length && /^\s{2,}\S/.test(l) && codeBuf[codeBuf.length - 1].i === i - 1) { codeBuf.push({ i, l }); return; }
      kept.push(l);
    });
    if (codeBuf.length >= 2 || (codeBuf.length === 1 && /[;{}]|^\s*(def|class|for|while|if)\b.*:\s*$/.test(codeBuf[0].l) && !kept.join(' ').trim())) {
      // take the span from first to last code line (include blank/indented lines between)
      const first = codeBuf[0].i, last = codeBuf[codeBuf.length - 1].i;
      const span = lines.slice(first, last + 1).filter((l) => !isErrorLine(l));
      code += (code ? '\n\n' : '') + span.join('\n');
      prose = lines.filter((_, i) => i < first || i > last).filter((l) => !errBuf.includes(l)).join('\n');
    } else {
      prose = kept.concat(codeBuf.map((c) => c.l)).join('\n');
    }
    if (errBuf.length) errorText += errBuf.join('\n');
    // a lone error line the user typed as the whole question
    if (!errorText && !code && ERR_RE.test(prose) && /(Error|Exception)\b/.test(prose)) errorText = prose;
    return { raw, prose: prose.trim(), code: code.trim() ? code.replace(/^\n+|\s+$/g, '') : '', codeLang, errorText: errorText.trim() };
  };

  function errorLang(err) {
    if (!err) return null;
    if (/Traceback|File ".*\.py"|\b(NameError|IndentationError|TabError|KeyError|AttributeError|ModuleNotFoundError|ZeroDivisionError|UnboundLocalError|RecursionError|ValueError: invalid literal)\b/.test(err)) return 'python';
    if (/Exception in thread|java\.\w+\.|\.java:\d+|NullPointerException|cannot find symbol|InputMismatchException|NumberFormatException/.test(err)) return 'java';
    if (/\.cpp:\d+|std::|cout|cin|no match for .?operator|was not declared in this scope|g\+\+/.test(err)) return 'cpp';
    if (/\.c:\d+|Segmentation fault|implicit declaration|undefined reference|gcc|stack smashing|core dumped|format '%/.test(err)) return 'c';
    if (/\.(js|jsx|ts|mjs):\d+|Uncaught|ReferenceError|Cannot read propert|is not a function|node_modules|npm ERR|React|Promise/.test(err)) return 'javascript';
    if (/\bSQL\b|syntax error at or near|Unknown column|constraint failed/i.test(err)) return 'sql';
    return null;
  }

  function errorLine(err) {
    if (!err) return null;
    let m, list;
    list = [...err.matchAll(/File "([^"]+)", line (\d+)/g)].filter((x) => !/site-packages|[\\/]lib[\\/]python|<frozen/.test(x[1]));
    if (list.length) return +list[list.length - 1][2];
    if ((m = err.match(/[\w./\\-]+\.(?:c|cpp|cc|h|hpp):(\d+)(?::\d+)?:\s*(?:fatal\s+)?error/))) return +m[1];
    if ((m = err.match(/\w+\.java:(\d+):\s*error/))) return +m[1];
    if ((m = err.match(/\(\w+\.java:(\d+)\)/))) return +m[1];
    if ((m = err.match(/(?:\(|\s|^)(?:[^\s()]*[\\/])?[\w.-]+\.(?:js|jsx|ts|tsx|mjs|cjs):(\d+)(?::\d+)?/m)) && !/node_modules|node:internal/.test(m[0])) return +m[1];
    if ((m = err.match(/\bline (\d+)\b/i))) return +m[1];
    return null;
  }

  const PRIORITY = { 'js-map-not-function': 3, 'react-key': 2, 'react-rerenders': 2, 'py-syntax-colon': 2, 'py-unterminated-string': 2, 'py-never-closed': 2, 'git-auth': 2, 'java-input-mismatch': 1, 'js-nan': -4, 'tool-pip-externally': -2, 'py-keyerror': -1, 'java-npe': 0, 'npm-eresolve': -1 };
  B.matchErrors = function (text, lang) {
    const out = [];
    if (!text) return out;
    for (const e of KB.errors) {
      for (const re of e.re) {
        const m = text.match(re);
        if (!m) continue;
        let score = 10 + Math.min(8, m[0].length / 8) + (PRIORITY[e.id] || 0);
        if (lang && e.lang === lang) score += 3;
        else if (lang && e.lang && e.lang !== 'bash' && !(lang === 'cpp' && e.lang === 'c') && !(lang === 'c' && e.lang === 'cpp') && !(lang === 'typescript' && e.lang === 'javascript')) score -= 3;
        out.push({ e, m, score });
        break;
      }
    }
    return out.sort((a, b) => b.score - a.score);
  };

  /* ------------------------------------------------------------------ */
  /* renderers                                                           */
  /* ------------------------------------------------------------------ */
  function renderConcept(c, o) {
    const parts = [];
    const beginner = o.level === 'beginner';
    parts.push('## ' + c.title);
    parts.push('> ' + c.summary);
    if (c.analogy && (o.depth !== 'deep' || beginner)) parts.push('> [!analogy] Think of it like this\n> ' + c.analogy);
    parts.push(o.depth === 'simple' ? firstSection(c.explain || '') : (c.explain || ''));
    if (c.code) {
      const [l, code] = pickCode(c.code, o.lang, o.pref);
      if (code) {
        parts.push('### 💻 Example' + (l && l !== 'bash' && l !== 'sql' && l !== 'html' ? ' in ' + U.langName(l) : ''));
        parts.push(fence(code, l));
        if (o.lang && l !== o.lang && !c.code[o.lang]) parts.push('*I don\'t have a ' + U.langName(o.lang) + ' version of this example yet, so here it is in ' + U.langName(l) + '.*');
        if (o.depth === 'deep' && Object.keys(c.code).length > 1) parts.push('**Same idea in other languages:**\n' + otherTabs(c.code, l));
      }
    }
    if (o.depth === 'deep') {
      if (c.deep) parts.push('### 🔬 Going deeper\n' + c.deep.replace(/^###\s/gm, '#### '));
      if (c.complexity) parts.push('### ⏱️ Complexity\n' + c.complexity);
    } else if (o.depth === 'balanced' && c.complexity) parts.push('**⏱️ Complexity:** ' + c.complexity);
    if (c.mistakes && c.mistakes.length) {
      if (o.depth === 'simple') parts.push('> [!mistake] Watch out\n' + c.mistakes.slice(0, 2).map((m) => '> - ' + m).join('\n'));
      else parts.push('### ⚠️ Common mistakes\n' + c.mistakes.slice(0, o.depth === 'deep' ? 8 : 4).map((m) => '- ' + m).join('\n'));
    }
    if (o.depth === 'deep' && c.practice) parts.push('### 🏋️ Practice problems\n' + c.practice.map((p) => '- ' + p).join('\n'));
    parts.push(relatedLine(c.related));
    return parts.filter(Boolean).join('\n\n');
  }

  function substitute(s, m, e) {
    return String(s || '').replace(/\$(\d)/g, (_, i) => {
      const v = m && m[+i];
      if (v) return String(v).replace(/[`«»]/g, "'").trim().slice(0, 120);
      return (e.dflt && e.dflt[+i - 1]) || '…';
    });
  }

  function issueLine(it) {
    const icon = it.severity === 'error' ? '🔴' : it.severity === 'warning' ? '🟡' : '🔵';
    return '- ' + icon + ' **Line ' + it.line + ': ' + it.title + '**  \n  ' + it.detail;
  }

  function codeExcerpt(code, lang, line) {
    const lines = code.split('\n');
    if (!line || line > lines.length) return null;
    if (lines.length <= 30) return fence(code, lang, '{' + line + '}');
    const from = Math.max(1, line - 3), to = Math.min(lines.length, line + 3);
    return '*Lines ' + from + '–' + to + ' (line ' + line + ' highlighted):*\n' + fence(lines.slice(from - 1, to).join('\n'), lang, '{' + (line - from + 1) + '}');
  }

  function fixedBlock(code, lang, analysis) {
    const fixed = AN.autofix(code, analysis.issues);
    if (!fixed || !fixed.changed.length || fixed.code.trim() === code.trim()) return '';
    const changed = fixed.changed;
    return '### ✅ Your code with the fixes applied\n' + fence(fixed.code, lang, 'good {' + changed.join(',') + '}') +
      '\n*I changed line' + (changed.length > 1 ? 's ' : ' ') + changed.join(', ') + ' (highlighted). Read through the changes so you understand each one, then run it again.*';
  }

  function renderError(match, ctx, o) {
    const e = match.e, m = match.m;
    const sub = (s) => substitute(s, m, e);
    const parts = [];
    const errLines = ctx.errorText ? ctx.errorText.split('\n').map((l) => l.trim()).filter((l) => /(Error|Exception|error:|warning:|fault|not recognized|not found|ERR!|fatal:)/.test(l)) : [];
    const matchedLine = m && m[0] ? errLines.find((l) => l.indexOf(m[0].trim().slice(0, 30)) >= 0) : null;
    const actual = (matchedLine || errLines.pop() || '').replace(/^\S+\.\w+:\d+(:\d+)?:\s*/, '');
    parts.push('## 🐞 ' + (actual && actual.length < 140 ? actual.replace(/[`«»]/g, "'") : e.title.replace(/[«»]/g, '`')));
    parts.push('**In plain words:** ' + sub(e.what));
    if (o.level === 'beginner' && o.depth !== 'deep') parts.push(pick(['This is one of the most common errors, so don\'t worry. Once you see *why* it happens, it is quick to fix.', 'Good news: this error message tells us almost exactly what is wrong. Let\'s decode it.', 'Everyone hits this one. Here is what it means and how to fix it.']));

    const line = errorLine(ctx.errorText);
    const lang = ctx.lang || e.lang;
    let analysis = null;
    if (ctx.code) analysis = AN.analyze(ctx.code, lang);
    if (ctx.code && line) {
      const ex = codeExcerpt(ctx.code, analysis ? analysis.lang : lang, line);
      if (ex) { parts.push('### 📍 Where it happens'); parts.push('The error points at **line ' + line + '**:'); parts.push(ex); }
    }
    // name suggestions from the captured name
    if ((e.suggestName || e.suggestAttr) && m && m[1] && ctx.code) {
      const name = m[e.suggestAttr && m[2] ? 2 : 1];
      const st = AN.strip(ctx.code, analysis ? analysis.lang : lang).text;
      const pool = [...AN.definedNames(st, analysis ? analysis.lang : lang), ...(lang === 'python' ? ['print', 'input', 'len', 'range', 'append', 'split', 'upper', 'lower', 'strip', 'items', 'keys', 'values', 'join', 'replace', 'format', 'count', 'index', 'sort', 'reverse'] : ['console', 'document', 'length', 'push', 'getElementById', 'querySelector', 'addEventListener', 'toUpperCase', 'toLowerCase', 'innerHTML', 'textContent', 'forEach', 'map', 'filter', 'println', 'System', 'String', 'length', 'size'])];
      const guess = U.closest(name, pool, name.length > 6 ? 2 : 1);
      const plural = guess && (name === guess + 's' || guess === name + 's');
      if (guess && !plural) parts.push('> [!fix] Likely culprit\n> You wrote «' + name + '», but your code (or the language) has «' + guess + '». It looks like a typo, so change «' + name + '» to «' + guess + '».');
    }
    if (analysis && analysis.issues.length) {
      // Same findings as the Playground's Problems tab, so the two never disagree.
      const real = analysis.issues.filter((it) => it.severity !== 'info');
      const infos = analysis.issues.filter((it) => it.severity === 'info');
      parts.push('### 🔬 What I found in your code');
      if (real.length) parts.push(real.map(issueLine).join('\n'));
      if (infos.length) parts.push((real.length ? '**Also worth checking:**\n' : '') + infos.map(issueLine).join('\n'));
    }
    parts.push('### 🔎 Why this happens');
    parts.push(e.causes.slice(0, o.depth === 'simple' ? 3 : o.depth === 'deep' ? 8 : 5).map((c) => '- ' + sub(c)).join('\n'));
    parts.push('### 🛠️ How to fix it');
    parts.push(sub(e.fix));
    if (analysis && ctx.code) { const fb = fixedBlock(ctx.code, analysis.lang, analysis); if (fb) parts.push(fb); }
    parts.push('> [!concept] The concept behind it\n> ' + sub(e.concept));
    if (e.tips && e.tips.length && o.depth !== 'simple') parts.push('> [!tip]\n' + e.tips.map((t) => '> ' + sub(t)).join('\n>\n'));
    if (!ctx.code && o.depth !== 'simple') parts.push('*Paste the code around the failing line too, and I can point at the exact problem and fix it for you.*');
    parts.push(relatedLine(e.related));
    return { content: parts.join('\n\n'), analysis };
  }

  function renderReview(ctx, o, mode) {
    const lang = ctx.lang || AN.detectLanguage(ctx.code).lang || 'text';
    const analysis = AN.analyze(ctx.code, lang);
    const L = analysis.lang;
    const sum = AN.summary(ctx.code, L);
    const cx = AN.complexity(ctx.code, L);
    const parts = [];
    const heading = mode === 'explain' ? '## 📖 Code walkthrough' : mode === 'debug' ? '## 🔧 Let\'s debug this' : '## 🔍 Code review';
    parts.push(heading + (L && L !== 'text' ? ' · ' + U.langName(L) : ''));
    const what = [];
    if (sum.classes.length) what.push('defines class' + (sum.classes.length > 1 ? 'es ' : ' ') + sum.classes.map((c) => '«' + c + '»').join(', '));
    if (sum.functions.length) what.push('defines function' + (sum.functions.length > 1 ? 's ' : ' ') + sum.functions.slice(0, 6).map((f) => '«' + f.name + '(' + (f.params.length > 30 ? '…' : f.params) + ')»').join(', '));
    if (sum.loops) what.push('uses ' + U.plural(sum.loops, 'loop'));
    if (cx.recursive.length) what.push('uses **recursion** («' + cx.recursive.join('», «') + '» calls itself)');
    if (sum.ds.length) what.push('works with ' + sum.ds.join(', '));
    if (sum.io.length) what.push(sum.io.join(' and '));
    if (what.length) parts.push('**What this code does:** it ' + what.join('; ') + '.');

    const real = analysis.issues.filter((i) => i.severity !== 'info');
    const infos = analysis.issues.filter((i) => i.severity === 'info');
    if (mode !== 'explain' || real.length) {
      if (real.length) {
        parts.push('### ' + (analysis.counts.error ? '🚨 Problems found' : '⚠️ Things to check') + ' (' + real.length + ')');
        parts.push(real.map(issueLine).join('\n'));
        const fb = fixedBlock(ctx.code, L, analysis);
        if (fb) parts.push(fb);
      } else {
        parts.push('> [!success] No obvious problems found\n> My static checks (syntax, brackets, common mistakes, typos) found nothing wrong. If the output is still not what you expect, it is probably a **logic error**: test with small inputs and edge cases (empty input, 0, negative numbers, a single element).');
      }
    }
    if (mode === 'debug' && !real.length) {
      parts.push('### 🧭 How to track down a logic bug\n1. Write down the **expected output** for a tiny input by hand.\n2. Add prints (or a debugger breakpoint) to show variables at each step.\n3. Find the **first** step where the actual value differs from what you expected. The bug is just before it.\n4. Check boundaries: «<» vs «<=», starting index 0 vs 1, and integer vs float division.');
      if (!ctx.errorText) parts.push('*If you see an error message, paste the full message too and I\'ll decode it.*');
    }
    // walkthrough
    const n = ctx.code.split('\n').length;
    if (mode === 'explain' || (o.depth === 'deep' && n <= 40)) {
      const ex = AN.explainLines(ctx.code, L).filter((x) => !/^(Closes the block|Executes this statement)$/.test(x.text) || mode === 'explain');
      if (ex.length) {
        const rows = ex.slice(0, 60).map((x) => '| ' + x.line + ' | «' + x.code.replace(/\|/g, '\\|').replace(/[`«»]/g, "'").slice(0, 70) + '» | ' + x.text.replace(/\|/g, '\\|') + ' |');
        parts.push('### 🧩 Line by line\n| Line | Code | What it does |\n|---|---|---|\n' + rows.join('\n'));
      }
    }
    if (L !== 'html' && L !== 'css' && L !== 'sql') {
      parts.push('### ⏱️ Estimated time complexity: **' + cx.label + '**');
      if (cx.reasons.length) parts.push(cx.reasons.map((r) => '- ' + r).join('\n'));
    }
    if (infos.length) parts.push('### ✨ Also worth checking\n' + infos.map((i) => '- 🔵 **Line ' + i.line + ': ' + i.title + '**  \n  ' + i.detail).join('\n'));
    const tips = bestPractices(L, ctx.code);
    if (tips.length && o.depth !== 'simple') parts.push('> [!tip] Make it even better\n' + tips.map((t) => '> - ' + t).join('\n'));
    return { content: parts.join('\n\n'), analysis, complexity: cx, lang: L };
  }

  function bestPractices(lang, code) {
    const t = [];
    if (lang === 'python') {
      if (/for \w+ in range\(len\((\w+)\)\)/.test(code) && !/\[\s*\w+\s*[+-]\s*1\s*\]/.test(code)) t.push('Loop over items directly («for x in items») or use «enumerate()» instead of «range(len(...))».');
      if (/^[^\s#].*input\(/m.test(code) && !/try:/.test(code)) t.push('Wrap number conversions of user input in «try/except ValueError».');
      if (!/def /.test(code) && code.split('\n').length > 15) t.push('Split long scripts into small functions with clear names.');
      if (/\+=\s*["']/.test(code) && /for /.test(code)) t.push('Building strings in a loop? Collect the pieces in a list and «"".join()» them.');
    } else if (lang === 'javascript' || lang === 'typescript') {
      if (/\bvar\b/.test(code)) t.push('Prefer «const» (or «let») over «var».');
      if (/[^=!]==[^=]/.test(code)) t.push('Use «===» for comparisons.');
      if (/\.then\(/.test(code) && !/\.catch\(/.test(code)) t.push('Add «.catch()» (or use try/catch with async/await) to handle errors.');
    } else if (lang === 'java') {
      if (/new Scanner/.test(code) && !/close\(\)/.test(code)) t.push('Close your «Scanner» when finished, or use try-with-resources.');
      if (/\+=\s*"|"\s*\+\s*\w+\s*;/.test(code) && /for\s*\(/.test(code)) t.push('Use «StringBuilder» for building strings inside loops.');
    } else if (lang === 'c' || lang === 'cpp') {
      if (!/-Wall/.test(code)) t.push('Compile with «-Wall -Wextra» to see helpful warnings, and «-fsanitize=address» to catch memory bugs.');
      if (lang === 'cpp' && /bits\/stdc\+\+\.h/.test(code)) t.push('«bits/stdc++.h» is fine for contests but non-standard. Include specific headers in real projects.');
    }
    return t.slice(0, 3);
  }

  function renderRecipe(r, o) {
    const [l, code] = pickCode(r.code, o.lang, o.pref);
    const parts = [];
    parts.push('## 🛠️ ' + r.title + (l ? ' in ' + U.langName(l) : ''));
    if (o.lang && l !== o.lang) parts.push('*I don\'t have a ' + U.langName(o.lang) + ' version of this one yet, so here it is in ' + U.langName(l) + '.*');
    parts.push('**Approach:** ' + r.approach);
    parts.push(fence(code, l));
    if (o.depth !== 'simple') {
      const ex = AN.explainLines(code, l).filter((x) => !/^(Closes the block|Executes this statement|Comment)/.test(x.text) && !/^(import|#include|using namespace|public class|package)/.test(x.code)).slice(0, o.depth === 'deep' ? 14 : 8);
      if (ex.length) parts.push('### 🧠 How it works\n' + ex.map((x) => '- «' + x.code.replace(/[`«»]/g, "'").slice(0, 60) + '»: ' + x.text).join('\n'));
    }
    if (r.complexity && r.complexity !== 'n/a') parts.push('**⏱️ Complexity:** ' + r.complexity);
    if (r.notes && r.notes.length) parts.push('> [!tip]\n' + r.notes.map((n) => '> - ' + n).join('\n'));
    if (o.depth === 'deep' && Object.keys(r.code).length > 1) parts.push('### 🌐 Other languages\n' + otherTabs(r.code, l));
    parts.push(relatedLine(r.related));
    return { content: parts.join('\n\n'), lang: l };
  }

  function renderCompare(c, o) {
    const parts = ['## ⚖️ ' + c.title, c.body];
    if (c.code) { const [l, code] = pickCode(c.code, o.lang, o.pref); if (code) parts.push(fence(code, l)); }
    parts.push('> [!tip] Bottom line\n> ' + c.verdict);
    parts.push(relatedLine(c.related));
    return parts.join('\n\n');
  }

  /** Builds a comparison from two concept entries when no dedicated compare entry exists. */
  function synthCompare(a, b, o) {
    const row = (k, f) => '| ' + k + ' | ' + f(a) + ' | ' + f(b) + ' |';
    const parts = ['## ⚖️ ' + a.title + ' vs ' + b.title,
      '| | ' + a.title + ' | ' + b.title + ' |\n|---|---|---|\n' +
      [row('What it is', (x) => x.summary.replace(/\|/g, '/')), row('Category', (x) => x.cat), row('Level', (x) => x.level), row('Typical mistake', (x) => (x.mistakes && x.mistakes[0] || '—').replace(/\|/g, '/'))].join('\n')];
    if (a.analogy || b.analogy) parts.push('**Analogies:**\n- **' + a.title + ':** ' + (a.analogy || '—') + '\n- **' + b.title + ':** ' + (b.analogy || '—'));
    parts.push('Want the full picture? ' + ask('Explain ' + a.title, 'Explain ' + a.title) + ' ' + ask('Explain ' + b.title, 'Explain ' + b.title));
    void o;
    return parts.join('\n\n');
  }

  function renderQuiz(c) {
    if (!c || !c.quiz || !c.quiz.length) return null;
    const L = 'ABCD';
    const parts = ['## 🎯 Quick quiz: ' + c.title, 'Try to answer before opening each solution.'];
    c.quiz.forEach((qq, i) => {
      parts.push('**' + (i + 1) + '. ' + qq.q + '**\n' + qq.o.map((op, k) => '- **' + L[k] + ')** ' + op).join('\n'));
      parts.push(':::spoiler Show answer\n✅ **' + L[qq.a] + ') ' + qq.o[qq.a] + '**: ' + qq.why + '\n:::');
    });
    if (c.practice && c.practice.length) parts.push('### 🏋️ Try these next\n' + c.practice.slice(0, 3).map((p) => '- ' + p).join('\n'));
    parts.push('*Open the **Library** for an interactive version that tracks your score.*');
    return parts.join('\n\n');
  }

  const ALGOS = [
    [/binary search tree|\bbst\b/, 'Binary search tree operations', 'O(log n) if balanced, O(n) if skewed', 'O(n)'],
    [/binary search/, 'Binary search', 'O(log n)', 'O(1) iterative'],
    [/linear search/, 'Linear search', 'O(n)', 'O(1)'],
    [/bubble sort/, 'Bubble sort', 'O(n²) average/worst, O(n) best', 'O(1)'],
    [/selection sort/, 'Selection sort', 'O(n²) always', 'O(1)'],
    [/insertion sort/, 'Insertion sort', 'O(n²) worst, O(n) best (nearly sorted)', 'O(1)'],
    [/merge sort/, 'Merge sort', 'O(n log n) always', 'O(n)'],
    [/quick ?sort/, 'Quick sort', 'O(n log n) average, O(n²) worst', 'O(log n)'],
    [/heap ?sort/, 'Heap sort', 'O(n log n)', 'O(1)'],
    [/counting sort/, 'Counting sort', 'O(n + k)', 'O(k)'],
    [/dijkstra/, 'Dijkstra\'s algorithm', 'O((V + E) log V) with a heap', 'O(V)'],
    [/\bbfs\b|breadth.first/, 'BFS', 'O(V + E)', 'O(V)'],
    [/\bdfs\b|depth.first/, 'DFS', 'O(V + E)', 'O(V) (recursion stack)'],
    [/hash ?(map|table|set)|dictionary|\bdict\b/, 'Hash map insert/lookup/delete', 'O(1) average, O(n) worst', 'O(n)'],
    [/heap|priority queue/, 'Heap push/pop', 'O(log n) (peek O(1))', 'O(n)'],
    [/fibonacci/, 'Fibonacci', 'naive recursion O(2ⁿ), memoized/iterative O(n)', 'O(n) or O(1)'],
    [/factorial/, 'Factorial', 'O(n)', 'O(1) iterative, O(n) recursive'],
    [/linked list/, 'Linked list', 'access/search O(n), insert/delete at head O(1)', 'O(n)'],
    [/array|list/, 'Array / list', 'access O(1), search O(n), insert/delete in middle O(n), append O(1) amortized', 'O(n)'],
    [/two pointers?|sliding window/, 'Two pointers / sliding window', 'O(n)', 'O(1)'],
    [/matrix multiplication/, 'Matrix multiplication (naive)', 'O(n³)', 'O(n²)'],
    [/permutations?/, 'Generating all permutations', 'O(n! × n)', 'O(n)'],
    [/subsets?|power set/, 'Generating all subsets', 'O(2ⁿ × n)', 'O(n)'],
    [/sort/, 'Built-in sort', 'O(n log n)', 'O(n) or O(log n)']
  ];

  /* ------------------------------------------------------------------ */
  /* follow-ups                                                          */
  /* ------------------------------------------------------------------ */
  const FU = {
    simpler: /^(can you |please )?(explain |say )?(it |this |that )?(more |even )?(simpl(er|y|ify|e)|easier|eli5|like i'?m (5|five|a beginner)|in simple (words|terms|language)|in layman|for a beginner|i (still )?(don'?t|do not|didn'?t) (get|understand)|not clear|confus|too (hard|complex|difficult)|dumb it down|break it down)/i,
    deeper: /^(can you |please )?(go |explain )?(deeper|more detail|in (more )?detail|elaborate|explain more|tell me more|more|more info|deep ?dive|advanced|full explanation|in depth)\b/i,
    example: /^(can you |please )?(give|show)?( me)?( an?| another| more| one more| some)? ?(real[- ]world )?(examples?|code|snippet|program|implementation|sample)s?\b/i,
    quiz: /\b(quiz( me)?|test me|mcqs?|practice questions|questions on (it|this)|check my understanding)\b/i,
    why: /^(but )?why\b.{0,40}$/i,
    mistakes: /\b(common mistakes?|pitfalls?|what should i avoid|gotchas?)\b/i,
    complexity: /\b(time complexity|space complexity|complexity|big ?o|how (fast|efficient|slow)|efficien|optimi[sz]e|faster|make it better|improve (it|this|my code))\b/i,
    // follow-up forms that clearly refer back to the previous code ("it", "this") or are bare
    complexityFU: /^((what('?s| is) )?(the )?(time |space )?complexity( of (it|this|that|the code|my code))?|big ?o( of (it|this|that))?|how (fast|efficient|slow) is (it|this|that|my code)|(can you )?(optimi[sz]e|speed up|improve) (it|this|that|my code)|make it (faster|better|more efficient)|how (can|do) i make it (faster|better|more efficient))\s*[?.!]*$/i,
    lineByLine: /\b(line by line|walk ?through|explain (the |this |my )?code|step by step|each line|what does (this|each|every) (line|part) (do|mean))\b/i,
    lineByLineFU: /\b(line by line|walk ?(me )?through (it|this|that|the code|my code)|each line)\b|^(explain|describe) (the code|my code|this code|that code)\b|^(explain|describe) (it|this|that)\s*[?.!]*$/i,
    fix: /\b(fix (it|this|my code)|corrected code|fixed (version|code)|show (me )?the (fix|solution|correct code)|solve it)\b/i
  };
  const LANG_SWITCH = /^(?:(?:can you |please )?(?:show|write|give|do|convert|translate)(?: it| this| that| the same)?(?: me)?(?: in| to| into| using)?|in|using|with|now in|what about|how about|and in|same in|same thing in)\s+(python3?|java(?:script)?|js|c\+\+|cpp|c#|csharp|c|typescript|ts)(?![\w+#])(?:\s*(?:please|code|version|language|\?|!|\.)*)?$|^(python3?|java(?:script)?|js|c\+\+|cpp|c#|c|typescript|ts)\s*(version|code|please|\?)?\s*$/i;

  function followUp(ctx, state, o) {
    if (ctx.code || ctx.errorText) return null;
    const t = ctx.prose.trim();
    if (!t || t.split(/\s+/).length > 12) return null;
    const topic = state && state.topic;
    let m;
    if ((m = t.match(LANG_SWITCH))) {
      const lang = CM.hl.normalize((m[1] || m[2] || '').toLowerCase().replace('python3', 'python'));
      if (topic) return { redo: true, lang, label: 'lang' };
      if (state.code) return { codeAction: 'explain', lang };
    }
    // topic re-renders take priority over code actions ("explain it simpler" ≠ "explain the code")
    if (topic && FU.simpler.test(t)) return { redo: true, depth: 'simple', label: 'simpler' };
    if (topic && FU.deeper.test(t) && !FU.lineByLineFU.test(t)) return { redo: true, depth: 'deep', label: 'deeper' };
    if (FU.lineByLineFU.test(t) && state.code) return { codeAction: 'explain' };
    if (FU.complexityFU.test(t) && state.code) return { codeAction: 'complexity' };
    if (FU.fix.test(t) && state.code) return { codeAction: 'review' };
    if (!topic) return null;
    if (FU.quiz.test(t)) return { quiz: true };
    if (FU.simpler.test(t)) return { redo: true, depth: 'simple', label: 'simpler' };
    if (FU.deeper.test(t)) return { redo: true, depth: 'deep', label: 'deeper' };
    if (FU.mistakes.test(t)) return { mistakes: true };
    if (FU.why.test(t)) return { why: true };
    if (FU.example.test(t) && t.split(/\s+/).length <= 7) return { example: true, lang: langMention(t) };
    if (FU.complexityFU.test(t)) return { complexityTopic: true };
    return null;
  }

  /* ------------------------------------------------------------------ */
  /* intent + routing                                                    */
  /* ------------------------------------------------------------------ */
  function findCompare(t) {
    const nq = S.norm(t);
    const has = (alias) => {
      const a = S.norm(alias);
      if (/^ [=!<>]+ $/.test(a) || /[=]/.test(alias)) return t.indexOf(alias) >= 0;
      return nq.indexOf(a) >= 0;
    };
    let best = null, bestLen = 0;
    for (const c of KB.compares) {
      const A = c.terms[0].filter(has), Bm = c.terms[1].filter(has);
      if (!A.length || !Bm.length) continue;
      const len = Math.max(...A.map((x) => x.length)) + Math.max(...Bm.map((x) => x.length));
      if (len > bestLen) { bestLen = len; best = c; }
    }
    return best;
  }

  const RE = {
    greet: /^(hi+|hello+|hey+|yo|hola|namaste|good (morning|afternoon|evening)|sup|thanks?|thank you|thx|ty|ok(ay)?|cool|nice|great|awesome|got it|perfect|bye)\b/i,
    compare: /\b(difference|differences|differ|diff|vs\.?|versus|compare|comparison|compared|better|distinguish|contrast)\b/i,
    complexity: /\b(time complexity|space complexity|big[\s-]?o|complexity of|how (fast|efficient) is|runtime of|o\(n)/i,
    howto: /^(how (do|can|to|would|should|could) (i |you |we |one )?|write|create|make|build|implement|generate|code for|program (to|for|that)|give me (a |the )?(code|program|function)|show me how|steps to|function (to|that|for)|algorithm (to|for))|\b(write|create|implement|make|build|develop|design) (a |an |the |me a |me an )?(simple )?(program|code|function|script|method|class|algorithm|logic)\b|\bprogram (to|for|that)\b|\bcode (to|for)\b|\bhow (to|do i|can i)\b|\b(syntax|example) (of|for)\b/i,
    concept: /\b(what is|what are|what's|whats|what does|explain|define|definition|meaning|concept|tell me about|teach me|learn|understand|why (do|does|is|are|should|would)|how does|how do\b.*\bwork|purpose of|use of|uses of|when (to|should i) use|introduction to|basics of|overview)\b/i,
    errorWords: /\b(error|exception|traceback|crash(es|ed|ing)?|bug|not working|doesn'?t work|isn'?t working|won'?t (run|compile|work)|wrong (output|answer|result)|fails?|failing|failed|issue|problem|incorrect|unexpected|segfault|stuck|infinite|rejected|denied|refused|not recognized|not found|conflict)\b/i
  };

  function classify(ctx, state) {
    const t = ctx.prose;
    if (ctx.errorText) return 'error';
    if (ctx.code) {
      if (RE.complexity.test(t) || /\b(complexity|big ?o|efficient|optimi[sz]e|faster)\b/i.test(t)) return 'complexity';
      if (FU.lineByLine.test(t) || /\b(explain|what does|understand|meaning|how does)\b/i.test(t)) return 'explain';
      if (RE.errorWords.test(t)) return 'debug';
      return 'review';
    }
    const words = t.split(/\s+/).filter(Boolean).length;
    if (words <= 6 && RE.greet.test(t)) return 'faq';
    if (KB.faqs.some((f) => f.q.some((re) => re.test(t)))) return 'faq';
    if (B.matchErrors(t).length) return 'error';
    if (RE.compare.test(t) || /\bor\b/i.test(t) && words <= 8) { if (findCompare(t)) return 'compare'; if (RE.compare.test(t)) return 'compare'; }
    if (RE.complexity.test(t)) return 'complexity';
    const errHit = S.query(t, { types: ['error'], limit: 1 })[0];
    if (errHit && errHit.alias >= 8 && (RE.errorWords.test(t) || /error|exception|fault/i.test(t))) return 'error';
    if (RE.howto.test(t)) return 'howto';
    if (RE.concept.test(t)) return 'concept';
    void state;
    return 'search';
  }

  /* ------------------------------------------------------------------ */
  /* suggestions                                                         */
  /* ------------------------------------------------------------------ */
  function otherLang(lang, available) {
    const opts = (available || LANG_ORDER).filter((l) => l !== lang && ['python', 'javascript', 'java', 'cpp', 'c'].indexOf(l) >= 0);
    return opts[0];
  }
  function suggestionsFor(type, entry, o, extra) {
    const s = [];
    if (type === 'concept') {
      s.push(o.depth === 'simple' ? 'Go deeper' : 'Explain it simpler');
      const ol = otherLang(o.usedLang, entry.code && Object.keys(entry.code));
      if (ol) s.push('Show it in ' + U.langName(ol));
      if (entry.quiz && entry.quiz.length) s.push('Quiz me');
      const rel = resolveRelated(entry.related)[0]; if (rel) s.push(rel.q);
    } else if (type === 'error') {
      const rel = resolveRelated(entry.related)[0]; if (rel) s.push(rel.q);
      s.push('How do I debug errors like this?');
      if (extra && extra.code) s.push('Explain my code line by line');
      else s.push('Show common mistakes');
    } else if (type === 'recipe') {
      s.push('Explain it line by line');
      const ol = otherLang(o.usedLang, Object.keys(entry.code)); if (ol) s.push('Show it in ' + U.langName(ol));
      s.push('What is the time complexity?');
    } else if (type === 'review') {
      s.push('Explain it line by line', 'What is the time complexity?', 'How can I make it faster?');
    } else if (type === 'compare') {
      const rel = resolveRelated(entry.related).slice(0, 2); rel.forEach((r) => s.push(r.q));
      s.push('Quiz me');
    }
    return s.slice(0, 4);
  }

  /* ------------------------------------------------------------------ */
  /* main entry                                                          */
  /* ------------------------------------------------------------------ */
  /**
   * @param {{text:string, state?:object, user?:object, depth?:string, langPref?:string}} input
   * @returns {{content:string, meta:object}}
   */
  B.respond = function (input) {
    const user = input.user || null;
    const profile = (user && user.profile) || {};
    const state = Object.assign({}, input.state || {});
    const o = { depth: input.depth || 'balanced', level: profile.level || 'beginner', pref: profile.primaryLang || 'python' };
    const ctx = B.parse(input.text);
    const mention = langMention(ctx.prose);
    const forced = input.langPref && input.langPref !== 'auto' ? input.langPref : null;
    // The code's own language (fence tag, then detection) always decides how it is analyzed.
    // The composer's language picker only chooses the language for examples and recipes.
    const fenceLang = ANALYZABLE.has(ctx.codeLang) ? ctx.codeLang : null;
    const detected = ctx.code ? AN.detectLanguage(ctx.code).lang : null;
    ctx.lang = fenceLang || detected || errorLang(ctx.errorText) || forced || mention || null;
    o.lang = forced || mention || fenceLang || (ctx.code ? ctx.lang : null) || null;
    const meta = { intent: null, lang: ctx.lang, topic: null, title: null, suggestions: [], source: 'builtin', confidence: 1 };
    let content = '';
    const done = (c) => { meta.state = state; return { content: finalize(c), meta }; };

    /* follow-ups ------------------------------------------------------ */
    const fu = followUp(ctx, state, o);
    if (fu) {
      if (fu.codeAction) {
        const c2 = { code: state.code, lang: fu.lang || state.codeLang, prose: '', errorText: '' };
        const r = fu.codeAction === 'complexity' ? null : renderReview(c2, Object.assign({}, o, { depth: fu.codeAction === 'explain' ? 'deep' : o.depth }), fu.codeAction === 'explain' ? 'explain' : 'review');
        if (fu.codeAction === 'complexity') {
          const cx = AN.complexity(state.code, state.codeLang);
          content = '## ⏱️ Time complexity: **' + cx.label + '**\n\n' + cx.reasons.map((x) => '- ' + x).join('\n') + '\n\n' + optimizeTips(state.code, state.codeLang, cx);
        } else content = r.content;
        meta.intent = fu.codeAction === 'complexity' ? 'complexity' : 'review';
        meta.suggestions = ['Explain it line by line', 'How can I make it faster?'].filter((x) => !(fu.codeAction === 'explain' && /line by line/.test(x)));
        return done(content);
      }
      const topic = state.topic;
      const entry = topic && KB.get(topic.type + 's', topic.id);
      if (entry) {
        const lang = fu.lang || state.lang || o.lang;
        const oo = Object.assign({}, o, { lang, depth: fu.depth || o.depth });
        meta.topic = topic; meta.intent = topic.type; meta.lang = lang;
        if (fu.quiz) {
          const c = topic.type === 'concept' ? entry : KB.concept((entry.related || []).find((id) => KB.concept(id) && KB.concept(id).quiz) || '');
          content = renderQuiz(c) || 'I don\'t have a quiz for this topic yet. Open the **Library** to find quizzes on related concepts. ' + relatedLine(entry.related);
          meta.suggestions = ['Explain it simpler', 'Go deeper'];
          return done(content);
        }
        if (fu.why && topic.type === 'error') { content = '## 🧠 Why does this happen?\n\n' + substitute(entry.concept, null, entry) + '\n\n### Typical causes\n' + entry.causes.map((c) => '- ' + substitute(c, null, entry)).join('\n') + '\n\n' + relatedLine(entry.related); return done(content); }
        if (fu.why && topic.type === 'concept') { content = '## 🧠 Why it matters: ' + entry.title + '\n\n' + (entry.deep || entry.explain) + '\n\n' + relatedLine(entry.related); return done(content); }
        if (fu.mistakes) {
          const list = entry.mistakes || entry.causes || [];
          content = '## ⚠️ Common mistakes: ' + (entry.title || '').replace(/[«»]/g, '`') + '\n\n' + (list.length ? list.map((x) => '- ' + substitute(x, null, entry)).join('\n') : 'No specific pitfalls recorded for this one.') + '\n\n' + relatedLine(entry.related);
          return done(content);
        }
        if (fu.complexityTopic) {
          if (entry.complexity) { content = '## ⏱️ Complexity: ' + entry.title + '\n\n' + entry.complexity + '\n\n' + relatedLine(['big-o']); return done(content); }
        }
        if (fu.example) {
          const code = entry.code;
          if (code) {
            const [l, c] = pickCode(code, fu.lang || lang, o.pref);
            content = '## 💻 Example: ' + entry.title.replace(/[«»]/g, '`') + (l ? ' (' + U.langName(l) + ')' : '') + '\n\n' + fence(c, l) + (Object.keys(code).length > 1 ? '\n\n**Other languages:**\n' + otherTabs(code, l) : '');
            if (c) { state.code = c; state.codeLang = l; }
            meta.suggestions = ['Explain it line by line', 'Quiz me'];
            return done(content);
          }
        }
        if (fu.redo) {
          if (topic.type === 'concept') { content = renderConcept(entry, oo); meta.suggestions = suggestionsFor('concept', entry, Object.assign({}, oo, { usedLang: lang })); }
          else if (topic.type === 'recipe') { const r = renderRecipe(entry, oo); content = r.content; state.code = entry.code[r.lang]; state.codeLang = r.lang; meta.suggestions = suggestionsFor('recipe', entry, Object.assign({}, oo, { usedLang: r.lang })); }
          else if (topic.type === 'compare') content = renderCompare(entry, oo);
          else if (topic.type === 'error') {
            const fakeCtx = { errorText: '', code: '', lang: entry.lang };
            content = renderError({ e: entry, m: null }, fakeCtx, oo).content;
          }
          if (fu.label === 'lang') state.lang = lang;
          if (content) return done(content);
        }
      }
    }

    /* fresh question ---------------------------------------------------- */
    const intent = classify(ctx, state);
    meta.intent = intent;
    if (ctx.code) { state.code = ctx.code; state.codeLang = ctx.lang; }

    if (intent === 'error') {
      let matches = B.matchErrors(ctx.errorText || ctx.prose, ctx.lang);
      if (!matches.length && ctx.errorText && ctx.prose) matches = B.matchErrors(ctx.errorText + '\n' + ctx.prose, ctx.lang);
      if (!matches.length) {
        const hit = S.query(ctx.errorText || ctx.prose, { types: ['error'], lang: ctx.lang, limit: 1 })[0];
        if (hit && (hit.alias || hit.score > 5)) matches = [{ e: hit.e, m: null, score: hit.score }];
      }
      if (matches.length) {
        const best = matches[0];
        const r = renderError(best, ctx, o);
        content = r.content;
        if (matches[1] && matches[1].score >= best.score - 2 && matches[1].e.id !== best.e.id && o.depth !== 'simple') content += '\n\n*This message could also be related to:* ' + ask(matches[1].e.title.replace(/[«»]/g, ''), matches[1].e.title.replace(/[«»]/g, ''));
        meta.topic = { type: 'error', id: best.e.id };
        const actualLine = (ctx.errorText || '').split('\n').map((l) => l.trim()).filter((l) => /(Error|Exception)\b/.test(l)).pop();
        meta.title = actualLine && actualLine.length <= 90 ? actualLine.replace(/^Uncaught\s+/, '') : best.e.title.replace(/[«»]/g, '');
        meta.lang = ctx.lang || best.e.lang;
        meta.suggestions = suggestionsFor('error', best.e, o, { code: ctx.code });
        state.topic = meta.topic;
        return done(content);
      }
      if (ctx.code) {
        const r = renderReview(ctx, o, 'debug');
        content = (ctx.errorText ? '> [!note] I don\'t recognise this exact error message yet, so here is what my analysis of your code found.\n\n' : '') + r.content;
        meta.intent = 'debug'; meta.title = 'Debugging ' + U.langName(r.lang) + ' code';
        meta.suggestions = suggestionsFor('review', null, o);
        return done(content);
      }
      content = unknownError(ctx);
      meta.confidence = 0.3;
      meta.title = U.truncate(ctx.errorText || ctx.prose, 50);
      return done(content);
    }

    if (intent === 'review' || intent === 'debug' || intent === 'explain') {
      const r = renderReview(ctx, Object.assign({}, o, intent === 'explain' ? { depth: o.depth === 'simple' ? 'balanced' : o.depth } : {}), intent === 'explain' ? 'explain' : intent === 'debug' ? 'debug' : 'review');
      content = r.content;
      meta.lang = r.lang;
      meta.title = (intent === 'explain' ? 'Explaining ' : intent === 'debug' ? 'Debugging ' : 'Reviewing ') + U.langName(r.lang) + ' code';
      const fn = AN.summary(ctx.code, r.lang).functions[0];
      if (fn) meta.title += ': ' + fn.name + '()';
      meta.suggestions = intent === 'explain' ? ['What is the time complexity?', 'How can I make it faster?', 'Any bugs in this code?'] : suggestionsFor('review', null, o);
      state.topic = null;
      return done(content);
    }

    if (intent === 'complexity') {
      if (ctx.code) {
        const L = ctx.lang || AN.detectLanguage(ctx.code).lang;
        const cx = AN.complexity(ctx.code, L);
        content = '## ⏱️ Time complexity: **' + cx.label + '**\n\n' + (cx.reasons.length ? cx.reasons.map((x) => '- ' + x).join('\n') : '- I could not find loops or recursion that depend on the input size.') + '\n\n' + optimizeTips(ctx.code, L, cx) + '\n\n' + relatedLine(['big-o']);
        meta.title = 'Complexity of ' + U.langName(L) + ' code';
        meta.suggestions = ['Explain it line by line', 'Explain Big-O notation'];
        return done(content);
      }
      const low = ctx.prose.toLowerCase();
      const hit = ALGOS.find((a) => a[0].test(low));
      if (hit) {
        content = '## ⏱️ Complexity of ' + hit[1] + '\n\n| | |\n|---|---|\n| **Time** | ' + hit[2] + ' |\n| **Extra space** | ' + hit[3] + ' |\n\n';
        const c = S.query(ctx.prose, { types: ['concept'], limit: 1 })[0];
        if (c && c.e.complexity) content += c.e.complexity + '\n\n';
        content += 'Need a refresher on how to calculate this? ' + ask('Explain Big-O', 'Explain Big-O notation') + (c ? ' ' + ask('Explain ' + c.e.title, 'Explain ' + c.e.title) : '');
        meta.title = 'Complexity of ' + hit[1];
        meta.suggestions = ['Explain Big-O notation', c ? 'Explain ' + c.e.title : 'Explain sorting algorithms'];
        return done(content);
      }
      const big = KB.concept('big-o');
      content = renderConcept(big, Object.assign({}, o, { lang: o.lang })) + '\n\n*Paste your code and I\'ll estimate its complexity for you.*';
      meta.topic = { type: 'concept', id: 'big-o' }; state.topic = meta.topic; meta.title = big.title;
      meta.suggestions = suggestionsFor('concept', big, Object.assign({}, o, { usedLang: 'python' }));
      return done(content);
    }

    if (intent === 'faq') {
      const f = KB.faqs.find((x) => x.q.some((re) => re.test(ctx.prose)));
      if (f) {
        let ans = f.answer;
        const nm = firstName(user);
        if (f.id === 'faq-greet' && nm) ans = ans.replace('Hey there!', 'Hey ' + nm + '!');
        content = ans + (f.related && f.related.length ? '\n\n' + relatedLine(f.related.filter((r) => !/^compare:/.test(r)).concat(f.related.filter((r) => /^compare:/.test(r)))) : '');
        meta.title = f.id === 'faq-greet' || f.id === 'faq-thanks' ? null : f.title;
        meta.suggestions = f.id === 'faq-greet' ? ['Explain recursion simply', 'Why do I get IndexError?', 'Write a program to check prime in Java'] : f.id === 'faq-thanks' ? ['Quiz me', 'Explain it simpler'] : [];
        if (f.id === 'faq-thanks' && !state.topic) meta.suggestions = ['How do I start learning DSA?', 'Give me project ideas'];
        return done(content);
      }
    }

    if (intent === 'compare') {
      const c = findCompare(ctx.prose);
      if (c) {
        content = renderCompare(c, o);
        meta.topic = { type: 'compare', id: c.id }; state.topic = meta.topic;
        meta.title = c.title.replace(/[«»]/g, '');
        meta.suggestions = suggestionsFor('compare', c, o);
        return done(content);
      }
      // try to split "A vs B" / "difference between A and B"
      const low = ctx.prose.toLowerCase().replace(/[?.!]/g, '');
      const mm = low.match(/between\s+(.+?)\s+(?:and|&|vs\.?|or)\s+(.+)$/) || low.match(/^(?:compare\s+)?(.+?)\s+(?:vs\.?|versus|or|compared to|and)\s+(.+?)(?:\s+in\s+\w+)?$/);
      if (mm) {
        const a = S.query(mm[1], { types: ['concept'], limit: 1 })[0], b = S.query(mm[2], { types: ['concept'], limit: 1 })[0];
        if (a && b && a.e.id !== b.e.id) {
          content = synthCompare(a.e, b.e, o);
          meta.title = a.e.title + ' vs ' + b.e.title;
          meta.suggestions = ['Explain ' + a.e.title, 'Explain ' + b.e.title];
          return done(content);
        }
      }
    }

    if (intent === 'howto' || intent === 'concept' || intent === 'compare' || intent === 'search') {
      const q = ctx.prose;
      const recipes = S.query(q, { types: ['recipe'], limit: 2 });
      const concepts = S.query(q, { types: ['concept'], limit: 3 });
      const r0 = recipes[0], c0 = concepts[0];
      const recipeGood = r0 && (r0.alias >= 6 || r0.score >= 7);
      const conceptGood = c0 && (c0.alias >= 3 || c0.score >= 5);
      let useRecipe = false;
      if (intent === 'howto' && recipeGood) useRecipe = true;
      else if (intent === 'howto' && r0 && (!conceptGood || r0.score > c0.score * 0.8)) useRecipe = r0.score >= 4;
      else if (intent !== 'concept' && recipeGood && (!conceptGood || r0.score > c0.score)) useRecipe = true;
      if (useRecipe) {
        const r = renderRecipe(r0.e, o);
        content = r.content;
        meta.topic = { type: 'recipe', id: r0.e.id }; state.topic = meta.topic; state.code = r0.e.code[r.lang]; state.codeLang = r.lang; state.lang = r.lang;
        meta.title = r0.e.title + (r.lang ? ' (' + U.langName(r.lang) + ')' : '');
        meta.lang = r.lang; meta.intent = 'howto';
        meta.suggestions = suggestionsFor('recipe', r0.e, Object.assign({}, o, { usedLang: r.lang }));
        return done(content);
      }
      if (conceptGood || (c0 && intent === 'concept' && c0.score >= 2.5)) {
        const c = c0.e;
        content = renderConcept(c, o);
        if (concepts[1] && concepts[1].score > c0.score * 0.85 && concepts[1].e.id !== c.id && o.depth !== 'simple') content += '\n\n*Did you mean:* ' + ask(concepts[1].e.title, 'Explain ' + concepts[1].e.title);
        meta.topic = { type: 'concept', id: c.id }; state.topic = meta.topic;
        const [usedLang] = pickCode(c.code, o.lang, o.pref);
        state.lang = o.lang || usedLang;
        if (c.code && usedLang) { state.code = c.code[usedLang]; state.codeLang = usedLang; }
        meta.title = c.title; meta.intent = 'concept'; meta.lang = usedLang;
        meta.suggestions = suggestionsFor('concept', c, Object.assign({}, o, { usedLang }));
        return done(content);
      }
      // generic retrieval across everything
      const all = S.query(q, { limit: 5 });
      const top = all[0];
      if (top && (top.alias >= 4 || top.score >= 6)) {
        const e = top.e;
        if (e.type === 'error') { const rr = renderError({ e, m: null }, { errorText: '', code: '', lang: e.lang }, o); content = rr.content; meta.topic = { type: 'error', id: e.id }; meta.suggestions = suggestionsFor('error', e, o, {}); }
        else if (e.type === 'compare') { content = renderCompare(e, o); meta.topic = { type: 'compare', id: e.id }; meta.suggestions = suggestionsFor('compare', e, o); }
        else if (e.type === 'faq') { content = e.answer; }
        else if (e.type === 'recipe') { const r = renderRecipe(e, o); content = r.content; meta.topic = { type: 'recipe', id: e.id }; meta.suggestions = suggestionsFor('recipe', e, Object.assign({}, o, { usedLang: r.lang })); }
        else { content = renderConcept(e, o); meta.topic = { type: 'concept', id: e.id }; meta.suggestions = suggestionsFor('concept', e, Object.assign({}, o, { usedLang: pickCode(e.code, o.lang, o.pref)[0] })); }
        state.topic = meta.topic || null;
        meta.title = (e.title || '').replace(/[«»]/g, '');
        meta.confidence = 0.7;
        return done(content);
      }
      content = unknownQuestion(ctx, all);
      meta.confidence = 0.2;
      meta.title = U.truncate(ctx.prose, 50);
      meta.suggestions = all.slice(0, 3).map((x) => x.e.type === 'concept' ? 'Explain ' + x.e.title : (x.e.title || '').replace(/[«»]/g, ''));
      return done(content);
    }
    content = unknownQuestion(ctx, []);
    return done(content);
  };

  function optimizeTips(code, lang, cx) {
    const tips = [];
    if (/O\(n[²³]|O\(n\^/.test(cx.label)) tips.push('**Nested loops**: can a hash set or map replace the inner loop? Checking «x in set» is O(1), versus O(n) for a list. Sorting first and then using two pointers is another common trick.');
    if (/2ⁿ/.test(cx.label)) tips.push('**Exponential recursion**: cache results (memoization) or build the answer bottom-up (dynamic programming).');
    if (/\bin\s+\w+\b/.test(code) && lang === 'python' && /for /.test(code)) tips.push('If you test membership (`x in items`) inside a loop, convert «items» to a «set» first.');
    if (/\.(insert\(0|pop\(0\)|shift\(\)|unshift\()/.test(code)) tips.push('Removing or inserting at the **front** of a list or array is O(n). Use a deque or queue.');
    if (/\+=\s*["'`]/.test(code) || /\+\s*=\s*str\(/.test(code)) tips.push('String concatenation in a loop can be O(n²). Use «join» or a StringBuilder.');
    if (!tips.length) return cx.label === 'O(1)' || cx.label === 'O(log n)' ? '> [!success] That is already very efficient.' : '';
    return '### 🚀 How to make it faster\n' + tips.map((t) => '- ' + t).join('\n');
  }

  function unknownError(ctx) {
    const line = (ctx.errorText || ctx.prose).split('\n').map((l) => l.trim()).filter(Boolean).pop() || '';
    return [
      '## 🤔 I don\'t recognise this exact error yet',
      '> «' + U.truncate(line.replace(/[`«»]/g, "'"), 160) + '»',
      'Here is how to decode **any** error message:',
      '1. **Read the last line** (Python/JS) or the **first line** (Java). It names the error type and gives a short reason.',
      '2. **Find the line number in your own file** and look at that line *and the one above it*.',
      '3. **Search for the error type**: the name (like «TypeError» or «NullPointerException») tells you the category of mistake.',
      '4. **Print the values** of the variables used on that line just before it runs.',
      '**Send me your code too**, and I\'ll run my analyzer on it and point at the likely problem.',
      ask('How to read a stack trace', 'How do I read an error message?') + ' ' + ask('How to debug', 'How do I debug my code?'),
      '> [!note] Want answers to anything?\n> You can connect a **local AI model** (Ollama or LM Studio) in **Settings → AI Engine**. It still runs fully offline.'
    ].join('\n\n');
  }

  function unknownQuestion(ctx, hits) {
    const closest = hits.slice(0, 4).map((h) => ask((h.e.title || '').replace(/[«»]/g, ''), h.e.type === 'concept' ? 'Explain ' + h.e.title : (h.e.title || '').replace(/[«»]/g, '')));
    return [
      '## 🤔 I\'m not sure about that one',
      'My offline knowledge base didn\'t find a confident match for *"' + U.truncate(ctx.prose.replace(/[`«»*_]/g, ''), 120) + '"*.',
      closest.length ? '**Closest topics I know well:** ' + closest.join(' ') : '',
      '**To help me help you:**\n- Paste the **exact error message** (the whole thing)\n- Share your **code** in a code block and mention the **language**\n- Tell me what you **expected** vs what **happened**\n- Or ask about a concept: *"explain closures"*, *"difference between stack and queue"*',
      '> [!note] Want open-ended answers?\n> Connect a **local AI model** in **Settings → AI Engine** (Ollama or LM Studio). It still runs 100% offline on your computer.'
    ].filter(Boolean).join('\n\n');
  }

  /** Context for the optional local LLM: retrieved KB facts + analyzer findings. */
  B.contextFor = function (text, langPref) {
    const ctx = B.parse(text);
    ctx.lang = (ANALYZABLE.has(ctx.codeLang) ? ctx.codeLang : null) || (ctx.code ? AN.detectLanguage(ctx.code).lang : null) || errorLang(ctx.errorText) || (langPref && langPref !== 'auto' ? langPref : null) || langMention(ctx.prose);
    const bits = [];
    if (ctx.errorText) {
      const m = B.matchErrors(ctx.errorText, ctx.lang)[0];
      if (m) bits.push('Known error "' + m.e.title.replace(/[«»]/g, '') + '": ' + substitute(m.e.what, m.m, m.e) + ' Causes: ' + m.e.causes.slice(0, 4).map((c) => substitute(c, m.m, m.e)).join(' | ') + ' Concept: ' + m.e.concept);
      const ln = errorLine(ctx.errorText); if (ln) bits.push('The error points at line ' + ln + '.');
    }
    if (ctx.code) {
      const a = AN.analyze(ctx.code, ctx.lang);
      if (a.issues.length) bits.push('Static analysis of the student\'s ' + U.langName(a.lang) + ' code found: ' + a.issues.slice(0, 6).map((i) => 'line ' + i.line + ': ' + i.title + ' (' + i.detail + ')').join('; '));
      const cx = AN.complexity(ctx.code, a.lang); bits.push('Estimated complexity: ' + cx.label + '.');
    }
    S.query(ctx.prose || ctx.errorText, { limit: 2 }).forEach((h) => {
      const e = h.e;
      if (h.score < 4) return;
      const txt = e.type === 'concept' ? e.title + ': ' + e.summary + ' ' + firstSection(e.explain || '').slice(0, 700) : e.type === 'error' ? e.title + ': ' + e.what : e.type === 'compare' ? e.title + ': ' + e.verdict : e.type === 'recipe' ? e.title + ': ' + e.approach : '';
      if (txt) bits.push('Reference: ' + txt.replace(/[«»]/g, '`'));
    });
    return { context: bits.join('\n').slice(0, 3500), lang: ctx.lang, hasCode: !!ctx.code };
  };

  B.renderConcept = (c, o) => finalize(renderConcept(c, Object.assign({ depth: 'deep', level: 'intermediate' }, o || {})));
  B.renderRecipe = (r, o) => finalize(renderRecipe(r, Object.assign({ depth: 'deep' }, o || {})).content);
  B.renderErrorEntry = (e, o) => finalize(renderError({ e, m: null }, { errorText: '', code: '', lang: e.lang }, Object.assign({ depth: 'deep', level: 'intermediate' }, o || {})).content);
  B.renderCompare = (c, o) => finalize(renderCompare(c, o || {}));
  B.finalize = finalize;
})();
