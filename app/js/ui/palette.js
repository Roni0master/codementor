/* CodeMentor — command palette (Ctrl+K): jump anywhere, search chats & the library, ask directly */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, A = CM.auth;
  const esc = U.esc;
  let open = null;

  CM.palette = {
    async open() {
      if (open) { open.close(); return; }
      const convs = (await CM.data.convs(A.user.id)).sort((a, b) => b.updatedAt - a.updatedAt);
      const wrap = U.html(`<div class="palette-wrap"><div class="modal-backdrop"></div><div class="palette" role="dialog" aria-label="Command palette">
  <div class="palette-input">${CM.icon('search', 20)}<input placeholder="Search chats, topics and actions, or type a question…" aria-label="Search"><kbd>Esc</kbd></div>
  <div class="palette-list" role="listbox"></div>
  <div class="palette-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div></div>`);
      document.body.appendChild(wrap);
      const input = wrap.querySelector('input');
      const listEl = wrap.querySelector('.palette-list');
      let items = [], sel = 0;
      const close = () => { wrap.remove(); open = null; document.removeEventListener('keydown', onKey, true); };
      open = { close };
      const go = (h) => () => CM.app.navigate(h);
      const ACTIONS = [
        { icon: 'plus', label: 'New chat', hint: 'Alt N', run: go('#/chat') },
        { icon: 'history', label: 'History', run: go('#/history') },
        { icon: 'book', label: 'Library', run: go('#/library') },
        { icon: 'terminal', label: 'Playground', run: go('#/playground') },
        { icon: 'bookmark', label: 'Saved snippets', run: go('#/saved') },
        { icon: 'user', label: 'Profile', run: go('#/profile') },
        { icon: 'shield', label: 'Security & devices', run: go('#/profile/security') },
        { icon: 'settings', label: 'Settings', run: go('#/settings') },
        { icon: 'moon', label: 'Toggle dark / light theme', run: () => CM.app.toggleTheme() },
        { icon: 'logout', label: 'Sign out', run: () => CM.app.logout() }
      ];

      function build(q) {
        q = q.trim();
        const ql = q.toLowerCase();
        const groups = [];
        if (q) groups.push({ title: 'Ask CodeMentor', items: [{ icon: 'sparkles', label: 'Ask: “' + U.truncate(q, 60) + '”', run: () => { CM.app.navigate('#/chat'); setTimeout(() => CM.views.chat.ask(q), 80); } }] });
        const acts = ACTIONS.filter((a) => !q || a.label.toLowerCase().indexOf(ql) >= 0);
        if (acts.length) groups.push({ title: 'Go to', items: acts });
        const cs = convs.filter((c) => !q || c.title.toLowerCase().indexOf(ql) >= 0).slice(0, q ? 6 : 5).map((c) => ({ icon: 'message', label: c.title, hint: U.timeAgo(c.updatedAt), run: go('#/chat/' + c.id) }));
        if (cs.length) groups.push({ title: q ? 'Chats' : 'Recent chats', items: cs });
        if (q.length >= 2) {
          const hits = CM.search.query(q, { limit: 6 }).filter((h) => h.e.type !== 'faq');
          if (hits.length) groups.push({ title: 'Library', items: hits.map((h) => ({ icon: { concept: 'lightbulb', error: 'bug', recipe: 'code', compare: 'compare' }[h.e.type], label: String(h.e.title).replace(/[«»]/g, ''), hint: h.e.type, run: go('#/library/' + h.e.type + '/' + h.e.id) })) });
        }
        items = [];
        listEl.innerHTML = groups.map((g) => '<div class="palette-group">' + esc(g.title) + '</div>' + g.items.map((it) => { items.push(it); const i = items.length - 1; return '<button class="palette-item" data-i="' + i + '" role="option">' + CM.icon(it.icon, 17) + '<span class="grow">' + esc(it.label) + '</span>' + (it.hint ? '<small>' + esc(it.hint) + '</small>' : '') + '</button>'; }).join('')).join('') || '<div class="empty" style="padding:30px"><p>No results</p></div>';
        sel = 0; highlight();
      }
      function highlight() {
        listEl.querySelectorAll('.palette-item').forEach((b) => b.classList.toggle('sel', +b.dataset.i === sel));
        const cur = listEl.querySelector('.palette-item.sel'); if (cur) cur.scrollIntoView({ block: 'nearest' });
      }
      function choose(i) { const it = items[i]; if (!it) return; close(); it.run(); }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); highlight(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); highlight(); }
        else if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
      }
      document.addEventListener('keydown', onKey, true);
      input.addEventListener('input', U.debounce(() => build(input.value), 60));
      listEl.addEventListener('click', (e) => { const b = e.target.closest('.palette-item'); if (b) choose(+b.dataset.i); });
      listEl.addEventListener('mousemove', (e) => { const b = e.target.closest('.palette-item'); if (b && +b.dataset.i !== sel) { sel = +b.dataset.i; highlight(); } });
      wrap.querySelector('.modal-backdrop').onclick = close;
      build('');
      setTimeout(() => input.focus(), 10);
    }
  };
})();
