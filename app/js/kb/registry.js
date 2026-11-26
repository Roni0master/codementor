/* CodeMentor — knowledge-base registry.
   Authoring convention: inside KB prose, «text» is written for inline code (converted to `text`)
   and ~~~lang fences are used for code blocks, so the content can live in JS template literals. */
(function () {
  'use strict';
  const CM = window.CM;

  function fix(v) {
    if (typeof v === 'string') return v.replace(/[«»]/g, '`');
    if (Array.isArray(v)) return v.map(fix);
    if (v && typeof v === 'object' && !(v instanceof RegExp)) {
      const o = {};
      for (const k in v) o[k] = fix(v[k]);
      return o;
    }
    return v;
  }

  const KB = (CM.kb = {
    concepts: [], errors: [], recipes: [], compares: [], faqs: [],
    index: {},
    add(type, list) {
      list.forEach((entry) => {
        const e = fix(entry);
        e.type = type.replace(/s$/, '').replace(/ie$/, 'y');
        this[type].push(e);
        this.index[type + ':' + e.id] = e;
      });
    },
    get(type, id) { return this.index[type + ':' + id] || null; },
    concept(id) { return this.index['concepts:' + id] || null; }
  });

  /** Encodes a follow-up question as a markdown link the chat turns into a clickable chip. */
  KB.ask = (label, question) => '[' + String(label).replace(/[[\]]/g, '') + '](ask:' + encodeURIComponent(question || label).replace(/\(/g, '%28').replace(/\)/g, '%29') + ')';

  KB.CATEGORIES = ['Basics', 'OOP', 'Data Structures', 'Algorithms', 'JavaScript', 'Python', 'C / C++', 'Java', 'Tools & Web', 'Databases'];
})();
