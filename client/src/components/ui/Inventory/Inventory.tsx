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
    // Emojis spécifiques par ID d'objet
    switch (id) {
      // === CLÉS ===
      case 'crystal-key':
        return '💎';
      case 'laboratory-key':
        return '🗝️';
      
      // === ÉNIGMES ===
      case 'riddle-mathematics':
        return '🔢'; // Énigme mathématique
      case 'riddle-elements':
        return '⚗️'; // Énigme des éléments (chimie)
      case 'riddle-wisdom':
        return '📚'; // Énigme de sagesse (livre)
      case 'riddle-shadow':
        return '🌑'; // Énigme des ombres
      case 'riddle-mirror':
        return '🪞'; // Énigme du miroir
      case 'riddle-light':
        return '☀️'; // Énigme de la lumière
      case 'mysterious-book':
        return '📖';
      
   
      
      // === OBJETS DE COLLECTION ===
      
      case 'ancient-key-fragment':
        return '🗝️';
      case 'crystal-shard':
        return '💎';
      
      
      // === FALLBACK PAR TYPE ===
      default:
        switch (type) {
          case 'key':
            return '🔑'; 
          case 'riddle':
            return '🧩';
          default:
            return '❓'; 
        }
    }
  };

  // Fonction pour obtenir un emoji d'état selon le contexte
  const getItemStatusIcon = (item: InventoryItem): string => {
    // Ajouter des indicateurs visuels selon l'état de l'objet
    if (item.type === 'riddle') {
      return '✨'; 
    }
    if (item.type === 'key') {
      return '🔓'; 
    }
    if (item.id?.includes('ancient') || item.id?.includes('mystical')) {
      return '✨'; 
    }
    return ''; 
  };

  // Fonction pour obtenir la rareté de l'objet
  const getItemRarity = (item: InventoryItem): string => {
    if (item.id === 'crystal-key' || item.id === 'sacred-artifact') {
      return 'legendary'; 
    }
    if (item.id?.includes('ancient') || item.id?.includes('mystical')) {
      return 'rare'; 
    }
    if (item.type === 'riddle') {
      return 'uncommon';
    }
    return 'common'; 
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
        🎒 Inventaire ({items.length}) {isExpanded ? '▼' : '▲'}
      </h2>
      <div className="inventory-grid">
        {items.map((item) => (
          <div
            key={item.id}
            data-item-id={item.id}
            data-type={item.type}
            data-rarity={getItemRarity(item)}
            className={`inventory-item ${selectedItem === item.id ? 'selected' : ''} rarity-${getItemRarity(item)}`}
            onClick={() => handleItemClick(item)}
            title={`${item.name}\n${item.description}`}
          >
            <div className="item-icon-container">
              <span className="item-icon">{getItemIcon(item.type, item.id)}</span>
              <span className="item-status">{getItemStatusIcon(item)}</span>
            </div>
            <span className="item-name">{item.name}</span>
          </div>
        ))}
        {items.length === 0 && (
          <div className="inventory-empty">
            🎒 Votre inventaire est vide
          </div>
        )}
      </div>
    </div>
  );
}; 