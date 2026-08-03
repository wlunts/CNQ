# CNQ SEO Validation Script
# Run this after creating new articles or before deploying
# Usage: powershell -File scripts/validate-seo.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Issues = 0

Write-Host "`n=== CNQ SEO Validation ===" -ForegroundColor Cyan

function Check-Pattern($pattern, $description, $severity = "ERROR") {
    $files = Get-ChildItem -Path $Root -Recurse -Filter "*.html" | ForEach-Object {
        $c = Get-Content $_.FullName -Raw
        if ($c -match $pattern) { $_ }
    }
    if ($files.Count -gt 0) {
        $color = if ($severity -eq "ERROR") { "Red" } else { "Yellow" }
        Write-Host "  [$severity] $description — found in $($files.Count) file(s):" -ForegroundColor $color
        foreach ($f in $files) { Write-Host "    - $($f.FullName.Substring($Root.Length + 1))" -ForegroundColor $color }
        if ($severity -eq "ERROR") { $script:Issues += $files.Count }
    } else {
        Write-Host "  [OK] $description" -ForegroundColor Green
    }
}

# 1. Footer anchors — must have #inspection, #audit, #lab, #supplier
Check-Pattern 'href="services"\s+data-zh="产品检验"' 'Footer missing #inspection anchor'
Check-Pattern 'href="services"\s+data-zh="工厂审核"'   'Footer missing #audit anchor'
Check-Pattern 'href="services"\s+data-zh="实验室测试"'  'Footer missing #lab anchor'
Check-Pattern 'href="services"\s+data-zh="供应商管理"'  'Footer missing #supplier anchor'

# 2. Bad slash format: /page/#anchor → should be /page#anchor
Check-Pattern '/services/#[a-z]' 'Bad format /services/# (should be /services#)'
Check-Pattern 'href="/\w[a-zA-Z0-9\-\/]+/#[a-z]' 'Bad format /page/#anchor (extra slash before #)'

# 3. Dead link: services#factory
Check-Pattern 'services#factory' 'Dead link: services#factory (should be #audit)'

# 4. Relative paths in article links
Check-Pattern 'href="inspection-cases/' 'Relative path: inspection-cases/ (use /inspection-cases/)'
Check-Pattern 'href="factory-resource/'  'Relative path: factory-resource/ (use /factory-resource/)'
Check-Pattern 'href="industry-updates/' 'Relative path: industry-updates/ (use /industry-updates/)'

# 5. Sitemap sanity check
Write-Host "`n  [CHECK] Sitemap vs actual files:" -ForegroundColor Cyan
$sitemap = [xml](Get-Content "$Root\sitemap.xml" -Raw)
$sitemapMap = @{}  # normalized -> { orig, lastmod }
foreach ($url in $sitemap.urlset.url) {
    $orig = $url.loc -replace 'https://www\.cn-q\.com/', ''
    if ($orig -eq '') { $orig = '/' }
    $norm = $orig.TrimEnd('/')
    if ($norm -eq '') { $norm = '/' }
    $sitemapMap[$norm] = @{ Orig = $orig; LastMod = $url.lastmod }
}

$diskPaths = Get-ChildItem -Path $Root -Recurse -Filter "*.html" | ForEach-Object {
    $rel = $_.FullName.Substring($Root.Length + 1) -replace '\\', '/'
    $rel = $rel -replace '\.html$', ''
    if ($rel -eq 'index') { $rel = '/' }
    elseif ($rel -match '^(.*)/index$') { $rel = $Matches[1] }
    $rel
}

$missingFromSitemap = @()
$missingFromDisk = @()

foreach ($d in $diskPaths) {
    if ($d -like "article-template*" -or $d -like "scripts/*") { continue }
    if (-not $sitemapMap.ContainsKey($d)) { $missingFromSitemap += $d }
}
foreach ($s in $sitemapMap.Keys) {
    $orig = $sitemapMap[$s].Orig
    if ($orig.EndsWith('/') -or $orig -eq '/') {
        $testPath = if ($s -eq '/') { Join-Path $Root 'index.html' }
                    else { Join-Path $Root ($s + '/index.html') }
    } else {
        $testPath = Join-Path $Root ($s + '.html')
    }
    if (-not (Test-Path $testPath)) { $missingFromDisk += $orig }
}

if ($missingFromSitemap.Count -gt 0) {
    Write-Host "  [ERROR] Missing from sitemap:" -ForegroundColor Red
    foreach ($m in $missingFromSitemap) { Write-Host "    - $m" -ForegroundColor Red }
    $script:Issues += $missingFromSitemap.Count
}
if ($missingFromDisk.Count -gt 0) {
    Write-Host "  [ERROR] In sitemap but file missing:" -ForegroundColor Red
    foreach ($m in $missingFromDisk) { Write-Host "    - $m" -ForegroundColor Red }
    $script:Issues += $missingFromDisk.Count
}
if ($missingFromSitemap.Count -eq 0 -and $missingFromDisk.Count -eq 0) {
    Write-Host "  [OK] Sitemap in sync with disk" -ForegroundColor Green
}

# Summary
Write-Host "`n=== " -NoNewline
if ($Issues -eq 0) {
    Write-Host "ALL CLEAN — 0 issues found" -ForegroundColor Green
    exit 0
} else {
    Write-Host "$Issues issue(s) found — fix before deploying" -ForegroundColor Red
    exit 1
}
