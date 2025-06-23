import React from 'react';
import './GameOverMessage.css';

interface GameOverMessageProps {
  score: number;
  elapsedTime: number;
  onViewLeaderboard: () => void;
  onRestart: () => void;
  onReturnHome: () => void;
}

export const GameOverMessage: React.FC<GameOverMessageProps> = ({ 
  score, 
  elapsedTime, 
  onViewLeaderboard, 
  onRestart, 
  onReturnHome 
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-over-overlay">
      <div className="game-over-content">
        <h2>⏰ Temps Écoulé !</h2>
        <div className="game-over-icon">🔓❌</div>
        <p className="game-over-message">
          Vous n'avez pas réussi à vous échapper à temps !<br/>
          Le temps limite de 60 minutes a été atteint.
        </p>
        
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Score Final:</span>
            <span className="stat-value">{score} points</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Temps Écoulé:</span>
            <span className="stat-value">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        <div className="game-over-buttons">
          <button 
            className="game-over-button leaderboard-button" 
            onClick={onViewLeaderboard}
          >
            🏆 Voir le Classement
          </button>
          <button 
            className="game-over-button restart-button" 
            onClick={onRestart}
          >
            🔄 Recommencer
          </button>
          <button 
            className="game-over-button home-button" 
            onClick={onReturnHome}
          >
            🏠 Retour à l'Accueil
          </button>
        </div>
      </div>
    </div>
  );
}; 