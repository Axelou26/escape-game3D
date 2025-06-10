import { InventoryItem } from './gameTypes';

export interface GameState {
  score: number;
  elapsedTime: number;
  currentRoom: 'library' | 'laboratory' | 'secret-chamber';
  inventory: InventoryItem[];
  microscopeEnigmeResolved: boolean;
  periodicTableUnlocked: boolean;
  unlockedRooms: string[];
  computerUnlocked: boolean;
  gameCompleted: boolean;
  artifactUnlocked: boolean;
}
