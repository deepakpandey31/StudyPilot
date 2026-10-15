@echo off
title StudyPilot AI — Chrome Extension Quick Setup
echo ========================================================
echo   StudyPilot AI — 3-Step Chrome Extension Setup
echo ========================================================
echo.
echo Step 1: Google Chrome will now open chrome://extensions
echo Step 2: Turn ON "Developer mode" in the top-right corner.
echo Step 3: Click "Load unpacked" (top-left) and select this folder:
echo         "%~dp0extension"
echo.
echo ========================================================
echo Opening Chrome and selecting extension folder...
echo ========================================================
echo.

start chrome chrome://extensions
explorer /select,"%~dp0extension\manifest.json"

echo.
echo Done! Once loaded, pin StudyPilot in Chrome's toolbar.
echo.
pause
