import { User } from './user.model';
import Game from './game.model';
import { sequelize } from './sequelize';

export const initModels = async () => {
  // Définir les associations
  User.hasMany(Game, {
    foreignKey: 'userId',
    as: 'games'
  });

  Game.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // Synchroniser les modèles avec la base de données
  await sequelize.sync();

  return {
    User,
    Game
  };
}; 