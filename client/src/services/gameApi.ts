import { API_URL } from '../config';

// Types pour les réponses API
export interface RiddleResponse {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number; z: number };
  points: number;
}

export interface RiddleContentResponse {
  id: string;
  name: string;
  content: {
    riddle: string;
    answer: string;
    hint?: string;
  };
  points: number;
}

export interface CodePuzzleResponse {
  id: string;
  objectId: string;
  name: string;
  type: 'code' | 'sequence' | 'placement';
  description: string;
  hints: { hints: string[] };
  points: number;
}

export interface ScoreEventResponse {
  eventId: number;
  eventType: string;
  points: number;
  newScore: number;
  details: string;
}

export interface ValidationResponse {
  correct: boolean;
  points: number;
  newScore: number;
  message: string;
  objectId?: string;
}

class GameApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // =============== ÉNIGMES ===============
  async getRiddlesByRoom(roomId: string): Promise<RiddleResponse[]> {
    const response = await fetch(`${API_URL}/riddles/room/${roomId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getRiddleContent(riddleId: string): Promise<RiddleContentResponse> {
    const response = await fetch(`${API_URL}/riddles/${riddleId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async validateRiddleAnswer(riddleId: string, answer: string): Promise<ValidationResponse> {
    const response = await fetch(`${API_URL}/riddles/${riddleId}/validate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ answer })
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getRiddleHint(riddleId: string): Promise<{ hint: string; penaltyPoints: number; newScore: number }> {
    const response = await fetch(`${API_URL}/riddles/${riddleId}/hint`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  // =============== CODES ET PUZZLES ===============
  async getCodePuzzlesByRoom(roomId: string): Promise<CodePuzzleResponse[]> {
    const response = await fetch(`${API_URL}/codes/room/${roomId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async validateCode(puzzleId: string, code: string): Promise<ValidationResponse> {
    const response = await fetch(`${API_URL}/codes/${puzzleId}/validate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getCodePuzzleHint(puzzleId: string): Promise<{ hints: string[]; penaltyPoints: number; newScore: number }> {
    const response = await fetch(`${API_URL}/codes/${puzzleId}/hint`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  // =============== SCORE ===============
  async addScoreEvent(eventType: string, details?: string): Promise<ScoreEventResponse> {
    const response = await fetch(`${API_URL}/score/event`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ eventType, details })
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getCurrentScore(): Promise<{ score: number; elapsedTime: number; gameId: number }> {
    const response = await fetch(`${API_URL}/score/current`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async addTimePenalty(elapsedTime: number): Promise<{ penalty: number; newScore: number; elapsedTime: number }> {
    const response = await fetch(`${API_URL}/score/time-penalty`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ elapsedTime })
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getScoreHistory(): Promise<{ currentScore: number; events: any[] }> {
    const response = await fetch(`${API_URL}/score/history`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  // =============== HELPERS ===============
  // Fonction utilitaire pour trouver un puzzle par objectId
  async findCodePuzzleByObjectId(roomId: string, objectId: string): Promise<CodePuzzleResponse | null> {
    const puzzles = await this.getCodePuzzlesByRoom(roomId);
    return puzzles.find(puzzle => puzzle.objectId === objectId) || null;
  }
}

export const gameApi = new GameApiService(); 