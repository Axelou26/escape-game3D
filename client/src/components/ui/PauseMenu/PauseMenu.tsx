import React from 'react';
import './PauseMenu.css';

interface PauseMenuProps {
  onClose: () => void;
  onRestart: () => void;
  currentRoom: string;
  unlockedRooms: string[];
  onRoomChange: (room: 'library' | 'laboratory' | 'secret-chamber') => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onClose,
  onRestart,
  currentRoom,
  unlockedRooms,
  onRoomChange
}) => {
  const rooms = [
    { id: 'library', name: 'Bibliothèque', icon: '📚' },
    { id: 'laboratory', name: 'Laboratoire', icon: '🧪' },
    { id: 'secret-chamber', name: 'Chambre Secrète', icon: '🔒' }
  ];

  return (
    <div className="pause-menu-overlay">
      <div className="pause-menu">
        <div className="pause-menu-header">
          <h2>Menu Pause</h2>
        </div>
        
        <div className="pause-menu-content">
          <div className="pause-menu-section">
            <h3>Salles Disponibles</h3>
            <div className="room-buttons">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => onRoomChange(room.id as 'library' | 'laboratory' | 'secret-chamber')}
                  disabled={!unlockedRooms.includes(room.id) || currentRoom === room.id}
                  className={`room-select-button ${currentRoom === room.id ? 'active' : ''}`}
                >
                  <span className="room-icon">{room.icon}</span>
                  <span className="room-name">{room.name}</span>
                  {currentRoom === room.id && <span className="room-current">(Actuelle)</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="pause-menu-section">
            <div className="pause-menu-buttons">
              <button onClick={onRestart} className="menu-button restart-button">
                <span className="button-icon">🔄</span>
                Recommencer
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