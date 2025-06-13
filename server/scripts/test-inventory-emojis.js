const mysql = require('mysql2/promise');

// Configuration de la base de données
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'azerty-26',
  database: 'escape_game'
};

async function testInventoryEmojis() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    
    // Obtenir le premier utilisateur pour le test
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
    
    // Objets de test avec différents emojis et raretés
    const testItems = [
      // === CLÉS ===
      {
        id: 'crystal-key',
        type: 'key',
        name: 'Clé en Cristal',
        description: 'Une clé magnifique taillée dans un cristal translucide. LÉGENDAIRE !'
      },
      {
        id: 'laboratory-key',
        type: 'key',
        name: 'Clé du Laboratoire',
        description: 'Une clé ancienne qui ouvre la porte du laboratoire.'
      },
      
      // === ÉNIGMES ===
      {
        id: 'riddle-mathematics',
        type: 'riddle',
        name: 'Énigme Mathématique',
        description: 'Une énigme complexe avec des chiffres mystérieux.'
      },
      {
        id: 'riddle-elements',
        type: 'riddle',
        name: 'Énigme des Éléments',
        description: 'Une énigme liée au tableau périodique.'
      },
      {
        id: 'riddle-shadow',
        type: 'riddle',
        name: 'Énigme des Ombres',
        description: 'Une énigme mystérieuse apparue dans l\'obscurité.'
      },
      
      // === DOCUMENTS ===
      {
        id: 'professors-journal',
        type: 'note',
        name: 'Journal du Professeur',
        description: 'Le journal personnel du professeur disparu.'
      },
      {
        id: 'mysterious-book',
        type: 'note',
        name: 'Livre Mystérieux',
        description: 'Un livre ancien aux pages jaunies.'
      },
      
      // === OBJETS SPÉCIAUX ===
      {
        id: 'sacred-artifact',
        type: 'clue',
        name: 'Artefact Sacré',
        description: 'Un artefact ancien d\'une puissance incroyable. LÉGENDAIRE !'
      },
      {
        id: 'crystal-orb',
        type: 'clue',
        name: 'Orbe de Cristal',
        description: 'Une sphère de cristal qui semble contenir de l\'énergie.'
      },
      {
        id: 'ancient-medallion',
        type: 'clue',
        name: 'Médaillon Ancien',
        description: 'Un médaillon gravé de symboles mystérieux.'
      },
      
      // === OUTILS ===
      {
        id: 'magnifying-glass',
        type: 'tool',
        name: 'Loupe',
        description: 'Une loupe pour examiner les détails.'
      },
      {
        id: 'chemical-vial',
        type: 'tool',
        name: 'Fiole Chimique',
        description: 'Une fiole contenant un liquide coloré.'
      },
      
      // === SYMBOLES ===
      {
        id: 'sun-symbol',
        type: 'clue',
        name: 'Symbole Solaire',
        description: 'Un symbole gravé représentant le soleil.'
      },
      {
        id: 'ancient-rune',
        type: 'clue',
        name: 'Rune Ancienne',
        description: 'Une rune mystique aux pouvoirs inconnus.'
      }
    ];
    
    console.log('📦 Ajout des objets de test...');
    
    // Ajouter chaque objet à l'inventaire
    for (const item of testItems) {
      await connection.execute(
        `INSERT INTO inventory (user_id, item_id, item_type, item_name, item_description, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [userId, item.id, item.type, item.name, item.description]
      );
      console.log(`✅ ${item.name} (${item.id}) ajouté`);
    }
    
    console.log(`\n🎉 Test terminé ! ${testItems.length} objets ajoutés à l'inventaire.`);
    console.log('\n🎨 Emojis à tester :');
    console.log('💎 Clé en Cristal (LÉGENDAIRE - or brillant)');
    console.log('🗝️ Clé du Laboratoire');
    console.log('🔢 Énigme Mathématique (PEU COMMUN - vert)');
    console.log('⚗️ Énigme des Éléments (PEU COMMUN - vert)');
    console.log('🌑 Énigme des Ombres (PEU COMMUN - vert)');
    console.log('📖 Journal du Professeur');
    console.log('📕 Livre Mystérieux');
    console.log('🏛️ Artefact Sacré (LÉGENDAIRE - or brillant)');
    console.log('🔮 Orbe de Cristal (RARE - violet)');
    console.log('🥇 Médaillon Ancien (RARE - violet)');
    console.log('🔍 Loupe');
    console.log('🧪 Fiole Chimique');
    console.log('☀️ Symbole Solaire');
    console.log('🪬 Rune Ancienne (RARE - violet)');
    
    console.log('\n✨ Indicateurs de statut :');
    console.log('✨ sur les énigmes et objets mystiques');
    console.log('🔓 sur les clés');
    
    console.log('\n🎮 Connectez-vous au jeu pour voir les emojis en action !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter le test
testInventoryEmojis().catch(console.error); 