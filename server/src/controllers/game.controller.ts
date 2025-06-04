import { Request, Response } from 'express';
import Game from '../models/game.model';
import { AppError } from '../utils/error';
import { User } from '../models/user.model';
import { ValidationError } from 'sequelize';

interface SequelizeError extends Error {
  name: string;
  errors?: Array<{ message: string }>;
}

export const gameController = {
  // Démarrer une nouvelle partie
  async startGame(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const newGame = await Game.create({
        userId: req.user.id,
        startTime: new Date(),
        score: 1000,
        currentElapsedTime: 0,
        isCompleted: false,
        gameState: {
          currentRoom: 'library',
          inventory: [],
          score: 1000,
          elapsedTime: 0
        }
      });

      res.json({
        status: 'success',
        data: {
          gameId: newGame.id,
          gameState: newGame.gameState
        }
      });
    } catch (error) {
      console.error('Erreur startGame:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors du démarrage de la partie',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  },

  // Obtenir la partie en cours
  async getCurrentGame(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const game = await Game.findOne({
        where: {
          userId: req.user.id,
          isCompleted: false
        }
      });

      if (!game) {
        return res.status(404).json({
          status: 'error',
          message: 'Aucune partie en cours trouvée'
        });
      }

      res.json({
        status: 'success',
        data: {
          gameId: game.id,
          gameState: game.gameState
        }
      });
    } catch (error) {
      console.error('Erreur getCurrentGame:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération de la partie',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  },

  // Sauvegarder l'état de la partie
  async saveGame(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const { currentScore, currentElapsedTime, gameState } = req.body;

      // Validation des données reçues
      if (typeof currentScore !== 'number') {
        throw new AppError(400, 'Le score doit être un nombre');
      }
      if (typeof currentElapsedTime !== 'number') {
        throw new AppError(400, 'Le temps écoulé doit être un nombre');
      }
      if (!gameState || typeof gameState !== 'object') {
        throw new AppError(400, 'L\'état du jeu est invalide');
      }

      const game = await Game.findOne({
        where: {
          userId: req.user.id,
          isCompleted: false
        }
      });

      if (!game) {
        throw new AppError(404, 'Partie non trouvée');
      }

      await game.update({
        score: currentScore,
        currentElapsedTime,
        gameState
      });

      res.json({
        status: 'success',
        data: {
          gameId: game.id,
          gameState: game.gameState
        }
      });
    } catch (error: unknown) {
      console.error('Erreur saveGame:', error);
      
      // Si c'est une erreur de validation Sequelize
      if (error instanceof ValidationError) {
        return res.status(400).json({
          status: 'error',
          message: 'Données invalides',
          details: error.errors.map(e => e.message)
        });
      }
      
      // Si c'est notre AppError personnalisée
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }
      
      // Pour toute autre erreur
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la sauvegarde de la partie',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  },

  // Terminer la partie
  async endGame(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const game = await Game.findOne({
        where: {
          userId: req.user.id,
          isCompleted: false
        }
      });

      if (!game) {
        throw new AppError(404, 'Partie non trouvée');
      }

      await game.update({
        isCompleted: true
      });

      res.json({
        status: 'success',
        data: {
          finalScore: game.score,
          totalTime: game.currentElapsedTime
        }
      });
    } catch (error) {
      console.error('Erreur endGame:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la fin de la partie',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  },

  // Obtenir le classement
  async getLeaderboard(req: Request, res: Response) {
    try {
      const leaderboard = await Game.findAll({
        where: { isCompleted: true },
        include: [{
          model: User,
          attributes: ['username']
        }],
        order: [
          ['score', 'DESC'],
          ['currentElapsedTime', 'ASC']
        ],
        limit: 10,
        attributes: ['score', 'currentElapsedTime']
      });

      res.json({
        status: 'success',
        data: leaderboard.map((entry: any) => ({
          username: entry.User.username,
          score: entry.score,
          time: entry.currentElapsedTime
        }))
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération du classement'
      });
    }
  }
}; 