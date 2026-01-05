@echo off
echo Starting XP Gaming Platform Development Servers...
echo.

echo Starting Backend Server (Port 5000)...
start cmd /k "cd backend && npm run dev"
timeout /t 3

echo Starting Frontend Server (Port 3000)...
start cmd /k "cd frontend && npm run dev"

echo.
echo 🚀 Development servers starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause