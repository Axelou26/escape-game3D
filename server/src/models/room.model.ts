import { Model, DataTypes, Sequelize } from 'sequelize';

export class Room extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public isCompleted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export class Puzzle extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public solution!: string;
  public isCompleted!: boolean;
  public roomId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initRoomModel = (sequelize: Sequelize) => {
  Room.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'Room',
  });
};

export const initPuzzleModel = (sequelize: Sequelize) => {
  Puzzle.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    solution: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    roomId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Puzzle',
  });
}; 