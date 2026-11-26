#!/usr/bin/env node
/*
 * CodeMentor engine tests: no dependencies, no browser.
 * Run with:  npm test   (or: node tests/run-tests.js)
 *
 * 1. Conversation cases (tests/cases/*.json): a question → the answer must match `expect` (regex)
 *    and must not match `not`. Cases in one file share conversation state, so follow-ups
 *    ("simpler", "show it in Java") are tested too. `reset: true` starts a fresh conversation.
 * 2. scanf/printf format checks for C.
 * 3. Consistency: every problem the Playground reports for its buggy samples must also
 *    appear in the chat's answer, however the code is pasted.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP = path.join(__dirname, '..', 'app');
const ENGINE_FILES = [
  'js/core/icons.js', 'js/core/util.js', 'js/render/highlight.js', 'js/render/markdown.js',
  'js/kb/registry.js', 'js/kb/concepts-basics.js', 'js/kb/concepts-oop.js', 'js/kb/concepts-dsa.js', 'js/kb/concepts-lang.js',
  'js/kb/errors-python.js', 'js/kb/errors-js.js', 'js/kb/errors-java-c.js', 'js/kb/errors-tools.js', 'js/kb/recipes.js', 'js/kb/compare-faq.js',
  'js/engine/search.js', 'js/engine/analyzer.js', 'js/engine/brain.js'
];
const USER = { displayName: 'Test', profile: { fullName: 'Test Student', level: 'beginner', primaryLang: 'python' } };

function loadEngine() {
  const ctx = { console, setTimeout, clearTimeout, TextEncoder, URL, Blob: function () {} };
  ctx.window = ctx;
  ctx.navigator = { userAgent: 'node' };
  vm.createContext(ctx);
  for (const f of ENGINE_FILES) vm.runInContext(fs.readFileSync(path.join(APP, f), 'utf8'), ctx, { filename: f });
  return ctx.CM;
}

const CM = loadEngine();
let total = 0, failed = 0;
const short = (s) => String(s).replace(/\s+/g, ' ').slice(0, 70);
const strip = (s) => String(s).replace(/[«»`*]/g, '').trim();
function check(ok, label) { total++; if (!ok) { failed++; console.log('  ✘ ' + label); } }
const ask = (text, opts) => CM.brain.respond(Object.assign({ text, state: {}, user: USER, depth: 'balanced', langPref: 'auto' }, opts || {}));

console.log('Knowledge base: ' + CM.kb.concepts.length + ' concepts, ' + CM.kb.errors.length + ' error types, ' + CM.kb.recipes.length + ' recipes, ' + CM.kb.compares.length + ' comparisons\n');

/* ---------------- 1. conversation cases ---------------- */
const casesDir = path.join(__dirname, 'cases');
for (const file of fs.readdirSync(casesDir).filter((f) => f.endsWith('.json')).sort()) {
  const cases = JSON.parse(fs.readFileSync(path.join(casesDir, file), 'utf8').replace(/^﻿/, ''));
  const before = failed;
  let state = {};
  for (const c of cases) {
    if (c.reset) state = {};
    let r;
    try { r = ask(c.q, { state, depth: c.depth || 'balanced', langPref: c.lang || 'auto' }); }
    catch (e) { check(false, file + ': crashed on "' + short(c.q) + '": ' + e.message); continue; }
    state = r.meta.state || {};
    const exp = c.expect ? new RegExp(c.expect, 'i') : null;
    const ok = (!exp || exp.test(r.content) || exp.test(JSON.stringify(r.meta.topic || ''))) && (!c.not || !new RegExp(c.not, 'i').test(r.content));
    check(ok, file + ': "' + short(c.q) + '" → expected /' + (c.expect || '') + '/' + (c.not ? ' and not /' + c.not + '/' : '') + ', got: ' + short(r.content.split('\n')[0]));
    let rendered = true;
    try { CM.md.render(r.content); } catch (e) { rendered = false; }
    check(rendered, file + ': markdown render crashed for "' + short(c.q) + '"');
  }
  console.log((failed === before ? '✔ ' : '✘ ') + 'cases/' + file + ' (' + cases.length + ')');
}

