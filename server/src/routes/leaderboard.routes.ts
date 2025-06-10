import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboard.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const leaderboardController = new LeaderboardController();

// Middleware de logging
router.use((req, res, next) => {
  console.log(`[Leaderboard] ${req.method} ${req.path}`);
  next();
});

// Route pour obtenir le classement
router.get('/', (req, res, next) => {
  console.log('Accès à la route du leaderboard');
  leaderboardController.getLeaderboard(req, res).catch(next);
});

// Route pour ajouter un score au classement (protégée par authentification)
router.post('/score', authenticateToken, (req, res, next) => {
  console.log('Tentative d\'ajout d\'un score');
  leaderboardController.addScore(req, res).catch(next);
});

export default router; 