import React, { useState, useEffect, useCallback } from 'react';
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
import { GameState } from '../types/gameState';
import { InventoryItem } from '../types/gameTypes';
import { RiddleSecret1 } from './ui/RiddleSecret1/RiddleSecret1';
import { RiddleSecret2 } from './ui/RiddleSecret2/RiddleSecret2';
import { RiddleSecret3 } from './ui/RiddleSecret3/RiddleSecret3';
import { RiddleSecret4 } from './ui/RiddleSecret4/RiddleSecret4';
import './game/EscapeGame.css';
import { ScoreEvents, ScoreEventType, updateScore } from '../types/scoreManager';

// Configuration de l'API
const API_URL = 'http://localhost:3001/api';

export const EscapeGame: React.FC = () => {
  const navigate = useNavigate();
  
  // Fonction pour nettoyer l'inventaire des doublons
  const cleanInventory = useCallback((inventory: InventoryItem[]): InventoryItem[] => {
    const seen = new Set<string>();
    return inventory.filter(item => {
      if (seen.has(item.id)) {
        console.warn(`Doublon détecté dans l'inventaire: ${item.id}`, item);
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, []);

  // État initial du jeu
  const initialGameState: GameState = {
    score: 1000,
    elapsedTime: 0,
    currentRoom: 'library',
    inventory: [],
    microscopeEnigmeResolved: false,
    periodicTableUnlocked: false,
    unlockedRooms: ['library'], 
    computerUnlocked: false,
    gameCompleted: false,
    artifactUnlocked: false
  };

  const [gameState, setGameStateRaw] = useState<GameState>(initialGameState);
  
  // Wrapper pour setGameState qui nettoie automatiquement l'inventaire
  const setGameState = useCallback((newStateOrUpdater: GameState | ((prevState: GameState) => GameState)) => {
    setGameStateRaw(prevState => {
      const newState = typeof newStateOrUpdater === 'function' 
        ? newStateOrUpdater(prevState) 
        : newStateOrUpdater;
      
      // Nettoyer l'inventaire des doublons
      return {
        ...newState,
        inventory: cleanInventory(newState.inventory)
      };
    });
  }, [cleanInventory]);

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

  // Ajout des états pour les statistiques
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);

  const [showPauseMenu, setShowPauseMenu] = useState(false);

  const [showRiddleSecret1, setShowRiddleSecret1] = useState(false);
  const [showRiddleSecret2, setShowRiddleSecret2] = useState(false);
  const [showRiddleSecret3, setShowRiddleSecret3] = useState(false);
  const [showRiddleSecret4, setShowRiddleSecret4] = useState(false);
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
        newState.inventory = cleanInventory(newState.inventory);
      }
      if (!isOfflineMode) {
        saveGameState(newState).catch(console.error);
      }
      return newState;
    });
  }, [isOfflineMode, saveGameState, cleanInventory]);

  // Mettre à jour le score en fonction des événements
  const handleScoreUpdate = useCallback((event: ScoreEventType) => {
    setGameState(prevState => {
      const newScore = updateScore(prevState.score, event);
      return {
        ...prevState,
        score: newScore
      };
    });
  }, []);

  const handleInteract = useCallback((objectId: string, objectType: string, action?: string, data?: any) => {
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
        handleScoreUpdate('ITEM_COLLECTED');
        if (objectType === 'riddle' && data) {
          const riddleItem: InventoryItem = {
            id: data.id || `riddle-${Date.now()}`,
            type: 'riddle',
            name: data.name,
            description: data.description,
            content: data.content
          };
          
          setGameState(prevState => {
            // Vérifier si l'énigme n'est pas déjà dans l'inventaire
            const riddleExists = prevState.inventory.some(item => item.id === riddleItem.id);
            if (riddleExists) {
              return prevState;
            }

            return {
              ...prevState,
              inventory: [...prevState.inventory, riddleItem]
            };
          });
          setTimeout(() => setMessage(''), 3000);
        } else if (objectId === 'mysterious-book') {
          const bookItem: InventoryItem = {
            id: 'professors-journal',
            type: 'note',
            name: 'Journal du Professeur',
            description: 'Un vieux journal contenant des notes énigmatiques'
          };
          
          setGameState(prevState => {
            // Vérifier si l'item existe déjà dans l'état actuel
            const itemExists = prevState.inventory.some(item => item.id === bookItem.id);
            if (itemExists) {
              return prevState;
            }
            
            return {
              ...prevState,
              inventory: [...prevState.inventory, bookItem]
            };
          });
          setTimeout(() => setMessage(''), 3000);
        } else if (objectId === 'shadow-riddle-symbol') {
          const shadowRiddle: InventoryItem = {
            id: 'riddle-shadow',
            type: 'riddle',
            name: 'Énigme des Ombres',
            description: 'Une énigme mystérieuse apparue sur le symbole mystique...',
            content: {
              riddle: "Je suis ton reflet sans lumière,\nJe te suis sans bruit, mais disparais dans l'obscurité.\nCompte mes lettres et tu trouveras un chiffre du code.\nQui suis-je ?",
              answer: 'OMBRE'
            }
          };
          setGameState(prevState => {
            // Vérifier si l'item existe déjà dans l'état actuel
            const itemExists = prevState.inventory.some(item => item.id === shadowRiddle.id);
            if (itemExists) {
              return prevState;
            }
            
            return {
              ...prevState,
              inventory: [...prevState.inventory, shadowRiddle]
            };
          });
          setTimeout(() => setMessage(''), 3000);
        } else if (objectId === 'sun-symbol') {
          const sunRiddle: InventoryItem = {
            id: 'riddle-light',
            type: 'riddle',
            name: 'Énigme de la Lumière',
            description: 'Une énigme mystérieuse gravée sur un symbole solaire...',
            content: {
              riddle: "Je commence au lever du jour,\nEt m'efface lorsque les paupières tombent.\nCompte le nombre de voyelles dans mon nom,\net tu connaîtras le chiffre du code.\nQui suis-je ?",
              answer: "SOLEIL"
            }
          };
          setGameState(prevState => {
            // Vérifier si l'item existe déjà dans l'état actuel
            const itemExists = prevState.inventory.some(item => item.id === sunRiddle.id);
            if (itemExists) {
              return prevState;
            }
            
            return {
              ...prevState,
              inventory: [...prevState.inventory, sunRiddle]
            };
          });
          setTimeout(() => setMessage(''), 3000);
        } else if (objectId === 'ancient-book') {
          const bookRiddle: InventoryItem = {
            id: 'riddle-wisdom',
            type: 'riddle',
            name: 'Énigme de Sagesse',
            description: 'Une énigme cachée dans un livre ancien...',
            content: {
              riddle: "Je porte les pensées d'un homme à un autre,\nJe traverse le monde sans bouger.\nObserve ma dernière lettre, trouve sa position dans l'alphabet,\net tu auras le e chiffre du code.\nQui suis-je ?",
              answer: "LIVRE"
            }
          };
          setGameState(prevState => {
            // Vérifier si l'item existe déjà dans l'état actuel
            const itemExists = prevState.inventory.some(item => item.id === bookRiddle.id);
            if (itemExists) {
              return prevState;
            }
            
            return {
              ...prevState,
              inventory: [...prevState.inventory, bookRiddle]
            };
          });
          setTimeout(() => setMessage(''), 3000);
        }
        break;

      case 'add_to_inventory_riddle':
        handleScoreUpdate('ITEM_COLLECTED');
        const riddleItem: InventoryItem = {
          id: 'riddle-ancient',
          type: 'riddle',
          name: 'Énigme Ancienne',
          description: 'Une énigme qui semble liée au tableau...'
        };
        setGameState(prevState => {
          // Vérifier si l'item existe déjà dans l'état actuel
          const itemExists = prevState.inventory.some(item => item.id === riddleItem.id);
          if (itemExists) {
            return prevState;
          }
          
          return {
            ...prevState,
            inventory: [...prevState.inventory, riddleItem]
          };
        });
        break;

      case 'add_key_to_inventory':
        handleScoreUpdate('ITEM_COLLECTED');
        
        let keyItem: InventoryItem;
        if (objectId === 'crystal-key') {
          keyItem = {
            id: 'crystal-key',
            type: 'key',
            name: 'Clé en Cristal',
            description: 'Une clé magnifique taillée dans un cristal translucide. Elle semble ouvrir quelque chose d\'important.'
          };
        } else {
          // Clé du laboratoire par défaut
          keyItem = {
            id: 'laboratory-key',
            type: 'key',
            name: 'Clé du laboratoire',
            description: 'Une clé ancienne qui semble ouvrir la porte du laboratoire secret.'
          };
        }
        
        setGameState(prevState => {
          // Vérifier si l'item existe déjà dans l'état actuel
          const itemExists = prevState.inventory.some(item => item.id === keyItem.id);
          if (itemExists) {
            return prevState;
          }
          
          return {
            ...prevState,
            inventory: [...prevState.inventory, keyItem]
          };
        });
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
                inventory: cleanInventory(data.data.gameState.inventory || [])
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

  // Gérer la pénalité de temps
  useEffect(() => {
    if (isLoading || gameState.gameCompleted) return;

    const interval = setInterval(() => {
      setGameState(prevState => {
        // Arrêter le chronomètre si le jeu est terminé
        if (prevState.gameCompleted) {
          return prevState;
        }
        
        const newElapsedTime = prevState.elapsedTime + 1;
        
        // Appliquer la pénalité de temps seulement toutes les 2 minutes (120 secondes)
        let newScore = prevState.score;
        if (newElapsedTime > 0 && newElapsedTime % 120 === 0) {
          newScore = updateScore(prevState.score, 'TIME_PENALTY');
        }
        
        return {
          ...prevState,
          elapsedTime: newElapsedTime,
          score: newScore
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, gameState.gameCompleted]);

  const handleCodeSubmit = useCallback((code: string) => {
    if (currentCodeType === 'drawer') {
      if (code === '1963') {
        handleScoreUpdate('CODE_CORRECT');
        handleScoreUpdate('ITEM_COLLECTED');
        const drawerRiddle: InventoryItem = {
          id: 'riddle-mathematics',
          type: 'riddle',
          name: 'Énigme Mathématique',
          description: 'Une énigme mathématique trouvée dans le tiroir',
          content: {
            riddle: `Quatre marchaient vers la vérité, mais un seul menait le pas...

Le troisième suit le deuxième, deux fois plus fort.

Le premier ne partage rien : il est impair, plus grand que le dernier, et unique en son genre.

Ensemble, ils valent 18.

Aucun d'eux ne se ressemble.

Et le deuxième est plus petit que le quatrième.`,
            answer: '7245'
          }
        };
        
        updateGameState({
          inventory: [...gameState.inventory, drawerRiddle]
        });
        setMessage('Code correct ! Vous avez trouvé une énigme !');
        setShowCodeInput(false);
      } else {
        handleScoreUpdate('CODE_INCORRECT');
        setCodeErrorMessage('Code incorrect');
        setTimeout(() => setCodeErrorMessage(''), 3000);
      }
    } else if (currentCodeType === 'painting') {
      if (code === '7245') {
        handleScoreUpdate('CODE_CORRECT');
        handleInteract('laboratory-key', 'key', 'add_key_to_inventory');
        setMessage('Le mécanisme s\'active ! Une clé apparaît !');
        setShowCodeInput(false);
        setIsPaintingCodeValid(true);
        setTimeout(() => setMessage(''), 3000);
      } else {
        handleScoreUpdate('CODE_INCORRECT');
        setCodeErrorMessage('Code incorrect');
        setTimeout(() => setCodeErrorMessage(''), 3000);
      }
    }
  }, [currentCodeType, handleInteract, gameState.inventory, updateGameState, handleScoreUpdate]);

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
      setGameState(initialGameState);
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

  const handleInventoryItemClick = useCallback((item: InventoryItem) => {
    if (item.id === 'shadow-riddle') {
      setShowRiddleSecret1(true);
      setSelectedRiddle(item.id);
    } else if (item.id === 'mirror-riddle') {
      setShowRiddleSecret2(true);
      setSelectedRiddle(item.id);
    } else if (item.id === 'book-riddle') {
      setShowRiddleSecret3(true);
      setSelectedRiddle(item.id);
    } else if (item.id === 'sun-riddle') {
      setShowRiddleSecret4(true);
      setSelectedRiddle(item.id);
    } else if (item.id === 'periodic-table-elements-riddle') {
      setShowRiddle(true);
      setCurrentRiddle(item);
      setSelectedRiddle(item.id);
    } else if (item.id === 'professors-journal') {
      setShowBook(true);
    } else if (item.id === 'drawer-riddle') {
      setShowRiddle(true);
      setCurrentRiddle(item);
      setSelectedRiddle(item.id);
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
    setAttemptsCount(prev => prev + 1);
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
            hintsUsed={hintsUsed}
            attemptsCount={attemptsCount}
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

          {showRiddleSecret1 && selectedRiddle === 'shadow-riddle' && (
            <RiddleSecret1 onClose={() => setShowRiddleSecret1(false)} />
          )}

          {showRiddleSecret2 && selectedRiddle === 'mirror-riddle' && (
            <RiddleSecret2 onClose={() => setShowRiddleSecret2(false)} />
          )}

          {showRiddleSecret3 && (
            <RiddleSecret3 onClose={() => setShowRiddleSecret3(false)} />
          )}

          {showRiddleSecret4 && (
            <RiddleSecret4 onClose={() => setShowRiddleSecret4(false)} />
          )}
        </>
      )}
    </div>
  );
}; 