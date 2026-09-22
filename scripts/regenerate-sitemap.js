#!/usr/bin/env node
/**
 * Regenerate sitemap.xml from current workspace HTML files.
 *
 * Walk all *.html under workspace, derive canonical URL, lastmod (file
 * mtime, Beijing time +08:00), and image entries (every <img src="/Upload/...">
 * absolute URL). Writes a valid XML sitemap with proper <url>/</url> wrappers.
 *
 * Excluded:
 *   - 404.html (per project rule: 404 not in sitemap)
 *   - article-template.html (template, not a published page)
 *
 * Usage:
 *   node scripts/regenerate-sitemap.js          # apply
 *   node scripts/regenerate-sitemap.js --dry    # report only
 *
 * Pairs with scripts/filter-sitemap-images.js for the post-pass that
 * removes generic-named <image:image> entries.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const DOMAIN = 'https://www.chinaqualityservice.com';
const TZ_OFFSET = '+08:00';

const EXCLUDE_FILES = new Set(['404.html', 'article-template.html']);

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry');

// ---------- URL helpers ----------

function fileToUrlPath(filePath) {
  // filePath like 'about.html', 'factory-resource/index.html',
  // 'inspection-cases/cooler-bag-printing-defect.html'.
  // Returns e.g. '/about', '/factory-resource/', or '/inspection-cases/cooler-bag-printing-defect'.
  if (filePath === 'index.html') return '/';
  if (filePath.endsWith('/index.html')) {
    return '/' + filePath.slice(0, -'/index.html'.length) + '/';
  }
  if (filePath.endsWith('.html')) {
    return '/' + filePath.slice(0, -'.html'.length);
  }
  return null;
}

function fileToLastmod(absPath) {
  const mtimeMs = fs.statSync(absPath).mtimeMs;
  // Beijing = UTC+8. We render the local-time-equivalent at +08:00 so that
  // Google's UTC conversion always stays consistent regardless of the host
  // server's clock zone.
  const beijingMs = mtimeMs + 8 * 3600 * 1000;
  const d = new Date(beijingMs);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${TZ_OFFSET}`;
}

function htmlToImages(html) {
  // Match every <img ... src="..."> and pull src values that begin with
  // "/Upload/" (case-sensitive). Resolve to absolute URLs.
  const out = [];
  const re = /<img\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let src = m[1].trim();
    if (src.startsWith('/Upload/')) {
      // Strip any leading/trailing whitespace in the URL itself.
      src = src.split('?')[0].split('#')[0];
      out.push(DOMAIN + src);
    } else if (/^https?:\/\//i.test(src)) {
      // Already absolute -- only keep if it's our own domain.
      try {
        const u = new URL(src);
        if (u.hostname === 'www.chinaqualityservice.com' && u.pathname.startsWith('/Upload/')) {
          out.push(u.origin + u.pathname);
        }
      } catch (_) { /* ignore */ }
    }
  }
  return out;
}

// ---------- Walk ----------

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && ent.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function buildEntries() {
  const files = walk(ROOT)
    .map((p) => path.relative(ROOT, p).replace(/\\/g, '/'))
    .filter((rel) => !EXCLUDE_FILES.has(rel))
    .sort();

  return files.map((rel) => {
    const abs = path.join(ROOT, rel);
    const html = fs.readFileSync(abs, 'utf8');
    return {
      urlPath: fileToUrlPath(rel),
      lastmod: fileToLastmod(abs),
      images: htmlToImages(html),
    };
  }).filter((e) => e.urlPath);
}

// ---------- Render ----------

function renderXml(entries) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const e of entries) {
    lines.push('  <url>');
    lines.push(`    <loc>${DOMAIN}${e.urlPath}</loc>`);
    lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
    for (const img of e.images) {
      lines.push(`    <image:image><image:loc>${img}</image:loc></image:image>`);
    }
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  return lines.join('\n') + '\n';
}

// ---------- Main ----------

function main() {
  const entries = buildEntries();
  const totalImages = entries.reduce((s, e) => s + e.images.length, 0);
  const xml = renderXml(entries);

  console.log('================================================');
  console.log(' Sitemap Regeneration');
  console.log('================================================');
  console.log(`URLs:   ${entries.length}`);
  console.log(`Images: ${totalImages}`);
  console.log('');

  for (const e of entries) {
    console.log(`  ${e.urlPath.padEnd(72)} ${String(e.images.length).padStart(3)} imgs  ${e.lastmod}`);
  }

  if (DRY_RUN) {
    console.log('[DRY RUN] No file written.');
    return;
  }

  fs.writeFileSync(SITEMAP, xml, 'utf8');
  console.log('');
  console.log('[OK] Wrote', path.relative(process.cwd(), SITEMAP));
  console.log('  size:', Buffer.byteLength(xml, 'utf8'), 'bytes');
}

main();