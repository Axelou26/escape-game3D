import { Room } from '../../types/gameTypes';

export const laboratoryRoom: Room = {
  id: 'laboratory',
  type: 'laboratory',
  name: 'Laboratoire',
  description: 'Un laboratoire ancien rempli d\'équipements scientifiques mystérieux et d\'expériences inachevées.',
  objects: [
    {
      id: 'microscope',
      name: 'Microscope',
      type: 'equipment',
      position: { x: -2, y: 1.2, z: -3 },
      isActive: true,
      isHighlighted: false,
      blocksMovement: false,
      description: 'Un microscope ancien avec une lame de verre particulière.',
      providesItems: ['strange-formula'],
    },
    {
      id: 'strange-formula',
      name: 'Formule Étrange',
      type: 'inventory',
      position: { x: 0, y: 0, z: 0 },
      isActive: false,
      isHighlighted: false,
      blocksMovement: false,
      description: 'Une formule chimique complexe visible uniquement au microscope.',
    },
    
    
  ],
  isCompleted: false,
}; 