#!/usr/bin/env node
/*
 * CodeMentor launcher: a tiny, dependency-free local server.
 *  - Serves the app from ./app at http://localhost:4317 (always the same address, so your data stays put)
 *  - Optional local code runner (/api/run) for Python, Java, C and C++ using compilers installed on THIS computer
 * Listens on 127.0.0.1 only. API calls are restricted to same-origin requests from this app.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');

const PORT = Number(process.env.CODEMENTOR_PORT || 4317);
const ROOT = path.join(__dirname, 'app');
const NO_OPEN = process.argv.includes('--no-open');
const URL_BASE = 'http://localhost:' + PORT + '/';
const VERSION = '1.0.0';
const MAX_BODY = 256 * 1024;
const MAX_OUTPUT = 200 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://localhost:* http://127.0.0.1:*; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";

/* ------------------------------------------------------------------ */
/* toolchain detection                                                 */
/* ------------------------------------------------------------------ */
const HINTS = {
  python: 'install Python from python.org and tick "Add python.exe to PATH"',
  java: 'install a JDK 11 or newer (for example Eclipse Temurin) and make sure "java" is on PATH',
  c: 'install a C compiler: MinGW-w64 / MSYS2 on Windows (add its bin folder to PATH), Xcode tools on macOS, build-essential on Linux',
  cpp: 'install a C++ compiler: MinGW-w64 / MSYS2 on Windows (add its bin folder to PATH), Xcode tools on macOS, build-essential on Linux'
};
const CANDIDATES = {
  python: [['python', [], /Python 3\./], ['py', ['-3'], /Python 3\./], ['python3', [], /Python 3\./]],
  java: [['java', [], /version "?(1[1-9]|[2-9]\d)/]],
  c: [['gcc', [], /gcc|GCC|clang/], ['clang', [], /clang/]],
  cpp: [['g++', [], /g\+\+|GCC|clang/], ['clang++', [], /clang/]]
};
let runners = {};

function probe(cmd, pre, re, lang) {
  const args = pre.concat(lang === 'java' ? ['-version'] : ['--version']);
  try {
    const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 8000, windowsHide: true });
    if (r.error) return null;
    const out = ((r.stdout || '') + '\n' + (r.stderr || '')).trim();
    if (r.status !== 0 && lang !== 'java') return null;
    if (!re.test(out)) return null;
    return out.split(/\r?\n/)[0].trim().slice(0, 120);
  } catch (e) { return null; }
}

function detectRunners() {
  const found = {};
  for (const lang of Object.keys(CANDIDATES)) {
    found[lang] = { available: false, hint: HINTS[lang] };
    for (const [cmd, pre, re] of CANDIDATES[lang]) {
      const v = probe(cmd, pre, re, lang);
      if (v) { found[lang] = { available: true, version: v, cmd, pre }; break; }
    }
  }
  runners = found;
  return found;
}

/* ------------------------------------------------------------------ */
/* process execution with limits                                       */
/* ------------------------------------------------------------------ */
function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
  else { try { process.kill(-child.pid, 'SIGKILL'); } catch (e) { try { child.kill('SIGKILL'); } catch (_) { /* gone */ } } }
}

function exec(cmd, args, opts) {
  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = '', stderr = '', truncated = false, timedOut = false, settled = false;
    let child;
    // No colour codes: Python 3.13+ and compilers may colourise output, which breaks error matching in the chat.
    const env = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1', PYTHON_COLORS: '0', NO_COLOR: '1', TERM: 'dumb', GCC_COLORS: '' });
    delete env.FORCE_COLOR; delete env.CLICOLOR_FORCE; delete env.PY_COLORS;
    try {
      child = spawn(cmd, args, { cwd: opts.cwd, windowsHide: true, detached: process.platform !== 'win32', env });
    } catch (e) { resolve({ stdout: '', stderr: String(e.message), exitCode: -1, durationMs: 0 }); return; }
    const cap = (cur, chunk) => {
      if (cur.length >= MAX_OUTPUT) { truncated = true; return cur; }
      const s = chunk.toString('utf8');
      return (cur + s).slice(0, MAX_OUTPUT);
    };
    child.stdout.on('data', (d) => { stdout = cap(stdout, d); });
    child.stderr.on('data', (d) => { stderr = cap(stderr, d); });
    child.stdin.on('error', () => { /* program exited before reading input */ });
    const timer = setTimeout(() => { timedOut = true; killTree(child); }, opts.timeout);
    // strip ANSI escapes and hide the temporary folder path (show "main.py", not C:\...\Temp\codementor-x\main.py)
    const clean = (s) => {
      s = s.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
      if (opts.cwd) s = s.split(opts.cwd + path.sep).join('').split(opts.cwd.replace(/\\/g, '/') + '/').join('');
      return s;
    };
    const done = (code) => {
      if (settled) return; settled = true;
      clearTimeout(timer);
      resolve({ stdout: clean(stdout), stderr: clean(stderr) + (truncated ? '\n[output truncated]' : ''), exitCode: timedOut ? -1 : code, timedOut, durationMs: Date.now() - started });
    };
    child.on('error', (e) => { stderr += e.message; done(-1); });
    child.on('close', (code) => done(code == null ? -1 : code));
    if (opts.stdin) child.stdin.write(opts.stdin.endsWith('\n') ? opts.stdin : opts.stdin + '\n');
    child.stdin.end();
  });
}

