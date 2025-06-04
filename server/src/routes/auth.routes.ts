import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Validation pour l'inscription
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  body('email')
    .isEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  validateRequest
];

// Validation pour la connexion
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide'),
  body('password')
    .exists()
    .withMessage('Mot de passe requis'),
  validateRequest
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);

export default router; 