const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'azerty-26',
  database: 'escape_game'
};

async function createInventoryTable() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    
    // Créer la table inventory si elle n'existe pas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        item_id VARCHAR(100) NOT NULL,
        item_type VARCHAR(50) NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        item_description TEXT,
        item_content JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_item (user_id, item_id)
      )
    `);
    console.log('✅ Table inventory créée');
    
    // Obtenir le premier utilisateur
    const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé. Créez un compte d\'abord.');
      return;
    }
    
    const userId = users[0].id;
    console.log(`👤 Test avec l'utilisateur ID: ${userId}`);
    
    // Nettoyer l'inventaire existant
    await connection.execute('DELETE FROM inventory WHERE user_id = ?', [userId]);
    console.log('🗑️ Inventaire nettoyé');
    
    // Objets de test pour démontrer les emojis
    const testItems = [
      // LÉGENDAIRES (or brillant)
      { id: 'crystal-key', type: 'key', name: 'Clé en Cristal', description: 'Une clé magnifique taillée dans un cristal translucide. LÉGENDAIRE !' },
      { id: 'sacred-artifact', type: 'clue', name: 'Artefact Sacré', description: 'Un artefact ancien d\'une puissance incroyable. LÉGENDAIRE !' },
      
      // RARES (violet)
      { id: 'ancient-medallion', type: 'clue', name: 'Médaillon Ancien', description: 'Un médaillon gravé de symboles mystérieux.' },
      { id: 'mystical-gem', type: 'clue', name: 'Gemme Mystique', description: 'Une gemme qui pulse d\'une énergie mystérieuse.' },
      { id: 'ancient-rune', type: 'clue', name: 'Rune Ancienne', description: 'Une rune mystique aux pouvoirs inconnus.' },
      
      // PEU COMMUNS (vert) - Énigmes
      { id: 'riddle-mathematics', type: 'riddle', name: 'Énigme Mathématique', description: 'Une énigme complexe avec des chiffres mystérieux.' },
      { id: 'riddle-elements', type: 'riddle', name: 'Énigme des Éléments', description: 'Une énigme liée au tableau périodique.' },
      { id: 'riddle-shadow', type: 'riddle', name: 'Énigme des Ombres', description: 'Une énigme mystérieuse apparue dans l\'obscurité.' },
      { id: 'riddle-mirror', type: 'riddle', name: 'Énigme du Miroir', description: 'Une énigme reflétée dans un miroir ancien.' },
      
      // COMMUNS (blanc)
      { id: 'laboratory-key', type: 'key', name: 'Clé du Laboratoire', description: 'Une clé ancienne qui ouvre la porte du laboratoire.' },
      { id: 'professors-journal', type: 'note', name: 'Journal du Professeur', description: 'Le journal personnel du professeur disparu.' },
      { id: 'mysterious-book', type: 'note', name: 'Livre Mystérieux', description: 'Un livre ancien aux pages jaunies.' },
      { id: 'magnifying-glass', type: 'tool', name: 'Loupe', description: 'Une loupe pour examiner les détails.' },
      { id: 'chemical-vial', type: 'tool', name: 'Fiole Chimique', description: 'Une fiole contenant un liquide coloré.' }
    ];
    
    console.log('📦 Ajout des objets de test...');
    
    for (const item of testItems) {
      await connection.execute(
        `INSERT INTO inventory (user_id, item_id, item_type, item_name, item_description) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, item.id, item.type, item.name, item.description]
      );
      console.log(`✅ ${item.name} ajouté`);
    }
    
    console.log(`\n🎉 ${testItems.length} objets ajoutés à l'inventaire !`);
    console.log('\n🎨 GUIDE DES EMOJIS À TESTER :');
    console.log('\n=== LÉGENDAIRES (or brillant avec animation) ===');
    console.log('💎 Clé en Cristal');
    console.log('🏛️ Artefact Sacré');
    
    console.log('\n=== RARES (violet avec brillance) ===');
    console.log('🥇 Médaillon Ancien');
    console.log('💠 Gemme Mystique');
    console.log('🪬 Rune Ancienne');
    
    console.log('\n=== PEU COMMUNS (vert) ===');
    console.log('🔢 Énigme Mathématique');
    console.log('⚗️ Énigme des Éléments');
    console.log('🌑 Énigme des Ombres');
    console.log('🪞 Énigme du Miroir');
    
    console.log('\n=== COMMUNS (blanc) ===');
    console.log('🗝️ Clé du Laboratoire');
    console.log('📖 Journal du Professeur');
    console.log('📕 Livre Mystérieux');
    console.log('🔍 Loupe');
    console.log('🧪 Fiole Chimique');
    
    console.log('\n✨ INDICATEURS DE STATUT :');
    console.log('✨ Scintillement sur les énigmes et objets mystiques');
    console.log('🔓 Indicateur sur les clés');
    
    console.log('\n🎮 Connectez-vous au jeu pour voir les emojis en action !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

createInventoryTable().catch(console.error); 