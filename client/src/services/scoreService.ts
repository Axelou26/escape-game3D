import { gameApi } from './gameApi';

export type ScoreEventType = 
  | 'ITEM_COLLECTED'
  | 'CODE_CORRECT'
  | 'CODE_INCORRECT'
  | 'BEAKER_SEQUENCE_WRONG'
  | 'BEAKER_SEQUENCE_CORRECT'
  | 'ROOM_CHANGE'
  | 'TIME_PENALTY'
  | 'FINAL_CODE_CORRECT'
  | 'FINAL_CODE_INCORRECT'
  | 'RIDDLE_SOLVED'
  | 'RIDDLE_FAILED';

class ScoreService {
  private currentScore: number = 1000;
  private isOfflineMode: boolean = false;

  // Mettre à jour le score avec un événement
  async updateScore(eventType: ScoreEventType, details?: string): Promise<{ newScore: number; points: number }> {
    try {
      if (this.isOfflineMode) {
        // En mode hors-ligne, utiliser l'ancien système local
        const localPoints = this.getLocalPoints(eventType);
        this.currentScore = Math.max(0, this.currentScore + localPoints);
        return { newScore: this.currentScore, points: localPoints };
      }

      const result = await gameApi.addScoreEvent(eventType, details);
      this.currentScore = result.newScore;
      return { newScore: result.newScore, points: result.points };
    } catch (error) {
      console.warn('Impossible de mettre à jour le score côté serveur, basculement en mode hors-ligne');
      this.isOfflineMode = true;
      
      // Fallback vers le système local
      const localPoints = this.getLocalPoints(eventType);
      this.currentScore = Math.max(0, this.currentScore + localPoints);
      return { newScore: this.currentScore, points: localPoints };
    }
  }

  // Obtenir le score actuel depuis le serveur
  async getCurrentScore(): Promise<{ score: number; elapsedTime: number }> {
    try {
      if (this.isOfflineMode) {
        return { score: this.currentScore, elapsedTime: 0 };
      }

      const result = await gameApi.getCurrentScore();
      this.currentScore = result.score;
      return { score: result.score, elapsedTime: result.elapsedTime };
    } catch (error) {
      console.warn('Impossible de récupérer le score côté serveur');
      this.isOfflineMode = true;
      return { score: this.currentScore, elapsedTime: 0 };
    }
  }

  // Ajouter une pénalité de temps
  async addTimePenalty(elapsedTime: number): Promise<{ penalty: number; newScore: number }> {
    try {
      if (this.isOfflineMode) {
        const penalty = this.calculateLocalTimePenalty(elapsedTime);
        this.currentScore = Math.max(0, this.currentScore + penalty);
        return { penalty, newScore: this.currentScore };
      }

      const result = await gameApi.addTimePenalty(elapsedTime);
      this.currentScore = result.newScore;
      return { penalty: result.penalty, newScore: result.newScore };
    } catch (error) {
      console.warn('Impossible d\'ajouter la pénalité de temps côté serveur');
      this.isOfflineMode = true;
      
      const penalty = this.calculateLocalTimePenalty(elapsedTime);
      this.currentScore = Math.max(0, this.currentScore + penalty);
      return { penalty, newScore: this.currentScore };
    }
  }

  // Points locaux pour le mode hors-ligne (reprend l'ancien système)
  private getLocalPoints(eventType: ScoreEventType): number {
    const localPoints: Record<ScoreEventType, number> = {
      ITEM_COLLECTED: 100,
      CODE_CORRECT: 100,
      CODE_INCORRECT: -20,
      BEAKER_SEQUENCE_WRONG: -10,
      BEAKER_SEQUENCE_CORRECT: 100,
      ROOM_CHANGE: 200,
      TIME_PENALTY: -10,
      FINAL_CODE_CORRECT: 200,
      FINAL_CODE_INCORRECT: -10,
      RIDDLE_SOLVED: 100,
      RIDDLE_FAILED: -10
    };

    return localPoints[eventType] || 0;
  }

  // Calcul local de la pénalité de temps
  private calculateLocalTimePenalty(elapsedTimeInSeconds: number): number {
    const twoMinutesInSeconds = 120;
    const penaltyCount = Math.floor(elapsedTimeInSeconds / twoMinutesInSeconds);
    return penaltyCount * -10; // -10 points toutes les 2 minutes
  }

  // Réinitialiser le service
  reset() {
    this.currentScore = 1000;
    this.isOfflineMode = false;
  }

  // Activer le mode hors-ligne
  setOfflineMode(offline: boolean) {
    this.isOfflineMode = offline;
  }

  // Obtenir l'état du mode hors-ligne
  isOffline(): boolean {
    return this.isOfflineMode;
  }
}

export const scoreService = new ScoreService(); 