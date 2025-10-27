@echo off
echo Starting Farm Management System...
echo.

start "Backend Server" cmd /k "cd farm-management-backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend App" cmd /k "cd farm-management-frontend && npm start"

echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
