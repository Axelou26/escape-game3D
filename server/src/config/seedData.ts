import bcrypt from 'bcrypt';

// Fonction pour hasher les mots de passe
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Données de test pour les utilisateurs
export const users = [
  {
    username: 'joueur1',
    email: 'joueur1@test.com',
    password: 'motdepasse123',
    isAdmin: false
  },
  {
    username: 'joueur2',
    email: 'joueur2@test.com',
    password: 'motdepasse123',
    isAdmin: false
  },
  {
    username: 'admin',
    email: 'admin@test.com',
    password: 'admin123',
    isAdmin: true
  }
];

// État de jeu initial
const initialGameState = {
  currentRoom: 'library',
  inventory: [],
  hasFoundAncientBook: false,
  hasDecodedSymbols: false,
  hasAncientKey: false,
  hasExaminedMicroscope: false,
  hasCompletedChemicalMix: false,
  hasCrystalKey: false,
  hasPlacedArtifact: false,
  hasCompletedRitual: false,
  gameCompleted: false
};

// Données de test pour les parties
export const games = [
  {
    startTime: new Date(Date.now() - 3600000), // Il y a 1 heure
    score: 850,
    currentElapsedTime: 1800, // 30 minutes
    isCompleted: true,
    gameState: {
      ...initialGameState,
      hasFoundAncientBook: true,
      hasDecodedSymbols: true,
      gameCompleted: true
    }
  },
  {
    startTime: new Date(Date.now() - 7200000), // Il y a 2 heures
    score: 920,
    currentElapsedTime: 2400, // 40 minutes
    isCompleted: true,
    gameState: {
      ...initialGameState,
      hasFoundAncientBook: true,
      hasDecodedSymbols: true,
      hasAncientKey: true,
      gameCompleted: true
    }
  },
  {
    startTime: new Date(),
    score: 1000,
    currentElapsedTime: 0,
    isCompleted: false,
    gameState: initialGameState
  }
];

// Fonction pour créer les données de test
export const seedDatabase = async () => {
  try {
    // Hash les mots de passe des utilisateurs
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await hashPassword(user.password)
      }))
    );

    return {
      users: hashedUsers,
      games
    };
  } catch (error) {
    console.error('Erreur lors de la préparation des données de test:', error);
    throw error;
  }
}; 