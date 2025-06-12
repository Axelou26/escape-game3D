import { Express } from 'express';
import authRoutes from './auth.routes';
import gameRoutes from './game.routes';
import leaderboardRoutes from './leaderboard.routes';

export const setupRoutes = (app: Express) => {
  // Route racine
  app.get('/', (req, res) => {
    res.json({
      message: 'Bienvenue sur l\'API de l\'Escape Game',
      endpoints: {
        auth: '/api/auth',
        game: '/api/game',
        leaderboard: '/api/leaderboard',
        health: '/api/health'
      }
    });
  });

  // Routes d'authentification
  app.use('/api/auth', authRoutes);

  // Routes du jeu
  app.use('/api/game', gameRoutes);

  // Routes du leaderboard
  app.use('/api/leaderboard', leaderboardRoutes);

  // Route de test pour vérifier que l'API fonctionne
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API opérationnelle' });
  });
}; 