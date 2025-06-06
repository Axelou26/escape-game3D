import User from './user.model';
import Game from './game.model';
import { Room, Puzzle } from './room.model';
import { sequelize } from './sequelize';

export async function initModels() {
  // Définir les associations
  Game.belongsTo(User, {
    foreignKey: 'userId',
    as: 'creator'
  });

  User.hasMany(Game, {
    foreignKey: 'userId',
    as: 'games'
  });

  Room.hasMany(Puzzle, {
    foreignKey: 'roomId',
    as: 'puzzles'
  });

  Puzzle.belongsTo(Room, {
    foreignKey: 'roomId',
    as: 'room'
  });

  // Synchroniser les modèles avec la base de données
  // Alter: true mettra à jour les tables existantes au lieu de les recréer
  await sequelize.sync({ alter: true });

  return {
    User,
    Game,
    Room,
    Puzzle
  };
} 