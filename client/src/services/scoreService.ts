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
  private currentScore: number = 0;

  // Mettre à jour le score avec un événement  côté serveur
  async updateScore(eventType: ScoreEventType, details?: string): Promise<{ newScore: number; points: number }> {
    try {
      const result = await gameApi.addScoreEvent(eventType, details);
      this.currentScore = result.newScore;
      return { newScore: result.newScore, points: result.points };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du score:', error);
      throw new Error('Impossible de mettre à jour le score. Connexion requise.');
    }
  }

  // Obtenir le score actuel depuis le serveur
  async getCurrentScore(): Promise<{ score: number; elapsedTime: number }> {
    try {
      const result = await gameApi.getCurrentScore();
      this.currentScore = result.score;
      return { score: result.score, elapsedTime: result.elapsedTime };
    } catch (error) {
      console.error('Erreur lors de la récupération du score:', error);
      throw new Error('Impossible de récupérer le score. Connexion requise.');
    }
  }

  // Ajouter une pénalité de temps côté serveur
  async addTimePenalty(elapsedTime: number): Promise<{ penalty: number; newScore: number }> {
    try {
      const result = await gameApi.addTimePenalty(elapsedTime);
      this.currentScore = result.newScore;
      return { penalty: result.penalty, newScore: result.newScore };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la pénalité:', error);
      throw new Error('Impossible d\'ajouter la pénalité. Connexion requise.');
    }
  }

  // Réinitialiser le service
  reset() {
    this.currentScore = 0;
  }

  // Obtenir le score local (lecture seule, pour affichage uniquement)
  getLocalScore(): number {
    return this.currentScore;
  }
}

export const scoreService = new ScoreService(); 