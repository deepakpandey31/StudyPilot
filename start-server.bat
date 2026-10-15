@echo off
title StudyPilot AI Server
echo ========================================================
echo   Starting StudyPilot AI Local Web Server
echo   URL: http://localhost:8000
echo ========================================================
echo.
cd /d "%~dp0\website"

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo Python detected. Freeing port 8000 and launching Zero-Cache server...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
    start http://localhost:8000/index.html
    python server.py 8000
    goto end
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo Node.js detected. Launching npx serve on port 8000...
    start http://localhost:8000/index.html
    npx -y serve -p 8000 -s .
    goto end
)

echo Python or Node.js not found in PATH.
echo Please run a local server (e.g. VS Code Live Server) to access StudyPilot.
pause

:end
