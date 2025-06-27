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
        id: 'professors-journal',
        roomId: 'library',
        name: 'Journal du Professeur',
        description: 'Le journal personnel du professeur disparu',
        content: {
          riddle: "20 Juillet 1969\n\nJe suis l'année du changement,\nL'année où l'homme quitta son monde rond.\nÀ bord d'un aigle, il se posa,\nSur un sol que nul ne foulait, voilà.\n\nCe fut un petit pas pour l'homme mais un grand pas pour l'humanité.\n\nLa réponse est dans ce tiroir que plus personne n'ouvre.",
          answer: '1969',
          hint: 'L\'année où l\'homme a fait un petit pas mais l\'humanité un grand pas.'
        },
        points: 100,
        position: { x: 0, y: 1, z: 0 },
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
        id: 'riddle-school',
        roomId: 'secret-chamber',
        name: 'XXXC',
        description: 'Une énigme cachée dans un livre ancien',
        content: {
          riddle: "Mon domaine n'est ni maison ni château,\nPourtant, chaque jour, on y entre sans fardeau.\n\nOn y cherche des clés, mais pas de métal,\nPlutôt celles qui ouvrent un savoir vital.\n\nSilencieux parfois, agité souvent,\nJ'abrite l'esprit des petits et des grands.\nQui suis-je ?\n\nCompte mes voyelles et tu trouveras le chiffre pour le code",
          answer: '3',
          hint: 'Nous y sommes actuellement'
        },
        points: 75,
        position: { x: -3, y: 1.5, z: -2 },
        isActive: true
      },
      {
        id: 'riddle-letter',
        roomId: 'secret-chamber',
        name: 'XXCX',
        description: 'Une énigme mystérieuse apparue sur le symbole mystique',
        content: {
          riddle: "Je transmets les pensées d'un homme à un autre,\nJe traverse le monde et pourtant je ne bouge pas.\nQui suis-je ?\nObserve ma dernière lettre, trouve sa position dans l'alphabet,\net tu auras le chiffre du code.",
          answer: '5',
          hint: 'L\'ancêtre du SMS'
        },
        points: 75,
        position: { x: 2, y: 1.8, z: -5 },
        isActive: true
      },
      {
        id: 'riddle-mirror',
        roomId: 'secret-chamber',
        name: 'XCXX',
        description: 'Une énigme gravée dans les hiéroglyphes',
        content: {
          riddle: "Je montre tout mais ne garde rien,\nJe reflète le mal comme le bien.\nDans mon monde, tout est inversé,\nLa droite devient la gauche, c'est prouvé.\nQui suis-je, moi qui révèle la vérité,\nMais dans un monde de réalité ?\nTrouve ma position dans l'alphabet, et tu sauras le chiffre",
          answer: '3',
          hint: 'Je montre votre reflet...'
        },
        points: 75,
        position: { x: -4, y: 2, z: 3 },
        isActive: true
      },
      {
        id: 'riddle-apples',
        roomId: 'secret-chamber',
        name: 'CXXX',
        description: 'Une énigme mystérieuse gravée sur un symbole solaire',
        content: {
          riddle: "Un marchand dans un village médiéval, portant un panier de six pommes dorées cueillies à l'aube.\nEn chemin vers le marché, ton ami forgeron te demande un partage. Tu lui donnes la moitié des pommes.\nUne herboriste t'offre ensuite quatre pommes pour une herbe rare, que tu ajoutes au panier.\nMais un corbeau voleur dérobe une pomme avant que tu n'atteignes l'étal.\nCombien de pommes reste-t-il dans ton panier ?",
          answer: '6',
          hint: 'Fais le calcul'
        },
        points: 75,
        position: { x: 5, y: 2.5, z: -8 },
        isActive: true
      },
      
    ];

    // ========== CODES ET PUZZLES ==========
    const codePuzzles = [
      {
        id: 'drawer-code',
        roomId: 'library',
        objectId: 'locked-drawer',
        name: 'Code du Tiroir',
        type: 'code' as const,
        solution: '1969',
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
        id: 'beaker-sequence',
        roomId: 'laboratory',
        objectId: 'beaker-sequence',
        name: 'Séquence des Béchers',
        type: 'sequence' as const,
        solution: 'beaker-rouge,beaker-orange,beaker-jaune,beaker-vert,beaker-bleu,beaker-violet',
        hints: {
          hints: [
            'Examinez le microscope pour obtenir un indice',
            'L\'ordre du spectre visible inversé',
            'Rouge, Orange, Jaune, Vert, Bleu, Violet'
          ]
        },
        points: 75,
        penaltyPoints: -10,
        description: 'Une séquence de couleurs à reproduire dans l\'ordre du spectre visible inversé',
        isActive: true
      },
      {
        id: 'computer-code',
        roomId: 'laboratory',
        objectId: 'computer-code',
        name: 'Code de l\'Ordinateur',
        type: 'code' as const,
        solution: 'OHN',
        hints: {
          hints: [
            'Regardez l\'énigme du tableau périodique',
            'La réponse à l\'énigme des éléments est la clé',
            'Oxygène, Hydrogène, et un métal précieux...'
          ]
        },
        points: 100,
        penaltyPoints: -15,
        description: 'L\'ordinateur sécurisé du laboratoire nécessite un code basé sur les éléments',
        isActive: true
      },
      {
        id: 'final-chamber-code',
        roomId: 'secret-chamber',
        objectId: 'final-mechanism',
        name: 'Code Final de la Chambre',
        type: 'code' as const,
        solution: '6353',
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