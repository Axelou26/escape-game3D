import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Configuration du rate limiting par type d'endpoint
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { 
      status: 'error',
      message: options.message 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: (req: Request) => {
      // Utiliser l'IP + user ID si authentifié pour un rate limiting plus précis
      const userId = (req as any).user?.id || '';
      return `${req.ip}:${userId}`;
    },
    handler: (req: Request, res: Response) => {
      console.warn(`🚨 RATE LIMIT EXCEEDED - IP: ${req.ip}, User: ${(req as any).user?.id || 'anonymous'}, Endpoint: ${req.path}`);
      res.status(429).json({
        status: 'error',
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// Rate limiters spécifiques par fonctionnalité

// Authentification - très restrictif
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
});

// Validation de codes - restrictif  
export const codeValidationRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 tentatives par minute
  message: 'Trop de tentatives de validation de code. Ralentissez !',
  skipSuccessfulRequests: true // Ne compter que les échecs
});

// Validation d'énigmes - modéré
export const riddleValidationRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute  
  max: 15, // 15 tentatives par minute
  message: 'Trop de tentatives d\'énigmes. Prenez le temps de réfléchir !',
  skipSuccessfulRequests: true
});

// Score events - modéré mais surveiller les patterns anormaux
export const scoreEventRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 événements par minute (gameplay normal)
  message: 'Trop d\'événements de score. Activité suspecte détectée.'
});

// Sauvegarde de jeu - moins restrictif mais surveillé
export const gameSaveRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 sauvegardes par minute
  message: 'Trop de sauvegardes. Laissez le jeu se synchroniser.'
});

// Timer sync - modéré
export const timerSyncRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 syncs par minute (normal : 6 par minute)
  message: 'Synchronisation timer trop fréquente. Comportement suspect.'
});

// Inventaire - restrictif pour éviter le spam
export const inventoryRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 25, // 25 actions d'inventaire par minute
  message: 'Trop d\'actions d\'inventaire. Ralentissez !'
});

// Rate limiter global pour tous les endpoints
export const globalRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requêtes par minute par utilisateur
  message: 'Trop de requêtes. Veuillez ralentir.'
});

// Middleware de détection d'activité suspecte
export const suspiciousActivityDetector = (threshold: number = 50) => {
  const activityLog = new Map<string, number[]>();
  
  return (req: Request, res: Response, next: Function) => {
    const key = `${req.ip}:${(req as any).user?.id || 'anonymous'}`;
    const now = Date.now();
    
    // Nettoyer les anciennes entrées (plus de 5 minutes)
    if (!activityLog.has(key)) {
      activityLog.set(key, []);
    }
    
    const userActivity = activityLog.get(key)!;
    const recentActivity = userActivity.filter(time => now - time < 5 * 60 * 1000);
    
    recentActivity.push(now);
    activityLog.set(key, recentActivity);
    
    // Détecter l'activité suspecte
    if (recentActivity.length > threshold) {
      console.error(`🚨 ACTIVITÉ SUSPECTE DÉTECTÉE - User: ${key}, Requêtes: ${recentActivity.length} en 5min`);
      
      // Logger l'activité suspecte
      console.error(`Endpoint: ${req.method} ${req.path}, Headers: ${JSON.stringify(req.headers)}`);
      
      return res.status(429).json({
        status: 'error',
        message: 'Activité suspecte détectée. Compte temporairement restreint.',
        code: 'SUSPICIOUS_ACTIVITY'
      });
    }
    
    next();
  };
};

// Middleware spécifique pour les requêtes de timer - ajusté pour permettre la synchronisation normale
export const strictTimerRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 8, // 8 requêtes par minute maximum (plus de marge pour éviter les conflits)
  message: 'Trop de requêtes de timer. Synchronisation limitée pour éviter la surcharge.'
}); 