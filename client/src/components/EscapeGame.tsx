import React, { useState, useEffect, useCallback } from 'react';
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

  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [currentCodeType, setCurrentCodeType] = useState<'drawer' | 'painting'>('drawer');
  const [message, setMessage] = useState<string>('');
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
        elapsedTime: typeof newState.elapsedTime === 'number' ? newState.elapsedTime : 0
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
      if (!isOfflineMode) {
        saveGameState(newState).catch(console.error);
      }
      return newState;
    });
  }, [isOfflineMode, saveGameState]);

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
    
    if (isTransitioning && !['examine', 'feedback', 'checkBeakerSequence', 'enterCode', 'add_key_to_inventory'].includes(action)) {
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
          
          if (!gameState.inventory.some(item => item.id === bookItem.id)) {
            setGameState(prevState => ({
              ...prevState,
              inventory: [...prevState.inventory, bookItem]
            }));
            setTimeout(() => setMessage(''), 3000);
          }
        } else if (objectId === 'shadow-riddle-symbol') {
          const shadowRiddle: InventoryItem = {
            id: 'shadow-riddle',
            type: 'riddle',
            name: 'Énigme de l\'Ombre',
            description: 'Une énigme mystérieuse apparue sur le symbole mystique...',
            content: {
              riddle: "Je suis ton reflet sans lumière,\nJe te suis sans bruit, mais disparais dans l'obscurité.\nCompte mes lettres et tu trouveras un chiffre du code.\nQui suis-je ?",
              answer: 'OMBRE'
            }
          };
          setGameState(prevState => ({
            ...prevState,
            inventory: [...prevState.inventory, shadowRiddle]
          }));
          setTimeout(() => setMessage(''), 3000);
        } else if (objectId === 'sun-symbol') {
          const sunRiddle: InventoryItem = {
            id: 'sun-riddle',
            type: 'riddle',
            name: 'Énigme de la Lumière',
            description: 'Une énigme mystérieuse gravée sur un symbole solaire...',
            content: {
              riddle: "Je commence au lever du jour,\nEt m'efface lorsque les paupières tombent.\nCompte le nombre de voyelles dans mon nom,\net tu connaîtras le chiffre du code.\nQui suis-je ?",
              answer: "SOLEIL"
            }
          };
          setGameState(prevState => ({
            ...prevState,
            inventory: [...prevState.inventory, sunRiddle]
          }));
          setTimeout(() => setMessage(''), 3000);
        } else if (objectId === 'ancient-book') {
          const bookRiddle: InventoryItem = {
            id: 'book-riddle',
            type: 'riddle',
            name: 'Énigme du Livre',
            description: 'Une énigme cachée dans un livre ancien...',
            content: {
              riddle: "Je porte les pensées d'un homme à un autre,\nJe traverse le monde sans bouger.\nObserve ma dernière lettre, trouve sa position dans l'alphabet,\net tu auras le e chiffre du code.\nQui suis-je ?",
              answer: "LIVRE"
            }
          };
          setGameState(prevState => ({
            ...prevState,
            inventory: [...prevState.inventory, bookRiddle]
          }));
          setTimeout(() => setMessage(''), 3000);
        }
        break;

      case 'add_to_inventory_riddle':
        handleScoreUpdate('ITEM_COLLECTED');
        const riddleItem: InventoryItem = {
          id: 'drawer-riddle',
          type: 'clue',
          name: 'Énigme mystérieuse',
          description: 'Une énigme qui semble liée au tableau...'
        };
        setGameState(prevState => ({
          ...prevState,
          inventory: [...prevState.inventory, riddleItem]
        }));
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
        
        setGameState(prevState => ({
          ...prevState,
          inventory: [...prevState.inventory, keyItem]
        }));
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
            currentRoom: 'laboratory'
          }));
          
          if (!isOfflineMode) {
            saveGameState({
              ...gameState,
              currentRoom: 'laboratory'
            }).catch(console.error);
          }
          
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
              setGameState(data.data.gameState);
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
          id: 'drawer-riddle',
          type: 'riddle',
          name: 'Énigme du Tiroir',
          description: 'Une énigme mystérieuse trouvée dans le tiroir',
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
        setMessage('Code incorrect');
        setTimeout(() => setMessage(''), 2000);
      }
    } else if (currentCodeType === 'painting') {
      if (code === '7245') {
        handleScoreUpdate('CODE_CORRECT');
        handleInteract('laboratory-key', 'key', 'add_key_to_inventory');
        setMessage('Le mécanisme s\'active ! Une clé apparaît !');
        setShowCodeInput(false);
      } else {
        handleScoreUpdate('CODE_INCORRECT');
        setMessage('Rien ne se passe...');
        setTimeout(() => setMessage(''), 2000);
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
    setIsTransitioning(true);
    setGameState(prevState => ({
      ...prevState,
      currentRoom: newRoom,
      unlockedRooms: Array.from(new Set([...prevState.unlockedRooms, newRoom]))
    }));
    setTimeout(() => setIsTransitioning(false), 1000);
  }, []);

  // Gestionnaire pour le redémarrage du jeu
  const handleRestart = () => {
    setGameState(initialGameState);
    setShowPauseMenu(false);
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
                <li>I : Ouvrir l'inventaire</li>
                <li>M : Menu pause</li>
                {gameState.currentRoom === 'laboratory' && (
                  <>
                    <li>R : Examiner au microscope</li>
                    <li>C : Mélanger les produits chimiques</li>
                  </>
                )}
                {gameState.currentRoom === 'secret-chamber' && (
                  <li>P : Placer un artefact</li>
                )}
              </ul>
            </div>
            <div className="instructions-section">
              <h3>Objectifs</h3>
              {gameState.currentRoom === 'library' && (
                <ul>
                  <li>Trouvez le livre mystérieux</li>
                  <li>Déchiffrez le code du tiroir</li>
                  <li>Découvrez ce qui se cache derrière le tableau</li>
                  <li>Trouvez la clé du laboratoire</li>
                </ul>
              )}
              {gameState.currentRoom === 'laboratory' && (
                <ul>
                  <li>Examinez les échantillons au microscope</li>
                  <li>Trouvez la bonne combinaison de produits chimiques</li>
                  <li>Récupérez la clé en cristal</li>
                  <li>Localisez la porte secrète</li>
                </ul>
              )}
              {gameState.currentRoom === 'secret-chamber' && (
                <ul>
                  <li>Examinez le bureau du Professeur</li>
                  <li>Trouvez l'orbe de cristal</li>
                  <li>Placez l'orbe sur le piédestal</li>
                  <li>Découvrez le secret final</li>
                </ul>
              )}
            </div>
          </div>

          {/* Menu Pause */}
          {showPauseMenu && (
            <PauseMenu
              onClose={() => setShowPauseMenu(false)}
              onRestart={handleRestart}
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