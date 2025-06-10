import express from 'express';
import { gameController } from '../controllers/game.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Routes protégées par authentification
router.post('/start', authenticateToken, gameController.startGame);
router.get('/current', authenticateToken, gameController.getCurrentGame);
router.post('/end', authenticateToken, gameController.endGame);
router.post('/save', authenticateToken, gameController.saveGame);
router.post('/reset', authenticateToken, gameController.resetGame);

// Route publique pour le classement
router.get('/leaderboard', gameController.getLeaderboard);

export default router; 