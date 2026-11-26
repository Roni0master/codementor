/* CodeMentor — chat history: search, filter, pin, rename, export, import */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, A = CM.auth;
  const esc = U.esc;
  const V = (CM.views = CM.views || {});

  const TYPE = {
    error: { icon: 'bug', label: 'Errors' }, concept: { icon: 'lightbulb', label: 'Concepts' }, howto: { icon: 'code', label: 'How-to' },
    review: { icon: 'search', label: 'Code reviews' }, compare: { icon: 'compare', label: 'Comparisons' }
  };

  V.history = {
    async render(container) {
      const st = { q: '', filter: 'all', lang: 'all', sort: 'recent' };
      container.innerHTML = '';
      const el = U.html(`
<div class="page"><div class="page-inner">
  <div class="page-head">
    <div><h1>History</h1><p class="hist-count">Your previous conversations, stored only on this device.</p></div>
    <div class="row wrap">
      <button class="btn btn-sm" data-act="import">${CM.icon('upload', 15)}<span>Import</span></button>
      <button class="btn btn-sm" data-act="export">${CM.icon('download', 15)}<span>Export all</span></button>
      <button class="btn btn-sm btn-danger" data-act="clear">${CM.icon('trash', 15)}<span>Clear all</span></button>
    </div>
  </div>
  <div class="toolbar">
    <div class="input-wrap">${CM.icon('search', 17)}<input class="input" type="search" placeholder="Search titles and messages…" aria-label="Search history"></div>
    <select class="select lang-filter" style="width:auto"><option value="all">All languages</option></select>
    <select class="select sort-sel" style="width:auto"><option value="recent">Most recent</option><option value="oldest">Oldest first</option><option value="messages">Most messages</option><option value="title">A → Z</option></select>
  </div>
  <div class="filters"></div>
  <div class="hist-body"></div>
</div></div>`);
      container.appendChild(el);
      const body = el.querySelector('.hist-body');
      let convs = await CM.data.convs(A.user.id);
      let msgs = await CM.data.allMessages(A.user.id);
      const textByConv = {};
      msgs.forEach((m) => { (textByConv[m.convId] = textByConv[m.convId] || []).push(m.content.toLowerCase()); });

      const langs = [...new Set(convs.map((c) => c.lang).filter(Boolean))];
      const lf = el.querySelector('.lang-filter');
      langs.forEach((l) => lf.appendChild(new Option(U.langName(l), l)));

      function renderFilters() {
        const f = el.querySelector('.filters');
        const counts = { all: convs.length, pinned: convs.filter((c) => c.pinned).length };
        Object.keys(TYPE).forEach((k) => { counts[k] = convs.filter((c) => (c.tags || []).indexOf(k) >= 0).length; });
        const items = [['all', 'All', 'layers'], ['pinned', 'Pinned', 'pin']].concat(Object.keys(TYPE).map((k) => [k, TYPE[k].label, TYPE[k].icon]));
        f.innerHTML = items.map(([k, label, ic]) => '<button class="chip ' + (st.filter === k ? 'on' : '') + '" data-f="' + k + '">' + CM.icon(ic, 14) + label + ' <span class="faint">' + counts[k] + '</span></button>').join('');
      }

      function list() {
        let out = convs.slice();
        if (st.filter === 'pinned') out = out.filter((c) => c.pinned);
        else if (st.filter !== 'all') out = out.filter((c) => (c.tags || []).indexOf(st.filter) >= 0);
        if (st.lang !== 'all') out = out.filter((c) => c.lang === st.lang);
        const q = st.q.trim().toLowerCase();
        if (q) out = out.filter((c) => c.title.toLowerCase().indexOf(q) >= 0 || (textByConv[c.id] || []).some((t) => t.indexOf(q) >= 0));
        if (st.sort === 'recent') out.sort((a, b) => (b.pinned - a.pinned) || b.updatedAt - a.updatedAt);
        if (st.sort === 'oldest') out.sort((a, b) => a.createdAt - b.createdAt);
        if (st.sort === 'messages') out.sort((a, b) => (b.count || 0) - (a.count || 0));
        if (st.sort === 'title') out.sort((a, b) => a.title.localeCompare(b.title));
        return out;
      }

      function item(c, q, i) {
        const type = (c.tags || [])[0];
        const t = TYPE[type] || { icon: 'message' };
        let snippet = c.preview || '';
        if (q) {
          const hit = (textByConv[c.id] || []).find((x) => x.indexOf(q) >= 0);
          if (hit) { const p = hit.indexOf(q); snippet = (p > 40 ? '…' : '') + hit.slice(Math.max(0, p - 40), p + 80).replace(/\s+/g, ' ') + '…'; }
        }
        const el = U.html(`
<div class="hist-item" data-id="${c.id}" tabindex="0" style="animation-delay:${Math.min(i, 12) * 0.025}s">
  <div class="hist-ic ${type || ''}">${CM.icon(t.icon, 19)}</div>
  <div class="hist-main">
    <b>${c.pinned ? '<span class="pin-mark">' + CM.icon('pin', 14) + '</span>' : ''}<span>${U.highlightText(c.title, q)}</span></b>
    <p>${U.highlightText(snippet, q)}</p>
    <div class="hist-tags">${c.lang ? '<span class="badge badge-accent">' + esc(U.langName(c.lang)) + '</span>' : ''}${(c.tags || []).map((tg) => '<span class="badge">' + esc((TYPE[tg] || { label: tg }).label) + '</span>').join('')}<span class="badge">${CM.icon('message', 11)} ${c.count || 0}</span></div>
  </div>
  <div class="hist-side">
    <span class="faint">${esc(U.timeAgo(c.updatedAt))}</span>
    <div class="hist-actions">
      <button class="btn-icon sm" data-a="pin" data-tip="${c.pinned ? 'Unpin' : 'Pin'}">${CM.icon('pin', 15)}</button>
      <button class="btn-icon sm" data-a="rename" data-tip="Rename">${CM.icon('edit', 15)}</button>
      <button class="btn-icon sm" data-a="export" data-tip="Export">${CM.icon('download', 15)}</button>
      <button class="btn-icon sm" data-a="delete" data-tip="Delete">${CM.icon('trash', 15)}</button>
    </div>
  </div>
</div>`);
        return el;
      }

      function render() {
        renderFilters();
        el.querySelector('.hist-count').textContent = convs.length ? U.plural(convs.length, 'conversation') + ' · stored only on this device' : 'Your previous conversations, stored only on this device.';
        const items = list();
        body.innerHTML = '';
        if (!convs.length) {
          body.innerHTML = `<div class="empty"><div class="empty-ic">${CM.icon('history', 28)}</div><h3>No conversations yet</h3><p>Your chats will appear here so you can revisit explanations any time, even offline.</p><a class="btn btn-primary" href="#/chat">${CM.icon('plus', 16)}<span>Start a chat</span></a></div>`;
          return;
        }
        if (!items.length) { body.innerHTML = `<div class="empty"><div class="empty-ic">${CM.icon('search', 26)}</div><h3>No matches</h3><p>Try a different search or filter.</p></div>`; return; }
        const q = st.q.trim().toLowerCase();
        let group = null, wrap = null, i = 0;
        items.forEach((c) => {
          const g = st.sort === 'recent' || st.sort === 'oldest' ? (c.pinned && st.sort === 'recent' ? 'Pinned' : U.dayGroup(st.sort === 'oldest' ? c.createdAt : c.updatedAt)) : 'Results';
          if (g !== group) { group = g; body.appendChild(U.html('<div class="group-title">' + esc(g) + '</div>')); wrap = U.html('<div class="hist-list"></div>'); body.appendChild(wrap); }
          wrap.appendChild(item(c, q, i++));
        });
      }

      el.querySelector('input[type=search]').addEventListener('input', U.debounce((e) => { st.q = e.target.value; render(); }, 120));
      lf.onchange = () => { st.lang = lf.value; render(); };
      el.querySelector('.sort-sel').onchange = (e) => { st.sort = e.target.value; render(); };
      el.querySelector('.filters').onclick = (e) => { const b = e.target.closest('[data-f]'); if (b) { st.filter = b.dataset.f; render(); } };

      body.addEventListener('click', async (e) => {
        const it = e.target.closest('.hist-item'); if (!it) return;
        const c = convs.find((x) => x.id === it.dataset.id);
        const a = e.target.closest('[data-a]');
        if (!a) { CM.app.navigate('#/chat/' + c.id); return; }
        e.stopPropagation();
        if (a.dataset.a === 'pin') { c.pinned = !c.pinned; await CM.data.saveConv(c); render(); CM.app.refreshSidebar(); }
        if (a.dataset.a === 'rename') { const v = await U.prompt({ title: 'Rename chat', label: 'Title', value: c.title, icon: 'edit' }); if (v && v.trim()) { c.title = v.trim().slice(0, 80); await CM.data.saveConv(c); render(); CM.app.refreshSidebar(); } }
        if (a.dataset.a === 'export') CM.data.exportConv(c, await CM.data.messages(c.id));
        if (a.dataset.a === 'delete') {
          if (await U.confirm({ title: 'Delete chat?', message: '“' + esc(c.title) + '” and its messages will be permanently removed from this device.', confirmLabel: 'Delete', danger: true })) {
            await CM.data.deleteConv(c.id); convs = convs.filter((x) => x.id !== c.id); render(); CM.app.refreshSidebar(); U.toast('Chat deleted', 'success');
          }
        }
      });
      body.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('hist-item')) CM.app.navigate('#/chat/' + e.target.dataset.id); });

      el.querySelector('[data-act=export]').onclick = async () => {
        if (!convs.length) { U.toast('Nothing to export yet', 'info'); return; }
        const data = { app: 'codementor', kind: 'history', version: 1, exportedAt: new Date().toISOString(), conversations: convs, messages: await CM.data.allMessages(A.user.id) };
        U.download('codementor-history-' + U.dayKey() + '.json', JSON.stringify(data, null, 2), 'application/json');
        U.toast('History exported', 'success');
      };
      el.querySelector('[data-act=import]').onclick = async () => {
        const f = await U.pickFile('.json,application/json'); if (!f) return;
        try {
          const data = JSON.parse(await U.readFile(f));
          if (data.app !== 'codementor' || !Array.isArray(data.conversations)) throw new Error('Not a CodeMentor export file');
          const n = await CM.data.importHistory(data);
          convs = await CM.data.convs(A.user.id); msgs = await CM.data.allMessages(A.user.id);
          Object.keys(textByConv).forEach((k) => delete textByConv[k]);
          msgs.forEach((m) => { (textByConv[m.convId] = textByConv[m.convId] || []).push(m.content.toLowerCase()); });
          render(); CM.app.refreshSidebar();
          U.toast('Imported ' + U.plural(n, 'conversation'), 'success');
        } catch (err) { U.toast('Import failed: ' + err.message, 'error'); }
      };
      el.querySelector('[data-act=clear]').onclick = async () => {
        if (!convs.length) return;
        if (await U.confirm({ title: 'Clear all history?', message: 'All ' + convs.length + ' conversations will be permanently deleted from this device. Saved snippets are kept.', confirmLabel: 'Delete everything', danger: true })) {
          for (const c of convs) await CM.data.deleteConv(c.id);
          convs = []; render(); CM.app.refreshSidebar(); U.toast('History cleared', 'success');
        }
      };
      render();
    }
  };
})();
