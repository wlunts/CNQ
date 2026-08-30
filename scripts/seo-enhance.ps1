# ============================================================
# CNQ SEO enhancement batch script
#   A2: robots meta max-image-preview:large (all html)
#   A1: sitemap - append real content images per url
#   C5: sitemap - sync <lastmod> with file LastWriteTime
# Safety: dry-run by default; apply with -Apply. Backs up every
#         touched file to %TEMP%\cnq-seo-backup-<timestamp>.
# ============================================================
param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\bongo\OneDrive\CNQ'
$domain = 'https://www.chinaqualityservice.com'
$apply = $PSBoundParameters.ContainsKey('Apply')
$backupDir = Join-Path $env:TEMP ("cnq-seo-backup-" + (Get-Date -Format 'yyyyMMddHHmmss'))
if ($apply) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }

function Read-Text($abs) { return [IO.File]::ReadAllText($abs) }
function Write-Text($abs, $content) {
  $bytes = [IO.File]::ReadAllBytes($abs)
  $hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
  $enc = if ($hasBom) { New-Object System.Text.UTF8Encoding($true) } else { New-Object System.Text.UTF8Encoding($false) }
  [IO.File]::WriteAllText($abs, $content, $enc)
}
function Backup-File($abs) {
  if (-not $apply) { return }
  $rel = $abs.Substring($root.Length + 1)
  $dest = Join-Path $backupDir $rel
  New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
  Copy-Item $abs $dest -Force
}

$htmlFiles = Get-ChildItem $root -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch '\\scripts\\' }

# ============================================================
# A2: robots meta max-image-preview:large
# ============================================================
Write-Host '=== A2: robots meta (max-image-preview:large) ==='
$changed = 0
foreach ($f in $htmlFiles) {
  $c = Read-Text $f.FullName
  if ($c -match 'max-image-preview:large') { continue }
  $orig = $c
  $rIdx = $c.IndexOf('<meta name="robots"')
  if ($rIdx -ge 0) {
    # append to existing robots content value
    $q1 = $c.IndexOf('content="', $rIdx)
    if ($q1 -ge 0) {
      $q2 = $c.IndexOf('"', $q1 + 9)
      if ($q2 -gt $q1) {
        $c = $c.Substring(0, $q2) + ', max-image-preview:large' + $c.Substring($q2)
      }
    }
  } else {
    # insert after description meta
    $dIdx = $c.IndexOf('<meta name="description"')
    if ($dIdx -ge 0) {
      $end = $c.IndexOf('>', $dIdx)
      if ($end -gt $dIdx) {
        $insert = "`n  <meta name=`"robots`" content=`"max-image-preview:large`">"
        $c = $c.Substring(0, $end + 1) + $insert + $c.Substring($end + 1)
      }
    }
  }
  if ($c -ne $orig) {
    Write-Host "  [A2] $($f.FullName.Substring($root.Length + 1))"
    $changed++
    if ($apply) { Backup-File $f.FullName; Write-Text $f.FullName $c }
  }
}
Write-Host "  A2 files touched: $changed"

# ============================================================
# A1 + C5: sitemap.xml
# ============================================================
Write-Host '=== A1/C5: sitemap (images + lastmod) ==='
$smPath = Join-Path $root 'sitemap.xml'
$sm = Read-Text $smPath
$changedUrls = 0
$newSm = [regex]::Replace($sm, '<url>.*?</url>', {
  param($mm)
  $block = $mm.Value
  $m = [regex]::Match($block, '<loc>(.*?)</loc>')
  if (-not $m.Success) { return $block }
  $loc = $m.Groups[1].Value
  $path = $loc.Substring($domain.Length)
  if ($path -eq '' -or $path -eq '/') { $file = 'index.html' }
  elseif ($path -like '/downloads/*') { $file = $path.TrimStart('/') }
  elseif ($path -match '\.\w+$') { $file = $path.TrimStart('/') }
  elseif ($path -like '*/') { $file = $path.TrimStart('/') + 'index.html' }
  else { $file = $path.TrimStart('/') + '.html' }
  $abs = Join-Path $root ($file -replace '/', '\')
  if (-not (Test-Path $abs)) { return $block }
  $newBlock = $block
  $blockChanged = $false
  # --- C5: lastmod = file mtime ---
  $mt = (Get-Item $abs).LastWriteTime.ToString('yyyy-MM-dd')
  if ($block -match '<lastmod>') {
    $newBlock = [regex]::Replace($newBlock, '<lastmod>.*?</lastmod>', "<lastmod>$mt</lastmod>")
    $blockChanged = $blockChanged -or ($newBlock -ne $block)
  }
  # --- A1: append real content images (skip PDF-only and tool pages) ---
  $isPdf = $path -like '/downloads/*'
  if (-not $isPdf) {
    $html = Read-Text $abs
    $existing = [regex]::Matches($block, '<image:loc>(.*?)</image:loc>') | ForEach-Object { $_.Groups[1].Value }
    $imgs = [regex]::Matches($html, '<img[^>]+src="([^"]+)"') |
      ForEach-Object { $_.Groups[1].Value } |
      Where-Object { $_ -notmatch '^(data:|https?:)' -and $_ -notmatch '\.svg' -and $_ -notmatch 'logo\.png' -and $_ -notmatch 'og-image\.png' } |
      ForEach-Object { if ($_ -match '^/') { $domain + $_ } else { $domain + '/' + $_ } } |
      ForEach-Object { $_.Replace('&', '&amp;') } |
      Select-Object -Unique
    $toAdd = $imgs | Where-Object { $_ -notin $existing } | Select-Object -First 8
    if ($toAdd) {
      $addStr = (($toAdd | ForEach-Object { "<image:image><image:loc>$_</image:loc></image:image>" }) -join '')
      $newBlock = $newBlock.Replace('</url>', $addStr + '</url>')
      $blockChanged = $true
    }
  }
  if ($blockChanged) { $script:changedUrls++ }
  return $newBlock
}, 'Singleline')
if ($newSm -ne $sm) {
  Write-Host "  sitemap url blocks changed: $changedUrls"
  if ($apply) {
    Backup-File $smPath
    Write-Text $smPath $newSm
    Write-Host "  sitemap written."
  }
} else {
  Write-Host "  sitemap: no change."
}
Write-Host ''
if ($apply) {
  Write-Host "Backups: $backupDir"
} else {
  Write-Host 'DRY-RUN only. Re-run with -Apply to write changes.'
}
