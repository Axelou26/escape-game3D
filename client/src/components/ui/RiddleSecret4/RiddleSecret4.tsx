import React from 'react';

interface RiddleSecret4Props {
  onClose: () => void;
}

export const RiddleSecret4: React.FC<RiddleSecret4Props> = ({ onClose }) => {
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
      border: '2px solid #FFD700'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #FFD700',
        paddingBottom: '10px'
      }}>
        <h2 style={{ 
          color: '#FFA500',
          textShadow: '0 0 5px rgba(255, 165, 0, 0.5)'
        }}>Énigme de la Lumière</h2>
      </div>

      <div style={{
        fontFamily: 'serif',
        lineHeight: '1.8',
        textAlign: 'center',
        marginBottom: '30px',
        backgroundColor: '#222',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #FFD700'
      }}>
        <p style={{
          fontSize: '24px',
          color: '#FFD700',
          marginBottom: '20px'
        }}>
          XXXC
        </p>
        <p style={{
          fontSize: '16px',
          color: '#ddd',
          fontStyle: 'italic',
          whiteSpace: 'pre-line',
          marginBottom: '20px'
        }}>
            Mon domaine n’est ni maison ni château,<br/>
            Pourtant, chaque jour, on y entre sans fardeau.<br/>

            On y cherche des clés, mais pas de métal,<br/>
            Plutôt celles qui ouvrent un savoir vital.<br/>

            Silencieux parfois, agité souvent,<br/>
            J’abrite l’esprit des petits et des grands.<br/>
            Qui suis je? <br/>

            compte mes voyelles et tu trouve le chiffre pour le code
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
            backgroundColor: '#FFA500',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FFB52E'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFA500'}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}; 