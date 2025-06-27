import React, { useState, useEffect } from 'react';
import { gameApi } from '../../../services/gameApi';

interface BookContentProps {
  onClose: () => void;
}

export const BookContent: React.FC<BookContentProps> = ({ onClose }) => {
  const [content, setContent] = useState<string>('Chargement du journal...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJournalContent = async () => {
      try {
        const journalData = await gameApi.getRiddleContent('professors-journal');
        setContent(typeof journalData.content === 'string' ? journalData.content : journalData.content.riddle);
      } catch (error) {
        console.error('Erreur lors du chargement du journal:', error);
        setContent('Impossible de charger le contenu du journal.');
      } finally {
        setIsLoading(false);
      }
    };

    loadJournalContent();
  }, []);

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
        marginBottom: '20px',
        whiteSpace: 'pre-line'
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', fontStyle: 'italic' }}>
            Chargement du journal...
          </div>
        ) : (
          <p>{content}</p>
        )}
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