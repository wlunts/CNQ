#!/usr/bin/env node
// scripts/sync-footer.js
// Treats article-template.html as the single source of truth for the site-wide
// footer block, then checks (or syncs) it across every HTML page.
//
//   node scripts/sync-footer.js         # check only (default): report drift, exit 1 if any
//   node scripts/sync-footer.js --sync  # rewrite every page's footer from the template
//
// Why static + this script instead of JS/CSS-injected footers:
// NAP (name/address/phone) and the footer's internal links must stay visible to
// Googlebot on the FIRST raw HTML fetch. JS/CSS injection moves that content into
// rendered-only HTML and breaks our static audits (validate-seo.ps1,
// check-header-footer.ps1, nap-consistency-check.js). This script keeps output
// 100% static while removing the 45-file copy-paste problem.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const TEMPLATE = 'article-template.html';
const SYNC = process.argv.includes('--sync');
const SKIP = new Set(['.git', 'node_modules', 'Upload', 'downloads']);

// A footer block: <footer ...> ... </footer>. No page nests another <footer>,
// so a non-greedy match to the first closing tag is safe.
const FOOTER_RE = /<footer\b[^>]*>[\s\S]*?<\/footer>/;

// Normalize line endings so CRLF vs LF never creates false drift.
function normalize(s) {
  return s.replace(/\r\n|\r/g, '\n');
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

// ---- Source of truth: footer block from article-template.html ----
const templatePath = path.join(root, TEMPLATE);
const tplRaw = fs.readFileSync(templatePath, 'utf8');
const tplMatch = tplRaw.match(FOOTER_RE);
if (!tplMatch) {
  console.error('FAIL: footer block not found in ' + TEMPLATE);
  process.exit(2);
}
const tplFooter = normalize(tplMatch[0]);

// ---- Scan every HTML page ----
const files = walk(root, []).sort();
let ok = 0;
let drift = 0;
let noFooter = 0;

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(FOOTER_RE);

  if (!m) {
    noFooter++;
    console.log('NOFOOTER ' + rel);
    continue;
  }

  if (normalize(m[0]) === tplFooter) {
    ok++;
    continue;
  }

  drift++;
  if (SYNC) {
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const newFooter = tplFooter.replace(/\n/g, eol);
    fs.writeFileSync(file, raw.replace(FOOTER_RE, newFooter), 'utf8');
    console.log('SYNCED   ' + rel);
  } else {
    const pageLines = normalize(m[0]).split('\n');
    const tplLines = tplFooter.split('\n');
    let firstDiff = -1;
    const max = Math.max(pageLines.length, tplLines.length);
    for (let i = 0; i < max; i++) {
      if (pageLines[i] !== tplLines[i]) { firstDiff = i + 1; break; }
    }
    const hint = firstDiff > 0 ? pageLines[firstDiff - 1] || '(template only)' : '';
    console.log(
      'DRIFT    ' + rel +
      ' | lines: page=' + pageLines.length + ' tpl=' + tplLines.length +
      ' | first diff @ footer line ' + firstDiff +
      ' | page: ' + hint.slice(0, 90).replace(/\s+/g, ' ')
    );
  }
}

console.log(
  '--- ' + files.length + ' files | ' + ok + ' identical | ' + drift + ' drifted | ' +
  noFooter + ' without footer' + (SYNC ? ' | synced from ' + TEMPLATE : ' | run with --sync to apply ' + TEMPLATE)
);
process.exit(SYNC ? 0 : (drift || noFooter ? 1 : 0));
