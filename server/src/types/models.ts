import { Room as BaseRoom, Puzzle as BasePuzzle } from '../models/room.model';

// Extension du type Room pour inclure les associations
export interface Room extends BaseRoom {
  puzzles?: Puzzle[];
}

// Extension du type Puzzle pour inclure les associations
export interface Puzzle extends BasePuzzle {
  room?: Room;
} 