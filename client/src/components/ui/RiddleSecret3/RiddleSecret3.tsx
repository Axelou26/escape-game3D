import React from 'react';

interface RiddleSecret3Props {
  onClose: () => void;
}

export const RiddleSecret3: React.FC<RiddleSecret3Props> = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      maxWidth: '600px',
      maxHeight: '80vh',
      backgroundColor: '#1a1a1a',
      color: '#c0c0c0',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 0 20px rgba(0,0,0,0.7)',
      zIndex: 1002,
      overflow: 'auto',
      border: '2px solid #4A2810'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #4A2810',
        paddingBottom: '10px'
      }}>
        <h2 style={{ 
          color: '#8B4513',
          textShadow: '0 0 5px rgba(139, 69, 19, 0.5)'
        }}>Énigme du Livre</h2>
      </div>

      <div style={{
        fontFamily: 'serif',
        lineHeight: '1.8',
        textAlign: 'center',
        marginBottom: '30px',
        backgroundColor: '#222',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #4A2810'
      }}>
        <p style={{
          fontSize: '24px',
          color: '#8B4513',
          marginBottom: '20px'
        }}>
          XXCX
        </p>
        <p style={{
          fontSize: '18px',
          color: '#ddd',
          fontStyle: 'italic',
          whiteSpace: 'pre-line',
          marginBottom: '20px'
        }}>
          Je porte les pensées d'un homme à un autre,
          Je traverse le monde sans bouger.
          Observe ma dernière lettre, trouve sa position dans l'alphabet,
          et tu auras le e chiffre du code.
          Qui suis-je ?
        </p>
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '30px'
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4A2810',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6B3811'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4A2810'}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}; 