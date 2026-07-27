# T Clock Restaurant POS — Start Script
# Run: .\start.ps1

Write-Host "=== T Clock Restaurant POS ===" -ForegroundColor Cyan
Write-Host ""

# Start Django backend
Write-Host "Starting Django backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; python backend/manage.py runserver"

Start-Sleep -Seconds 2

# Start React frontend  
Write-Host "Starting React frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Both servers started!" -ForegroundColor Yellow
Write-Host "  Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor Cyan
Write-Host "  Admin:   admin / owner123" -ForegroundColor White
Write-Host "  Staff:   staff / staff123" -ForegroundColor White
Write-Host "  Kitchen: kitchen / kitchen123" -ForegroundColor White
