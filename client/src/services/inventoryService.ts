import { gameStateApi, InventoryItem } from './gameStateApi';
import { handleError } from '../utils/errorHandler';

class InventoryService {
  private offlineInventory: InventoryItem[] = [];
  private isOfflineMode = false;

  // Initialiser l'inventaire depuis le backend ou localStorage
  async initializeInventory(): Promise<InventoryItem[]> {
    try {
      // Essayer de récupérer depuis le backend
      const inventory = await gameStateApi.getInventory();
      this.offlineInventory = inventory;
      this.isOfflineMode = false;
      return inventory;
    } catch (error) {
      handleError(error, 'Erreur lors de l\'initialisation de l\'inventaire');
      
      // Fallback : récupérer depuis localStorage
      const savedInventory = localStorage.getItem('gameState');
      if (savedInventory) {
        try {
          const gameState = JSON.parse(savedInventory);
          this.offlineInventory = gameState.inventory || [];
        } catch {
          this.offlineInventory = [];
        }
      }
      
      this.isOfflineMode = true;
      console.log('🔌 Mode hors-ligne activé pour l\'inventaire');
      return this.offlineInventory;
    }
  }

  // Ajouter un objet à l'inventaire
  async addItem(
    itemId: string,
    itemType: string,
    itemName: string,
    itemDescription: string,
    itemContent?: any
  ): Promise<{ inventory: InventoryItem[]; newItem: InventoryItem }> {
    try {
      if (!this.isOfflineMode) {
        // Mode en ligne : utiliser l'API
        const result = await gameStateApi.addToInventory(
          itemId,
          itemType,
          itemName,
          itemDescription,
          itemContent
        );
        this.offlineInventory = result.inventory;
        return result;
      }
    } catch (error) {
      handleError(error, 'Erreur lors de l\'ajout à l\'inventaire');
      this.isOfflineMode = true;
      console.log('🔌 Passage en mode hors-ligne pour l\'inventaire');
    }

    // Mode hors-ligne : gestion locale
    const newItem: InventoryItem = {
      id: itemId,
      name: itemName,
      description: itemDescription,
      type: itemType,
      content: itemContent
    };

    // Vérifier si l'objet existe déjà
    const itemExists = this.offlineInventory.some(item => item.id === itemId);
    if (itemExists) {
      return {
        inventory: this.offlineInventory,
        newItem
      };
    }

    // Vérifier la limite d'inventaire (20 objets max)
    if (this.offlineInventory.length >= 20) {
      throw new Error('Inventaire plein');
    }

    // Ajouter l'objet
    this.offlineInventory.push(newItem);
    this.saveToLocalStorage();

    return {
      inventory: this.offlineInventory,
      newItem
    };
  }

  // Supprimer un objet de l'inventaire
  async removeItem(itemId: string): Promise<InventoryItem[]> {
    try {
      if (!this.isOfflineMode) {
        // Mode en ligne : utiliser l'API
        const inventory = await gameStateApi.removeFromInventory(itemId);
        this.offlineInventory = inventory;
        return inventory;
      }
    } catch (error) {
      handleError(error, 'Erreur lors de la suppression de l\'inventaire');
      this.isOfflineMode = true;
      console.log('🔌 Passage en mode hors-ligne pour l\'inventaire');
    }

    // Mode hors-ligne : gestion locale
    const itemIndex = this.offlineInventory.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Objet non trouvé dans l\'inventaire');
    }

    this.offlineInventory.splice(itemIndex, 1);
    this.saveToLocalStorage();
    return this.offlineInventory;
  }

  // Obtenir l'inventaire actuel
  getInventory(): InventoryItem[] {
    return [...this.offlineInventory];
  }

  // Vérifier si un objet existe dans l'inventaire
  hasItem(itemId: string): boolean {
    return this.offlineInventory.some(item => item.id === itemId);
  }

  // Obtenir un objet spécifique
  getItem(itemId: string): InventoryItem | undefined {
    return this.offlineInventory.find(item => item.id === itemId);
  }

  // Synchroniser avec le serveur (quand la connexion revient)
  async syncWithServer(): Promise<void> {
    if (!this.isOfflineMode) return;

    try {
      // Récupérer l'inventaire du serveur
      const serverInventory = await gameStateApi.getInventory();
      
      // Fusionner les inventaires (priorité au serveur)
      this.offlineInventory = serverInventory;
      this.isOfflineMode = false;
      this.saveToLocalStorage();
      
      console.log('✅ Inventaire synchronisé avec le serveur');
    } catch (error) {
      handleError(error, 'Erreur lors de la synchronisation de l\'inventaire');
    }
  }

  // Sauvegarder dans localStorage
  private saveToLocalStorage(): void {
    try {
      const savedGameState = localStorage.getItem('gameState');
      let gameState: any = {};
      
      if (savedGameState) {
        gameState = JSON.parse(savedGameState);
      }
      
      gameState.inventory = this.offlineInventory;
      localStorage.setItem('gameState', JSON.stringify(gameState));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'inventaire:', error);
    }
  }

  // Nettoyer l'inventaire (supprimer les doublons, objets invalides)
  cleanInventory(): InventoryItem[] {
    const seen = new Set<string>();
    this.offlineInventory = this.offlineInventory.filter(item => {
      // Vérifier la validité de l'objet
      if (!item || !item.id || !item.name || !item.type) {
        return false;
      }
      
      // Supprimer les doublons
      if (seen.has(item.id)) {
        return false;
      }
      
      seen.add(item.id);
      return true;
    });
    
    this.saveToLocalStorage();
    return this.offlineInventory;
  }

  // Obtenir le statut de connexion
  isOnline(): boolean {
    return !this.isOfflineMode;
  }
}

export const inventoryService = new InventoryService(); 