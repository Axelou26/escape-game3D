import { Request, Response } from 'express';
import Game from '../models/game.model';
import User from '../models/user.model';
import { Op } from 'sequelize';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    isAdmin: boolean;
  };
}

export class LeaderboardController {
  public async getLeaderboard(req: Request, res: Response) {
    try {
      // Récupérer les parties terminées avec les informations des joueurs
      const completedGames = await Game.findAll({
        where: {
          isCompleted: true
        },
        include: [{
          model: User,
          attributes: ['username'],
          as: 'User'
        }],
        order: [
          ['score', 'DESC'],
          ['currentElapsedTime', 'ASC']
        ],
        limit: 10
      });

      // Formater les données pour le classement
      const leaderboard = completedGames.map(game => ({
        username: (game as any).User?.username || 'Joueur Anonyme',
        score: game.score,
        completionTime: game.currentElapsedTime
      }));

      res.json({
        status: 'success',
        leaderboard
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération du classement'
      });
    }
  }

  public async addScore(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Utilisateur non authentifié'
        });
      }

      const { score, completionTime } = req.body;

      // Vérifier si une partie terminée existe déjà pour cet utilisateur
      const existingGame = await Game.findOne({
        where: {
          userId,
          isCompleted: true
        }
      });

      if (existingGame) {
        // Mettre à jour le score si c'est meilleur
        if (score > existingGame.score || 
           (score === existingGame.score && completionTime < existingGame.currentElapsedTime)) {
          await existingGame.update({
            score,
            currentElapsedTime: completionTime
          });
        }
      } else {
        // Créer une nouvelle entrée
        await Game.create({
          userId,
          score,
          currentElapsedTime: completionTime,
          isCompleted: true,
          startTime: new Date(),
          gameState: {
            currentRoom: 'secret-chamber',
            inventory: [],
            score,
            elapsedTime: completionTime
          }
        });
      }

      res.json({
        status: 'success',
        message: 'Score enregistré avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du score:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de l\'enregistrement du score'
      });
    }
  }
} 