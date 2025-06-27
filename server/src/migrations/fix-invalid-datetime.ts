import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    console.log('Correction des valeurs datetime invalides dans score_events...');
    
    // Mettre à jour les valeurs invalides '0000-00-00 00:00:00' avec la date actuelle
    await queryInterface.sequelize.query(`
      UPDATE score_events 
      SET timestamp = NOW() 
      WHERE timestamp = '0000-00-00 00:00:00' 
         OR timestamp IS NULL 
         OR timestamp = ''
    `);

    // Mettre à jour created_at et updated_at si nécessaire
    await queryInterface.sequelize.query(`
      UPDATE score_events 
      SET created_at = NOW() 
      WHERE created_at = '0000-00-00 00:00:00' 
         OR created_at IS NULL 
         OR created_at = ''
    `);

    await queryInterface.sequelize.query(`
      UPDATE score_events 
      SET updated_at = NOW() 
      WHERE updated_at = '0000-00-00 00:00:00' 
         OR updated_at IS NULL 
         OR updated_at = ''
    `);

    console.log('Valeurs datetime invalides corrigées avec succès.');
  } catch (error) {
    console.error('Erreur lors de la correction des valeurs datetime:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Pas de rollback car on ne peut pas remettre des valeurs invalides
  console.log('Pas de rollback possible pour cette migration.');
} 