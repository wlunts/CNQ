# CNQ SEO Validation Script
# Run this after creating new articles or before deploying
# Usage: powershell -File scripts/validate-seo.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Issues = 0

Write-Host "`n=== CNQ SEO Validation ===" -ForegroundColor Cyan

function Check-Pattern($pattern, $description, $severity = "ERROR") {
    $files = Get-ChildItem -Path $Root -Recurse -Filter "*.html" | ForEach-Object {
        $c = Get-Content $_.FullName -Raw -Encoding UTF8
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
$sitemap = [xml](Get-Content "$Root\sitemap.xml" -Raw -Encoding UTF8)
$sitemapMap = @{}  # normalized -> { orig, lastmod }
foreach ($url in $sitemap.urlset.url) {
    $orig = $url.loc -replace 'https://www\.chinaqualityservice\.com/', ''
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
    if ($d -like "article-template*" -or $d -like "scripts/*" -or $d -eq '404') { continue }
    if (-not $sitemapMap.ContainsKey($d)) { $missingFromSitemap += $d }
}
foreach ($s in $sitemapMap.Keys) {
    $orig = $sitemapMap[$s].Orig
    if ($orig.EndsWith('/') -or $orig -eq '/') {
        $testPath = if ($s -eq '/') { Join-Path $Root 'index.html' }
                    else { Join-Path $Root ($s + '/index.html') }
    } elseif ($s -match '\.[a-zA-Z0-9]+$') {
        # Non-HTML file (PDF, XLSX, DOCX, etc.) — test the literal path
        $testPath = Join-Path $Root $s
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

# 6. JSON-LD structured data checks
Write-Host "`n  [CHECK] JSON-LD structured data:" -ForegroundColor Cyan
$jsonLdIssues = 0

$htmlFiles = Get-ChildItem -Path $Root -Recurse -Filter "*.html" | Where-Object {
    $_.FullName -notmatch 'article-template'
}

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content -notmatch 'application/ld\+json') { continue }

    $rel = $file.FullName.Substring($Root.Length + 1)

    # 6a. JSON-LD blocks must live inside <head>
    $bodyContent = if ($content -match '(?s)</head>(.*)$') { $Matches[1] } else { '' }
    $blocksInBody = [regex]::Matches($bodyContent, 'application/ld\+json').Count
    if ($blocksInBody -gt 0) {
        Write-Host "  [ERROR] $rel — $blocksInBody JSON-LD block(s) outside <head>" -ForegroundColor Red
        $jsonLdIssues++
    }

    # canonical drives the expected page URL (respects trailing-slash rule per page)
    $canonical = ''
    $cm = [regex]::Match($content, '<link rel="canonical" href="([^"]+)"')
    if ($cm.Success) { $canonical = $cm.Groups[1].Value }

    # 6b. every JSON-LD block must parse
    $blocks = [regex]::Matches($content, '<script type="application/ld\+json">(.*?)</script>', 'Singleline')
    if ($blocks.Count -eq 0) { continue }

    foreach ($block in $blocks) {
        $jsonText = $block.Groups[1].Value
        try {
            $data = $jsonText | ConvertFrom-Json -ErrorAction Stop
        } catch {
            Write-Host "  [ERROR] $rel — invalid JSON-LD: $($_.Exception.Message)" -ForegroundColor Red
            $jsonLdIssues++
            continue
        }

        if ($null -ne $data.'@graph') {
            $nodes = @($data.'@graph')
        } else {
            $nodes = @($data)
        }

        foreach ($node in $nodes) {
            $nodeType = $node.'@type'
            if (-not $nodeType) { continue }

            # 6c. FAQPage (conditional): must have @id (= page URL + '#faq') and isPartOf = #website
            if ($nodeType -eq 'FAQPage') {
                if ($canonical -eq '') {
                    Write-Host "  [WARN] $rel — FAQPage found but no canonical; skipped" -ForegroundColor Yellow
                    continue
                }
                $faqId = $node.'@id'
                $faqParent = $node.isPartOf.'@id'
                if (-not $faqId) {
                    Write-Host "  [ERROR] $rel — FAQPage missing @id" -ForegroundColor Red
                    $jsonLdIssues++
                } elseif ($faqId -ne ($canonical + '#faq')) {
                    Write-Host "  [ERROR] $rel — FAQPage @id=$faqId (expect $($canonical + '#faq'))" -ForegroundColor Red
                    $jsonLdIssues++
                }
                if ($faqParent -ne 'https://www.chinaqualityservice.com/#website') {
                    Write-Host "  [ERROR] $rel — FAQPage isPartOf=$faqParent (expect #website)" -ForegroundColor Red
                    $jsonLdIssues++
                }
            }

            # 6d. Service (conditional): must carry offers.priceSpecification
            if ($nodeType -eq 'Service') {
                $ps = $node.offers.priceSpecification
                if (-not $ps) {
                    Write-Host "  [ERROR] $rel — Service missing offers.priceSpecification" -ForegroundColor Red
                    $jsonLdIssues++
                } elseif ($ps.'@type' -ne 'UnitPriceSpecification' -or -not $ps.price -or -not $ps.priceCurrency) {
                    Write-Host "  [ERROR] $rel — Service priceSpecification incomplete" -ForegroundColor Red
                    $jsonLdIssues++
                }
            }
        }
    }
}

if ($jsonLdIssues -eq 0) {
    Write-Host "  [OK] JSON-LD: all parseable, in <head>, FAQPage/Service complete" -ForegroundColor Green
}
$script:Issues += $jsonLdIssues

# 7. Topic-cluster internal links (spoke → pillar hub)
Write-Host "`n  [CHECK] Topic-cluster internal links:" -ForegroundColor Cyan
$clusterIssues = 0

# 7a. Every Factory Resource article body must link to the pillar page (/services/china-factory-audit)
$factoryFiles = Get-ChildItem -Path (Join-Path $Root 'factory-resource') -Filter "*.html" | Where-Object { $_.Name -ne 'index.html' }
foreach ($file in $factoryFiles) {
    $c = Get-Content $file.FullName -Raw -Encoding UTF8
    $main = if ($c -match '(?s)<main.*?</main>') { $Matches[0] } else { '' }
    if ($main -notmatch 'href="/services/china-factory-audit"') {
        Write-Host "  [ERROR] Factory article missing pillar link to /services/china-factory-audit in body: $($file.Name)" -ForegroundColor Red
        $clusterIssues++
    }
}

# 7b. Every Inspection Case article body must link to /services#inspection and /about
$caseFiles = Get-ChildItem -Path (Join-Path $Root 'inspection-cases') -Filter "*.html" | Where-Object { $_.Name -ne 'index.html' }
foreach ($file in $caseFiles) {
    $c = Get-Content $file.FullName -Raw -Encoding UTF8
    $main = if ($c -match '(?s)<main.*?</main>') { $Matches[0] } else { '' }
    $missing = @()
    if ($main -notmatch 'href="/services#inspection"') { $missing += '/services#inspection' }
    if ($main -notmatch 'href="/about"') { $missing += '/about' }
    if ($missing.Count -gt 0) {
        Write-Host "  [ERROR] Case article missing body link(s) — $($file.Name): $($missing -join ', ')" -ForegroundColor Red
        $clusterIssues++
    }
}

if ($clusterIssues -eq 0) {
    Write-Host "  [OK] All factory articles link to pillar page; all case articles link to /services#inspection + /about" -ForegroundColor Green
}
$script:Issues += $clusterIssues

# 8. Breadcrumb item vs canonical consistency
Write-Host "`n  [CHECK] Breadcrumb vs canonical:" -ForegroundColor Cyan
$bcIssues = 0
$bcFiles = Get-ChildItem -Path $Root -Recurse -Filter "*.html" | Where-Object { $_.FullName -notmatch 'article-template' }

# Breadcrumb item can be a plain URL string or an object with "@id" (referenced entity)
function Get-ItemUrl($it) {
    if ($it -is [string]) { return $it }
    if ($null -ne $it -and $it.'@id') { return [string]$it.'@id' }
    return $null
}

foreach ($file in $bcFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content -notmatch 'BreadcrumbList') { continue }
    $rel = $file.FullName.Substring($Root.Length + 1)

    $canonical = ''
    $cm = [regex]::Match($content, '<link rel="canonical" href="([^"]+)"')
    if ($cm.Success) { $canonical = $cm.Groups[1].Value }

    $blocks = [regex]::Matches($content, '<script type="application/ld\+json">(.*?)</script>', 'Singleline')
    foreach ($block in $blocks) {
        $data = $null
        try { $data = $block.Groups[1].Value | ConvertFrom-Json -ErrorAction Stop } catch { continue }
        $bcNode = $null
        if ($null -ne $data.'@graph') {
            $bcNode = @($data.'@graph') | Where-Object { $_.'@type' -eq 'BreadcrumbList' } | Select-Object -First 1
        } elseif ($data.'@type' -eq 'BreadcrumbList') {
            $bcNode = $data
        }
        if ($null -eq $bcNode) { continue }
        $items = @($bcNode.itemListElement)
        if ($items.Count -eq 0 -or $null -eq $items[0]) { continue }

        # 8a. Last item (current page) must equal canonical
        $lastItem = Get-ItemUrl $items[$items.Count - 1].item
        if ($null -eq $lastItem) {
            Write-Host "  [WARN] $rel - Breadcrumb last item has no URL/@id" -ForegroundColor Yellow
        } elseif ($lastItem -ne $canonical) {
            Write-Host "  [ERROR] $rel - Breadcrumb last item ($lastItem) != canonical ($canonical)" -ForegroundColor Red
            $bcIssues++
        }

        # 8b. Parent items must follow trailing-slash rule (dir pages get '/', single pages don't)
        for ($i = 0; $i -lt $items.Count - 1; $i++) {
            $url = Get-ItemUrl $items[$i].item
            if (-not $url) { continue }
            $path = $url -replace '^https://www\.chinaqualityservice\.com/', ''
            if ($path -eq '') { $path = '/' }
            if ($path -eq '/') {
                $expected = 'https://www.chinaqualityservice.com/'
            } elseif ($path -match '(.+)/$') {
                $dirPath = $Matches[1]
                if (-not (Test-Path (Join-Path $Root ($dirPath + '/index.html')))) {
                    Write-Host "  [WARN] $rel - Breadcrumb parent item $url has no index.html on disk" -ForegroundColor Yellow
                    continue
                }
                $expected = 'https://www.chinaqualityservice.com/' + $dirPath + '/'
            } else {
                if (Test-Path (Join-Path $Root ($path + '.html'))) {
                    $expected = 'https://www.chinaqualityservice.com/' + $path
                } elseif (Test-Path (Join-Path $Root ($path + '/index.html'))) {
                    $expected = 'https://www.chinaqualityservice.com/' + $path + '/'
                } else {
                    Write-Host "  [WARN] $rel - Breadcrumb parent item $url maps to no page on disk" -ForegroundColor Yellow
                    continue
                }
            }
            if ($url -ne $expected) {
                Write-Host "  [ERROR] $rel - Breadcrumb parent item $url (expect $expected)" -ForegroundColor Red
                $bcIssues++
            }
        }
    }
}

if ($bcIssues -eq 0) {
    Write-Host "  [OK] All Breadcrumb items match canonical and trailing-slash rule" -ForegroundColor Green
}
$script:Issues += $bcIssues

# 9. Chinese encoding check (UTF-8-safe via Node.js)
Write-Host "`n  [CHECK] Chinese encoding (data-zh mojibake):" -ForegroundColor Cyan
$nodeExe = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeExe) {
    Write-Host "  [WARN] node not found - skipping encoding check" -ForegroundColor Yellow
} else {
    $encOut = & node (Join-Path $PSScriptRoot 'check-encoding.js') 2>&1
    $encFail = 0
    foreach ($line in $encOut) { if ($line -match '^FAIL') { $encFail++ } }
    if ($encFail -eq 0) {
        Write-Host "  [OK] No mojibake in data-zh attributes" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] $encFail file(s) contain mojibake:" -ForegroundColor Red
        foreach ($line in $encOut) { if ($line -match '^FAIL') { Write-Host "    $line" -ForegroundColor Red } }
        $script:Issues += $encFail
    }
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
