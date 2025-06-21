import { gameStateApi, TimerSyncResponse } from './gameStateApi';

export interface TimerState {
  elapsedTime: number;
  score: number;
  isRunning: boolean;
  nextPenaltyIn: number;
  gameEnded: boolean;
}

class SecureTimerService {
  private syncIntervalId: NodeJS.Timeout | null = null;
  private callbacks: ((state: TimerState) => void)[] = [];
  private currentState: TimerState = {
    elapsedTime: 0,
    score: 0,
    isRunning: false,
    nextPenaltyIn: 0,
    gameEnded: false
  };

  // Configuration - synchronisation plus fréquente pour éviter les manipulations
  private readonly SYNC_INTERVAL = 600000; // CORRECTION: Synchronisation toutes les 10 minutes pour éviter la surcharge

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // Démarrer le timer - SYNCHRONISATION OBLIGATOIRE
  async start(): Promise<void> {
    if (this.syncIntervalId !== null) {
      console.log('⚠️ Timer déjà démarré, ignoré');
      return;
    }

    try {
      // Synchronisation initiale OBLIGATOIRE
      await this.syncWithServer();
      
      // Démarrer les synchronisations régulières
      this.startSyncTimer();
      
      console.log('🕐 Timer sécurisé démarré (serveur uniquement)');
    } catch (error) {
      console.error('Erreur lors du démarrage du timer:', error);
      throw new Error('Impossible de démarrer le timer. Connexion serveur requise.');
    }
  }

  // Arrêter le timer
  stop(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    this.currentState.isRunning = false;
    console.log('🛑 Timer sécurisé arrêté');
  }

  // Ajouter un callback pour les mises à jour
  onUpdate(callback: (state: TimerState) => void): void {
    this.callbacks.push(callback);
  }

  // Supprimer un callback
  removeCallback(callback: (state: TimerState) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  // Obtenir l'état actuel (lecture seule)
  getCurrentState(): TimerState {
    return { ...this.currentState };
  }

  // Timer de synchronisation avec le serveur UNIQUEMENT
  private startSyncTimer(): void {
    this.syncIntervalId = setInterval(async () => {
      try {
        await this.syncWithServer();
      } catch (error) {
        console.error('Erreur de synchronisation critique:', error);
        // Arrêter le timer en cas d'erreur de synchronisation
        this.stop();
        this.notifyCallbacks({
          ...this.currentState,
          isRunning: false,
          gameEnded: true
        });
      }
    }, this.SYNC_INTERVAL);
  }

  // Synchronisation avec le serveur - OBLIGATOIRE
  private async syncWithServer(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (!token || token === 'null') {
        throw new Error('Token d\'authentification manquant');
      }

      // Pas de temps local - on envoie 0 pour que le serveur gère tout
      const response: TimerSyncResponse = await gameStateApi.syncTimer(0);
      
      if (response.status === 'game_ended') {
        this.stop();
        this.currentState = {
          elapsedTime: response.elapsedTime,
          score: response.score,
          isRunning: false,
          nextPenaltyIn: 0,
          gameEnded: true
        };
        this.notifyCallbacks(this.currentState);
        return;
      }

      if (response.status === 'success') {
        this.currentState = {
          elapsedTime: response.elapsedTime,
          score: response.score,
          isRunning: true,
          nextPenaltyIn: response.nextPenaltyIn,
          gameEnded: false
        };
        
        this.notifyCallbacks(this.currentState);

        if (response.penaltiesApplied > 0) {
          console.log(`⏰ ${response.penaltiesApplied} pénalité(s) de temps appliquée(s)`);
        }
      }
    } catch (error) {
      console.error('Erreur de synchronisation timer:', error);
      throw error;
    }
  }

  // Gestion de la visibilité de la page - synchronisation immédiate
  private handleVisibilityChange(): void {
    if (!document.hidden && this.syncIntervalId !== null) {
      // Page redevient visible - synchronisation immédiate
      console.log('🔄 Page visible - synchronisation immédiate');
      this.syncWithServer().catch(console.error);
    }
  }

  // Notifier tous les callbacks
  private notifyCallbacks(state: TimerState): void {
    this.callbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Erreur dans callback timer:', error);
      }
    });
  }

  // Nettoyage
  destroy(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.callbacks = [];
  }
}

export const secureTimer = new SecureTimerService(); 