import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import User from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'dfrtyrer_5245_dfseFR';

interface JwtPayload {
  userId: number;
  username: string;
  isAdmin: boolean;
}

// Cache simple pour éviter les requêtes répétitives
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        isAdmin: boolean;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Token d\'authentification manquant'
    });
  }

  try {
    // Vérifier le cache d'abord
    const cachedUser = userCache.get(token);
    if (cachedUser && Date.now() - cachedUser.timestamp < CACHE_DURATION) {
      req.user = cachedUser.user;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Si le token contient déjà les infos utilisateur (nouveau format)
    if (decoded.username && decoded.hasOwnProperty('isAdmin')) {
      const user = {
        id: decoded.userId,
        username: decoded.username,
        isAdmin: decoded.isAdmin
      };
      
      // Mettre en cache
      userCache.set(token, { user, timestamp: Date.now() });
      req.user = user;
      return next();
    }
    
    // Fallback pour les anciens tokens - requête DB
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    const userData = {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    };

    // Mettre en cache
    userCache.set(token, { user: userData, timestamp: Date.now() });
    req.user = userData;
    
    next();
  } catch (error) {
    console.error('❌ Erreur de vérification du token:', error);
    return res.status(403).json({
      status: 'error',
      message: 'Token d\'authentification invalide'
    });
  }
};

// Nettoyer le cache périodiquement
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of userCache.entries()) {
    if (now - data.timestamp > CACHE_DURATION) {
      userCache.delete(token);
    }
  }
}, CACHE_DURATION); 