import React from 'react';

interface BookContentProps {
  onClose: () => void;
}

export const BookContent: React.FC<BookContentProps> = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      maxWidth: '600px',
      maxHeight: '80vh',
      backgroundColor: '#2B1810',
      color: '#E6D5AC',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      zIndex: 1002,
      overflow: 'auto'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #8B4513',
        paddingBottom: '10px'
      }}>
        <h2 style={{ color: '#DAA520' }}>Journal du Professeur</h2>
      </div>

      <div style={{
        fontFamily: 'serif',
        lineHeight: '1.6',
        textAlign: 'justify',
        marginBottom: '20px'
      }}>
        <p>
          15 Octobre 1963
        </p>
        <p>
        Il ne parle jamais,
          Mais garde les souvenirs d’un temps révolu.

          Son bois grince comme une mémoire fatiguée.

          Cherche là où l’on range ce que l’on ne veut plus voir,
          Là où l’ombre cache les vérités anciennes.

          Ce que tu cherches est né
          Quand l’homme posa un pied vers l’infini...*
        </p>
        <p>
        La réponse est dans ce tiroir que plus personne n’ouvre.
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
            color: '#E6D5AC',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Fermer le livre
        </button>
      </div>
    </div>
  );
}; 