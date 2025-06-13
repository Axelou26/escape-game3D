import { Router } from 'express';
import { scoreController } from '../controllers/score.controller';
import { authenticateToken } from '../middleware/auth';

const scoreRouter = Router();

// Toutes les routes nécessitent une authentification
scoreRouter.use(authenticateToken);

// Ajouter un événement de score
scoreRouter.post('/event', scoreController.addScoreEvent);

// Obtenir l'historique des scores
scoreRouter.get('/history', scoreController.getScoreHistory);

// Calculer la pénalité de temps
scoreRouter.post('/time-penalty', scoreController.addTimePenalty);

// Obtenir le score actuel
scoreRouter.get('/current', scoreController.getCurrentScore);

export default scoreRouter; 