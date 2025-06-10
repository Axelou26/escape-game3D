export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Player {
  position: Position;
  inventory: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'key' | 'note' | 'tool' | 'clue' | 'riddle';
  content?: {
    riddle: string;
    answer: string;
  };
}

export interface InteractiveObject {
  id: string;
  name: string;
  type: string;
  position: Position;
  isActive: boolean;
  isHighlighted: boolean;
  blocksMovement: boolean;
  description: string;
  requiredItems?: string[];
  providesItems?: string[];
  unlockedRooms?: string[];
  puzzle?: {
    type: string;
    solution: string;
    hints: string[];
  };
}

export interface Room {
  id: string;
  type: 'library' | 'laboratory' | 'secret-chamber';
  name: string;
  description: string;
  objects: InteractiveObject[];
  isCompleted: boolean;
  requiredItems?: string[];
  unlockedRooms?: string[];
}

export interface GameState {
  score: number;
  elapsedTime: number;
  hintsUsed: number;
  attemptsCount: number;
  currentRoom: 'library' | 'laboratory' | 'secret-chamber';
  inventory: InventoryItem[];
  unlockedRooms: string[];
  solvedPuzzles: string[];
  microscopeEnigmeResolved: boolean;
} 