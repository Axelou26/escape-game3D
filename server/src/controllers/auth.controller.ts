import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import bcrypt from 'bcrypt';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'dfrtyrer_5245_dfseFR';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Données reçues dans register:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError(400, 'Le nom d\'utilisateur et le mot de passe sont requis');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new AppError(400, 'Un utilisateur avec ce nom d\'utilisateur existe déjà');
    }

    // Créer le nouvel utilisateur
    const user = await User.create({
      username,
      password,
      isAdmin: false
    });

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      status: 'success',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Données reçues dans login:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError(400, 'Le nom d\'utilisateur et le mot de passe sont requis');
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new AppError(401, 'Nom d\'utilisateur ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Nom d\'utilisateur ou mot de passe incorrect');
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      status: 'success',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (
  req: Request,
  res: Response
) => {
  res.json({
    status: 'success',
    message: 'Déconnexion réussie'
  });
}; 