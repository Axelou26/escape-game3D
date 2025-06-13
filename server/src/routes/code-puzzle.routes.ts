import { Router } from 'express';
import { codePuzzleController } from '../controllers/code-puzzle.controller';
import { authenticateToken } from '../middleware/auth';

const codePuzzleRouter = Router();

// Toutes les routes nécessitent une authentification
codePuzzleRouter.use(authenticateToken);

// Obtenir tous les codes/puzzles d'une salle
codePuzzleRouter.get('/room/:roomId', codePuzzleController.getCodePuzzlesByRoom);

// Valider un code
codePuzzleRouter.post('/:puzzleId/validate', codePuzzleController.validateCode);

// Obtenir un indice pour un puzzle
codePuzzleRouter.post('/:puzzleId/hint', codePuzzleController.getPuzzleHint);

export default codePuzzleRouter; 