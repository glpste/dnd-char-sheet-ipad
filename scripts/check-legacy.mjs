// Fails the build if dist/ contains anything iOS 10.3 Safari (WebKit 603, ~ES2017) cannot parse.
// This is the only automated proof the bundle is iPad-4-safe; keep it strict.
//
// Notes on the output shape (Vite 8 + @vitejs/plugin-legacy, renderModernChunks: false):
// - Only *-legacy.js chunks are emitted; the minifier floors at ES2015, which Safari 10.1 supports.
// - CSS is inlined into the entry chunk as a string and injected at runtime, so the CSS checks
//   run over every string literal that looks like a stylesheet.
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const assets = join(dist, 'assets');
const problems = [];
const warnings = [];

const html = readFileSync(join(dist, 'index.html'), 'utf8');
if (/type="module"/.test(html)) problems.push('index.html: <script type="module"> present');
if (/nomodule/.test(html)) problems.push('index.html: nomodule attribute present');
if ((html.match(/polyfills-legacy/g) ?? []).length !== 1) problems.push('index.html: expected exactly one polyfills-legacy script');
if (!/index-legacy/.test(html)) problems.push('index.html: no index-legacy entry');

function checkCss(label, css) {
  const checks = [
    [/:is\(/, ':is()'],
    [/:has\(/, ':has()'],
    [/rgba?\(\d+ /, 'space-separated rgb()'],
    [/\(\s*(min-|max-)?width\s*[<>]=?/, 'range media query'],
    [/[{;]inset:/, 'inset shorthand'],
  ];
  for (const [re, name] of checks) if (re.test(css)) problems.push(`${label}: ${name}`);
  // Tailwind's preflight uses :where() on a few element resets. Safari 10 drops those rules, which is
  // harmless only because src/index.css re-declares the button reset without :where(). Any other
  // :where() is a failure.
  const PREFLIGHT_WHERE = /^(abbr|input|button|select|optgroup|textarea|h[1-6]|a|b|strong|code|kbd|samp|pre|small|sub|sup|\[hidden\]):where\(/;
  if (/:where\(/.test(css) && !/\[type=button\][^{]*\{[^}]*-webkit-appearance:button/.test(css)) {
    problems.push(`${label}: :where() present but the button-reset fallback from src/index.css is missing`);
  }
  // A selector list containing ::backdrop must be ::backdrop alone, or Safari 10 drops the whole rule.
  for (const m of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    const sel = m[1].trim();
    const body = m[0];
    if (sel.includes(':where(') && !PREFLIGHT_WHERE.test(sel)) problems.push(`${label}: :where() outside preflight in "${sel.slice(0, 60)}"`);
    if (sel.includes('::backdrop') && sel.includes(',')) problems.push(`${label}: ::backdrop merged into selector list "${sel.slice(0, 60)}"`);
    if (/[{;]gap:/.test(body) && !/grid-gap:/.test(body)) problems.push(`${label}: gap without grid-gap in "${sel.slice(0, 60)}"`);
    if (/[{;](column|row)-gap:/.test(body) && !/grid-(column|row)-gap:/.test(body)) problems.push(`${label}: column/row-gap without grid- fallback in "${sel.slice(0, 60)}"`);
  }
  if (/focus-visible/.test(css)) warnings.push(`${label}: :focus-visible rules present (ignored on iOS 10, harmless)`);
}

function stringLiterals(ast) {
  const out = [];
  (function walk(node) {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'Literal' && typeof node.value === 'string') out.push(node.value);
    if (node.type === 'TemplateLiteral') for (const q of node.quasis) out.push(q.value.cooked ?? '');
    for (const key of Object.keys(node)) {
      const v = node[key];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v.type === 'string') walk(v);
    }
  })(ast);
  return out;
}

let cssSeen = 0;
for (const file of readdirSync(assets)) {
  const text = readFileSync(join(assets, file), 'utf8');
  if (file.endsWith('.css')) {
    cssSeen++;
    checkCss(file, text);
  } else if (file.endsWith('.js')) {
    if (!/legacy/.test(file)) {
      problems.push(`${file}: non-legacy JS chunk emitted`);
      continue;
    }
    let ast;
    try {
      ast = parse(text, { ecmaVersion: 2017, sourceType: 'script' });
    } catch (e) {
      problems.push(`${file}: not parseable as ES2017 (${e.message})`);
      continue;
    }
    for (const s of stringLiterals(ast)) {
      if (s.includes('--tw-') && s.includes('{')) {
        cssSeen++;
        checkCss(`${file} (inlined css)`, s);
      }
    }
  }
}
if (cssSeen === 0) problems.push('no stylesheet found in dist (neither a .css asset nor inlined CSS)');

for (const w of warnings) console.warn(`warn: ${w}`);
if (problems.length) {
  for (const p of problems) console.error(`FAIL: ${p}`);
  process.exit(1);
}
console.log('check:legacy OK');
