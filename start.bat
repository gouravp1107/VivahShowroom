@echo off
setlocal
title Vivah Rental Showroom - Server
cd /d "%~dp0"

REM ---- change the port here if 3000 is busy ----
set PORT=3000

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is not installed on this computer.
  echo  1. Download the LTS version from https://nodejs.org
  echo  2. Install it ^(keep the default options^)
  echo  3. Double-click start.bat again
  echo.
  start https://nodejs.org
  pause
  exit /b 1
)

echo.
echo  Starting Vivah Rental Showroom ...
echo  Keep this window open while the website is running. Close it to stop the website.
echo.

REM open the browser a few seconds after the server starts
start "" /min cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:%PORT%/"

:run
node backend\server.js
echo.
echo  The server stopped. Restarting in 5 seconds... ^(close this window to quit^)
timeout /t 5 /nobreak >nul
goto run
