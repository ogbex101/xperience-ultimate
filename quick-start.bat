@echo off
echo Starting XP Gaming Platform Development Environment...
echo.

echo Installing dependencies...
call npm run install:all

echo.
echo Starting servers...
start cmd /k "npm run dev:backend"
timeout /t 3
start cmd /k "npm run dev:frontend"

echo.
echo Development servers started!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause