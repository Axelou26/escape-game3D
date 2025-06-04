import { sequelize } from './sequelize';
import { User } from './user.model';
import Game from './game.model';
import { initModels } from './init-models';

// Export des modèles
export { User };
export { Game };  // On réexporte Game

// Export de l'instance Sequelize et de la fonction d'initialisation
export { sequelize, initModels };

// Export par défaut des modèles
export default {
  User,
  Game
}; 