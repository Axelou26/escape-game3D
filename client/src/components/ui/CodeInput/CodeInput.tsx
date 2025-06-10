import React, { useState } from 'react';

interface CodeInputProps {
  onSubmit: (code: string) => void;
  onClose: () => void;
}

export const CodeInput: React.FC<CodeInputProps> = ({ onSubmit, onClose }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(code);
    setCode('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#2B1810',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      zIndex: 1002,
      width: '300px'
    }}>
      <h3 style={{
        color: '#E6D5AC',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        Entrez le code
      </h3>

      <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{
            width: '200px',
            padding: '10px',
            fontSize: '18px',
            textAlign: 'center',
            backgroundColor: '#E6D5AC',
            border: 'none',
            borderRadius: '5px',
            marginBottom: '20px'
          }}
          maxLength={4}
          placeholder="____"
        />

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button
            type="submit"
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
            Valider
          </button>
          
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4A3B2C',
              color: '#E6D5AC',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}; 