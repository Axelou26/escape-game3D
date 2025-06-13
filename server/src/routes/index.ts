import { Express } from 'express';
import authRoutes from './auth.routes';
import gameRoutes from './game.routes';
import leaderboardRoutes from './leaderboard.routes';
import gameStateRoutes from './game-state.routes';
import riddleRoutes from './riddle.routes';
import codePuzzleRoutes from './code-puzzle.routes';
import scoreRoutes from './score.routes';

export const setupRoutes = (app: Express) => {
  // Route racine
  app.get('/', (req, res) => {
    res.json({
      message: 'Bienvenue sur l\'API de l\'Escape Game',
      endpoints: {
        auth: '/api/auth',
        game: '/api/game',
        leaderboard: '/api/leaderboard',
        gameState: '/api/game-state',
        riddles: '/api/riddles',
        codes: '/api/codes',
        score: '/api/score',
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

  // Routes de gestion d'état de jeu
  app.use('/api/game-state', gameStateRoutes);

  // Routes des énigmes
  app.use('/api/riddles', riddleRoutes);

  // Routes des codes/puzzles
  app.use('/api/codes', codePuzzleRoutes);

  // Routes du scoring
  app.use('/api/score', scoreRoutes);

  // Route de test pour vérifier que l'API fonctionne
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API opérationnelle' });
  });
}; 