import { Express } from 'express';
import authRoutes from './auth.routes';
import gameRoutes from './game.routes';

export const setupRoutes = (app: Express) => {
  // Route racine
  app.get('/', (req, res) => {
    res.json({
      message: 'Bienvenue sur l\'API de l\'Escape Game',
      endpoints: {
        auth: '/api/auth',
        game: '/api/game',
        health: '/api/health'
      }
    });
  });

  // Routes d'authentification
  app.use('/api/auth', authRoutes);

  // Routes du jeu
  app.use('/api/game', gameRoutes);

  // Route de test pour vérifier que l'API fonctionne
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API opérationnelle' });
  });
}; 