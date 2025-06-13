import React from 'react';

interface RiddleSecret2Props {
  onClose: () => void;
}

export const RiddleSecret2: React.FC<RiddleSecret2Props> = ({ onClose }) => {
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
      border: '2px solid #3D2B1F'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #3D2B1F',
        paddingBottom: '10px'
      }}>
        <h2 style={{ 
          color: '#8B4513',
          textShadow: '0 0 5px rgba(139, 69, 19, 0.5)'
        }}>Hiéroglyphes Anciens</h2>
      </div>

      <div style={{
        fontFamily: 'serif',
        lineHeight: '1.8',
        textAlign: 'center',
        marginBottom: '30px',
        backgroundColor: '#222',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #3D2B1F'
      }}>
        <p style={{
          fontSize: '18px',
          color: '#ddd',
          fontStyle: 'italic',
          whiteSpace: 'pre-line',
          marginBottom: '20px'
        }}>
          Je reflète la vérité sans jamais parler.
          Ma première lettre détient un nombre ancien.
          Trouve ma position dans l'alphabet, et tu sauras le chiffre.
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
            backgroundColor: '#8B4513',
            color: '#ffffff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s',
            boxShadow: '0 0 10px rgba(139, 69, 19, 0.3)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#A0522D';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#8B4513';
          }}
        >
          Fermer l'énigme
        </button>
      </div>
    </div>
  );
}; 