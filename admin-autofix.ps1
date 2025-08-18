# go to the admin-portal app
Set-Location packages/frontend/admin-portal

# strip UTF-8 BOM from any package.json under node_modules (safe to run anytime)
function Remove-Bom($path) {
  $bytes = [System.IO.File]::ReadAllBytes($path)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    [System.IO.File]::WriteAllBytes($path, $bytes[3..($bytes.Length-1)])
    Write-Host "Fixed BOM: $path"
  }
}
Get-ChildItem node_modules -Recurse -Filter package.json | ForEach-Object { Remove-Bom $_.FullName }
