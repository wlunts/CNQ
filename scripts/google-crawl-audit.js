#!/usr/bin/env node
/**
 * Google crawl perspective — full-site crawl & SEO audit
 * Checks: robots.txt, sitemap (URLs + images), per-page head metadata,
 * JSON-LD, internal links (dead links + anchors), resource refs, image SEO,
 * and content signals. Read-only. No files modified.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOMAIN = 'https://www.chinaqualityservice.com';
const HOST_RE = /^https?:\/\/[^/]+/;

const issues = { ERROR: [], WARN: [], INFO: [] };
function add(sev, msg) { issues[sev].push(msg); }

const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    // article-template.html is a copy-master with placeholder hrefs ("=========="),
    // not a live page — scanning it produces only false-positive errors/warnings.
    else if (e.name.endsWith('.html') && e.name !== 'article-template.html') files.push(p);
  }
}
walk(ROOT);

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

// ---------- helpers ----------
function htmlOf(p) { return fs.readFileSync(p, 'utf8'); }

function urlToDisk(cleanPath) {
  // cleanPath like "/inspection-cases/foo" or "/" or "/downloads/x.pdf" or "/about"
  if (cleanPath === '' || cleanPath === '/') return 'index.html';
  if (cleanPath.endsWith('/')) return cleanPath.slice(1) + 'index.html';
  if (/\.(?:html?|pdf|xlsx?|docx?|png|jpe?g|webp|svg|css|js|txt|xml)$/i.test(cleanPath)) return cleanPath.slice(1);
  return cleanPath.slice(1) + '.html';
}

function diskExists(relPath) {
  if (relPath.includes('#') || relPath.includes('?')) relPath = relPath.split(/[#?]/)[0];
  return fs.existsSync(path.join(ROOT, relPath));
}

// ---------- 1. sitemap ----------
console.log('\n========== [1] SITEMAP & CRAWL ENTRY ==========');
const sitemapRaw = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const urlBlocks = [...sitemapRaw.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => m[1]);

const sitemapEntries = [];
for (const b of urlBlocks) {
  const loc = (b.match(/<loc>([^<]+)<\/loc>/) || [])[1];
  const lastmod = (b.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || '';
  const images = [...b.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(m => m[1]);
  if (!loc) continue;
  sitemapEntries.push({ loc, lastmod, images });
}
console.log(`sitemap: ${sitemapEntries.length} URLs, ${sitemapEntries.reduce((a, e) => a + e.images.length, 0)} images declared`);

// 1a. sitemap loc → file exists?
for (const e of sitemapEntries) {
  const p = urlToDisk(e.loc.replace(DOMAIN, ''));
  if (!diskExists(p)) {
    add('ERROR', `[sitemap] loc has no file on disk: ${e.loc} (expect ${p})`);
  }
}

// 1b. sitemap images → file exists?
const missingSitemapImages = [];
for (const e of sitemapEntries) {
  for (const img of e.images) {
    const relImg = img.replace(DOMAIN, '');
    if (!diskExists(relImg)) missingSitemapImages.push(img);
  }
}
if (missingSitemapImages.length) {
  add('ERROR', `[sitemap] ${missingSitemapImages.length} declared image(s) missing on disk: ${missingSitemapImages.join(', ')}`);
}

// 1c. duplicate loc?
const seenLoc = new Map();
for (const e of sitemapEntries) {
  if (seenLoc.has(e.loc)) add('ERROR', `[sitemap] duplicate loc: ${e.loc}`);
  seenLoc.set(e.loc, e);
}

// 1d. lastmod format
for (const e of sitemapEntries) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.lastmod)) add('WARN', `[sitemap] non-ISO lastmod on ${e.loc}: "${e.lastmod}"`);
}

// 1e. disk pages not in sitemap (exclude 404 + article-template)
const sitemapPaths = new Set(sitemapEntries.map(e => {
  const p = urlToDisk(e.loc.replace(DOMAIN, '')).replace(/\\/g, '/');
  return p.replace(/^\.\//, '');
}));
const notInSitemap = [];
for (const f of files) {
  const r = rel(f);
  if (r === '404.html' || r === 'article-template.html') continue;
  const norm = r.replace(/\.html$/, '').replace(/\/index$/, r.endsWith('/index.html') ? '/' : '');
  // normalize: "index.html" -> "/", "inspection-cases/index.html" -> "inspection-cases/"
  let key = r;
  if (r === 'index.html') key = 'index.html';
  else if (r.endsWith('/index.html')) key = r.slice(0, -10) + '/';
  if (!sitemapPaths.has(key) && !sitemapPaths.has(r)) notInSitemap.push(r);
}
if (notInSitemap.length) add('ERROR', `[sitemap] page on disk missing from sitemap: ${notInSitemap.join(', ')}`);

// 1f. robots.txt
const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
if (!/Sitemap:\s*https:\/\/www\.chinaqualityservice\.com\/sitemap\.xml/i.test(robots))
  add('ERROR', '[robots] missing Sitemap directive (or wrong host)');
if (!/Disallow:\s*\/404/.test(robots)) add('WARN', '[robots] 404 path not disallowed');

// 1g. _redirects targets
const redirRaw = fs.existsSync(path.join(ROOT, '_redirects')) ? fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8') : '';
for (const line of redirRaw.split('\n').map(l => l.trim()).filter(Boolean)) {
  const [from, to, code] = line.split(/\s+/);
  if (!to) continue;
  if (!/^https?:/.test(to)) {
    const p = urlToDisk(to);
    if (!diskExists(p)) add('ERROR', `[_redirects] target missing: ${to} (${p})`);
  }
  if (code && code !== '301' && code !== '302' && code !== '200') add('WARN', `[_redirects] unusual status: ${from} -> ${to} [${code}]`);
}

// ---------- 2. per-page metadata ----------
console.log('\n========== [2] PER-PAGE METADATA ==========');
const titles = {};
const metas = {};
const h1Counts = [];

for (const f of files) {
  const r = rel(f);
  const c = htmlOf(f);
  const head = (c.match(/<head>([\s\S]*?)<\/head>/) || [])[1] || '';

  const titleM = head.match(/<title[^>]*>([^<]*)<\/title>/);
  const title = titleM ? titleM[1].trim() : '';
  if (!title) add('ERROR', `[${r}] missing <title>`);
  else {
    titles[title] = titles[title] || [];
    titles[title].push(r);
    const len = [...title].length;
    if (len > 65) add('WARN', `[${r}] title too long (${len} chars): ${title}`);
    if (len < 10) add('WARN', `[${r}] title too short (${len} chars)`);
  }

  const descM = head.match(/<meta\s+name="description"[^>]*?content="([^"]*)"/);
  const desc = descM ? descM[1] : '';
  if (!desc) add('ERROR', `[${r}] missing meta description`);
  else {
    metas[desc] = metas[desc] || [];
    metas[desc].push(r);
    const len = [...desc].length;
    if (len > 165) add('WARN', `[${r}] meta description too long (${len} chars)`);
    if (len < 50) add('WARN', `[${r}] meta description too short (${len} chars)`);
  }

  const h1s = [...c.matchAll(/<h1[\s>][\s\S]*?<\/h1>/g)].map(m => m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  h1Counts.push({ r, n: h1s.length, texts: h1s });
  if (h1s.length === 0) add('ERROR', `[${r}] no H1`);
  if (h1s.length > 1) add('ERROR', `[${r}] multiple H1s (${h1s.length}): ${h1s.join(' | ')}`);

  const canonM = head.match(/<link\s+rel="canonical"[^>]*?href="([^"]+)"/);
  if (!canonM && r !== '404.html') add('ERROR', `[${r}] missing canonical`);
  else if (canonM) {
    const canon = canonM[1];
    if (!canon.startsWith(DOMAIN)) add('ERROR', `[${r}] canonical wrong host: ${canon}`);
    if (/\?/.test(canon)) add('ERROR', `[${r}] canonical has query string: ${canon}`);
    // canonical trailing-slash rule
    const p = canon.replace(DOMAIN, '');
    const hasIndex = r.endsWith('/index.html');
    if (hasIndex && p !== '/' && !p.endsWith('/')) add('ERROR', `[${r}] canonical missing trailing slash (dir page): ${canon}`);
    if (!hasIndex && r !== 'index.html' && p.endsWith('/')) add('ERROR', `[${r}] canonical has trailing slash (single page): ${canon}`);
    // canonical vs sitemap loc
    const inSitemap = sitemapEntries.some(e => e.loc === canon);
    if (!inSitemap) add('WARN', `[${r}] canonical not in sitemap: ${canon}`);
  }

  const hreflangs = [...head.matchAll(/<link\s+rel="alternate"[^>]*?hreflang="([^"]+)"[^>]*?href="([^"]+)"/g)].map(m => ({ h: m[1], u: m[2] }));
  const hf = new Set(hreflangs.map(x => x.h));
  if (!hf.has('en')) add('WARN', `[${r}] missing hreflang="en"`);
  if (!hf.has('x-default')) add('WARN', `[${r}] missing hreflang="x-default"`);
  if (hf.has('zh-CN')) add('WARN', `[${r}] has hreflang="zh-CN" (should be en + x-default only)`);

  const robotsMeta = head.match(/<meta\s+name="robots"[^>]*?content="([^"]*)"/);
  if (r === '404.html') {
    if (!robotsMeta || !/noindex/i.test(robotsMeta[1])) add('ERROR', `[${r}] 404 page missing noindex`);
  } else if (r !== 'article-template.html') {
    // article-template.html is an internal draft template — intentionally noindexed
    if (robotsMeta && /noindex/i.test(robotsMeta[1])) add('ERROR', `[${r}] non-404 page has noindex: ${robotsMeta[1]}`);
    if (!robotsMeta || !/max-image-preview:large/i.test(robotsMeta[1] || '')) add('WARN', `[${r}] missing robots max-image-preview:large`);
  }

  const og = {
    title: (head.match(/<meta\s+property="og:title"[^>]*?content="([^"]*)"/) || [])[1],
    desc: (head.match(/<meta\s+property="og:description"[^>]*?content="([^"]*)"/) || [])[1],
    url: (head.match(/<meta\s+property="og:url"[^>]*?content="([^"]*)"/) || [])[1],
    image: (head.match(/<meta\s+property="og:image"[^>]*?content="([^"]*)"/) || [])[1],
    type: (head.match(/<meta\s+property="og:type"[^>]*?content="([^"]*)"/) || [])[1],
    siteName: (head.match(/<meta\s+property="og:site_name"[^>]*?content="([^"]*)"/) || [])[1],
  };
  if (!og.title) add('ERROR', `[${r}] missing og:title`);
  if (!og.desc) add('ERROR', `[${r}] missing og:description`);
  if (!og.url) add('ERROR', `[${r}] missing og:url`);
  else if (canonM && og.url !== canonM[1]) add('WARN', `[${r}] og:url (${og.url}) != canonical (${canonM[1]})`);
  if (!og.image) add('ERROR', `[${r}] missing og:image`);
  else if (r !== 'article-template.html' && !diskExists(og.image.replace(DOMAIN, ''))) add('ERROR', `[${r}] og:image missing on disk: ${og.image}`);
  if (!og.type) add('WARN', `[${r}] missing og:type`);

  const tw = {
    card: (head.match(/<meta\s+name="twitter:card"[^>]*?content="([^"]*)"/) || [])[1],
    title: (head.match(/<meta\s+name="twitter:title"[^>]*?content="([^"]*)"/) || [])[1],
    desc: (head.match(/<meta\s+name="twitter:description"[^>]*?content="([^"]*)"/) || [])[1],
    image: (head.match(/<meta\s+name="twitter:image"[^>]*?content="([^"]*)"/) || [])[1],
  };
  if (!tw.card) add('WARN', `[${r}] missing twitter:card`);
  if (!tw.title) add('WARN', `[${r}] missing twitter:title`);
  else if (og.title && tw.title !== og.title) add('WARN', `[${r}] twitter:title != og:title`);
  if (!tw.desc) add('WARN', `[${r}] missing twitter:description`);
  else if (og.desc && tw.desc !== og.desc) add('WARN', `[${r}] twitter:description != og:description`);
  if (!tw.image) add('WARN', `[${r}] missing twitter:image`);
  else if (r !== 'article-template.html' && !diskExists(tw.image.replace(DOMAIN, ''))) add('ERROR', `[${r}] twitter:image missing on disk: ${tw.image}`);

  if (!/viewport/.test(head)) add('ERROR', `[${r}] missing viewport meta`);
  if (!/lang="en"/.test(c)) add('ERROR', `[${r}] <html> missing lang="en"`);

  // og:title sync with <title>
  if (og.title && og.title !== title) add('WARN', `[${r}] og:title != <title>`);
}

// duplicate titles
for (const [t, list] of Object.entries(titles)) {
  if (list.length > 1) add('ERROR', `[dup-title] "${t}" used by: ${list.join(', ')}`);
}
// duplicate descriptions
for (const [d, list] of Object.entries(metas)) {
  if (list.length > 1) add('ERROR', `[dup-desc] "${d.slice(0, 70)}..." used by: ${list.join(', ')}`);
}

// ---------- 3. JSON-LD ----------
console.log('\n========== [3] JSON-LD ==========');
for (const f of files) {
  const r = rel(f);
  const c = htmlOf(f);
  const blocks = [...c.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!blocks.length) { add('WARN', `[${r}] no JSON-LD at all`); continue; }

  let parsed = 0;
  for (const b of blocks) {
    let data;
    try { data = JSON.parse(b); } catch (e) { add('ERROR', `[${r}] invalid JSON-LD: ${e.message.slice(0, 80)}`); continue; }
    parsed++;
    const nodes = data['@graph'] ? data['@graph'] : [data];
    const types = nodes.map(n => n['@type']).filter(Boolean);
    for (const n of nodes) {
      const t = n['@type'];
      if (t === 'Article' || t === 'WebPage' || t === 'ItemPage' || t === 'FAQPage') {
        const ip = n.isPartOf && n.isPartOf['@id'];
        if (!n.headline && t === 'Article') add('WARN', `[${r}] Article missing headline`);
        if (!n['@id'] && (t === 'Article' || t === 'WebPage')) add('WARN', `[${r}] ${t} missing @id`);
        if (ip !== undefined && ip !== DOMAIN + '/#website') add('ERROR', `[${r}] ${t} isPartOf=${ip} (expect ${DOMAIN}/#website)`);
        if (t === 'Article' && (!n.author || !n.publisher)) add('WARN', `[${r}] Article missing author/publisher`);
      }
      if (t === 'ProfessionalService' || t === 'LocalBusiness' || t === 'Service') {
        const po = n.parentOrganization;
        if (t !== 'Service' && po && po['@id'] !== DOMAIN + '/#organization')
          add('ERROR', `[${r}] ${t} parentOrganization=${po['@id']} (expect ${DOMAIN}/#organization)`);
      }
      if (t === 'FAQPage') {
        if (n['@id'] && !(n['@id'] + '').endsWith('#faq')) add('WARN', `[${r}] FAQPage @id not ending #faq: ${n['@id']}`);
      }
    }
  }
  // @graph must define website + organization
  if (/@graph/.test(c)) {
    const data = blocks.map(b => { try { return JSON.parse(b); } catch { return null; } }).find(Boolean);
    if (data && data['@graph']) {
      const ids = data['@graph'].map(n => n['@id'] || '').join(' ');
      if (!ids.includes('#website')) add('WARN', `[${r}] @graph missing #website entity`);
      if (!ids.includes('#organization')) add('WARN', `[${r}] @graph missing #organization entity`);
    }
  }
}

// ---------- 4. internal links / dead links / anchors ----------
console.log('\n========== [4] INTERNAL LINKS ==========');
const deadLinks = [];
for (const f of files) {
  const r = rel(f);
  const c = htmlOf(f);
  const hasBaseRoot = /<base\s+href="\/">/.test(c);
  const links = [...c.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  for (const href of links) {
    if (/^(mailto:|tel:|javascript:|#|data:|blob:)/i.test(href)) continue;
    if (/^https?:\/\//i.test(href)) {
      if (href.startsWith(DOMAIN)) {
        // same-domain absolute
        const p = href.replace(DOMAIN, '');
        checkInternal(r, href, p);
      }
      continue; // external
    }
    if (href.startsWith('//')) continue; // protocol-relative external
    // relative or root-absolute
    let p = href;
    if (!p.startsWith('/') && !hasBaseRoot) {
      // no base → resolve from current page dir (approximation)
      const dir = r.includes('/') ? r.slice(0, r.lastIndexOf('/')) : '';
      p = '/' + (dir ? dir + '/' : '') + p;
    } else if (!p.startsWith('/')) {
      p = '/' + p;
    }
    checkInternal(r, href, p);
  }
}
function checkInternal(srcPage, rawHref, cleanPath) {
  const noHash = cleanPath.split('#')[0];
  const noQuery = noHash.split('?')[0];
  if (noQuery === '') return;
  const disk = urlToDisk(noQuery);
  if (!diskExists(disk)) {
    deadLinks.push({ src: srcPage, href: rawHref, disk });
  }
  // anchor existence
  if (cleanPath.includes('#')) {
    const anchor = cleanPath.split('#')[1];
    if (anchor) {
      const targetFile = path.join(ROOT, disk);
      if (fs.existsSync(targetFile)) {
        const tc = fs.readFileSync(targetFile, 'utf8');
        if (!new RegExp(`id=["']${anchor}["']`).test(tc)) {
          add('WARN', `[${srcPage}] anchor #${anchor} not found in ${disk}`);
        }
      }
    }
  }
}
if (deadLinks.length) {
  add('ERROR', `[links] ${deadLinks.length} dead internal link(s):`);
  for (const d of deadLinks.slice(0, 40)) add('ERROR', `  ${d.src} -> ${d.href} (expect ${d.disk})`);
} else {
  console.log('  no dead internal links');
}

// ---------- 5. resources (css/js/icon/img refs) ----------
console.log('\n========== [5] RESOURCE & IMAGE REFS ==========');
let imgCount = 0, imgNoAlt = 0, imgNoDim = 0, imgNoLazy = 0, imgBadName = 0, imgTooBig = 0;
const missingRefs = [];
const bigImages = [];
for (const f of files) {
  const r = rel(f);
  const c = htmlOf(f);
  // css/js refs
  for (const m of c.matchAll(/(?:href|src)="(\/[^"]+\.(?:css|js))"/g)) {
    const p = m[1].split(/[?#]/)[0];
    if (!diskExists(p)) missingRefs.push(`${r} -> ${m[1]}`);
  }
  // icons
  for (const m of c.matchAll(/href="(\/[^"]+\.(?:ico|svg|png))"/g)) {
    const p = m[1].split(/[?#]/)[0];
    if (!diskExists(p)) missingRefs.push(`${r} -> ${m[1]}`);
  }
  // img
  for (const m of c.matchAll(/<img\s[^>]*>/g)) {
    const tag = m[0];
    imgCount++;
    const src = (tag.match(/src="([^"]+)"/) || [])[1];
    if (!src) { imgNoAlt++; continue; }
    if (!/^https?:\/\//.test(src)) {
      const p = src.split(/[?#]/)[0].startsWith('/') ? src.split(/[?#]/)[0] : '/' + src.split(/[?#]/)[0];
      if (!diskExists(p)) missingRefs.push(`${r} -> ${src}`);
    }
    if (!/alt=/.test(tag)) { imgNoAlt++; add('WARN', `[${r}] img missing alt: ${src}`); }
    if (!/width=/.test(tag) || !/height=/.test(tag)) { imgNoDim++; add('WARN', `[${r}] img missing width/height: ${src}`); }
    if (!/loading=["']lazy["']/.test(tag) && !/loading=["']eager["']/.test(tag) && !src.includes('logo')) { imgNoLazy++; }
    const base = src.split(/[?#]/)[0];
    const fname = base.substring(base.lastIndexOf('/') + 1);
    if (/^\d+[a-z]?\.(jpg|jpeg|png|webp)$/i.test(fname) || /_/.test(fname) || /^IMG_\d+/i.test(fname)) {
      imgBadName++; add('WARN', `[${r}] non-SEO image filename: ${fname}`);
    }
    // size
    const local = base.startsWith('/') ? base.slice(1) : base;
    const abs = path.join(ROOT, local);
    try {
      const sz = fs.statSync(abs).size / 1024;
      if (sz > 300) { imgTooBig++; bigImages.push(`${local} (${Math.round(sz)}KB)`); }
    } catch {}
  }
}
if (missingRefs.length) add('ERROR', `[refs] ${missingRefs.length} missing resource(s): ${missingRefs.slice(0, 30).join(' | ')}`);
if (imgTooBig) add('WARN', `[img] ${imgTooBig} image(s) >300KB: ${bigImages.slice(0, 15).join(', ')}`);

console.log(`  images scanned: ${imgCount} | no-alt: ${imgNoAlt} | no-width/height: ${imgNoDim} | no-lazy: ${imgNoLazy} | bad-name: ${imgBadName} | >300KB: ${imgTooBig}`);

// ---------- 6. content signals ----------
console.log('\n========== [6] CONTENT SIGNALS ==========');
for (const f of files) {
  const r = rel(f);
  if (r === '404.html') continue; // noindex page — thin content expected
  const c = htmlOf(f);
  const main = (c.match(/<main[\s>][\s\S]*?<\/main>/) || [])[0] || '';
  const text = main
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/data-zh="[^"]*"/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = text.split(' ').filter(Boolean).length;
  if (words < 150) add('WARN', `[${r}] thin content ~${words} words`);
}

// ---------- 7. news-grid (home) ----------
console.log('\n========== [7] HOME NEWS-GRID ==========');
const home = htmlOf(path.join(ROOT, 'index.html'));
const gridM = home.match(/class="news-grid"([\s\S]*?)<\/div>\s*<div\s+style="text-align:center/);
const grid = gridM ? gridM[1] : '';
if (!grid) add('ERROR', '[home] news-grid block not found');
else {
  const cards = [...grid.matchAll(/<a href="([^"]+)"[^>]*>[\s\S]*?<\/a>/g)].map(m => m[1]);
  console.log(`  news-grid cards: ${cards.length} -> ${cards.join(', ')}`);
  if (cards.length !== 3) add('ERROR', `[home] news-grid has ${cards.length} cards (expect 3)`);

  // cross-check each card is the newest of its type (by datePublished)
  function newestByType(dir) {
    let best = null;
    const base = path.join(ROOT, dir);
    if (!fs.existsSync(base)) return best;
    for (const f of fs.readdirSync(base)) {
      if (!f.endsWith('.html') || f === 'index.html') continue;
      const c = htmlOf(path.join(base, f));
      const jm = c.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (!jm) continue;
      try {
        const j = JSON.parse(jm[1]);
        const art = (j['@graph'] || [j]).find(n => n['@type'] === 'Article');
        if (art && art.datePublished) {
          const key = '/' + dir + '/' + f.replace('.html', '');
          if (!best || art.datePublished > best.dp) best = { dp: art.datePublished, key };
        }
      } catch {}
    }
    return best;
  }
  const types = [
    { k: 'case', dir: 'inspection-cases', expectHref: cards[0] },
    { k: 'factory', dir: 'factory-resource', expectHref: cards[1] },
    { k: 'update', dir: 'industry-updates', expectHref: cards[2] },
  ];
  for (const v of types) {
    const b = newestByType(v.dir);
    if (b) {
      console.log(`  newest ${v.k}: ${b.dp} ${b.key} | grid card: ${v.expectHref}`);
      if (v.expectHref && b.key !== v.expectHref) {
        add('WARN', `[home] news-grid ${v.k} card (${v.expectHref}) is not newest (newest=${b.key} ${b.dp})`);
      }
    }
    // card image vs article og:image consistency
    if (v.expectHref) {
      const artFile = path.join(ROOT, v.expectHref.slice(1) + '.html');
      if (fs.existsSync(artFile)) {
        const ac = htmlOf(artFile);
        const og = (ac.match(/<meta property="og:image"[^>]*?content="([^"]+)"/) || [])[1] || '';
        if (og) {
          const ogPath = og.replace(DOMAIN, '');
          const cardImgs = [...grid.matchAll(/<img[^>]*src="([^"]+)"/g)].map(m => m[1]);
          if (!cardImgs.includes(ogPath)) {
            add('WARN', `[home] news-grid ${v.k} card img != article og:image (card img: ${cardImgs.map(x=>x.split('/').pop()).join(',')} vs og:image: ${ogPath})`);
          }
        }
      }
    }
  }
}

// ---------- report ----------
const lines = [];
lines.push('========== AUDIT SUMMARY ==========');
for (const sev of ['ERROR', 'WARN']) {
  lines.push(`\n--- ${sev}: ${issues[sev].length} ---`);
  if (issues[sev].length === 0) { lines.push('  (none)'); continue; }
  for (const msg of issues[sev]) lines.push(`  ${msg}`);
}
lines.push(`\nTOTAL: ${issues.ERROR.length} errors, ${issues.WARN.length} warnings`);
const out = lines.join('\n');
console.log(out);
fs.writeFileSync(path.join(ROOT, 'scripts', 'audit-report.txt'), out, 'utf8');
