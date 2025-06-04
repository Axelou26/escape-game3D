require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'azerty-26',
    database: process.env.DB_NAME || 'escape_game',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: true
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'azerty-26',
    database: process.env.DB_NAME || 'escape_game_test',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
}; 