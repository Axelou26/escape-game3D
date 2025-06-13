import { Model, DataTypes } from 'sequelize';
import { sequelize } from './sequelize';

interface PuzzleHints {
  hints: string[];
}

class CodePuzzle extends Model {
  public id!: string;
  public roomId!: string;
  public objectId!: string;
  public name!: string;
  public type!: 'code' | 'sequence' | 'placement';
  public solution!: string;
  public hints!: PuzzleHints;
  public points!: number;
  public penaltyPoints!: number;
  public description!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CodePuzzle.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  roomId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  objectId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('code', 'sequence', 'placement'),
    allowNull: false
  },
  solution: {
    type: DataTypes.STRING,
    allowNull: false
  },
  hints: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: { hints: [] }
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100
  },
  penaltyPoints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -20
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'CodePuzzle',
  tableName: 'code_puzzles'
});

export default CodePuzzle; 