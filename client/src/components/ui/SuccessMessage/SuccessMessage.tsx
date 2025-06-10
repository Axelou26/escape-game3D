import React from 'react';
import './SuccessMessage.css';

interface SuccessMessageProps {
  onClose: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ onClose }) => {
  return (
    <div className="success-message-overlay">
      <div className="success-message-content">
        <h2>Félicitations !</h2>
        <p>Vous avez enfin trouvé l'artéfact du docteur.... celui-ci permet d'avoir 20/20 en coordination front back</p>
        <button className="success-message-button" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}; 