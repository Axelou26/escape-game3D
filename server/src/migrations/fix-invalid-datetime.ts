import { sequelize } from '../models/sequelize';

export async function fixInvalidDatetime() {
  try {
    console.log('Migration: Correction des valeurs datetime invalides...');
    
    // Vérifier si la table score_events existe
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'score_events'
    `);
    
    if (tables.length === 0) {
      console.log('Table score_events non trouvée, migration ignorée.');
      return;
    }
    
    // Mettre à jour toutes les valeurs datetime invalides
    const [result] = await sequelize.query(`
      UPDATE score_events 
      SET timestamp = COALESCE(created_at, NOW()) 
      WHERE timestamp = '0000-00-00 00:00:00' 
         OR timestamp IS NULL 
         OR timestamp = '0000-00-00'
         OR timestamp < '1970-01-01 00:00:01'
    `);
    
    console.log(`Migration terminée. ${(result as any).affectedRows || 0} lignes mises à jour.`);
    
    // Optionnel: Ajouter une contrainte pour éviter les valeurs futures invalides
    try {
      await sequelize.query(`
        ALTER TABLE score_events 
        MODIFY COLUMN timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('Contrainte de timestamp mise à jour avec succès.');
    } catch (constraintError) {
      console.log('Contrainte de timestamp déjà à jour ou non applicable.');
    }
    
  } catch (error) {
    console.error('Erreur durant la migration des datetime:', error);
    throw error;
  }
}

// Exécuter la migration si ce fichier est appelé directement
if (require.main === module) {
  fixInvalidDatetime()
    .then(() => {
      console.log('Migration des datetime terminée avec succès.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Échec de la migration des datetime:', error);
      process.exit(1);
    });
} 