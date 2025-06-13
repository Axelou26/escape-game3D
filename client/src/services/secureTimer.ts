import { gameStateApi, TimerSyncResponse } from './gameStateApi';

export interface TimerState {
  elapsedTime: number;
  score: number;
  isRunning: boolean;
  nextPenaltyIn: number;
  gameEnded: boolean;
}

class SecureTimerService {
  private intervalId: NodeJS.Timeout | null = null;
  private syncIntervalId: NodeJS.Timeout | null = null;
  private localElapsedTime: number = 0;
  private lastSyncTime: number = 0;
  private isOfflineMode: boolean = false;
  private callbacks: ((state: TimerState) => void)[] = [];

  // Configuration
  private readonly SYNC_INTERVAL = 30000; // Synchronisation toutes les 30 secondes
  private readonly LOCAL_UPDATE_INTERVAL = 1000; // Mise à jour locale chaque seconde

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // Démarrer le timer
  async start(initialElapsedTime: number = 0): Promise<void> {
    // Éviter les redémarrages multiples
    if (this.intervalId !== null) {
      console.log('⚠️ Timer déjà démarré, ignoré');
      return;
    }

    try {
      this.localElapsedTime = initialElapsedTime;
      this.lastSyncTime = Date.now();
      this.isOfflineMode = false;

      // Synchronisation initiale
      await this.syncWithServer();

      // Démarrer les intervalles
      this.startLocalTimer();
      this.startSyncTimer();

      console.log('🕐 Timer sécurisé démarré');
    } catch (error) {
      console.error('Erreur lors du démarrage du timer:', error);
      this.startOfflineMode(initialElapsedTime);
    }
  }

  // Arrêter le timer
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
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

  // Obtenir l'état actuel
  getCurrentState(): TimerState {
    return {
      elapsedTime: this.localElapsedTime,
      score: 0, // Sera mis à jour par la synchronisation
      isRunning: this.intervalId !== null,
      nextPenaltyIn: 120 - (this.localElapsedTime % 120), // Valeur par défaut
      gameEnded: false
    };
  }

  // Timer local (mise à jour chaque seconde)
  private startLocalTimer(): void {
    this.intervalId = setInterval(() => {
      this.localElapsedTime += 1;
      this.notifyCallbacks({
        elapsedTime: this.localElapsedTime,
        score: 0, // Sera mis à jour par sync
        isRunning: true,
        nextPenaltyIn: 120 - (this.localElapsedTime % 120),
        gameEnded: false
      });
    }, this.LOCAL_UPDATE_INTERVAL);
  }

  // Timer de synchronisation avec le serveur
  private startSyncTimer(): void {
    this.syncIntervalId = setInterval(async () => {
      await this.syncWithServer();
    }, this.SYNC_INTERVAL);
  }

  // Synchronisation avec le serveur
  private async syncWithServer(): Promise<void> {
    try {
      // Vérifier si on a un token valide
      const token = localStorage.getItem('token');
      if (!token || token === 'null') {
        console.log('🔌 Pas de token valide - mode hors-ligne activé');
        this.isOfflineMode = true;
        return;
      }

      const response: TimerSyncResponse = await gameStateApi.syncTimer(this.localElapsedTime);
      
      if (response.status === 'game_ended') {
        // Jeu terminé automatiquement par le serveur
        this.stop();
        this.notifyCallbacks({
          elapsedTime: response.elapsedTime,
          score: response.score,
          isRunning: false,
          nextPenaltyIn: 0,
          gameEnded: true
        });
        return;
      }

      // Mise à jour avec les données serveur
      if (response.status === 'success') {
        // Ajuster le temps local si nécessaire
        if (response.timeDifference > 0) {
          console.warn(`⚠️ Désynchronisation détectée: ${response.timeDifference}s`);
          this.localElapsedTime = response.elapsedTime;
        }

        // Notifier les callbacks avec les données serveur
        this.notifyCallbacks({
          elapsedTime: response.elapsedTime,
          score: response.score,
          isRunning: true,
          nextPenaltyIn: response.nextPenaltyIn,
          gameEnded: false
        });

        // Afficher les pénalités appliquées
        if (response.penaltiesApplied > 0) {
          console.log(`⏰ ${response.penaltiesApplied} pénalité(s) de temps appliquée(s)`);
        }

        this.isOfflineMode = false;
      }
    } catch (error) {
      console.error('Erreur de synchronisation timer:', error);
      if (!this.isOfflineMode) {
        console.log('🔌 Passage en mode hors-ligne pour le timer');
        this.isOfflineMode = true;
      }
    }
  }

  // Mode hors-ligne (fallback)
  private startOfflineMode(initialElapsedTime: number): void {
    console.log('🔌 Démarrage du timer en mode hors-ligne');
    this.localElapsedTime = initialElapsedTime;
    this.isOfflineMode = true;
    this.startLocalTimer();
  }

  // Gestion de la visibilité de la page (détection de triche)
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page cachée - enregistrer le temps
      this.lastSyncTime = Date.now();
    } else {
      // Page visible - vérifier le temps écoulé
      const hiddenTime = Math.floor((Date.now() - this.lastSyncTime) / 1000);
      if (hiddenTime > 5) {
        console.log(`⚠️ Page cachée pendant ${hiddenTime}s - synchronisation forcée`);
        this.syncWithServer();
      }
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