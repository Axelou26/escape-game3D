import React from 'react';
import { InventoryItem } from '../../../types/gameTypes';

interface RiddleContentProps {
  onClose: () => void;
  riddle?: InventoryItem;
}

export const RiddleContent: React.FC<RiddleContentProps> = ({ onClose, riddle }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      maxWidth: '500px',
      backgroundColor: '#E6D5AC',
      color: '#2B1810',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      zIndex: 1002,
      fontFamily: 'serif'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ 
          color: '#8B4513',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>{riddle?.name || 'Énigme Mystérieuse'}</h2>
      </div>

      <div style={{
        backgroundColor: '#F5E6CC',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        lineHeight: '1.8',
        fontSize: '18px',
        textAlign: 'left',
        fontStyle: 'italic',
        whiteSpace: 'pre-line'
      }}>
        {riddle?.content?.riddle || 'Chargement de l\'énigme...'}
      </div>

      <div style={{
        marginTop: '30px',
        textAlign: 'center'
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#8B4513',
            color: '#E6D5AC',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6B3410'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8B4513'}
        >
          Fermer l'énigme
        </button>
      </div>
    </div>
  );
}; 