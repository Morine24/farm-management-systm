@echo off
echo Starting Farm Management System...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd farm-management-backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Application...
start "Frontend" cmd /k "cd farm-management-frontend && npm start"

echo.
echo Both applications are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause