const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'azerty-26',
  database: 'escape_game'
};

async function testBeakerSequence() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    
    // Vérifier la séquence des béchers
    const [puzzleRows] = await connection.execute(
      'SELECT * FROM code_puzzles WHERE id = ?',
      ['beaker-sequence']
    );
    
    if (puzzleRows.length === 0) {
      console.log('❌ Séquence des béchers non trouvée dans la base');
      return;
    }
    
    const puzzle = puzzleRows[0];
    console.log('✅ Puzzle trouvé:', {
      id: puzzle.id,
      name: puzzle.name,
      solution: puzzle.solution,
      type: puzzle.type,
      points: puzzle.points
    });
    
    // Tester différentes séquences
    const testSequences = [
      'beaker-rouge,beaker-orange,beaker-jaune,beaker-vert,beaker-bleu,beaker-violet', // Correcte
      'beaker-violet,beaker-bleu,beaker-vert,beaker-jaune,beaker-orange,beaker-rouge', // Inversée
      'beaker-rouge,beaker-orange,beaker-jaune', // Incomplète
      'beaker-rouge,beaker-bleu,beaker-vert', // Incorrecte
    ];
    
    console.log('\n🧪 Test des séquences :');
    
    testSequences.forEach((sequence, index) => {
      const isCorrect = sequence.trim() === puzzle.solution.trim();
      console.log(`${index + 1}. "${sequence}"`);
      console.log(`   Résultat: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      console.log('');
    });
    
    // Vérifier les utilisateurs pour les tests
    const [users] = await connection.execute('SELECT id, username FROM users LIMIT 3');
    console.log('👥 Utilisateurs disponibles pour les tests:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}`);
    });
    
    // Vérifier les parties en cours
    const [games] = await connection.execute(
      'SELECT id, userId, score, isCompleted FROM games WHERE isCompleted = 0 LIMIT 3'
    );
    console.log('\n🎮 Parties en cours:');
    if (games.length === 0) {
      console.log('Aucune partie en cours trouvée');
    } else {
      games.forEach(game => {
        console.log(`- Game ID: ${game.id}, User ID: ${game.userId}, Score: ${game.score}`);
      });
    }
    
    console.log('\n📋 Instructions pour tester:');
    console.log('1. Connectez-vous au jeu avec un compte utilisateur');
    console.log('2. Allez dans le laboratoire');
    console.log('3. Cliquez sur le microscope pour voir l\'indice');
    console.log('4. Cliquez sur les béchers dans l\'ordre: Rouge → Orange → Jaune → Vert → Bleu → Violet');
    console.log('5. La séquence devrait être validée et débloquer le tableau périodique');
    
    console.log('\n🔧 Si ça ne marche pas, vérifiez:');
    console.log('- Le serveur est-il démarré ? (npm run dev)');
    console.log('- Y a-t-il des erreurs dans la console du navigateur ?');
    console.log('- L\'utilisateur a-t-il une partie en cours ?');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

testBeakerSequence().catch(console.error); 