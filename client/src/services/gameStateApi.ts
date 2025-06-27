import { API_URL } from '../config';

export interface GameConfig {
  initialScore: number;
  maxGameDuration: number;
  maxInventoryItems: number;
  availableRooms: string[];
  timePenaltyInterval: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: string;
  content?: any;
}

export interface TimerSyncResponse {
  status: string;
  elapsedTime: number;
  score: number;
  penaltiesApplied: number;
  timeDifference: number;
  nextPenaltyIn: number;
  gameEnded?: boolean;
}

export interface CurrentTimeResponse {
  status: string;
  elapsedTime: number;
  remainingTime: number;
  nextPenaltyIn: number;
  maxDuration: number;
  penaltyInterval: number;
}

class GameStateApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Configuration du jeu
  async getGameConfig(): Promise<GameConfig> {
    try {
      const response = await fetch(`${API_URL}/game-state/config`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.config;
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération de la configuration');
      }
    } catch (error) {
      console.error('Erreur getGameConfig:', error);
      throw error;
    }
  }

  // Gestion de l'inventaire
  async addToInventory(
    itemId: string,
    itemType: string,
    itemName: string,
    itemDescription: string,
    itemContent?: any
  ): Promise<{ inventory: InventoryItem[]; newItem: InventoryItem }> {
        try {
      const response = await fetch(`${API_URL}/game-state/inventory/add`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          itemId,
          itemType,
          itemName,
          itemDescription,
          itemContent
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return {
          inventory: data.inventory,
          newItem: data.newItem
        };
      } else {
        throw new Error(data.message || 'Erreur lors de l\'ajout à l\'inventaire');
      }
    } catch (error) {
      throw error;
    }
  }

  // Gestion des salles
  async changeRoom(newRoom: string): Promise<{ currentRoom: string; unlockedRooms: string[] }> {
    try {
      const response = await fetch(`${API_URL}/game-state/room/change`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ newRoom })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return {
          currentRoom: data.currentRoom,
          unlockedRooms: data.unlockedRooms
        };
      } else {
        throw new Error(data.message || 'Erreur lors du changement de salle');
      }
    } catch (error) {
      console.error('Erreur changeRoom:', error);
      throw error;
    }
  }

  // Gestion de la progression
  async updateGameProgress(progressType: string, value: boolean): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/game-state/progress/update`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ progressType, value })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.gameState;
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour de la progression');
      }
    } catch (error) {
      console.error('Erreur updateGameProgress:', error);
      throw error;
    }
  }

  // Gestion du timer
  async syncTimer(clientElapsedTime: number): Promise<TimerSyncResponse> {
    try {
      const response = await fetch(`${API_URL}/game-state/timer/sync`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ clientElapsedTime })
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Gestion spécifique du rate limiting
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Rate limit atteint: ${errorData.message || 'Trop de requêtes'}`);
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur syncTimer:', error);
      throw error;
    }
  }

  async getCurrentTime(): Promise<CurrentTimeResponse> {
    try {
      const response = await fetch(`${API_URL}/game-state/timer/current`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Gestion spécifique du rate limiting
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Rate limit atteint: ${errorData.message || 'Trop de requêtes'}`);
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data;
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération du temps');
      }
    } catch (error) {
      console.error('Erreur getCurrentTime:', error);
      throw error;
    }
  }

  async pauseGame(): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/game-state/timer/pause`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.message || 'Erreur lors de la pause');
      }
    } catch (error) {
      console.error('Erreur pauseGame:', error);
      throw error;
    }
  }

  // Récupérer l'inventaire complet
  async getInventory(): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${API_URL}/game-state/inventory`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.inventory;
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération de l\'inventaire');
      }
    } catch (error) {
      console.error('Erreur getInventory:', error);
      throw error;
    }
  }

  // Supprimer un objet de l'inventaire
  async removeFromInventory(itemId: string): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${API_URL}/game-state/inventory/remove`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ itemId })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        return data.inventory;
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression de l\'inventaire');
      }
    } catch (error) {
      console.error('Erreur removeFromInventory:', error);
      throw error;
    }
  }
}

export const gameStateApi = new GameStateApiService(); 