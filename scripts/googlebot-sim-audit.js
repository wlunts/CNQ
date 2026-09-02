#!/usr/bin/env node
/**
 * Googlebot SIMULATED full-site audit (local, pre-deploy state).
 * Role-plays Googlebot: entry discovery -> link crawl -> per-URL index decision.
 * Unlike a lint-style checklist, this produces an INDEX DECISION per page:
 *   INDEX   = likely indexed & useful
 *   NOT_IDX = blocked (noindex) / placeholder / not meant for indexing
 *   THIN    = too little unique body content
 *   DUP     = near-duplicate of another page (Google would consolidate)
 *   FIX     = fixable issue blocks or hurts indexing
 * Plus: link-reachability BFS, E-E-A-T signals, JSON-LD validity, image index signals.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DOMAIN = 'https://www.chinaqualityservice.com';
const out = [];
const log = (s) => out.push(s);
const E = (m) => log('  [ERROR] ' + m), W = (m) => log('  [WARN ] ' + m), I = (m) => log('  [ok    ] ' + m);

const all = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) all.push(p); } })(ROOT);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const fileOf = new Map(all.map((p) => [rel(p), p]));

// ---- read local sitemap ----
const smPath = path.join(ROOT, 'sitemap.xml');
const sm = fs.existsSync(smPath) ? fs.readFileSync(smPath, 'utf8') : '';
const sitemapUrls = [];
for (const b of [...sm.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1])) {
  const loc = (b.match(/<loc>([^<]+)<\/loc>/) || [])[1]; if (loc) sitemapUrls.push(loc);
}

// ---- utils ----
const attr = (tag, name) => { const i = tag.toLowerCase().indexOf(name.toLowerCase() + '='); if (i < 0) return ''; const rest = tag.slice(i + name.length + 1).trim(); if (!/^["']/.test(rest)) return rest.split(/[\s>]/)[0] || ''; const q = rest[0]; const end = rest.indexOf(q, 1); return end < 0 ? '' : rest.slice(1, end); };
function getMeta(c, prop) { let v = ''; for (const m of c.matchAll(/<meta[^>]*>/gi)) { const t = m[0]; const p = (attr(t, 'property') || attr(t, 'name')).toLowerCase(); if (p === prop.toLowerCase()) { const c2 = attr(t, 'content'); if (c2) v = c2; } } return v; }
const urlToRel = (u) => { let p = u.replace(DOMAIN, '').split(/[?#]/)[0]; if (!p || p === '/') return 'index.html'; if (p.endsWith('/')) return p.slice(1) + 'index.html'; return p.slice(1) + '.html'; };
function bodyText(c) {
  let b = c.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  // drop template zones so we compare real content
  b = b.replace(/<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<footer[\s\S]*?<\/footer>/gi, ' ').replace(/<header[\s\S]*?<\/header>/gi, ' ');
  const main = b.match(/<(?:article|main)[\s>][\s\S]*?<\/(?:article|main)>/i);
  if (main) b = main[0];
  const t = b.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/[\u2018\u2019\u201c\u201d]/g, "'").replace(/\s+/g, ' ').trim();
  return t;
}
const STOP = new Set('a an and are as at be but by for from has have if in into is it its of on or that the their there they this to was were will with you your we our us'.split(' '));
function shingles(text, n = 3) {
  const words = text.toLowerCase().split(' ').filter((w) => w && w.length > 2 && !STOP.has(w)).slice(0, 800);
  const s = new Set();
  for (let i = 0; i + n <= words.length; i++) s.add(words.slice(i, i + n).join(' '));
  return s;
}
function jaccard(a, b) { if (!a.size || !b.size) return 0; let c = 0; for (const x of a) if (b.has(x)) c++; return c / (a.size + b.size - c); }

// =====================================================================
log('================================================================');
log('GOOGLEBOT SIMULATED CRAWL - local pre-deploy snapshot');
log('date: ' + new Date().toISOString().slice(0, 10));
log('html files on disk: ' + all.length + ' | sitemap URLs: ' + sitemapUrls.length);
log('================================================================');

// [1] FILE INVENTORY vs SITEMAP
log('\n===== [1] FILE INVENTORY vs SITEMAP =====');
const sitemapRels = new Set(sitemapUrls.map(urlToRel));
const diskFiles = all.map(rel).filter((r) => r !== 'article-template.html');
const notInSm = diskFiles.filter((r) => !sitemapRels.has(r));
log('disk pages not listed in sitemap: ' + (notInSm.length ? notInSm.join(', ') : 'none'));
for (const u of sitemapUrls) if (!fileOf.has(urlToRel(u))) E('sitemap loc has no file: ' + u);

// [2] DISCOVERY BFS from home (Google finds pages through links)
log('\n===== [2] LINK DISCOVERY (BFS from home) =====');
const homeRel = 'index.html';
const cache = new Map();
function parseLinks(r) {
  if (cache.has(r)) return cache.get(r);
  const c = fs.readFileSync(fileOf.get(r), 'utf8');
  const links = [];
  for (const m of c.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    let h = m[1].split(/[?#]/)[0];
    if (h.startsWith(DOMAIN)) h = h.replace(DOMAIN, '');
    if (h.startsWith('/')) h = h.slice(1);
    if (!h || h.startsWith('http') || h.startsWith('mailto:') || h.startsWith('tel:') || h.startsWith('#') || h === 'javascript:void(0)') continue;
    if (!h.endsWith('.html')) { if (h.endsWith('/')) h += 'index.html'; else h += '.html'; }
    links.push(h);
  }
  cache.set(r, links); return links;
}
const reachable = new Set(); const queue = [homeRel];
while (queue.length) { const r = queue.shift(); if (reachable.has(r) || !fileOf.has(r)) continue; reachable.add(r); for (const l of parseLinks(r)) if (!reachable.has(l)) queue.push(l); }
const pages = new Set([...sitemapRels, ...diskFiles]);
const notReachable = [...pages].filter((r) => r !== homeRel && r !== '404.html' && !reachable.has(r) && fileOf.has(r));
if (notReachable.length) notReachable.forEach((r) => W('not reachable from home link graph (only in sitemap or file): ' + r));
else I('every page is reachable from home through links');
log('home outbound page links: ' + parseLinks(homeRel).length);

// [3] PER-PAGE INDEX DECISION
log('\n===== [3] PER-PAGE INDEX DECISION =====');
const textCache = new Map();
function getPage(r) {
  if (!fileOf.has(r)) return null;
  const c = fs.readFileSync(fileOf.get(r), 'utf8');
  const bt = textCache.get(r) || (() => { const t = bodyText(c); textCache.set(r, t); return t; })();
  return {
    r, c,
    title: (c.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '',
    desc: getMeta(c, 'description'), robots: getMeta(c, 'robots'), canon: (c.match(/<link rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1] || '',
    h1s: [...c.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()),
    ld: (() => { const a = []; for (const m of c.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) { try { a.push(JSON.parse(m[1])); } catch { a.push(null); } } return a; })(),
    words: bt.split(' ').filter(Boolean).length,
    text: bt,
    viewport: /name=["']viewport["']/i.test(c),
    lang: (c.match(/<html[^>]*lang=["']([^"']+)["']/i) || [])[1] || '',
    ogImage: getMeta(c, 'og:image'),
  };
}
const pagesSorted = diskFiles.slice().sort();
const pageData = pagesSorted.map(getPage);
// near-dup pairs
const shingleCache = new Map();
const shOf = (t) => { if (!shingleCache.has(t)) shingleCache.set(t, shingles(t)); return shingleCache.get(t); };
const dupPairs = [];
for (let i = 0; i < pageData.length; i++) for (let j = i + 1; j < pageData.length; j++) {
  const a = pageData[i], b = pageData[j];
  if (!a || !b || a.words < 30 || b.words < 30) continue;
  const jc = jaccard(shOf(a.text), shOf(b.text));
  if (jc >= 0.38) dupPairs.push({ a: a.r, b: b.r, sim: jc.toFixed(2) });
}
const dec = {};
for (const p of pageData) {
  if (!p) continue;
  const r = p.r;
  const issues = [];
  const noidx = /noindex/i.test(p.robots);
  const isPlaceholder = /==========/.test(p.title + p.desc);
  if (noidx || isPlaceholder || r === 'article-template.html') { dec[r] = 'NOT_IDX'; continue; }
  if (p.words < 120) { dec[r] = 'THIN'; continue; }
  if (dupPairs.some((d) => d.a === r || d.b === r)) { dec[r] = 'DUP'; continue; }
  if (p.canon && !urlToRel(p.canon).includes(r.replace(/^\.\//, '')) && p.canon !== DOMAIN + '/' + r) { dec[r] = 'FIX'; issues.push('canonical -> ' + p.canon); continue; }
  if (!p.title) { dec[r] = 'FIX'; issues.push('no title'); continue; }
  if (!p.desc) { dec[r] = 'FIX'; issues.push('no meta description'); continue; }
  if (p.h1s.length !== 1) { dec[r] = 'FIX'; issues.push('H1 count = ' + p.h1s.length); continue; }
  dec[r] = 'INDEX';
}
// order decisions
const order = { INDEX: [], FIX: [], DUP: [], THIN: [], NOT_IDX: [] };
for (const [r, d] of Object.entries(dec)) order[d] ? order[d].push(r) : (order.FIX = order.FIX || [], order.FIX.push(r));
for (const cat of ['INDEX', 'FIX', 'DUP', 'THIN', 'NOT_IDX']) {
  if (!order[cat]) continue;
  log('\n-- ' + cat + ' (' + order[cat].length + ')');
  order[cat].forEach((r) => {
    const p = getPage(r);
    if (cat === 'INDEX') { log('  + ' + r); return; }
    if (cat === 'FIX') {
      const why = [];
      if (/noindex/i.test(p.robots)) why.push('noindex');
      if (!p.title) why.push('no <title>');
      if (p.title && p.title.length > 60) why.push('title ' + p.title.length + 'c');
      if (!p.desc) why.push('no description');
      if (p.desc && p.desc.length < 70) why.push('desc thin ' + p.desc.length + 'c');
      if (p.h1s.length !== 1) why.push('H1 x' + p.h1s.length + (p.h1s[0] ? '="' + p.h1s[0].slice(0, 40) + '"' : ''));
      if (p.canon && urlToRel(p.canon) !== p.r) why.push('canon ' + p.canon);
      if (p.words < 120) why.push('thin');
      log('  ! ' + r + '  [' + why.join('; ') + ']');
      return;
    }
    log('  ? ' + r);
  });
}
if (dupPairs.length) { log('\n-- near-duplicate pairs (3-gram word-shingle Jaccard >= 0.38)'); dupPairs.forEach((d) => log('     ' + d.sim + '  ' + d.a + '  <->  ' + d.b)); }

// [4] TITLE DUPLICATION
log('\n===== [4] TITLE UNIQUENESS =====');
const tmap = new Map();
for (const p of pageData) { if (!p || !p.title) continue; const k = p.title.toLowerCase(); if (tmap.has(k)) log('  [WARN ] duplicate title: "' + p.title + '"  -> ' + tmap.get(k) + ' & ' + p.r); else tmap.set(k, p.r); }
I('checked ' + tmap.size + ' distinct titles');

// [5] JSON-LD VALIDITY (rich results)
log('\n===== [5] JSON-LD VALIDITY =====');
const ldNodes = (ld) => { const a = []; const wk = (n) => { if (Array.isArray(n)) { n.forEach(wk); return; } if (n && typeof n === 'object') { a.push(n); if (n['@graph']) wk(n['@graph']); } }; wk(ld); return a; };
let ldBlocks = 0, ldBad = 0;
const types = {};
const pageNodes = new Map();
for (const p of pageData) {
  if (!p) continue;
  const nodes = [];
  for (const ld of p.ld) {
    if (!ld) { ldBad++; log('  [ERROR] ' + p.r + ': JSON-LD parse failed'); continue; }
    ldBlocks++;
    nodes.push(...ldNodes(ld));
    if (!ld['@context'] || !/schema\.org/.test(String(ld['@context']))) { ldBad++; log('  [ERROR] ' + p.r + ': missing @context schema.org'); }
  }
  pageNodes.set(p.r, nodes);
  const seen = new Set();
  for (const n of nodes) { const ts = (Array.isArray(n['@type']) ? n['@type'].join(',') : String(n['@type'] || '?')); if (!seen.has(ts)) { seen.add(ts); types[ts] = (types[ts] || 0) + 1; } }
  for (const a of nodes.filter((n) => ['Article', 'BlogPosting'].includes(String(n['@type'])))) for (const f of ['datePublished', 'headline']) if (!a[f]) { ldBad++; log('  [WARN ] ' + p.r + ': Article missing ' + f); }
  for (const o of nodes.filter((n) => String(n['@type']).includes('Organization'))) for (const f of ['name', 'url', 'logo']) if (!o[f]) { ldBad++; log('  [WARN ] Organization missing ' + f); }
}
log('ld+json blocks: ' + ldBlocks + ' | types: ' + JSON.stringify(types) + ' | issues: ' + ldBad);
const noLd = pageData.filter((p) => p && !p.ld.length && dec[p.r] === 'INDEX');
if (noLd.length) W('indexable pages without JSON-LD: ' + noLd.map((p) => p.r).join(' '));
else I('every indexable page has structured data');

// [6] E-E-A-T & trust signals
log('\n===== [6] E-E-A-T / TRUST SIGNALS =====');
const home = getPage('index.html');
const homeOrg = (pageNodes.get('index.html') || []).some((n) => String(n['@type']).includes('Organization'));
log('home Organization JSON-LD: ' + (homeOrg ? 'yes' : 'NO'));
const homeHrefs = cache.get('index.html') || [];
for (const target of ['about', 'contact', 'privacy', 'terms']) {
  const hit = homeHrefs.find((h) => h.includes(target));
  I(hit ? 'home links to /' + target : (target === 'terms' ? I('no terms/privacy link (B2B; optional)') : W('home has NO link to "' + target + '"')));
}
const articlePages = pageData.filter((p) => p && /inspection-cases|industry-updates/.test(p.r) && !/\/index\.html$|^index\.html$/.test(p.r) && dec[p.r] !== 'NOT_IDX');
let dated = 0, authored = 0;
for (const p of articlePages) {
  const art = (pageNodes.get(p.r) || []).find((n) => ['Article', 'BlogPosting'].includes(String(n['@type'])));
  if (art && art.datePublished) dated++; else log('  [WARN ] no datePublished on ' + p.r + (art ? '' : ' (no Article schema)'));
  if (art && art.author) authored++; else log('  [WARN ] no author on ' + p.r + (art ? '' : ' (no Article schema)'));
}
log('article-type pages: ' + articlePages.length + ' | with datePublished: ' + dated + ' | with author: ' + authored);

// [7] IMAGE INDEX SIGNALS
log('\n===== [7] IMAGE INDEX =====');
const imStats = { total: 0, alt: 0, noAlt: 0, goodName: 0, badName: 0 };
for (const p of pageData) {
  if (!p) continue;
  for (const m of p.c.matchAll(/<img[^>]*>/gi)) {
    const t = m[0]; imStats.total++;
    const alt = attr(t, 'alt'); if (alt !== undefined && alt !== '') imStats.alt++; else imStats.noAlt++;
    const src = attr(t, 'src') || ''; const fn = src.split('/').pop().toLowerCase();
    const clean = fn.replace(/^[\d_]+/, '').replace(/[-_\d]+(?=\.[a-z0-9]+$)/, '');
    if (fn && (clean.length > 5 || !/^\d+\./.test(fn))) imStats.goodName++; else imStats.badName++;
  }
}
log('imgs ' + imStats.total + ' | alt present ' + imStats.alt + ' | no-alt ' + imStats.noAlt + ' | descriptive-name ' + imStats.goodName + ' | numeric-name ' + imStats.badName);
const ogNo = pageData.filter((p) => p && dec[p.r] === 'INDEX' && !p.ogImage);
if (ogNo.length) W('indexable pages missing og:image: ' + ogNo.map((p) => p.r).join(' '));
else I('all indexable pages have og:image');

// [8] MOBILE / VIEWPORT
log('\n===== [8] MOBILE VIEWPORT =====');
const noVp = pageData.filter((p) => p && !p.viewport && dec[p.r] !== 'NOT_IDX');
if (noVp.length) noVp.forEach((p) => W('no viewport: ' + p.r)); else I('all indexable pages have viewport');
const nonEn = pageData.filter((p) => p && p.lang !== 'en');
if (nonEn.length) nonEn.forEach((p) => W('html lang="' + p.lang + '": ' + p.r)); else I('all pages html lang="en"');

// ---- summary ----
log('\n================================================================');
const cnt = { ERROR: 0, WARN: 0, ok: 0 };
for (const l of out) { if (l.includes('[ERROR]')) cnt.ERROR++; else if (l.includes('[WARN ]')) cnt.WARN++; else if (l.includes('[ok')) cnt.ok++; }
log('SUMMARY  errors=' + cnt.ERROR + ' warnings=' + cnt.WARN + ' ok=' + cnt.ok);
const report = out.join('\n');
console.log(report);
fs.writeFileSync(path.join(__dirname, 'googlebot-sim-report.txt'), report, 'utf8');
console.log('\nsaved -> scripts/googlebot-sim-report.txt');
