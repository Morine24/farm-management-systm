@echo off
echo Building Farm Management System...
echo.

echo [1/2] Installing Backend Dependencies...
cd farm-management-backend
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo.
echo [2/2] Installing Frontend Dependencies...
cd farm-management-frontend
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo.
echo ✅ Build completed successfully!
