@echo off
echo Quick Fix for XP Platform...
echo.

echo Creating missing tournament routes file...
(
echo import express from 'express';
echo import Joi from 'joi';
echo import { Tournament } from '../models/Tournament.js';
echo import { authenticateToken } from '../middleware/auth.js';
echo.
echo const router = express.Router();
echo.
echo // Validation schemas
echo const createTournamentSchema = Joi.object({
echo   name: Joi.string().min(3).max(100).required(),
echo   game: Joi.string().max(50).required(),
echo   description: Joi.string().max(500).optional().allow('', null),
echo   max_players: Joi.number().min(2).max(100).required(),
echo   entry_fee: Joi.number().min(0).default(0),
echo   prize_pool_option: Joi.string().valid('entry_fee', 'custom').default('entry_fee'),
echo   custom_prize_pool: Joi.number().min(0).default(0),
echo   type: Joi.string().valid('onevsone', 'squad', 'freeforall', 'survival').default('onevsone'),
echo   start_date: Joi.date().greater('now').required()
echo });
echo.
echo // Get all tournaments - SIMPLIFIED VERSION
echo router.get('/', async (req, res) => {
echo   try {
echo     res.json({
echo       success: true,
echo       data: [],
echo       message: 'Tournaments endpoint - full version coming soon'
echo     });
echo   } catch (error) {
echo     console.error('Get tournaments error:', error);
echo     res.status(500).json({ error: 'Failed to fetch tournaments' });
echo   }
echo });
echo.
echo // Create tournament - SIMPLIFIED VERSION
echo router.post('/', authenticateToken, async (req, res) => {
echo   try {
echo     res.json({
echo       success: true,
echo       message: 'Tournament creation - full version coming soon',
echo       data: { id: 1, name: req.body.name }
echo     });
echo   } catch (error) {
echo     console.error('Create tournament error:', error);
echo     res.status(500).json({ error: 'Failed to create tournament' });
echo   }
echo });
echo.
echo export default router;
) > "backend\src\routes\tournaments.js"

echo Creating placeholder models...
(
echo // Placeholder Tournament model
echo export class Tournament {
echo   static async create(tournamentData) {
echo     return 1; // Mock ID
echo   }
echo   static async findById(id) {
echo     return { id: 1, name: 'Mock Tournament' };
echo   }
echo   static async findAll() {
echo     return { tournaments: [], total: 0, page: 1, totalPages: 0 };
echo   }
echo }
) > "backend\src\models\Tournament.js"

echo.
echo ✅ Quick fix applied! Backend should now start.
echo.
echo 🚀 Starting servers...
start cmd /k "cd backend && npm run dev"
timeout /t 5
start cmd /k "cd frontend && npm run dev"
echo.
pause