import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { gameStateController } from '../controllers/game-state.controller';
import { timerController } from '../controllers/timer.controller';
import { strictTimerRateLimit } from '../middleware/rateLimiter';

const router = Router();

// Configuration du jeu (publique, pas d'authentification requise)
router.get('/config', gameStateController.getGameConfig);

// Toutes les autres routes nécessitent une authentification
router.use(authenticateToken);

// Gestion de l'inventaire
router.get('/inventory', gameStateController.getInventory);
router.post('/inventory/add', gameStateController.addToInventory);
router.delete('/inventory/:itemId', gameStateController.removeFromInventory);

// Gestion des salles
router.post('/room/change', gameStateController.changeRoom);

// Gestion de la progression
router.post('/progress/update', gameStateController.updateGameProgress);

// Gestion du timer avec rate limiting strict
router.post('/timer/sync', strictTimerRateLimit, timerController.syncTimer);
router.get('/timer/current', strictTimerRateLimit, timerController.getCurrentTime);
router.post('/timer/pause', timerController.pauseGame);

export default router; 