Write-Host "Starting Pokémon Soccer server..." -ForegroundColor Green
$port = 8080
$dir = $PSScriptRoot

# Start Python HTTP server
$job = Start-Job -ScriptBlock {
  param($port, $dir)
  Set-Location -LiteralPath $dir
  python -m http.server $port --bind 127.0.0.1
} -ArgumentList $port, $dir

Start-Sleep -Seconds 1

$url = "http://localhost:$port"
Start-Process $url

Write-Host "Server running at $url" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Wait for Ctrl+C
try {
  while ($true) { Start-Sleep -Seconds 1 }
} finally {
  Stop-Job $job
  Remove-Job $job
}
