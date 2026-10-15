@echo off
title Push StudyPilot to GitHub
echo ========================================================
echo   Pushing StudyPilot to https://github.com/deepakpandey31/StudyPilot
echo ========================================================
echo.
echo Make sure you have created the empty repository on GitHub:
echo URL: https://github.com/new (Repository name: StudyPilot)
echo.
pause
echo.
echo Pushing to GitHub main branch...
git push -u origin main
if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Pushed to https://github.com/deepakpandey31/StudyPilot
    echo ========================================================
) else (
    echo.
    echo PUSH FAILED. Please verify that:
    echo 1. The repository https://github.com/deepakpandey31/StudyPilot exists.
    echo 2. You are logged into GitHub in your terminal/browser.
)
echo.
pause
