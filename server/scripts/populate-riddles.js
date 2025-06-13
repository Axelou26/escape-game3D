const mysql = require('mysql2/promise');

// Configuration de la base de données
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'azerty-26',
  database: 'escape_game'
};

async function populateDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    
    // =============== ÉNIGMES ===============
    console.log('🧩 Ajout des énigmes...');
    
    const riddles = [
      {
        id: 'riddle-mathematics',
        roomId: 'library',
        name: 'Énigme Mathématique',
        description: 'Une énigme trouvée dans le tiroir de la bibliothèque',
        content: JSON.stringify({
          riddle: `Quatre marchaient vers la vérité, mais un seul menait le pas...

            Le troisième suit le deuxième, deux fois plus fort.

            Le premier ne partage rien : il est impair, plus grand que le dernier, et unique en son genre.

            Ensemble, ils valent 18.

            Aucun d'eux ne se ressemble.

            Et le deuxième est plus petit que le quatrième.`,
          answer: '7245',
          hint: 'x+x+x+x=18'
        }),
        position: JSON.stringify({ x: -2, y: 1, z: 3 }),
        points: 150,
        hint_penalty: 25
      },
      {
        id: 'riddle-elements',
        roomId: 'laboratory',
        name: 'Énigme des Éléments',
        description: 'Une énigme mystérieuse apparue sur le tableau périodique',
        content: JSON.stringify({
          riddle: `Dans le tableau des éléments, trois lettres se cachent,
                    Mon premier : Je suis dans l'air sans y être. Je suis vital mais invisible. Mon symbole est un souffle, 
                    et sans moi, plus de feu.
                            "Mon second : Je suis liquide et pourtant j'éteins le feu. Je tombe du ciel mais je peux inonder ton 
                            labo. On me voit mais je n'ai pas de couleur.\n\n" +
                            "Pour finir : Je suis solide, je brille, je conduis l'électricité. Je suis souvent utilisé pour créer 
                            des alliages. Mon symbole commence par la 14e lettre de l'alphabet.",`,
          answer: 'OHN',
          hint: 'Cherchez dans le tableau périodique'
        }),
        position: JSON.stringify({ x: 0, y: 2, z: 9 }),
        points: 200,
        hint_penalty: 30
      },
      {
        id: 'riddle-wisdom',
        roomId: 'secret-chamber',
        name: 'XXXC',
        description: 'Une énigme cachée dans un livre ancien',
        content: JSON.stringify({
          riddle: `Mon domaine n’est ni maison ni château,
            Pourtant, chaque jour, on y entre sans fardeau.

            On y cherche des clés, mais pas de métal,
            Plutôt celles qui ouvrent un savoir vital.

            Silencieux parfois, agité souvent,
            J’abrite l’esprit des petits et des grands.
            Qui suis je? 

            compte mes voyelles et tu trouve le chiffre pour le code`,
          answer: '3',
          hint: 'nous y sommes actuellement'
        }),
        position: JSON.stringify({ x: -3, y: 1.5, z: -2 }),
        points: 100,
        hint_penalty: 20
      },
      {
        id: 'riddle-shadow',
        roomId: 'secret-chamber',
        name: 'XXCX',
        description: 'Une énigme mystérieuse apparue sur le symbole mystique',
        content: JSON.stringify({
          riddle: ` Je transmets les pensées d'un homme à un autre,
          Je traverse le monde et pourtant je ne bouge pas.
            Qui suis-je ?
          Observe ma dernière lettre, trouve sa position dans l'alphabet,
          et tu auras le chiffre du code.`,
          answer: '5',
          hint: 'l ancêtre du SMS'
        }),
        position: JSON.stringify({ x: 2, y: 1.8, z: -5 }),
        points: 120,
        hint_penalty: 25
      },
      {
        id: 'riddle-mirror',
        roomId: 'secret-chamber',
        name: 'XCXX',
        description: 'Une énigme gravée dans les hiéroglyphes',
        content: JSON.stringify({
          riddle: `Je montre tout mais ne garde rien,
                  Je reflète le mal comme le bien.
                  Dans mon monde, tout est inversé,
                  La droite devient la gauche, c'est prouvé.
                  Qui suis-je, moi qui révèle la vérité,
                  Mais dans un monde de réalité ?
                  Trouve ma position dans l'alphabet, et tu sauras le chiffre`,
          answer: '3',
          hint: 'Je montre votre reflet...'
        }),
        position: JSON.stringify({ x: -4, y: 2, z: 3 }),
        points: 110,
        hint_penalty: 20
      },
      {
        id: 'riddle-light',
        roomId: 'secret-chamber',
        name: ' CXXX',
        description: 'Une énigme mystérieuse gravée sur un symbole solaire',
        content: JSON.stringify({
          riddle: `  Un marchand dans un village médiéval, portant un panier de six pommes dorées cueillies à l’aube.
            En chemin vers le marché, ton ami forgeron te demande un partage. Tu lui donnes la moitié des pommes.
            Une herboriste t’offre ensuite quatre pommes pour une herbe rare, que tu ajoutes au panier.
            Mais un corbeau voleur
            dérobe une pomme avant que tu n’atteignes l’étal.
            Combien de pommes reste-t-il dans ton panier ?`,
          answer: '6',
          hint: 'fais le calcul'
        }),
        position: JSON.stringify({ x: 5, y: 2.5, z: -8 }),
        points: 130,
        hint_penalty: 25
      },
      {
        id: 'professors-journal',
        roomId: 'library',
        name: 'Journal du Professeur',
        description: 'Le journal personnel du professeur disparu',
        content: JSON.stringify({
          riddle: `15 Octobre 1963

              Il ne parle jamais,
              Mais garde les souvenirs d'un temps révolu.

              Son bois grince comme une mémoire fatiguée.

              Cherche là où l'on range ce que l'on ne veut plus voir,
              Là où l'ombre cache les vérités anciennes.

              Ce que tu cherches est né
              Quand l'homme posa un pied vers l'infini...

              La réponse est dans ce tiroir que plus personne n'ouvre.`,
          answer: '1963',
          hint: 'L\'année où l\'homme a fait un petit pas mais l\'humainté un grand pas.'
        }),
        position: JSON.stringify({ x: 0, y: 1, z: 0 }),
        points: 100,
        hint_penalty: 20
      }
    ];

    // Supprimer les anciennes énigmes
    await connection.execute('DELETE FROM riddles');
    console.log('🗑️ Anciennes énigmes supprimées');

    // Insérer les nouvelles énigmes
    for (const riddle of riddles) {
      await connection.execute(
        `INSERT INTO riddles (id, room_id, name, description, content, position, points, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [riddle.id, riddle.roomId, riddle.name, riddle.description, riddle.content, riddle.position, riddle.points]
      );
      console.log(`✅ Énigme ajoutée: ${riddle.name}`);
    }

    // =============== CODES ET PUZZLES ===============
    console.log('🔐 Ajout des codes et puzzles...');

    const codePuzzles = [
      {
        id: 'drawer-code',
        objectId: 'locked-drawer',
        roomId: 'library',
        name: 'Code du Tiroir',
        type: 'code',
        description: 'Un tiroir verrouillé avec un mécanisme à code numérique',
        solution: '1963',
        hints: JSON.stringify({
          hints: [
            'Cherchez un indice dans les livres de la bibliothèque',
            'Le marque-page contient un nombre important',
            'L\'année est inscrite sur le marque-page'
          ]
        }),
        points: 50
      },
      {
        id: 'painting-code',
        objectId: 'painting',
        roomId: 'library',
        name: 'Code du Tableau',
        type: 'code',
        description: 'Un mécanisme secret derrière le tableau de la bibliothèque',
        solution: '7245',
        hints: JSON.stringify({
          hints: [
            'Résolvez l\'énigme mathématique du tiroir',
            'Calculez : étoiles du Capricorne × année du Petit Prince',
            'Le résultat est : 5 × 1449 = 7245'
          ]
        }),
        points: 100
      },
      {
        id: 'beaker-sequence',
        objectId: 'beaker-sequence',
        roomId: 'laboratory',
        name: 'Séquence des Béchers',
        type: 'sequence',
        description: 'Une séquence de couleurs à reproduire dans l\'ordre du spectre visible inversé',
        solution: 'beaker-rouge,beaker-orange,beaker-jaune,beaker-vert,beaker-bleu,beaker-violet',
        hints: JSON.stringify({
          hints: [
            'Examinez le microscope pour obtenir un indice',
            'L\'ordre du spectre visible inversé',
            'Rouge, Orange, Jaune, Vert, Bleu, Violet'
          ]
        }),
        points: 75
      },
      {
        id: 'computer-code',
        objectId: 'lab-computer',
        roomId: 'laboratory',
        name: 'Code de l\'Ordinateur',
        type: 'code',
        description: 'Le système de sécurité de l\'ordinateur du laboratoire',
        solution: 'OHN',
        hints: JSON.stringify({
          hints: [
            'Résolvez l\'énigme du tableau périodique',
            'Trouvez les symboles des éléments : Oxygène, Hydrogène, Azote',
            'Les premières lettres forment : O-H-N'
          ]
        }),
        points: 100
      },
      {
        id: 'final-code',
        objectId: 'sacred-artifact',
        roomId: 'secret-chamber',
        name: 'Code Final',
        type: 'code',
        description: 'Le code ultime pour déverrouiller l\'artefact sacré',
        solution: '6353',
        hints: JSON.stringify({
          hints: [
            'Combinez les chiffres des énigmes résolues',
            'OMBRE (5 lettres), MIROIR (M=13, 1+3=4), LIVRE (E=5), SOLEIL (3 voyelles)',
            'Le code final est : 5 + 4 + 5 + 3 = 6353'
          ]
        }),
        points: 200
      }
    ];

    // Supprimer les anciens puzzles
    await connection.execute('DELETE FROM code_puzzles');
    console.log('🗑️ Anciens puzzles supprimés');

    // Insérer les nouveaux puzzles
    for (const puzzle of codePuzzles) {
      await connection.execute(
        `INSERT INTO code_puzzles (id, object_id, room_id, name, type, description, solution, hints, points, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [puzzle.id, puzzle.objectId, puzzle.roomId, puzzle.name, puzzle.type, puzzle.description, puzzle.solution, puzzle.hints, puzzle.points]
      );
      console.log(`✅ Puzzle ajouté: ${puzzle.name}`);
    }

    console.log('🎉 Base de données peuplée avec succès !');
    console.log(`📊 ${riddles.length} énigmes et ${codePuzzles.length} puzzles ajoutés`);

  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter le script
populateDatabase(); 