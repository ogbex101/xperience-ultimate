@echo off
echo ========================================
echo 🔧 ULTIMATE AUTH FIX SCRIPT
echo ========================================
echo.
echo This will diagnose and fix ALL authentication issues
echo.

REM Check if Node.js is running
echo 📊 Checking running processes...
tasklist | findstr node > nul
if %errorlevel%==0 (
    echo ⚠️  Node.js processes found. Stopping them...
    taskkill /F /IM node.exe 2>nul
) else (
    echo ✅ No Node.js processes running
)

echo.
echo ============ FRONTEND FIXES ============
echo.

REM Create a diagnostic HTML file
echo Creating diagnostic page...
echo ^<html^>^<head^>^<title^>Auth Debug^</title^>^</head^>^<body^>^<h1^>Auth Debugger^</h1^>^<div id="output"^>^</div^>^<script^> > debug.html
echo const output = document.getElementById('output'); >> debug.html
echo const addLine = (text) => output.innerHTML += '^<p^>' + text + '^</p^>'; >> debug.html
echo addLine('=== LOCAL STORAGE ==='); >> debug.html
echo addLine('token: ' + localStorage.getItem('token')); >> debug.html
echo addLine('authToken: ' + localStorage.getItem('authToken')); >> debug.html
echo addLine('userData: ' + localStorage.getItem('userData')); >> debug.html
echo addLine(''); >> debug.html
echo addLine('=== COOKIES ==='); >> debug.html
echo addLine('Cookies: ' + document.cookie); >> debug.html
echo addLine(''); >> debug.html
echo addLine('=== API REQUESTS ==='); >> debug.html
echo fetch('http://localhost:5000/api/auth/profile', { >> debug.html
echo   headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || localStorage.getItem('token')) } >> debug.html
echo }).then(r => r.json()).then(d => addLine('Profile API: ' + JSON.stringify(d))).catch(e => addLine('Profile API Error: ' + e)); >> debug.html
echo ^</script^>^</body^>^</html^> >> debug.html

echo ✅ Diagnostic page created: debug.html
echo Open this in your browser to see current auth state

echo.
echo ============ QUICK FIXES ============
echo.

echo Applying universal fixes to all files...
echo.

REM Create universal auth utility
echo Creating universal auth.js...
echo // UNIVERSAL AUTH UTILITY - SINGLE SOURCE OF TRUTH > C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo export const getToken = () => { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo   return localStorage.getItem('token') || localStorage.getItem('authToken'); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo }; >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo export const setToken = (token) => { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo   localStorage.setItem('token', token); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo   localStorage.setItem('authToken', token); // Store in both to be safe >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo }; >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo export const removeToken = () => { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo   localStorage.removeItem('token'); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo   localStorage.removeItem('authToken'); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js
echo }; >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\utils\universalAuth.js

echo ✅ Created universal auth utility

echo.
echo ============ BACKEND FIX ============
echo.

