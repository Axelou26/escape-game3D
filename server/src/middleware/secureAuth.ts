import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-key';

interface SecureAuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    isAdmin: boolean;
  };
  csrfToken?: string;
}

// Générer un token CSRF
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Valider le token CSRF
const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(sessionToken, 'hex')
  );
};

// Middleware d'authentification sécurisé
export const secureAuthMiddleware = (req: SecureAuthRequest, res: Response, next: NextFunction) => {
  try {
    // Récupérer le token depuis les cookies httpOnly
    const token = req.cookies?.authToken;
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token d\'authentification manquant',
        code: 'NO_AUTH_TOKEN'
      });
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Vérifier l'expiration
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      // Token expiré - nettoyer les cookies
      res.clearCookie('authToken');
      res.clearCookie('csrfToken');
      
      return res.status(401).json({
        status: 'error',
        message: 'Session expirée',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: decoded.id,
      username: decoded.username,
      isAdmin: decoded.isAdmin || false
    };

    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    
    // Nettoyer les cookies en cas d'erreur
    res.clearCookie('authToken');
    res.clearCookie('csrfToken');
    
    return res.status(401).json({
      status: 'error',
      message: 'Token invalide',
      code: 'INVALID_TOKEN'
    });
  }
};

// Middleware de protection CSRF
export const csrfProtection = (req: SecureAuthRequest, res: Response, next: NextFunction) => {
  // Ignorer la protection CSRF pour les requêtes GET
  if (req.method === 'GET') {
    return next();
  }

  const csrfTokenFromHeader = req.headers['x-csrf-token'] as string;
  const csrfTokenFromCookie = req.cookies?.csrfToken;

  if (!csrfTokenFromHeader || !csrfTokenFromCookie) {
    return res.status(403).json({
      status: 'error',
      message: 'Token CSRF manquant',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  if (!validateCSRFToken(csrfTokenFromHeader, csrfTokenFromCookie)) {
    return res.status(403).json({
      status: 'error',
      message: 'Token CSRF invalide',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  next();
};

// Fonction de connexion sécurisée
export const secureLogin = (user: { id: number; username: string; isAdmin: boolean }, res: Response): void => {
  // Générer le token JWT
  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      isAdmin: user.isAdmin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24h
    }, 
    JWT_SECRET
  );

  // Générer le token CSRF
  const csrfToken = generateCSRFToken();

  // Définir les cookies sécurisés
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24h
    path: '/'
  });

  res.cookie('csrfToken', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24h
    path: '/'
  });

  // Envoyer le token CSRF au client (pour les headers)
  res.json({
    status: 'success',
    message: 'Connexion réussie',
    data: {
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      },
      csrfToken: csrfToken // Le client doit l'inclure dans les headers
    }
  });
};

// Fonction de déconnexion sécurisée
export const secureLogout = (req: SecureAuthRequest, res: Response): void => {
  // Nettoyer tous les cookies
  res.clearCookie('authToken');
  res.clearCookie('csrfToken');

  res.json({
    status: 'success',
    message: 'Déconnexion réussie'
  });
};

// Middleware de validation de session
export const validateSession = (req: SecureAuthRequest, res: Response, next: NextFunction) => {
  // Ce middleware s'assure que la session est toujours valide
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Session invalide',
      code: 'INVALID_SESSION'
    });
  }

  // Optionnel : renouveler le token si proche de l'expiration
  const token = req.cookies?.authToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const timeUntilExpiry = decoded.exp * 1000 - Date.now();
      
      // Renouveler si moins de 2h restantes
      if (timeUntilExpiry < 2 * 60 * 60 * 1000) {
        secureLogin(req.user, res);
        return;
      }
    } catch (error) {
      // Token invalide - passer à la déconnexion
    }
  }

  next();
};

export { SecureAuthRequest }; 