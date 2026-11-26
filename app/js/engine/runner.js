/* CodeMentor — run code offline.
   JavaScript runs in a sandboxed Web Worker (with a hard timeout).
   Python / Java / C / C++ run through the local CodeMentor launcher (server.js) using compilers installed on this PC. */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util;
  const R = (CM.runner = { server: null, checked: false });

  const viaHttp = /^https?:$/.test(location.protocol);

  R.detect = async function (force) {
    if (R.checked && !force) return R.server;
    R.checked = true;
    if (!viaHttp) { R.server = null; return null; }
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch('api/health', { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (!res.ok) throw new Error('no server');
      const j = await res.json();
      R.server = j && j.app === 'codementor' ? j : null;
    } catch (e) { R.server = null; }
    return R.server;
  };

  const SERVER_LANGS = { python: 'python', java: 'java', c: 'c', cpp: 'cpp' };
  R.canRunInline = (lang) => lang === 'javascript' || !!(R.server && R.server.runners && SERVER_LANGS[lang] && R.server.runners[SERVER_LANGS[lang]] && R.server.runners[SERVER_LANGS[lang]].available);
  R.status = () => {
    const r = (R.server && R.server.runners) || {};
    return [
      { lang: 'javascript', name: 'JavaScript', ok: true, note: 'built-in sandbox' },
      { lang: 'python', name: 'Python', ok: !!(r.python && r.python.available), note: r.python && r.python.version },
      { lang: 'java', name: 'Java', ok: !!(r.java && r.java.available), note: r.java && r.java.version },
      { lang: 'c', name: 'C (gcc)', ok: !!(r.c && r.c.available), note: r.c && r.c.version },
      { lang: 'cpp', name: 'C++ (g++)', ok: !!(r.cpp && r.cpp.available), note: r.cpp && r.cpp.version }
    ];
  };

  /* ---------------- JavaScript sandbox ---------------- */
  const WORKER_SRC = [
    'self.onmessage = function (e) {',
    '  var code = e.data.code, stdin = e.data.stdin || "";',
    '  function fmt(v) {',
    '    if (typeof v === "string") return v;',
    '    if (v instanceof Error) return v.name + ": " + v.message;',
    '    if (typeof v === "function") return "[Function " + (v.name || "anonymous") + "]";',
    '    if (typeof v === "undefined") return "undefined";',
    '    if (typeof v === "bigint") return v.toString() + "n";',
    '    if (v instanceof Map) return "Map(" + v.size + ") " + JSON.stringify(Array.from(v.entries()));',
    '    if (v instanceof Set) return "Set(" + v.size + ") " + JSON.stringify(Array.from(v));',
    '    try { var s = JSON.stringify(v, function (k, x) { return typeof x === "bigint" ? x.toString() + "n" : x; }, 2); return s === undefined ? String(v) : s; } catch (err) { return String(v); }',
    '  }',
    '  function send(type, args) { self.postMessage({ type: type, text: Array.prototype.map.call(args, fmt).join(" ") }); }',
    '  var con = { log: function () { send("log", arguments); }, info: function () { send("info", arguments); }, debug: function () { send("log", arguments); },',
    '    warn: function () { send("warn", arguments); }, error: function () { send("error", arguments); }, table: function () { send("log", arguments); } };',
    '  var lines = stdin.split(/\\r?\\n/), li = 0;',
    '  function prompt(msg) { if (msg) send("info", [String(msg)]); return li < lines.length && !(li === lines.length - 1 && lines[li] === "") ? lines[li++] : null; }',
    '  function alert(m) { send("info", ["[alert] " + m]); }',
    '  function req(m) { throw new Error("require(\'" + m + "\') is not available in the browser sandbox"); }',
    '  try {',
    '    var AF = Object.getPrototypeOf(async function () {}).constructor;',
    '    var fn = new AF("console", "prompt", "alert", "require", "document", "window", "\\"use strict\\";\\n" + code);',
    '    Promise.resolve(fn(con, prompt, alert, req, undefined, undefined)).then(function () {',
    '      setTimeout(function () { self.postMessage({ type: "done" }); }, 30);',
    '    }, function (err) {',
    '      self.postMessage({ type: "error", text: err && err.name ? err.name + ": " + err.message : String(err) });',
    '      self.postMessage({ type: "done", failed: true });',
    '    });',
    '  } catch (err) {',
    '    self.postMessage({ type: "error", text: err.name + ": " + err.message });',
    '    self.postMessage({ type: "done", failed: true });',
    '  }',
    '};'
  ].join('\n');
  let workerUrl = null;

  R.runJS = function (code, stdin, timeoutMs) {
    timeoutMs = timeoutMs || 5000;
    return new Promise((resolve) => {
      const started = performance.now();
      const out = [];
      let worker;
      try {
        if (!workerUrl) workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'application/javascript' }));
        worker = new Worker(workerUrl);
      } catch (e) {
        resolve({ stdout: '', stderr: 'Could not start the JavaScript sandbox in this browser (' + e.message + '). Start CodeMentor with the launcher (Start CodeMentor.bat) to enable it.', exitCode: 1, durationMs: 0, lines: [] });
        return;
      }
      let finished = false, failed = false;
      const finish = (timedOut) => {
        if (finished) return; finished = true;
        clearTimeout(timer);
        worker.terminate();
        resolve({
          lines: out, timedOut: !!timedOut,
          stdout: out.filter((l) => l.type !== 'error' && l.type !== 'warn').map((l) => l.text).join('\n'),
          stderr: out.filter((l) => l.type === 'error').map((l) => l.text).join('\n') + (timedOut ? (out.length ? '\n' : '') + 'Stopped after ' + (timeoutMs / 1000) + 's: possible infinite loop.' : ''),
          exitCode: timedOut || failed ? 1 : 0, durationMs: Math.round(performance.now() - started)
        });
      };
      const timer = setTimeout(() => finish(true), timeoutMs);
      worker.onmessage = (e) => {
        const d = e.data;
        if (d.type === 'done') { failed = !!d.failed; setTimeout(() => finish(false), 250); return; }
        if (out.length < 2000) out.push({ type: d.type, text: d.text });
      };
      worker.onerror = (e) => { out.push({ type: 'error', text: e.message || 'Worker error' }); failed = true; finish(false); };
      worker.postMessage({ code, stdin: stdin || '' });
    });
  };

  /* ---------------- local compilers via launcher ---------------- */
  R.runServer = async function (lang, code, stdin) {
    const res = await fetch('api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CodeMentor': '1' },
      body: JSON.stringify({ lang, code, stdin: stdin || '' })
    });
    const j = await res.json().catch(() => ({ error: 'Invalid response from the local runner' }));
    if (!res.ok || j.error) throw new Error(j.error || ('Runner error ' + res.status));
    return j;
  };

  R.run = async function (lang, code, stdin) {
    lang = CM.hl.normalize(lang);
    if (lang === 'javascript' || lang === 'typescript') {
      if (lang === 'typescript') return { stdout: '', stderr: 'TypeScript needs to be compiled first. Remove the type annotations and run it as JavaScript.', exitCode: 1, durationMs: 0 };
      return R.runJS(code, stdin);
    }
    if (!SERVER_LANGS[lang]) throw new Error('Running ' + U.langName(lang) + ' code is not supported. You can still analyze it.');
    await R.detect();
    if (!R.server) throw new Error('To run ' + U.langName(lang) + ' code, start CodeMentor with "Start CodeMentor.bat" (it uses the compilers installed on your PC). JavaScript runs anywhere.');
    const info = R.server.runners[SERVER_LANGS[lang]];
    if (!info || !info.available) throw new Error(U.langName(lang) + ' is not installed on this computer (' + (info && info.hint ? info.hint : 'install it and restart the launcher') + ').');
    const r = await R.runServer(lang, code, stdin);
    // belt and braces: never pass terminal colour codes on to the UI or the chat
    r.stdout = R.stripAnsi(r.stdout); r.stderr = R.stripAnsi(r.stderr);
    return r;
  };

  R.stripAnsi = (s) => String(s == null ? '' : s).replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '').replace(/\u001b\][^\u0007]*\u0007/g, '');

  R.formatOutput = function (r) {
    const esc = U.esc;
    const head = '<div class="out-head">' + (r.exitCode === 0 && !r.timedOut ? '<span style="color:#34d399">●</span> Output' : '<span style="color:#f87171">●</span> ' + (r.timedOut ? 'Timed out' : r.compileError ? 'Compile error' : 'Exited with code ' + r.exitCode)) +
      '<span style="margin-left:auto;text-transform:none;letter-spacing:0">' + (r.durationMs != null ? r.durationMs + ' ms' : '') + '</span></div>';
    let body = '';
    if (r.lines && r.lines.length) body = r.lines.map((l) => '<div class="' + (l.type === 'error' ? 'out-err' : l.type === 'warn' ? 'out-warn' : l.type === 'info' ? 'out-info' : 'out-ok') + '">' + esc(l.text) + '</div>').join('');
    else if (r.stdout) body = '<span class="out-ok">' + esc(r.stdout) + '</span>';
    if (r.stderr && !(r.lines && r.lines.some((l) => l.type === 'error'))) body += (body ? '\n' : '') + '<span class="out-err">' + esc(r.stderr) + '</span>';
    else if (r.timedOut && r.lines) body += '<div class="out-err">' + esc('Stopped: possible infinite loop.') + '</div>';
    if (!body) body = '<span class="out-info">(no output)</span>';
    return head + body;
  };
})();