function rmrf(dir) {
  for (let i = 0; i < 5; i++) {
    try { fs.rmSync(dir, { recursive: true, force: true }); return; } catch (e) { /* file may be locked briefly on Windows */ }
  }
}

let busy = false;
async function runCode(lang, code, stdin) {
  const r = runners[lang];
  if (!r || !r.available) return { status: 400, body: { error: lang + ' is not installed (' + HINTS[lang] + ')' } };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codementor-'));
  try {
    if (lang === 'python') {
      fs.writeFileSync(path.join(dir, 'main.py'), code, 'utf8');
      return { status: 200, body: await exec(r.cmd, r.pre.concat(['-u', 'main.py']), { cwd: dir, stdin, timeout: 10000 }) };
    }
    if (lang === 'java') {
      const m = code.match(/public\s+(?:final\s+|abstract\s+)?class\s+([A-Za-z_]\w*)/);
      const file = (m ? m[1] : 'Main') + '.java';
      fs.writeFileSync(path.join(dir, file), code, 'utf8');
      const res = await exec(r.cmd, ['-Dfile.encoding=UTF-8', '-Dstdout.encoding=UTF-8', file], { cwd: dir, stdin, timeout: 20000 });
      if (res.exitCode !== 0 && /error:|\.java:\d+:/.test(res.stderr) && !/Exception in thread/.test(res.stderr)) res.compileError = true;
      return { status: 200, body: res };
    }
    if (lang === 'c' || lang === 'cpp') {
      const src = path.join(dir, lang === 'c' ? 'main.c' : 'main.cpp');
      const exe = path.join(dir, process.platform === 'win32' ? 'main.exe' : 'main');
      fs.writeFileSync(src, code, 'utf8');
      const flags = lang === 'c' ? ['-std=c11', '-O0', '-Wall', src, '-o', exe, '-lm'] : ['-std=c++17', '-O0', '-Wall', src, '-o', exe];
      const comp = await exec(r.cmd, flags, { cwd: dir, timeout: 30000 });
      if (comp.exitCode !== 0) return { status: 200, body: { stdout: '', stderr: comp.stderr.split(src).join(path.basename(src)), exitCode: comp.exitCode, compileError: true, durationMs: comp.durationMs } };
      const res = await exec(exe, [], { cwd: dir, stdin, timeout: 8000 });
      if (comp.stderr.trim()) res.warnings = comp.stderr.split(src).join(path.basename(src));
      if (res.exitCode === 3221225477 || res.exitCode === -1073741819 || res.exitCode === 139) res.stderr += (res.stderr ? '\n' : '') + 'Segmentation fault (invalid memory access)';
      if (res.exitCode === 3221225620 || res.exitCode === 136) res.stderr += (res.stderr ? '\n' : '') + 'Floating point exception (integer division by zero)';
      if (res.warnings) res.stderr = (res.stderr ? res.stderr + '\n\n' : '') + 'Compiler warnings:\n' + res.warnings;
      return { status: 200, body: res };
    }
    return { status: 400, body: { error: 'Unsupported language' } };
  } finally { setTimeout(() => rmrf(dir), 300); }
}

/* ------------------------------------------------------------------ */
/* HTTP                                                                */
/* ------------------------------------------------------------------ */
function send(res, status, body, headers) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(status, Object.assign({
    'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'
  }, headers || {}));
  res.end(isObj ? JSON.stringify(body) : body);
}

