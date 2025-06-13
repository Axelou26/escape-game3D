import React from 'react';
import './PauseMenu.css';

interface PauseMenuProps {
  onClose: () => void;
  onRestart: () => void;
  onReturnToIntro: () => void;
  currentRoom: string;
  unlockedRooms: string[];
  onRoomChange: (room: 'library' | 'laboratory' | 'secret-chamber') => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onClose,
  onRestart,
  onReturnToIntro,
  currentRoom,
  unlockedRooms,
  onRoomChange
}) => {
  return (
    <div className="pause-menu-overlay">
      <div className="pause-menu">
        <div className="pause-menu-header">
          <h2>Menu Pause</h2>
        </div>
        
        <div className="pause-menu-content">
          <div className="pause-menu-section">
            <div className="pause-menu-buttons">
              <button onClick={onRestart} className="menu-button restart-button">
                <span className="button-icon">🔄</span>
                Recommencer
              </button>
              <button onClick={onReturnToIntro} className="menu-button intro-button">
                <span className="button-icon">🏠</span>
                Retour à l'intro
              </button>
              <button onClick={onClose} className="menu-button resume-button">
                <span className="button-icon">▶️</span>
                Reprendre
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 