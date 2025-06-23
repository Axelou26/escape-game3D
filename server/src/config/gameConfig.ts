// Configuration centralisée du jeu d'évasion
export const GAME_CONFIG = {
  // Scoring
  INITIAL_SCORE: 1000,
  SCORE_POINTS: {
    ITEM_COLLECTED: 100,
    CODE_CORRECT: 100,
    CODE_INCORRECT: -20,
    BEAKER_SEQUENCE_WRONG: -10,
    BEAKER_SEQUENCE_CORRECT: 100,
    ROOM_CHANGE: 200,
    TIME_PENALTY: -30,
    FINAL_CODE_CORRECT: 200,
    FINAL_CODE_INCORRECT: -10,
    RIDDLE_SOLVED: 100,
    RIDDLE_FAILED: -10,
    HINT_PENALTY_RIDDLE: -30,
    HINT_PENALTY_CODE: -25
  },

  // Timer et pénalités
  TIMER: {
    TIME_PENALTY_INTERVAL: 120, // secondes (2 minutes)
    TIME_PENALTY_POINTS: -30
  },

  // Limites de jeu
  LIMITS: {
    MAX_HINTS_PER_RIDDLE: 3,
    MAX_ATTEMPTS_PER_CODE: 5,
    MAX_GAME_DURATION: 3600, // 1 heure en secondes
    MIN_SCORE: 0
  },

  // Salles et progression
  ROOMS: {
    INITIAL_ROOM: 'library',
    AVAILABLE_ROOMS: ['library', 'laboratory', 'secret-chamber'],
    ROOM_UNLOCK_REQUIREMENTS: {
      'laboratory': ['laboratory-key'],
      'secret-chamber': ['ancient-key']
    }
  },

  // Inventaire
  INVENTORY: {
    MAX_ITEMS: 20,
    ITEM_TYPES: ['key', 'note', 'tool', 'clue', 'riddle'] as const
  },

  // Validation
  VALIDATION: {
    MIN_CODE_LENGTH: 3,
    MAX_CODE_LENGTH: 10,
    ALLOWED_CODE_CHARS: /^[A-Za-z0-9]+$/
  }
} as const;

// Types dérivés de la configuration
export type ItemType = typeof GAME_CONFIG.INVENTORY.ITEM_TYPES[number];
export type RoomName = typeof GAME_CONFIG.ROOMS.AVAILABLE_ROOMS[number];
export type ScoreEventType = keyof typeof GAME_CONFIG.SCORE_POINTS;

// Fonction utilitaire pour valider les paramètres
export const validateGameConfig = () => {
  const config = GAME_CONFIG;
  
  // Vérifications de cohérence
  if (config.INITIAL_SCORE < config.LIMITS.MIN_SCORE) {
    throw new Error('Le score initial ne peut pas être inférieur au score minimum');
  }
  
  if (config.TIMER.TIME_PENALTY_INTERVAL <= 0) {
    throw new Error('L\'intervalle de pénalité de temps doit être positif');
  }
  
  if (config.LIMITS.MAX_GAME_DURATION <= 0) {
    throw new Error('La durée maximale de jeu doit être positive');
  }
  
  return true;
};

// Initialisation et validation au démarrage
validateGameConfig(); 