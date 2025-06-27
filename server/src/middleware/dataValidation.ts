import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

// Middleware de validation des erreurs
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Logger les tentatives de données invalides
    // Validation failed debug info removed
    
    return res.status(400).json({
      status: 'error',
      message: 'Données invalides détectées',
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  
  next();
};

// Validations pour l'authentification
export const validateAuth = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Nom d\'utilisateur doit faire entre 3 et 30 caractères')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Nom d\'utilisateur contient des caractères invalides'),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Mot de passe doit faire entre 6 et 100 caractères'),
  
  handleValidationErrors
];

// Validations pour les codes
export const validateCodeSubmission = [
  param('puzzleId')
    .isLength({ min: 1, max: 50 })
    .withMessage('ID de puzzle invalide')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('ID de puzzle contient des caractères invalides'),
  
  body('code')
    .isLength({ min: 1, max: 20 })
    .withMessage('Code doit faire entre 1 et 20 caractères')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Code contient des caractères invalides'),
  
  handleValidationErrors
];

// Validations pour les énigmes
export const validateRiddleSubmission = [
  param('riddleId')
    .isLength({ min: 1, max: 50 })
    .withMessage('ID d\'énigme invalide')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('ID d\'énigme contient des caractères invalides'),
  
  body('answer')
    .isLength({ min: 1, max: 100 })
    .withMessage('Réponse doit faire entre 1 et 100 caractères')
    .trim()
    .escape(),
  
  handleValidationErrors
];

// Validations pour les événements de score
export const validateScoreEvent = [
  body('eventType')
    .isIn([
      'ITEM_COLLECTED', 'CODE_CORRECT', 'CODE_INCORRECT',
      'BEAKER_SEQUENCE_WRONG', 'BEAKER_SEQUENCE_CORRECT',
      'ROOM_CHANGE', 'TIME_PENALTY', 'FINAL_CODE_CORRECT',
      'FINAL_CODE_INCORRECT', 'RIDDLE_SOLVED', 'RIDDLE_FAILED'
    ])
    .withMessage('Type d\'événement invalide'),
  
  body('details')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Détails trop longs')
    .trim()
    .escape(),
  
  handleValidationErrors
];

// Validations pour la synchronisation du timer
export const validateTimerSync = [
  body('clientElapsedTime')
    .isNumeric()
    .withMessage('Temps écoulé doit être un nombre')
    .custom((value) => {
      const time = parseInt(value);
      if (time < 0 || time > 24 * 60 * 60) { // Max 24h
        throw new Error('Temps écoulé invalide (0-24h)');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validations pour les sauvegardes de jeu
export const validateGameSave = [
  body('currentScore')
    .isNumeric()
    .withMessage('Score doit être un nombre')
    .custom((value) => {
      const score = parseInt(value);
      if (score < 0 || score > 10000) { // Score max raisonnable
        throw new Error('Score invalide (0-10000)');
      }
      return true;
    }),
  
  body('currentElapsedTime')
    .isNumeric()
    .withMessage('Temps écoulé doit être un nombre')
    .custom((value) => {
      const time = parseInt(value);
      if (time < 0 || time > 24 * 60 * 60) {
        throw new Error('Temps écoulé invalide');
      }
      return true;
    }),
  
  body('gameState')
    .isObject()
    .withMessage('État de jeu doit être un objet'),
  
  body('gameState.currentRoom')
    .isIn(['library', 'laboratory', 'secret-chamber'])
    .withMessage('Salle invalide'),
  
  body('gameState.inventory')
    .isArray({ max: 20 })
    .withMessage('Inventaire invalide (max 20 objets)'),
  
  handleValidationErrors
];

// Validations pour l'inventaire
export const validateInventoryAction = [
  body('itemId')
    .isLength({ min: 1, max: 50 })
    .withMessage('ID d\'objet invalide')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('ID d\'objet contient des caractères invalides'),
  
  body('itemType')
    .optional()
    .isIn(['key', 'document', 'tool', 'artifact', 'clue'])
    .withMessage('Type d\'objet invalide'),
  
  body('itemName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nom d\'objet invalide')
    .trim()
    .escape(),
  
  handleValidationErrors
];

// Middleware de détection d'anomalies dans les données
export const detectDataAnomalies = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    // Tentatives d'injection
    /<script|javascript:|vbscript:|onload|onerror/i,
    // Tentatives SQL
    /union|select|insert|delete|drop|update|exec/i,
    // Tentatives de traversal
    /\.\.|\/\.\.|\\\.\.|\.\./,
    // Tentatives de manipulation d'objets
    /__proto__|constructor|prototype/i
  ];
  
  const checkData = (data: any, path: string = ''): boolean => {
    if (typeof data === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(data));
    }
    
    if (Array.isArray(data)) {
      return data.some((item, index) => checkData(item, `${path}[${index}]`));
    }
    
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).some(([key, value]) => 
        checkData(value, path ? `${path}.${key}` : key)
      );
    }
    
    return false;
  };
  
  // Vérifier toutes les données entrantes
  const allData = { ...req.body, ...req.query, ...req.params };
  
  if (checkData(allData)) {
    // Injection attempt detected - debug info removed
    
    return res.status(400).json({
      status: 'error',
      message: 'Contenu suspect détecté',
      code: 'SUSPICIOUS_CONTENT'
    });
  }
  
  next();
};

// Middleware de validation de l'intégrité des scores
export const validateScoreIntegrity = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.currentScore !== undefined) {
    const score = req.body.currentScore;
    const elapsedTime = req.body.currentElapsedTime || 0;
    
    // Vérifications d'intégrité basiques
    const maxPossibleScore = 1000 + (elapsedTime / 60) * 10; // Score initial + bonus temporel
    const minPossibleScore = Math.max(0, 1000 - (elapsedTime / 120) * 10); // Avec pénalités
    
    if (score > maxPossibleScore || score < -1000) {
      // Suspicious score detected - debug info removed
      
      return res.status(400).json({
        status: 'error',
        message: 'Score incohérent détecté',
        code: 'INVALID_SCORE'
      });
    }
  }
  
  next();
}; 