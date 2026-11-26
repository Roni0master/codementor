/* CodeMentor — Library: concepts, error encyclopedia, code recipes, comparisons, quizzes */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, A = CM.auth, KB = CM.kb;
  const esc = U.esc;
  const V = (CM.views = CM.views || {});
  const clean = (s) => String(s || '').replace(/[«»`]/g, '');
  let lastTab = 'concepts', lastQ = '', lastCat = 'all';

  const TABS = [
    { id: 'concepts', label: 'Concepts', icon: 'lightbulb', list: () => KB.concepts },
    { id: 'errors', label: 'Error encyclopedia', icon: 'bug', list: () => KB.errors },
    { id: 'recipes', label: 'Code recipes', icon: 'code', list: () => KB.recipes },
    { id: 'compares', label: 'Comparisons', icon: 'compare', list: () => KB.compares }
  ];
  const ERR_LANG = { python: 'Python', javascript: 'JavaScript', java: 'Java', c: 'C', cpp: 'C++', sql: 'SQL', bash: 'Tools & Git' };

  function learned() { return (A.user.stats.learned = A.user.stats.learned || []); }

  V.library = {
    render(container, params) {
      params = params || {};
      if (params.kind && params.id) return renderDetail(container, params.kind, params.id);
      if (params.tab) lastTab = params.tab;
      renderList(container);
    }
  };

  function renderList(container) {
    container.innerHTML = '';
    const total = KB.concepts.length;
    const done = learned().filter((id) => KB.concept(id)).length;
    const pct = Math.round((done / total) * 100);
    const el = U.html(`
<div class="page"><div class="page-inner">
  <div class="page-head"><div><h1>Library</h1><p>Everything CodeMentor knows, organised for browsing. Works offline, always.</p></div></div>
  <div class="lib-hero">
    <div><h2>Your learning progress</h2><p>You have marked <b>${done}</b> of <b>${total}</b> concepts as learned. Open a concept, read it, take the quiz, and mark it learned.</p>
    <div class="progress" style="margin-top:12px;max-width:420px"><span style="width:${pct}%"></span></div></div>
    <div class="ring" style="--p:${pct}"><b>${pct}%</b></div>
  </div>
  <div class="tabs lib-tabs" role="tablist"></div>
  <div class="toolbar" style="margin-top:18px"><div class="input-wrap">${CM.icon('search', 17)}<input class="input" type="search" placeholder="Search the library…" aria-label="Search library"></div></div>
  <div class="filters cat-filters"></div>
  <div class="lib-grid"></div>
</div></div>`);
    container.appendChild(el);
    const tabsEl = el.querySelector('.lib-tabs');
    TABS.forEach((t) => {
      const b = U.html('<button class="tab ' + (t.id === lastTab ? 'on' : '') + '" data-tab="' + t.id + '">' + CM.icon(t.icon, 16) + t.label + '<span class="count">' + t.list().length + '</span></button>');
      b.onclick = () => { lastTab = t.id; lastCat = 'all'; tabsEl.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === b)); draw(); };
      tabsEl.appendChild(b);
    });
    const search = el.querySelector('input[type=search]');
    search.value = lastQ;
    search.addEventListener('input', U.debounce(() => { lastQ = search.value; draw(); }, 100));
    const grid = el.querySelector('.lib-grid');
    const cats = el.querySelector('.cat-filters');

    function cardFor(e, i) {
      const isLearned = e.type === 'concept' && learned().indexOf(e.id) >= 0;
      let top = '', title = clean(e.title), desc = '';
      if (e.type === 'concept') { top = '<span class="badge badge-accent">' + esc(e.cat) + '</span><span class="badge">' + esc(e.level || '') + '</span>'; desc = e.summary; }
      if (e.type === 'error') { top = '<span class="badge badge-err">' + esc(ERR_LANG[e.lang] || e.lang) + '</span>'; desc = e.what.replace(/\$\d/g, (m) => (e.dflt && e.dflt[+m[1] - 1]) || '…'); }
      if (e.type === 'recipe') { top = Object.keys(e.code).map((l) => '<span class="badge">' + esc(U.langName(l)) + '</span>').join(''); desc = e.approach; }
      if (e.type === 'compare') { top = '<span class="badge badge-warn">Comparison</span>'; desc = e.verdict; }
      const b = U.html(`<button class="lib-card" style="animation-delay:${Math.min(i, 20) * 0.02}s">${isLearned ? '<span class="learned" title="Learned">' + CM.icon('check-circle', 18) + '</span>' : ''}<div class="top row wrap" style="gap:6px">${top}</div><b>${esc(title)}</b><p>${esc(clean(desc))}</p></button>`);
      b.onclick = () => CM.app.navigate('#/library/' + e.type + '/' + e.id);
      return b;
    }

    function draw() {
      const tab = TABS.find((t) => t.id === lastTab);
      let items = tab.list();
      // categories
      let catList = [];
      if (lastTab === 'concepts') catList = KB.CATEGORIES.filter((c) => KB.concepts.some((x) => x.cat === c));
      if (lastTab === 'errors') catList = Object.keys(ERR_LANG).filter((l) => KB.errors.some((x) => x.lang === l));
      cats.innerHTML = catList.length ? ['all'].concat(catList).map((c) => '<button class="chip ' + (lastCat === c ? 'on' : '') + '" data-c="' + esc(c) + '">' + esc(c === 'all' ? 'All' : (ERR_LANG[c] || c)) + '</button>').join('') : '';
      cats.onclick = (e) => { const b = e.target.closest('[data-c]'); if (b) { lastCat = b.dataset.c; draw(); } };
      if (lastCat !== 'all') items = items.filter((x) => (lastTab === 'concepts' ? x.cat : x.lang) === lastCat);
      const q = lastQ.trim();
      if (q) {
        const hits = CM.search.query(q, { types: [tab.id.replace(/s$/, '')], limit: 60 });
        const ids = new Set(hits.map((h) => h.e.id));
        const sub = items.filter((x) => clean(x.title).toLowerCase().indexOf(q.toLowerCase()) >= 0);
        items = hits.map((h) => h.e).filter((x) => items.indexOf(x) >= 0);
        sub.forEach((x) => { if (!ids.has(x.id)) items.unshift(x); });
      }
      grid.innerHTML = '';
      if (!items.length) { grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="empty-ic">' + CM.icon('search', 26) + '</div><h3>Nothing found</h3><p>Try another search, or ask the mentor directly in chat.</p></div>'; return; }
      items.forEach((e, i) => grid.appendChild(cardFor(e, i)));
    }
    draw();
  }

  function renderDetail(container, kind, id) {
    const map = { concept: 'concepts', error: 'errors', recipe: 'recipes', compare: 'compares' };
    const e = KB.get(map[kind], id);
    if (!e) { U.toast('Not found in the library', 'warn'); CM.app.navigate('#/library'); return; }
    lastTab = map[kind];
    container.innerHTML = '';
    const prefLang = A.user.profile.primaryLang || 'python';
    let md = '';
    if (kind === 'concept') md = CM.brain.renderConcept(e, { lang: prefLang, pref: prefLang, level: A.user.profile.level }).replace(/^## .*\n+(> .*\n+)?/, '');
    if (kind === 'recipe') md = CM.brain.renderRecipe(e, { lang: prefLang, pref: prefLang }).replace(/^## .*\n+/, '');
    if (kind === 'error') md = CM.brain.renderErrorEntry(e, { level: A.user.profile.level }).replace(/^## .*\n+/, '');
    if (kind === 'compare') md = CM.brain.renderCompare(e, { lang: prefLang }).replace(/^## .*\n+/, '');
    const isLearned = kind === 'concept' && learned().indexOf(e.id) >= 0;
    const askQ = kind === 'concept' ? 'Explain ' + e.title : clean(e.title);
    const el = U.html(`
<div class="page"><div class="page-inner"><div class="lib-detail">
  <a class="btn btn-ghost btn-sm lib-back" href="#/library">${CM.icon('arrow-left', 16)}<span>Library</span></a>
  <div class="lib-detail-head">
    <div class="grow">
      <div class="row wrap" style="gap:6px;margin-bottom:10px">${kind === 'concept' ? '<span class="badge badge-accent">' + esc(e.cat) + '</span><span class="badge">' + esc(e.level) + '</span>' : kind === 'error' ? '<span class="badge badge-err">' + esc(ERR_LANG[e.lang] || e.lang) + ' error</span>' : kind === 'recipe' ? '<span class="badge badge-ok">Code recipe</span>' : '<span class="badge badge-warn">Comparison</span>'}</div>
      <h1>${esc(clean(e.title))}</h1>
      ${kind === 'concept' ? '<p class="summary">' + esc(clean(e.summary)) + '</p>' : ''}
    </div>
    <div class="row wrap">
      ${kind === 'concept' ? '<button class="btn ' + (isLearned ? 'btn-primary' : '') + '" data-act="learn">' + CM.icon(isLearned ? 'check-circle' : 'check', 16) + '<span>' + (isLearned ? 'Learned' : 'Mark as learned') + '</span></button>' : ''}
      <button class="btn btn-grad" data-act="ask">${CM.icon('message', 16)}<span>Ask in chat</span></button>
    </div>
  </div>
  <div class="md card card-pad lib-md"></div>
  <div class="quiz-host"></div>
</div></div></div>`);
    container.appendChild(el);
    const mdEl = el.querySelector('.lib-md');
    mdEl.innerHTML = CM.md.render(md);
    CM.md.bind(mdEl, { ask: (q) => { CM.app.navigate('#/chat'); setTimeout(() => CM.views.chat.ask(q), 80); }, playground: (code, lang) => CM.app.openPlayground(code, lang) });
    el.querySelector('[data-act=ask]').onclick = () => { CM.app.navigate('#/chat'); setTimeout(() => CM.views.chat.ask(askQ), 80); };
    const lb = el.querySelector('[data-act=learn]');
    if (lb) lb.onclick = async () => {
      const L = learned(); const i = L.indexOf(e.id);
      if (i >= 0) L.splice(i, 1); else L.push(e.id);
      A.user.stats.concepts = L.length;
      await A.save();
      const now = L.indexOf(e.id) >= 0;
      lb.classList.toggle('btn-primary', now);
      lb.innerHTML = CM.icon(now ? 'check-circle' : 'check', 16) + '<span>' + (now ? 'Learned' : 'Mark as learned') + '</span>';
      if (now) U.toast('Nice! “' + e.title + '” marked as learned 🎉', 'success');
      CM.app.refreshSidebar();
    };
    if (kind === 'concept' && e.quiz && e.quiz.length) renderQuiz(el.querySelector('.quiz-host'), e);
  }

  function renderQuiz(host, c) {
    const L = 'ABCD';
    const best = (A.user.stats.quizzes || {})[c.id];
    host.innerHTML = '<div class="quiz"><div class="row-between"><h2 style="font-size:20px">' + CM.icon('target', 20) + ' Test yourself</h2><span class="faint qz-score">' + (best != null ? 'Best score: ' + best + '/' + c.quiz.length : c.quiz.length + ' questions') + '</span></div></div>';
    const wrap = host.querySelector('.quiz');
    let answered = 0, correct = 0;
    c.quiz.forEach((q, qi) => {
      const box = U.html('<div class="quiz-q"><b>' + (qi + 1) + '. ' + CM.md.inline(q.q.replace(/[«»]/g, '`')) + '</b><div class="quiz-opts"></div></div>');
      const opts = box.querySelector('.quiz-opts');
      q.o.forEach((o, oi) => {
        const b = U.html('<button class="quiz-opt"><span class="letter">' + L[oi] + '</span><span>' + CM.md.inline(o.replace(/[«»]/g, '`')) + '</span></button>');
        b.onclick = async () => {
          opts.querySelectorAll('.quiz-opt').forEach((x, xi) => { x.disabled = true; if (xi === q.a) x.classList.add('right'); });
          if (oi !== q.a) b.classList.add('wrong'); else correct++;
          answered++;
          box.appendChild(U.html('<div class="quiz-why">' + (oi === q.a ? '✅ Correct! ' : '❌ Not quite. ') + CM.md.inline(q.why.replace(/[«»]/g, '`')) + '</div>'));
          if (answered === c.quiz.length) {
            A.user.stats.quizzes = A.user.stats.quizzes || {};
            const prev = A.user.stats.quizzes[c.id];
            A.user.stats.quizzes[c.id] = Math.max(prev || 0, correct);
            await A.save();
            host.querySelector('.qz-score').textContent = 'You scored ' + correct + '/' + c.quiz.length;
            U.toast(correct === c.quiz.length ? 'Perfect score! 🏆' : 'You scored ' + correct + '/' + c.quiz.length + '. Review and try again!', correct === c.quiz.length ? 'success' : 'info');
            if (correct === c.quiz.length && learned().indexOf(c.id) < 0) {
              const lb = document.querySelector('[data-act=learn]');
              if (lb) setTimeout(() => lb.click(), 400);
            }
          }
        };
        opts.appendChild(b);
      });
      wrap.appendChild(box);
    });
  }
})();
