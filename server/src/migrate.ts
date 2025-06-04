import { sequelize } from './models/sequelize';
import { up as fixGameId } from './migrations/fix-game-id';

async function migrate() {
  try {
    console.log('Début des migrations...');
    
    // Exécuter la migration pour corriger l'id de la table games
    await fixGameId(sequelize.getQueryInterface());
    
    console.log('Migrations terminées avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors des migrations:', error);
    process.exit(1);
  }
}

migrate(); 