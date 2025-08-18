# scripts/kill_ports.ps1
$ports = @("8000")

foreach ($port in $ports) {
    $process = netstat -aon | findstr ":$port" | ForEach-Object { $_ -split "\s+" | Select-Object -Last 1 } | Select-Object -First 1
    if ($process) {
        Write-Host "Killing process on port $port with PID $process"
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "No process found on port $port"
    }
}

# Clear stale turbo PID files
Remove-Item -Path "C:\Users\denni\AppData\Local\Temp\turbod\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cleared stale turbo PID files"