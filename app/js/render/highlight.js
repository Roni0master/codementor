/* CodeMentor — lightweight, dependency-free syntax highlighter */
(function () {
  'use strict';
  const CM = window.CM;
  const esc = CM.util.esc;
  const W = (s) => new Set(s.split(/\s+/).filter(Boolean));

  const L = {};
  L.python = {
    kw: W('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'),
    lit: W('True False None self cls'),
    bi: W('print len range int str float list dict set tuple input open enumerate zip map filter sorted sum min max abs type isinstance super round any all reversed bool chr ord iter next format hasattr getattr setattr id hash pow divmod repr'),
    types: W('Exception ValueError TypeError KeyError IndexError NameError ZeroDivisionError'),
    line: '#', str: 'py', deco: true
  };
  const JS_KW = 'break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return super switch this throw try typeof var void while with yield async await from static get set';
  L.javascript = {
    kw: W(JS_KW), lit: W('true false null undefined NaN Infinity'),
    bi: W('console document window Math JSON Array Object String Number Boolean Promise Map Set Date RegExp Error parseInt parseFloat setTimeout setInterval clearTimeout fetch require module exports localStorage alert prompt'),
    line: '//', block: true, str: 'js', capTypes: false
  };
  L.typescript = Object.assign({}, L.javascript, {
    kw: W(JS_KW + ' interface type enum implements private public protected readonly declare namespace abstract keyof as is'),
    types: W('string number boolean any unknown never void object')
  });
  L.java = {
    kw: W('abstract assert break case catch class continue default do else enum extends final finally for if implements import instanceof interface native new package private protected public return static strictfp super switch synchronized this throw throws transient try volatile while var record yield'),
    lit: W('true false null'),
    types: W('int long short byte char float double boolean void'),
    bi: W('System out println print printf'),
    line: '//', block: true, str: 'c', annot: true, capTypes: true
  };
  L.c = {
    kw: W('auto break case const continue default do else enum extern for goto if inline register restrict return sizeof static struct switch typedef union volatile while'),
    lit: W('NULL true false EOF'),
    types: W('int long short char float double void unsigned signed size_t bool FILE'),
    bi: W('printf scanf malloc calloc realloc free strlen strcpy strncpy strcmp strcat fopen fclose fgets fprintf puts gets getchar putchar memset memcpy exit sqrt pow abs'),
    line: '//', block: true, str: 'c', pre: true
  };
  L.cpp = Object.assign({}, L.c, {
    kw: W([...L.c.kw].join(' ') + ' class namespace using template typename public private protected virtual override new delete this throw try catch operator friend nullptr constexpr noexcept explicit mutable'),
    types: W([...L.c.types].join(' ') + ' string vector map set unordered_map unordered_set pair auto queue stack deque priority_queue'),
    bi: W([...L.c.bi].join(' ') + ' cout cin endl cerr getline push_back pop_back size begin end sort swap max min make_pair std'),
    capTypes: true
  });
  L.csharp = {
    kw: W('abstract as base break case catch class const continue default delegate do else enum event explicit extern finally fixed for foreach goto if implicit in interface internal is lock namespace new operator out override params private protected public readonly ref return sealed sizeof static struct switch this throw try typeof unchecked unsafe using virtual volatile while var async await get set'),
    lit: W('true false null'), types: W('int long short byte char float double decimal bool string object void'),
    bi: W('Console WriteLine ReadLine Math List Dictionary'), line: '//', block: true, str: 'c', annot: false, capTypes: true
  };
  L.go = { kw: W('break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var'), lit: W('true false nil iota'), types: W('int int64 float64 string bool byte rune error'), bi: W('fmt Println Printf len cap append make new panic'), line: '//', block: true, str: 'js' };
  L.rust = { kw: W('as break const continue crate else enum extern fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait type unsafe use where while async await'), lit: W('true false None Some Ok Err'), types: W('i32 i64 u32 u64 usize f32 f64 bool char str String Vec Option Result'), bi: W('println print format vec'), line: '//', block: true, str: 'c', capTypes: true };
  L.php = { kw: W('abstract and as break case catch class const continue declare default do echo else elseif extends final for foreach function global if implements include interface namespace new or private protected public require return static switch throw trait try use var while'), lit: W('true false null'), bi: W('print_r var_dump count strlen array isset'), line: '//', block: true, str: 'c', vars: true };
  L.ruby = { kw: W('alias and begin break case class def do else elsif end ensure for if in module next nil not or redo rescue retry return self super then unless until when while yield require puts'), lit: W('true false nil'), bi: W('puts print gets each map'), line: '#', str: 'c' };
  L.sql = {
    kw: W('select from where insert into values update set delete create table drop alter add primary key foreign references join inner left right full outer cross on group by order having limit offset as and or not null is in like between distinct union all exists case when then else end index view default unique check constraint auto_increment database use asc desc'),
    types: W('int integer varchar char text date datetime timestamp decimal float double boolean serial bigint'),
    bi: W('count sum avg min max coalesce now upper lower length round'),
    ci: true, line: '--', block: true, str: 'sql'
  };
  L.bash = { kw: W('if then else elif fi for while do done case esac function in return export local echo cd ls mkdir rm cp mv cat grep sudo apt pip pip3 npm npx node python python3 git java javac gcc g++ cls dir set'), lit: W('true false'), line: '#', str: 'sh', vars: true };
  L.json = { lit: W('true false null'), str: 'json' };

  const ALIAS = {
    py: 'python', python3: 'python', js: 'javascript', jsx: 'javascript', mjs: 'javascript', node: 'javascript', javascript: 'javascript',
    ts: 'typescript', tsx: 'typescript', 'c++': 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', h: 'c', cs: 'csharp', 'c#': 'csharp',
    sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', powershell: 'bash', ps1: 'bash', cmd: 'bash', bat: 'bash', terminal: 'bash',
    xml: 'html', svg: 'html', htm: 'html', vue: 'html', scss: 'css', less: 'css', golang: 'go', rs: 'rust', rb: 'ruby', mysql: 'sql', postgresql: 'sql', sqlite: 'sql'
  };
  const LABEL = { python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript', java: 'Java', c: 'C', cpp: 'C++', csharp: 'C#', go: 'Go', rust: 'Rust', php: 'PHP', ruby: 'Ruby', sql: 'SQL', bash: 'Terminal', json: 'JSON', html: 'HTML', css: 'CSS', text: 'Text', diff: 'Diff' };

  const STR = {
    py: "[rRbBuUfF]{0,2}(?:\"\"\"[\\s\\S]*?(?:\"\"\"|$)|'''[\\s\\S]*?(?:'''|$)|\"(?:\\\\.|[^\"\\\\\\n])*\"?|'(?:\\\\.|[^'\\\\\\n])*'?)",
    js: "\"(?:\\\\.|[^\"\\\\\\n])*\"?|'(?:\\\\.|[^'\\\\\\n])*'?|`(?:\\\\[\\s\\S]|[^`\\\\])*`?",
    c: "\"(?:\\\\.|[^\"\\\\\\n])*\"?|'(?:\\\\.|[^'\\\\\\n])*'?",
    sql: "'(?:''|[^'\\n])*'?|\"(?:[^\"\\n])*\"?",
    sh: "\"(?:\\\\.|[^\"\\\\])*\"?|'[^']*'?",
    json: "\"(?:\\\\.|[^\"\\\\\\n])*\"?"
  };

  function build(cfg) {
    const parts = [];
    const com = [];
    if (cfg.line) com.push(cfg.line.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '[^\\n]*');
    if (cfg.block) com.push('/\\*[\\s\\S]*?(?:\\*/|$)');
    if (com.length) parts.push('(?<com>' + com.join('|') + ')');
    parts.push('(?<str>' + STR[cfg.str || 'c'] + ')');
    if (cfg.pre) parts.push('(?<pre>^[ \\t]*#[ \\t]*[a-z]+[^\\n]*)');
    if (cfg.deco) parts.push('(?<deco>^[ \\t]*@[\\w.]+)');
    else if (cfg.annot) parts.push('(?<deco>@\\w+)');
    if (cfg.vars) parts.push('(?<vr>\\$\\{?[A-Za-z_]\\w*\\}?)');
    parts.push('(?<num>\\b(?:0[xX][\\da-fA-F_]+|0[bB][01_]+|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)[lLfFuUdDmMnj]?\\b)');
    parts.push('(?<id>[A-Za-z_$][\\w$]*)');
    parts.push('(?<op>=>|->|::|[-+*/%=<>!&|^~?:]+)');
    return new RegExp(parts.join('|'), 'gm');
  }

  const span = (c, t) => '<span class="t-' + c + '">' + esc(t) + '</span>';
  const FN_AHEAD = /\s*\(/y;
  const PROP_AHEAD = /\s*:/y;

  function hlGeneric(code, cfg) {
    const re = cfg._re || (cfg._re = build(cfg));
    re.lastIndex = 0;
    let out = '', last = 0, m, prev = '';
    while ((m = re.exec(code))) {
      if (m[0] === '') { re.lastIndex++; continue; }
      if (m.index > last) out += esc(code.slice(last, m.index));
      const g = m.groups, t = m[0];
      if (g.com) out += span('com', t);
      else if (g.str) {
        if (cfg.str === 'json') { PROP_AHEAD.lastIndex = re.lastIndex; out += span(PROP_AHEAD.test(code) ? 'prop' : 'str', t); }
        else out += span('str', t);
      }
      else if (g.pre) out += span('pre', t);
      else if (g.deco) out += span('deco', t);
      else if (g.vr) out += span('var', t);
      else if (g.num) out += span('num', t);
      else if (g.id) {
        const w = cfg.ci ? t.toLowerCase() : t;
        let cls = '';
        if (cfg.kw && cfg.kw.has(w)) cls = 'kw';
        else if (cfg.lit && cfg.lit.has(w)) cls = 'lit';
        else if (cfg.types && cfg.types.has(cfg.ci ? w : t)) cls = 'type';
        else if (prev === 'def' || prev === 'function' || prev === 'fn' || prev === 'func') cls = 'fn';
        else if (prev === 'class' || prev === 'struct' || prev === 'interface' || prev === 'new' || prev === 'extends' || prev === 'implements') cls = 'type';
        else { FN_AHEAD.lastIndex = re.lastIndex; if (FN_AHEAD.test(code)) cls = 'fn'; }
        if (!cls && cfg.bi && cfg.bi.has(cfg.ci ? w : t)) cls = 'bi';
        if (!cls && cfg.capTypes && /^[A-Z][a-z0-9]\w*$/.test(t)) cls = 'type';
        out += cls ? span(cls, t) : esc(t);
        prev = w;
        last = re.lastIndex;
        continue;
      }
      else if (g.op) out += span('op', t);
      else out += esc(t);
      if (!/^\s+$/.test(t)) prev = '';
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  function hlHtml(code) {
    const re = /(<!--[\s\S]*?(?:-->|$))|(<\/?)([A-Za-z][\w:-]*)([^<>]*?)(\/?>)|(&[#\w]+;)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(code))) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      if (m[1]) out += span('com', m[1]);
      else if (m[6]) out += span('lit', m[6]);
      else {
        out += span('op', m[2]) + span('tag', m[3]);
        out += m[4].replace(/([^\s=]+)(\s*=\s*)?("[^"]*"|'[^']*'|[^\s"'>]+)?|(\s+)/g, (all, a, eq, v, ws) => {
          if (ws) return ws;
          return span('attr', a) + (eq ? esc(eq) : '') + (v ? span('str', v) : '');
        });
        out += span('op', m[5]);
      }
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  function hlCss(code) {
    const re = /(\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[\w-]+)|(#[\da-fA-F]{3,8}\b)|(-?\d*\.?\d+(?:px|em|rem|%|vh|vw|s|ms|deg|fr)?)|([\w-]+)(?=\s*:[^{};]*[;}])|([{}])|(!important)/g;
    let out = '', last = 0, m, depth = 0;
    while ((m = re.exec(code))) {
      if (m.index > last) { const seg = code.slice(last, m.index); out += depth === 0 ? span('sel', seg) : esc(seg); }
      if (m[1]) out += span('com', m[1]);
      else if (m[2]) out += span('str', m[2]);
      else if (m[3]) out += span('kw', m[3]);
      else if (m[4]) out += span('num', m[4]);
      else if (m[5]) out += depth ? span('num', m[5]) : span('sel', m[5]);
      else if (m[6]) out += depth ? span('prop', m[6]) : span('sel', m[6]);
      else if (m[7]) { depth += m[7] === '{' ? 1 : -1; if (depth < 0) depth = 0; out += esc(m[7]); }
      else if (m[8]) out += span('kw', m[8]);
      last = re.lastIndex;
    }
    const rest = code.slice(last);
    return out + (depth === 0 ? span('sel', rest) : esc(rest));
  }

  function hlDiff(code) {
    return code.split('\n').map((l) => /^\+/.test(l) ? '<span class="t-str">' + esc(l) + '</span>' : /^-/.test(l) ? '<span class="t-lit">' + esc(l) + '</span>' : /^@@/.test(l) ? '<span class="t-fn">' + esc(l) + '</span>' : esc(l)).join('\n');
  }

  CM.hl = {
    normalize(lang) {
      lang = String(lang || '').toLowerCase().trim();
      return ALIAS[lang] || lang || 'text';
    },
    label(lang) { const k = CM.hl.normalize(lang); return LABEL[k] || (k ? k.toUpperCase() : 'Code'); },
    known(lang) { const k = CM.hl.normalize(lang); return !!(L[k] || k === 'html' || k === 'css'); },
    highlight(code, lang) {
      const k = CM.hl.normalize(lang);
      try {
        if (k === 'html') return hlHtml(code);
        if (k === 'css') return hlCss(code);
        if (k === 'diff') return hlDiff(code);
        const cfg = L[k];
        return cfg ? hlGeneric(code, cfg) : esc(code);
      } catch (e) { return esc(code); }
    }
  };
})();
