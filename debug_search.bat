@echo off
echo ===============================================
echo 🎮 XP GAMING PLATFORM - API FIXES
echo ===============================================
echo.

echo 🔧 Fixing API Base URL...
echo.

echo 📝 Updating api.js to use port 5000...
(
echo import axios from 'axios'
echo
echo const API_BASE_URL = 'http://localhost:5000/api' // ✅ PORT 5000
echo
echo const api = axios.create({
echo   baseURL: API_BASE_URL,
echo   headers: {
echo     'Content-Type': 'application/json',
echo   },
echo })
echo
echo // Request interceptor to add auth token
echo api.interceptors.request.use(
echo   (config) => {
echo     const token = localStorage.getItem('token')
echo     if (token) {
echo       config.headers.Authorization = `Bearer \${token}`
echo     }
echo     return config
echo   },
echo   (error) => {
echo     return Promise.reject(error)
echo   }
echo )
echo
echo // Response interceptor to handle errors
echo api.interceptors.response.use(
echo   (response) => response,
echo   (error) => {
echo     if (error.response?.status === 401) {
echo       localStorage.removeItem('token')
echo       window.location.href = '/login'
echo     }
echo     return Promise.reject(error)
echo   }
echo )
echo
echo // Auth API
echo export const authAPI = {
echo   login: (credentials) => api.post('/auth/login', credentials),
echo   register: (userData) => api.post('/auth/register', userData),
echo   getProfile: () => api.get('/users/profile'), // ✅ CHANGED FROM /auth/profile
echo }
echo
echo // Users API
echo export const usersAPI = {
echo   getProfile: (userId) => api.get(`/users/\${userId}`),
echo   updateProfile: (userData) => api.put('/users/profile', userData),
echo   search: (query) => api.get(\`/users/search?query=\${encodeURIComponent(query)}\`),
echo }
echo
echo // Tournaments API
echo export const tournamentsAPI = {
echo   getAll: () => api.get('/tournaments'),
echo   getById: (id) => api.get(\`/tournaments/\${id}\`),
echo   create: (tournamentData) => api.post('/tournaments', tournamentData),
echo   join: (tournamentId) => api.post(\`/tournaments/\${tournamentId}/join\`),
echo }
echo
echo // Matches API
echo export const matchesAPI = {
echo   getAll: () => api.get('/matches'),
echo   getById: (id) => api.get(\`/matches/\${id}\`),
echo   create: (matchData) => api.post('/matches', matchData),
echo   submitResult: (matchId, result) => api.post(\`/matches/\${matchId}/result\`, result),
echo }
echo
echo export default api
) > "C:\Users\HP\Desktop\xperience ultimate\frontend\src\utils\api.js"

echo ✅ Updated api.js with correct port and routes

echo.
echo 🔧 Adding missing backend routes...
echo.

echo 📝 Adding /api/auth/profile route to server.js...
(
echo // Add this route in your server.js after other auth routes
echo app.get('/api/auth/profile', authenticateToken, async (req, res) => {
echo   try {
echo     const [users] = await db.execute(
echo       \`SELECT id, username, email, profile_pic, rank, matches_played, wins, losses, win_rate, created_at
echo        FROM users 
echo        WHERE id = ?\`,
echo       [req.user.id]
echo     );
echo 
echo     if (users.length === 0) {
echo       return res.status(404).json({ error: 'User not found' });
echo     }
echo 
echo     res.json({
echo       success: true,
echo       user: users[0]
echo     });
echo   } catch (error) {
echo     console.error('Get profile error:', error);
echo     res.status(500).json({ error: 'Failed to fetch profile' });
echo   }
echo });
) > "C:\Users\HP\Desktop\xperience ultimate\backend_add_routes.txt"

echo.
echo ===============================================
echo ✅ FIXES APPLIED!
echo ===============================================
echo.
echo 📋 Changes Made:
echo 1. ✅ API base URL changed to port 5000
echo 2. ✅ authAPI.getProfile() route fixed to /users/profile
echo 3. ✅ Added backend route template for /api/auth/profile
echo.
echo 🚀 Next Steps:
echo 1. Add the route from backend_add_routes.txt to your server.js
echo 2. Restart both frontend and backend
echo 3. Test search again
echo.

pause