@echo off
echo Creating XP Gaming Tournament Platform Structure...
echo.

REM Create backend structure
echo Creating backend structure...
mkdir backend\src\controllers
mkdir backend\src\models
mkdir backend\src\routes
mkdir backend\src\middleware
mkdir backend\src\services
mkdir backend\src\utils
mkdir backend\src\config

REM Create frontend structure
echo Creating frontend structure...
mkdir frontend\src\components\common
mkdir frontend\src\components\auth
mkdir frontend\src\components\tournaments
mkdir frontend\src\components\matches
mkdir frontend\src\components\profile
mkdir frontend\src\components\wallet
mkdir frontend\src\components\groups
mkdir frontend\src\components\admin
mkdir frontend\src\pages
mkdir frontend\src\hooks
mkdir frontend\src\contexts
mkdir frontend\src\utils
mkdir frontend\src\styles\components

REM Create shared and other directories
echo Creating shared directories...
mkdir shared\schemas
mkdir shared\types
mkdir scripts\database\migrations
mkdir docs

REM Create basic files
echo Creating configuration files...

REM Backend package.json
echo Creating backend package.json...
(
echo {
echo   "name": "xperience-backend",
echo   "version": "1.0.0",
echo   "description": "XP Gaming Tournament Platform Backend",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js",
echo     "dev": "nodemon server.js",
echo     "test": "jest"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "socket.io": "^4.7.2",
echo     "mysql2": "^3.6.0",
echo     "redis": "^4.6.7",
echo     "bcryptjs": "^2.4.3",
echo     "jsonwebtoken": "^9.0.2",
echo     "cors": "^2.8.5",
echo     "dotenv": "^16.3.1",
echo     "joi": "^17.9.2",
echo     "axios": "^1.5.0",
echo     "multer": "^1.4.5"
echo   },
echo   "devDependencies": {
echo     "nodemon": "^3.0.1",
echo     "jest": "^29.6.2"
echo   }
echo }
) > backend\package.json

REM Frontend package.json
echo Creating frontend package.json...
(
echo {
echo   "name": "xperience-frontend",
echo   "version": "1.0.0",
echo   "type": "module",
echo   "scripts": {
echo     "dev": "vite",
echo     "build": "vite build",
echo     "preview": "vite preview"
echo   },
echo   "dependencies": {
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "react-router-dom": "^6.15.0",
echo     "socket.io-client": "^4.7.2",
echo     "axios": "^1.5.0",
echo     "framer-motion": "^10.16.1"
echo   },
echo   "devDependencies": {
echo     "vite": "^4.4.5",
echo     "tailwindcss": "^3.3.3",
echo     "autoprefixer": "^10.4.15",
echo     "postcss": "^8.4.29"
echo   }
echo }
) > frontend\package.json

REM Environment files
echo Creating environment files...
(
echo NODE_ENV=development
echo PORT=5000
echo DB_HOST=localhost
echo DB_USER=root
echo DB_PASSWORD=
echo DB_NAME=xperience_db
echo JWT_SECRET=your_jwt_secret_here
echo REDIS_URL=redis://localhost:6379
echo FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
echo FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
echo CLIENT_URL=http://localhost:3000
) > backend\.env

REM Tailwind config
echo Creating Tailwind config...
(
echo /** @type {import('tailwindcss').Config} */
echo module.exports = {
echo   content: [
echo     "./index.html",
echo     "./src/**/*.{js,ts,jsx,tsx}",
echo   ],
echo   theme: {
echo     extend: {
echo       colors: {
echo         primary: {
echo           black: '#000000',
echo           purple: '#8B5CF6',
echo           blue: '#3B82F6',
echo         },
echo         gradient: {
echo           start: '#000000',
echo           middle: '#4C1D95',
echo           end: '#1E40AF'
echo         }
echo       },
echo       backgroundImage: {
echo         'purple-gradient': 'linear-gradient(135deg, #000000 0%%, #4C1D95 50%%, #1E40AF 100%%)',
echo       }
echo     },
echo   },
echo   plugins: [],
echo }
) > frontend\tailwind.config.js

REM Main package.json
echo Creating main package.json...
(
echo {
echo   "name": "xperience-gaming-platform",
echo   "version": "1.0.0",
echo   "description": "XP - Ultimate Gaming Tournament Platform",
echo   "scripts": {
echo     "dev:backend": "cd backend && npm run dev",
echo     "dev:frontend": "cd frontend && npm run dev",
echo     "build:frontend": "cd frontend && npm run build",
echo     "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install",
echo     "setup": "scripts\\setup.bat"
echo   },
echo   "devDependencies": {
echo     "concurrently": "^8.2.0"
echo   }
echo }
) > package.json

REM README file
echo Creating README...
(
echo # 🎮 XP Gaming Tournament Platform
echo.
echo The ultimate platform for mobile gamers to compete, connect, and earn rewards.
echo.
echo ## Features
echo - 🏆 Multiple tournament types (1v1, Squad, Free-for-All, Survival)
echo - 💰 Real money tournaments with secure payments
echo - 👥 Social features (friends, groups, chat)
echo - 🏅 Ranking system with progression
echo - 💳 Multi-currency wallet system
echo - 📱 Mobile-first responsive design
echo.
echo ## Quick Start
echo.
echo ### Prerequisites
echo - Node.js 18+
echo - MySQL
echo - Redis
echo.
echo ### Installation
echo 1. Run the setup script:
echo    \`\`\`bash
echo    npm run setup
echo    \`\`\`
echo.
echo 2. Install dependencies:
echo    \`\`\`bash
echo    npm run install:all
echo    \`\`\`
echo.
echo 3. Configure your environment variables in \`backend/.env\`
echo.
echo 4. Start development servers:
echo    \`\`\`bash
echo    npm run dev:backend
echo    npm run dev:frontend
echo    \`\`\`
echo.
echo ## Tech Stack
echo - **Backend**: Node.js, Express.js, Socket.io
echo - **Frontend**: React.js, Tailwind CSS, Framer Motion
echo - **Database**: MySQL, Redis
echo - **Payments**: Flutterwave API
echo.
echo ## License
echo MIT
) > README.md

echo.
echo Structure created successfully!
echo.
echo Next steps:
echo 1. Run: npm run install:all
echo 2. Configure your database in backend/.env
echo 3. Start developing!
echo.
pause