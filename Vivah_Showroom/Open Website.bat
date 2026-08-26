@echo off
title Vivah Trousseau - Wedding Rental Website
cd /d "%~dp0"

REM Just want to LOOK at the site with no setup? Close this and instead
REM double-click "Open Site.html" in this same folder — no install needed.
REM This script is for full local development (hot reload + live backend).

echo ============================================
echo   Vivah Trousseau - Starting Local Servers
echo ============================================
echo.

REM --- Start backend (Express + MongoDB) in its own window ---
echo Starting backend on http://localhost:5000 ...
start "Vivah Trousseau - Backend" cmd /k "cd backend && npm run dev"

REM --- Start frontend (Vite dev server) in its own window ---
echo Starting frontend on http://localhost:5173 ...
start "Vivah Trousseau - Frontend" cmd /k "cd frontend && npm run dev"

REM --- Give both servers a few seconds to boot before opening the browser ---
timeout /t 6 /nobreak > nul

REM --- Open the site in Chrome (falls back to default browser if Chrome isn't found) ---
echo Opening the website in Google Chrome ...
start chrome "http://localhost:5173" 2>nul
if errorlevel 1 (
    start "" "http://localhost:5173"
)

echo.
echo ============================================
echo   Vivah Trousseau is starting up.
echo   Backend:  http://localhost:5000/api/health
echo   Frontend: http://localhost:5173
echo.
echo   Close the two new terminal windows to stop
echo   the servers. This window can be closed now.
echo ============================================
pause
