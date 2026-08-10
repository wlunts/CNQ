$ErrorActionPreference = "Stop"
$root = "c:/Users/bongo/OneDrive/CNQ"

$file = Join-Path $root "factory-resource/wuyishan-tea-factory.html"
$txt = [System.IO.File]::ReadAllText($file)

# Find "China " right before the garbled em-dash + "trusted"
$search = "control in China "
$idx = $txt.IndexOf($search)
if ($idx -ge 0) {
    $idx += $search.Length
    $slice = $txt.Substring($idx, [Math]::Min(20, $txt.Length - $idx))
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($slice)
    $hex = ($bytes | ForEach-Object { $_.ToString('X2') }) -join ' '
    Write-Host "After 'control in China ':"
    Write-Host "  Text: [$slice]"
    Write-Host "  Hex:  $hex"
    Write-Host "  Chars:"
    for ($i = 0; $i -lt $slice.Length; $i++) {
        $c = [int]$slice[$i]
        Write-Host "    [$i] = U+$($c.ToString('X4')) = '$($slice[$i])'"
    }
}
