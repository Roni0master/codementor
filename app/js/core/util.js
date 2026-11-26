/* CodeMentor — shared utilities: DOM helpers, dates, toasts, modals, menus */
(function () {
  'use strict';
  const CM = (window.CM = window.CM || {});
  const U = (CM.util = {});

  U.$ = (s, r) => (r || document).querySelector(s);
  U.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  U.uid = (p) => (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  U.html = (str) => { const t = document.createElement('template'); t.innerHTML = String(str).trim(); return t.content.firstElementChild; };
  U.debounce = (fn, ms) => { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(null, a), ms || 200); }; };
  U.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.truncate = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
  U.plural = (n, w, pl) => n + ' ' + (n === 1 ? w : (pl || w + 's'));
  U.cap = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);

  /* ---------- dates ---------- */
  U.dayKey = (d) => { const x = d ? new Date(d) : new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  U.fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  U.fmtTime = (ts) => new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  U.fmtDateTime = (ts) => new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  U.timeAgo = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 45) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
    const d = Math.floor(h / 24); if (d < 7) return d + 'd ago';
    return U.fmtDate(ts);
  };
  U.dayGroup = (ts) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = 86400000;
    if (ts >= start) return 'Today';
    if (ts >= start - day) return 'Yesterday';
    if (ts >= start - 7 * day) return 'Previous 7 days';
    if (ts >= start - 30 * day) return 'Previous 30 days';
    return new Date(ts).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };
  U.greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Burning the midnight oil' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  /* ---------- strings ---------- */
  U.lev = (a, b) => {
    a = String(a); b = String(b);
    if (a === b) return 0;
    if (!a.length) return b.length; if (!b.length) return a.length;
    // Optimal string alignment distance (Levenshtein + adjacent transpositions).
    let prev2 = null;
    let prev = new Array(b.length + 1); for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (prev2 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev2[j - 2] + 1);
      }
      prev2 = prev; prev = cur;
    }
    return prev[b.length];
  };
  /** Closest candidate within maxDist (case-insensitive match counts as distance 0.5). */
  U.closest = (word, list, maxDist) => {
    maxDist = maxDist == null ? 2 : maxDist;
    let best = null, bestD = Infinity;
    const wl = String(word).toLowerCase();
    for (const c of list) {
      if (!c || c === word) continue;
      let d = c.toLowerCase() === wl ? 0.5 : U.lev(wl, c.toLowerCase());
      if (Math.abs(c.length - word.length) > maxDist) continue;
      if (word.length <= 3 && d > 1) continue;
      if (d < bestD) { bestD = d; best = c; }
    }
    return bestD <= maxDist ? best : null;
  };
  U.initials = (name) => (String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('') || '?').toUpperCase();
  U.hue = (str) => { let h = 7; for (const c of String(str || '')) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  U.avatar = (user, size) => {
    size = size || 36;
    const p = (user && user.profile) || {};
    const name = p.fullName || (user && user.displayName) || '?';
    if (p.avatar) return '<img class="avatar" alt="" src="' + p.avatar + '" style="width:' + size + 'px;height:' + size + 'px">';
    return '<div class="avatar" style="--h:' + (p.hue != null ? p.hue : U.hue(user && user.username)) + ';width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.38) + 'px">' + U.esc(U.initials(name)) + '</div>';
  };
  U.formatBytes = (b) => { if (!b) return '0 B'; const u = ['B', 'KB', 'MB', 'GB']; const i = Math.min(3, Math.floor(Math.log(b) / Math.log(1024))); return (b / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + u[i]; };
  U.highlightText = (text, q) => {
    const safe = U.esc(text);
    if (!q) return safe;
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return safe.replace(re, '<mark class="hl">$1</mark>');
  };

  /* ---------- languages ---------- */
  U.LANGS = [
    { id: 'python', name: 'Python', ext: ['py'] },
    { id: 'javascript', name: 'JavaScript', ext: ['js', 'mjs', 'cjs', 'jsx'] },
    { id: 'typescript', name: 'TypeScript', ext: ['ts', 'tsx'] },
    { id: 'java', name: 'Java', ext: ['java'] },
    { id: 'cpp', name: 'C++', ext: ['cpp', 'cc', 'cxx', 'hpp'] },
    { id: 'c', name: 'C', ext: ['c', 'h'] },
    { id: 'csharp', name: 'C#', ext: ['cs'] },
    { id: 'sql', name: 'SQL', ext: ['sql'] },
    { id: 'html', name: 'HTML', ext: ['html', 'htm'] },
    { id: 'css', name: 'CSS', ext: ['css'] }
  ];
  U.langName = (id) => { const l = U.LANGS.find((x) => x.id === id); return l ? l.name : (id ? U.cap(id) : 'Code'); };
  U.langFromExt = (filename) => { const e = String(filename).split('.').pop().toLowerCase(); const l = U.LANGS.find((x) => x.ext.indexOf(e) >= 0); return l ? l.id : ''; };

  /* ---------- storage ---------- */
  U.store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ---------- clipboard & files ---------- */
  U.copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
      ta.remove(); return ok;
    }
  };
  U.download = (name, text, type) => {
    const blob = new Blob([text], { type: type || 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  };
  U.readFile = (file, asDataURL) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = () => rej(r.error);
    if (asDataURL) r.readAsDataURL(file); else r.readAsText(file);
  });
  U.pickFile = (accept) => new Promise((res) => {
    const i = document.createElement('input'); i.type = 'file'; if (accept) i.accept = accept;
    i.onchange = () => res(i.files && i.files[0] ? i.files[0] : null);
    i.click();
  });
  /** Downscale an image file to a square avatar data URL. */
  U.imageToAvatar = (file, size) => new Promise((res, rej) => {
    size = size || 256;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not read that image')); };
    img.src = url;
  });

  /* ---------- toasts ---------- */
  U.toast = (msg, type, ms) => {
    type = type || 'info';
    const box = document.getElementById('toasts'); if (!box) return;
    const icon = { success: 'check-circle', error: 'x-circle', warn: 'alert', info: 'info' }[type] || 'info';
    const t = U.html('<div class="toast toast-' + type + '">' + CM.icon(icon, 18) + '<span>' + U.esc(msg) + '</span></div>');
    box.appendChild(t);
    while (box.children.length > 4) box.firstElementChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, ms || 3200);
  };

  /* ---------- modal ---------- */
  U.modal = (opts) => {
    opts = opts || {};
    const root = document.getElementById('modals');
    const wrap = U.html(
      '<div class="modal-wrap"><div class="modal-backdrop"></div>' +
      '<div class="modal modal-' + (opts.size || 'md') + '" role="dialog" aria-modal="true">' +
      '<div class="modal-head">' + (opts.icon ? '<div class="modal-icon">' + CM.icon(opts.icon, 19) + '</div>' : '') +
      '<h3>' + U.esc(opts.title || '') + '</h3><button class="btn-icon modal-x" aria-label="Close">' + CM.icon('x', 18) + '</button></div>' +
      '<div class="modal-body"></div><div class="modal-foot"></div></div></div>'
    );
    const bodyEl = wrap.querySelector('.modal-body');
    if (typeof opts.body === 'string') bodyEl.innerHTML = opts.body; else if (opts.body) bodyEl.appendChild(opts.body);
    const foot = wrap.querySelector('.modal-foot');
    const actions = opts.actions || [];
    if (!actions.length) foot.remove();
    let closed = false;
    const dismissable = opts.dismissable !== false;
    const onKey = (e) => {
      if (!wrap.isConnected) return;
      if (root.lastElementChild !== wrap) return;
      if (e.key === 'Escape' && dismissable) { e.stopPropagation(); close(); }
      if (e.key === 'Enter' && e.target && e.target.tagName === 'INPUT' && !e.target.dataset.noSubmit) {
        const primary = foot.querySelector('.btn-primary, .btn-danger, .btn-grad');
        if (primary) { e.preventDefault(); primary.click(); }
      }
    };
    function close(val) {
      if (closed) return; closed = true;
      wrap.classList.add('closing');
      document.removeEventListener('keydown', onKey, true);
      setTimeout(() => wrap.remove(), 170);
      if (opts.onClose) opts.onClose(val);
    }
    actions.forEach((a) => {
      const b = U.html('<button class="btn ' + (a.kind ? 'btn-' + a.kind : 'btn-ghost') + '">' + (a.icon ? CM.icon(a.icon, 16) : '') + '<span>' + U.esc(a.label) + '</span></button>');
      b.onclick = async () => {
        if (a.onClick) {
          b.disabled = true;
          let r;
          try { r = await a.onClick({ close, el: wrap, body: bodyEl }); } finally { b.disabled = false; }
          if (r === false) return;
        }
        close(a.value);
      };
      foot.appendChild(b);
    });
    document.addEventListener('keydown', onKey, true);
    wrap.querySelector('.modal-x').onclick = () => close();
    if (dismissable) wrap.querySelector('.modal-backdrop').onclick = () => close();
    root.appendChild(wrap);
    setTimeout(() => { const f = wrap.querySelector('[autofocus]') || wrap.querySelector('.modal-body input, .modal-body textarea'); if (f) f.focus(); }, 40);
    return { close, el: wrap, body: bodyEl };
  };

  U.confirm = (o) => new Promise((res) => {
    o = o || {};
    let ok = false;
    U.modal({
      title: o.title || 'Are you sure?', icon: o.icon || (o.danger ? 'alert' : 'info'), size: 'sm',
      body: '<p class="muted">' + (o.message || '') + '</p>',
      actions: [{ label: o.cancelLabel || 'Cancel' }, { label: o.confirmLabel || 'Confirm', kind: o.danger ? 'danger' : 'primary', onClick: () => { ok = true; } }],
      onClose: () => res(ok)
    });
  });

  U.prompt = (o) => new Promise((res) => {
    o = o || {};
    let out = null;
    const m = U.modal({
      title: o.title || 'Enter a value', icon: o.icon, size: 'sm',
      body: '<label class="field"><span class="label">' + U.esc(o.label || '') + '</span>' +
        (o.multiline ? '<textarea class="input" rows="4"></textarea>' : '<input class="input" type="' + (o.type || 'text') + '" placeholder="' + U.esc(o.placeholder || '') + '">') +
        '</label>',
      actions: [{ label: 'Cancel' }, { label: o.confirmLabel || 'Save', kind: 'primary', onClick: ({ body }) => { out = body.querySelector('.input').value; } }],
      onClose: () => res(out)
    });
    m.body.querySelector('.input').value = o.value || '';
  });

  /* ---------- context menu ---------- */
  U.menu = (anchor, items) => {
    U.$$('.menu').forEach((m) => m.remove());
    const m = U.html('<div class="menu" role="menu"></div>');
    items.forEach((it) => {
      if (it === '-') { m.appendChild(U.html('<hr>')); return; }
      const b = U.html('<button class="' + (it.danger ? 'danger' : '') + '">' + (it.icon ? CM.icon(it.icon, 16) : '') + '<span>' + U.esc(it.label) + '</span></button>');
      b.onclick = (e) => { e.stopPropagation(); m.remove(); it.onClick && it.onClick(); };
      m.appendChild(b);
    });
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    const mw = m.offsetWidth, mh = m.offsetHeight;
    let left = r.right - mw; if (left < 8) left = r.left;
    let top = r.bottom + 6; if (top + mh > innerHeight - 8) top = r.top - mh - 6;
    m.style.left = Math.max(8, Math.min(left, innerWidth - mw - 8)) + 'px';
    m.style.top = Math.max(8, top) + 'px';
    const off = (e) => { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', off, true); } };
    setTimeout(() => document.addEventListener('mousedown', off, true), 0);
    return m;
  };
})();
