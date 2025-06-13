const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'azerty-26',
  database: 'escape_game'
};

async function fixBeakerSequence() {
  let connection;
  
  try {
    console.log('🔧 DIAGNOSTIC ET CORRECTION DE LA SÉQUENCE DES BÉCHERS');
    console.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Vérifier la séquence des béchers
    console.log('\n1️⃣ Vérification de la séquence des béchers...');
    const [puzzleRows] = await connection.execute(
      'SELECT * FROM code_puzzles WHERE id = ?',
      ['beaker-sequence']
    );
    
    if (puzzleRows.length === 0) {
      console.log('❌ Séquence des béchers non trouvée. Ajout...');
      await connection.execute(`
        INSERT INTO code_puzzles (id, object_id, room_id, name, type, description, solution, hints, points, penalty_points, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'beaker-sequence',
        'beaker-sequence',
        'laboratory',
        'Séquence des Béchers',
        'sequence',
        'Une séquence de couleurs à reproduire dans l\'ordre du spectre visible inversé',
        'beaker-rouge,beaker-orange,beaker-jaune,beaker-vert,beaker-bleu,beaker-violet',
        JSON.stringify({
          hints: [
            'Examinez le microscope pour obtenir un indice',
            'L\'ordre du spectre visible inversé',
            'Rouge, Orange, Jaune, Vert, Bleu, Violet'
          ]
        }),
        75,
        -10,
        1
      ]);
      console.log('✅ Séquence des béchers ajoutée');
    } else {
      const puzzle = puzzleRows[0];
      console.log('✅ Séquence trouvée:', {
        id: puzzle.id,
        name: puzzle.name,
        solution: puzzle.solution,
        points: puzzle.points
      });
    }
    
    // 2. Vérifier les utilisateurs
    console.log('\n2️⃣ Vérification des utilisateurs...');
    const [users] = await connection.execute('SELECT id, username FROM users LIMIT 5');
    console.log(`✅ ${users.length} utilisateurs trouvés:`);
    users.forEach(user => {
      console.log(`   - ID: ${user.id}, Username: ${user.username}`);
    });
    
    // 3. Vérifier les parties en cours
    console.log('\n3️⃣ Vérification des parties en cours...');
    const [games] = await connection.execute(
      'SELECT id, user_id, score, is_completed FROM games WHERE is_completed = 0 LIMIT 5'
    );
    console.log(`✅ ${games.length} parties en cours:`);
    if (games.length === 0) {
      console.log('   ⚠️ Aucune partie en cours. Créez une partie pour tester.');
    } else {
      games.forEach(game => {
        console.log(`   - Game ID: ${game.id}, User ID: ${game.user_id}, Score: ${game.score}`);
      });
    }
    
    // 4. Test de la séquence
    console.log('\n4️⃣ Test de validation de la séquence...');
    const correctSequence = 'beaker-rouge,beaker-orange,beaker-jaune,beaker-vert,beaker-bleu,beaker-violet';
    const incorrectSequence = 'beaker-rouge,beaker-bleu,beaker-vert';
    
    const [puzzle] = await connection.execute('SELECT solution FROM code_puzzles WHERE id = ?', ['beaker-sequence']);
    const storedSolution = puzzle[0].solution;
    
    console.log(`   Séquence correcte: "${correctSequence}"`);
    console.log(`   Solution stockée:  "${storedSolution}"`);
    console.log(`   Match: ${correctSequence === storedSolution ? '✅ OUI' : '❌ NON'}`);
    
    console.log(`   Séquence incorrecte: "${incorrectSequence}"`);
    console.log(`   Match: ${incorrectSequence === storedSolution ? '✅ OUI' : '❌ NON'}`);
    
    // 5. Instructions de test
    console.log('\n5️⃣ INSTRUCTIONS POUR TESTER:');
    console.log('');
    console.log('📋 Étapes à suivre:');
    console.log('1. Démarrez le serveur: npm run dev (dans /server)');
    console.log('2. Démarrez le client: npm start (dans /client)');
    console.log('3. Connectez-vous avec un compte utilisateur');
    console.log('4. Créez une nouvelle partie si nécessaire');
    console.log('5. Allez dans le laboratoire');
    console.log('6. Cliquez sur le microscope pour voir l\'indice');
    console.log('7. Cliquez sur les béchers dans l\'ordre:');
    console.log('   🔴 Rouge → 🟠 Orange → 🟡 Jaune → 🟢 Vert → 🔵 Bleu → 🟣 Violet');
    console.log('');
    console.log('🔧 Si ça ne marche toujours pas:');
    console.log('- Vérifiez la console du navigateur pour les erreurs');
    console.log('- Vérifiez que le serveur répond sur http://localhost:3001');
    console.log('- Vérifiez que l\'utilisateur a un token d\'authentification valide');
    console.log('- Vérifiez qu\'il y a une partie en cours dans la base');
    
    // 6. Créer une partie de test si nécessaire
    if (games.length === 0 && users.length > 0) {
      console.log('\n6️⃣ Création d\'une partie de test...');
      const testUserId = users[0].id;
      await connection.execute(`
        INSERT INTO games (user_id, start_time, score, current_elapsed_time, is_completed, game_state)
        VALUES (?, NOW(), 1000, 0, 0, ?)
      `, [testUserId, JSON.stringify({
        currentRoom: 'laboratory',
        inventory: [],
        score: 1000,
        elapsedTime: 0,
        unlockedRooms: ['library', 'laboratory'],
        periodicTableUnlocked: false,
        computerUnlocked: false,
        gameCompleted: false
      })]);
      console.log(`✅ Partie de test créée pour l'utilisateur ${testUserId}`);
    }
    
    console.log('\n🎉 Diagnostic terminé ! La séquence des béchers devrait maintenant fonctionner.');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

fixBeakerSequence().catch(console.error); 