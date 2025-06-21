import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import Game from '../models/game.model';
import ScoreEvent from '../models/score-event.model';
import { GAME_CONFIG } from '../config/gameConfig';

// Cache pour limiter les requêtes fréquentes du même utilisateur
const lastRequestTime = new Map<number, number>();
const REQUEST_COOLDOWN = 10000; // 10 secondes minimum entre les requêtes du même utilisateur (réduit de 30s)

export const timerController = {
  // Synchroniser le timer avec le serveur
  async syncTimer(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      // PROTECTION: Vérifier si l'utilisateur fait trop de requêtes
      const userId = req.user.id;
      const now = Date.now();
      const lastRequest = lastRequestTime.get(userId);
      
      if (lastRequest && (now - lastRequest) < REQUEST_COOLDOWN) {
        return res.status(429).json({
          status: 'error',
          message: 'Trop de requêtes. Veuillez patienter.'
        });
      }
      
      lastRequestTime.set(userId, now);

      const { clientElapsedTime } = req.body;

      if (typeof clientElapsedTime !== 'number' || clientElapsedTime < 0) {
        throw new AppError(400, 'Temps écoulé invalide');
      }

      const game = await Game.findOne({
        where: { userId: req.user.id, isCompleted: false }
      });

      if (!game) {
        throw new AppError(404, 'Partie non trouvée');
      }

      // Calculer le temps réel écoulé depuis le début de la partie
      const startTime = new Date(game.startTime).getTime();
      const currentTime = Date.now();
      const serverElapsedTime = Math.floor((currentTime - startTime) / 1000);

      // Vérifier si le temps client est cohérent (tolérance de 10 secondes)
      const timeDifference = Math.abs(serverElapsedTime - clientElapsedTime);
      if (timeDifference > 10) {
        console.warn(`Désynchronisation temporelle détectée pour l'utilisateur ${req.user.id}: client=${clientElapsedTime}s, serveur=${serverElapsedTime}s`);
      }

      // Utiliser le temps serveur comme référence
      const validElapsedTime = serverElapsedTime;

      // Vérifier la limite de temps de jeu
      if (validElapsedTime > GAME_CONFIG.LIMITS.MAX_GAME_DURATION) {
        // Terminer automatiquement la partie
        await game.update({
          isCompleted: true,
          currentElapsedTime: GAME_CONFIG.LIMITS.MAX_GAME_DURATION
        });

        return res.json({
          status: 'game_ended',
          message: 'Temps de jeu dépassé, partie terminée automatiquement',
          elapsedTime: GAME_CONFIG.LIMITS.MAX_GAME_DURATION,
          gameEnded: true
        });
      }

      // Calculer les pénalités de temps
      const penaltyIntervals = Math.floor(validElapsedTime / GAME_CONFIG.TIMER.TIME_PENALTY_INTERVAL);
      const lastPenaltyIntervals = Math.floor(game.currentElapsedTime / GAME_CONFIG.TIMER.TIME_PENALTY_INTERVAL);
      
      let newScore = game.score;
      let penaltiesApplied = 0;

      // Appliquer les nouvelles pénalités
      if (penaltyIntervals > lastPenaltyIntervals) {
        const newPenalties = penaltyIntervals - lastPenaltyIntervals;
        const totalPenalty = newPenalties * GAME_CONFIG.TIMER.TIME_PENALTY_POINTS;
        newScore = Math.max(GAME_CONFIG.LIMITS.MIN_SCORE, game.score + totalPenalty);
        penaltiesApplied = newPenalties;

        // Enregistrer les événements de pénalité
        for (let i = 0; i < newPenalties; i++) {
          await ScoreEvent.create({
            gameId: game.id,
            eventType: 'TIME_PENALTY',
            points: GAME_CONFIG.TIMER.TIME_PENALTY_POINTS,
            details: `Pénalité de temps après ${(lastPenaltyIntervals + i + 1) * GAME_CONFIG.TIMER.TIME_PENALTY_INTERVAL} secondes`
          });
        }
      }

      // Mettre à jour la partie
      await game.update({
        currentElapsedTime: validElapsedTime,
        score: newScore
      });

      res.json({
        status: 'success',
        elapsedTime: validElapsedTime,
        score: newScore,
        penaltiesApplied,
        timeDifference: timeDifference > 10 ? timeDifference : 0,
        nextPenaltyIn: GAME_CONFIG.TIMER.TIME_PENALTY_INTERVAL - (validElapsedTime % GAME_CONFIG.TIMER.TIME_PENALTY_INTERVAL)
      });

    } catch (error) {
      console.error('Erreur syncTimer:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la synchronisation du timer'
      });
    }
  },

  // Obtenir le temps actuel de la partie
  async getCurrentTime(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      // PROTECTION: Vérifier si l'utilisateur fait trop de requêtes
      const userId = req.user.id;
      const now = Date.now();
      const lastRequest = lastRequestTime.get(userId);
      
      if (lastRequest && (now - lastRequest) < REQUEST_COOLDOWN) {
        return res.status(429).json({
          status: 'error',
          message: 'Trop de requêtes. Veuillez patienter.'
        });
      }
      
      lastRequestTime.set(userId, now);

      const game = await Game.findOne({
        where: { userId: req.user.id, isCompleted: false }
      });

      if (!game) {
        throw new AppError(404, 'Partie non trouvée');
      }

      // Calculer le temps réel écoulé
      const startTime = new Date(game.startTime).getTime();
      const currentTime = Date.now();
      const elapsedTime = Math.floor((currentTime - startTime) / 1000);

      // Calculer le temps restant
      const remainingTime = Math.max(0, GAME_CONFIG.LIMITS.MAX_GAME_DURATION - elapsedTime);
      
      // Calculer le temps jusqu'à la prochaine pénalité
      const nextPenaltyIn = GAME_CONFIG.TIMER.TIME_PENALTY_INTERVAL - (elapsedTime % GAME_CONFIG.TIMER.TIME_PENALTY_INTERVAL);

      res.json({
        status: 'success',
        elapsedTime,
        remainingTime,
        nextPenaltyIn,
        maxDuration: GAME_CONFIG.LIMITS.MAX_GAME_DURATION,
        penaltyInterval: GAME_CONFIG.TIMER.TIME_PENALTY_INTERVAL
      });

    } catch (error) {
      console.error('Erreur getCurrentTime:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération du temps'
      });
    }
  },

  // Pause/Resume (pour les fonctionnalités futures)
  async pauseGame(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const game = await Game.findOne({
        where: { userId: req.user.id, isCompleted: false }
      });

      if (!game) {
        throw new AppError(404, 'Partie non trouvée');
      }

      // Pour l'instant, on enregistre juste l'événement
      // Dans une version future, on pourrait implémenter une vraie pause
      await ScoreEvent.create({
        gameId: game.id,
        eventType: 'TIME_PENALTY', // Utiliser un type existant pour l'instant
        points: 0,
        details: 'Jeu mis en pause'
      });

      res.json({
        status: 'success',
        message: 'Pause enregistrée (fonctionnalité en développement)'
      });

    } catch (error) {
      console.error('Erreur pauseGame:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la pause'
      });
    }
  }
}; 