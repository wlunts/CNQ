$files = @(
  'c:\Users\bongo\OneDrive\CNQ\industry-updates\pre-shipment-inspection-reduce-returns.html',
  'c:\Users\bongo\OneDrive\CNQ\industry-updates\eu-regulatory-compliance-guide-china-exporters.html',
  'c:\Users\bongo\OneDrive\CNQ\inspection-cases\milk-warmer-assembly-deviation-electronics-inspection.html',
  'c:\Users\bongo\OneDrive\CNQ\services\pre-shipment-inspection.html',
  'c:\Users\bongo\OneDrive\CNQ\services\initial-production-check.html',
  'c:\Users\bongo\OneDrive\CNQ\article-template.html'
)
foreach ($f in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($f)
  $hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
  $txt = [System.Text.Encoding]::UTF8.GetString($bytes)
  $hasBase = $txt.Contains('<base href="/">')
  Write-Output ((Split-Path $f -Leaf) + " | BOM=" + $hasBom + " | base=/=" + $hasBase)
}
