const mysql = require('mysql2/promise');

async function checkInventoryTable() {
  let connection;
  try {
    console.log('🔍 Vérification de la table inventory...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'azerty-26',
      database: 'escape_game'
    });
    
    // Vérifier si la table existe
    const [tables] = await connection.execute("SHOW TABLES LIKE 'inventory'");
    if (tables.length === 0) {
      console.log('❌ Table inventory introuvable. Création en cours...');
      
      // Créer la table inventory
      await connection.execute(`
        CREATE TABLE inventory (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          item_id VARCHAR(255) NOT NULL,
          item_type VARCHAR(100) NOT NULL,
          item_name VARCHAR(255) NOT NULL,
          item_description TEXT,
          item_content JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_item (user_id, item_id)
        )
      `);
      
      console.log('✅ Table inventory créée avec succès');
    } else {
      console.log('✅ Table inventory trouvée');
    }
    
    // Vérifier la structure
    console.log('📊 Structure de la table inventory:');
    const [columns] = await connection.execute('DESCRIBE inventory');
    console.table(columns);
    
    // Compter les objets
    const [count] = await connection.execute('SELECT COUNT(*) as count FROM inventory');
    console.log(`📦 Nombre d'objets dans l'inventaire: ${count[0].count}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

checkInventoryTable(); 