import { Router } from 'express';
import { riddleController } from '../controllers/riddle.controller';
import { authenticateToken } from '../middleware/auth';

const riddleRouter = Router();

// Toutes les routes nécessitent une authentification
riddleRouter.use(authenticateToken);

// Obtenir toutes les énigmes d'une salle
riddleRouter.get('/room/:roomId', riddleController.getRiddlesByRoom);

// Obtenir le contenu d'une énigme spécifique
riddleRouter.get('/:riddleId', riddleController.getRiddleContent);

// Valider la réponse à une énigme
riddleRouter.post('/:riddleId/validate', riddleController.validateRiddleAnswer);

// Obtenir un indice pour une énigme
riddleRouter.post('/:riddleId/hint', riddleController.getHint);

export default riddleRouter; 