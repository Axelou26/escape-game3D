import User from './user.model';
import Game from './game.model';
import { Room, Puzzle } from './room.model';
import Riddle from './riddle.model';
import ScoreEvent from './score-event.model';
import CodePuzzle from './code-puzzle.model';
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

  // Note: Les énigmes et codes utilisent roomId comme identifiant de chaîne ('library', 'laboratory', etc.)
  // Pas de clé étrangère vers la table Room car les concepts ne correspondent pas exactement

  // Les associations pour ScoreEvent sont déjà définies dans le modèle

  // Synchroniser les modèles avec la base de données
  // Alter: true mettra à jour les tables existantes au lieu de les recréer
  await sequelize.sync({ alter: true });

  return {
    User,
    Game,
    Room,
    Puzzle,
    Riddle,
    ScoreEvent,
    CodePuzzle
  };
} 