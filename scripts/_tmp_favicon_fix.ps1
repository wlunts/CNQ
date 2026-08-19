$root = 'c:\Users\bongo\OneDrive\CNQ'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$reps = @(
  @('rel="alternate icon" href="/favicon.png"', 'rel="icon" type="image/png" sizes="48x48" href="/favicon.png"'),
  @('rel="icon" type="image/png" href="favicon.png"', 'rel="icon" type="image/png" sizes="48x48" href="/favicon.png"'),
  @('rel="icon" type="image/png" href="/favicon.png"', 'rel="icon" type="image/png" sizes="48x48" href="/favicon.png"'),
  @('rel="icon" type="image/svg+xml" href="favicon.svg"', 'rel="icon" type="image/svg+xml" href="/favicon.svg"')
)

$files = Get-ChildItem -Path $root -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch '\\(scripts|node_modules|\.git)\\' }

$changedCount = 0
foreach ($f in $files) {
  $txt = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  $orig = $txt
  foreach ($r in $reps) {
    $txt = $txt.Replace($r[0], $r[1])
  }
  if ($txt -ne $orig) {
    [System.IO.File]::WriteAllText($f.FullName, $txt, $utf8NoBom)
    $changedCount++
    Write-Output ('FIXED: ' + $f.FullName.Substring($root.Length))
  }
}
Write-Output ('Total files changed: ' + $changedCount)
