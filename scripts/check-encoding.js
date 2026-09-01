#!/usr/bin/env node
// scripts/check-encoding.js
// Scans all HTML files for GBK-mojibake characters inside data-zh attributes.
// Run standalone:  node scripts/check-encoding.js
// Called by validate-seo.ps1 as a UTF-8-safe encoding gate.
//
// Background: PowerShell 5.1 reads BOM-less UTF-8 scripts as ANSI/GBK, so any
// Chinese written in a .ps1 gets saved as mojibake. This script detects the
// tell-tale mojibake glyphs so bad writes are caught before commit.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// High-confidence mojibake glyphs: characters that essentially never appear in
// normal simplified-Chinese prose but are the typical result of UTF-8 Chinese
// being decoded as GBK (e.g. 金色 -> 閲戣壊, 的 -> 鐨, 标准与白皮书 -> 鏍囧噯涓庣櫧鐨功).
const MOJIBAKE_RE = /[閲鐨鍝鍒鍦鏄鏈鏉閫鎺鍐鐜鍗鍏鍚鍥鍖鎬鏍鈥]/g;

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

for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const hits = [];
  let m;
  MOJIBAKE_RE.lastIndex = 0;
  while ((m = MOJIBAKE_RE.exec(txt)) !== null) {
    const line = txt.slice(0, m.index).split('\n').length;
    hits.push('char=' + m[0] + ' line=' + line);
  }
  if (hits.length) {
    bad++;
    console.log('FAIL ' + rel + ' - ' + hits.join(', '));
  } else {
    console.log('OK   ' + rel);
  }
}

console.log('--- ' + files.length + ' files scanned, ' + bad + ' with mojibake');
process.exit(bad ? 1 : 0);
