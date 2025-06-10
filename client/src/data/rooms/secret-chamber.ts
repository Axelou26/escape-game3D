import { Room } from '../../types/gameTypes';

export const secretChamberRoom: Room = {
  id: 'secret-chamber',
  type: 'secret-chamber',
  name: 'Chambre Secrète',
  description: 'Une pièce mystérieuse cachée derrière le laboratoire, remplie d\'artefacts anciens et de secrets.',
  objects: [
    {
      id: 'ancient-desk',
      name: 'Bureau Ancien',
      type: 'desk',
      position: { x: -1, y: 0.8, z: -4 },
      isActive: true,
      isHighlighted: false,
      blocksMovement: true,
      description: 'Un bureau en bois massif couvert de documents mystérieux.',
      providesItems: ['final-note'],
    },
    {
      id: 'final-note',
      name: 'Note Finale',
      type: 'document',
      position: { x: 0, y: 0, z: 0 },
      isActive: false,
      isHighlighted: false,
      blocksMovement: false,
      description: 'Une note révélant les dernières découvertes du Professeur.',
    },
    {
      id: 'artifact-pedestal',
      name: 'Piédestal à Artefact',
      type: 'pedestal',
      position: { x: 0, y: 1, z: -6 },
      isActive: true,
      isHighlighted: false,
      blocksMovement: true,
      description: 'Un piédestal ancien avec des inscriptions énigmatiques.',
      puzzle: {
        type: 'placement',
        solution: 'crystal-orb',
        hints: ['L\'artefact doit être placé avec précision...']
      },
    },
    {
      id: 'crystal-orb',
      name: 'Orbe de Cristal',
      type: 'artifact',
      position: { x: 3, y: 1.5, z: -2 },
      isActive: true,
      isHighlighted: false,
      blocksMovement: false,
      description: 'Un orbe mystérieux qui semble contenir une énergie ancienne.',
    }
  ],
  isCompleted: false,
}; 