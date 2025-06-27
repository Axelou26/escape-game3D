import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout } from '../controllers/auth.controller';
import { handleValidationErrors } from '../middleware/dataValidation';

const router = Router();

// Validation pour l'inscription
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  handleValidationErrors
];

// Validation pour la connexion
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Nom d\'utilisateur requis'),
  body('password')
    .exists()
    .withMessage('Mot de passe requis'),
  handleValidationErrors
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);

export default router; 