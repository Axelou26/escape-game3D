const mysql = require('mysql2/promise');

async function checkInventoryContent() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'azerty-26',
      database: 'escape_game'
    });
    
    console.log('📦 Inventaire actuel:');
    const [items] = await connection.execute('SELECT user_id, item_id, item_name FROM inventory ORDER BY user_id, created_at');
    console.table(items);
    
    console.log('\n🔍 Recherche de riddle-elements:');
    const [riddleItems] = await connection.execute('SELECT * FROM inventory WHERE item_id = ?', ['riddle-elements']);
    if (riddleItems.length > 0) {
      console.table(riddleItems);
    } else {
      console.log('❌ Aucun objet riddle-elements trouvé dans l\'inventaire');
    }
    
    // Vérifier les utilisateurs avec ID 7 (probablement celui qui cause l'erreur)
    console.log('\n👤 Inventaire de l\'utilisateur 7:');
    const [user7Items] = await connection.execute('SELECT * FROM inventory WHERE user_id = 7');
    if (user7Items.length > 0) {
      console.table(user7Items);
    } else {
      console.log('❌ Aucun objet trouvé pour l\'utilisateur 7');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkInventoryContent(); 