/* CodeMentor — offline static code analyzer.
   Detects language, finds common bugs with line numbers, proposes safe auto-fixes,
   estimates complexity and explains code line by line. Heuristic, never executes code. */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util;
  const A = (CM.analyzer = {});

  const W = (s) => new Set(s.split(/\s+/).filter(Boolean));
  const PY_KW = W('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case print');
  const PY_BI = W('print len range int str float list dict set tuple input open enumerate zip map filter sorted sum min max abs type isinstance super round any all reversed bool chr ord iter next format hasattr getattr setattr id hash pow divmod repr object Exception ValueError TypeError KeyError IndexError ZeroDivisionError NameError AttributeError RuntimeError StopIteration NotImplementedError FileNotFoundError ImportError KeyboardInterrupt exit quit help dir vars globals locals callable classmethod staticmethod property issubclass bytes bytearray frozenset complex slice __name__ __file__ __init__ self cls math random sys os time datetime collections itertools functools heapq bisect re json string copy deque Counter defaultdict lru_cache')
  ;
  const JS_KW = W('break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return super switch this throw try typeof var void while with yield async await static get set from as true false null undefined NaN Infinity');
  const JS_BI = W('console document window Math JSON Array Object String Number Boolean Promise Map Set WeakMap WeakSet Date RegExp Error TypeError RangeError SyntaxError parseInt parseFloat isNaN isFinite setTimeout setInterval clearTimeout clearInterval fetch require module exports process localStorage sessionStorage alert prompt confirm globalThis Symbol BigInt Intl navigator location history event arguments structuredClone queueMicrotask URL URLSearchParams Blob FileReader performance crypto Response Request Headers AbortController Buffer __dirname __filename React useState useEffect');
  const JS_MEMBERS = ['log', 'error', 'warn', 'info', 'table', 'getElementById', 'getElementsByClassName', 'getElementsByTagName', 'querySelector', 'querySelectorAll', 'addEventListener', 'removeEventListener', 'createElement', 'appendChild', 'append', 'prepend', 'removeChild', 'remove', 'innerHTML', 'innerText', 'textContent', 'classList', 'setAttribute', 'getAttribute', 'value', 'style', 'length', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'map', 'filter', 'reduce', 'forEach', 'find', 'findIndex', 'includes', 'indexOf', 'lastIndexOf', 'join', 'split', 'reverse', 'sort', 'concat', 'some', 'every', 'keys', 'values', 'entries', 'toUpperCase', 'toLowerCase', 'trim', 'replace', 'replaceAll', 'substring', 'charAt', 'charCodeAt', 'startsWith', 'endsWith', 'padStart', 'repeat', 'toString', 'toFixed', 'parse', 'stringify', 'floor', 'ceil', 'round', 'random', 'max', 'min', 'abs', 'sqrt', 'pow', 'then', 'catch', 'finally', 'json', 'preventDefault', 'stopPropagation', 'target', 'hasOwnProperty', 'assign', 'freeze', 'isArray', 'from', 'getItem', 'setItem', 'removeItem', 'focus', 'click', 'submit', 'getContext', 'fillRect', 'fillText', 'contains', 'toggle', 'add', 'dataset', 'children', 'parentElement', 'nextElementSibling', 'closest', 'matches', 'scrollIntoView', 'insertAdjacentHTML', 'cloneNode', 'getBoundingClientRect'];
  const JAVA_TYPES = W('int long short byte char float double boolean void String Integer Double Boolean Character Long Float Object List ArrayList LinkedList Map HashMap TreeMap Set HashSet TreeSet Scanner System Math Arrays Collections StringBuilder Exception Random Queue Deque ArrayDeque Stack PriorityQueue Iterator Optional Thread Runnable');
  const JAVA_UTIL = ['Scanner', 'ArrayList', 'LinkedList', 'HashMap', 'TreeMap', 'HashSet', 'TreeSet', 'List', 'Map', 'Set', 'Arrays', 'Collections', 'Random', 'Queue', 'Deque', 'ArrayDeque', 'Stack', 'PriorityQueue', 'Iterator', 'Optional'];

  /* ------------------------------------------------------------------ */
  /* language detection                                                  */
  /* ------------------------------------------------------------------ */
  A.detectLanguage = function (code) {
    const s = String(code || '');
    const score = { python: 0, javascript: 0, typescript: 0, java: 0, c: 0, cpp: 0, csharp: 0, sql: 0, html: 0, css: 0 };
    const add = (lang, re, pts) => { if (re.test(s)) score[lang] += pts; };
    add('python', /^\s*def \w+\s*\(.*\)\s*(->\s*[\w\[\], ]+)?:\s*$/m, 5);
    add('python', /^\s*(import \w+|from [\w.]+ import )/m, 3);
    add('python', /\bprint\s*\(/, 1);
    add('python', /^\s*(if|elif|for|while|with|try|except|else)\b.*:\s*$/m, 3);
    add('python', /\bself\b/, 2);
    add('python', /\belif\b/, 4);
    add('python', /\b(None|True|False)\b/, 1);
    add('python', /\binput\s*\(/, 1);
    add('python', /^\s*#(?!include|define|pragma)/m, 1);
    add('python', /\brange\s*\(/, 2);
    add('python', /\b(len|str|int)\s*\(/, 1);
    add('javascript', /\b(const|let|var)\s+[\w${}\[\], ]+\s*=/, 3);
    add('javascript', /\bfunction\s*\w*\s*\(/, 3);
    add('javascript', /=>/, 2);
    add('javascript', /\bconsole\.(log|error|warn)\s*\(/, 5);
    add('javascript', /\b(document|window)\./, 4);
    add('javascript', /\brequire\s*\(|module\.exports|export\s+default|import\s+.+\s+from\s+['"]/, 3);
    add('javascript', /===|!==/, 2);
    add('typescript', /:\s*(string|number|boolean|any|void)\b[^\n]*[=;,)]/, 4);
    add('typescript', /\binterface\s+\w+\s*\{|\btype\s+\w+\s*=/, 3);
    add('java', /\bpublic\s+(static\s+)?(final\s+)?(class|void|int|String)\b/, 3);
    add('java', /\bSystem\.out\.print/, 6);
    add('java', /String\[\]\s*\w+|String\s+\w+\[\]/, 4);
    add('java', /^\s*import java\./m, 6);
    add('java', /@Override/, 3);
    add('java', /\bnew\s+Scanner\s*\(/, 4);
    add('java', /\b(ArrayList|HashMap)\s*</, 3);
    add('c', /#include\s*<(stdio|stdlib|string|math|ctype|limits)\.h>/, 6);
    add('c', /\bprintf\s*\(/, 3);
    add('c', /\bscanf\s*\(/, 4);
    add('c', /\bint\s+main\s*\(/, 2);
    add('c', /\bmalloc\s*\(|\bfree\s*\(/, 2);
    add('cpp', /#include\s*<(iostream|vector|string|bits\/stdc\+\+\.h|algorithm|map|set|unordered_map|queue|stack|cmath)>/, 7);
    add('cpp', /\bstd::|using\s+namespace\s+std/, 6);
    add('cpp', /\bcout\s*<<|\bcin\s*>>/, 6);
    add('cpp', /\bvector\s*</, 3);
    add('csharp', /\busing\s+System;|Console\.(WriteLine|ReadLine)|namespace\s+\w+/, 6);
    add('sql', /^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/im, 7);
    add('sql', /\bFROM\s+\w+(\s+\w+)?\s+(WHERE|JOIN|GROUP|ORDER)\b/i, 3);
    add('html', /<(!DOCTYPE|html|head|body|div|span|p|h[1-6]|script|style|form|input|button|ul|li|a)\b[^>]*>/i, 6);
    add('css', /(^|\})\s*[.#]?[\w-]+(\s*[,>+~]?\s*[.#]?[\w-]+)*\s*\{\s*[\w-]+\s*:\s*[^;{}]+;/m, 4);
    if (score.cpp > 0) score.c = Math.max(0, score.c - 3);
    if (score.typescript > 0) score.typescript += score.javascript;
    if (score.html > 4) { score.javascript *= 0.5; score.css *= 0.4; }
    let best = null, bestScore = 1.5;
    for (const k in score) if (score[k] > bestScore) { best = k; bestScore = score[k]; }
    return { lang: best, score: bestScore, scores: score };
  };

  /* ------------------------------------------------------------------ */
  /* stripping strings & comments (keeps length/newlines)                */
  /* ------------------------------------------------------------------ */
  A.strip = function (code, lang) {
    const s = String(code);
    const hashComments = lang === 'python' || lang === 'bash';
    const out = [];
    const unterminated = []; // line numbers with unterminated single-line strings
    let i = 0, line = 1;
    const n = s.length;
    const blank = (ch) => (ch === '\n' ? '\n' : ' ');
    while (i < n) {
      const ch = s[i], nx = s[i + 1];
      if (ch === '\n') { out.push('\n'); line++; i++; continue; }
      if (hashComments && ch === '#') { while (i < n && s[i] !== '\n') { out.push(' '); i++; } continue; }
      if (!hashComments && ch === '/' && nx === '/') { while (i < n && s[i] !== '\n') { out.push(' '); i++; } continue; }
      if (!hashComments && ch === '/' && nx === '*') {
        out.push(' ', ' '); i += 2;
        while (i < n && !(s[i] === '*' && s[i + 1] === '/')) { if (s[i] === '\n') line++; out.push(blank(s[i])); i++; }
        if (i < n) { out.push(' ', ' '); i += 2; }
        continue;
      }
      if (lang === 'python' && (ch === '"' || ch === "'") && s.substr(i, 3) === ch.repeat(3)) {
        const q = ch.repeat(3);
        out.push(q); i += 3;
        while (i < n && s.substr(i, 3) !== q) { if (s[i] === '\n') line++; out.push(blank(s[i])); i++; }
        if (i < n) { out.push(q); i += 3; }
        continue;
      }
      if (ch === '"' || ch === "'" || (ch === '`' && (lang === 'javascript' || lang === 'typescript'))) {
        const q = ch;
        const startLine = line;
        out.push(q); i++;
        let closed = false;
        while (i < n) {
          const c = s[i];
          if (c === '\\') { out.push(' '); if (i + 1 < n) out.push(blank(s[i + 1])); if (s[i + 1] === '\n') line++; i += 2; continue; }
          if (c === q) { out.push(q); i++; closed = true; break; }
          if (c === '\n' && q !== '`') break;
          if (c === '\n') line++;
          out.push(blank(c)); i++;
        }
        if (!closed && q !== '`') unterminated.push(startLine);
        continue;
      }
      out.push(ch); i++;
    }
    return { text: out.join(''), unterminated };
  };

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */
  const indentOf = (l) => { const m = l.match(/^[ \t]*/)[0]; return m.replace(/\t/g, '    ').length; };
  const nextNonEmpty = (lines, i) => { for (let k = i + 1; k < lines.length; k++) if (lines[k].trim()) return k; return -1; };
  const prevNonEmpty = (lines, i) => { for (let k = i - 1; k >= 0; k--) if (lines[k].trim()) return k; return -1; };

  function bracketCheck(stripped, issues, lang) {
    const pairs = { ')': '(', ']': '[', '}': '{' };
    const names = { '(': 'parenthesis «(»', '[': 'bracket «[»', '{': 'brace «{»' };
    const stack = [];
    let line = 1;
    for (let i = 0; i < stripped.length; i++) {
      const c = stripped[i];
      if (c === '\n') { line++; continue; }
      if (c === '(' || c === '[' || c === '{') stack.push({ c, line });
      else if (c === ')' || c === ']' || c === '}') {
        const top = stack[stack.length - 1];
        if (!top) { issues.push({ line, severity: 'error', title: 'Extra closing «' + c + '»', detail: 'There is a «' + c + '» on line ' + line + ' with no matching opening «' + pairs[c] + '».' }); continue; }
        if (top.c !== pairs[c]) {
          issues.push({ line, severity: 'error', title: 'Mismatched brackets', detail: 'Line ' + line + ' closes with «' + c + '», but the most recent unclosed bracket is the ' + names[top.c] + ' from line ' + top.line + '.' });
          stack.pop();
          continue;
        }
        stack.pop();
      }
    }
    stack.slice(0, 3).forEach((u) => issues.push({ line: u.line, severity: 'error', title: 'Unclosed ' + names[u.c], detail: 'The ' + names[u.c] + ' opened on line ' + u.line + ' is never closed.' + (lang === 'python' ? ' Python will report this as «\'' + u.c + '\' was never closed».' : '') }));
    return stack.length === 0;
  }

  /** Collects identifiers defined in the code (variables, functions, params, imports, classes). */
  A.definedNames = function (stripped, lang) {
    const set = new Set();
    const addList = (s) => String(s || '').split(/[\s,()*&\[\]{}:=]+/).forEach((x) => { x = x.replace(/^\.\.\./, ''); if (/^[A-Za-z_$][\w$]*$/.test(x)) set.add(x); });
    let m;
    if (lang === 'python') {
      const res = [
        /^\s*([A-Za-z_][\w]*(?:\s*,\s*[A-Za-z_][\w]*)*)\s*(?:[+\-*\/%]|\/\/|\*\*)?=(?!=)/gm,
        /\bfor\s+([\w\s,()]+?)\s+in\b/g, /\bdef\s+(\w+)\s*\(([^)]*)\)/g, /\bclass\s+(\w+)/g, /\bimport\s+([\w.,\s]+?)(?:\n|$)/g,
        /\bfrom\s+[\w.]+\s+import\s+([\w,\s()*]+?)(?:\n|$)/g, /\bas\s+(\w+)/g, /\blambda\s+([^:]*):/g, /\bglobal\s+([\w,\s]+)/g, /\bnonlocal\s+([\w,\s]+)/g
      ];
      res.forEach((re) => { while ((m = re.exec(stripped))) { addList(m[1]); if (m[2]) m[2].split(',').forEach((p) => addList(p.split('=')[0].split(':')[0])); } });
      // import a.b -> a
      [...set].forEach((x) => { if (x.indexOf('.') > 0) set.add(x.split('.')[0]); });
    } else if (lang === 'javascript' || lang === 'typescript') {
      const res = [/\b(?:const|let|var)\s+([^=;]+?)(?:=|;|\bof\b|\bin\b)/g, /\bfunction\s*\*?\s*(\w*)\s*\(([^)]*)\)/g, /\bclass\s+(\w+)/g, /\bcatch\s*\(\s*(\w+)/g,
        /\(([^()]*)\)\s*=>/g, /(\w+)\s*=>/g, /\bimport\s+([\w\s{},*]+?)\s+from/g, /^\s*(\w+)\s*\(([^)]*)\)\s*\{/gm];
      res.forEach((re) => { while ((m = re.exec(stripped))) { addList(m[1]); if (m[2]) addList(m[2]); } });
    } else {
      const res = [/\b(?:int|long|short|char|float|double|bool|boolean|void|String|auto|var|unsigned|signed|size_t|string|byte|Integer|Double|Scanner|[A-Z]\w*(?:<[^>]*>)?(?:\[\])*)\s*[*&]?\s+([A-Za-z_]\w*)\s*(?=[=;,\[)(])/g,
        /\b(?:int|long|short|char|float|double|bool|boolean|String|auto|string)\s*[*&]?\s*\w+\s*(?:\[[^\]]*\])?\s*(?:=[^,;]*)?,\s*([A-Za-z_]\w*)/g,
        /\bclass\s+(\w+)/g, /\bstruct\s+(\w+)/g, /#define\s+(\w+)/g, /\bfor\s*\(\s*(?:int|auto|long|char|String|var)\s+(\w+)/g];
      res.forEach((re) => { while ((m = re.exec(stripped))) addList(m[1]); });
    }
    return set;
  };

  function usedNames(stripped, lang) {
    const out = [];
    const lines = stripped.split('\n');
    lines.forEach((l, idx) => {
      const re = /(^|[^\w$.])([A-Za-z_$][\w$]*)(?![\w$])/g;
      let m;
      while ((m = re.exec(l))) {
        const name = m[2];
        const after = l.slice(m.index + m[0].length);
        const before = l.slice(0, m.index + m[1].length);
        if (/^\s*=(?!=)/.test(after) && /[(,]\s*$/.test(before)) continue;       // keyword argument
        if (/^\s*:/.test(after) && /[{,]\s*$/.test(before) && lang !== 'python') continue; // object key
        out.push({ name, line: idx + 1 });
      }
    });
    return out;
  }

  function typoCheck(stripped, lang, issues, defined) {
    const kw = lang === 'python' ? PY_KW : JS_KW;
    const bi = lang === 'python' ? PY_BI : JS_BI;
    const known = new Set([...defined, ...bi]);
    const pool = [...known];
    const reported = new Set();
    let unknownInfo = 0;
    for (const u of usedNames(stripped, lang)) {
      if (kw.has(u.name) || known.has(u.name) || reported.has(u.name)) continue;
      reported.add(u.name);
      const guess = U.closest(u.name, pool, u.name.length > 6 ? 2 : 1);
      const plural = guess && (u.name === guess + 's' || guess === u.name + 's' || u.name === guess + 'es');
      if (guess && !plural) {
        const builtinGuess = bi.has(guess) && !defined.has(guess);
        const errMsg = lang === 'python' ? 'This will raise «NameError: name \'' + u.name + '\' is not defined».' : 'This will throw «ReferenceError: ' + u.name + ' is not defined».';
        issues.push(builtinGuess ? {
          line: u.line, severity: 'error', kind: 'typo', name: u.name, guess,
          title: '«' + u.name + '» is not defined — did you mean «' + guess + '»?',
          detail: errMsg + ' Names are case-sensitive and must match exactly.',
          replace: { from: u.name, to: guess }
        } : {
          line: u.line, severity: 'warning', kind: 'maybe-typo', name: u.name, guess,
          title: '«' + u.name + '» is not defined here — did you mean «' + guess + '»?',
          detail: errMsg + ' If «' + u.name + '» is defined somewhere else (another file, or code you didn\'t paste), you can ignore this.'
        });
      } else if (lang === 'python' && unknownInfo < 2 && stripped.split('\n').length > 2) {
        unknownInfo++;
        issues.push({ line: u.line, severity: 'info', kind: 'undefined', name: u.name, title: '«' + u.name + '» is used but never defined in this snippet', detail: 'If it is not defined elsewhere (another file or an import), Python will raise a NameError here.' });
      }
    }
  }

  /** Splits a C-like condition region "( ... )" starting at index of "(" */
  function parenContent(str, start) {
    let depth = 0;
    for (let i = start; i < str.length; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') { depth--; if (depth === 0) return str.slice(start + 1, i); }
    }
    return null;
  }
  function hasAssignment(cond) {
    let depth = 0;
    for (let i = 0; i < cond.length; i++) {
      const c = cond[i];
      if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') depth--;
      else if (c === '=' && depth === 0) {
        const p = cond[i - 1], nx = cond[i + 1];
        if (nx === '=' || p === '=' || p === '!' || p === '<' || p === '>' || p === ':' || p === '+' || p === '-' || p === '*' || p === '/' || p === '%' || p === '&' || p === '|' || p === '^') { if (nx === '=') i++; continue; }
        if (nx === '>') continue; // =>
        return true;
      }
    }
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* Python checks                                                       */
  /* ------------------------------------------------------------------ */
  function checkPython(code, st, issues) {
    const raw = code.split('\n');
    const lines = st.split('\n');
    const BLOCK = /^\s*(if|elif|else|for|while|def|class|try|except|finally|with|async\s+def|async\s+for|async\s+with)\b/;
    let depth = 0; // bracket depth carried across lines
    const indentStack = [0];
    let expectIndent = false, expectLine = 0;
    let classIndent = -1;
    let hasTabs = false, hasSpaces = false;
    const lineDepthStart = [];

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const t = l.trim();
      lineDepthStart[i] = depth;
      const lead = (raw[i].match(/^[ \t]*/) || [''])[0];
      if (t && lead.indexOf('\t') >= 0) hasTabs = true;
      if (t && / /.test(lead)) hasSpaces = true;
      const startDepth = depth;
      for (const c of l) { if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) depth = Math.max(0, depth - 1); }
      if (!t) continue;
      const ind = indentOf(raw[i]);
      const continuation = startDepth > 0 || (i > 0 && /\\\s*$/.test(lines[i - 1]));

      if (!continuation) {
        // indentation structure
        if (expectIndent) {
          if (ind <= indentStack[indentStack.length - 1]) {
            issues.push({ line: i + 1, severity: 'error', title: 'Expected an indented block', detail: 'Line ' + expectLine + ' ends with «:», so the next line must be indented (usually 4 spaces more). Python will raise «IndentationError: expected an indented block».', patch: { line: i + 1, text: ' '.repeat(indentStack[indentStack.length - 1] + 4) + raw[i].trimStart() } });
          } else indentStack.push(ind);
          expectIndent = false;
        } else if (ind > indentStack[indentStack.length - 1]) {
          issues.push({ line: i + 1, severity: 'error', title: 'Unexpected indent', detail: 'This line is indented more than the line before it, but the previous line does not start a block (it does not end with «:»).', patch: { line: i + 1, text: ' '.repeat(indentStack[indentStack.length - 1]) + raw[i].trimStart() } });
        } else if (ind < indentStack[indentStack.length - 1]) {
          while (indentStack.length > 1 && ind < indentStack[indentStack.length - 1]) indentStack.pop();
          if (ind !== indentStack[indentStack.length - 1]) issues.push({ line: i + 1, severity: 'error', title: 'Indentation does not match any outer level', detail: 'When you un-indent, you must go back to exactly the same indentation as an earlier block (IndentationError: unindent does not match any outer indentation level).' });
        }
        if (classIndent >= 0 && ind <= classIndent && !/^\s*class\b/.test(l)) classIndent = -1;

        // block statements need a colon
        if (BLOCK.test(l)) {
          const endsColon = /:\s*$/.test(t);
          const oneLiner = (() => { let d = 0; for (let k = 0; k < t.length; k++) { const c = t[k]; if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; else if (c === ':' && d === 0 && k < t.length - 1 && !/^(lambda)/.test(t)) return true; } return false; })();
          const continuesNext = depth > 0 || /\\\s*$/.test(t);
          if (!endsColon && !oneLiner && !continuesNext) {
            const kwd = t.match(/^(\w+)/)[1];
            issues.push({ line: i + 1, severity: 'error', title: 'Missing «:» after «' + kwd + '»', detail: 'Lines starting with «' + kwd + '» must end with a colon. Python will report «SyntaxError: expected \':\'».', patch: { line: i + 1, text: raw[i].replace(/\s*(#.*)?$/, (m0, c) => ':' + (c ? '  ' + c : '')) } });
            expectIndent = true; expectLine = i + 1;
          } else if (endsColon && !continuesNext) { expectIndent = true; expectLine = i + 1; }
        }
        if (/^\s*class\b/.test(l)) classIndent = ind;
        // method without self
        if (classIndent >= 0 && ind > classIndent) {
          const dm = t.match(/^def\s+(\w+)\s*\(\s*([^)]*)\)/);
          if (dm) {
            const prev = prevNonEmpty(lines, i);
            const isStatic = prev >= 0 && /@staticmethod/.test(raw[prev]);
            const first = dm[2].split(',')[0].trim().split(/[:=]/)[0].trim();
            if (!isStatic && first !== 'self' && first !== 'cls' && !(prev >= 0 && /@classmethod/.test(raw[prev]))) {
              issues.push({ line: i + 1, severity: 'error', title: 'Method «' + dm[1] + '» is missing «self»', detail: 'Methods inside a class receive the object automatically as the first argument. Without «self», calling «obj.' + dm[1] + '()» raises «TypeError: ' + dm[1] + '() takes ' + (dm[2].trim() ? 'N' : '0') + ' positional arguments but ' + (dm[2].trim() ? 'N+1' : '1') + ' was given».', patch: { line: i + 1, text: raw[i].replace(/\(\s*/, dm[2].trim() ? '(self, ' : '(self') } });
            }
          }
        }
      }

      // line-level checks
      let m;
      if ((m = t.match(/^else\s+if\b(.*)$/))) issues.push({ line: i + 1, severity: 'error', title: 'Use «elif» instead of «else if»', detail: 'Python spells it «elif».', patch: { line: i + 1, text: raw[i].replace(/else\s+if/, 'elif') } });
      if ((m = t.match(/^(if|elif|while)\s+(.*?):?\s*$/)) && hasAssignment(m[2]) && !/:=/.test(m[2])) issues.push({ line: i + 1, severity: 'error', title: '«=» used in a condition', detail: '«=» assigns a value. To compare, use «==». Python raises «SyntaxError: invalid syntax. Maybe you meant \'==\'…»', patch: { line: i + 1, text: raw[i].replace(/([^=!<>:+\-*\/%])=([^=])/, '$1==$2') } });
      if (/&&|\|\|/.test(l)) issues.push({ line: i + 1, severity: 'error', title: 'Use «and» / «or» instead of «&&» / «||»', detail: 'Python uses English words for logical operators.', patch: { line: i + 1, text: raw[i].replace(/\s*&&\s*/g, ' and ').replace(/\s*\|\|\s*/g, ' or ') } });
      if (/(^|[^!=<>])!(?!=)\s*[\w(]/.test(l)) issues.push({ line: i + 1, severity: 'error', title: 'Use «not» instead of «!»', detail: 'In Python, write «not x» rather than «!x».' });
      if ((m = l.match(/(\w+)(\+\+|--)/)) || (m = l.match(/(\+\+|--)(\w+)/))) issues.push({ line: i + 1, severity: 'error', title: 'Python has no «++» / «--»', detail: 'Use «x += 1» or «x -= 1».', patch: /(\w+)(\+\+|--)/.test(raw[i]) ? { line: i + 1, text: raw[i].replace(/(\w+)\+\+/, '$1 += 1').replace(/(\w+)--/, '$1 -= 1') } : null });
      if (/(^|[^\w.])(true|false|null)(?![\w])/.test(l)) { const w = l.match(/(^|[^\w.])(true|false|null)(?![\w])/)[2]; const fixW = { true: 'True', false: 'False', null: 'None' }[w]; issues.push({ line: i + 1, severity: 'error', title: '«' + w + '» should be «' + fixW + '»', detail: 'Python booleans are capitalised and its null value is «None».', patch: { line: i + 1, text: raw[i].replace(new RegExp('\\b' + w + '\\b'), fixW) } }); }
      if (/^print\s+[^\s(=]/.test(t)) issues.push({ line: i + 1, severity: 'error', title: 'Python 2 style «print»', detail: 'In Python 3, print is a function: «print(...)».', patch: { line: i + 1, text: raw[i].replace(/print\s+(.*?)\s*$/, 'print($1)') } });
      if (/\bdef\s+\w+\s*\([^)]*=\s*(\[\]|\{\}|set\(\))/.test(l)) issues.push({ line: i + 1, severity: 'warning', title: 'Mutable default argument', detail: 'A default like «[]» is created once and shared by all calls. Use «None» and create the list inside the function.' });
      if (/[!=]=\s*None\b/.test(l)) issues.push({ line: i + 1, severity: 'info', title: 'Compare with «is None»', detail: 'Use «x is None» / «x is not None» to check for None.' });
      if (/range\s*\(\s*len\s*\([^)]*\)\s*\+\s*1\s*\)/.test(l)) issues.push({ line: i + 1, severity: 'warning', title: 'Possible off-by-one: «range(len(x) + 1)»', detail: 'Indexes of a list of length n go from 0 to n-1, so «x[len(x)]» raises IndexError.', patch: { line: i + 1, text: raw[i].replace(/range\s*\(\s*len\s*\(([^)]*)\)\s*\+\s*1\s*\)/, 'range(len($1))') } });
      if ((m = t.match(/^(list|dict|str|sum|max|min|input|type|len|id|set|print)\s*=[^=]/))) issues.push({ line: i + 1, severity: 'warning', title: 'Shadowing the built-in «' + m[1] + '»', detail: 'After this line, «' + m[1] + '(...)» no longer refers to Python\'s built-in function, which can cause «TypeError: \'…\' object is not callable».' });
      if (/\.sort\(\)/.test(l) && /=\s*\w+\.sort\(\)/.test(l)) issues.push({ line: i + 1, severity: 'error', title: '«list.sort()» returns None', detail: 'It sorts in place. Use «x.sort()» on its own line, or «y = sorted(x)».' });
    }
    if (hasTabs && hasSpaces) issues.push({ line: 1, severity: 'warning', title: 'Mixed tabs and spaces', detail: 'Mixing tabs and spaces for indentation can cause «TabError». Configure your editor to use 4 spaces.' });
    if (expectIndent) issues.push({ line: expectLine, severity: 'error', title: 'Block has no body', detail: 'Line ' + expectLine + ' ends with «:» but nothing indented follows. Add the body, or «pass».' });

    // input() used as a number
    const inputVars = [];
    let m;
    const reInput = /^\s*(\w+)\s*=\s*input\s*\(/gm;
    while ((m = reInput.exec(st))) inputVars.push(m[1]);
    inputVars.forEach((v) => {
      const re = new RegExp('(\\b' + v + '\\s*[-*/%]|[-*/%]\\s*' + v + '\\b|\\b' + v + '\\s*\\+\\s*\\d|\\d\\s*\\+\\s*' + v + '\\b|\\b' + v + '\\s*[<>]=?\\s*\\d|range\\s*\\(\\s*' + v + '\\s*\\))');
      lines.forEach((l, i) => {
        if (re.test(l) && !new RegExp('\\b(int|float)\\s*\\(\\s*' + v).test(l)) issues.push({ line: i + 1, severity: 'error', title: '«' + v + '» is a string (from input()), not a number', detail: '«input()» always returns text. Convert it first: «' + v + ' = int(input(...))». Otherwise you will get a TypeError.' });
      });
    });

    // input().split() gives a list of STRINGS: a very common cause of TypeError in arithmetic
    const hasMath = /\bsum\s*\(|\bmax\s*\(|\bmin\s*\(|[+\-*/%]\s*[\w(]|\+=|\bsorted\s*\(/.test(st);
    raw.forEach((l, i) => {
      const sm = l.match(/^(\s*)([A-Za-z_]\w*)\s*=\s*input\s*\((.*?)\)\s*\.split\s*\((.*?)\)\s*(#.*)?$/);
      if (sm && hasMath) issues.push({ line: i + 1, severity: 'warning', title: '«' + sm[2] + '» is a list of strings, not numbers', detail: '«input().split()» returns text pieces like [\'4\', \'7\']. Adding or averaging them raises «TypeError: unsupported operand type(s)…». Convert each piece: «list(map(int, input().split()))».', patch: { line: i + 1, text: sm[1] + sm[2] + ' = list(map(int, input(' + sm[3] + ').split(' + sm[4] + ')))' + (sm[5] ? '  ' + sm[5] : '') } });
    });

    // modifying a list while iterating it
    lines.forEach((l, i) => {
      const fm = l.match(/^\s*for\s+\w+\s+in\s+(\w+)\s*:/);
      if (!fm) return;
      const base = indentOf(raw[i]);
      for (let k = i + 1; k < lines.length; k++) {
        if (!lines[k].trim()) continue;
        if (indentOf(raw[k]) <= base) break;
        if (new RegExp('\\b' + fm[1] + '\\.(remove|append|pop|insert)\\s*\\(').test(lines[k])) { issues.push({ line: k + 1, severity: 'warning', title: 'Modifying «' + fm[1] + '» while looping over it', detail: 'Removing or adding items to a list while iterating over it skips elements or loops forever. Iterate over a copy («for x in ' + fm[1] + '[:]») or build a new list.' }); break; }
      }
    });
    whileCheck(raw, lines, issues, 'python');
  }

  /* infinite-loop heuristics (shared) */
  function whileCheck(raw, lines, issues, lang) {
    lines.forEach((l, i) => {
      let cond = null;
      if (lang === 'python') { const m = l.match(/^\s*while\s+(.+?):\s*$/); if (m) cond = m[1]; }
      else { const m = l.match(/\bwhile\s*\(/); if (m && !/\}\s*while/.test(l)) cond = parenContent(l, l.indexOf('(', m.index)); }
      if (!cond) return;
      const body = [];
      if (lang === 'python') {
        const base = indentOf(raw[i]);
        for (let k = i + 1; k < lines.length; k++) { if (!lines[k].trim()) continue; if (indentOf(raw[k]) <= base) break; body.push(lines[k]); }
      } else {
        let depth = 0, started = false;
        for (let k = i; k < lines.length && k < i + 200; k++) {
          const seg = k === i ? lines[k].slice(lines[k].indexOf(cond) + cond.length) : lines[k];
          for (const c of seg) { if (c === '{') { depth++; started = true; } else if (c === '}') depth--; }
          body.push(seg);
          if (started && depth <= 0) break;
          if (!started && k > i && /;/.test(seg)) break;
        }
      }
      const text = body.join('\n');
      if (/^\s*(True|true|1)\s*$/.test(cond)) {
        if (!/\b(break|return|exit|sys\.exit)\b/.test(text)) issues.push({ line: i + 1, severity: 'warning', title: 'Infinite loop', detail: 'This loop runs forever: the condition is always true and there is no «break» or «return» inside.' });
        return;
      }
      const vars = (cond.match(/[A-Za-z_]\w*/g) || []).filter((v) => !/^(and|or|not|in|is|len|True|False|None|true|false|null|size|length)$/.test(v));
      if (!vars.length) return;
      const changed = vars.some((v) => new RegExp('\\b' + v + '\\s*([-+*/%]?=(?!=)|\\+\\+|--)|(\\+\\+|--)\\s*' + v + '\\b|\\b' + v + '\\.(pop|append|remove|push|shift|add|clear|poll|next|readline)\\b|\\b(scanf|cin|input|getline|fgets)\\b').test(text));
      if (!changed && !/\b(break|return)\b/.test(text)) issues.push({ line: i + 1, severity: 'warning', title: 'Possible infinite loop', detail: 'Nothing inside this loop changes «' + vars.join('», «') + '», so the condition may stay true forever. Make sure the loop variable is updated.' });
    });
  }

  /* ------------------------------------------------------------------ */
  /* JavaScript checks                                                   */
  /* ------------------------------------------------------------------ */
  function jsSyntax(code) {
    let src = code.replace(/^\s*import\s[^;\n]*;?\s*$/gm, '').replace(/^\s*export\s+default\s+/gm, '').replace(/^\s*export\s+(?=(const|let|var|function|class|async))/gm, '');
    src = src.replace(/^\s*export\s*\{[^}]*\};?/gm, '');
    if (/<[A-Za-z][\w.]*(\s[^<>]*)?\/?>/.test(src) && /return\s*\(?\s*</.test(src)) return { ok: true, skipped: 'jsx' };
    const compile = (s) => {
      try { new Function(s); return null; } catch (e) {
        if (/await is only valid|await.*async function|Unexpected reserved word/i.test(e.message)) {
          try { const AF = Object.getPrototypeOf(async function () {}).constructor; new AF(s); return null; } catch (e2) { return e2; }
        }
        return e;
      }
    };
    const err = compile(src);
    if (!err) return { ok: true };
    const lines = src.split('\n');
    const incomplete = /end of input|Unexpected end of script|missing \} |expected expression, got end of script|Unterminated template|unterminated/i;
    let line = lines.length;
    for (let i = 1; i <= lines.length; i++) {
      const e = compile(lines.slice(0, i).join('\n'));
      if (e && !incomplete.test(e.message)) { line = i; break; }
    }
    return { ok: false, message: err.name + ': ' + err.message, line };
  }

  function checkJS(code, st, issues) {
    const raw = code.split('\n');
    const lines = st.split('\n');
    const syn = jsSyntax(code);
    if (!syn.ok) issues.push({ line: syn.line, severity: 'error', kind: 'syntax', title: 'Syntax error', detail: 'The JavaScript engine reports «' + syn.message + '» near line ' + syn.line + '. Nothing in this file can run until it is fixed.' });
    const consts = new Map();
    lines.forEach((l, i) => {
      let m;
      const re = /\bconst\s+([A-Za-z_$][\w$]*)\s*=/g;
      while ((m = re.exec(l))) if (!/for\s*\(\s*const/.test(l)) consts.set(m[1], i + 1);
    });
    lines.forEach((l, i) => {
      let m;
      const t = l.trim();
      if (/[^=!<>]==[^=]/.test(l) || /!=[^=]/.test(l)) issues.push({ line: i + 1, severity: 'info', title: 'Prefer «===» / «!==»', detail: '«==» converts types before comparing («"5" == 5» is true). Strict equality avoids surprises.', patch: { line: i + 1, text: raw[i].replace(/([^=!<>])==([^=])/g, '$1===$2').replace(/!=([^=])/g, '!==$1') } });
      if (/^\s*var\s/.test(l)) issues.push({ line: i + 1, severity: 'info', title: 'Use «let» or «const» instead of «var»', detail: '«var» is function-scoped and hoisted, which causes subtle bugs. Use «const» by default and «let» if you reassign.' });
      if ((m = l.match(/\b(if|while)\s*\(/))) { const c = parenContent(l, l.indexOf('(', m.index)); if (c && hasAssignment(c)) issues.push({ line: i + 1, severity: 'warning', title: 'Assignment inside a condition', detail: 'You wrote «=» inside «' + m[1] + '( … )». That assigns and is almost always a bug. Use «===» to compare.', patch: { line: i + 1, text: raw[i].replace(/([^=!<>+\-*\/%&|^])=([^=>])/, '$1===$2') } }); }
      if (/\.length\s*\(\s*\)/.test(l)) issues.push({ line: i + 1, severity: 'error', title: '«length» is a property, not a function', detail: 'Write «arr.length» / «str.length» without parentheses, or you get «TypeError: … .length is not a function».', patch: { line: i + 1, text: raw[i].replace(/\.length\s*\(\s*\)/g, '.length') } });
      if (/for\s*\([^;]*;\s*\w+\s*<=\s*[\w.]+\.length\s*;/.test(l)) issues.push({ line: i + 1, severity: 'warning', title: 'Off-by-one: «<= array.length»', detail: 'The last index is «length - 1», so the final iteration reads «undefined».', patch: { line: i + 1, text: raw[i].replace(/<=\s*([\w.]+\.length)/, '< $1') } });
      if (/\.forEach\s*\(\s*async\b/.test(l)) issues.push({ line: i + 1, severity: 'warning', title: '«await» inside «forEach» does not wait', detail: '«forEach» ignores the promises your callback returns. Use «for (const x of arr) { await … }» or «await Promise.all(arr.map(async …))».' });
      if ((m = l.match(/\b(\w+)\s*=\s*fetch\s*\(/)) && !/await\s+fetch/.test(l)) issues.push({ line: i + 1, severity: 'warning', title: 'Missing «await» before «fetch»', detail: '«fetch» returns a Promise. Without «await» (or «.then»), «' + m[1] + '» is a pending Promise, not the response.', patch: { line: i + 1, text: raw[i].replace(/=\s*fetch\s*\(/, '= await fetch(') } });
      // member typos
      const mre = /\.([A-Za-z_]\w{3,})\b/g;
      while ((m = mre.exec(l))) {
        const w = m[1];
        if (JS_MEMBERS.indexOf(w) >= 0) continue;
        const guess = U.closest(w, JS_MEMBERS, w.length >= 8 ? 2 : 1);
        if (guess && (guess.toLowerCase() === w.toLowerCase() || U.lev(guess, w) <= (w.length >= 8 ? 2 : 1))) {
          issues.push({ line: i + 1, severity: 'error', kind: 'typo', title: '«.' + w + '» — did you mean «.' + guess + '»?', detail: 'JavaScript is case-sensitive. A misspelled method is «undefined», so calling it throws «TypeError: … is not a function».', replace: { from: w, to: guess } });
        }
      }
      // const reassignment
      consts.forEach((declLine, name) => {
        if (i + 1 <= declLine) return;
        if (new RegExp('(^|[^\\w$.])' + name.replace(/\$/g, '\\$') + '\\s*([-+*/%]?=(?!=)|\\+\\+|--)').test(l) && !/\b(const|let|var)\s/.test(t.slice(0, 6))) issues.push({ line: i + 1, severity: 'error', title: 'Reassigning the constant «' + name + '»', detail: '«' + name + '» was declared with «const» on line ' + declLine + '. This throws «TypeError: Assignment to constant variable». Declare it with «let» instead.', patch: { line: declLine, text: raw[declLine - 1].replace(new RegExp('\\bconst(\\s+' + name.replace(/\$/g, '\\$') + '\\b)'), 'let$1') } });
      });
    });
    typoCheck(st, 'javascript', issues, A.definedNames(st, 'javascript'));
    whileCheck(raw, lines, issues, 'js');
  }

  /* ------------------------------------------------------------------ */
  /* Java / C / C++ shared checks                                        */
  /* ------------------------------------------------------------------ */
  function semicolonCheck(raw, lines, issues, lang) {
    const CONTROL = /^(if|for|while|else|do|switch|try|catch|finally|case|default|return\s*$)\b/;
    let depth = 0;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const startDepth = depth;
      for (const c of l) { if (c === '(') depth++; else if (c === ')') depth = Math.max(0, depth - 1); }
      const t = l.trim();
      if (!t || startDepth > 0 || depth > 0) continue;
      if (/^[#@]/.test(t) || /^(template\s*<|namespace\b|using\s+namespace\b[^;]*$)/.test(t)) continue;
      if (/[;{}:,\\]$/.test(t) || /^(\/\/|\*|\/\*)/.test(t)) continue;
      if (CONTROL.test(t)) continue;
      if (/^(public|private|protected)\s*:$/.test(t)) continue;
      if (!/[\w)\]"'+\-]$/.test(t)) continue;
      if (/[+\-]$/.test(t) && !/(\+\+|--)$/.test(t)) continue; // expression continues
      const nx = nextNonEmpty(lines, i);
      const nt = nx >= 0 ? lines[nx].trim() : '';
      if (/^[{.?:+\-*/%&|<>=]/.test(nt) && !/^(\+\+|--)/.test(nt)) continue;
      if (/\)$/.test(t) && /^(\w[\w<>,\[\]\s*&:]*\s+)?[\w:~]+\s*\([^;]*\)\s*(const|override|noexcept|throws\s+[\w,\s]+)?$/.test(t) && (nt.startsWith('{') || /^(public|private|protected|static|final|abstract|class|interface|enum)/.test(t))) continue;
      if (/\b(class|interface|enum|struct|union)\s+\w+/.test(t) && !/=/.test(t)) continue;
      if (/^(else|do|try|finally)$/.test(t)) continue;
      if (/(^|\s)(if|for|while|switch|catch)\s*\(.*\)$/.test(t)) continue;
      issues.push({ line: i + 1, severity: 'error', kind: 'semicolon', title: 'Missing «;» at the end of the line', detail: (lang === 'java' ? 'Java' : 'C/C++') + ' statements must end with a semicolon. The compiler usually reports this on the same line or the next one (e.g. «error: \';\' expected»).', patch: { line: i + 1, text: raw[i].replace(/(\s*)(\/\/.*)?$/, (m0, sp, com) => ';' + (com ? ' ' + com : '')) } });
    }
  }

  function cFamilyCommon(raw, lines, issues, lang) {
    lines.forEach((l, i) => {
      let m;
      if ((m = l.match(/\b(if|while)\s*\(/))) { const c = parenContent(l, l.indexOf('(', m.index)); if (c && hasAssignment(c)) issues.push({ line: i + 1, severity: 'warning', title: '«=» inside «' + m[1] + '( … )»', detail: 'A single «=» assigns, so the condition is (almost) always true. To compare, use «==».', patch: { line: i + 1, text: raw[i].replace(/([^=!<>+\-*\/%&|^])=([^=])/, '$1==$2') } }); }
      if ((m = l.match(/for\s*\([^;]*;\s*(\w+)\s*<=\s*([\w.]+(?:\.length|\.size\(\))?)\s*;/))) {
        const bound = m[2];
        if (/\.length|\.size\(\)/.test(bound) || new RegExp('\\[\\s*' + bound.replace(/\W/g, '') + '\\s*\\]').test(lines.join('\n'))) issues.push({ line: i + 1, severity: 'warning', title: 'Possible off-by-one: «<= ' + bound + '»', detail: 'If «' + bound + '» is the array size, the last valid index is «' + bound + ' - 1», so «arr[' + bound + ']» is out of bounds.', patch: { line: i + 1, text: raw[i].replace(/<=\s*/, '< ') } });
      }
    });
    whileCheck(raw, lines, issues, 'c');
  }

  function checkJava(code, st, issues) {
    const raw = code.split('\n'), lines = st.split('\n');
    semicolonCheck(raw, lines, issues, 'java');
    cFamilyCommon(raw, lines, issues, 'java');
    const all = st;
    const stringVars = new Set(); const arrayVars = new Set();
    let m;
    const reS = /\bString\s+(\w+)\s*[=;,)]/g; while ((m = reS.exec(all))) stringVars.add(m[1]);
    const reA = /\b\w+\s*\[\]\s+(\w+)|\b\w+\s+(\w+)\s*\[\]/g; while ((m = reA.exec(all))) arrayVars.add(m[1] || m[2]);
    lines.forEach((l, i) => {
      if (/\bsystem\.out\b/.test(l)) issues.push({ line: i + 1, severity: 'error', title: '«system» should be «System»', detail: 'Java is case-sensitive: the class is «System».', patch: { line: i + 1, text: raw[i].replace(/\bsystem\.out\b/g, 'System.out') } });
      if ((m = l.match(/System\.out\.(printn|prinln|printline|Println|PrintLn|printLn|pritnln)\b/))) issues.push({ line: i + 1, severity: 'error', title: '«' + m[1] + '» should be «println»', detail: 'The method is «System.out.println» (print-L-N, all lowercase).', patch: { line: i + 1, text: raw[i].replace(m[1], 'println') } });
      if (/(^|[^\w.])string\s+\w+\s*[=;,)]/.test(l)) issues.push({ line: i + 1, severity: 'error', title: '«string» should be «String»', detail: 'In Java, «String» is a class and starts with a capital S.', patch: { line: i + 1, text: raw[i].replace(/(^|[^\w.])string(\s+\w+)/, '$1String$2') } });
      if ((m = l.match(/(\w+)\s*==\s*"|"\s*==\s*(\w+)/)) || [...stringVars].some((v) => new RegExp('\\b' + v + '\\s*[!=]=\\s*\\w').test(l) && !/null/.test(l))) issues.push({ line: i + 1, severity: 'warning', title: 'Comparing Strings with «==»', detail: '«==» checks whether both sides are the same object, not the same text. Use «a.equals(b)» (or «"text".equals(a)»).' });
      if ((m = l.match(/(\w+)\.length\(\)/)) && arrayVars.has(m[1])) issues.push({ line: i + 1, severity: 'error', title: 'Arrays use «.length», not «.length()»', detail: '«' + m[1] + '» is an array, and «length» is a field. Write «' + m[1] + '.length».', patch: { line: i + 1, text: raw[i].replace(m[1] + '.length()', m[1] + '.length') } });
      if ((m = l.match(/(\w+)\.length(?!\s*\()/)) && stringVars.has(m[1])) issues.push({ line: i + 1, severity: 'error', title: 'Strings use «.length()»', detail: '«' + m[1] + '» is a String, and «length()» is a method. Write «' + m[1] + '.length()».', patch: { line: i + 1, text: raw[i].replace(new RegExp(m[1] + '\\.length(?!\\s*\\()'), m[1] + '.length()') } });
    });
    // main signature
    if (/\bvoid\s+main\s*\(/.test(all) && !/public\s+static\s+void\s+main\s*\(\s*(final\s+)?String\s*(\[\]\s*\w+|\w+\s*\[\]|\.\.\.\s*\w+)\s*\)/.test(all)) {
      const ln = lines.findIndex((l) => /\bvoid\s+main\s*\(/.test(l)) + 1;
      issues.push({ line: ln, severity: 'error', title: 'Incorrect «main» method signature', detail: 'Java only starts programs from «public static void main(String[] args)». Anything else gives «Main method not found».' });
    }
    // missing imports
    const imported = (name) => new RegExp('import\\s+java\\.util\\.(\\*|' + name + ')\\s*;').test(code);
    JAVA_UTIL.forEach((cls) => { const ln = lines.findIndex((l) => new RegExp('(^|[^\\w.])' + cls + '\\s*(<|\\s+\\w+\\s*=|\\.)').test(l)); if (ln >= 0 && !imported(cls)) issues.push({ line: ln + 1, severity: 'error', title: 'Missing «import java.util.' + cls + ';»', detail: '«' + cls + '» lives in the java.util package. Without the import you get «error: cannot find symbol».', insert: { line: 1, text: 'import java.util.' + cls + ';' } }); });
    // nextInt followed by nextLine
    const ni = lines.findIndex((l) => /\.next(Int|Double|Long|Float|Boolean)?\s*\(\s*\)/.test(l) && !/nextLine/.test(l));
    if (ni >= 0) {
      const nl = lines.findIndex((l, k) => k > ni && /\.nextLine\s*\(\s*\)/.test(l));
      if (nl >= 0) {
        const between = lines.slice(ni + 1, nl).join('\n');
        const assigned = /=\s*\w+\.nextLine\s*\(/.test(lines[nl]);
        if (assigned && !/\.nextLine\s*\(\s*\)/.test(between)) issues.push({ line: nl + 1, severity: 'warning', title: '«nextLine()» right after «nextInt()» will read an empty line', detail: '«nextInt()» leaves the Enter key in the buffer. Add an extra «sc.nextLine();» before this line to consume it.' });
      }
    }
    // integer division into double
    lines.forEach((l, i) => { if (/\bdouble\s+\w+\s*=\s*\w+\s*\/\s*\w+\s*;/.test(l) && !/\(double\)|\d\.\d/.test(l)) { const mm = l.match(/=\s*(\w+)\s*\/\s*(\w+)/); if (mm && new RegExp('\\bint\\s+(\\w+\\s*,\\s*)*' + mm[1] + '\\b').test(all)) issues.push({ line: i + 1, severity: 'warning', title: 'Integer division before assigning to double', detail: 'Both operands are ints, so the division truncates first (7/2 = 3) and only then becomes 3.0. Cast one side: «(double) ' + mm[1] + ' / ' + mm[2] + '».', patch: { line: i + 1, text: raw[i].replace(new RegExp('=\\s*' + mm[1] + '\\s*/'), '= (double) ' + mm[1] + ' /') } }); } });
    // static context
    const instanceMethods = new Set();
    const reM = /^\s*(public|private|protected)?\s*(?!static)([\w<>\[\]]+)\s+(\w+)\s*\([^)]*\)\s*\{/gm;
    while ((m = reM.exec(all))) if (!/\bstatic\b/.test(m[0]) && !/^(if|for|while|switch|return|new|else)$/.test(m[2]) && m[2] !== 'class') instanceMethods.add(m[3]);
    const mainIdx = lines.findIndex((l) => /static\s+void\s+main/.test(l));
    if (mainIdx >= 0 && instanceMethods.size) {
      let depth = 0, started = false;
      for (let k = mainIdx; k < lines.length; k++) {
        for (const c of lines[k]) { if (c === '{') { depth++; started = true; } else if (c === '}') depth--; }
        instanceMethods.forEach((name) => { if (k > mainIdx && new RegExp('(^|[^\\w.])' + name + '\\s*\\(').test(lines[k]) && !/\bnew\b/.test(lines[k])) issues.push({ line: k + 1, severity: 'error', title: 'Calling non-static «' + name + '()» from static «main»', detail: '«' + name + '» is an instance method. Either declare it «static», or create an object first: «new Main().' + name + '(...)».' }); });
        if (started && depth <= 0) break;
      }
    }
  }

  function checkC(code, st, issues, lang) {
    const raw = code.split('\n'), lines = st.split('\n');
    semicolonCheck(raw, lines, issues, lang);
    cFamilyCommon(raw, lines, issues, lang);
    const all = st;
    const has = (re) => re.test(code);
    const firstLine = (re) => lines.findIndex((l) => re.test(l)) + 1;
    // declared types
    const types = {};
    let m;
    const reD = /\b(int|long|short|char|float|double|unsigned|size_t|bool)\s+([^;()]+);/g;
    while ((m = reD.exec(all))) m[2].split(',').forEach((part) => { const v = part.trim().match(/^(\*?)\s*([A-Za-z_]\w*)\s*(\[)?/); if (v) types[v[2]] = { t: m[1], ptr: !!v[1], arr: !!v[3] }; });
    /* ---- scanf / printf: format specifier vs. variable type ---- */
    const SPEC_RE = { scanf: /%(?!%)[*]?\d*(hh|h|ll|l|L|z|j|t)?([diouxXfeEgGaAcsp]|\[[^\]]*\])/g, printf: /%(?!%)[-+ #0]*(\d+|\*)?(\.(\d+|\*))?(hh|h|ll|l|L|z|j|t)?([diouxXfeEgGaAcspn])/g };
    const specKind = (sp) => {
      const c = sp.replace(/\[[^\]]*\]$/, '[').slice(-1);
      if (c === 's' || c === '[') return 'string';
      if (c === 'c') return 'char';
      if (/[feEgGaA]/.test(c)) return /(l|L)[feEgGaA]$/.test(sp) ? 'double' : 'float';
      if (c === 'p' || c === 'n') return 'other';
      return 'int';
    };
    const KIND_NAME = { string: 'a string (char array)', char: 'a single char', int: 'an integer', float: 'a float', double: 'a double' };
    const KIND_SHORT = { string: 'a char array', char: 'a char', int: 'an int', float: 'a float', double: 'a double' };
    const argKind = (arg) => {
      let a = String(arg || '').trim();
      const addr = /^&/.test(a); if (addr) a = a.slice(1).trim();
      const deref = /^\*/.test(a);
      const elem = a.match(/^([A-Za-z_]\w*)\s*\[.+\]$/);
      const name = elem ? elem[1] : (a.match(/^\*?\s*([A-Za-z_]\w*)$/) || [])[1];
      const info = name ? types[name] : null;
      if (!info) return { kind: 'unknown', addr, name, text: a, simple: !!name || !!elem, elem: !!elem };
      const whole = (info.arr || info.ptr) && !elem && !deref;
      const kind = info.t === 'char' ? (whole ? 'string' : 'char') : info.t === 'float' ? 'float' : info.t === 'double' ? 'double' : 'int';
      return { kind, addr, name, text: a, simple: true, elem: !!elem, whole, info };
    };
    const suggestSpec = (fn, kind) => ({ string: '%s', char: fn === 'scanf' ? ' %c' : '%c', int: '%d', float: '%f', double: fn === 'scanf' ? '%lf' : '%f' })[kind];
    // replace the k-th specifier inside the call's format string on this raw line
    const replaceSpec = (line, fn, k, rep) => line.replace(new RegExp('(\\b' + fn + '\\s*\\(\\s*")((?:\\\\.|[^"\\\\])*)(")'), (all, a, fmt, b) => {
      let n = -1;
      return a + fmt.replace(new RegExp(SPEC_RE[fn].source, 'g'), (sp) => (++n === k ? rep : sp)) + b;
    });
    const splitArgs = (s) => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') depth++; if (ch === ')' || ch === ']') depth--; if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur); return out.map((x) => x.trim()).filter(Boolean); };

    lines.forEach((l, i) => {
      // format strings are blanked in the stripped text, so parse the raw line when the call is real code
      for (const fn of ['scanf', 'printf']) {
        if (!new RegExp('\\b' + fn + '\\s*\\(').test(l)) continue;
        const cm = raw[i].match(new RegExp('\\b' + fn + '\\s*\\(\\s*"((?:\\\\.|[^"\\\\])*)"\\s*(?:,(.*))?\\)\\s*;?'));
        if (!cm) continue;
        const specs = cm[1].match(SPEC_RE[fn]) || [];
        const args = cm[2] ? splitArgs(cm[2].replace(/\)\s*$/, '')) : [];
        const assignable = specs.filter((s) => !/^%\*/.test(s));
        if (assignable.length !== args.length) issues.push({ line: i + 1, severity: 'warning', title: fn + ' has ' + U.plural(assignable.length, 'format specifier') + ' but ' + U.plural(args.length, 'argument'), detail: 'Each «%…» needs exactly one matching variable. ' + (fn === 'scanf' ? 'Missing variables make scanf write to random memory.' : 'Missing arguments print garbage values.') });
        let k = -1;
        specs.forEach((sp, si) => {
          if (/^%\*/.test(sp)) return; // %*d = read and discard
          k++;
          const A = argKind(args[k]);
          const K = specKind(sp);
          const want = A.kind !== 'unknown' ? suggestSpec(fn, A.kind) : null;
          const fix = want ? { line: i + 1, text: replaceSpec(raw[i], fn, si, want.trim() === '%c' && fn === 'scanf' ? ' %c' : want) } : null;
          const mismatch = A.kind !== 'unknown' && K !== 'other' && K !== A.kind && !(fn === 'printf' && K === 'float' && A.kind === 'double') && !(fn === 'printf' && K === 'double' && (A.kind === 'float' || A.kind === 'double'));
          if (fn === 'scanf') {
            if (mismatch) {
              const big = K === 'string' || A.kind === 'string' || (K === 'int' && /float|double/.test(A.kind)) || (/float|double/.test(K) && A.kind === 'int') || (K === 'int' && A.kind === 'char');
              const extra = A.kind === 'string'
                ? '«' + A.name + '» is a «char» array, so it holds text. «' + sp + '» reads a number instead, so scanf stores the bytes of an «int» at the start of the array and what you typed is never saved as text. Every later use of «' + A.name + '» then sees garbage. Use «%s» to read a word. No «&» is needed because an array name is already an address' + (A.info && A.info.arr ? ', and you can write «%' + Math.max(1, (code.match(new RegExp('\\b' + A.name + '\\s*\\[\\s*(\\d+)\\s*\\]')) || [0, 20])[1] - 1) + 's» so a long input cannot overflow the array.' : '.')
                : K === 'string'
                  ? '«%s» reads text, but «' + A.text + '» is ' + KIND_NAME[A.kind] + '. Use «' + want.trim() + '» (with «&»).'
                  : A.kind === 'char' && K === 'int'
                    ? '«' + sp + '» writes a 4-byte integer into the 1-byte char «' + A.text + '», overwriting nearby memory. Use «" %c"» to read one character (the space skips leftover newlines).'
                    : '«' + sp + '» expects ' + KIND_NAME[K] + ', but «' + A.text + '» is ' + KIND_NAME[A.kind] + '. The value is stored in the wrong format, so it reads as garbage. Use «' + want.trim() + '».';
              issues.push({ line: i + 1, severity: big ? 'error' : 'warning', title: 'Wrong format: «' + sp.trim() + '» used for «' + A.text + '», which is ' + KIND_SHORT[A.kind], detail: extra, patch: fix });
            }
            // missing & (strings and whole arrays are already addresses)
            const isStringTarget = (A.kind === 'string') || (A.kind === 'unknown' && K === 'string');
            if (A.simple && !A.addr && !isStringTarget && !A.whole) {
              const target = A.text;
              issues.push({ line: i + 1, severity: 'error', title: 'Missing «&» before «' + target + '» in scanf', detail: '«scanf» needs the *address* of the variable so it can store the value there. Without «&» it writes to a random address, which usually means a **segmentation fault**.', patch: { line: i + 1, text: raw[i].replace(new RegExp('(,\\s*)' + target.replace(/[[\]().*+?^$|\\]/g, '\\$&') + '(\\s*[,)])'), '$1&' + target + '$2') } });
            }
          } else if (mismatch) {
            const crash = K === 'string' && A.kind !== 'string';
            const detail = crash
              ? '«%s» expects the address of a string, but «' + A.text + '» is ' + KIND_NAME[A.kind] + '. printf treats its value as a memory address, which usually **crashes** the program. Use «' + want + '».'
              : A.kind === 'string'
                ? '«' + A.text + '» is a string, so «' + sp + '» prints its memory address (or one byte) instead of the text. Use «%s».'
                : '«' + sp + '» expects ' + KIND_NAME[K] + ', but «' + A.text + '» is ' + KIND_NAME[A.kind] + ', so a garbage value is printed. Use «' + want + '».';
            issues.push({ line: i + 1, severity: crash ? 'error' : 'warning', title: 'Wrong format: «' + sp + '» used for «' + A.text + '», which is ' + KIND_SHORT[A.kind], detail, patch: fix });
          }
        });
      }
      if (/\bgets\s*\(/.test(l)) issues.push({ line: i + 1, severity: 'error', title: '«gets()» is unsafe (removed from C11)', detail: 'It cannot limit input length and can overflow the buffer. Use «fgets(buf, sizeof buf, stdin)».' });
      if (/\bvoid\s+main\s*\(/.test(l)) issues.push({ line: i + 1, severity: 'warning', title: 'Use «int main()» instead of «void main()»', detail: 'The standard requires «main» to return «int» (0 means success).', patch: { line: i + 1, text: raw[i].replace(/void\s+main/, 'int main') } });
      if (/\bcout\s*>>|\bcin\s*<</.test(l)) issues.push({ line: i + 1, severity: 'error', title: 'Wrong stream operator direction', detail: 'Use «cout << value» (output) and «cin >> variable» (input). The arrows point where the data flows.', patch: { line: i + 1, text: raw[i].replace(/\bcout\s*>>/g, 'cout <<').replace(/\bcin\s*<</g, 'cin >>') } });
      const cm = l.match(/\bchar\s+(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*"/);
      if (cm) { const lit = (raw[i].match(/"((?:\\.|[^"\\])*)"/) || ['', ''])[1].replace(/\\./g, 'x'); if (lit.length >= +cm[2]) issues.push({ line: i + 1, severity: 'error', title: 'Array «' + cm[1] + '» is too small for its string', detail: '"' + lit + '" has ' + lit.length + ' characters plus the hidden «\'\\0\'» terminator, so it needs at least ' + (lit.length + 1) + ' bytes.', patch: { line: i + 1, text: raw[i].replace(/\[\s*\d+\s*\]/, '[' + (lit.length + 1) + ']') } }); }
      if (lang === 'c' && /"\s*==|==\s*"/.test(raw[i])) issues.push({ line: i + 1, severity: 'error', title: 'Comparing strings with «==» in C', detail: 'That compares addresses, not text. Use «strcmp(a, b) == 0» from «<string.h>».' });
    });
    // includes
    const inc = (h) => new RegExp('#include\\s*[<"]' + h.replace(/[.+]/g, '\\$&') + '[>"]').test(code) || /bits\/stdc\+\+\.h/.test(code);
    if (lang === 'c' || !has(/#include\s*<(iostream|cstdio)>/)) {
      if (/\b(printf|scanf|puts|getchar|fgets|fopen)\s*\(/.test(all) && !inc('stdio.h') && !inc('cstdio') && !inc('iostream')) issues.push({ line: 1, severity: 'error', title: 'Missing «#include <stdio.h>»', detail: '«printf»/«scanf» are declared in stdio.h. Without it you get «implicit declaration of function».', insert: { line: 1, text: '#include <stdio.h>' } });
    }
    if (/\b(malloc|calloc|free|exit|atoi|rand|qsort)\s*\(/.test(all) && !inc('stdlib.h') && !inc('cstdlib')) issues.push({ line: firstLine(/\b(malloc|calloc|free|exit|atoi|rand|qsort)\s*\(/), severity: lang === 'c' ? 'warning' : 'info', title: 'Missing «#include <stdlib.h>»', detail: 'malloc, free, exit, atoi and rand are declared in stdlib.h.', insert: { line: 1, text: lang === 'c' ? '#include <stdlib.h>' : '#include <cstdlib>' } });
    if (lang === 'c' && /\b(strlen|strcpy|strcmp|strcat|strncpy|memset|memcpy)\s*\(/.test(all) && !inc('string.h')) issues.push({ line: firstLine(/\b(strlen|strcpy|strcmp|strcat|strncpy|memset|memcpy)\s*\(/), severity: 'warning', title: 'Missing «#include <string.h>»', detail: 'String functions like strlen/strcpy/strcmp are declared in string.h.', insert: { line: 1, text: '#include <string.h>' } });
    if (/\b(sqrt|pow|ceil|floor|fabs|sin|cos|log)\s*\(/.test(all) && !inc('math.h') && !inc('cmath')) issues.push({ line: firstLine(/\b(sqrt|pow|ceil|floor|fabs|sin|cos|log)\s*\(/), severity: 'warning', title: 'Missing math header', detail: 'Math functions need «#include <math.h>» (C, and link with «-lm») or «<cmath>» (C++).', insert: { line: 1, text: lang === 'c' ? '#include <math.h>' : '#include <cmath>' } });
    if (lang === 'cpp') {
      if (/\b(cout|cin|endl)\b/.test(all) && !inc('iostream')) issues.push({ line: firstLine(/\b(cout|cin)\b/), severity: 'error', title: 'Missing «#include <iostream>»', detail: '«cout» and «cin» come from the iostream header.', insert: { line: 1, text: '#include <iostream>' } });
      if (/(^|[^:\w])(cout|cin|endl|string|vector)\b/.test(all) && !/using\s+namespace\s+std\s*;/.test(all) && !/std::(cout|cin|string|vector)/.test(all)) issues.push({ line: firstLine(/(^|[^:\w])(cout|cin|string|vector)\b/), severity: 'error', title: '«cout»/«string» need «std::»', detail: 'Standard names live in the «std» namespace. Add «using namespace std;» after the includes, or write «std::cout».', insertAfterIncludes: 'using namespace std;' });
    }
    // struct/class definitions need ';'
    if (/\b(struct|class|enum|union)\s+\w+[^;{]*\{/.test(all)) {
      let depth = 0; const opens = [];
      lines.forEach((l, i) => {
        for (let k = 0; k < l.length; k++) {
          const c = l[k];
          if (c === '{') { opens.push({ depth, isType: /\b(struct|class|enum|union)\s+\w+[^;()]*$/.test(l.slice(0, k)) || (/^\s*\{/.test(l.slice(0, k + 1)) && i > 0 && /\b(struct|class|enum|union)\s+\w+[^;()]*$/.test(lines[i - 1])) }); depth++; }
          else if (c === '}') { depth--; const o = opens.pop(); if (o && o.isType && !/^\s*\w*\s*;/.test(l.slice(k + 1))) issues.push({ line: i + 1, severity: 'error', title: 'Missing «;» after the struct/class definition', detail: 'In C and C++, a struct or class definition must end with «};».', patch: { line: i + 1, text: raw[i].replace(/\}(?!.*\})/, '};') } }); }
        }
      });
    }
    // malloc without free
    if (/\bmalloc\s*\(/.test(all) && !/\bfree\s*\(/.test(all)) issues.push({ line: firstLine(/\bmalloc\s*\(/), severity: 'info', title: 'Memory allocated but never freed', detail: 'Every «malloc» should eventually be paired with «free» to avoid memory leaks.' });
  }

  /* ------------------------------------------------------------------ */
  /* program summary & complexity                                         */
  /* ------------------------------------------------------------------ */
  function functionsOf(st, lang) {
    const fns = [];
    let m;
    if (lang === 'python') { const re = /^([ \t]*)def\s+(\w+)\s*\(([^)]*)\)/gm; while ((m = re.exec(st))) fns.push({ name: m[2], params: m[3].trim(), index: m.index, indent: m[1].length }); }
    else if (lang === 'javascript' || lang === 'typescript') {
      const re = /\bfunction\s+(\w+)\s*\(([^)]*)\)|\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:function\s*\(([^)]*)\)|\(?([\w\s,]*)\)?\s*=>)/g;
      while ((m = re.exec(st))) fns.push({ name: m[1] || m[3], params: (m[2] || m[4] || m[5] || '').trim(), index: m.index });
    } else {
      const re = /^[ \t]*(?:(?:public|private|protected|static|final|inline|virtual|const|unsigned|signed)\s+)*([\w<>\[\]:*&]+)\s+[*&]?(\w+)\s*\(([^;{)]*)\)\s*(?:const\s*)?(?:throws\s+[\w,\s]+)?\{/gm;
      while ((m = re.exec(st))) if (!/^(if|for|while|switch|return|else|catch|new)$/.test(m[2]) && !/^(return|else|new)$/.test(m[1])) fns.push({ name: m[2], ret: m[1], params: m[3].trim(), index: m.index });
    }
    return fns;
  }

  function bodyOf(st, fn, lang) {
    if (lang === 'python') {
      const lines = st.slice(fn.index).split('\n');
      const out = [];
      for (let i = 1; i < lines.length; i++) { if (lines[i].trim() && indentOf(lines[i]) <= fn.indent) break; out.push(lines[i]); }
      return out.join('\n');
    }
    const start = st.indexOf('{', fn.index);
    if (start < 0) { const arrow = st.indexOf('=>', fn.index); return arrow >= 0 ? st.slice(arrow + 2, st.indexOf('\n', arrow + 2) >>> 0) : ''; }
    let depth = 0;
    for (let i = start; i < st.length; i++) { if (st[i] === '{') depth++; else if (st[i] === '}') { depth--; if (!depth) return st.slice(start + 1, i); } }
    return st.slice(start + 1);
  }

  function loopDepth(st, lang) {
    const lines = st.split('\n');
    let max = 0, logLoops = 0;
    const halving = /(\*=\s*2|\/=\s*2|\/\/=\s*2|>>=\s*1|<<=\s*1|=\s*\w+\s*(\/\/|\/)\s*2\b|\bmid\b)/;
    if (lang === 'python') {
      const stack = [];
      lines.forEach((l, i) => {
        if (!l.trim()) return;
        const ind = indentOf(l);
        while (stack.length && ind <= stack[stack.length - 1].ind) stack.pop();
        if (/^\s*(for|while)\b/.test(l)) {
          let isLog = /^\s*while\b/.test(l) && (() => { for (let k = i + 1; k < lines.length; k++) { if (lines[k].trim() && indentOf(lines[k]) <= ind) break; if (halving.test(lines[k])) return true; } return false; })();
          stack.push({ ind, log: isLog });
          const linear = stack.filter((s) => !s.log).length;
          if (linear > max) max = linear;
          if (isLog) logLoops = Math.max(logLoops, 1);
        }
      });
    } else {
      let depth = 0; const stack = [];
      lines.forEach((l, i) => {
        const isLoop = /\b(for|while)\s*\(/.test(l) && !/^\s*\}\s*while\s*\(.*\)\s*;/.test(l);
        if (isLoop) {
          const header = l + (lines[i + 1] || '');
          const isLog = halving.test(header) || /\bwhile\b/.test(l) && (() => { for (let k = i + 1; k < Math.min(lines.length, i + 15); k++) { if (halving.test(lines[k])) return true; if (/^\s*\}/.test(lines[k])) break; } return false; })();
          const braces = /\{/.test(l) || /^\s*\{/.test(lines[i + 1] || '');
          stack.push({ depth, log: isLog, single: !braces, line: i });
          const linear = stack.filter((s) => !s.log).length;
          if (linear > max) max = linear;
          if (isLog) logLoops = 1;
        }
        for (const c of l) { if (c === '{') depth++; else if (c === '}') { depth--; while (stack.length && !stack[stack.length - 1].single && depth <= stack[stack.length - 1].depth) stack.pop(); } }
        while (stack.length && stack[stack.length - 1].single && i > stack[stack.length - 1].line && /;/.test(l) && !isLoop) stack.pop();
      });
    }
    return { max, logLoops };
  }

  A.complexity = function (code, lang) {
    lang = lang || A.detectLanguage(code).lang || 'python';
    const st = A.strip(code, lang).text;
    const reasons = [];
    const { max, logLoops } = loopDepth(st, lang);
    let order = max; // power of n
    let log = logLoops > 0 ? 1 : 0;
    let label = null;
    const fns = functionsOf(st, lang);
    let recursive = [];
    fns.forEach((f) => {
      const body = bodyOf(st, f, lang);
      const calls = (body.match(new RegExp('(^|[^\\w.])' + f.name + '\\s*\\(', 'g')) || []).length;
      if (!calls) return;
      const memo = /lru_cache|cache|memo|dp\[/.test(st);
      const halves = /\/\s*2|\/\/\s*2|\bmid\b|>>\s*1/.test(body);
      recursive.push(f.name);
      if (calls >= 2 && halves) { label = label || 'O(n log n)'; reasons.push('«' + f.name + '» splits the input in half and recurses on both halves (divide and conquer), giving **O(n log n)** like merge sort.'); }
      else if (calls >= 2 && !memo) { label = 'O(2ⁿ)'; reasons.push('«' + f.name + '» calls itself **' + calls + ' times** per call without memoization, so the number of calls roughly doubles at each level: **O(2ⁿ)**. Adding memoization would bring it down to O(n).'); }
      else if (calls >= 2 && memo) { label = label || 'O(n)'; reasons.push('«' + f.name + '» recurses twice, but results are cached (memoization), so each subproblem is solved once: about **O(n)**.'); }
      else if (halves) { label = label || 'O(log n)'; reasons.push('«' + f.name + '» recurses once on half of the input, giving **O(log n)** (like binary search).'); }
      else { label = label || 'O(n)'; reasons.push('«' + f.name + '» calls itself once with a smaller input each time: about **O(n)** calls, plus O(n) stack space.'); }
    });
    const sorts = /\b(sorted\s*\(|\.sort\s*\(|Arrays\.sort|Collections\.sort|std::sort|\bsort\s*\(|qsort\s*\()/.test(st);
    if (!label) {
      if (order >= 2) reasons.push('There are **' + order + ' nested loops**, each potentially running about n times, so the work multiplies: n' + (order === 2 ? '²' : order === 3 ? '³' : '^' + order) + '.');
      else if (order === 1) reasons.push('A single loop goes through the input once: **linear time**.');
      if (log) reasons.push('A loop that halves or doubles its variable each step runs about log₂(n) times.');
      if (sorts) reasons.push('Sorting with the built-in sort costs **O(n log n)**.');
      if (/\bin\s+\w+\s*(:|\))/.test(st) && order >= 1 && lang === 'python' && /if\s+\w+\s+(not\s+)?in\s+\w+/.test(st)) reasons.push('Note: «x in some_list» inside a loop is itself O(n). With a set it would be O(1).');
      const pow = order === 0 ? '' : order === 1 ? 'n' : order === 2 ? 'n²' : order === 3 ? 'n³' : 'n^' + order;
      if (sorts && order <= 1) label = order === 1 ? 'O(n log n)' : 'O(n log n)';
      else if (!pow && log) label = 'O(log n)';
      else if (!pow) label = 'O(1)';
      else label = 'O(' + pow + (log ? ' log n' : '') + ')';
      if (label === 'O(1)') reasons.push('No loops or recursion that depend on the input size: **constant time**.');
    }
    return { label, reasons, loops: max, recursive };
  };

  A.summary = function (code, lang) {
    lang = lang || A.detectLanguage(code).lang || 'python';
    const st = A.strip(code, lang).text;
    const fns = functionsOf(st, lang).filter((f) => f.name !== 'main' || lang !== 'java');
    const classes = (st.match(/\bclass\s+(\w+)/g) || []).map((c) => c.replace(/class\s+/, ''));
    const loops = (st.match(/\b(for|while)\b/g) || []).length;
    const io = [];
    if (/\binput\s*\(|\bscanf\s*\(|\bcin\s*>>|Scanner|readline|prompt\s*\(|nextLine|nextInt/.test(st)) io.push('reads input');
    if (/\bprint\s*\(|printf\s*\(|cout\s*<<|System\.out|console\.log|puts\s*\(/.test(st)) io.push('prints output');
    if (/\bopen\s*\(|fopen|FileReader|readFileSync|Files\./.test(st)) io.push('works with files');
    if (/\bfetch\s*\(|requests\.|HttpClient|axios/.test(st)) io.push('makes network requests');
    const ds = [];
    if (/\[\s*\]|\blist\s*\(|ArrayList|vector\s*<|new\s+\w+\s*\[|\w+\s*\[\s*\d*\s*\]\s*=/.test(st)) ds.push('arrays/lists');
    if (/\{\s*\}|\bdict\s*\(|HashMap|unordered_map|\bmap\s*<|new Map\(/.test(st) && lang !== 'c' && lang !== 'java' || /HashMap|TreeMap/.test(st)) ds.push('maps/dictionaries');
    if (/\bset\s*\(|HashSet|unordered_set|new Set\(/.test(st)) ds.push('sets');
    if (/deque|Queue|queue\s*</.test(st)) ds.push('queues');
    if (/\bstack\b|Stack|ArrayDeque/.test(st)) ds.push('stacks');
    if (/\.next\b|->next|Node/.test(st)) ds.push('linked nodes');
    return { lang, functions: fns, classes, loops, io, ds, lines: code.split('\n').length };
  };

  /* ------------------------------------------------------------------ */
  /* main entry                                                          */
  /* ------------------------------------------------------------------ */
  A.analyze = function (code, lang) {
    code = String(code || '').replace(/\r\n?/g, '\n');
    const det = A.detectLanguage(code);
    lang = CM.hl ? CM.hl.normalize(lang || det.lang || '') : (lang || det.lang);
    if (lang === 'text' || !lang) lang = det.lang || 'text';
    const issues = [];
    const stripped = A.strip(code, lang);
    if (['python', 'javascript', 'typescript', 'java', 'c', 'cpp', 'csharp'].indexOf(lang) >= 0) {
      stripped.unterminated.forEach((ln) => issues.push({ line: ln, severity: 'error', title: 'Unterminated string', detail: 'A quote opened on line ' + ln + ' is never closed on that line.' }));
      const balanced = bracketCheck(stripped.text, issues, lang);
      try {
        if (lang === 'python') { checkPython(code, stripped.text, issues); typoCheck(stripped.text, 'python', issues, A.definedNames(stripped.text, 'python')); }
        else if (lang === 'javascript' || lang === 'typescript') checkJS(code, stripped.text, issues);
        else if (lang === 'java') checkJava(code, stripped.text, issues);
        else if (lang === 'c' || lang === 'cpp') checkC(code, stripped.text, issues, lang);
      } catch (e) { /* analyzer must never break the chat */ if (window.console) console.warn('analyzer', e); }
      if (!balanced) issues.forEach((it) => { if (it.kind === 'semicolon') it.severity = 'warning'; });
    }
    // de-duplicate (same line + title)
    const seen = new Set();
    const uniq = issues.filter((it) => { const k = it.line + '|' + it.title; if (seen.has(k)) return false; seen.add(k); return true; });
    const rank = { error: 0, warning: 1, info: 2 };
    uniq.sort((a, b) => rank[a.severity] - rank[b.severity] || a.line - b.line);
    return { lang, detected: det.lang, issues: uniq.slice(0, 14), counts: { error: uniq.filter((i) => i.severity === 'error').length, warning: uniq.filter((i) => i.severity === 'warning').length, info: uniq.filter((i) => i.severity === 'info').length } };
  };

  /** Applies safe, line-local fixes. Returns {code, changed:[lineNumbers]} or null. */
  A.autofix = function (code, issues) {
    const lines = String(code).replace(/\r\n?/g, '\n').split('\n');
    const changed = new Set();
    let inserts = [];
    issues.forEach((it) => {
      if (it.severity === 'info') return;
      if (it.patch && it.patch.text != null && !changed.has(it.patch.line)) {
        const idx = it.patch.line - 1;
        if (lines[idx] !== undefined && lines[idx] !== it.patch.text) { lines[idx] = it.patch.text; changed.add(it.patch.line); }
      } else if (it.replace && it.line) {
        const idx = it.line - 1;
        const re = new RegExp('(^|[^\\w$.])' + it.replace.from.replace(/\$/g, '\\$') + '(?![\\w$])', 'g');
        const reMember = new RegExp('\\.' + it.replace.from + '\\b', 'g');
        lines.forEach((l, k) => {
          const next = it.kind === 'typo' && /^[a-z]/i.test(it.replace.from) && reMember.test(l) && !re.test(l) ? l.replace(reMember, '.' + it.replace.to) : l.replace(re, '$1' + it.replace.to);
          reMember.lastIndex = 0; re.lastIndex = 0;
          if (next !== l) { lines[k] = next; changed.add(k + 1); }
        });
        void idx;
      } else if (it.insert) inserts.push(it.insert.text);
      else if (it.insertAfterIncludes) inserts.push({ after: true, text: it.insertAfterIncludes });
    });
    if (!changed.size && !inserts.length) return null;
    // inserts: includes/imports at the top (after existing ones), dedupe
    const top = []; const after = [];
    inserts.forEach((x) => { if (typeof x === 'string') { if (top.indexOf(x) < 0 && lines.indexOf(x) < 0) top.push(x); } else if (after.indexOf(x.text) < 0) after.push(x.text); });
    let shift = 0;
    if (top.length) {
      let at = 0;
      for (let k = 0; k < lines.length; k++) if (/^\s*(#include|import\s|package\s)/.test(lines[k])) at = k + 1;
      if (/^\s*package\s/.test(lines[0] || '') && at === 0) at = 1;
      lines.splice(at, 0, ...top); shift += top.length;
      const moved = [...changed].map((n) => (n > at ? n + top.length : n));
      changed.clear(); moved.forEach((n) => changed.add(n));
      for (let k = 0; k < top.length; k++) changed.add(at + k + 1);
    }
    if (after.length) {
      let at = 0;
      for (let k = 0; k < lines.length; k++) if (/^\s*#include/.test(lines[k])) at = k + 1;
      lines.splice(at, 0, ...after);
      const moved = [...changed].map((n) => (n > at ? n + after.length : n));
      changed.clear(); moved.forEach((n) => changed.add(n));
      for (let k = 0; k < after.length; k++) changed.add(at + k + 1);
    }
    void shift;
    return { code: lines.join('\n'), changed: [...changed].sort((a, b) => a - b) };
  };

  /* ------------------------------------------------------------------ */
  /* line-by-line explanation                                            */
  /* ------------------------------------------------------------------ */
  const q = (s) => '«' + String(s).trim().replace(/[«»]/g, '').slice(0, 80) + '»';
  const rangeText = (args) => {
    const p = args.split(',').map((x) => x.trim());
    if (p.length === 1) return 'from 0 up to ' + q(p[0]) + ' − 1';
    if (p.length === 2) return 'from ' + q(p[0]) + ' up to ' + q(p[1]) + ' − 1';
    return 'from ' + q(p[0]) + ' toward ' + q(p[1]) + ' in steps of ' + q(p[2]);
  };
  const OPS = { '+': 'adds', '-': 'subtracts', '*': 'multiplies by', '/': 'divides by', '//': 'floor-divides by', '%': 'takes the remainder of division by', '**': 'raises to the power of' };
  const HEADERS = { 'stdio.h': 'printf/scanf (input & output)', 'stdlib.h': 'malloc, free, exit, rand', 'string.h': 'string functions like strlen, strcpy', 'math.h': 'math functions like sqrt, pow', iostream: 'cin and cout', vector: 'the vector (dynamic array) type', string: 'the string type', algorithm: 'sort, reverse, max, min…', 'bits/stdc++.h': 'almost the whole standard library (GCC-only shortcut)', cmath: 'math functions', map: 'the map container', 'ctype.h': 'character tests like isdigit, toupper' };

  const RULES = {
    python: [
      [/^#/, () => 'Comment, ignored by Python'],
      [/^(?:async\s+)?def\s+(\w+)\s*\((.*)\)\s*(?:->\s*(.+))?:/, (m) => 'Defines a function ' + q(m[1]) + (m[2].trim() ? ' that takes ' + q(m[2]) : ' with no parameters')],
      [/^class\s+(\w+)\s*(?:\((.*)\))?:/, (m) => 'Defines a class ' + q(m[1]) + (m[2] ? ' that inherits from ' + q(m[2]) : '') + ' (a blueprint for objects)'],
      [/^@(\w+)/, (m) => 'Decorator ' + q('@' + m[1]) + ' wraps the function below to add behaviour'],
      [/^for\s+(.+?)\s+in\s+range\((.*)\)\s*:/, (m) => 'Loop: ' + q(m[1]) + ' takes each value ' + rangeText(m[2])],
      [/^for\s+(.+?)\s+in\s+enumerate\((.*)\)\s*:/, (m) => 'Loop over ' + q(m[2]) + ', getting both the index and the item (' + q(m[1]) + ')'],
      [/^for\s+(.+?)\s+in\s+(.+):/, (m) => 'Loop: goes through each item in ' + q(m[2]) + ', calling it ' + q(m[1])],
      [/^while\s+(.+):/, (m) => 'Keeps repeating the indented block while ' + q(m[1]) + ' is true'],
      [/^if\s+__name__\s*==\s*["']__main__["']\s*:/, () => 'Runs the code below only when this file is executed directly (not when imported)'],
      [/^if\s+(.+):/, (m) => 'Checks whether ' + q(m[1]) + '. The indented block runs only if it is true'],
      [/^elif\s+(.+):/, (m) => 'Otherwise, checks whether ' + q(m[1])],
      [/^else\s*:/, () => 'Otherwise (none of the conditions above were true), run this block'],
      [/^try\s*:/, () => 'Starts a block that might raise an error'],
      [/^except\s*(\w+)?(?:\s+as\s+(\w+))?\s*:/, (m) => m[1] ? 'If a ' + q(m[1]) + ' happens in the try block, handle it here' : 'Handles any error from the try block'],
      [/^finally\s*:/, () => 'This block always runs at the end, error or not'],
      [/^with\s+open\((.+?)\)\s+as\s+(\w+)\s*:/, (m) => 'Opens the file ' + q(m[1]) + ' as ' + q(m[2]) + '. It is closed automatically afterwards'],
      [/^return\s*$/, () => 'Exits the function (returns None)'],
      [/^return\s+(.+)/, (m) => 'Sends ' + q(m[1]) + ' back to the caller and exits the function'],
      [/^print\((.*)\)\s*$/, (m) => 'Displays ' + (m[1].trim() ? q(m[1]) : 'an empty line') + ' on the screen'],
      [/^import\s+(.+)/, (m) => 'Loads the module ' + q(m[1]) + ' so its functions can be used'],
      [/^from\s+(\S+)\s+import\s+(.+)/, (m) => 'Imports ' + q(m[2]) + ' from the module ' + q(m[1])],
      [/^(\w+)\s*=\s*(int|float)\(\s*input\((.*)\)\s*\)/, (m) => 'Asks the user for input' + (m[3].trim() ? ' (prompt ' + q(m[3]) + ')' : '') + ', converts it to ' + (m[2] === 'int' ? 'an integer' : 'a decimal number') + ' and stores it in ' + q(m[1])],
      [/^(\w+)\s*=\s*input\((.*)\)/, (m) => 'Reads a line of text from the user into ' + q(m[1]) + '. Note: input() always gives a **string**'],
      [/^(.+?)\s*=\s*map\(int,\s*input\(\)\.split\(\)\)/, (m) => 'Reads one line, splits it on spaces, converts each piece to int and stores them in ' + q(m[1])],
      [/^(\w+)\.append\((.+)\)\s*$/, (m) => 'Adds ' + q(m[2]) + ' to the end of the list ' + q(m[1])],
      [/^(\w+)\.(sort|reverse)\(\)\s*$/, (m) => (m[2] === 'sort' ? 'Sorts' : 'Reverses') + ' the list ' + q(m[1]) + ' in place'],
      [/^(\w+(?:\[.*\])?)\s*(\+|-|\*|\/\/|\/|%|\*\*)=\s*(.+)/, (m) => 'Updates ' + q(m[1]) + ': ' + (OPS[m[2]] || 'applies') + ' ' + q(m[3])],
      [/^(\w+)\s*,\s*(\w+)\s*=\s*\2\s*,\s*\1\s*$/, (m) => 'Swaps the values of ' + q(m[1]) + ' and ' + q(m[2]) + ' in one step'],
      [/^([\w\s,]+?)\s*=\s*\[(.*)\]\s*$/, (m) => 'Creates a list ' + (m[2].trim() ? 'containing ' + q('[' + m[2] + ']') : '(empty)') + ' and stores it in ' + q(m[1])],
      [/^(\w+)\s*=\s*\{\s*\}\s*$/, (m) => 'Creates an empty dictionary ' + q(m[1])],
      [/^([\w.\[\]'"]+(?:\s*,\s*[\w.\[\]]+)*)\s*=(?!=)\s*(.+)/, (m) => (/,/.test(m[1]) ? 'Assigns values to ' + q(m[1]) + ' at the same time: ' : 'Stores ') + q(m[2]) + (/,/.test(m[1]) ? '' : ' in ' + q(m[1]))],
      [/^break\s*$/, () => 'Exits the loop immediately'],
      [/^continue\s*$/, () => 'Skips the rest of this iteration and moves to the next one'],
      [/^pass\s*$/, () => 'Does nothing (a placeholder for an empty block)'],
      [/^raise\s+(.+)/, (m) => 'Raises the error ' + q(m[1]) + ' on purpose'],
      [/^(\w+(?:\.\w+)*)\((.*)\)\s*$/, (m) => 'Calls ' + q(m[1] + '()') + (m[2].trim() ? ' with ' + q(m[2]) : '')]
    ],
    js: [
      [/^\/\//, () => 'Comment, ignored by JavaScript'],
      [/^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*(\w+)\s*\((.*?)\)/, (m) => 'Defines a function ' + q(m[1]) + (m[2].trim() ? ' with parameters ' + q(m[2]) : ' with no parameters')],
      [/^(?:export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s*)?\(?([\w\s,{}]*)\)?\s*=>/, (m) => 'Defines an arrow function ' + q(m[2]) + (m[4].trim() ? ' taking ' + q(m[4]) : '')],
      [/^(?:export\s+)?(const|let|var)\s+(.+?)\s*=\s*await\s+(.+?);?$/, (m) => 'Waits for ' + q(m[3]) + ' to finish (a Promise) and stores the result in ' + q(m[2])],
      [/^(?:export\s+)?(const|let|var)\s+(\w+)\s*=\s*document\.(querySelector|getElementById)\((.+)\);?$/, (m) => 'Finds the HTML element matching ' + q(m[4]) + ' and stores it in ' + q(m[2]) + ' (null if not found)'],
      [/^(?:export\s+)?(const|let|var)\s+(.+?)\s*=\s*(.+?);?$/, (m) => 'Declares ' + q(m[2]) + ' = ' + q(m[3]) + (m[1] === 'const' ? ' (const, so it cannot be reassigned)' : m[1] === 'let' ? ' (let, so it can be reassigned)' : ' (var: old-style and function-scoped)')],
      [/^for\s*\(\s*(?:let|var)?\s*(\w+)\s*=\s*(.+?);\s*(.+?);\s*(.+?)\)/, (m) => 'Loop: starts ' + q(m[1]) + ' at ' + q(m[2]) + ', repeats while ' + q(m[3]) + ', and runs ' + q(m[4]) + ' after each round'],
      [/^for\s*\(\s*(?:const|let|var)\s+(.+?)\s+of\s+(.+?)\)/, (m) => 'Loop: goes through each value in ' + q(m[2]) + ', calling it ' + q(m[1])],
      [/^for\s*\(\s*(?:const|let|var)\s+(\w+)\s+in\s+(.+?)\)/, (m) => 'Loop: goes through each key (property name or index) of ' + q(m[2])],
      [/^while\s*\((.+)\)/, (m) => 'Keeps repeating while ' + q(m[1]) + ' is true'],
      [/^if\s*\((.+)\)/, (m) => 'Runs the next block only if ' + q(m[1]) + ' is true'],
      [/^\}?\s*else\s+if\s*\((.+)\)/, (m) => 'Otherwise, checks ' + q(m[1])],
      [/^\}?\s*else\b/, () => 'Otherwise, runs this block'],
      [/^return\s*;?$/, () => 'Exits the function (returns undefined)'],
      [/^return\s+(.+?);?$/, (m) => 'Sends ' + q(m[1]) + ' back to the caller'],
      [/^console\.(log|error|warn)\((.*)\);?$/, (m) => 'Prints ' + q(m[2]) + ' to the console'],
      [/^(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/, (m) => 'Defines a class ' + q(m[1]) + (m[2] ? ' that extends ' + q(m[2]) : '')],
      [/^constructor\s*\((.*)\)/, (m) => 'Constructor: runs when a new object is created' + (m[1].trim() ? ', receiving ' + q(m[1]) : '')],
      [/^(\w+)\.addEventListener\(\s*["'](\w+)["']/, (m) => 'When the ' + q(m[2]) + ' event happens on ' + q(m[1]) + ', runs the given function'],
      [/^import\s+(.+?)\s+from\s+(.+?);?$/, (m) => 'Imports ' + q(m[1]) + ' from ' + q(m[2])],
      [/^(\w+)\.push\((.+)\);?$/, (m) => 'Adds ' + q(m[2]) + ' to the end of the array ' + q(m[1])],
      [/^(\w+)(\+\+|--);?$/, (m) => (m[2] === '++' ? 'Increases ' : 'Decreases ') + q(m[1]) + ' by 1'],
      [/^try\s*\{?/, () => 'Starts a block whose errors will be caught'],
      [/^\}?\s*catch\s*\((\w+)\)/, (m) => 'If an error happened above, it is available here as ' + q(m[1])],
      [/^([\w.\[\]]+)\s*(\+|-|\*|\/|%)=\s*(.+?);?$/, (m) => 'Updates ' + q(m[1]) + ': ' + (OPS[m[2]] || 'applies') + ' ' + q(m[3])],
      [/^([\w.\[\]]+)\s*=(?!=)\s*(.+?);?$/, (m) => 'Sets ' + q(m[1]) + ' to ' + q(m[2])],
      [/^\}[);]*$/, () => 'Closes the block'],
      [/^([\w.]+)\((.*)\);?$/, (m) => 'Calls ' + q(m[1] + '()') + (m[2].trim() ? ' with ' + q(m[2]) : '')]
    ],
    java: [
      [/^\/\//, () => 'Comment, ignored by the compiler'],
      [/^import\s+(.+);/, (m) => 'Imports ' + q(m[1]) + ' so it can be used in this file'],
      [/^package\s+(.+);/, (m) => 'Declares that this file belongs to the package ' + q(m[1])],
      [/^(?:public\s+)?(?:abstract\s+|final\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+(.+?))?\s*\{?$/, (m) => 'Defines the class ' + q(m[1]) + (m[2] ? ', inheriting from ' + q(m[2]) : '') + (m[3] ? ', implementing ' + q(m[3]) : '')],
      [/^public\s+static\s+void\s+main\s*\(/, () => '**Entry point**: Java starts running the program here'],
      [/^(?:(?:public|private|protected|static|final|abstract)\s+)*([\w<>\[\],\s]+?)\s+(\w+)\s*\((.*)\)\s*(?:throws\s+.+)?\{?$/, (m) => /^(if|for|while|switch|return|new|else)$/.test(m[2]) ? null : 'Defines the method ' + q(m[2]) + ' that returns ' + q(m[1]) + (m[3].trim() ? ' and takes ' + q(m[3]) : '')],
      [/^Scanner\s+(\w+)\s*=\s*new\s+Scanner\(System\.in\);/, (m) => 'Creates a Scanner called ' + q(m[1]) + ' to read keyboard input'],
      [/^System\.out\.println\((.*)\);/, (m) => 'Prints ' + (m[1].trim() ? q(m[1]) : 'an empty line') + ' followed by a new line'],
      [/^System\.out\.print\((.*)\);/, (m) => 'Prints ' + q(m[1]) + ' (stays on the same line)'],
      [/^System\.out\.printf\((.*)\);/, (m) => 'Prints formatted text: ' + q(m[1])],
      [/^(?:final\s+)?(int|double|float|long|char|boolean|String|byte|short)(\[\])?\s+(\w+)\s*=\s*(\w+)\.next(Int|Line|Double|Long|Float|Boolean)?\(\);/, (m) => 'Reads ' + (m[5] ? 'a ' + m[5].toLowerCase() : 'a word') + ' from the user into ' + q(m[3])],
      [/^(?:final\s+)?(int|double|float|long|char|boolean|String|byte|short)(\[\])?\s+(\w+)\s*=\s*(.+);/, (m) => 'Declares ' + (m[2] ? 'an array of ' + m[1] : 'a ' + m[1]) + ' variable ' + q(m[3]) + ' with the value ' + q(m[4])],
      [/^(int|double|float|long|char|boolean|String)(\[\])?\s+(\w+(?:\s*,\s*\w+)*);/, (m) => 'Declares the ' + m[1] + ' variable(s) ' + q(m[3]) + ' (no value yet)'],
      [/^([A-Z]\w*)(<.*>)?\s+(\w+)\s*=\s*new\s+(\w+)/, (m) => 'Creates a new ' + q(m[4]) + ' object and stores it in ' + q(m[3])],
      [/^for\s*\(\s*(?:int|long)?\s*(\w+)\s*=\s*(.+?);\s*(.+?);\s*(.+?)\)/, (m) => 'Loop: starts ' + q(m[1]) + ' at ' + q(m[2]) + ', repeats while ' + q(m[3]) + ', then ' + q(m[4]) + ' each round'],
      [/^for\s*\(\s*([\w<>]+)\s+(\w+)\s*:\s*(.+?)\)/, (m) => 'For-each loop: goes through every element of ' + q(m[3]) + ' as ' + q(m[2])],
      [/^while\s*\((.+)\)/, (m) => 'Repeats while ' + q(m[1]) + ' is true'],
      [/^if\s*\((.+)\)/, (m) => 'Runs the next block only if ' + q(m[1])],
      [/^\}?\s*else\s+if\s*\((.+)\)/, (m) => 'Otherwise, checks ' + q(m[1])],
      [/^\}?\s*else\b/, () => 'Otherwise, runs this block'],
      [/^switch\s*\((.+)\)/, (m) => 'Chooses a case based on the value of ' + q(m[1])],
      [/^case\s+(.+):/, (m) => 'If the value equals ' + q(m[1]) + ', start here'],
      [/^break;/, () => 'Exits the loop or switch'],
      [/^return\s+(.+);/, (m) => 'Returns ' + q(m[1]) + ' to the caller'],
      [/^return;/, () => 'Exits the method'],
      [/^\}?\s*catch\s*\(\s*(\w+)\s+(\w+)\s*\)/, (m) => 'Handles a ' + q(m[1]) + ' error (available as ' + q(m[2]) + ')'],
      [/^(\w+)(\+\+|--);/, (m) => (m[2] === '++' ? 'Increases ' : 'Decreases ') + q(m[1]) + ' by 1'],
      [/^([\w.\[\]]+)\s*(\+|-|\*|\/|%)=\s*(.+);/, (m) => 'Updates ' + q(m[1]) + ': ' + (OPS[m[2]] || 'applies') + ' ' + q(m[3])],
      [/^([\w.\[\]]+)\s*=(?!=)\s*(.+);/, (m) => 'Sets ' + q(m[1]) + ' to ' + q(m[2])],
      [/^\}$/, () => 'Closes the block'],
      [/^([\w.]+)\((.*)\);/, (m) => 'Calls ' + q(m[1] + '()') + (m[2].trim() ? ' with ' + q(m[2]) : '')]
    ],
    c: [
      [/^\/\//, () => 'Comment, ignored by the compiler'],
      [/^#include\s*[<"](.+)[>"]/, (m) => 'Includes the ' + q(m[1]) + ' header' + (HEADERS[m[1]] ? ', which gives access to ' + HEADERS[m[1]] : '')],
      [/^#define\s+(\w+)\s+(.+)/, (m) => 'Defines a constant/macro ' + q(m[1]) + ' = ' + q(m[2])],
      [/^using\s+namespace\s+std\s*;/, () => 'Lets you write «cout» instead of «std::cout»'],
      [/^int\s+main\s*\(/, () => '**Entry point**: the program starts running here'],
      [/^(?:(?:static|inline|const|unsigned)\s+)*(void|int|float|double|char|long|bool|string|auto|[\w:<>]+)\s*[*&]?\s*(\w+)\s*\((.*)\)\s*\{?$/, (m) => /^(if|for|while|switch|return)$/.test(m[2]) ? null : 'Defines the function ' + q(m[2]) + ' returning ' + q(m[1]) + (m[3].trim() && m[3].trim() !== 'void' ? ' and taking ' + q(m[3]) : '')],
      [/^printf\s*\((.*)\);/, (m) => 'Prints formatted text: ' + q(m[1])],
      [/^scanf\s*\(\s*"(.*?)"\s*,\s*(.*)\);/, (m) => 'Reads input matching ' + q(m[1]) + ' into ' + q(m[2]) + ' (the «&» passes each variable\'s address)'],
      [/^cout\s*<<\s*(.*);/, (m) => 'Prints ' + q(m[1].replace(/\s*<<\s*/g, ' ').replace(/\bendl\b/, '⏎'))],
      [/^cin\s*>>\s*(.*);/, (m) => 'Reads input from the keyboard into ' + q(m[1].replace(/\s*>>\s*/g, ', '))],
      [/^(?:const\s+)?(int|float|double|char|long|short|bool|string|unsigned|auto|size_t)\s*(\*)?\s*(\w+)\s*\[\s*(\w*)\s*\]\s*(=\s*(.+))?;/, (m) => 'Declares an array ' + q(m[3]) + ' of ' + (m[4] || 'some') + ' ' + m[1] + ' values' + (m[6] ? ' initialised to ' + q(m[6]) : '')],
      [/^(?:const\s+)?(int|float|double|char|long|short|bool|string|unsigned|auto|size_t)\s*(\*)?\s*(\w+)\s*=\s*(.+);/, (m) => 'Declares ' + (m[2] ? 'a pointer to ' + m[1] : 'a ' + m[1]) + ' variable ' + q(m[3]) + ' = ' + q(m[4])],
      [/^(int|float|double|char|long|short|bool|string)\s+([\w\s,*\[\]]+);/, (m) => 'Declares the ' + m[1] + ' variable(s) ' + q(m[2])],
      [/^(\w+)\s*=\s*(?:\([\w\s*]+\)\s*)?malloc\((.+)\);/, (m) => 'Allocates ' + q(m[2]) + ' bytes on the heap and stores the address in ' + q(m[1])],
      [/^free\((\w+)\);/, (m) => 'Releases the heap memory pointed to by ' + q(m[1])],
      [/^for\s*\(\s*(?:int|long|size_t)?\s*(\w+)\s*=\s*(.+?);\s*(.+?);\s*(.+?)\)/, (m) => 'Loop: starts ' + q(m[1]) + ' at ' + q(m[2]) + ', repeats while ' + q(m[3]) + ', then ' + q(m[4]) + ' each round'],
      [/^for\s*\(\s*(?:auto|int|char|const auto)&?\s+(\w+)\s*:\s*(.+?)\)/, (m) => 'Range-based loop over every element of ' + q(m[2]) + ' as ' + q(m[1])],
      [/^while\s*\((.+)\)/, (m) => 'Repeats while ' + q(m[1]) + ' is true'],
      [/^if\s*\((.+)\)/, (m) => 'Runs the next block only if ' + q(m[1])],
      [/^\}?\s*else\s+if\s*\((.+)\)/, (m) => 'Otherwise, checks ' + q(m[1])],
      [/^\}?\s*else\b/, () => 'Otherwise, runs this block'],
      [/^return\s+0\s*;/, () => 'Ends the function. In «main», returning 0 tells the OS the program succeeded'],
      [/^return\s+(.+);/, (m) => 'Returns ' + q(m[1]) + ' to the caller'],
      [/^(?:struct|class)\s+(\w+)/, (m) => 'Defines the type ' + q(m[1])],
      [/^break;/, () => 'Exits the loop or switch'],
      [/^(\w+)(\+\+|--);/, (m) => (m[2] === '++' ? 'Increases ' : 'Decreases ') + q(m[1]) + ' by 1'],
      [/^([\w.\[\]*>-]+)\s*(\+|-|\*|\/|%)=\s*(.+);/, (m) => 'Updates ' + q(m[1]) + ': ' + (OPS[m[2]] || 'applies') + ' ' + q(m[3])],
      [/^([\w.\[\]*>-]+)\s*=(?!=)\s*(.+);/, (m) => 'Sets ' + q(m[1]) + ' to ' + q(m[2])],
      [/^\}\s*;?$/, () => 'Closes the block'],
      [/^([\w:.]+)\((.*)\);/, (m) => 'Calls ' + q(m[1] + '()') + (m[2].trim() ? ' with ' + q(m[2]) : '')]
    ]
  };

  A.explainLines = function (code, lang) {
    lang = lang || A.detectLanguage(code).lang || 'python';
    const fam = lang === 'python' ? 'python' : (lang === 'javascript' || lang === 'typescript') ? 'js' : lang === 'java' || lang === 'csharp' ? 'java' : (lang === 'c' || lang === 'cpp') ? 'c' : null;
    if (!fam) return [];
    const rules = RULES[fam];
    const out = [];
    String(code).replace(/\r\n?/g, '\n').split('\n').forEach((line, i) => {
      const t = line.trim();
      if (!t || /^[{}]$/.test(t) && fam !== 'java' && fam !== 'c') return;
      if (t === '{') return;
      let text = null;
      for (const [re, fn] of rules) { const m = t.match(re); if (m) { text = fn(m); if (text) break; } }
      out.push({ line: i + 1, code: t, text: text || 'Executes this statement' });
    });
    return out;
  };
})();
