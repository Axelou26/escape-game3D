import React, { useState } from 'react';
import './Inventory.css';
import { InventoryItem } from '../../../types/gameTypes';

interface InventoryProps {
  items: InventoryItem[];
  onUseItem?: (item: InventoryItem) => void;
  onItemClick?: (item: InventoryItem) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ items, onUseItem, onItemClick }) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const getItemIcon = (type: string, id?: string): string => {
    switch (type) {
      case 'key':
        // Emoji spécial pour la clé en cristal
        if (id === 'crystal-key') {
          return '💎';
        }
        return '🔑';
      case 'note':
        return '📜';
      case 'tool':
        return '🔧';
      case 'clue':
        return '🔍';
      case 'riddle':
        return '📖';
      default:
        return '❓';
    }
  };

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(selectedItem === item.id ? null : item.id);
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`inventory ${isExpanded ? 'expanded' : ''}`}>
      <h2 onClick={toggleExpand} style={{ cursor: 'pointer' }}>
        Inventaire {isExpanded ? '▼' : '▲'}
      </h2>
      <div className="inventory-grid">
        {items.map((item) => (
          <div
            key={item.id}
            data-item-id={item.id}
            data-type={item.type}
            className={`inventory-item ${selectedItem === item.id ? 'selected' : ''}`}
            onClick={() => handleItemClick(item)}
            title={item.description}
          >
            <span className="item-icon">{getItemIcon(item.type, item.id)}</span>
            <span className="item-name">{item.name}</span>
            {selectedItem === item.id && (
              <div className="item-details">
                <p>{item.description}</p>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="inventory-empty">
            Votre inventaire est vide
          </div>
        )}
      </div>
    </div>
  );
}; 