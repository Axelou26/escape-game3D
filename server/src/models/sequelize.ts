import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Création de l'instance Sequelize
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'escape_game',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'azerty-26',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    charset: 'utf8',
    collate: 'utf8_general_ci'
  }
});

export { sequelize };
export default sequelize; 