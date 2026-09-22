#!/usr/bin/env node
/**
 * sitemap.xml image filter + lastmod timezone normalization.
 *
 * Two changes applied in-place:
 *   1. Remove generic-named <image:image> entries to focus crawl slots on
 *      content-bearing images (defect photos, product closeups, factory
 *      floor with descriptive filenames). Logo / banner / cover / process /
 *      news-N / frontline / purely-numeric filenames are removed.
 *   2. Normalize <lastmod> from bare date "YYYY-MM-DD" to ISO-8601 datetime
 *      "YYYY-MM-DDTHH:MM:SS+08:00" so Google has no ambiguity about
 *      timezone. Existing full-datetime values (if any) are left alone.
 *
 * Date is preserved (no fabrication) -- we only append a midnight-Beijing
 * timestamp. Per Google's lastmod guidance, this only matters for the page
 * not the sitemap file, and pages were not modified today (only sitemap.xml
 * is).
 *
 * Usage:
 *   node scripts/filter-sitemap-images.js          # apply + report
 *   node scripts/filter-sitemap-images.js --dry    # report only, no write
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SITEMAP = path.join(__dirname, '..', 'sitemap.xml');
const TZ_OFFSET = '+08:00'; // China Standard Time (Beijing)

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry');

// ---------- Filter rules ----------

/**
 * Filename patterns that indicate a decorative / generic / non-descriptive
 * image. These are NOT useful in Google Image search because their filename
 * tells nothing searchable, and they dilute the crawl budget allocated to
 * meaningful content images (defect photos, product closeups, factory scenes
 * with descriptive names).
 */
function shouldRemoveImage(imageUrl) {
  const filename = imageUrl.split('/').pop().toLowerCase();

  // Purely numeric: 1.jpg, 23.png, 100.webp
  if (/^\d+\.(jpg|png|webp)$/.test(filename)) return 'numeric';

  // News placeholder: news-1.jpg, news-2.jpg ...
  if (/^news-\d+\.(jpg|png|webp)$/.test(filename)) return 'news';

  // Generic categories (surrounded by start/-/_/. so we don't false-positive
  // words like "processing" or "procession"):
  //   logo / banner / cnqbanner / cover / icon / process / frontline
  if (/(^|[._-])(logo|banner|cnqbanner|cover|icon|process|frontline)([._-]|$)/.test(filename)) {
    return 'generic-category';
  }

  return null;
}

/**
 * Normalize <lastmod> value. Bare dates get a midnight-Beijing timestamp
 * appended. Existing ISO 8601 datetimes are preserved as-is.
 */
function formatLastmod(value) {
  const trimmed = value.trim();
  if (/T\d{2}:\d{2}:\d{2}/.test(trimmed)) return trimmed; // already has time
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00${TZ_OFFSET}`;
  }
  return trimmed; // unknown format -- leave it
}

// ---------- Main ----------

function main() {
  const original = fs.readFileSync(SITEMAP, 'utf8');

  // Pre-stats
  const statsBefore = {
    urls: (original.match(/<url>/g) || []).length,
    images: (original.match(/<image:image>/g) || []).length,
    lastmod: (original.match(/<lastmod>/g) || []).length,
  };

  // Track changes
  let lastmodsUpdated = 0;
  const removed = []; // [{ url, loc, reason }]
  const kept = []; // [loc]
  const lastmodChanges = []; // [{ before, after }]

  // 1. Normalize lastmod
  let xml = original.replace(/<lastmod>([^<]+)<\/lastmod>/g, (m, val) => {
    const after = formatLastmod(val);
    if (after !== val) {
      lastmodsUpdated++;
      lastmodChanges.push({ before: val, after });
    }
    return `<lastmod>${after}</lastmod>`;
  });

  // 2. Filter image:image entries (include leading whitespace + trailing
  //    newline in the match so removal leaves no empty lines behind).
  xml = xml.replace(
    /[ \t]*<image:image><image:loc>([^<]+)<\/image:loc><\/image:image>\n?/g,
    (m, loc) => {
      const reason = shouldRemoveImage(loc);
      if (reason) {
        removed.push({ loc, reason });
        return '';
      }
      kept.push(loc);
      return m;
    }
  );

  // 3. Light cleanup: collapse 3+ blank lines (defensive -- should be no-op
  //    now that the image regex eats its own indentation).
  xml = xml.replace(/\n{3,}/g, '\n\n');

  const statsAfter = {
    urls: (xml.match(/<url>/g) || []).length,
    images: (xml.match(/<image:image>/g) || []).length,
    lastmod: (xml.match(/<lastmod>/g) || []).length,
  };

  // ---------- Report ----------

  console.log('================================================');
  console.log(' Sitemap Cleanup Report');
  console.log('================================================');
  console.log('File:', path.relative(process.cwd(), SITEMAP));
  console.log(`URLs:        ${statsBefore.urls} -> ${statsAfter.urls}`);
  console.log(`Images:      ${statsBefore.images} -> ${statsAfter.images} (removed ${removed.length})`);
  console.log(`Lastmods:    ${statsBefore.lastmod} -> ${statsAfter.lastmod} (normalized ${lastmodsUpdated})`);
  console.log('');

  // Per-URL breakdown
  console.log('--- Per-URL image count change ---');
  const originalUrls = original.match(/<url>[\s\S]*?<\/url>/g) || [];
  const newUrls = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  const breakdown = [];
  for (let i = 0; i < originalUrls.length; i++) {
    const locMatch = originalUrls[i].match(/<loc>([^<]+)<\/loc>/);
    if (!locMatch) continue;
    const url = locMatch[1];
    const beforeN = (originalUrls[i].match(/<image:image>/g) || []).length;
    const afterN = (newUrls[i] || '').match(/<image:image>/g)
      ? (newUrls[i].match(/<image:image>/g) || []).length
      : 0;
    breakdown.push({ url: url.replace('https://www.chinaqualityservice.com', ''), before: beforeN, after: afterN });
  }
  breakdown.sort((a, b) => b.before - a.before);
  console.log('URL'.padEnd(60), 'before'.padStart(7), 'after'.padStart(6));
  console.log('-'.repeat(75));
  for (const r of breakdown) {
    console.log(r.url.padEnd(60), String(r.before).padStart(7), String(r.after).padStart(6));
  }
  console.log('');

  // Removed reasons breakdown
  const reasonCounts = {};
  for (const r of removed) {
    reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
  }
  console.log('--- Removed images by category ---');
  for (const [reason, count] of Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason.padEnd(20)} ${count}`);
  }
  console.log('');

  // Lastmod changes sample
  console.log('--- Lastmod sample (first 5 changes) ---');
  for (const c of lastmodChanges.slice(0, 5)) {
    console.log(`  ${c.before} -> ${c.after}`);
  }
  if (lastmodChanges.length > 5) console.log(`  ... and ${lastmodChanges.length - 5} more`);
  console.log('');

  if (DRY_RUN) {
    console.log('[DRY RUN] No file written.');
    return;
  }

  fs.writeFileSync(SITEMAP, xml, 'utf8');
  console.log('[OK] Wrote', path.relative(process.cwd(), SITEMAP));
  console.log('  bytes before:', Buffer.byteLength(original, 'utf8'));
  console.log('  bytes after: ', Buffer.byteLength(xml, 'utf8'));
}

main();