function allowedHost(req) {
  const h = String(req.headers.host || '').toLowerCase();
  return h === 'localhost:' + PORT || h === '127.0.0.1:' + PORT || h === '[::1]:' + PORT;
}
function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true; // same-origin GETs may omit it
  return o === 'http://localhost:' + PORT || o === 'http://127.0.0.1:' + PORT || o === 'http://[::1]:' + PORT;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new Error('Request too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  if (!sameOrigin(req)) return send(res, 403, { error: 'Forbidden origin' });
  if (pathname === '/api/health' && req.method === 'GET') {
    const pub = {};
    for (const k of Object.keys(runners)) pub[k] = { available: runners[k].available, version: runners[k].version, hint: runners[k].available ? undefined : runners[k].hint };
    return send(res, 200, { app: 'codementor', version: VERSION, runners: pub, platform: process.platform });
  }
  // state-changing endpoints require a custom header (forces a CORS preflight for any cross-site caller)
  if (req.method !== 'POST' || req.headers['x-codementor'] !== '1') return send(res, 403, { error: 'Forbidden' });
  if (pathname === '/api/rescan') { detectRunners(); return send(res, 200, { ok: true }); }
  if (pathname === '/api/run') {
    if (!/application\/json/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'Expected JSON' });
    if (busy) return send(res, 429, { error: 'Another program is still running. Try again in a moment.' });
    let body;
    try { body = JSON.parse(await readBody(req)); } catch (e) { return send(res, 400, { error: 'Invalid request' }); }
    const lang = String(body.lang || '');
    if (!['python', 'java', 'c', 'cpp'].includes(lang)) return send(res, 400, { error: 'Unsupported language' });
    if (typeof body.code !== 'string' || !body.code.trim()) return send(res, 400, { error: 'No code to run' });
    busy = true;
    try { const r = await runCode(lang, body.code, typeof body.stdin === 'string' ? body.stdin.slice(0, 64 * 1024) : ''); return send(res, r.status, r.body); }
    catch (e) { return send(res, 500, { error: e.message }); }
    finally { busy = false; }
  }
  return send(res, 404, { error: 'Not found' });
}

function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let rel;
  try { rel = decodeURIComponent(pathname); } catch (e) { return send(res, 400, 'Bad request'); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) return send(res, 403, 'Forbidden');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found');
    const ext = path.extname(file).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
    if (ext === '.html') { headers['Content-Security-Policy'] = CSP; headers['X-Frame-Options'] = 'DENY'; }
    if (path.basename(file) === 'sw.js') headers['Service-Worker-Allowed'] = '/';
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (!allowedHost(req)) return send(res, 421, 'Misdirected request');
  const pathname = (req.url || '/').split('?')[0];
  if (pathname.startsWith('/api/')) { handleApi(req, res, pathname).catch((e) => send(res, 500, { error: e.message })); return; }
  serveStatic(req, res, pathname);
});

function openBrowser(url) {
  if (NO_OPEN) return;
  try {
    const cmd = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    spawn(cmd, [url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  } catch (e) { /* user can open it manually */ }
}

function banner() {
  const line = '─'.repeat(58);
  console.log('\n  ' + line);
  console.log('   CodeMentor is running (offline)');
  console.log('   Open:  ' + URL_BASE);
  console.log('  ' + line);
  const names = { python: 'Python', java: 'Java', c: 'C', cpp: 'C++' };
  console.log('   Code runners on this PC:');
  console.log('     JavaScript  ✔ built-in sandbox');
  for (const k of Object.keys(names)) console.log('     ' + names[k].padEnd(11) + (runners[k].available ? ' ✔ ' + runners[k].version : ' ✘ not found (' + HINTS[k] + ')'));
  console.log('  ' + line);
  console.log('   Keep this window open while you use CodeMentor.');
  console.log('   Tip: in Chrome/Edge, use "Install app" in the address bar for a desktop app window.');
  console.log('   Press Ctrl+C to stop.\n');
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    http.get({ host: '127.0.0.1', port: PORT, path: '/api/health', headers: { host: 'localhost:' + PORT } }, (r) => {
      let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => {
        if (/"app":"codementor"/.test(d)) { console.log('\n  CodeMentor is already running at ' + URL_BASE + ', so I\'m opening it.\n'); openBrowser(URL_BASE); setTimeout(() => process.exit(0), 500); }
        else { console.error('\n  Port ' + PORT + ' is used by another program. Close it, or set CODEMENTOR_PORT to another port.\n  (Note: your data is tied to the address, so keep using the same port.)\n'); process.exit(1); }
      });
    }).on('error', () => { console.error('\n  Port ' + PORT + ' is busy. Close the other program or set CODEMENTOR_PORT.\n'); process.exit(1); });
    return;
  }
  console.error(err); process.exit(1);
});

detectRunners();
server.listen(PORT, '127.0.0.1', () => { banner(); openBrowser(URL_BASE); });
process.on('SIGINT', () => { console.log('\n  CodeMentor stopped. Bye! 👋\n'); process.exit(0); });
