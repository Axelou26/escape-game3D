import { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // D'abord, on supprime la clé primaire existante
  await queryInterface.sequelize.query(`
    ALTER TABLE games DROP PRIMARY KEY;
  `);
  
  // Ensuite, on modifie la colonne id pour ajouter l'auto-increment
  await queryInterface.sequelize.query(`
    ALTER TABLE games MODIFY id INT NOT NULL AUTO_INCREMENT PRIMARY KEY;
  `);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(`
    ALTER TABLE games MODIFY id INT NOT NULL;
  `);
} 