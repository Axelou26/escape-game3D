import { Request, Response } from 'express';
import Game from '../models/game.model';
import ScoreEvent, { ScoreEventType, SCORE_POINTS } from '../models/score-event.model';
import { AppError } from '../middleware/errorHandler';

export const scoreController = {
  // Ajouter un événement de score
  async addScoreEvent(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const { eventType, details } = req.body;

      if (!eventType || !Object.keys(SCORE_POINTS).includes(eventType)) {
        throw new AppError(400, 'Type d\'événement invalide');
      }

      // Trouver la partie en cours
      const game = await Game.findOne({
        where: {
          userId: req.user.id,
          isCompleted: false
        }
      });

      if (!game) {
        throw new AppError(404, 'Aucune partie en cours');
      }

      const points = SCORE_POINTS[eventType as ScoreEventType];

      // Créer l'événement de score
      const scoreEvent = await ScoreEvent.create({
        gameId: game.id,
        eventType: eventType as ScoreEventType,
        points,
        details: details || `Événement: ${eventType}`
      });

      // Mettre à jour le score du jeu
      const newScore = Math.max(0, game.score + points);
      await game.update({ score: newScore });

      res.json({
        status: 'success',
        data: {
          eventId: scoreEvent.id,
          eventType,
          points,
          newScore,
          details: scoreEvent.details
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Erreur addScoreEvent:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de l\'ajout de l\'événement de score'
      });
    }
  },

  // Obtenir l'historique des scores
  async getScoreHistory(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const game = await Game.findOne({
        where: {
          userId: req.user.id,
          isCompleted: false
        },
        include: [{
          model: ScoreEvent,
          as: 'ScoreEvents',
          order: [['timestamp', 'DESC']]
        }]
      });

      if (!game) {
        throw new AppError(404, 'Aucune partie en cours');
      }

      res.json({
        status: 'success',
        data: {
          currentScore: game.score,
          events: game.ScoreEvents || []
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Erreur getScoreHistory:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération de l\'historique des scores'
      });
    }
  },

  // Calculer la pénalité de temps
  async addTimePenalty(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const { elapsedTime } = req.body;

      if (typeof elapsedTime !== 'number') {
        throw new AppError(400, 'Temps écoulé invalide');
      }

      const game = await Game.findOne({
        where: {
          userId: req.user.id,
          isCompleted: false
        }
      });

      if (!game) {
        throw new AppError(404, 'Aucune partie en cours');
      }

      // Calculer la pénalité (toutes les 2 minutes)
      const twoMinutesInSeconds = 120;
      const penaltyCount = Math.floor(elapsedTime / twoMinutesInSeconds);
      const totalPenalty = penaltyCount * SCORE_POINTS.TIME_PENALTY;

      if (totalPenalty < 0) {
        // Créer l'événement de pénalité
        await ScoreEvent.create({
          gameId: game.id,
          eventType: 'TIME_PENALTY',
          points: totalPenalty,
          details: `Pénalité de temps après ${Math.floor(elapsedTime / 60)} minutes`
        });

        // Mettre à jour le score
        const newScore = Math.max(0, game.score + totalPenalty);
        await game.update({ 
          score: newScore,
          currentElapsedTime: elapsedTime 
        });

        res.json({
          status: 'success',
          data: {
            penalty: totalPenalty,
            newScore,
            elapsedTime
          }
        });
      } else {
        // Juste mettre à jour le temps sans pénalité
        await game.update({ currentElapsedTime: elapsedTime });
        
        res.json({
          status: 'success',
          data: {
            penalty: 0,
            newScore: game.score,
            elapsedTime
          }
        });
      }
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Erreur addTimePenalty:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de l\'ajout de la pénalité de temps'
      });
    }
  },

  // Obtenir le score actuel
  async getCurrentScore(req: Request, res: Response) {
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
        throw new AppError(404, 'Aucune partie en cours');
      }

      res.json({
        status: 'success',
        data: {
          score: game.score,
          elapsedTime: game.currentElapsedTime,
          gameId: game.id
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Erreur getCurrentScore:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération du score actuel'
      });
    }
  }
}; 