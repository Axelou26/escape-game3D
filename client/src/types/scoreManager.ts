// Types pour le système de score
export type ScoreEventType = 
  | 'ITEM_COLLECTED'
  | 'CODE_CORRECT'
  | 'CODE_INCORRECT'
  | 'BEAKER_SEQUENCE_WRONG'
  | 'BEAKER_SEQUENCE_CORRECT'
  | 'ROOM_CHANGE'
  | 'TIME_PENALTY'
  | 'FINAL_CODE_CORRECT'
  | 'FINAL_CODE_INCORRECT';

// Points associés à chaque événement
export const ScoreEvents: Record<ScoreEventType, number> = {
  ITEM_COLLECTED: 100,
  CODE_CORRECT: 100,
  CODE_INCORRECT: -20,
  BEAKER_SEQUENCE_WRONG: -10,
  BEAKER_SEQUENCE_CORRECT: 100,
  ROOM_CHANGE: 200,
  TIME_PENALTY: -10, // Toutes les 2 minutes
  FINAL_CODE_CORRECT: 200, // Code final de la chambre secrète
  FINAL_CODE_INCORRECT: -10 // Tentative échouée du code final
};

/**
 * Calcule la pénalité de score basée sur le temps écoulé
 * @param elapsedTimeInSeconds Temps écoulé en secondes
 * @returns La pénalité de score
 */
export const calculateTimeBasedPenalty = (elapsedTimeInSeconds: number): number => {
  const twoMinutesInSeconds = 120;
  const penaltyCount = Math.floor(elapsedTimeInSeconds / twoMinutesInSeconds);
  const penalty = penaltyCount * ScoreEvents.TIME_PENALTY;
  console.log('Calcul de la pénalité de temps:', {
    temps: elapsedTimeInSeconds,
    nombrePénalités: penaltyCount,
    pénalité: penalty
  });
  return penalty;
};

/**
 * Met à jour le score en fonction de l'événement
 * @param currentScore Score actuel
 * @param event Type d'événement
 * @returns Le nouveau score
 */
export const updateScore = (
  currentScore: number,
  event: ScoreEventType
): number => {
  // Appliquer les points en fonction de l'événement
  const eventPoints = ScoreEvents[event];
  const newScore = currentScore + eventPoints;
  
  console.log('Mise à jour du score:', {
    événement: event,
    points: eventPoints,
    scoreAvant: currentScore,
    scoreAprès: newScore
  });

  // Empêcher le score d'être négatif
  return Math.max(0, newScore);
}; 