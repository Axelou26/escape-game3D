import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboard.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const leaderboardController = new LeaderboardController();

// Route pour obtenir le classement
router.get('/', (req, res, next) => {
  leaderboardController.getLeaderboard(req, res).catch(next);
});

// Route pour ajouter un score au classement (protégée par authentification)
router.post('/score', authenticateToken, (req, res, next) => {
  leaderboardController.addScore(req, res).catch(next);
});

export default router; 