@echo off
REM RLA2 Medical Delivery Logistics - Windows Setup Script

color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  RLA2 Medical Delivery Logistics - Setup ^& Run                ║
echo ║  Windows Edition                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found!
    echo Please download from: https://python.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i

echo [OK] Node.js: %NODE_VER%
echo [OK] Python: %PY_VER%
echo.

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Start backend
echo [INFO] Starting Flask backend on port 5000...
echo.
start "RLA2 Backend" cmd /k "python app.py"
echo [INFO] Waiting for backend to start...
timeout /t 3 /nobreak
echo [OK] Backend started
echo.

REM Start frontend
echo [INFO] Starting React frontend on port 3000...
echo [INFO] Opening browser at http://localhost:3000/
echo.
timeout /t 2 /nobreak
start http://localhost:3000/
call npm run dev

echo.
echo [INFO] Development session ended
echo.
pause
