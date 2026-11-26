/* CodeMentor — offline retrieval: BM25 ranking + alias phrase matching over the knowledge base */
(function () {
  'use strict';
  const CM = window.CM;

  const STOP = new Set(('a an the is are was were be been being of to in on at for from by with and or not no do does did done how what why when where which who whom ' +
    'this that these those it its i me my you your we our they them he she his her can could should would will shall may might must ' +
    'please explain tell show give help about want need know get make like just also any some there here than then so if else into using use ' +
    'mean means meaning work works working program code example examples simple simply understand difference between vs versus').split(' '));

  const SYN = {
    js: 'javascript', javascript: 'javascript', py: 'python', python3: 'python', cpp: 'cplusplus', 'c++': 'cplusplus', 'c#': 'csharp',
    func: 'function', fn: 'function', funcs: 'function', method: 'function', arr: 'array', dict: 'dictionary', dicts: 'dictionary', hashmap: 'hash',
    oops: 'oop', bst: 'tree', dp: 'dynamic', ds: 'structure', algo: 'algorithm', algos: 'algorithm', recursive: 'recursion', recurse: 'recursion',
    var: 'variable', vars: 'variable', obj: 'object', str: 'string', int: 'integer', ptr: 'pointer', ll: 'linked', err: 'error', exception: 'error',
    loops: 'loop', looping: 'loop', iterate: 'loop', iteration: 'loop', sorting: 'sort', sorted: 'sort', searching: 'search', db: 'database', regex: 'regular'
  };

  function stem(w) {
    if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
    if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
    if (w.length > 4 && w.endsWith('es') && !w.endsWith('ses')) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
    if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
    return w;
  }

  function tokenize(text) {
    const out = [];
    const t = String(text || '').toLowerCase()
      .replace(/c\+\+/g, ' cplusplus ').replace(/c#/g, ' csharp ')
      .replace(/===/g, ' strictequal ').replace(/==/g, ' doubleequal ').replace(/!=/g, ' notequal ')
      .replace(/=>/g, ' arrow ').replace(/\+\+/g, ' increment ').replace(/&&/g, ' and ').replace(/\|\|/g, ' or ');
    const words = t.match(/[a-z0-9_]+/g) || [];
    for (let w of words) {
      if (SYN[w]) w = SYN[w];
      if (STOP.has(w) || w.length < 2 && !/^\d$/.test(w)) continue;
      out.push(stem(w));
    }
    return out;
  }

  const norm = (s) => ' ' + String(s || '').toLowerCase().replace(/[«»`'"“”()[\]{}?!.,:;]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';

  let docs = null, df = null, avgLen = 0;

  function fieldsOf(e) {
    const strip = (s) => String(s || '').replace(/~~~[\s\S]*?~~~/g, ' ').replace(/```[\s\S]*?```/g, ' ');
    switch (e.type) {
      case 'concept': return { title: e.title, alias: (e.aliases || []).join(' '), summary: e.summary + ' ' + (e.cat || ''), body: strip(e.explain) };
      case 'error': return { title: e.title, alias: (e.kw || []).join(' '), summary: e.what + ' ' + (e.lang || ''), body: (e.causes || []).join(' ') + ' ' + e.concept };
      case 'recipe': return { title: e.title, alias: (e.kw || []).join(' '), summary: e.approach, body: (e.notes || []).join(' ') };
      case 'compare': return { title: e.title, alias: (e.terms || []).map((t) => t.join(' ')).join(' '), summary: e.verdict, body: strip(e.body) };
      case 'faq': return { title: e.title, alias: '', summary: '', body: strip(e.answer) };
      default: return { title: e.title || '', alias: '', summary: '', body: '' };
    }
  }
  const WEIGHT = { title: 3, alias: 3, summary: 1.6, body: 0.6 };

  function build() {
    const KB = CM.kb;
    docs = [];
    df = new Map();
    let total = 0;
    ['concepts', 'errors', 'recipes', 'compares', 'faqs'].forEach((type) => {
      KB[type].forEach((e) => {
        const f = fieldsOf(e);
        const tf = new Map();
        let len = 0;
        for (const k in f) {
          for (const tok of tokenize(f[k])) { tf.set(tok, (tf.get(tok) || 0) + WEIGHT[k]); len += WEIGHT[k]; }
        }
        for (const tok of tf.keys()) df.set(tok, (df.get(tok) || 0) + 1);
        const aliases = [];
        if (e.aliases) aliases.push(...e.aliases);
        if (e.kw) aliases.push(...e.kw);
        if (e.title) aliases.push(e.title.replace(/[«»]/g, ''));
        docs.push({ e, tf, len, aliases: aliases.map((a) => norm(a)).filter((a) => a.trim().length > 1) });
        total += len;
      });
    });
    avgLen = total / Math.max(1, docs.length);
  }

  /** Length (in chars) of the longest alias phrase contained in the query. */
  function aliasHit(nq, d) {
    let best = 0;
    for (const a of d.aliases) if (a.length > best && nq.indexOf(a) >= 0) best = a.length;
    return best;
  }

  /**
   * Ranks knowledge-base entries for a query.
   * @returns [{e, score, alias}] sorted by score.
   */
  function query(text, opts) {
    opts = opts || {};
    if (!docs) build();
    const q = tokenize(text);
    const nq = norm(text);
    const N = docs.length, k1 = 1.4, b = 0.72;
    const res = [];
    for (const d of docs) {
      if (opts.types && opts.types.indexOf(d.e.type) < 0) continue;
      let s = 0;
      for (const t of q) {
        const f = d.tf.get(t);
        if (!f) continue;
        const n = df.get(t) || 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / avgLen));
      }
      const ah = aliasHit(nq, d);
      if (ah) s += 4 + ah / 2.5;
      if (opts.lang && d.e.lang && d.e.lang === opts.lang) s *= 1.15;
      if (s > 0) res.push({ e: d.e, score: s, alias: ah });
    }
    res.sort((a, b) => b.score - a.score);
    return res.slice(0, opts.limit || 8);
  }

  CM.search = { build, query, tokenize, norm, invalidate() { docs = null; } };
})();
