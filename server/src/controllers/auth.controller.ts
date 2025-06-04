import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError(400, 'Un utilisateur avec cet email existe déjà');
    }

    // Créer le nouvel utilisateur
    const user = await User.create({
      username,
      email,
      password,
      isAdmin: false // Ajout de la propriété isAdmin avec une valeur par défaut
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
    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError(401, 'Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Email ou mot de passe incorrect');
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