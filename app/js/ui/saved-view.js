/* CodeMentor — saved snippets & answers */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, A = CM.auth;
  const esc = U.esc;
  const V = (CM.views = CM.views || {});

  V.saved = {
    async render(container) {
      let items = await CM.data.snippets(A.user.id);
      let q = '', lang = 'all';
      container.innerHTML = '';
      const el = U.html(`
<div class="page"><div class="page-inner">
  <div class="page-head"><div><h1>Saved</h1><p>Answers and code snippets you bookmarked, available offline.</p></div>
    <button class="btn btn-sm" data-act="new">${CM.icon('plus', 15)}<span>New snippet</span></button></div>
  <div class="toolbar"><div class="input-wrap">${CM.icon('search', 17)}<input class="input" type="search" placeholder="Search saved items…"></div>
  <select class="select" style="width:auto" data-act="lang"><option value="all">All languages</option></select></div>
  <div class="saved-grid"></div>
</div></div>`);
      container.appendChild(el);
      const grid = el.querySelector('.saved-grid');
      const sel = el.querySelector('[data-act=lang]');
      [...new Set(items.map((i) => i.lang).filter(Boolean))].forEach((l) => sel.appendChild(new Option(U.langName(l), l)));

      const codeOf = (s) => s.code || ((s.content.match(/```[^\n]*\n([\s\S]*?)```/) || [])[1]) || '';
      function draw() {
        let list = items.slice().sort((a, b) => b.createdAt - a.createdAt);
        if (lang !== 'all') list = list.filter((i) => i.lang === lang);
        if (q) list = list.filter((i) => (i.title + ' ' + i.content).toLowerCase().indexOf(q) >= 0);
        grid.innerHTML = '';
        if (!items.length) { grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-ic">${CM.icon('bookmark', 28)}</div><h3>Nothing saved yet</h3><p>Click the ${CM.icon('bookmark', 14)} icon under any answer, or <b>Save</b> in the Playground, to keep it here.</p></div>`; return; }
        if (!list.length) { grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-ic">${CM.icon('search', 26)}</div><h3>No matches</h3></div>`; return; }
        list.forEach((s, i) => {
          const code = codeOf(s);
          const text = s.content.replace(/```[\s\S]*?```/g, '').replace(/[#>*`|_-]/g, ' ').replace(/\s+/g, ' ').trim();
          const card = U.html(`<div class="saved-card" style="animation-delay:${Math.min(i, 12) * 0.03}s">
  <div class="row-between"><b style="font-size:15px">${esc(s.title)}</b><span class="faint" style="font-size:12px;white-space:nowrap">${esc(U.timeAgo(s.createdAt))}</span></div>
  <div class="row wrap" style="gap:6px">${s.lang ? '<span class="badge badge-accent">' + esc(U.langName(s.lang)) + '</span>' : ''}<span class="badge">${s.source === 'playground' ? 'Playground' : s.source === 'manual' ? 'Note' : 'Chat answer'}</span></div>
  ${code ? '<div class="preview">' + CM.hl.highlight(code.split('\n').slice(0, 8).join('\n'), s.lang) + '</div>' : '<div class="text-preview">' + esc(U.truncate(text, 220)) + '</div>'}
  <div class="row" style="gap:4px;margin-top:auto">
    <button class="btn btn-sm" data-a="open">${CM.icon('eye', 14)}<span>Open</span></button>
    ${code ? '<button class="btn-icon sm" data-a="copy" data-tip="Copy code">' + CM.icon('copy', 15) + '</button><button class="btn-icon sm" data-a="play" data-tip="Open in Playground">' + CM.icon('terminal', 15) + '</button>' : ''}
    <div class="grow"></div>
    <button class="btn-icon sm" data-a="rename" data-tip="Rename">${CM.icon('edit', 15)}</button>
    <button class="btn-icon sm" data-a="delete" data-tip="Delete">${CM.icon('trash', 15)}</button>
  </div></div>`);
          card.onclick = async (e) => {
            const a = e.target.closest('[data-a]'); if (!a) return;
            if (a.dataset.a === 'open') {
              const body = U.html('<div class="md"></div>');
              body.innerHTML = CM.md.render(s.content);
              CM.md.bind(body, { ask: (qq) => { m.close(); CM.app.navigate('#/chat'); setTimeout(() => CM.views.chat.ask(qq), 80); }, playground: (c, l) => { m.close(); CM.app.openPlayground(c, l); } });
              const m = U.modal({ title: s.title, icon: 'bookmark', size: 'lg', body, actions: [{ label: 'Copy all', icon: 'copy', onClick: async () => { await U.copy(s.content); U.toast('Copied', 'success'); return false; } }, { label: 'Close', kind: 'primary' }] });
            }
            if (a.dataset.a === 'copy') { await U.copy(code); U.toast('Code copied', 'success', 1500); }
            if (a.dataset.a === 'play') CM.app.openPlayground(code, s.lang);
            if (a.dataset.a === 'rename') { const v = await U.prompt({ title: 'Rename', label: 'Title', value: s.title, icon: 'edit' }); if (v && v.trim()) { s.title = v.trim(); await CM.data.putSnippet(s); draw(); } }
            if (a.dataset.a === 'delete' && await U.confirm({ title: 'Delete this item?', message: '“' + esc(s.title) + '” will be removed permanently.', confirmLabel: 'Delete', danger: true })) {
              await CM.data.deleteSnippet(s.id); items = items.filter((x) => x.id !== s.id); draw(); U.toast('Deleted', 'success');
            }
          };
          grid.appendChild(card);
        });
      }
      el.querySelector('input[type=search]').addEventListener('input', U.debounce((e) => { q = e.target.value.trim().toLowerCase(); draw(); }, 120));
      sel.onchange = () => { lang = sel.value; draw(); };
      el.querySelector('[data-act=new]').onclick = async () => {
        const r = await CM.codeModal({ lang: A.user.profile.primaryLang || 'python' });
        if (!r) return;
        const title = await U.prompt({ title: 'Name this snippet', label: 'Title', value: U.langName(r.lang) + ' snippet', icon: 'bookmark' });
        if (title == null) return;
        await CM.data.saveSnippet({ title: title.trim() || 'Snippet', content: '```' + r.lang + '\n' + r.code + '\n```', code: r.code, lang: r.lang, source: 'manual' });
        items = await CM.data.snippets(A.user.id); draw(); U.toast('Snippet saved', 'success');
      };
      draw();
    }
  };
})();
