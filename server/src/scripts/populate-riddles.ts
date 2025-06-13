import Riddle from '../models/riddle.model';
import CodePuzzle from '../models/code-puzzle.model';
import { sequelize } from '../models/sequelize';

export async function populateRiddlesAndCodes() {
  try {
    console.log('🚀 Début du peuplement des énigmes et codes...');

    // Synchroniser les tables
    await sequelize.sync({ alter: true });

    // Supprimer les données existantes
    await Riddle.destroy({ where: {} });
    await CodePuzzle.destroy({ where: {} });

    // ========== ÉNIGMES DE LA BIBLIOTHÈQUE ==========
    const libraryRiddles = [
      {
        id: 'riddle-mathematics',
        roomId: 'library',
        name: 'Énigme Mathématique',
        description: 'Une énigme mathématique trouvée dans le tiroir',
        content: {
          riddle: `Quatre marchaient vers la vérité, mais un seul menait le pas...

Le troisième suit le deuxième, deux fois plus fort.

Le premier ne partage rien : il est impair, plus grand que le dernier, et unique en son genre.

Ensemble, ils valent 18.

Aucun d'eux ne se ressemble.

Et le deuxième est plus petit que le quatrième.`,
          answer: '7245',
          hint: 'Pense aux nombres premiers et à leur ordre. Le premier nombre est impair et unique.'
        },
        points: 150,
        position: { x: 0, y: 0, z: 0 },
        isActive: true
      },
      {
        id: 'riddle-wisdom',
        roomId: 'library',
        name: 'Énigme de Sagesse',
        description: 'Une énigme cachée dans un livre ancien',
        content: {
          riddle: "Je transmets les pensées d'un homme à un autre,\nJe traverse le monde et pourtant je ne bouge pas.\nObserve ma dernière lettre, trouve sa position dans l'alphabet,\net tu auras le chiffre du code.\nQui suis-je ?",
          answer: 'LIVRE',
          hint: 'Je contiens des mots, des histoires, et je reste immobile sur une étagère.'
        },
        points: 100,
        position: { x: 1, y: 3, z: -7 },
        isActive: true
      }
    ];

    // ========== ÉNIGMES DU LABORATOIRE ==========
    const laboratoryRiddles = [
      {
        id: 'riddle-elements',
        roomId: 'laboratory',
        name: 'Énigme des Éléments',
        description: 'Une énigme mystérieuse apparue sur le tableau périodique',
        content: {
          riddle: "Mon premier : Je suis dans l'air sans y être. Je suis vital mais invisible. Mon symbole est un souffle, et sans moi, plus de feu.\n\nMon second : Je suis liquide et pourtant j'éteins le feu. Je tombe du ciel mais je peux inonder ton labo. On me voit mais je n'ai pas de couleur.\n\nPour finir : Je suis solide, je brille, je conduis l'électricité. Je suis souvent utilisé pour créer des alliages. Mon symbole commence par la 14e lettre de l'alphabet.",
          answer: 'OHN',
          hint: 'Pense aux éléments chimiques : Oxygène, Hydrogène, et un métal précieux...'
        },
        points: 120,
        position: { x: 1, y: 1.5, z: -5 },
        isActive: true
      }
    ];

    // ========== ÉNIGMES DE LA CHAMBRE SECRÈTE ==========
    const secretChamberRiddles = [
      {
        id: 'riddle-wisdom',
        roomId: 'secret-chamber',
        name: 'Énigme de Sagesse',
        description: 'Une énigme cachée dans un livre ancien',
        content: {
          riddle: "Je porte les pensées d'un homme à un autre,\nJe traverse le monde sans bouger.\nObserve ma dernière lettre, trouve sa position dans l'alphabet,\net tu auras le 3e chiffre du code.\nQui suis-je ?",
          answer: 'LIVRE',
          hint: 'La dernière lettre de LIVRE est E, qui est la 5e lettre de l\'alphabet'
        },
        points: 75,
        position: { x: -3, y: 1.5, z: -2 },
        isActive: true
      },
      {
        id: 'riddle-shadow',
        roomId: 'secret-chamber',
        name: 'Énigme des Ombres',
        description: 'Une énigme mystérieuse apparue sur le symbole mystique',
        content: {
          riddle: "Je suis ton reflet sans lumière,\nJe te suis sans bruit, mais disparais dans l'obscurité.\nCompte mes lettres et tu trouveras le 1er chiffre du code.\nQui suis-je ?",
          answer: 'OMBRE',
          hint: 'OMBRE a 5 lettres, donc le premier chiffre est 5'
        },
        points: 75,
        position: { x: 2, y: 1.8, z: -5 },
        isActive: true
      },
      {
        id: 'riddle-mirror',
        roomId: 'secret-chamber',
        name: 'Énigme du Miroir',
        description: 'Une énigme gravée dans les hiéroglyphes',
        content: {
          riddle: "Je reflète la vérité sans jamais parler.\nMa première lettre détient un nombre ancien.\nTrouve sa position dans l'alphabet, additionne ses chiffres,\net tu sauras le 2e chiffre du code.\nQui suis-je ?",
          answer: 'MIROIR',
          hint: 'M est la 13e lettre de l\'alphabet. 1 + 3 = 4, donc le deuxième chiffre est 4'
        },
        points: 75,
        position: { x: -4, y: 2, z: 3 },
        isActive: true
      },
      {
        id: 'riddle-light',
        roomId: 'secret-chamber',
        name: 'Énigme de la Lumière',
        description: 'Une énigme mystérieuse gravée sur un symbole solaire',
        content: {
          riddle: "Je commence au lever du jour,\nEt m'efface lorsque les paupières tombent.\nCompte le nombre de voyelles dans mon nom,\net tu connaîtras le 4e chiffre du code.\nQui suis-je ?",
          answer: 'SOLEIL',
          hint: 'SOLEIL contient 3 voyelles : O, E, I. Donc le quatrième chiffre est 3'
        },
        points: 75,
        position: { x: 5, y: 2.5, z: -8 },
        isActive: true
      }
    ];

    // ========== CODES ET PUZZLES ==========
    const codePuzzles = [
      {
        id: 'drawer-code',
        roomId: 'library',
        objectId: 'locked-drawer',
        name: 'Code du Tiroir',
        type: 'code' as const,
        solution: '1963',
        hints: {
          hints: ['Le marque-page pourrait contenir un indice...', 'Cherche une date importante dans l\'histoire.']
        },
        points: 100,
        penaltyPoints: -20,
        description: 'Un tiroir verrouillé avec un code à 4 chiffres',
        isActive: true
      },
      {
        id: 'painting-code',
        roomId: 'library',
        objectId: 'painting',
        name: 'Code du Tableau',
        type: 'code' as const,
        solution: '7245',
        hints: {
          hints: ['La solution à l\'énigme du papier pourrait être utile...', 'Résous d\'abord l\'énigme mathématique.']
        },
        points: 150,
        penaltyPoints: -25,
        description: 'Un tableau mystérieux qui cache quelque chose derrière',
        isActive: true
      },
      {
        id: 'final-chamber-code',
        roomId: 'secret-chamber',
        objectId: 'final-mechanism',
        name: 'Code Final de la Chambre',
        type: 'code' as const,
        solution: '5313',  // OMBRE(5) + MIROIR(13) + SOLEIL(3) selon les indices
        hints: {
          hints: [
            'Les énigmes des ombres, du miroir et de la lumière détiennent la clé.',
            'Compte les lettres, trouve les positions alphabétiques, et additionne les voyelles.'
          ]
        },
        points: 200,
        penaltyPoints: -10,
        description: 'Le mécanisme final pour terminer le jeu',
        isActive: true
      }
    ];

    // Insérer les énigmes
    console.log('📚 Insertion des énigmes...');
    await Riddle.bulkCreate([...libraryRiddles, ...laboratoryRiddles, ...secretChamberRiddles]);

    // Insérer les codes/puzzles
    console.log('🔐 Insertion des codes et puzzles...');
    await CodePuzzle.bulkCreate(codePuzzles);

    console.log('✅ Peuplement terminé avec succès !');
    console.log(`📊 Statistiques:`);
    console.log(`   - ${libraryRiddles.length + laboratoryRiddles.length + secretChamberRiddles.length} énigmes créées`);
    console.log(`   - ${codePuzzles.length} codes/puzzles créés`);

  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error);
    throw error;
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  populateRiddlesAndCodes()
    .then(() => {
      console.log('🎉 Script terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
} 