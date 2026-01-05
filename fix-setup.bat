@echo off
echo Fixing XP Gaming Platform Setup...
echo.

echo Step 1: Creating missing directories...
mkdir "backend\src\routes" 2>nul
mkdir "backend\src\models" 2>nul
mkdir "backend\src\middleware" 2>nul
mkdir "backend\src\config" 2>nul
mkdir "frontend\src\contexts" 2>nul
mkdir "frontend\src\utils" 2>nul
mkdir "frontend\src\styles" 2>nul
mkdir "frontend\src\pages" 2>nul
mkdir "frontend\src\components\common" 2>nul

echo Step 2: Creating essential placeholder files...

REM Create placeholder matches route
(
echo import express from 'express';
echo.
echo const router = express.Router();
echo.
echo // Temporary placeholder - we'll build this later
echo router.get('/', (req, res) => {
echo   res.json({ message: 'Matches endpoint - coming soon' });
echo });
echo.
echo export default router;
) > "backend\src\routes\matches.js"

echo Step 3: Installing dependencies if not already installed...
cd backend
if not exist "node_modules" npm install
cd ..\frontend
if not exist "node_modules" npm install

echo.
echo ✅ Setup fix completed!
echo.
echo 📝 NEXT STEPS:
echo 1. Run: cd frontend && npm run dev
echo 2. Open: http://localhost:3000
echo 3. The styling should now work!
echo.
pause