@echo off
echo ========================================
echo Starting Farm Management System
echo ========================================
echo.
cd farm-management-backend
start "Farm Management Server" cmd /k "npm start"
echo.
echo Server is starting...
echo.
echo Visit: http://localhost:5000
echo.
timeout /t 3 > nul
start http://localhost:5000
