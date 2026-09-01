Write-Host "Starting Pokémon Soccer server..." -ForegroundColor Green
$port = 8080
$dir = $PSScriptRoot

$job = Start-Job -ScriptBlock {
  param($port, $dir)
  Set-Location -LiteralPath $dir
  $env:PORT = "$port"
  python server.py
} -ArgumentList $port, $dir

Start-Sleep -Seconds 1

$url = "http://localhost:$port"
Start-Process $url

Write-Host "Server running at $url" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

try {
  while ($true) { Start-Sleep -Seconds 1 }
} finally {
  Stop-Job $job
  Remove-Job $job
}
