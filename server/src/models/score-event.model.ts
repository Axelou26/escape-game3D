import { Model, DataTypes } from 'sequelize';
import { sequelize } from './sequelize';
import Game from './game.model';

type ScoreEventType = 
  | 'ITEM_COLLECTED'
  | 'CODE_CORRECT'
  | 'CODE_INCORRECT'
  | 'BEAKER_SEQUENCE_WRONG'
  | 'BEAKER_SEQUENCE_CORRECT'
  | 'ROOM_CHANGE'
  | 'TIME_PENALTY'
  | 'FINAL_CODE_CORRECT'
  | 'FINAL_CODE_INCORRECT'
  | 'RIDDLE_SOLVED'
  | 'RIDDLE_FAILED';

import { GAME_CONFIG } from '../config/gameConfig';

// Points associés à chaque événement (maintenant importés de la config)
export const SCORE_POINTS = GAME_CONFIG.SCORE_POINTS;

class ScoreEvent extends Model {
  public id!: number;
  public gameId!: number;
  public eventType!: ScoreEventType;
  public points!: number;
  public details!: string | null;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association
  public Game?: Game;
}

ScoreEvent.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  gameId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: Game,
      key: 'id'
    }
  },
  eventType: {
    type: DataTypes.ENUM(
      'ITEM_COLLECTED',
      'CODE_CORRECT',
      'CODE_INCORRECT',
      'BEAKER_SEQUENCE_WRONG',
      'BEAKER_SEQUENCE_CORRECT',
      'ROOM_CHANGE',
      'TIME_PENALTY',
      'FINAL_CODE_CORRECT',
      'FINAL_CODE_INCORRECT',
      'RIDDLE_SOLVED',
      'RIDDLE_FAILED'
    ),
    allowNull: false
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'ScoreEvent',
  tableName: 'score_events'
});

// Définir les relations
ScoreEvent.belongsTo(Game, {
  foreignKey: 'gameId',
  as: 'Game'
});

Game.hasMany(ScoreEvent, {
  foreignKey: 'gameId',
  as: 'ScoreEvents'
});

export default ScoreEvent;
export { ScoreEventType }; 