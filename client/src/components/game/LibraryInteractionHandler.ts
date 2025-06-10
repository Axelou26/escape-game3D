import { GameState, InteractiveObject, InventoryItem } from '../../types/gameTypes';

export class LibraryInteractionHandler {
  private gameState: GameState;
  private showMessage: (message: string) => void;

  constructor(gameState: GameState, showMessage: (message: string) => void) {
    this.gameState = gameState;
    this.showMessage = showMessage;
  }

  private updateGameState(newState: Partial<GameState>) {
    this.gameState = { ...this.gameState, ...newState };
  }

  handleInteraction(object: InteractiveObject): void {
    switch (object.id) {
      case 'mysterious-book':
        this.handleBookInteraction(object);
        break;
      case 'bookmark':
        this.handleBookmarkInteraction(object);
        break;
      case 'locked-drawer':
        this.handleDrawerInteraction(object);
        break;
      case 'riddle-paper':
        this.handleRiddlePaperInteraction(object);
        break;
      case 'painting':
        this.handlePaintingInteraction(object);
        break;
      case 'laboratory-door':
        this.handleLaboratoryDoorInteraction(object);
        break;
      default:
        this.showMessage(`Vous examinez ${object.name}.`);
    }
  }

  private handleBookInteraction(book: InteractiveObject): void {
    const bookmarkItem: InventoryItem = {
      id: 'bookmark',
      type: 'clue',
      name: 'Marque-page',
      description: 'Un vieux marque-page avec le nombre 1963 inscrit dessus.'
    };
    if (!this.gameState.inventory.some(item => item.id === 'bookmark')) {
      this.updateGameState({
        inventory: [...this.gameState.inventory, bookmarkItem]
      });
      this.showMessage('Vous trouvez un marque-page intéressant dans le livre.');
    } else {
      this.showMessage('Vous avez déjà récupéré le marque-page de ce livre.');
    }
  }

  private handleBookmarkInteraction(bookmark: InteractiveObject): void {
    this.showMessage('Le marque-page indique le nombre 1963.');
  }

  private handleDrawerInteraction(drawer: InteractiveObject): void {
    const riddleItem: InventoryItem = {
      id: 'riddle-paper',
      type: 'clue',
      name: 'Énigme mystérieuse',
      description: 'Une énigme qui semble liée au tableau...'
    };
    if (!this.gameState.inventory.some(item => item.id === 'riddle-paper')) {
      const code = prompt('Le tiroir semble verrouillé. Entrez le code :');
      if (code === '1963') {
        this.updateGameState({
          inventory: [...this.gameState.inventory, riddleItem]
        });
        this.showMessage('Le tiroir s\'ouvre ! Vous trouvez une feuille avec une énigme.');
      } else {
        this.showMessage('Ce n\'est pas le bon code.');
      }
    } else {
      this.showMessage('Le tiroir est déjà ouvert.');
    }
  }

  private handleRiddlePaperInteraction(paper: InteractiveObject): void {
    this.showMessage('L\'énigme dit : "Je suis le nombre d\'étoiles dans la constellation du Capricorne multiplié par l\'année de publication du Petit Prince."');
  }

  private handlePaintingInteraction(painting: InteractiveObject): void {
    if (!this.gameState.inventory.some(item => item.id === 'laboratory-key')) {
      const code = prompt('Il y a un mécanisme derrière le tableau qui demande un code :');
      if (code === '7245') {
        const keyItem: InventoryItem = {
          id: 'laboratory-key',
          type: 'key',
          name: 'Clé du laboratoire',
          description: 'Une clé ancienne qui semble ouvrir la porte du laboratoire secret.'
        };
        this.updateGameState({
          inventory: [...this.gameState.inventory, keyItem]
        });
        this.showMessage('Un déclic se fait entendre ! Vous trouvez une clé derrière le tableau.');
      } else {
        this.showMessage('Rien ne se passe. Ce n\'est pas le bon code.');
      }
    } else {
      this.showMessage('Vous avez déjà récupéré la clé derrière ce tableau.');
    }
  }

  private handleLaboratoryDoorInteraction(door: InteractiveObject): void {
    console.log('Tentative d\'ouverture de la porte du laboratoire');
    console.log('Inventaire actuel:', this.gameState.inventory);
    const hasKey = this.gameState.inventory.some(item => item.id === 'laboratory-key');
    console.log('Clé trouvée dans l\'inventaire:', hasKey);
    
    if (hasKey) {
      this.updateGameState({
        currentRoom: 'laboratory',
        unlockedRooms: [...(this.gameState.unlockedRooms || []), 'laboratory']
      });
      this.showMessage('Vous utilisez la clé pour ouvrir la porte du laboratoire.');
      console.log('Porte ouverte, changement de salle vers le laboratoire');
    } else {
      this.showMessage('La porte est verrouillée. Il vous faut une clé.');
      console.log('Tentative d\'ouverture sans clé');
    }
  }
} 