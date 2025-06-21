import { sequelize } from '../models/sequelize';
import Riddle from '../models/riddle.model';

async function verifyRiddles() {
  try {
    console.log('🕵️ Vérification des énigmes dans la base de données...');
    
    // Se connecter à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion DB réussie');
    
    // Chercher l'énigme riddle-elements
    const riddleElements = await Riddle.findByPk('riddle-elements');
    
    if (!riddleElements) {
      console.log('❌ Énigme "riddle-elements" introuvable. Ajout en cours...');
      
      // Créer l'énigme manquante
      await Riddle.create({
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
      });
      
      console.log('✅ Énigme "riddle-elements" créée avec succès');
    } else {
      console.log('✅ Énigme "riddle-elements" trouvée:', {
        id: riddleElements.id,
        name: riddleElements.name,
        roomId: riddleElements.roomId
      });
    }
    
    // Lister toutes les énigmes
    const allRiddles = await Riddle.findAll({
      attributes: ['id', 'name', 'roomId'],
      order: [['roomId', 'ASC'], ['name', 'ASC']]
    });
    
    console.log('\n📋 Liste de toutes les énigmes:');
    allRiddles.forEach(riddle => {
      console.log(`  - ${riddle.id} (${riddle.roomId}): ${riddle.name}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Connexion fermée');
  }
}

// Lancer la vérification si ce script est exécuté directement
if (require.main === module) {
  verifyRiddles();
}

export { verifyRiddles }; 