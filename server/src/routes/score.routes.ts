import express from 'express';
import { scoreController } from '../controllers/score.controller';
import { authenticateToken } from '../middleware/auth';
import { 
  scoreEventRateLimit, 
  globalRateLimit,
  suspiciousActivityDetector 
} from '../middleware/rateLimiter';
import { 
  validateScoreEvent, 
  detectDataAnomalies,
  validateScoreIntegrity 
} from '../middleware/dataValidation';
import { 
  logCheatAttempt,
  monitorSuspiciousPatterns 
} from '../middleware/securityLogger';

const scoreRouter = express.Router();

// Appliquer les middlewares de sécurité globaux
scoreRouter.use(globalRateLimit);
scoreRouter.use(suspiciousActivityDetector(30)); // 30 requêtes max en 5 min
scoreRouter.use(detectDataAnomalies);
scoreRouter.use(authenticateToken);

// Route pour ajouter un événement de score
scoreRouter.post('/event', 
  scoreEventRateLimit,
  validateScoreEvent,
  validateScoreIntegrity,
  monitorSuspiciousPatterns,
  logCheatAttempt('SCORE_EVENT_ATTEMPT', 'LOW'),
  scoreController.addScoreEvent
);

// Route pour obtenir le score actuel
scoreRouter.get('/current', 
  scoreController.getCurrentScore
);

// Route pour ajouter une pénalité de temps
scoreRouter.post('/time-penalty',
  scoreEventRateLimit,
  validateScoreIntegrity,
  monitorSuspiciousPatterns,
  logCheatAttempt('TIME_PENALTY_ATTEMPT', 'MEDIUM'),
  scoreController.addTimePenalty
);

// Route pour l'historique des scores
scoreRouter.get('/history',
  scoreController.getScoreHistory
);

export { scoreRouter }; 