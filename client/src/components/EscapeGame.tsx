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
import { PauseMenu } from './ui/PauseMenu/PauseMenu';
import { InventoryItem, GameState } from '../types/gameTypes';
import './game/EscapeGame.css';
import { scoreService, ScoreEventType } from '../services/scoreService';
import { gameApi } from '../services/gameApi';
import { gameStateApi } from '../services/gameStateApi';
import { secureTimer, TimerState } from '../services/secureTimer';
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

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [currentCodeType, setCurrentCodeType] = useState<'drawer' | 'painting'>('drawer');
  const [message, setMessage] = useState<string>('');
  const [codeErrorMessage, setCodeErrorMessage] = useState<string>('');
  const [showBook, setShowBook] = useState(false);
  const [showRiddle, setShowRiddle] = useState(false);
  const [currentRiddle, setCurrentRiddle] = useState<InventoryItem | undefined>();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPauseMenu, setShowPauseMenu] = useState(false);

  const [selectedRiddle, setSelectedRiddle] = useState<string | null>(null);
  // État pour savoir si le code du tableau a été validé
  const [isPaintingCodeValid, setIsPaintingCodeValid] = useState(false);

  // Mettre à jour isPaintingCodeValid quand l'inventaire change
  useEffect(() => {
    const hasKey = gameState.inventory.some(item => item.id === 'laboratory-key');
    setIsPaintingCodeValid(hasKey);
  }, [gameState.inventory]);

  // Définition des fonctions de base
  const saveGameState = useCallback(async (newState: GameState) => {
    if (isOfflineMode) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setIsOfflineMode(true);
      setMessage('Mode hors-ligne activé');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const gameData = {
      currentScore: newState.score,
      currentElapsedTime: newState.elapsedTime,
      gameState: {
        currentRoom: newState.currentRoom,
        inventory: Array.isArray(newState.inventory) ? newState.inventory : [],
        score: typeof newState.score === 'number' ? newState.score : 1000,
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
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setIsOfflineMode(true);
      setMessage('Mode hors-ligne activé. La progression ne sera pas sauvegardée.');
      setTimeout(() => setMessage(''), 3000);
    }
  }, [isOfflineMode]);

  // Fonction pour terminer le jeu et sauvegarder le score final
  const endGame = useCallback(async () => {
    if (isOfflineMode) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Pas de token pour terminer le jeu');
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
    }
  }, [isOfflineMode, gameState]);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prevState => {
      const newState = { ...prevState, ...updates };
      // Nettoyer l'inventaire si il a été modifié
      if (updates.inventory) {
                  // Inventaire nettoyé automatiquement par le service
      }
      if (!isOfflineMode) {
        saveGameState(newState).catch(console.error);
      }
      return newState;
    });
  }, [isOfflineMode, saveGameState]);

  // Mettre à jour le score en fonction des événements
  const handleScoreUpdate = useCallback(async (event: ScoreEventType, details?: string) => {
    try {
      const result = await scoreService.updateScore(event, details);
      setGameState(prevState => ({
        ...prevState,
        score: result.newScore
      }));
      
      // Afficher un message si points gagnés/perdus
      if (result.points !== 0) {
        const message = result.points > 0 
          ? `+${result.points} points !` 
          : `${result.points} points`;
        console.log(`Score mis à jour: ${message} (Total: ${result.newScore})`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du score:', error);
      // Le scoreService gère déjà le fallback en mode hors-ligne
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

          if (objectType === 'riddle' && data?.riddleId) {
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
            itemName = 'Énigme des Ombres';
            itemDescription = 'Une énigme mystérieuse apparue sur le symbole mystique...';
            itemContent = riddleData.content;
          } else if (objectId === 'sun-symbol') {
            const riddleData = await gameApi.getRiddleContent('riddle-light');
            itemId = 'riddle-light';
            itemType = 'riddle';
            itemName = 'Énigme de la Lumière';
            itemDescription = 'Une énigme mystérieuse gravée sur un symbole solaire...';
            itemContent = riddleData.content;
          } else if (objectId === 'ancient-book') {
            const riddleData = await gameApi.getRiddleContent('riddle-wisdom');
            itemId = 'riddle-wisdom';
            itemType = 'riddle';
            itemName = 'Énigme de Sagesse';
            itemDescription = 'Une énigme cachée dans un livre ancien...';
            itemContent = riddleData.content;
          } else {
            // Objet générique
            itemId = data?.id || `item-${Date.now()}`;
            itemType = objectType;
            itemName = data?.name || 'Objet mystérieux';
            itemDescription = data?.description || 'Un objet intriguant...';
            itemContent = data?.content;
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
          console.error('Erreur lors de l\'ajout à l\'inventaire:', error);
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
          console.error('Erreur lors de l\'ajout de la clé:', error);
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
  }, [gameState, isTransitioning, isOfflineMode, saveGameState, handleScoreUpdate]);

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
          setIsOfflineMode(true);
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

  // Gérer le timer sécurisé
  useEffect(() => {
    if (isLoading || gameState.gameCompleted) return;

    // Callback pour les mises à jour du timer
    const handleTimerUpdate = (timerState: TimerState) => {
      setGameState(prevState => {
        if (prevState.gameCompleted) {
          return prevState;
        }

        // Mettre à jour avec les données du timer sécurisé
        const newState = {
          ...prevState,
          elapsedTime: timerState.elapsedTime,
          score: timerState.score || prevState.score // Garder le score local si pas de score serveur
        };

        return newState;
      });

      // Gérer la fin de jeu automatique
      if (timerState.gameEnded) {
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
    };

    // Démarrer le timer sécurisé
    secureTimer.onUpdate(handleTimerUpdate);
    secureTimer.start(gameState.elapsedTime);

    return () => {
      secureTimer.removeCallback(handleTimerUpdate);
      secureTimer.stop();
    };
  }, [isLoading, gameState.gameCompleted]); // Suppression des dépendances problématiques

  // Sauvegarde automatique séparée
  useEffect(() => {
    if (!isOfflineMode && !isLoading) {
      const timeoutId = setTimeout(() => {
        saveGameState(gameState).catch(console.error);
      }, 1000); // Sauvegarde avec délai pour éviter trop d'appels

      return () => clearTimeout(timeoutId);
    }
  }, [gameState.elapsedTime, gameState.score, isOfflineMode, isLoading, saveGameState]);

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
        setCurrentRiddle(item);
        setShowRiddle(true);
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
        setGameState(data.data.gameState);
        setShowPauseMenu(false);
        setMessage('Partie réinitialisée avec succès');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error(data.message || 'Erreur lors de la réinitialisation du jeu');
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de la partie:', error);
      setMessage('Erreur lors de la réinitialisation. Tentative en mode local...');
      // Fallback en mode local si l'API échoue
      setGameState({
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
        setCurrentRiddle({
          ...item,
          content: riddleContent.content
        });
        setShowRiddle(true);
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
          <button onClick={() => setError(null)}>Réessayer</button>
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

          {showRiddle && !isTransitioning && (
            <RiddleContent 
              onClose={() => {
                setShowRiddle(false);
                setCurrentRiddle(undefined);
              }}
              riddle={currentRiddle}
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