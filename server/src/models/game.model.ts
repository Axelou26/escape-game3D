import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from './sequelize';
import User from './user.model';

interface InventoryItem {
  id: string;
  type: string;
  name: string;
  description: string;
}

interface GameState {
  currentRoom: string;
  inventory: InventoryItem[];
  score: number;
  elapsedTime: number;
  microscopeEnigmeResolved: boolean;
  periodicTableUnlocked?: boolean;
  unlockedRooms: string[];
  computerUnlocked?: boolean;
  gameCompleted?: boolean;
  artifactUnlocked?: boolean;
  hintsUsed?: number;
  attemptsCount?: number;
  solvedPuzzles: string[];
}

interface GameAttributes {
  id: number;
  userId: number;
  startTime: Date;
  score: number;
  currentElapsedTime: number;
  isCompleted: boolean;
  gameState: GameState;
}

interface GameCreationAttributes extends Optional<GameAttributes, 'id'> {}

class Game extends Model<GameAttributes, GameCreationAttributes> implements GameAttributes {
  public id!: number;
  public userId!: number;
  public startTime!: Date;
  public score!: number;
  public currentElapsedTime!: number;
  public isCompleted!: boolean;
  public gameState!: GameState;
  public User?: any;
  public ScoreEvents?: any[];
}

Game.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1000
  },
  currentElapsedTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  gameState: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      currentRoom: 'library',
      inventory: [],
      score: 1000,
      elapsedTime: 0,
      microscopeEnigmeResolved: false,
      periodicTableUnlocked: false,
      unlockedRooms: ['library'],
      computerUnlocked: false,
      gameCompleted: false,
      artifactUnlocked: false,
      hintsUsed: 0,
      attemptsCount: 0,
      solvedPuzzles: []
    },
    set(value: any) {
      // Normaliser et initialiser les propriétés manquantes
      const normalizedValue = {
        currentRoom: value.currentRoom || 'library',
        inventory: Array.isArray(value.inventory) ? value.inventory : [],
        score: typeof value.score === 'number' ? value.score : 1000,
        elapsedTime: typeof value.elapsedTime === 'number' ? value.elapsedTime : 0,
        microscopeEnigmeResolved: typeof value.microscopeEnigmeResolved === 'boolean' ? value.microscopeEnigmeResolved : false,
        periodicTableUnlocked: typeof value.periodicTableUnlocked === 'boolean' ? value.periodicTableUnlocked : false,
        unlockedRooms: Array.isArray(value.unlockedRooms) ? value.unlockedRooms : ['library'],
        computerUnlocked: typeof value.computerUnlocked === 'boolean' ? value.computerUnlocked : false,
        gameCompleted: typeof value.gameCompleted === 'boolean' ? value.gameCompleted : false,
        artifactUnlocked: typeof value.artifactUnlocked === 'boolean' ? value.artifactUnlocked : false,
        hintsUsed: typeof value.hintsUsed === 'number' ? value.hintsUsed : 0,
        attemptsCount: typeof value.attemptsCount === 'number' ? value.attemptsCount : 0,
        solvedPuzzles: Array.isArray(value.solvedPuzzles) ? value.solvedPuzzles : []
      };
      this.setDataValue('gameState', normalizedValue);
    },
    validate: {
      isValidGameState(value: GameState) {
        if (!value.currentRoom || typeof value.currentRoom !== 'string') {
          throw new Error('currentRoom doit être une chaîne de caractères valide');
        }
        if (!Array.isArray(value.inventory)) {
          throw new Error('inventory doit être un tableau');
        }
        if (typeof value.score !== 'number') {
          throw new Error('score doit être un nombre');
        }
        if (typeof value.elapsedTime !== 'number') {
          throw new Error('elapsedTime doit être un nombre');
        }
        // Validation des objets de l'inventaire
        value.inventory.forEach(item => {
          if (!item.id || typeof item.id !== 'string') {
            throw new Error('Chaque item de l\'inventaire doit avoir un id valide');
          }
          if (!item.type || typeof item.type !== 'string') {
            throw new Error('Chaque item de l\'inventaire doit avoir un type valide');
          }
          if (!item.name || typeof item.name !== 'string') {
            throw new Error('Chaque item de l\'inventaire doit avoir un nom valide');
          }
          if (!item.description || typeof item.description !== 'string') {
            throw new Error('Chaque item de l\'inventaire doit avoir une description valide');
          }
        });
      }
    }
  }
}, {
  sequelize,
  modelName: 'Game'
});

// Définir la relation avec User
Game.belongsTo(User, {
  foreignKey: 'userId',
  as: 'User'
});

export default Game; 