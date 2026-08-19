$p = 'c:\Users\bongo\OneDrive\CNQ\inspection-cases\squishy-toy-color-bleeding-inspection.html'
$txt = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)

# 1) Find data-zh attribute values containing straight double quote U+0022
Write-Output '=== data-zh values with straight quote (U+0022) ==='
$lines = $txt -split "`n"
for ($i = 0; $i -lt $lines.Length; $i++) {
  $line = $lines[$i]
  $m = [regex]::Match($line, 'data-zh="([^"]*)"')
  if ($m.Success) {
    $val = $m.Groups[1].Value
    if ($val.Contains([string][char]0x22)) {
      Write-Output ('LINE ' + ($i + 1) + ' :: ' + $val)
    }
  }
}

# 2) Count English words in article-body
Write-Output ''
Write-Output '=== word count (article-body) ==='
$bodyStart = $txt.IndexOf('id="articleContent"')
$bodyEnd = $txt.IndexOf('</div>', $bodyStart)
$body = $txt.Substring($bodyStart, $bodyEnd - $bodyStart)
$noTags = [regex]::Replace($body, '<[^>]+>', ' ')
$noTags = [System.Net.WebUtility]::HtmlDecode($noTags)
$words = [regex]::Matches($noTags, '[A-Za-z][A-Za-z''-]*')
Write-Output ('English word count: ' + $words.Count)
