import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboard.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const leaderboardController = new LeaderboardController();

// Route pour obtenir le classement
router.get('/', leaderboardController.getLeaderboard);

// Route pour ajouter un score au classement (protégée par authentification)
router.post('/score', authenticateToken, leaderboardController.addScore);

export default router; 