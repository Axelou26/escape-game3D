import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BibliothequeScene } from './3d/BibliothequeScene';
import { LaboratoireScene } from './3d/LaboratoireScene';
import { SecretChamber3D } from './3d/SecretChamber3D/SecretChamber3D';
import { Inventory } from './ui/Inventory/Inventory';
import { BookContent } from './ui/BookContent/BookContent';
import { RiddleContent } from './ui/RiddleContent/RiddleContent';
import { CodeInput } from './ui/CodeInput/CodeInput';
import { GameHUD } from './ui/GameHUD/GameHUD';
import { FPSCounter } from './ui/FPSCounter';
import { PauseMenu } from './ui/PauseMenu/PauseMenu';
import { InventoryItem, GameState } from '../types/gameTypes';
import './game/EscapeGame.css';
import { scoreService, ScoreEventType } from '../services/scoreService';
import { gameApi } from '../services/gameApi';
import { gameStateApi, CurrentTimeResponse } from '../services/gameStateApi';

import { inventoryService } from '../services/inventoryService';


// Configuration de l'API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const EscapeGame: React.FC = () => {
  const navigate = useNavigate();
  
  // État initial du jeu
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    elapsedTime: 0,
    hintsUsed: 0,
    attemptsCount: 0,
    currentRoom: 'library',
    inventory: [],
    unlockedRooms: ['library'],
    solvedPuzzles: [],
    microscopeEnigmeResolved: false,
    periodicTableUnlocked: false,
    computerUnlocked: false,
    gameCompleted: false,
    artifactUnlocked: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [currentCodeType, setCurrentCodeType] = useState<'drawer' | 'painting'>('drawer');
  const [codeErrorMessage, setCodeErrorMessage] = useState('');
  const [showBook, setShowBook] = useState(false);
  const [currentBookContent, setCurrentBookContent] = useState<any>(null);
  const [showRiddleContent, setShowRiddleContent] = useState(false);
  const [currentRiddleContent, setCurrentRiddleContent] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedRiddle, setSelectedRiddle] = useState<string | null>(null);
  const [isPaintingCodeValid, setIsPaintingCodeValid] = useState(false);

  // SUPPRESSION DU MODE OFFLINE - Connexion serveur OBLIGATOIRE
  const [connectionError, setConnectionError] = useState(false);

  // Définition des fonctions de base - TOUJOURS en ligne
  const saveGameState = useCallback(async (newState: GameState) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionError(true);
      setError('Token d\'authentification manquant - Reconnexion requise');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    const gameData = {
      currentScore: newState.score,
      currentElapsedTime: newState.elapsedTime,
      gameState: {
        currentRoom: newState.currentRoom,
        inventory: Array.isArray(newState.inventory) ? newState.inventory : [],
        score: typeof newState.score === 'number' ? newState.score : 0,
        elapsedTime: typeof newState.elapsedTime === 'number' ? newState.elapsedTime : 0,
        microscopeEnigmeResolved: newState.microscopeEnigmeResolved || false,
        periodicTableUnlocked: newState.periodicTableUnlocked || false,
        unlockedRooms: Array.isArray(newState.unlockedRooms) ? newState.unlockedRooms : ['library'],
        computerUnlocked: newState.computerUnlocked || false,
        gameCompleted: newState.gameCompleted || false,
        artifactUnlocked: newState.artifactUnlocked || false
      }
    };

    try {
      const response = await fetch(`${API_URL}/game/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        setConnectionError(false);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setConnectionError(true);
      setError('Erreur de connexion - Impossible de sauvegarder');
    }
  }, [navigate]);

  // Fonction pour terminer le jeu - TOUJOURS en ligne
  const endGame = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Pas de token pour terminer le jeu');
      setError('Authentification requise');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/game/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          finalScore: gameState.score,
          finalTime: gameState.elapsedTime,
          gameState: gameState
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
    } catch (error) {
      console.error('Erreur lors de la fin du jeu:', error);
      setError('Erreur lors de la finalisation du jeu');
    }
  }, [gameState]);

  const updateGameState = useCallback((updates: Partial<GameState>, isReset = false) => {
    setGameState(prevState => {
      // Protection contre la corruption d'inventaire
      if (!isReset && updates.inventory !== undefined && prevState.inventory.length > 0 && updates.inventory.length === 0) {
        console.warn('🚨 PROTECTION: Tentative de vider l\'inventaire détectée et bloquée!');
        const safeUpdates = { ...updates };
        delete safeUpdates.inventory;
        return { ...prevState, ...safeUpdates };
      }
      
      const newState = { ...prevState, ...updates };
      
      // Sauvegarder immédiatement - connexion obligatoire
      saveGameState(newState).catch(console.error);
      
      return newState;
    });
  }, [saveGameState]);

  // Mettre à jour le score - TOUJOURS côté serveur
  const handleScoreUpdate = useCallback(async (event: ScoreEventType, details?: string) => {
    try {
      const result = await scoreService.updateScore(event, details);
      setGameState(prevState => ({
        ...prevState,
        score: result.newScore
      }));
      
      if (result.points !== 0) {
        const message = result.points > 0 
          ? `+${result.points} points !` 
          : `${result.points} points`;
        console.log(`Score mis à jour: ${message} (Total: ${result.newScore})`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du score:', error);
      setConnectionError(true);
      setError('Erreur de score - Connexion serveur requise');
    }
  }, []);

  const handleInteract = useCallback(async (objectId: string, objectType: string, action?: string, data?: any) => {
    if (!action) return;
    
    if (isTransitioning && !['examine', 'feedback', 'checkBeakerSequence', 'enterCode', 'add_key_to_inventory', 'add_to_inventory'].includes(action)) {
      return;
    }

    // Réinitialiser l'état de transition après un délai si nécessaire
    const resetTransition = () => {
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    };

    switch (action) {
      case 'collect':
        handleScoreUpdate('ITEM_COLLECTED');
        handleInventoryUpdate(objectId, objectType, data);
        break;

      case 'enterCode':
        if (data.isGameComplete) {
          // Code final de la chambre secrète
          if (data.isCorrect) {
            handleScoreUpdate('FINAL_CODE_CORRECT');
            setGameState(prevState => ({
              ...prevState,
              gameCompleted: true
            }));
          } else {
            handleScoreUpdate('FINAL_CODE_INCORRECT');
          }
        } else {
          // Codes normaux (tiroir, tableau, ordinateur)
          if (data.isCorrect) {
            handleScoreUpdate('CODE_CORRECT');
          } else {
            handleScoreUpdate('CODE_INCORRECT');
          }
        }
        handleCodeFeedback(data.isCorrect);
        break;

      case 'checkBeakerSequence':
        if (data.isCorrect) {
          handleScoreUpdate('BEAKER_SEQUENCE_CORRECT');
        } else {
          handleScoreUpdate('BEAKER_SEQUENCE_WRONG');
        }
        handleBeakerFeedback(data.isCorrect);
        break;

      case 'changeRoom':
        handleScoreUpdate('ROOM_CHANGE');
        handleRoomChange(data.newRoom);
        break;

      case 'examine':
        if (data) {
          setMessage(data);
          setTimeout(() => setMessage(''), 3000);
        }
        if (objectId === 'microscope' && data) {
          setTimeout(() => {
            resetTransition();
          }, 5000);
        } else {
          setTimeout(() => {
            resetTransition();
          }, 3000);
        }
        break;

      case 'message':
        if (data) {
          setMessage(data);
          setTimeout(() => setMessage(''), 3000);
        }
        break;

      case 'notification':
        if (data) {
          setMessage(data);
          setTimeout(() => setMessage(''), 3000);
        }
        break;
      case 'feedback':
        if (objectId === 'sequence' && data === 'correct') {
          setGameState(prevState => ({
            ...prevState,
            periodicTableUnlocked: true
          }));
          setTimeout(() => setMessage(''), 3000);
        } else if (objectId === 'sequence') {
          setTimeout(() => setMessage(''), 3000);
        }
        break;
      case 'add_to_inventory':
        try {
          let itemId: string;
          let itemType: string;
          let itemName: string;
          let itemDescription: string;
          let itemContent: any = undefined;

          // CORRECTION: Simplification comme dans la bibliothèque avec fallback
          if (objectId === 'riddle-elements') {
            try {
              // Récupérer l'énigme depuis l'API
              const riddleData = await gameApi.getRiddleContent('riddle-elements');
              itemId = 'riddle-elements';
              itemType = 'riddle';
              itemName = riddleData.name;
              itemDescription = 'Une énigme mystérieuse apparue sur le tableau périodique...';
              itemContent = riddleData.content;
            } catch (error) {
              // Fallback si l'API ne répond pas
              itemId = 'riddle-elements';
              itemType = 'riddle';
              itemName = 'Énigme des Éléments';
              itemDescription = 'Une énigme mystérieuse apparue sur le tableau périodique...';
              itemContent = {
                riddle: "Une énigme sur les éléments chimiques...",
                answer: "OHN",
                hint: "Oxygène, Hydrogène, et un métal précieux..."
              };
            }
          } else if (objectType === 'riddle' && data?.riddleId) {
            // Récupérer l'énigme depuis l'API
            const riddleData = await gameApi.getRiddleContent(data.riddleId);
            itemId = data.riddleId;
            itemType = 'riddle';
            itemName = riddleData.name;
            itemDescription = 'Une énigme mystérieuse...';
            itemContent = riddleData.content;
          } else if (objectId === 'mysterious-book') {
            itemId = 'professors-journal';
            itemType = 'note';
            itemName = 'Journal du Professeur';
            itemDescription = 'Un vieux journal contenant des notes énigmatiques';
          } else if (objectId === 'shadow-riddle-symbol') {
            const riddleData = await gameApi.getRiddleContent('riddle-shadow');
            itemId = 'riddle-shadow';
            itemType = 'riddle';
            itemName = riddleData.name; // Utiliser le vrai nom de la base de données
            itemDescription = 'Une énigme mystérieuse apparue sur le symbole mystique...';
            itemContent = riddleData.content;
          } else if (objectId === 'sun-symbol') {
            const riddleData = await gameApi.getRiddleContent('riddle-light');
            itemId = 'riddle-light';
            itemType = 'riddle';
            itemName = riddleData.name; // Utiliser le vrai nom de la base de données
            itemDescription = 'Une énigme mystérieuse gravée sur un symbole solaire...';
            itemContent = riddleData.content;
          } else if (objectId === 'ancient-book') {
            const riddleData = await gameApi.getRiddleContent('riddle-wisdom');
            itemId = 'riddle-wisdom';
            itemType = 'riddle';
            itemName = riddleData.name; // Utiliser le vrai nom de la base de données
            itemDescription = 'Une énigme cachée dans un livre ancien...';
            itemContent = riddleData.content;
          } else if (objectId === 'mirror-riddle-glyph') {
            const riddleData = await gameApi.getRiddleContent('riddle-mirror');
            itemId = 'riddle-mirror';
            itemType = 'riddle';
            itemName = riddleData.name; // Utiliser le vrai nom de la base de données
            itemDescription = 'Une énigme gravée dans les hiéroglyphes...';
            itemContent = riddleData.content;
          } else {
            // Objet générique
            itemId = data?.id || `item-${Date.now()}`;
            itemType = objectType || 'item';
            itemName = data?.name || 'Objet mystérieux';
            itemDescription = data?.description || 'Un objet intriguant...';
            itemContent = data?.content;
          }

          // Validation côté client avant l'envoi
          if (!itemId || !itemType || !itemName) {
            setMessage('Erreur: données d\'objet invalides');
            setTimeout(() => setMessage(''), 3000);
            break;
          }

          // Ajouter l'objet via le service sécurisé
          const result = await inventoryService.addItem(itemId, itemType, itemName, itemDescription, itemContent);
          
          // Mettre à jour l'état local
          setGameState(prevState => ({
            ...prevState,
            inventory: result.inventory as InventoryItem[]
          }));

          handleScoreUpdate('ITEM_COLLECTED');
          setMessage(`${itemName} ajouté à l'inventaire !`);
          setTimeout(() => setMessage(''), 3000);
        } catch (error) {
          setMessage('Erreur lors de l\'ajout à l\'inventaire');
          setTimeout(() => setMessage(''), 3000);
        }
        break;

      case 'add_to_inventory_riddle':
        try {
          const result = await inventoryService.addItem(
            'riddle-ancient',
            'riddle',
            'Énigme Ancienne',
            'Une énigme qui semble liée au tableau...'
          );
          
          setGameState(prevState => ({
            ...prevState,
            inventory: result.inventory as InventoryItem[]
          }));

          handleScoreUpdate('ITEM_COLLECTED');
        } catch (error) {
          console.error('Erreur lors de l\'ajout de l\'énigme:', error);
        }
        break;

      case 'add_key_to_inventory':
        try {
          let keyId: string;
          let keyName: string;
          let keyDescription: string;

          if (objectId === 'crystal-key') {
            keyId = 'crystal-key';
            keyName = 'Clé en Cristal';
            keyDescription = 'Une clé magnifique taillée dans un cristal translucide. Elle semble ouvrir quelque chose d\'important.';
          } else {
            keyId = 'laboratory-key';
            keyName = 'Clé du laboratoire';
            keyDescription = 'Une clé ancienne qui ouvre la porte du laboratoire.';
          }

          const result = await inventoryService.addItem(keyId, 'key', keyName, keyDescription);
          
          setGameState(prevState => ({
            ...prevState,
            inventory: result.inventory as InventoryItem[]
          }));

          handleScoreUpdate('ITEM_COLLECTED');
          setMessage(`${keyName} ajoutée à l'inventaire !`);
          setTimeout(() => setMessage(''), 3000);
        } catch (error) {
          setMessage('Erreur lors de l\'ajout de la clé');
          setTimeout(() => setMessage(''), 3000);
        }
        break;

      case 'prompt_code':
        setCurrentCodeType('drawer');
        setShowCodeInput(true);
        break;

      case 'prompt_painting_code':
        setCurrentCodeType('painting');
        setShowCodeInput(true);
        break;

      case 'enter_laboratory':
        if (!isTransitioning) {
          setIsTransitioning(true);
          setMessage('Vous utilisez la clé pour ouvrir la porte du laboratoire...');
          
          setGameState(prevState => ({
            ...prevState,
            currentRoom: 'laboratory',
            unlockedRooms: Array.from(new Set([...prevState.unlockedRooms, 'laboratory']))
          }));
          
          setTimeout(() => {
            setMessage('Vous entrez dans le laboratoire secret !');
            setTimeout(() => {
              setMessage('');
              setIsTransitioning(false);
            }, 2000);
          }, 1000);
        }
        break;

      case 'artifact':
        if (objectId === 'sacred-artifact') {
          setTimeout(() => setMessage(''), 3000);
        }
        break;
      case 'symbol':
        setTimeout(() => setMessage(''), 3000);
        break;
      case 'door':
        if (objectId === 'secret-door') {
          setTimeout(() => setMessage(''), 3000);
        }
        break;
    }
  }, [gameState, isTransitioning, handleScoreUpdate]);

  // Initialisation du jeu
  useEffect(() => {
    let isMounted = true;

    const initializeGame = async () => {
      if (!isMounted) return;

      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (token) {
          // D'abord, essayons de récupérer une partie en cours
          const response = await fetch(`${API_URL}/game/current`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              // Nettoyer l'inventaire des doublons lors du chargement
              const cleanedGameState = {
                ...data.data.gameState,
                inventory: data.data.gameState.inventory || []
              };
              setGameState(cleanedGameState);
              setMessage('Partie chargée avec succès');
              setTimeout(() => setMessage(''), 2000);
              return;
            }
          }

          // Si aucune partie en cours n'est trouvée, créons-en une nouvelle
          const startResponse = await fetch(`${API_URL}/game/start`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (startResponse.ok) {
            const startData = await startResponse.json();
            if (startData.data) {
              setGameState(startData.data.gameState);
              setMessage('Nouvelle partie démarrée');
              setTimeout(() => setMessage(''), 2000);
            }
          } else {
            throw new Error('Impossible de démarrer une nouvelle partie');
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Erreur lors de l\'initialisation:', error);
          setError('Erreur lors du chargement du jeu');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeGame();

    return () => {
      isMounted = false;
    };
  }, []);

  // Timer hybride : local pour l'affichage temps réel + synchronisation périodique serveur
  useEffect(() => {
    if (isLoading || gameState.gameCompleted) return;

    let localTimerInterval: NodeJS.Timeout;
    let serverSyncInterval: NodeJS.Timeout;
    let serverSyncTimeout: NodeJS.Timeout;
    let isServerSyncInProgress = false;
    let isMounted = true; 
    let lastServerSync = 0; // Timestamp de la dernière sync serveur

    // Timer local qui s'incrémente chaque seconde pour l'affichage temps réel
    const startLocalTimer = () => {
      localTimerInterval = setInterval(() => {
        if (!isMounted) return;
        
        setGameState(prevState => {
          if (prevState.gameCompleted) return prevState;
          
          return {
            ...prevState,
            elapsedTime: prevState.elapsedTime + 1
          };
        });
      }, 1000); // Mise à jour chaque seconde
    };

    // Synchronisation avec le serveur (moins fréquente) - CORRIGÉ pour récupérer le score avec pénalités
    const syncWithServer = async () => {
      if (isServerSyncInProgress || !isMounted) return;
      
      const now = Date.now();
      // Éviter les syncs trop rapprochées (minimum 15 secondes entre les syncs pour permettre les pénalités)
      if (lastServerSync && (now - lastServerSync) < 15000) {
        return;
      }
      
      try {
        isServerSyncInProgress = true;
        lastServerSync = now;
        
        // CORRECTION : Utiliser syncTimer au lieu de getCurrentTime pour récupérer le score avec pénalités
        const response = await gameStateApi.syncTimer(gameState.elapsedTime);
        if (response.status === 'success' && isMounted) {
          // Corriger le temps ET le score avec les données serveur
          setGameState(prevState => {
            if (prevState.gameCompleted) return prevState;
            
            // Calculer la différence et ajuster si nécessaire
            const timeDifference = Math.abs(response.elapsedTime - prevState.elapsedTime);
            const shouldCorrect = timeDifference > 5; // Corriger si écart > 5 secondes
            const scoreChanged = response.score !== prevState.score;
            
            if (shouldCorrect) {
              console.log(`Correction du timer local: ${prevState.elapsedTime}s -> ${response.elapsedTime}s (écart: ${timeDifference}s)`);
            }

            if (scoreChanged) {
              console.log(`Score mis à jour par le serveur: ${prevState.score} -> ${response.score}`);
              if (response.penaltiesApplied > 0) {
                console.log(`⏰ ${response.penaltiesApplied} pénalité(s) de temps appliquée(s) (-${response.penaltiesApplied * 10} points)`);
                
                // Afficher un message à l'utilisateur pour les pénalités de temps
                setMessage(`⏰ Pénalité de temps : -${response.penaltiesApplied * 10} points (après 2 minutes d'inactivité)`);
                setTimeout(() => setMessage(''), 4000);
              }
            }

            return {
              ...prevState,
              elapsedTime: shouldCorrect ? response.elapsedTime : prevState.elapsedTime,
              score: response.score // CORRECTION : Utiliser le score du serveur avec pénalités
            };
          });

          // Vérifier si le jeu doit se terminer
          if (response.elapsedTime >= 3600) { // MAX_GAME_DURATION
            setGameState(prevState => ({
              ...prevState,
              gameCompleted: true
            }));
            setMessage('Temps de jeu dépassé ! Partie terminée automatiquement.');
            setTimeout(() => {
              endGame();
              navigate('/game-intro');
            }, 3000);
          }
        } else if (response.status === 'game_ended') {
          // Gérer la fin de partie depuis le serveur
          setGameState(prevState => ({
            ...prevState,
            gameCompleted: true,
            elapsedTime: response.elapsedTime,
            score: response.score
          }));
          setMessage('Temps de jeu dépassé ! Partie terminée automatiquement.');
          setTimeout(() => {
            endGame();
            navigate('/game-intro');
          }, 3000);
        }
      } catch (error: any) {
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          console.warn('Rate limit atteint, prochaine sync différée');
          // Différer la prochaine sync en cas de rate limit
          lastServerSync = now + 60000; // Reporter de 1 minute
        } else {
          console.error('Erreur sync serveur:', error);
        }
      } finally {
        isServerSyncInProgress = false;
      }
    };

    // Démarrer le timer local immédiatement
    startLocalTimer();

    // Première synchronisation avec le serveur après 3 secondes
    serverSyncTimeout = setTimeout(syncWithServer, 3000);

    // CORRECTION : Synchronisations plus fréquentes pour voir les pénalités de temps (toutes les 2 minutes)
    serverSyncInterval = setInterval(syncWithServer, 120000); // 2 minutes (même intervalle que les pénalités)

    return () => {
      isMounted = false;
      clearInterval(localTimerInterval);
      clearInterval(serverSyncInterval);
      clearTimeout(serverSyncTimeout);
    };
  }, [isLoading, gameState.gameCompleted, endGame, navigate]);

  // Sauvegarde automatique optimisée avec debounce plus long
  useEffect(() => {
    if (!isLoading && !gameState.gameCompleted) {
      const timeoutId = setTimeout(() => {
        saveGameState(gameState).catch(console.error);
      }, 5000); // Augmenté à 5 secondes pour réduire la fréquence

      return () => clearTimeout(timeoutId);
    }
  }, [gameState.score, gameState.currentRoom, isLoading, saveGameState]); // Suppression d'elapsedTime et ajout de conditions plus restrictives

  const handleCodeSubmit = useCallback(async (code: string) => {
    try {
      // Trouver le puzzle correspondant au type de code actuel
      let puzzleId: string;
      if (currentCodeType === 'drawer') {
        puzzleId = 'drawer-code';
      } else if (currentCodeType === 'painting') {
        puzzleId = 'painting-code';
      } else {
        console.error('Type de code non reconnu:', currentCodeType);
        return;
      }

      // Valider le code via l'API
      const result = await gameApi.validateCode(puzzleId, code);
      
      if (result.correct) {
        // Mettre à jour le score
        setGameState(prevState => ({
          ...prevState,
          score: result.newScore
        }));

        if (currentCodeType === 'drawer') {
          // Ajouter l'énigme mathématique à l'inventaire
          const riddleContent = await gameApi.getRiddleContent('riddle-mathematics');
          const drawerRiddle: InventoryItem = {
            id: riddleContent.id,
            type: 'riddle',
            name: riddleContent.name,
            description: 'Une énigme mathématique trouvée dans le tiroir',
            content: riddleContent.content
          };
          
          updateGameState({
            inventory: [...gameState.inventory, drawerRiddle]
          });
          setMessage('Code correct ! Vous avez trouvé une énigme !');
        } else if (currentCodeType === 'painting') {
          // Déverrouiller la clé du laboratoire
          handleInteract('laboratory-key', 'key', 'add_key_to_inventory');
          setMessage('Le mécanisme s\'active ! Une clé apparaît !');
          setIsPaintingCodeValid(true);
        }
        
        setShowCodeInput(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        // Code incorrect
        setGameState(prevState => ({
          ...prevState,
          score: result.newScore
        }));
        setCodeErrorMessage(result.message || 'Code incorrect');
        setTimeout(() => setCodeErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la validation du code:', error);
      setCodeErrorMessage('Erreur de communication avec le serveur');
      setTimeout(() => setCodeErrorMessage(''), 3000);
    }
  }, [currentCodeType, handleInteract, gameState.inventory, updateGameState]);

  const handleUseItem = (item: InventoryItem) => {
    switch (item.id) {
      case 'mysterious-book':
        setShowBook(true);
        break;
      case 'drawer-riddle':
      case 'periodic-table-elements-riddle':
        setCurrentRiddleContent(item);
        setShowRiddleContent(true);
        break;
      case 'laboratory-key':
        if (gameState.currentRoom === 'library') {
          handleInteract('laboratory-door', 'door', 'enter_laboratory');
          setMessage('Vous utilisez la clé pour ouvrir la porte du laboratoire...');
        } else {
          setMessage('Cette clé semble pouvoir ouvrir la porte du laboratoire...');
        }
        setTimeout(() => setMessage(''), 3000);
        break;
      default:
        setTimeout(() => setMessage(''), 3000);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Gestionnaire pour la touche M
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'm' || event.key === 'M') {
        setShowPauseMenu(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Gestionnaire pour le changement de salle
  const handleRoomChange = useCallback((newRoom: 'library' | 'laboratory' | 'secret-chamber') => {
    // Debug: afficher l'état actuel
    console.log('Tentative de changement de salle:', {
      from: gameState.currentRoom,
      to: newRoom,
      unlockedRooms: gameState.unlockedRooms
    });

    // Vérifier si la salle de destination est déverrouillée
    if (!gameState.unlockedRooms.includes(newRoom)) {
      const roomNames = {
        library: 'bibliothèque',
        laboratory: 'laboratoire',
        'secret-chamber': 'chambre secrète'
      };
      
      setMessage(`La ${roomNames[newRoom]} n'est pas encore accessible. Salles déverrouillées: ${gameState.unlockedRooms.join(', ')}`);
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // Si c'est déjà la salle courante, ne rien faire
    if (gameState.currentRoom === newRoom) {
      setMessage('Vous êtes déjà dans cette salle.');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const roomNames = {
      library: 'la bibliothèque',
      laboratory: 'le laboratoire',
      'secret-chamber': 'la chambre secrète'
    };

    setIsTransitioning(true);
    setGameState(prevState => ({
      ...prevState,
      currentRoom: newRoom
    }));
    setMessage(`Vous vous dirigez vers ${roomNames[newRoom]}...`);
    
    setTimeout(() => {
      setIsTransitioning(false);
      setMessage(`Vous êtes maintenant dans ${roomNames[newRoom]}.`);
      setTimeout(() => setMessage(''), 2000);
    }, 1000);
  }, [gameState.unlockedRooms, gameState.currentRoom]);

  // Gestionnaire pour le redémarrage du jeu
  const handleRestart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Token d\'authentification manquant');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/game/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la réinitialisation du jeu');
      }

      const data = await response.json();
      if (data.status === 'success') {
        // Réinitialiser l'état principal du jeu
        setGameState(data.data.gameState);
        
        // Nettoyer complètement le localStorage
        localStorage.removeItem('gameState');
        
        // Réinitialiser TOUS les états locaux
        setShowPauseMenu(false);
        setShowCodeInput(false);
        setCurrentCodeType('drawer');
        setMessage('Partie réinitialisée avec succès');
        setCodeErrorMessage('');
        setShowBook(false);
        setShowRiddleContent(false);
        setCurrentRiddleContent(null);
        setIsTransitioning(false);
        setSelectedRiddle(null);
        setIsPaintingCodeValid(false);
      } else {
        throw new Error(data.message || 'Erreur lors de la réinitialisation du jeu');
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de la partie:', error);
      setMessage('Erreur lors de la réinitialisation. Veuillez réessayer.');
      setShowPauseMenu(false);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestionnaire pour retourner à l'intro
  const handleReturnToIntro = () => {
    navigate('/intro');
  };

  const handleInventoryItemClick = useCallback(async (item: InventoryItem) => {
    // Pour les énigmes, utiliser l'API pour récupérer le contenu
    if (item.type === 'riddle') {
      try {
        const riddleContent = await gameApi.getRiddleContent(item.id);
        setCurrentRiddleContent({
          ...item,
          content: riddleContent.content
        });
        setShowRiddleContent(true);
        setSelectedRiddle(item.id);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'énigme:', error);
        setMessage('Impossible de charger l\'énigme');
        setTimeout(() => setMessage(''), 3000);
      }
    } else if (item.id === 'professors-journal') {
      setShowBook(true);
    }
  }, []);

  const handleInventoryUpdate = useCallback((objectId: string, objectType: string, data: any) => {
    const newItem: InventoryItem = {
      id: objectId,
      type: objectType,
      ...data
    };
    
    setGameState(prevState => {
      // Vérifier si l'objet existe déjà dans l'inventaire
      const itemExists = prevState.inventory.some(item => item.id === objectId);
      if (itemExists) {
        return prevState;
      }

      return {
        ...prevState,
        inventory: [...prevState.inventory, newItem]
      };
    });
    
    setTimeout(() => setMessage(''), 2000);
  }, []);

  const handleCodeFeedback = useCallback((isCorrect: boolean) => {
    setGameState(prev => ({ ...prev, attemptsCount: prev.attemptsCount + 1 }));
    if (isCorrect) {
      setMessage('Code correct !');
      setShowCodeInput(false);
    } else {
      setMessage('Code incorrect. Essayez encore.');
    }
    setTimeout(() => setMessage(''), 3000);
  }, []);

  const handleBeakerFeedback = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setMessage('Séquence correcte !');
      setGameState(prevState => ({
        ...prevState,
        periodicTableUnlocked: true
      }));
    } else {
      setMessage('Séquence incorrecte. Essayez encore.');
    }
    setTimeout(() => setMessage(''), 3000);
  }, []);



  return (
    <div className="escape-game">
      {isLoading ? (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div>Chargement...</div>
        </div>
      ) : error ? (
        <div className="error-overlay">
          <div>{error}</div>
          <button onClick={() => setError('')}>Réessayer</button>
        </div>
      ) : (
        <>
          {/* Scène 3D principale */}
          <div className="game-scene">
            {gameState.currentRoom === 'library' && (
              <BibliothequeScene
                onInteract={handleInteract}
                onUpdateGameState={updateGameState}
                inventory={gameState.inventory}
                showMessage={setMessage}
                isCodeValid={isPaintingCodeValid}
              />
            )}
            {gameState.currentRoom === 'laboratory' && (
              <LaboratoireScene
                onInteract={handleInteract}
                onUpdateGameState={updateGameState}
                periodicTableUnlocked={gameState.periodicTableUnlocked}
                inventory={gameState.inventory}
              />
            )}
            {gameState.currentRoom === 'secret-chamber' && (
              <SecretChamber3D
                onInteract={handleInteract}
                onUpdateGameState={updateGameState}
                onEndGame={endGame}
              />
            )}
          </div>

          {/* GameHUD avec score et temps */}
          <GameHUD
            score={gameState.score}
            elapsedTime={gameState.elapsedTime}
            hintsUsed={gameState.hintsUsed}
            attemptsCount={gameState.attemptsCount}
          />

          {/* Compteur FPS */}
          <FPSCounter />

          {/* Panneau d'instructions */}
          <div className="instructions-panel">
            <h2>Guide du Jeu</h2>
            <div className="instructions-section">
              <h3>Commandes</h3>
              <ul>
                <li>ZQSD / Flèches : Se déplacer</li>
                <li>Souris : Regarder autour</li>
                <li>E / Clic : Interagir avec les objets</li>
                <li>Échap : Interagir avec les objets de l'inventaire</li>
                <li>M : Menu pause</li>
              </ul>
            </div>
            <div className="instructions-section">
              <h3>Objectifs</h3>
              {gameState.currentRoom === 'library' && (
                <ul>
                  <li>Explorez tous les coins de la bibliothèque</li>
                  <li>Trouvez le livre mystérieux</li>
                  <li>Déchiffrez les énigmes</li>
                  <li>Collectez la clé du laboratoire</li>
                  <li>rejoindre le laboratoire</li>
                </ul>
              )}
              {gameState.currentRoom === 'laboratory' && (
                <ul>
                 <li>Explorez tous les coins du laboratoire</li>
                  <li>résolvez les égnimes</li>
                  <li>Récupérez la clé en cristal</li> 
                  <li>Trouvez l'entrée vers la chambre secrète</li>
                </ul>
              )}
              {gameState.currentRoom === 'secret-chamber' && (
                <ul>
                  <li>Explorez le bureau du Professeur mystérieux</li>
                  <li>Résolvez les énigmes des artefacts anciens</li>
                  <li>déverrouiller l'artefact sacré</li>
                  <li>Découvrez le secret ultime et terminez votre quête</li>
                </ul>
              )}
            </div>
            
          </div>

          {/* Menu Pause */}
          {showPauseMenu && (
            <PauseMenu
              onClose={() => setShowPauseMenu(false)}
              onRestart={handleRestart}
              onReturnToIntro={handleReturnToIntro}
              currentRoom={gameState.currentRoom}
              unlockedRooms={gameState.unlockedRooms || ['library']}
              onRoomChange={handleRoomChange}
            />
          )}

          {/* Inventaire */}
          <div className="inventory-container">
            <Inventory 
              items={gameState.inventory} 
              onItemClick={handleInventoryItemClick}
              onUseItem={handleUseItem}
            />
          </div>

          {/* Message overlay */}
          {message && (
            <div className="game-message">
              {message}
            </div>
          )}

          {/* Message d'erreur de code */}
          {codeErrorMessage && (
            <div style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(220, 53, 69, 0.9)',
              color: 'white',
              padding: '15px 30px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              zIndex: 1003,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '2px solid #dc3545'
            }}>
              {codeErrorMessage}
            </div>
          )}

          {/* Modales */}
          {showBook && !isTransitioning && (
            <BookContent onClose={() => setShowBook(false)} />
          )}

          {showRiddleContent && !isTransitioning && (
            <RiddleContent 
              onClose={() => {
                setShowRiddleContent(false);
                setCurrentRiddleContent(null);
              }}
              riddle={currentRiddleContent}
            />
          )}

          {showCodeInput && !isTransitioning && (
            <>
              <div className="modal-overlay" />
              <CodeInput 
                onSubmit={handleCodeSubmit}
                onClose={() => setShowCodeInput(false)}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}; 