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

  // Corriger les valeurs datetime invalides avant la synchronisation
  try {
    // Vérifier si la table score_events existe
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'score_events'
    `);

    if (Array.isArray(tables) && tables.length > 0) {
      // Approche plus sûre : changer temporairement le mode SQL pour permettre les dates invalides
      await sequelize.query("SET sql_mode = ''");
      
      // Mettre à jour les valeurs invalides dans timestamp
      await sequelize.query(`
        UPDATE score_events 
        SET timestamp = NOW() 
        WHERE timestamp IS NULL 
           OR CAST(timestamp AS CHAR) = '0000-00-00 00:00:00'
           OR CAST(timestamp AS CHAR) = ''
           OR CAST(timestamp AS CHAR) = '1970-01-01 00:00:00'
           OR timestamp < STR_TO_DATE('1000-01-01 00:00:00', '%Y-%m-%d %H:%i:%s')
      `);

      // Mettre à jour created_at si nécessaire
      await sequelize.query(`
        UPDATE score_events 
        SET created_at = NOW() 
        WHERE created_at IS NULL 
           OR CAST(created_at AS CHAR) = '0000-00-00 00:00:00'
           OR CAST(created_at AS CHAR) = ''
           OR CAST(created_at AS CHAR) = '1970-01-01 00:00:00'
           OR created_at < STR_TO_DATE('1000-01-01 00:00:00', '%Y-%m-%d %H:%i:%s')
      `);

      // Mettre à jour updated_at si nécessaire
      await sequelize.query(`
        UPDATE score_events 
        SET updated_at = NOW() 
        WHERE updated_at IS NULL 
           OR CAST(updated_at AS CHAR) = '0000-00-00 00:00:00'
           OR CAST(updated_at AS CHAR) = ''
           OR CAST(updated_at AS CHAR) = '1970-01-01 00:00:00'
           OR updated_at < STR_TO_DATE('1000-01-01 00:00:00', '%Y-%m-%d %H:%i:%s')
      `);

      // Remettre le mode SQL strict
      await sequelize.query("SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'");
    }
  } catch (error) {
    // Silencieusement ignorer les erreurs de correction
  }

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