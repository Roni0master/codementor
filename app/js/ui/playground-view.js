/* CodeMentor — Playground: write, run (offline), analyze and explain code */
(function () {
  'use strict';
  const CM = window.CM, U = CM.util, A = CM.auth;
  const esc = U.esc;
  const V = (CM.views = CM.views || {});

  const SAMPLES = {
    python: `# Find the average of some marks
def average(marks):
    total = 0
    for m in marks:
        total += m
    return total / len(marks)

n = int(input("How many marks? "))
marks = [int(input()) for _ in range(n)]
print("Average:", average(marks))
`,
    javascript: `// Count how often each word appears
const text = "the cat and the hat";
const counts = {};
for (const word of text.split(" ")) {
  counts[word] = (counts[word] || 0) + 1;
}
console.log(counts);
console.log("Most common:", Object.entries(counts).sort((a, b) => b[1] - a[1])[0]);
`,
    java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long fact = 1;
        for (int i = 2; i <= n; i++) fact *= i;
        System.out.println(n + "! = " + fact);
    }
}
`,
    c: `#include <stdio.h>

int main() {
    int n, sum = 0;
    printf("Enter a number: ");
    scanf("%d", &n);
    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }
    printf("Sum of digits = %d\\n", sum);
    return 0;
}
`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> v = {5, 2, 9, 1, 7};
    sort(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    cout << endl;
    return 0;
}
`
  };
  const BUGGY = {
    python: `def greet(name)
    print("Hello, " + name)

names = ["Asha", "Ravi"]
for i in range(len(names) + 1):
    greet(names[i])
pritn("done")
`,
    javascript: `const total = 0;
const nums = [1, 2, 3];
for (let i = 0; i <= nums.length; i++) {
  total += nums[i];
}
console.log("Total:", total.lenght);
`,
    java: `public class Main {
    public static void main(String[] args) {
        int x = 10
        String s = "hi";
        if (s == "hi") system.out.println("x is " + x);
    }
}
`,
    c: `#include <stdio.h>
int main() {
    int n;
    char word[5] = "hello";
    scanf("%d", n);
    printf("%d %s\\n", n, word);
    return 0;
}
`,
    cpp: `#include <iostream>
int main() {
    int a = 5
    cout << a << endl;
    return 0;
}
`
  };
  const PG_KEY = 'cm.pg.';
  let pending = null;

  CM.app = CM.app || {};
  /** Opens the playground with code (from chat, snippets, library). */
  CM.openPlaygroundWith = function (code, lang) { pending = { code, lang }; };

  V.playground = {
    async render(container) {
      container.innerHTML = '';
      const el = U.html(`
<div class="pg">
  <section class="pg-left">
    <div class="pg-bar">
      <h2>${CM.icon('terminal', 18)} Playground</h2>
      <select class="select pg-lang" aria-label="Language"></select>
      <div class="grow"></div>
      <button class="btn btn-sm btn-ghost" data-act="sample" title="Load a working example">${CM.icon('file', 15)}<span>Example</span></button>
      <button class="btn btn-sm btn-ghost" data-act="buggy" title="Load buggy code to practise debugging">${CM.icon('bug', 15)}<span>Buggy code</span></button>
      <button class="btn btn-sm btn-ghost" data-act="save" title="Save snippet">${CM.icon('bookmark', 15)}<span>Save</span></button>
      <button class="btn btn-sm" data-act="analyze">${CM.icon('search', 15)}<span>Analyze</span></button>
      <button class="btn btn-sm btn-grad" data-act="run">${CM.icon('play', 14)}<span>Run</span><kbd style="background:rgba(255,255,255,.18);border-color:transparent;color:#fff">Ctrl ↵</kbd></button>
    </div>
    <div class="editor-host" style="flex:1;min-height:0;display:flex"></div>
    <div class="stdin"><label><span>${CM.icon('keyboard', 13)} Program input (stdin), one value per line</span><span class="faint">used by input() / scanf / Scanner / prompt()</span></label><textarea class="pg-stdin" placeholder="e.g.&#10;3&#10;70&#10;80&#10;90"></textarea></div>
  </section>
  <section class="pg-right">
    <div class="tabs" style="padding:0 12px" role="tablist">
      <button class="tab on" data-tab="console">${CM.icon('terminal', 15)}Output</button>
      <button class="tab" data-tab="problems">${CM.icon('alert', 15)}Problems <span class="count pb-count">0</span></button>
      <button class="tab" data-tab="explain">${CM.icon('book', 15)}Explain</button>
    </div>
    <div class="pg-out"></div>
  </section>
</div>`);
      container.appendChild(el);
      const langSel = el.querySelector('.pg-lang');
      ['python', 'javascript', 'java', 'c', 'cpp'].forEach((l) => langSel.appendChild(new Option(U.langName(l), l)));
      const out = el.querySelector('.pg-out');
      const stdin = el.querySelector('.pg-stdin');
      let tab = 'console';
      let lastRun = null, lastAnalysis = null;

      await CM.runner.detect();
      const ed = CM.Editor({ lang: 'python', onRun: () => run() });
      ed.el.style.flex = '1';
      el.querySelector('.editor-host').appendChild(ed.el);

      // initial content
      let lang = U.store.get(PG_KEY + 'lang', A.user.profile.primaryLang && SAMPLES[A.user.profile.primaryLang] ? A.user.profile.primaryLang : 'python');
      if (pending) { lang = SAMPLES[CM.hl.normalize(pending.lang)] ? CM.hl.normalize(pending.lang) : (CM.analyzer.detectLanguage(pending.code).lang || lang); }
      if (!SAMPLES[lang]) lang = 'python';
      langSel.value = lang; ed.setLang(lang);
      ed.setValue(pending ? pending.code : U.store.get(PG_KEY + 'code.' + lang, SAMPLES[lang]));
      stdin.value = U.store.get(PG_KEY + 'stdin', '');
      if (pending) { pending = null; analyze(true); }

      const persist = U.debounce(() => { U.store.set(PG_KEY + 'code.' + langSel.value, ed.getValue()); U.store.set(PG_KEY + 'lang', langSel.value); U.store.set(PG_KEY + 'updated', Date.now()); }, 400);
      ed.onChange(() => { persist(); liveAnalyze(); });
      stdin.addEventListener('input', U.debounce(() => U.store.set(PG_KEY + 'stdin', stdin.value), 300));
      langSel.onchange = () => {
        U.store.set(PG_KEY + 'code.' + lang, ed.getValue());
        lang = langSel.value;
        ed.setLang(lang);
        ed.setValue(U.store.get(PG_KEY + 'code.' + lang, SAMPLES[lang]));
        U.store.set(PG_KEY + 'lang', lang);
        lastRun = null; analyze(true); showTab('console');
      };

      el.querySelectorAll('.tabs .tab').forEach((t) => t.onclick = () => showTab(t.dataset.tab));
      function showTab(t) { tab = t; el.querySelectorAll('.tabs .tab').forEach((x) => x.classList.toggle('on', x.dataset.tab === t)); draw(); }

      el.querySelector('[data-act=run]').onclick = run;
      el.querySelector('[data-act=analyze]').onclick = () => { analyze(); showTab('problems'); };
      el.querySelector('[data-act=sample]').onclick = () => { ed.setValue(SAMPLES[lang]); persist(); analyze(true); };
      el.querySelector('[data-act=buggy]').onclick = () => { ed.setValue(BUGGY[lang]); persist(); analyze(); showTab('problems'); U.toast('Buggy code loaded: find the bugs, or click a problem to jump to it', 'info', 3500); };
      el.querySelector('[data-act=save]').onclick = async () => {
        const title = await U.prompt({ title: 'Save snippet', label: 'Title', value: U.langName(lang) + ' snippet', icon: 'bookmark' });
        if (title == null) return;
        await CM.data.saveSnippet({ title: title.trim() || 'Snippet', content: '```' + lang + '\n' + ed.getValue().replace(/\s+$/, '') + '\n```', code: ed.getValue(), lang, source: 'playground' });
        U.toast('Snippet saved', 'success');
      };

      const liveAnalyze = U.debounce(() => analyze(true), 600);
      function analyze(silent) {
        lastAnalysis = CM.analyzer.analyze(ed.getValue(), lang);
        const marks = {};
        lastAnalysis.issues.forEach((i) => { if (i.severity === 'error') marks[i.line] = 'err'; else if (i.severity === 'warning' && !marks[i.line]) marks[i.line] = 'warn'; });
        ed.mark(marks);
        const n = lastAnalysis.issues.filter((i) => i.severity !== 'info').length;
        el.querySelector('.pb-count').textContent = n;
        if (!silent || tab !== 'console') draw();
      }

      async function run() {
        const code = ed.getValue();
        if (!code.trim()) return;
        const btn = el.querySelector('[data-act=run]');
        btn.disabled = true;
        showTab('console');
        out.innerHTML = '<div class="console"><div class="meta"><span class="spinner"></span> Running ' + esc(U.langName(lang)) + '…</div></div>';
        try {
          lastRun = await CM.runner.run(lang, code, stdin.value);
          A.user.stats.runs = (A.user.stats.runs || 0) + 1; A.save();
          // remember the last failing run so the chat can explain it ("what's wrong with my code?")
          const errOut = (lastRun.stderr || '') + (lastRun.timedOut ? '\nProgram timed out (possible infinite loop)' : '');
          U.store.set(PG_KEY + 'lastRun', errOut.trim() ? { lang, code, stderr: errOut.trim().slice(0, 4000), at: Date.now() } : null);
          U.store.set(PG_KEY + 'code.' + lang, code); U.store.set(PG_KEY + 'lang', lang); U.store.set(PG_KEY + 'updated', Date.now());
        } catch (e) {
          lastRun = { error: e.message };
        } finally { btn.disabled = false; }
        draw();
      }

      function consoleHtml() {
        if (!lastRun) {
          const st = CM.runner.status().find((s) => s.lang === lang);
          return '<div class="empty" style="padding:40px 10px"><div class="empty-ic">' + CM.icon('play', 26) + '</div><h3>Run your code</h3><p>Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> or click <b>Run</b>. ' +
            (st && st.ok ? U.langName(lang) + ' runs locally on this computer' + (st.note ? ' (' + esc(st.note) + ')' : '') + '.' : lang === 'javascript' ? 'JavaScript runs in a secure sandbox inside the app.' : U.langName(lang) + ' needs its compiler installed and CodeMentor started with the launcher. You can still <b>Analyze</b> and <b>Explain</b> it.') + '</p></div>';
        }
        if (lastRun.error) return '<div class="notice"><span>' + CM.icon('alert', 18) + '</span><div>' + esc(lastRun.error) + '</div></div>';
        const r = lastRun;
        let html = '<div class="console">';
        if (r.lines && r.lines.length) html += r.lines.map((l) => '<div class="line ' + (l.type === 'error' ? 'err' : l.type === 'warn' ? 'warn' : l.type === 'info' ? 'info' : '') + '">' + esc(l.text) + '</div>').join('');
        else if (r.stdout) html += '<div class="line">' + esc(r.stdout) + '</div>';
        if (r.stderr && !(r.lines && r.lines.some((l) => l.type === 'error'))) html += '<div class="line err">' + esc(r.stderr) + '</div>';
        else if (r.timedOut && r.lines) html += '<div class="line err">Stopped: possible infinite loop.</div>';
        if (!r.stdout && !r.stderr && !(r.lines && r.lines.length)) html += '<div class="line info">(program finished with no output)</div>';
        const ok = r.exitCode === 0 && !r.timedOut;
        html += '<div class="meta">' + (ok ? '✅ Finished' : r.timedOut ? '⏱️ Timed out' : r.compileError ? '🛑 Compile error' : '❌ Exited with code ' + r.exitCode) + (r.durationMs != null ? ' · ' + r.durationMs + ' ms' : '') + '</div></div>';
        const warnOnly = ok && r.stderr && /warning:/i.test(r.stderr);
        if ((!ok && (r.stderr || r.timedOut)) || warnOnly) html += '<div style="margin-top:14px" class="row wrap"><button class="btn btn-sm btn-grad" data-x="mentor">' + CM.icon('sparkles', 15) + '<span>' + (warnOnly ? 'Explain these warnings' : 'Explain this error') + '</span></button><button class="btn btn-sm" data-x="chat">' + CM.icon('message', 15) + '<span>Ask in chat</span></button></div><div class="mentor-box md" style="margin-top:14px"></div>';
        return html;
      }

      function problemsHtml() {
        if (!lastAnalysis) analyze(true);
        const a = lastAnalysis;
        if (!a.issues.length) return '<div class="empty" style="padding:40px 10px"><div class="empty-ic" style="background:color-mix(in srgb,var(--ok) 14%,transparent);color:var(--ok)">' + CM.icon('check-circle', 26) + '</div><h3>No problems found</h3><p>Static checks passed: syntax, brackets, common mistakes and typos. Logic errors can still hide, so test with edge cases!</p></div>';
        const fixed = CM.analyzer.autofix(ed.getValue(), a.issues);
        return a.issues.map((i) => '<div class="issue ' + i.severity + '" data-line="' + i.line + '"><span class="sev"></span><div class="grow"><span class="ln">Line ' + i.line + ' · ' + i.severity + '</span><br><b>' + CM.md.inline(i.title.replace(/[«»]/g, '`')) + '</b><p>' + CM.md.inline(i.detail.replace(/[«»]/g, '`')) + '</p></div></div>').join('') +
          (fixed && fixed.changed.length ? '<div class="row" style="margin-top:12px"><button class="btn btn-sm btn-grad" data-x="autofix">' + CM.icon('wand', 15) + '<span>Apply ' + U.plural(fixed.changed.length, 'quick fix', 'quick fixes') + '</span></button><span class="faint" style="font-size:12.5px">Safe, line-level fixes. You can undo with Ctrl+Z.</span></div>' : '');
      }

      function explainHtml() {
        const code = ed.getValue();
        if (!code.trim()) return '<p class="muted">Write some code first.</p>';
        const sum = CM.analyzer.summary(code, lang);
        const cx = CM.analyzer.complexity(code, lang);
        const lines = CM.analyzer.explainLines(code, lang);
        let md = '### What this program does\n';
        const bits = [];
        if (sum.functions.length) bits.push('Defines ' + sum.functions.map((f) => '`' + f.name + '()`').join(', '));
        if (sum.classes.length) bits.push('Defines class ' + sum.classes.map((c) => '`' + c + '`').join(', '));
        if (sum.loops) bits.push('Uses ' + U.plural(sum.loops, 'loop'));
        if (cx.recursive.length) bits.push('Uses recursion (' + cx.recursive.map((r) => '`' + r + '`').join(', ') + ')');
        if (sum.io.length) bits.push(U.cap(sum.io.join(' and ')));
        md += bits.length ? bits.map((b) => '- ' + b).join('\n') : '- A short program with no functions or loops.';
        md += '\n\n### ⏱️ Estimated complexity: **' + cx.label + '**\n' + cx.reasons.map((r) => '- ' + r.replace(/[«»]/g, '`')).join('\n');
        md += '\n\n### Line by line\n| Line | Code | What it does |\n|---|---|---|\n' + lines.map((x) => '| ' + x.line + ' | `' + x.code.replace(/\|/g, '\\|').replace(/`/g, "'").slice(0, 60) + '` | ' + x.text.replace(/[«»]/g, '`').replace(/\|/g, '\\|') + ' |').join('\n');
        return '<div class="md">' + CM.md.render(md) + '</div>';
      }

      function draw() {
        out.innerHTML = tab === 'console' ? consoleHtml() : tab === 'problems' ? problemsHtml() : explainHtml();
      }

      out.addEventListener('click', async (e) => {
        const issue = e.target.closest('.issue');
        if (issue) { ed.goToLine(+issue.dataset.line); return; }
        const x = e.target.closest('[data-x]');
        if (!x) return;
        const errText = lastRun ? [lastRun.stderr, lastRun.timedOut ? 'Program timed out (possible infinite loop)' : ''].filter(Boolean).join('\n') : '';
        const question = 'I get this error:\n```text\n' + errText.trim() + '\n```\nHere is my code:\n```' + lang + '\n' + ed.getValue().replace(/\s+$/, '') + '\n```';
        if (x.dataset.x === 'chat') { CM.app.navigate('#/chat'); setTimeout(() => CM.views.chat.ask(question), 80); }
        if (x.dataset.x === 'mentor') {
          const r = CM.brain.respond({ text: question, user: A.user, depth: 'balanced', langPref: lang });
          const box = out.querySelector('.mentor-box');
          box.innerHTML = CM.md.render(r.content);
          CM.md.bind(box, { ask: (q) => { CM.app.navigate('#/chat'); setTimeout(() => CM.views.chat.ask(q), 80); }, playground: (code) => { ed.setValue(code); persist(); analyze(true); } });
          box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (x.dataset.x === 'autofix') {
          const fixed = CM.analyzer.autofix(ed.getValue(), lastAnalysis.issues);
          if (fixed) {
            ed.textarea.focus(); ed.textarea.select();
            if (!document.execCommand || !document.execCommand('insertText', false, fixed.code)) ed.setValue(fixed.code);
            persist(); analyze(); U.toast('Applied fixes on ' + U.plural(fixed.changed.length, 'line'), 'success');
          }
        }
      });

      analyze(true);
      draw();
      setTimeout(() => ed.focus(), 50);
    }
  };
})();
