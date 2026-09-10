#!/usr/bin/env node
// scripts/sync-header.js
// Treats article-template.html as the single source of truth for the site-wide
// header/nav block, then checks (or syncs) it across every HTML page.
//
//   node scripts/sync-header.js         # check only (default): report drift, exit 1 if any
//   node scripts/sync-header.js --sync  # rewrite every page's header from the template
//
// Active-state handling: the nav highlights the current section with
// class="active" on one top-level link (e.g. article pages highlight Insights,
// the about page highlights About Us). That per-page state is NOT part of the
// shared structure, so we strip it before comparing and re-apply it after sync.
//
// Why static + this script instead of JS/CSS-injected nav:
// The nav's internal links must stay visible to Googlebot on the FIRST raw HTML
// fetch. JS/CSS injection moves them into rendered-only HTML and breaks our
// static audits (validate-seo.ps1, check-header-footer.ps1). This script keeps
// output 100% static while removing the per-page copy-paste problem — same
// rationale as sync-footer.js.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const TEMPLATE = 'article-template.html';
const SYNC = process.argv.includes('--sync');
const SKIP = new Set(['.git', 'node_modules', 'Upload', 'downloads']);

// The site header block. Anchored on class="header" so it never matches a
// content-level <header> element inside an article.
const HEADER_RE = /<header class="header">[\s\S]*?<\/header>/;
const HEADER_OPEN_RE = /<header class="header">/g;

// Top-level nav links that may carry class="active" (dropdown children never do).
// Kept in sync with the nav built from article-template.html.
const TOP_LEVEL = ['/about', '/services', '/insights', '/download', '/contact', '/industries/'];

// Normalize line endings so CRLF vs LF never creates false drift.
function normalize(s) {
  return s.replace(/\r\n|\r/g, '\n');
}

// Remove class="active" from top-level nav links (so per-page state doesn't
// count as structural drift).
function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

function stripTopActive(html) {
  let out = html;
  for (const h of TOP_LEVEL) {
    out = out.replace(new RegExp('<a href="' + esc(h) + '"\\s+class="active"', 'g'), '<a href="' + h + '"');
  }
  return out;
}

// Collect hrefs of top-level links currently marked active.
function activeHrefs(html) {
  const out = [];
  for (const h of TOP_LEVEL) {
    if (new RegExp('<a href="' + esc(h) + '"\\s+class="active"').test(html)) out.push(h);
  }
  return out;
}

// Re-apply class="active" to the given top-level hrefs in a header block.
function injectTopActive(header, hrefs) {
  let out = header;
  for (const h of hrefs) {
    const needle = '<a href="' + h + '"';
    if (!out.includes(needle)) {
      console.log('WARN     cannot re-apply active for ' + h + ' (not found in template)');
      continue;
    }
    out = out.replace(needle, '<a href="' + h + '" class="active"');
  }
  return out;
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

// ---- Source of truth: header block from article-template.html ----
const tplRaw = fs.readFileSync(path.join(root, TEMPLATE), 'utf8');
const tplMatch = tplRaw.match(HEADER_RE);
if (!tplMatch) {
  console.error('FAIL: header block not found in ' + TEMPLATE);
  process.exit(2);
}
const tplHeader = normalize(tplMatch[0]);

// ---- Scan every HTML page ----
const files = walk(root, []).sort();
let ok = 0;
let drift = 0;
let noHeader = 0;
let multi = 0;

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const raw = fs.readFileSync(file, 'utf8');

  const opens = (raw.match(HEADER_OPEN_RE) || []).length;
  if (opens > 1) {
    multi++;
    console.log('MULTI    ' + rel + ' | ' + opens + ' header blocks');
  }

  const m = raw.match(HEADER_RE);
  if (!m) {
    noHeader++;
    console.log('NOHEADER ' + rel);
    continue;
  }

  const pageHeader = normalize(m[0]);
  const pageActive = activeHrefs(pageHeader);
  const unknown = pageActive.filter((h) => !TOP_LEVEL.includes(h));
  if (unknown.length) {
    console.log('WARNACT  ' + rel + ' | active on non-top-level link: ' + unknown.join(', '));
  }

  if (stripTopActive(pageHeader) === tplHeader) {
    ok++;
    continue;
  }

  drift++;
  if (SYNC) {
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const newHeader = injectTopActive(tplHeader, pageActive).replace(/\n/g, eol);
    fs.writeFileSync(file, raw.replace(HEADER_RE, () => newHeader), 'utf8');
    console.log('SYNCED   ' + rel + (pageActive.length ? '  (active: ' + pageActive.join(',') + ')' : ''));
  } else {
    const pageLines = pageHeader.split('\n');
    const tplLines = tplHeader.split('\n');
    let firstDiff = -1;
    const max = Math.max(pageLines.length, tplLines.length);
    for (let i = 0; i < max; i++) {
      if (pageLines[i] !== tplLines[i]) { firstDiff = i + 1; break; }
    }
    const hint = firstDiff > 0 ? pageLines[firstDiff - 1] || '(template only)' : '';
    console.log(
      'DRIFT    ' + rel +
      ' | lines: page=' + pageLines.length + ' tpl=' + tplLines.length +
      ' | first diff @ header line ' + firstDiff +
      ' | page: ' + hint.slice(0, 90).replace(/\s+/g, ' ')
    );
  }
}

console.log(
  '--- ' + files.length + ' files | ' + ok + ' identical | ' + drift + ' drifted | ' +
  noHeader + ' without header' + (multi ? ' | ' + multi + ' multi-header' : '') +
  (SYNC ? ' | synced from ' + TEMPLATE : ' | run with --sync to apply ' + TEMPLATE)
);
process.exit(SYNC ? 0 : (drift || noHeader ? 1 : 0));
