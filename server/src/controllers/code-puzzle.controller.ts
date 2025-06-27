import { Request, Response } from 'express';
import CodePuzzle from '../models/code-puzzle.model';
import Game from '../models/game.model';
import ScoreEvent, { ScoreEventType, SCORE_POINTS } from '../models/score-event.model';
import { AppError } from '../middleware/errorHandler';

export const codePuzzleController = {
  // Obtenir tous les codes/puzzles d'une salle
  async getCodePuzzlesByRoom(req: Request, res: Response) {
    try {
      const { roomId } = req.params;

      const puzzles = await CodePuzzle.findAll({
        where: {
          roomId,
          isActive: true
        },
        attributes: ['id', 'objectId', 'name', 'type', 'description', 'hints', 'points']
      });

      res.json({
        status: 'success',
        data: puzzles
      });
    } catch (error) {
      console.error('Erreur getCodePuzzlesByRoom:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération des puzzles'
      });
    }
  },

  // Valider un code
  async validateCode(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const { puzzleId } = req.params;
      const { code } = req.body;

      if (!code || typeof code !== 'string') {
        throw new AppError(400, 'Code invalide');
      }

      // Trouver le puzzle
      const puzzle = await CodePuzzle.findByPk(puzzleId);
      if (!puzzle) {
        throw new AppError(404, 'Puzzle non trouvé');
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

      // Vérifier le code
      const isCorrect = code.trim() === puzzle.solution.trim();
      
      const eventType: ScoreEventType = isCorrect ? 'CODE_CORRECT' : 'CODE_INCORRECT';
      const points = isCorrect ? puzzle.points : puzzle.penaltyPoints;

      // Créer l'événement de score
      await ScoreEvent.create({
        gameId: game.id,
        eventType,
        points,
        details: `Code ${puzzle.name} (${puzzle.objectId}): ${isCorrect ? 'Correct' : 'Incorrect'}`
      });

      // Mettre à jour le score
      const newScore = Math.max(0, game.score + points);
      await game.update({ score: newScore });

      res.json({
        status: 'success',
        data: {
          correct: isCorrect,
          points,
          newScore,
          message: isCorrect ? 
            `Code correct ! (+${puzzle.points} points)` : 
            `Code incorrect (${puzzle.penaltyPoints} points)`,
          objectId: puzzle.objectId
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Erreur validateCode:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la validation du code'
      });
    }
  },

  // Obtenir un indice pour un puzzle
  async getPuzzleHint(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const { puzzleId } = req.params;

      const puzzle = await CodePuzzle.findByPk(puzzleId);
      if (!puzzle) {
        throw new AppError(404, 'Puzzle non trouvé');
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
      const hintPenalty = -25;
      
      await ScoreEvent.create({
        gameId: game.id,
        eventType: 'CODE_INCORRECT', // Utiliser ce type pour les pénalités
        points: hintPenalty,
        details: `Indice demandé pour le puzzle ${puzzle.name}`
      });

      // Mettre à jour le score
      const newScore = Math.max(0, game.score + hintPenalty);
      await game.update({ score: newScore });

      res.json({
        status: 'success',
        data: {
          hints: puzzle.hints.hints,
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

      console.error('Erreur getPuzzleHint:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération de l\'indice'
      });
    }
  }
}; 