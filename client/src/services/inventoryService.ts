import { gameStateApi, InventoryItem } from './gameStateApi';
import { handleError } from '../utils/errorHandler';

class InventoryService {
  private currentInventory: InventoryItem[] = [];

  // Initialiser l'inventaire depuis le backend UNIQUEMENT
  async initializeInventory(): Promise<InventoryItem[]> {
    try {
      const inventory = await gameStateApi.getInventory();
      this.currentInventory = inventory;
      return inventory;
    } catch (error) {
      handleError(error, 'Erreur lors de l\'initialisation de l\'inventaire');
      throw new Error('Impossible d\'initialiser l\'inventaire. Connexion serveur requise.');
    }
  }

  // Ajouter un objet à l'inventaire - TOUJOURS côté serveur
  async addItem(
    itemId: string,
    itemType: string,
    itemName: string,
    itemDescription: string,
    itemContent?: any
  ): Promise<{ inventory: InventoryItem[]; newItem: InventoryItem }> {
    try {
      // Validation des paramètres côté client
      if (!itemId || !itemType || !itemName) {
        throw new Error(`Paramètres invalides - itemId: ${itemId}, itemType: ${itemType}, itemName: ${itemName}`);
      }

      // Vérifier si l'objet existe déjà côté client (évite un appel serveur inutile)
      if (this.hasItem(itemId)) {
        throw new Error(`L'objet "${itemName}" (${itemId}) est déjà dans votre inventaire`);
      }
      const result = await gameStateApi.addToInventory(
        itemId,
        itemType,
        itemName,
        itemDescription,
        itemContent
      );
      this.currentInventory = result.inventory;
      return result;
    } catch (error: any) {
      // CORRECTION: Gérer spécifiquement l'erreur 409 (objet déjà existant)
      if (error.response?.status === 409 || error.message?.includes('déjà dans l\'inventaire')) {
        console.warn(`⚠️ Objet "${itemName}" déjà dans l'inventaire, synchronisation...`);
        
        // Si le serveur renvoie l'inventaire dans la réponse d'erreur, l'utiliser
        if (error.response?.data?.inventory) {
          this.currentInventory = error.response.data.inventory;
          return {
            inventory: this.currentInventory,
            newItem: this.currentInventory.find(item => item.id === itemId) || {
              id: itemId,
              type: itemType,
              name: itemName,
              description: itemDescription,
              content: itemContent
            }
          };
        }
        
        // Sinon, synchroniser avec le serveur
        await this.syncWithServer();
        const existingItem = this.getItem(itemId);
        if (existingItem) {
          return {
            inventory: this.currentInventory,
            newItem: existingItem
          };
        }
      }
      
      handleError(error, 'Erreur lors de l\'ajout à l\'inventaire');
      throw new Error('Impossible d\'ajouter l\'objet. Connexion serveur requise.');
    }
  }

  // Supprimer un objet de l'inventaire - TOUJOURS côté serveur
  async removeItem(itemId: string): Promise<InventoryItem[]> {
    try {
      const inventory = await gameStateApi.removeFromInventory(itemId);
      this.currentInventory = inventory;
      return inventory;
    } catch (error) {
      handleError(error, 'Erreur lors de la suppression de l\'inventaire');
      throw new Error('Impossible de supprimer l\'objet. Connexion serveur requise.');
    }
  }

  // Obtenir l'inventaire actuel (lecture seule)
  getInventory(): InventoryItem[] {
    return [...this.currentInventory];
  }

  // Vérifier si un objet existe dans l'inventaire
  hasItem(itemId: string): boolean {
    return this.currentInventory.some(item => item.id === itemId);
  }

  // Obtenir un objet spécifique
  getItem(itemId: string): InventoryItem | undefined {
    return this.currentInventory.find(item => item.id === itemId);
  }

  // Synchroniser avec le serveur
  async syncWithServer(): Promise<void> {
    try {
      const serverInventory = await gameStateApi.getInventory();
      this.currentInventory = serverInventory;
    } catch (error) {
      handleError(error, 'Erreur lors de la synchronisation de l\'inventaire');
      throw new Error('Impossible de synchroniser l\'inventaire. Connexion serveur requise.');
    }
  }

  // Réinitialiser complètement l'inventaire (pour le redémarrage du jeu)
  resetInventory(): void {
    this.currentInventory = [];
  }
}

export const inventoryService = new InventoryService(); 