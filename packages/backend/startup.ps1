# startup.ps1 - Simple Windows startup script
param(
    [int]$Port = 8000,
    [string]$Host = "0.0.0.0"
)

Write-Host "Cleaning up port $Port..." -ForegroundColor Yellow

# Kill any processes using the port
$portProcesses = netstat -ano | Select-String ":$Port "
if ($portProcesses) {
    Write-Host "Killing processes on port $Port..." -ForegroundColor Red
    $portProcesses | ForEach-Object {
        $pid = ($_.Line -split '\s+')[-1]
        if ($pid -and $pid -ne "0") {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}

# Kill hanging Python processes
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "Starting FastAPI server on $Host`:$Port..." -ForegroundColor Green
Write-Host "Endpoints: http://localhost:$Port/ and http://localhost:$Port/health" -ForegroundColor Cyan

# Start the server
uvicorn main:app --reload --host $Host --port $Port