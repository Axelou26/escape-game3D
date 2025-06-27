import { Request, Response } from 'express';
import Game from '../models/game.model';
import User from '../models/user.model';

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
          isCompleted: true,
          // Vérifier que le gameState indique bien que le joueur est dans la dernière salle
          gameState: {
            currentRoom: 'secret-chamber' 
          }
        },
        include: [{
          model: User,
          attributes: ['username'],
          as: 'User',
          required: true 
        }],
        order: [
          ['score', 'DESC'],
          ['currentElapsedTime', 'ASC']
        ],
        limit: 10
      });

      // Formater les données pour le classement
      const leaderboard = completedGames.map((game: any) => ({
        username: game.User?.username || 'Joueur Anonyme',
        score: game.score,
        completionTime: game.currentElapsedTime
      }));

    
      res.setHeader('Content-Type', 'application/json');
      res.json({
        status: 'success',
        leaderboard
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      
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
              currentRoom: 'secret-chamber',
              inventory: (existingGame.gameState as any).inventory || [],
              score,
              elapsedTime: completionTime,
              microscopeEnigmeResolved: true,
              periodicTableUnlocked: true,
              unlockedRooms: ['library', 'laboratory', 'secret-chamber'],
              computerUnlocked: true,
              gameCompleted: true,
              artifactUnlocked: true,
              hintsUsed: (existingGame.gameState as any).hintsUsed || 0,
              attemptsCount: (existingGame.gameState as any).attemptsCount || 0,
              solvedPuzzles: (existingGame.gameState as any).solvedPuzzles || []
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
            elapsedTime: completionTime,
            microscopeEnigmeResolved: true,
            periodicTableUnlocked: true,
            unlockedRooms: ['library', 'laboratory', 'secret-chamber'],
            computerUnlocked: true,
            gameCompleted: true,
            artifactUnlocked: true,
            hintsUsed: 0,
            attemptsCount: 0,
            solvedPuzzles: []
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