echo Creating backend socket debug script...
echo const jwt = require('jsonwebtoken'); > C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo module.exports = (io) => { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo   io.on('connection', (socket) => { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo     console.log('🔵 SOCKET DEBUG - New connection:'); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo     console.log('Socket ID:', socket.id); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo     console.log('Auth object:', socket.handshake.auth); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo     console.log('Headers:', socket.handshake.headers); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo     const token = socket.handshake.auth?.token || >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo                    socket.handshake.headers?.authorization?.replace('Bearer ', ''); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo     if (!token) { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo       console.log('❌ NO TOKEN FOUND'); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo       socket.emit('auth_error', 'No token provided'); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo       return; >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo     } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo     try { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo       const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key'); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo       console.log('✅ Token valid. User ID:', decoded.userId || decoded.id); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo       socket.userId = decoded.userId || decoded.id; >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo       socket.emit('authenticated', { userId: socket.userId }); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo     } catch (error) { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo       console.log('❌ Invalid token:', error.message); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo       socket.emit('auth_error', 'Invalid token'); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo     } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo   }); >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js
echo }; >> C:\Users\%USERNAME%\Desktop\xperience ultimate\backend\socketDebug.js

echo ✅ Backend socket debug created

echo.
echo ============ NUCLEAR OPTION ============
echo.

set /p nuclear=Do you want to apply nuclear fix? (y/n): 
if /i "%nuclear%"=="y" (
    echo Applying nuclear fixes...
    
    REM 1. Clear ALL localStorage
    echo Clearing browser data...
    echo ^<script^>localStorage.clear(); alert('LocalStorage cleared');^</script^> > clearStorage.html
    
    REM 2. Create fixed AuthContext
    echo Creating fixed AuthContext...
    copy C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js.backup
    echo // NUCLEAR FIXED AUTHCONTEXT > C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo import React, { createContext, useState, useContext, useEffect } from 'react' >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo import { authAPI } from '../utils/api' >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo import { debug } from '../utils/debug' >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo const AuthContext = createContext() >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo export const useAuth = () => { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   const context = useContext(AuthContext) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   if (!context) throw new Error('useAuth must be used within an AuthProvider') >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   return context >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo export const AuthProvider = ({ children }) => { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   const [user, setUser] = useState(null) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   const [loading, setLoading] = useState(true) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   const [token, setToken] = useState(localStorage.getItem('token')) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   useEffect(() => { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     console.log('🔵 AUTHCONTEXT: Token check:', { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       token: !!token, >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       localStorageToken: localStorage.getItem('token'), >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       localStorageAuthToken: localStorage.getItem('authToken') >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     }) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     if (token) { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       console.log('🔵 AUTHCONTEXT: Fetching profile with token') >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       fetchUserProfile() >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     } else { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       console.log('🔵 AUTHCONTEXT: No token found') >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       setLoading(false) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   }, [token]) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   const fetchUserProfile = async () => { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     try { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       console.log('🔵 AUTHCONTEXT: Calling getProfile API') >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       const data = await authAPI.getProfile() >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       console.log('🔵 AUTHCONTEXT: Profile response:', data) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       if (data.success) { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo         setUser(data.user) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     } catch (error) { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       console.error('🔵 AUTHCONTEXT: Profile fetch error:', error.message) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     } finally { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       setLoading(false) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   const login = async (email, password) => { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     console.log('🔵 AUTHCONTEXT: Login attempt for:', email) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     try { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       const data = await authAPI.login({ email, password }) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       console.log('🔵 AUTHCONTEXT: Login response:', data) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       const authToken = data.accessToken || data.token >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       if (!authToken) throw new Error('No token in response') >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       // STORE IN BOTH PLACES TO PREVENT ISSUES >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       localStorage.setItem('token', authToken) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       localStorage.setItem('authToken', authToken) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       setToken(authToken) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       setUser(data.user) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       return { success: true, user: data.user } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     } catch (error) { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       console.error('🔵 AUTHCONTEXT: Login error:', error) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       return { success: false, error: error.message } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   const logout = () => { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     console.log('🔵 AUTHCONTEXT: Logging out') >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     localStorage.removeItem('token') >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     localStorage.removeItem('authToken') >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     setToken(null) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     setUser(null) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   const value = { >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     user, loading, token, >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     login, logout, >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     isAuthenticated: !!token >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo. >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   return ( >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     ^<AuthContext.Provider value={value}^> >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo       {children} >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo     ^</AuthContext.Provider^> >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo   ) >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    echo } >> C:\Users\%USERNAME%\Desktop\xperience ultimate\frontend\src\contexts\AuthContext.js
    
    echo ✅ Nuclear AuthContext applied
)

echo.
echo ========================================
echo 🎯 NEXT STEPS:
echo 1. Double-click debug.html to check current auth state
echo 2. If broken, double-click clearStorage.html to reset
echo 3. Restart both frontend and backend
echo 4. Login fresh
echo ========================================
echo.
pause