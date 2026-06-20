# Lightinmotion - Start Both Servers
# Run this from the /website folder

Write-Host ""
Write-Host "  Starting Lightinmotion servers..." -ForegroundColor Cyan
Write-Host ""

# Start backend in a new terminal window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\server'; node index.js"

# Give the backend a moment to initialise
Start-Sleep -Seconds 2

# Start frontend in a new terminal window (call vite directly — avoids npm PATH issues)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\app'; node node_modules/vite/bin/vite.js"

Write-Host "  Backend  running -> http://localhost:3001" -ForegroundColor Green
Write-Host "  Frontend running -> http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "  Admin panel -> http://localhost:3000/admin" -ForegroundColor Yellow
Write-Host "  Password   -> lightinmotion@admin" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Press any key to close this window..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
