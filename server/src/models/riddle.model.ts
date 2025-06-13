import { Model, DataTypes } from 'sequelize';
import { sequelize } from './sequelize';

interface RiddleContent {
  riddle: string;
  answer: string;
  hint?: string;
}

class Riddle extends Model {
  public id!: string;
  public roomId!: string;
  public name!: string;
  public description!: string;
  public content!: RiddleContent;
  public points!: number;
  public position!: { x: number; y: number; z: number };
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Riddle.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  roomId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  content: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidContent(value: RiddleContent) {
        if (!value.riddle || typeof value.riddle !== 'string') {
          throw new Error('Le contenu de l\'énigme doit avoir un texte valide');
        }
        if (!value.answer || typeof value.answer !== 'string') {
          throw new Error('L\'énigme doit avoir une réponse valide');
        }
      }
    }
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100
  },
  position: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: { x: 0, y: 0, z: 0 }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Riddle',
  tableName: 'riddles'
});

export default Riddle; 