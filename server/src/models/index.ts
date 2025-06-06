import Game from './game.model';
import User from './user.model';
import { Room, Puzzle, initRoomModel, initPuzzleModel } from './room.model';
import { sequelize } from './sequelize';
import { initModels } from './init-models';

// Initialiser les modèles Room et Puzzle
initRoomModel(sequelize);
initPuzzleModel(sequelize);

// Export des modèles
export { User };
export { Game };
export { Room };
export { Puzzle };

// Export de l'instance Sequelize et de la fonction d'initialisation
export { sequelize, initModels };

// Export par défaut des modèles
export default {
  User,
  Game,
  Room,
  Puzzle
}; 