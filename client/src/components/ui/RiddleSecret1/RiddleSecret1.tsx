import React from 'react';

interface RiddleSecret1Props {
  onClose: () => void;
}

export const RiddleSecret1: React.FC<RiddleSecret1Props> = ({ onClose }) => {
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
      border: '2px solid #333'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #333',
        paddingBottom: '10px'
      }}>
        <h2 style={{ 
          color: '#6600cc',
          textShadow: '0 0 5px rgba(102, 0, 204, 0.5)'
        }}>Énigme Mystique</h2>
      </div>

      <div style={{
        fontFamily: 'serif',
        lineHeight: '1.8',
        textAlign: 'center',
        marginBottom: '30px',
        backgroundColor: '#222',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #444'
      }}>
        <p style={{
          fontSize: '24px',
          color: '#888',
          marginBottom: '20px'
        }}>
          CXXX
        </p>
        <p style={{
          fontSize: '18px',
          color: '#ddd',
          fontStyle: 'italic',
          whiteSpace: 'pre-line'
        }}>
          Je suis ton reflet sans lumière,
          Je te suis sans bruit, mais disparais dans l'obscurité.
          Compte mes lettres et tu trouveras un chiffre du code.
        </p>
      </div>

      <div style={{
        marginTop: '30px',
        textAlign: 'center'
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6600cc',
            color: '#ffffff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s',
            boxShadow: '0 0 10px rgba(102, 0, 204, 0.3)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#7700ee';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#6600cc';
          }}
        >
          Fermer l'énigme
        </button>
      </div>
    </div>
  );
}; 