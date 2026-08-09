$files = Get-ChildItem -Path "c:/Users/bongo/OneDrive/CNQ" -Filter *.html -Recurse | Where-Object { $_.FullName -notlike '*\Upload\*' -and $_.FullName -notlike '*\.git\*' -and $_.FullName -notlike '*\node_modules\*' } | Sort-Object FullName

Write-Output "FILE`tSTD_NAV`tOLD_NAV`tLANG`tMENU`tBACKTOP`tMAINJS`tFOOTER_CORE"
foreach ($f in $files) {
    $html = Get-Content $f.FullName -Raw -Encoding UTF8
    $rel = $f.FullName.Replace('c:\Users\bongo\OneDrive\CNQ\','').Replace('\','/')
    $hasStandardNav = if ($html -match '<div class="nav-dropdown"><a href="/about"') { 'YES' } else { 'NO' }
    $hasOldNav = if ($html -match '<a href="/insights"[^>]*>Cases</a>' -or $html -match '<a href="/factory-resource/"[^>]*>Factory Resource</a>') { 'YES' } else { 'NO' }
    $hasLangSwitch = if ($html -match '<div class="lang-switch">') { 'YES' } else { 'NO' }
    $hasMenuToggle = if ($html -match 'class="menu-toggle"') { 'YES' } else { 'NO' }
    $hasBackToTop = if ($html -match 'class="back-to-top"') { 'YES' } else { 'NO' }
    $hasMainJs = if ($html -match 'src="/js/main\.js"') { 'YES' } else { 'NO' }
    $footerCore = 0
    if ($html -match 'href="/services#inspection"') { $footerCore++ }
    if ($html -match 'href="/services#audit"') { $footerCore++ }
    if ($html -match 'href="/services#lab"') { $footerCore++ }
    if ($html -match 'href="/services#supplier"') { $footerCore++ }
    Write-Output "$rel`t$hasStandardNav`t$hasOldNav`t$hasLangSwitch`t$hasMenuToggle`t$hasBackToTop`t$hasMainJs`t$footerCore/4"
}
