import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  // Créer la table des énigmes
  await queryInterface.createTable('riddles', {
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
      allowNull: false
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
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  // Créer la table des codes/puzzles
  await queryInterface.createTable('code_puzzles', {
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
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  // Créer la table des événements de score
  await queryInterface.createTable('score_events', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    gameId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Games',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  // Ajouter les index pour améliorer les performances
  await queryInterface.addIndex('riddles', ['roomId']);
  await queryInterface.addIndex('riddles', ['isActive']);
  await queryInterface.addIndex('code_puzzles', ['roomId']);
  await queryInterface.addIndex('code_puzzles', ['objectId']);
  await queryInterface.addIndex('code_puzzles', ['isActive']);
  await queryInterface.addIndex('score_events', ['gameId']);
  await queryInterface.addIndex('score_events', ['eventType']);
  await queryInterface.addIndex('score_events', ['timestamp']);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('score_events');
  await queryInterface.dropTable('code_puzzles');
  await queryInterface.dropTable('riddles');
}; 