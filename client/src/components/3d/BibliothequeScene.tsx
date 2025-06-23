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
  isCodeValid?: boolean;
}

export const BibliothequeScene: React.FC<BibliothequeSceneProps> = ({
  onInteract,
  inventory = [],
  showMessage,
  onUpdateGameState,
  isCodeValid = false
}) => {
  const [examinedObject, setExaminedObject] = useState<{ id: string; type: string; description: string; } | null>(null);
  const [showBook, setShowBook] = useState(false);

  // Gestionnaire d'interactions local
  const handleInteraction = (objectId: string, objectType: string, action?: string) => {
    // Pour les actions spéciales, les déléguer directement sans interception
    if (action === 'enter_laboratory' || action === 'prompt_painting_code') {
      if (onInteract) {
        onInteract(objectId, objectType, action);
      }
      return;
    }

    // Déléguer toute la logique d'ajout d'objets à EscapeGame
    if (onInteract) {
      onInteract(objectId, objectType, action);
    }

    switch (action) {
      case 'examine':
        let description = '';
        switch (objectId) {
          case 'painting':
            if (onInteract) {
              onInteract('painting', 'painting', 'prompt_painting_code');
            }
            return; 
          case 'laboratory-door':
            description = 'Une porte verrouillée menant au laboratoire secret. Vous devez avoir la clés pour l\'ouvrir.';
            break;
        }
        setExaminedObject({ id: objectId, type: objectType, description });
        break;
    }
  };

  const handleItemClick = (item: InventoryItem) => {
    if (item.id === 'mysterious-book') {
      setShowBook(true);
    }
  };

  return (
    <>
      <Bibliotheque3D onInteract={handleInteraction} isCodeValid={isCodeValid} />

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