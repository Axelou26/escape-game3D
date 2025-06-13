import { Request, Response } from 'express';
import Riddle from '../models/riddle.model';
import Game from '../models/game.model';
import ScoreEvent, { ScoreEventType, SCORE_POINTS } from '../models/score-event.model';
import { AppError } from '../utils/error';

export const riddleController = {
  // Obtenir toutes les énigmes d'une salle
  async getRiddlesByRoom(req: Request, res: Response) {
    try {
      const { roomId } = req.params;

      const riddles = await Riddle.findAll({
        where: {
          roomId,
          isActive: true
        },
        attributes: ['id', 'name', 'description', 'position', 'points']
      });

      res.json({
        status: 'success',
        data: riddles
      });
    } catch (error) {
      console.error('Erreur getRiddlesByRoom:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération des énigmes'
      });
    }
  },

  // Obtenir le contenu d'une énigme spécifique
  async getRiddleContent(req: Request, res: Response) {
    try {
      const { riddleId } = req.params;

      const riddle = await Riddle.findByPk(riddleId);

      if (!riddle) {
        throw new AppError(404, 'Énigme non trouvée');
      }

      res.json({
        status: 'success',
        data: {
          id: riddle.id,
          name: riddle.name,
          content: riddle.content,
          points: riddle.points
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Erreur getRiddleContent:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération du contenu de l\'énigme'
      });
    }
  },

  // Valider la réponse à une énigme
  async validateRiddleAnswer(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const { riddleId } = req.params;
      const { answer } = req.body;

      if (!answer || typeof answer !== 'string') {
        throw new AppError(400, 'Réponse invalide');
      }

      // Trouver l'énigme
      const riddle = await Riddle.findByPk(riddleId);
      if (!riddle) {
        throw new AppError(404, 'Énigme non trouvée');
      }

      // Trouver la partie en cours de l'utilisateur
      const game = await Game.findOne({
        where: {
          userId: req.user.id,
          isCompleted: false
        }
      });

      if (!game) {
        throw new AppError(404, 'Aucune partie en cours');
      }

      // Vérifier la réponse (insensible à la casse)
      const isCorrect = answer.toLowerCase().trim() === riddle.content.answer.toLowerCase().trim();
      
      const eventType: ScoreEventType = isCorrect ? 'RIDDLE_SOLVED' : 'RIDDLE_FAILED';
      const points = isCorrect ? riddle.points : SCORE_POINTS.RIDDLE_FAILED;

      // Créer l'événement de score
      await ScoreEvent.create({
        gameId: game.id,
        eventType,
        points,
        details: `Énigme ${riddle.name}: ${isCorrect ? 'Résolue' : 'Échouée'}`
      });

      // Mettre à jour le score du jeu
      const newScore = Math.max(0, game.score + points);
      await game.update({ score: newScore });

      res.json({
        status: 'success',
        data: {
          correct: isCorrect,
          points,
          newScore,
          message: isCorrect ? 
            `Bravo ! Énigme résolue (+${riddle.points} points)` : 
            `Mauvaise réponse (${SCORE_POINTS.RIDDLE_FAILED} points)`
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Erreur validateRiddleAnswer:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la validation de la réponse'
      });
    }
  },

  // Obtenir un indice pour une énigme
  async getHint(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const { riddleId } = req.params;

      const riddle = await Riddle.findByPk(riddleId);
      if (!riddle) {
        throw new AppError(404, 'Énigme non trouvée');
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

      // Pénalité pour demander un indice
      const hintPenalty = -30;
      
      await ScoreEvent.create({
        gameId: game.id,
        eventType: 'RIDDLE_FAILED', // Utiliser ce type pour les pénalités
        points: hintPenalty,
        details: `Indice demandé pour l'énigme ${riddle.name}`
      });

      // Mettre à jour le score
      const newScore = Math.max(0, game.score + hintPenalty);
      await game.update({ score: newScore });

      res.json({
        status: 'success',
        data: {
          hint: riddle.content.hint || 'Aucun indice disponible pour cette énigme',
          penaltyPoints: hintPenalty,
          newScore
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Erreur getHint:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération de l\'indice'
      });
    }
  }
}; 