#!/usr/bin/env node
// scripts/check-encoding.js
// Guards the English-only site against broken encodings and mixed-in Chinese.
// Run standalone:  node scripts/check-encoding.js
// Called by validate-seo.ps1 as a UTF-8-safe encoding gate.
//
// Two checks per HTML file:
//   1. GBK-mojibake glyphs — the tell-tale result of UTF-8 Chinese being
//      decoded/written as ANSI (e.g. 金色 -> 閲戣壊, 标准与白皮书 -> 鏍囧噯涓庣櫧鐨功).
//   2. Stray CJK characters — this is an English-only site, so no page may
//      carry Chinese text. The single allowed exception is the label of the
//      link to the Chinese site (中) in the language switch.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// High-confidence mojibake glyphs: characters that essentially never appear in
// normal simplified-Chinese prose but are the typical result of UTF-8 Chinese
// being decoded as GBK.
const MOJIBAKE_RE = /[閲鐨鍝鍒鍦鏄鏈鏉閫鎺鍐鐜鍗鍏鍚鍥鍖鎬鏍鈥]/g;

// The one intentional CJK label: the link to the Chinese site.
const LANG_SWITCH_RE = /<a href="https:\/\/zh\.cn-q\.com\/"[^>]*>[^<]*<\/a>/g;

// Any Han character.
const CJK_RE = /[\u4e00-\u9fff]/g;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const files = walk(root, []);
let bad = 0;

const lineOf = (txt, idx) => txt.slice(0, idx).split('\n').length;

for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const hits = [];
  let m;

  MOJIBAKE_RE.lastIndex = 0;
  while ((m = MOJIBAKE_RE.exec(txt)) !== null) {
    hits.push('mojibake=' + m[0] + ' line=' + lineOf(txt, m.index));
  }

  const noSwitch = txt.replace(LANG_SWITCH_RE, '');
  CJK_RE.lastIndex = 0;
  while ((m = CJK_RE.exec(noSwitch)) !== null) {
    hits.push('cjk=' + m[0] + ' line=' + lineOf(noSwitch, m.index));
  }

  if (hits.length) {
    bad++;
    console.log('FAIL ' + rel + ' - ' + hits.join(', '));
  } else {
    console.log('OK   ' + rel);
  }
}

console.log('--- ' + files.length + ' files scanned, ' + bad + ' with mojibake or stray CJK');
process.exit(bad ? 1 : 0);
