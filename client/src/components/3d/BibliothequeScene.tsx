import React, { useState } from 'react';
import { Bibliotheque3D } from './Bibliotheque3D';
import { InventoryItem } from '../../types/gameTypes';
import { GameState } from '../../types/gameState';
import { BookContent } from '../ui/BookContent/BookContent';

interface BibliothequeSceneProps {
  onInteract?: (objectId: string, objectType: string, action?: string) => void;
  inventory?: InventoryItem[];
  showMessage?: (message: string) => void;
  onUpdateGameState?: (updates: Partial<GameState>) => void;
}

export const BibliothequeScene: React.FC<BibliothequeSceneProps> = ({
  onInteract,
  inventory = [],
  showMessage,
  onUpdateGameState
}) => {
  const [examinedObject, setExaminedObject] = useState<{ id: string; type: string; description: string; } | null>(null);
  const [showBook, setShowBook] = useState(false);

  const hasLaboratoryKey = Array.isArray(inventory) && inventory.some(item => 
    typeof item === 'string' ? item === 'laboratory-key' : item.id === 'laboratory-key'
  );

  // Gestionnaire d'interactions local
  const handleInteraction = (objectId: string, objectType: string, action?: string) => {
    // Déléguer toute la logique d'ajout d'objets à EscapeGame
    if (onInteract) {
      onInteract(objectId, objectType, action);
    }

    switch (action) {
      case 'examine':
        let description = '';
        switch (objectId) {
          case 'painting':
            description = 'Un tableau mystérieux représentant quatre éléments... Il semble y avoir un mécanisme caché.';
            if (onInteract) {
              onInteract('painting', 'interactive', 'prompt_painting_code');
            }
            break;
          case 'laboratory-door':
            if (hasLaboratoryKey) {
              description = 'La porte du laboratoire... Vous pouvez l\'ouvrir avec la clé.';
              if (onInteract) {
                onInteract('laboratory-door', 'door', 'enter_laboratory');
              }
            } else {
              description = 'Une porte verrouillée menant au laboratoire secret. Il vous faut une clé pour l\'ouvrir.';
            }
            break;
        }
        setExaminedObject({ id: objectId, type: objectType, description });
        if (showMessage) {
          showMessage(description);
        }
        break;
    }
  };

  const handleItemClick = (item: InventoryItem) => {
    if (item.id === 'professors-journal') {
      setShowBook(true);
    }
  };

  return (
    <>
      <Bibliotheque3D onInteract={handleInteraction} />

      {/* Affichage de l'objet examiné */}
      {examinedObject && (
        <div className="examined-object" style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '15px',
          borderRadius: '5px',
          color: 'white',
          zIndex: 1000
        }}>
          <p>{examinedObject.description}</p>
          <button
            onClick={() => setExaminedObject(null)}
            style={{
              padding: '5px 10px',
              background: '#4a2810',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      )}

      {showBook && <BookContent onClose={() => setShowBook(false)} />}
    </>
  );
}; 