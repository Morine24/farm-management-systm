@echo off
echo Building for Production...
echo.

echo [1/2] Building Frontend...
cd farm-management-frontend
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo.
echo [2/2] Installing Backend Dependencies...
cd farm-management-backend
call npm install --production
cd ..

echo.
echo ✅ Production build completed!
