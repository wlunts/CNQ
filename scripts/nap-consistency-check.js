#!/usr/bin/env node
/**
 * NAP (Name / Address / Phone) consistency check across the whole site.
 * Plays Google's Local/Trust validator:
 *  A) Structured (JSON-LD Organization) NAP must match the baseline on every page.
 *  B) Visible phones on CNQ's OWN pages (about/contact/legal/... ) must match.
 *  C) Pages in factory-resource/ & inspection-cases/ legitimately show THIRD-PARTY
 *     factory contacts -- those raw numbers are NOT CNQ NAP and are reported as info.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const THIRD_PARTY_DIRS = ['factory-resource/', 'inspection-cases/'];
const BASELINE = {
  name: 'China Quality Service',
  alt: ['CNQ', 'China Quality Service Co., Ltd.'],
  phone: '+86 131 2892 5565',
  email: 'contact@cn-q.com',
  street: 'Building A1, Floor 1, Xuexiang Garden, Zhonghao 2nd Road, Bantian Street',
  locality: 'Shenzhen',
  region: 'Guangdong',
  postal: '518129',
};

const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) files.push(p); } })(ROOT);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const html = files.map((p) => rel(p)).sort();

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const normPhone = (s) => norm(s).replace(/[^\d]/g, '');
const BASE_PHONE = normPhone(BASELINE.phone);
const isThirdParty = (f) => THIRD_PARTY_DIRS.some((d) => f.startsWith(d));
const isOwnPage = (f) => !isThirdParty(f) && f !== '404.html';

// A) structured NAP variants
const phoneV = new Map(), nameV = new Map(), altMissing = [], streetV = new Map(), locV = new Map(), postalV = new Map();
// B) visible own-page phone variants + third-party numbers (info)
const ownPhoneV = new Map(), thirdPhone = new Map();
const missingPhoneOwn = [];
const leaks = [];
const collect = (m, k, f) => { k = norm(k); if (!k) return; if (!m.has(k)) m.set(k, []); m.get(k).push(f); };

for (const f of html) {
  const c = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of c.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let ld; try { ld = JSON.parse(m[1]); } catch { continue; }
    const nodes = [];
    (function wk(n) { if (Array.isArray(n)) return n.forEach(wk); if (n && typeof n === 'object') { nodes.push(n); if (n['@graph']) wk(n['@graph']); } })(ld);
    for (const o of nodes) {
      if (!String(o['@type']).includes('Organization')) continue;
      if (o.name) collect(nameV, o.name, f);
      if (o.alternateName === undefined) altMissing.push(f);
      const cp = Array.isArray(o.contactPoint) ? o.contactPoint : [];
      for (const p of cp) if (p && p.telephone) collect(phoneV, normPhone(p.telephone), f);
      if (o.address && o.address['@type'] === 'PostalAddress') {
        if (o.address.streetAddress) collect(streetV, o.address.streetAddress, f);
        if (o.address.addressLocality) collect(locV, o.address.addressLocality, f);
        if (o.address.postalCode) collect(postalV, o.address.postalCode, f);
      }
    }
  }
  // visible body numbers
  const body = c.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const hasOwnVisible = [];
  for (const m of body.replace(/<[^>]+>/g, ' ').matchAll(/\+?86[\s\-()]*\d[\s\-()\d]{8,}/g)) {
    const d = m[0].replace(/[^\d]/g, '');
    if (d.length < 11) continue;
    if (isThirdParty(f)) collect(thirdPhone, d, f);
    else { collect(ownPhoneV, d, f); hasOwnVisible.push(d); }
  }
  if (isOwnPage(f) && !hasOwnVisible.length) missingPhoneOwn.push(f);
  // old-address residue in body text
  const txt = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const m of txt.matchAll(/(.{50,80}?(?:Shanghai|上海)[^。;]{0,60})/g)) leaks.push({ page: f, ctx: m[0].replace(/\s+/g, ' ').trim() });
}

const out = [];
const L = (s) => out.push(s);
L('================================================================');
L('NAP CONSISTENCY CHECK - local pre-deploy snapshot');
L('date: ' + new Date().toISOString().slice(0, 10));
L('html files: ' + html.length + ' | own pages: ' + html.filter(isOwnPage).length + ' | third-party content pages: ' + html.filter(isThirdParty).length);
L('baseline: phone ' + BASELINE.phone + ' | ' + BASELINE.name + ' | ' + BASELINE.street + ', ' + BASELINE.locality + ' ' + BASELINE.postal);
L('================================================================');

const diverge = (map, base, label, fmt, onlyFirst) => {
  const bad = [];
  for (const [k, pages] of map) {
    const isBase = fmt(k) === fmt(base) || (onlyFirst ? pages.length === 1 : false);
    if (!isBase) bad.push([k, pages]);
  }
  L('\n-- ' + label + ' --');
  if (!bad.length) L('  [ok    ] uniform across all pages');
  else bad.forEach(([k, pages]) => L('  [WARN ] "' + k + '" on ' + pages.length + ' page(s): ' + pages.join(', ')));
};
diverge(nameV, BASELINE.name, 'STRUCTURED NAME (Organization.name)', norm);
diverge(phoneV, BASE_PHONE, 'STRUCTURED TELEPHONE (contactPoint)', normPhone);
diverge(streetV, BASELINE.street, 'STRUCTURED STREET ADDRESS', norm);
diverge(locV, BASELINE.locality, 'STRUCTURED LOCALITY', norm);
diverge(postalV, BASELINE.postal, 'STRUCTURED POSTAL CODE', norm);

if (altMissing.length) L('\n  [WARN ] Organization missing alternateName: ' + altMissing.join(', '));
else L('\n-- ALTERNATE NAME --\n  [ok    ] every Organization has alternateName ' + JSON.stringify(BASELINE.alt));

L('\n-- VISIBLE PHONE (own pages: about/contact/legal/services/...) --');
if (!ownPhoneV.size) L('  [WARN ] no visible phone found on own pages');
else {
  const ok = [], bad = [];
  for (const [k, pages] of ownPhoneV) (k === BASE_PHONE ? ok : bad).push([k, pages]);
  for (const [k, pages] of bad) L('  [WARN ] own page shows phone "' + k + '" != baseline: ' + pages.join(', '));
  if (ok.length) L('  [ok    ] ' + ok.reduce((s, x) => s + x[1].length, 0) + ' own-page hit(s) match baseline');
  if (!bad.length && ok.length) L('  [ok    ] no stray phone on own pages');
}

if (thirdPhone.size) {
  L('\n-- THIRD-PARTY PHONES (factory contacts on factory-resource/ & inspection-cases/, NOT CNQ NAP) --');
  for (const [k, pages] of thirdPhone) L('  [info  ] "' + k + '" appears on: ' + pages.join(', '));
}

L('\n-- PAGES WITH NO VISIBLE CNQ PHONE (enhancement note) --');
if (!missingPhoneOwn.length) L('  [ok    ] every own page shows the CNQ phone');
else L('  [info  ] ' + missingPhoneOwn.length + ' own page(s) show email/WhatsApp but no CNQ phone in body/footer: ' + missingPhoneOwn.join(', '));
L('          (Google Local SEO tip: sitewide footer NAP helps, but absence is not a ranking error)');

L('\n-- OLD-ADDRESS RESIDUE (Shanghai / 上海 in body text) --');
if (!leaks.length) L('  [ok    ] no Shanghai/上海 residue');
else leaks.forEach((l) => L('  [info  ] ' + l.page + ' :: ...' + l.ctx + '...'));

let w = 0;
for (const l of out) if (l.includes('[WARN ]')) w++;
L('\nSUMMARY  warnings=' + w);
const report = out.join('\n');
console.log(report);
fs.writeFileSync(path.join(__dirname, 'nap-consistency-report.txt'), report, 'utf8');
console.log('\nsaved -> scripts/nap-consistency-report.txt');
