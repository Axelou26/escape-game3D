import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import User from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'dfrtyrer_5245_dfseFR';

interface JwtPayload {
  userId: number;
}

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
  console.log('🔍 Vérification du token...');
  console.log('En-têtes reçus:', req.headers);
  
  const authHeader = req.headers['authorization'];
  console.log('En-tête Authorization:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token extrait:', token ? `${token.substring(0, 20)}...` : 'Aucun token');

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Token d\'authentification manquant'
    });
  }

  try {
    console.log('Tentative de vérification du token avec JWT_SECRET:', JWT_SECRET ? 'Secret défini' : 'Secret manquant');
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log('Token décodé:', decoded);
    
    const user = await User.findByPk(decoded.userId);
    console.log('Utilisateur trouvé:', user ? 'Oui' : 'Non');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    req.user = {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    };
    
    console.log('✅ Authentification réussie pour:', user.username);
    next();
  } catch (error) {
    console.error('❌ Erreur de vérification du token:', error);
    return res.status(403).json({
      status: 'error',
      message: 'Token d\'authentification invalide'
    });
  }
}; 