/* CodeMentor — optional local LLM connector (Ollama or any OpenAI-compatible local server such as LM Studio).
   Runs against a server on YOUR machine, so it stays offline. The built-in engine is always the fallback. */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util;
  const L = (CM.llm = {});

  const trim = (u) => String(u || '').trim().replace(/\/+$/, '');

  L.listModels = async function (cfg) {
    const base = trim(cfg.url);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    try {
      if (cfg.provider === 'openai') {
        const r = await fetch(base + '/v1/models', { signal: ctrl.signal });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        return (j.data || []).map((m) => m.id);
      }
      const r = await fetch(base + '/api/tags', { signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      return (j.models || []).map((m) => m.name);
    } finally { clearTimeout(t); }
  };

  L.test = async function (cfg) {
    try {
      const models = await L.listModels(cfg);
      return { ok: true, models };
    } catch (e) {
      return { ok: false, error: e.name === 'AbortError' ? 'No response from ' + cfg.url + '. Is the local AI server running?' : e.message };
    }
  };

  L.systemPrompt = function (user, depth, langPref, context) {
    const p = (user && user.profile) || {};
    return [
      'You are CodeMentor, a friendly, patient coding mentor for students. You run fully offline on the student\'s computer.',
      'Goals: help students fix errors, understand the concept behind the problem, and learn, not just copy code.',
      'Style rules:',
      '- Use Markdown. Put code in fenced blocks tagged with the language (```python, ```java …).',
      '- For errors, use these sections: "## 🐞 <error>", "**In plain words:** …", "### 📍 Where it happens", "### 🔎 Why this happens", "### 🛠️ How to fix it" (show corrected code), and a final "> [!concept] The concept behind it" callout.',
      '- For concepts: a one-line summary, an everyday analogy, a clear explanation, a short code example, and common mistakes.',
      '- Be accurate. If you are unsure, say so. Do not invent APIs.',
      '- Student level: ' + (p.level || 'beginner') + '. Preferred language: ' + (langPref && langPref !== 'auto' ? langPref : (p.primaryLang || 'python')) + '. Answer depth: ' + (depth || 'balanced') + ' (simple = short and plain, deep = thorough with internals and complexity).',
      context ? '\nVerified facts from the offline knowledge base and static analyzer (trust these, and build your answer around them):\n' + context : ''
    ].join('\n');
  };

  /** Streams a chat completion. Calls onToken(textSoFar). Resolves with the full text. */
  L.chat = async function ({ cfg, messages, onToken, signal }) {
    const base = trim(cfg.url);
    if (!cfg.model) throw new Error('Choose a model in Settings → AI Engine.');
    const isOpenAI = cfg.provider === 'openai';
    const res = await fetch(base + (isOpenAI ? '/v1/chat/completions' : '/api/chat'), {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isOpenAI
        ? { model: cfg.model, messages, stream: true, temperature: cfg.temperature != null ? cfg.temperature : 0.3 }
        : { model: cfg.model, messages, stream: true, options: { temperature: cfg.temperature != null ? cfg.temperature : 0.3 } })
    });
    if (!res.ok || !res.body) {
      let msg = 'HTTP ' + res.status;
      try { const j = await res.json(); msg = (j.error && (j.error.message || j.error)) || msg; } catch (e) { /* ignore */ }
      throw new Error(msg);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '', text = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        let line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        if (isOpenAI) {
          if (!line.startsWith('data:')) continue;
          line = line.slice(5).trim();
          if (line === '[DONE]') continue;
        }
        try {
          const j = JSON.parse(line);
          const piece = isOpenAI ? (j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content) || '' : (j.message && j.message.content) || '';
          if (piece) { text += piece; if (onToken) onToken(text); }
          if (j.error) throw new Error(j.error.message || j.error);
        } catch (e) { if (e && /error/i.test(e.message) && !/JSON/.test(e.message)) throw e; }
      }
    }
    return text;
  };

  L.enabled = (user) => !!(user && user.settings && user.settings.engine === 'local' && user.settings.llm && user.settings.llm.model);
  void U;
})();
