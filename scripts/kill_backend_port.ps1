$port = "8000"

$process = netstat -aon | findstr ":$port" | ForEach-Object { $_ -split "\s+" | Select-Object -Last 1 } | Select-Object -First 1
if ($process) {
    Write-Host "Killing process on port $port with PID $process"
    Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "No process found on port $port"
}
