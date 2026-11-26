/* CodeMentor — password hashing (PBKDF2) and device fingerprinting.
   Everything is computed locally; nothing is ever sent anywhere. */
(function () {
  'use strict';
  const CM = (window.CM = window.CM || {});
  const S = (CM.security = {});
  const enc = new TextEncoder();

  const toHex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  const fromHex = (hex) => new Uint8Array((hex.match(/.{2}/g) || []).map((h) => parseInt(h, 16)));

  S.hasSubtle = !!(window.crypto && window.crypto.subtle);

  S.randomHex = (n) => {
    const a = new Uint8Array(n || 16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    return toHex(a);
  };

  // cyrb53 — fast non-cryptographic hash, used only as a fallback.
  function cyrb53(str, seed) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  S.fallbackHash = (str) => [1, 2, 3, 4, 5].map((i) => cyrb53(str, i * 2654435761).toString(16).padStart(14, '0')).join('').slice(0, 64);

  S.sha256 = async (str) => {
    if (S.hasSubtle) { try { return toHex(await crypto.subtle.digest('SHA-256', enc.encode(str))); } catch (e) { /* fall through */ } }
    return S.fallbackHash(str);
  };

  /** PBKDF2-SHA256 with a per-user random salt. */
  S.hashPassword = async (password, saltHex, iterations) => {
    iterations = iterations || 150000;
    if (!S.hasSubtle) {
      let h = saltHex + ':' + password;
      for (let i = 0; i < 3000; i++) h = S.fallbackHash(h + password + i);
      return 'fb$' + h;
    }
    const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(saltHex), iterations, hash: 'SHA-256' }, key, 256);
    return toHex(bits);
  };

  S.safeEqual = (a, b) => {
    a = String(a); b = String(b);
    if (a.length !== b.length) return false;
    let r = 0;
    for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return r === 0;
  };

  S.strength = (pw) => {
    pw = pw || '';
    let raw = 0; const hints = [];
    if (pw.length >= 8) raw++; else hints.push('at least 8 characters');
    if (pw.length >= 12) raw++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) raw++; else hints.push('upper & lower case');
    if (/\d/.test(pw)) raw++; else hints.push('a number');
    if (/[^A-Za-z0-9]/.test(pw)) raw++; else hints.push('a symbol');
    if (/^(password|qwerty|123456|abc123|letmein)/i.test(pw)) raw = 0;
    const score = pw ? Math.max(1, Math.min(4, raw)) : 0;
    return { score, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][score], hints };
  };

  /* ==================== Device fingerprinting ==================== */

  function canvasSignal() {
    try {
      const c = document.createElement('canvas'); c.width = 260; c.height = 64;
      const x = c.getContext('2d');
      x.textBaseline = 'top';
      x.font = "15px 'Arial'";
      x.fillStyle = '#f60'; x.fillRect(110, 2, 70, 22);
      x.fillStyle = '#069'; x.fillText('CodeMentor <fp/> ✓ Ω 2.718', 3, 15);
      x.fillStyle = 'rgba(102,204,0,0.7)'; x.fillText('CodeMentor <fp/> ✓ Ω 2.718', 5, 17);
      x.globalCompositeOperation = 'multiply';
      x.fillStyle = 'rgb(255,0,255)'; x.beginPath(); x.arc(52, 40, 40, 0, Math.PI * 2, true); x.closePath(); x.fill();
      x.fillStyle = 'rgb(0,255,255)'; x.beginPath(); x.arc(92, 40, 40, 0, Math.PI * 2, true); x.closePath(); x.fill();
      return c.toDataURL();
    } catch (e) { return 'unavailable'; }
  }

  function webglSignal() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return 'none';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
      const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      return String(vendor) + ' | ' + String(renderer);
    } catch (e) { return 'error'; }
  }

  function fontSignal() {
    const base = ['monospace', 'sans-serif', 'serif'];
    const list = ['Arial', 'Calibri', 'Cambria', 'Consolas', 'Courier New', 'Georgia', 'Segoe UI', 'Tahoma', 'Times New Roman', 'Trebuchet MS',
      'Verdana', 'Helvetica', 'Menlo', 'Monaco', 'Roboto', 'Ubuntu', 'Noto Sans', 'Cascadia Code', 'Fira Code', 'JetBrains Mono',
      'Comic Sans MS', 'Impact', 'Lucida Console', 'Palatino Linotype', 'Garamond', 'Bahnschrift', 'Candara', 'Franklin Gothic Medium'];
    try {
      const ctx = document.createElement('canvas').getContext('2d');
      const text = 'mmmmmmmmmmlli10OQ@#&';
      const widths = {};
      base.forEach((b) => { ctx.font = '72px ' + b; widths[b] = ctx.measureText(text).width; });
      return list.filter((f) => base.some((b) => { ctx.font = "72px '" + f + "', " + b; return ctx.measureText(text).width !== widths[b]; })).join(',');
    } catch (e) { return 'unavailable'; }
  }

  function mathSignal() {
    return [Math.tan(-1e300), Math.sinh(1), Math.expm1(1), Math.cbrt(100), Math.log1p(10), Math.atanh(0.5)].map(String).join(';');
  }

  /** Human-friendly label e.g. "Edge on Windows" */
  S.deviceInfo = (ua) => {
    ua = ua || navigator.userAgent;
    let browser = 'Browser';
    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Chrome\//.test(ua)) browser = 'Chrome';
    else if (/Safari\//.test(ua)) browser = 'Safari';
    let os = 'Unknown OS';
    if (/Windows/.test(ua)) os = 'Windows';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
    else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS';
    else if (/CrOS/.test(ua)) os = 'ChromeOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    const mobile = /Android|iPhone|iPad|iPod|Mobile/.test(ua);
    return { browser, os, kind: mobile ? 'mobile' : 'desktop', label: browser + ' on ' + os };
  };

  // Weights decide how much each signal matters when comparing two fingerprints.
  const WEIGHTS = { canvas: 3, webgl: 3, fonts: 2, ua: 2, platform: 1, tz: 1, lang: 1, screen: 1, colorDepth: 1, cores: 1, memory: 1, touch: 1, math: 1 };
  S.WEIGHTS = WEIGHTS;

  function deviceKey() {
    try {
      let k = localStorage.getItem('cm.deviceKey');
      if (!k) { k = S.randomHex(16); localStorage.setItem('cm.deviceKey', k); }
      return k;
    } catch (e) { return 'ephemeral-' + S.randomHex(8); }
  }

  /** Collects device signals and returns a stable hash plus the raw components. */
  S.fingerprint = async () => {
    const n = navigator;
    const comp = {
      ua: String(n.userAgent).replace(/\d+(\.\d+)+/g, '#'), // ignore version numbers so browser updates don't change the id
      platform: (n.userAgentData && n.userAgentData.platform) || n.platform || 'unknown',
      tz: (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'unknown',
      lang: (n.languages || [n.language]).join(','),
      screen: Math.max(screen.width, screen.height) + 'x' + Math.min(screen.width, screen.height),
      colorDepth: screen.colorDepth,
      cores: n.hardwareConcurrency || 0,
      memory: n.deviceMemory || 0,
      touch: n.maxTouchPoints || 0,
      math: mathSignal(),
      webgl: webglSignal(),
      fonts: fontSignal(),
      canvas: ''
    };
    comp.canvas = (await S.sha256(canvasSignal())).slice(0, 20);
    const stable = Object.keys(WEIGHTS).map((k) => k + '=' + comp[k]).join('|');
    const hash = await S.sha256(stable);
    const info = S.deviceInfo();
    return { hash, short: hash.slice(0, 4) + '-' + hash.slice(4, 8) + '-' + hash.slice(8, 12), components: comp, label: info.label, kind: info.kind, deviceKey: deviceKey() };
  };

  /** Weighted similarity 0..1 between two component sets. */
  S.similarity = (a, b) => {
    if (!a || !b) return 0;
    let total = 0, match = 0;
    for (const k in WEIGHTS) { total += WEIGHTS[k]; if (String(a[k]) === String(b[k])) match += WEIGHTS[k]; }
    return match / total;
  };

  S.componentLabels = {
    ua: 'Browser engine', platform: 'Platform', tz: 'Time zone', lang: 'Languages', screen: 'Screen', colorDepth: 'Color depth',
    cores: 'CPU threads', memory: 'Device memory (GB)', touch: 'Touch points', math: 'Math engine', webgl: 'Graphics (WebGL)',
    fonts: 'Installed fonts', canvas: 'Canvas signature'
  };
})();
