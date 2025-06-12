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
      console.log('Récupération du classement...');
      
      // Récupérer les parties terminées avec les informations des joueurs
      const completedGames = await Game.findAll({
        where: {
          isCompleted: true,
          // Vérifier que le gameState indique bien que le joueur est dans la dernière salle
          gameState: {
            currentRoom: 'secret-chamber' // La salle finale du jeu
          }
        },
        include: [{
          model: User,
          attributes: ['username'],
          as: 'User',
          required: true // S'assurer que l'utilisateur existe toujours
        }],
        order: [
          ['score', 'DESC'],
          ['currentElapsedTime', 'ASC']
        ],
        limit: 10
      });

      console.log('Parties terminées trouvées:', completedGames.length);

      // Formater les données pour le classement
      const leaderboard = completedGames.map(game => ({
        username: game.User?.username || 'Joueur Anonyme',
        score: game.score,
        completionTime: game.currentElapsedTime
      }));

      console.log('Leaderboard formaté:', leaderboard);

      // S'assurer que la réponse est bien en JSON
      res.setHeader('Content-Type', 'application/json');
      res.json({
        status: 'success',
        leaderboard
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      // S'assurer que l'erreur est aussi en JSON
      res.setHeader('Content-Type', 'application/json');
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

      // Vérifier si le joueur a vraiment terminé le jeu
      if (!req.body.gameState || req.body.gameState.currentRoom !== 'secret-chamber') {
        return res.status(400).json({
          status: 'error',
          message: 'Le jeu n\'est pas terminé'
        });
      }

      // Vérifier si une partie terminée existe déjà pour cet utilisateur
      const existingGame = await Game.findOne({
        where: {
          userId,
          isCompleted: true,
          gameState: {
            currentRoom: 'secret-chamber'
          }
        }
      });

      if (existingGame) {
        // Mettre à jour le score si c'est meilleur
        if (score > existingGame.score || 
           (score === existingGame.score && completionTime < existingGame.currentElapsedTime)) {
          await existingGame.update({
            score,
            currentElapsedTime: completionTime,
            gameState: {
              ...existingGame.gameState,
              score,
              elapsedTime: completionTime
            }
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