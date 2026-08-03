@echo off
setlocal

REM ====== Set your project path here ======
set PROJECT_DIR=C:\Users\hjin0238\Desktop\MapleTool

echo.
echo [1/4] Checking Docker Desktop...
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I /N "Docker Desktop.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Starting Docker Desktop, please wait...
    start "" "C:\Users\hjin0238\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
    timeout /t 20 /nobreak
) else (
    echo Docker Desktop already running.
)

echo.
echo [2/4] Starting DB container...
cd /d "%PROJECT_DIR%"
docker compose -f docker-compose-db.yaml up -d

echo Waiting for DB to be ready (5s)...
timeout /t 5 /nobreak

echo.
echo [3/4] Starting frontend in background (same window)...
start /b "" cmd /c "cd /d %PROJECT_DIR%\frontend && npx vite"

echo.
echo [4/4] Opening Chrome shortly, then starting backend...
timeout /t 5 /nobreak
start chrome http://localhost:5173

echo.
echo Starting backend now (this window will show backend logs)...
cd /d "%PROJECT_DIR%\backend"
set JASYPT_PASSWORD=dummy
set SPRING_PROFILES_ACTIVE=local
gradlew.bat bootRun

pause