/* ---------------- 2. C format checks ---------------- */
{
  const before = failed;
  const wrap = (body, decl) => '#include <stdio.h>\nint main() {\n    ' + decl + '\n    ' + body + '\n    return 0;\n}';
  const FORMAT = [
    ['%d into char array', wrap('scanf("%d", postfix);', 'char postfix[20];'), /Wrong format: `%d` used for `postfix`/, 'scanf("%s", postfix)'],
    ['%s into int', wrap('scanf("%s", &n);', 'int n;'), /Wrong format: `%s` used for `n`/, 'scanf("%d", &n)'],
    ['%d into float', wrap('scanf("%d", &f);', 'float f;'), /which is a float/, 'scanf("%f", &f)'],
    ['%f into double', wrap('scanf("%f", &d);', 'double d;'), /which is a double/, 'scanf("%lf", &d)'],
    ['%d into char', wrap('scanf("%d", &c);', 'char c;'), /which is a char/, 'scanf(" %c", &c)'],
    ['printf %d with char array', wrap('printf("%d", name);', 'char name[30];'), /which is a char array/, 'printf("%s", name)'],
    ['printf %s with char', wrap('printf("%s", ch);', 'char ch;'), /`%s` used for `ch`/, 'printf("%c", ch)'],
    ['missing & on array element', wrap('for (int i = 0; i < 5; i++) scanf("%d", a[i]);', 'int a[5];'), /Missing `&` before `a\[i\]`/, 'scanf("%d", &a[i])'],
    ['missing & on int', wrap('scanf("%d", n);', 'int n;'), /Missing `&` before `n`/, 'scanf("%d", &n)'],
    ['too few arguments', wrap('scanf("%d %d", &n);', 'int n;'), /2 format specifiers but 1 argument/, null],
    ['correct program has no format issues', wrap('scanf("%19s %d %f %lf %c", s, &n, &f, &d, &c);\n    printf("%s %d %.2f %f %c %%\\n", s, n, f, d, c);', 'char s[20]; int n; float f; double d; char c;'), null, null]
  ];
  for (const [name, code, must, fixed] of FORMAT) {
    const issues = CM.analyzer.analyze(code, 'c').issues;
    const titles = issues.map((i) => i.title.replace(/[«»]/g, '`'));
    let ok = must ? titles.some((t) => must.test(t)) : !titles.some((t) => /Wrong format|Missing `&`|format specifier/.test(t));
    if (ok && fixed) { const fx = CM.analyzer.autofix(code, issues); ok = !!fx && fx.code.indexOf(fixed) >= 0; }
    check(ok, 'format: ' + name + ' → ' + JSON.stringify(titles));
  }
  console.log((failed === before ? '✔ ' : '✘ ') + 'C scanf/printf format checks (' + FORMAT.length + ')');
}

/* ---------------- 3. Playground ↔ chat consistency ---------------- */
{
  const before = failed;
  const pgSrc = fs.readFileSync(path.join(APP, 'js/ui/playground-view.js'), 'utf8');
  const grab = (name) => vm.runInNewContext('(' + pgSrc.match(new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\n  \\});'))[1] + ')');
  const BUGGY = grab('BUGGY'), SAMPLES = grab('SAMPLES');
  let n = 0;
  for (const lang of Object.keys(BUGGY)) {
    const code = BUGGY[lang].replace(/\s+$/, '');
    const pg = CM.analyzer.analyze(code, lang).issues;
    const forms = {
      'fenced': '```' + lang + '\n' + code + '\n```',
      'question + fence': "what's wrong with my code\n```" + lang + '\n' + code + '\n```',
      'fence without language': 'is there any error in this code?\n```\n' + code + '\n```',
      'unfenced': "what's wrong with my code\n" + code,
      'language picker set to another language': "what's wrong with my code\n```" + lang + '\n' + code + '\n```'
    };
    for (const [form, text] of Object.entries(forms)) {
      n++;
      const r = ask(text, form.startsWith('language picker') ? { langPref: lang === 'java' ? 'python' : 'java' } : {});
      const content = strip(r.content);
      const missing = pg.filter((i) => content.indexOf(strip(i.title)) < 0);
      check(!missing.length, 'consistency: ' + lang + ' / ' + form + ' → chat missed: ' + missing.map((i) => 'L' + i.line + ' ' + strip(i.title)).join(' | '));
    }
  }
  for (const lang of Object.keys(SAMPLES)) {
    n++;
    const r = ask("what's wrong with my code\n```" + lang + '\n' + SAMPLES[lang] + '\n```');
    check(/No obvious problems/.test(r.content), 'consistency: clean ' + lang + ' sample should have no problems');
  }
  console.log((failed === before ? '✔ ' : '✘ ') + 'Playground ↔ chat consistency (' + n + ')');
}

console.log('\n' + (failed ? '✘ ' + failed + ' of ' + total + ' checks failed' : '✔ All ' + total + ' checks passed'));
process.exit(failed ? 1 : 0);
