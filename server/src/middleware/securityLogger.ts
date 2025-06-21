import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

interface SecurityEvent {
  timestamp: string;
  ip: string;
  userId?: string;
  endpoint: string;
  method: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: any;
  userAgent?: string;
  headers?: any;
}

class SecurityLogger {
  private logDir: string;
  private securityEvents: SecurityEvent[] = [];
  private suspiciousUsers: Map<string, number> = new Map();

  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
    this.startPeriodicFlush();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Enregistrer un événement de sécurité
  logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Log immédiat pour les événements critiques
    if (event.severity === 'CRITICAL') {
      this.flushLogs();
      console.error(`🚨 ÉVÉNEMENT CRITIQUE: ${JSON.stringify(event)}`);
    }
    
    // Incrémenter le compteur d'activité suspecte
    const userKey = event.userId || event.ip;
    this.suspiciousUsers.set(userKey, (this.suspiciousUsers.get(userKey) || 0) + 1);
  }

  // Sauvegarder les logs sur disque
  private flushLogs(): void {
    if (this.securityEvents.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `security-${today}.log`);
    
    const logEntries = this.securityEvents.map(event => JSON.stringify(event)).join('\n');
    
    fs.appendFileSync(logFile, logEntries + '\n');
    this.securityEvents = [];
  }

  // Flush périodique toutes les 5 minutes
  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushLogs();
    }, 5 * 60 * 1000);
  }

  // Obtenir le niveau de suspicion d'un utilisateur
  getSuspicionLevel(userKey: string): number {
    return this.suspiciousUsers.get(userKey) || 0;
  }

  // Réinitialiser le compteur de suspicion (appelé quotidiennement)
  resetSuspicionCounters(): void {
    this.suspiciousUsers.clear();
  }
}

const securityLogger = new SecurityLogger();

// Middleware de logging des tentatives de manipulation
export const logCheatAttempt = (eventType: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      ip: req.ip || 'unknown',
      userId: (req as any).user?.id?.toString() || undefined,
      endpoint: req.path,
      method: req.method,
      eventType,
      severity,
      details: {
        body: req.body,
        query: req.query,
        params: req.params
      },
      userAgent: req.headers['user-agent'],
      headers: req.headers
    };

    securityLogger.logSecurityEvent(event);
    next();
  };
};

// Middleware de monitoring des patterns suspects
export const monitorSuspiciousPatterns = (req: Request, res: Response, next: NextFunction) => {
  const userKey = (req as any).user?.id?.toString() || req.ip;
  const suspicionLevel = securityLogger.getSuspicionLevel(userKey);
  
  // Analyser les patterns suspects
  const patterns = {
    rapidRequests: false,
    invalidData: false,
    anomalousScore: false,
    timeManipulation: false
  };

  // Détection de requêtes rapides (plus de 20 dans les 5 dernières minutes)
  if (suspicionLevel > 20) {
    patterns.rapidRequests = true;
  }

  // Détection de manipulation de temps
  if (req.body.clientElapsedTime !== undefined) {
    const clientTime = parseInt(req.body.clientElapsedTime);
    if (clientTime < 0 || clientTime > 24 * 3600) {
      patterns.timeManipulation = true;
    }
  }

  // Détection de scores anormaux
  if (req.body.currentScore !== undefined) {
    const score = parseInt(req.body.currentScore);
    const time = parseInt(req.body.currentElapsedTime || 0);
    
    // Score trop élevé pour le temps écoulé
    if (score > 1000 + (time / 60) * 5) {
      patterns.anomalousScore = true;
    }
  }

  // Logger les patterns suspects
  const suspiciousPatterns = Object.entries(patterns).filter(([_, detected]) => detected);
  
  if (suspiciousPatterns.length > 0) {
    securityLogger.logSecurityEvent({
      timestamp: new Date().toISOString(),
      ip: req.ip || 'unknown',
      userId: (req as any).user?.id?.toString() || undefined,
      endpoint: req.path,
      method: req.method,
      eventType: 'SUSPICIOUS_PATTERN',
      severity: suspiciousPatterns.length > 2 ? 'HIGH' : 'MEDIUM',
      details: {
        patterns: suspiciousPatterns,
        suspicionLevel,
        requestData: req.body
      },
      userAgent: req.headers['user-agent']
    });

    // Bloquer si trop de patterns suspects
    if (suspiciousPatterns.length > 2) {
      return res.status(429).json({
        status: 'error',
        message: 'Activité suspecte détectée. Compte temporairement restreint.',
        code: 'SUSPICIOUS_ACTIVITY'
      });
    }
  }

  next();
};

// Middleware de logging des tentatives de codes incorrects
export const logIncorrectCodeAttempt = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    try {
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Si c'est une tentative de code incorrect
      if (responseData.data && responseData.data.correct === false) {
        securityLogger.logSecurityEvent({
          timestamp: new Date().toISOString(),
          ip: req.ip || 'unknown',
          userId: (req as any).user?.id?.toString() || undefined,
          endpoint: req.path,
          method: req.method,
          eventType: 'INCORRECT_CODE_ATTEMPT',
          severity: 'LOW',
          details: {
            puzzleId: req.params.puzzleId,
            submittedCode: req.body.code,
            attempts: (req as any).attemptCount || 1
          },
          userAgent: req.headers['user-agent']
        });
      }
    } catch (error) {
      // Ignorer les erreurs de parsing
    }
    
    return originalSend.call(this, data);
  };

  next();
};

// Middleware de détection de bots
export const detectBots = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'] || '';
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /postman/i
  ];

  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  if (isBot) {
    securityLogger.logSecurityEvent({
      timestamp: new Date().toISOString(),
      ip: req.ip || 'unknown',
      userId: (req as any).user?.id?.toString() || undefined,
      endpoint: req.path,
      method: req.method,
      eventType: 'BOT_DETECTED',
      severity: 'MEDIUM',
      details: {
        userAgent,
        headers: req.headers
      }
    });

    return res.status(403).json({
      status: 'error',
      message: 'Accès automatisé détecté',
      code: 'BOT_DETECTED'
    });
  }

  next();
};

// Analyse des logs de sécurité (pour les admins)
export const getSecurityAnalysis = (): any => {
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(securityLogger['logDir'], `security-${today}.log`);
  
  if (!fs.existsSync(logFile)) {
    return { message: 'Aucun log de sécurité aujourd\'hui' };
  }

  const logs = fs.readFileSync(logFile, 'utf8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(event => event !== null);

  // Analyser les données
  const analysis = {
    totalEvents: logs.length,
    criticalEvents: logs.filter(e => e.severity === 'CRITICAL').length,
    highSeverityEvents: logs.filter(e => e.severity === 'HIGH').length,
    topSuspiciousIPs: {} as Record<string, number>,
    mostCommonAttacks: {} as Record<string, number>,
    timelineEvents: logs.slice(-50) // Derniers 50 événements
  };

  // Compter les IPs suspectes
  logs.forEach(event => {
    const ip = event.ip;
    analysis.topSuspiciousIPs[ip] = (analysis.topSuspiciousIPs[ip] || 0) + 1;
  });

  // Compter les types d'attaques
  logs.forEach(event => {
    const type = event.eventType;
    analysis.mostCommonAttacks[type] = (analysis.mostCommonAttacks[type] || 0) + 1;
  });

  return analysis;
};

export { securityLogger }; 