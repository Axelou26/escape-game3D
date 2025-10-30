import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GameState } from '../../../types/gameState';
import './LaboratoireScene.css';
import { grey } from '@mui/material/colors';
import { CodeInput } from '../../ui/CodeInput/CodeInput';
import { handlePointerLockErrors } from '../../../utils/errorHandler';
import { gameApi } from '../../../services/gameApi';

// Géométries réutilisables 
const sharedGeometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 8),
  plane: new THREE.PlaneGeometry(1, 1),
  sphere: new THREE.SphereGeometry(1, 8, 8),
  smallCylinder: new THREE.CylinderGeometry(1, 1, 1, 6),
  largeCylinder: new THREE.CylinderGeometry(1, 1, 1, 12)
};

// Matériaux réutilisables 
const sharedMaterials = {
  metal: new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.3,
    metalness: 0.8
  }),
  plastic: new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.1
  }),
  glass: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1
  }),
  wall: new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.7,
    metalness: 0.1
  }),
  floor: new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.8,
    metalness: 0.1
  }),
  metalDark: new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2
  }),
  glassClear: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1
  })
};

interface LaboratoireSceneProps {
  onInteract: (objectId: string, objectType: string, action?: string, data?: any) => void;
  onUpdateGameState: (updates: Partial<GameState>) => void;
  periodicTableUnlocked?: boolean;
  inventory?: any[]; // Ajout de l'inventaire pour vérifier les objets existants
}

export const LaboratoireScene: React.FC<LaboratoireSceneProps> = React.memo(({
  onInteract,
  onUpdateGameState,
  periodicTableUnlocked = false,
  inventory = []
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<PointerLockControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number>();
  const moveStateRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const sceneRef = useRef<THREE.Scene | null>(null);
  const collisionObjectsRef = useRef<THREE.Mesh[]>([]);
  const isInitializedRef = useRef(false);
  const isDisposedRef = useRef(false);
  const isMountedRef = useRef(false);
  const [selectedBeakers, setSelectedBeakers] = useState<string[]>([]);
  const selectedBeakersRef = useRef<string[]>([]);
  const [isPeriodicTableLocked, setIsPeriodicTableLocked] = useState(!periodicTableUnlocked);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeErrorMessage, setCodeErrorMessage] = useState<string>('');
  
  // Refs pour le raycasting 
  const raycasterRef = useRef(new THREE.Raycaster());
  const lastHoveredObjectRef = useRef<THREE.Object3D | null>(null);

  // Ajouter une ref pour stocker l'état persistant du tableau
  const periodicTableStateRef = useRef({
    isLocked: !periodicTableUnlocked,
    globalUnlocked: periodicTableUnlocked,
    riddleCollected: false
  });

  // Ajouter une ref pour l'état de l'ordinateur et du casier
  const labStateRef = useRef({
    isComputerUnlocked: false,
    isLockerUnlocked: false,
    computerAttempts: 0,
    beakerSequenceCompleted: false
  });

  // Ajouter une ref pour le gameState
  const gameStateRef = useRef<GameState>({
    score: 0,
    elapsedTime: 0,
    currentRoom: 'laboratory' as const,
    inventory: [],
    microscopeEnigmeResolved: false,
    periodicTableUnlocked: false,
    unlockedRooms: [],
    computerUnlocked: false,
    gameCompleted: false,
    artifactUnlocked: false
  });

  // Optimisation des useEffect pour éviter les re-renders excessifs
  useEffect(() => {
    // Debounce pour éviter les mises à jour trop fréquentes
    const timeoutId = setTimeout(() => {
      periodicTableStateRef.current = {
        isLocked: !periodicTableUnlocked,
        globalUnlocked: periodicTableUnlocked,
        riddleCollected: false
      };
      
      setIsPeriodicTableLocked(!periodicTableUnlocked);
      
      if (!periodicTableUnlocked) {
        onUpdateGameState({ 
          periodicTableUnlocked: false,
          microscopeEnigmeResolved: false 
        });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [periodicTableUnlocked, onUpdateGameState]);

  // Synchronisation optimisée avec debounce
  useEffect(() => {
    if (periodicTableUnlocked && !periodicTableStateRef.current.globalUnlocked) {
      const timeoutId = setTimeout(() => {
        periodicTableStateRef.current = {
          ...periodicTableStateRef.current,
          isLocked: false,
          globalUnlocked: true
        };
        setIsPeriodicTableLocked(false);
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [periodicTableUnlocked]);

  //  gameStateRef
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentGameState: GameState = {
        score: 0,
        elapsedTime: 0,
        currentRoom: 'laboratory' as const,
        inventory: [],
        microscopeEnigmeResolved: false,
        periodicTableUnlocked: periodicTableUnlocked || false,
        unlockedRooms: [],
        computerUnlocked: false,
        gameCompleted: false,
        artifactUnlocked: false
      };
      gameStateRef.current = currentGameState;
    }, 100); 

    return () => clearTimeout(timeoutId);
  }, [periodicTableUnlocked]);

  // Vérification de la séquence de couleurs
  const checkColorSequence = useCallback(async (beakerId: string) => {
    try {
    
      if (labStateRef.current.beakerSequenceCompleted) {
        onInteract('sequence-completed', 'message', 'examine', 'Vous avez déjà résolu la séquence des béchers.');
        return;
      }

      // Ajouter le bécher à la séquence actuelle
      const newSequence = [...selectedBeakersRef.current, beakerId];
      setSelectedBeakers(newSequence);
      selectedBeakersRef.current = newSequence;

      // Afficher un feedback visuel pour chaque bécher sélectionné
      const colorNames = {
        'beaker-rouge': 'Rouge',
        'beaker-orange': 'Orange', 
        'beaker-jaune': 'Jaune',
        'beaker-vert': 'Vert',
        'beaker-bleu': 'Bleu',
        'beaker-violet': 'Violet'
      };
      
      const currentColor = colorNames[beakerId as keyof typeof colorNames];
      onInteract('sequence-progress', 'message', 'examine', 
        `${currentColor} sélectionné (${newSequence.length}/6)`);

      // Ne valider que si la séquence est complète (6 béchers)
      if (newSequence.length === 6) {
        const sequenceString = newSequence.join(',');
        const validationResult = await gameApi.validateCode('beaker-sequence', sequenceString);

        if (validationResult.correct) {
       
          setSelectedBeakers([]);
          selectedBeakersRef.current = [];
          
         
          labStateRef.current.beakerSequenceCompleted = true;
          
         
          onInteract('beaker-sequence', 'laboratory', 'checkBeakerSequence', { isCorrect: true });
          
          // Mettre à jour l'état global et la ref
          onUpdateGameState({ 
            periodicTableUnlocked: true,
            microscopeEnigmeResolved: true
          });
          
          periodicTableStateRef.current = {
            isLocked: false,
            globalUnlocked: true,
            riddleCollected: false
          };
          
          setIsPeriodicTableLocked(false);
          
          onInteract('sequence', 'message', 'examine', `Le mécanisme du tableau périodique s'active ! Allez examiner le tableau pour découvrir ce qui a changé...`);
          
          onInteract('periodic-table', 'state', 'unlock', { isLocked: false, globalUnlocked: true });
        } else {
          // Séquence complète mais incorrecte - réinitialiser avec pénalité
          setSelectedBeakers([]);
          selectedBeakersRef.current = [];
          onInteract('sequence', 'feedback', 'feedback', 'incorrect');
          onInteract('beaker-sequence', 'laboratory', 'checkBeakerSequence', { isCorrect: false });
        }
      }
     
      
    } catch (error) {
      console.error('Erreur lors de la vérification de la séquence:', error);
      // En cas d'erreur API, réinitialiser la séquence
      setSelectedBeakers([]);
      selectedBeakersRef.current = [];
      onInteract('sequence', 'feedback', 'feedback', 'error');
    }
  }, [onInteract, onUpdateGameState]);

  // Vérification des collisions - conservée pour usage futur
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkCollision = useCallback((position: THREE.Vector3): boolean => {
    const playerRadius = 0.5;
    const playerHeight = 1.8;
    const playerBoundingBox = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(playerRadius * 2, playerHeight, playerRadius * 2)
    );

    const margin = 0.1;
    playerBoundingBox.min.subScalar(margin);
    playerBoundingBox.max.addScalar(margin);

    for (const object of collisionObjectsRef.current) {
      const objectBoundingBox = new THREE.Box3().setFromObject(object);
      if (playerBoundingBox.intersectsBox(objectBoundingBox)) {
        return true;
      }
    }
    return false;
  }, []);

  // Fonction de déplacement du joueur
  const movePlayer = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current?.isLocked) return;

    const speed = 0.15;
    const camera = cameraRef.current;
    const { forward, backward, left, right } = moveStateRef.current;

    // Obtenir la direction du regard
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    // Calculer le vecteur latéral
    const sideways = new THREE.Vector3(-direction.z, 0, direction.x);

    const moveVector = new THREE.Vector3();
    if (forward) moveVector.add(direction);
    if (backward) moveVector.sub(direction);
    if (left) moveVector.sub(sideways);
    if (right) moveVector.add(sideways);

    // Normaliser et appliquer la vitesse
    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(speed);
    }

    // Vérifier les collisions
    const currentPos = camera.position.clone();
    const newPosition = currentPos.clone().add(moveVector);

    let canMove = true;
    const playerRadius = 0.5;

    collisionObjectsRef.current.forEach(obj => {
      const box = new THREE.Box3().setFromObject(obj);
      const playerBox = new THREE.Box3().setFromCenterAndSize(
        newPosition,
        new THREE.Vector3(playerRadius * 2, 2, playerRadius * 2)
      );
      if (box.intersectsBox(playerBox)) {
        canMove = false;
      }
    });

    if (canMove) {
      camera.position.copy(newPosition);
    }
  }, []);

  // Fonction handleInteraction déplacée au niveau supérieur du composant
  const handleInteraction = useCallback(() => {
    if (!cameraRef.current || !sceneRef.current) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    for (const intersect of intersects) {
      let object: THREE.Object3D | null = intersect.object;
      while (object && !object.userData.interactive) {
        object = object.parent;
      }
      if (object?.userData.interactive) {
        
        switch (object.userData.id) {
          case 'microscope':
            onInteract('microscope-message', 'message', 'examine', 'Les couleurs contiennent la clé. À associer dans l\'ordre du spectre visible inversé.');
            break;
          case 'beaker-rouge':
          case 'beaker-orange':
          case 'beaker-jaune':
          case 'beaker-vert':
          case 'beaker-bleu':
          case 'beaker-violet':
            // Vérifier si la séquence a déjà été complétée
            if (labStateRef.current.beakerSequenceCompleted) {
              onInteract('sequence-completed', 'message', 'examine', 'Vous avez déjà résolu la séquence des béchers.');
              break;
            }
            
            // Vérifier si le bécher est déjà dans la séquence 
            if (selectedBeakersRef.current.includes(object.userData.id)) {
             
              setSelectedBeakers([]);
              selectedBeakersRef.current = [];
              onInteract('sequence-reset', 'message', 'examine', 'Séquence réinitialisée. Recommencez la sélection.');
            } else {
              checkColorSequence(object.userData.id);
            }
            break;
          case 'periodic-table':
            if (object.userData.type === 'state' && object.userData.action === 'unlock') {
              periodicTableStateRef.current = {
                isLocked: false,
                globalUnlocked: true,
                riddleCollected: false
              };
              object.userData.isLocked = false;
              object.userData.globalUnlocked = true;
              setIsPeriodicTableLocked(false);
              onUpdateGameState({ periodicTableUnlocked: true });
              break;
            }
            
            // Vérifier d'abord si le tableau est déverrouillé
            if (!periodicTableStateRef.current.globalUnlocked && !periodicTableUnlocked) {
              onInteract('periodic-table-locked', 'message', 'examine', 'Ce tableau semble verrouillé, il y a peut-être quelque chose à faire avec les béchers.');
            } else {
             
              const currentInventory = inventory || [];
              const riddleAlreadyExists = currentInventory.some(item => 
                (typeof item === 'string' ? item : item.id) === 'riddle-elements'
              );
              
              if (!riddleAlreadyExists && !periodicTableStateRef.current.riddleCollected) {
                // L'énigme n'existe pas dans l'inventaire ET n'a pas été marquée comme collectée localement
                onInteract('riddle-elements', 'riddle', 'add_to_inventory', { riddleId: 'riddle-elements' });
                
             
                onInteract('periodic-table-message', 'message', 'examine', 'Une énigme mystérieuse est apparue sur le tableau périodique ! Elle a été ajoutée à votre inventaire.');
                
               
                periodicTableStateRef.current = {
                  isLocked: false,
                  globalUnlocked: true,
                  riddleCollected: true
                };
              } else { 
                onInteract('periodic-table-message', 'message', 'examine', 'Vous avez déjà récupéré l\'énigme du tableau périodique.');
              }
            }
            break;
          case 'lab-computer':
            if (!labStateRef.current.isComputerUnlocked) {
              setShowCodeInput(true);
            } else {
              onInteract(object.userData.id, 'message', 'examine', 'L\'ordinateur est déjà déverrouillé.');
            }
            break;
          case 'secure-locker':
            if (!labStateRef.current.isLockerUnlocked) {
              onInteract(object.userData.id, 'message', 'examine', 'Le casier est verrouillé. Utilisez l\'ordinateur pour le déverrouiller.');
            } else {
              // Changer de salle
              onUpdateGameState({ 
                currentRoom: 'secret-chamber',
                unlockedRooms: [...(gameStateRef.current.unlockedRooms || []), 'secret-chamber']
              });
              onInteract(object.userData.id, 'message', 'examine', 'Le casier s\'ouvre, révélant un passage secret !');
            }
            break;
        }
        break;
      }
    }
  }, [checkColorSequence, periodicTableUnlocked, onInteract, inventory, onUpdateGameState]);

  // Mettre à jour la ref quand l'état change
  useEffect(() => {
    selectedBeakersRef.current = selectedBeakers;
  }, [selectedBeakers]);

  // Fonction optimisée pour créer des objets interactifs avec surbrillance blanche
  const makeInteractive = useCallback((object: THREE.Object3D, id: string, type: string) => {
    object.userData.interactive = true;
    object.userData.id = id;
    object.userData.type = type;
    
    // Initialisation spéciale pour le tableau périodique
    if (id === 'periodic-table') {
      object.userData.isLocked = periodicTableStateRef.current.isLocked;
      object.userData.globalUnlocked = periodicTableStateRef.current.globalUnlocked;
    }

    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff, 
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthTest: false, 
      depthWrite: false,
      blending: THREE.NormalBlending 
    });

    // Stocker les matériaux outline pour pouvoir les modifier plus tard
    object.userData.outlineMaterials = [];

    const processChild = (child: THREE.Object3D, parent: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const clonedOutlineMaterial = outlineMaterial.clone();
        const outlineMesh = new THREE.Mesh(child.geometry, clonedOutlineMaterial);
        
        
        outlineMesh.scale.multiplyScalar(1.015);
        outlineMesh.position.copy(child.position);
        outlineMesh.rotation.copy(child.rotation);
        outlineMesh.userData.isOutline = true; 
        
        parent.add(outlineMesh);
        object.userData.outlineMaterials.push(clonedOutlineMaterial);
      }
    };

    if (object instanceof THREE.Group) {
      object.children.forEach((child) => {
        processChild(child, object);
        // Traiter également les enfants des enfants (pour les groupes imbriqués)
        if (child instanceof THREE.Group) {
          child.children.forEach((grandChild) => {
            processChild(grandChild, child);
          });
        }
      });
    } else if (object instanceof THREE.Mesh) {
      processChild(object, object);
    }
  }, []);

  // Refs pour les gestionnaires d'événements
  const handleResizeRef = useRef<(() => void) | null>(null);
  const handleKeyDownRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  const handleKeyUpRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  const handleClickRef = useRef<(() => void) | null>(null);

  // Initialisation du renderer
  const initRenderer = useCallback(() => {
    if (!mountRef.current || !document.body.contains(mountRef.current) || !isMountedRef.current) {
      return null;
    }

    try {
      if (rendererRef.current) {
        return rendererRef.current;
      }

      const renderer = new THREE.WebGLRenderer({
        antialias: false, 
        alpha: true,
        powerPreference: "high-performance" 
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = false; 
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
      
      // CRUCIAL: Ajouter le renderer au DOM
      mountRef.current.appendChild(renderer.domElement);
      
      return renderer;
    } catch (error) {
      console.error('Erreur lors de la création du renderer:', error);
      return null;
    }
  }, []);

  // Effet pour gérer le montage initial
  useEffect(() => {
    isMountedRef.current = true;
    isDisposedRef.current = false;

    return () => {
      isMountedRef.current = false;
      
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const mountElement = mountRef.current;
      
      // Nettoyer les animations
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }

      //  Nettoyer les événements
      if (handleResizeRef.current) {
        window.removeEventListener('resize', handleResizeRef.current);
        handleResizeRef.current = null;
      }
      if (handleKeyDownRef.current) {
        window.removeEventListener('keydown', handleKeyDownRef.current);
        handleKeyDownRef.current = null;
      }
      if (handleKeyUpRef.current) {
        window.removeEventListener('keyup', handleKeyUpRef.current);
        handleKeyUpRef.current = null;
      }
      if (handleClickRef.current) {
        window.removeEventListener('click', handleClickRef.current);
        handleClickRef.current = null;
      }

      //Nettoyer Three.js
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material?.dispose();
            }
          }
        });
        sceneRef.current = null;
      }

      // Nettoyer le renderer
      if (rendererRef.current) {
        if (mountElement?.contains(rendererRef.current.domElement)) {
          mountElement.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
        rendererRef.current = null;
      }

      // Réinitialiser les autres refs
      cameraRef.current = null;
      controlsRef.current = null;
      collisionObjectsRef.current = [];

      // Marquer comme complètement disposé
      isDisposedRef.current = true;
      isInitializedRef.current = false;
    };
  }, []);

  // Initialisation du laboratoire
  const initScene = useCallback(() => {
    if (!mountRef.current || !isMountedRef.current || isDisposedRef.current) {
      return;
    }

    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;
    isDisposedRef.current = false;

    // Initialisation de la scène
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a1a1a);

    // Configuration de la caméra
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 8);
    cameraRef.current = camera;

    // Initialisation du renderer
    const renderer = initRenderer();
    if (!renderer) return;
    rendererRef.current = renderer;

    // Configuration des contrôles
    if (!controlsRef.current) {
      const controls = new PointerLockControls(camera, document.body);
      handlePointerLockErrors(controls);
      controlsRef.current = controls;
    }

    // Création du laboratoire
    const createLaboratory = () => {
      // Sol en carrelage
      const createTiledFloor = () => {
        const floorGroup = new THREE.Group();
        const tileSize = 1;
        const roomSize = 20;

        for (let x = -roomSize/2; x < roomSize/2; x += tileSize) {
          for (let z = -roomSize/2; z < roomSize/2; z += tileSize) {
            const isAlternate = (Math.floor(x) + Math.floor(z)) % 2 === 0;
            const tile = new THREE.Mesh(
              new THREE.PlaneGeometry(tileSize, tileSize),
              new THREE.MeshStandardMaterial({
                color: isAlternate ? 0x222222 : 0x333333,
                roughness: 0.8
              })
            );
            tile.rotation.x = -Math.PI / 2;
            tile.position.set(x + tileSize/2, 0, z + tileSize/2);
            floorGroup.add(tile);
          }
        }
        scene.add(floorGroup);
      };

      // Murs avec carrelage
      const createWalls = () => {
        const walls = [
          { pos: [0, 2.5, -10], rot: [0, 0, 0] },
          { pos: [0, 2.5, 10], rot: [0, Math.PI, 0] },
          { pos: [-10, 2.5, 0], rot: [0, Math.PI / 2, 0] },
          { pos: [10, 2.5, 0], rot: [0, -Math.PI / 2, 0] }
        ];

        walls.forEach(({pos, rot}) => {
          // Mur de base
          const wall = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 5),
            new THREE.MeshStandardMaterial({
              color: 0xcccccc,
              roughness: 0.8
            })
          );
          wall.position.set(pos[0], pos[1], pos[2]);
          wall.rotation.set(rot[0], rot[1], rot[2]);
          scene.add(wall);

          // Carrelage mural
          const tileSize = 0.5;
          const tilesGroup = new THREE.Group();
          
          for (let y = 0; y < 5; y += tileSize) {
            for (let x = -10; x < 10; x += tileSize) {
              const tile = new THREE.Mesh(
                new THREE.PlaneGeometry(tileSize - 0.01, tileSize - 0.01),
                new THREE.MeshStandardMaterial({
                  color: 0xffffff,
                  roughness: 0.7
                })
              );
              tile.position.set(x + tileSize/2, y + tileSize/2, 0.01);
              tilesGroup.add(tile);
            }
          }
          tilesGroup.position.set(pos[0], pos[1] - 2.5, pos[2]);
          tilesGroup.rotation.set(rot[0], rot[1], rot[2]);
          scene.add(tilesGroup);
        });
      };

      // Tables de laboratoire
      const createLabTables = () => {
        const tablePositions = [
          { x: -5, z: 0 },
          { x: 0, z: 0 },
          { x: 5, z: 0 }
        ];

        tablePositions.forEach((pos, index) => {
          // Structure de la table
          const table = new THREE.Group();

          // Plateau
          const top = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.1, 1.5),
            new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.9
            })
          );
          top.position.y = 0.9;
          table.add(top);

          // Pieds
          const legGeometry = new THREE.BoxGeometry(0.1, 0.9, 0.1);
          const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.7
          });

          const legPositions = [
            [-1.4, 0.45, 0.7],
            [1.4, 0.45, 0.7],
            [-1.4, 0.45, -0.7],
            [1.4, 0.45, -0.7]
          ];

          legPositions.forEach(legPos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(legPos[0], legPos[1], legPos[2]);
            table.add(leg);
          });

          // Équipement de laboratoire sur la table
          const createLabEquipment = () => {
            table.position.set(pos.x, 0, pos.z);
            scene.add(table);
          };

          createLabEquipment();
        });
      };

      // Armoires de laboratoire
      const createLabCabinets = () => {
        const cabinetPositions = [
          { x: -9, z: -9.5 },
          { x: -6, z: -9.5 },
          { x: -3, z: -9.5 }
        ];

        cabinetPositions.forEach(pos => {
          const cabinet = new THREE.Group();

          // Structure principale
          const body = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 2.5, 0.8),
            new THREE.MeshStandardMaterial({
              color: grey[500],
              roughness: 0.9
            })
          );
          cabinet.add(body);

          // Portes vitrées
          const doorGeometry = new THREE.PlaneGeometry(1.2, 2.3);
          const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1
          });

          [-0.6, 0.6].forEach(x => {
            const door = new THREE.Mesh(doorGeometry, glassMaterial);
            door.position.set(x, 0, 0.41);
            cabinet.add(door);
          });

          // Étagères intérieures visibles
          [0.5, 1.5].forEach(y => {
            const shelf = new THREE.Mesh(
              new THREE.BoxGeometry(2.4, 0.05, 0.7),
              new THREE.MeshStandardMaterial({ color: 0xeeeeee })
            );
            shelf.position.set(0, y - 1.2, 0);
            cabinet.add(shelf);
          });

        
          cabinet.position.set(pos.x, 1.25, pos.z);
          scene.add(cabinet);
        });
      };

      // bureau ordinateur
      const createSink = () => {
        const sink = new THREE.Group();

        // Base
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.9, 0.8),
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.9
          })
        );
        sink.add(base);

      
        const tap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
          new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.2
          })
        );
        tap.position.set(0, 0.35, 0);
        

    
        sink.position.set(9, 0.45, -8);
        scene.add(sink);
      };

      // Exécution dans l'ordre
      createTiledFloor();
      createWalls();
      createLabTables();
      createLabCabinets();
      createSink();
    };

    // Création immédiate du laboratoire
    createLaboratory();

    // Éclairage 
    const createLighting = () => {
     
      const ambient = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambient);

      //nombre de lumières 
      const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
      mainLight.position.set(0, 10, 0);
      mainLight.castShadow = false;
      scene.add(mainLight);

    
      const createCeilingLight = (x: number, z: number) => {
        
        const light = new THREE.DirectionalLight(0xffffff, 0.3);
        light.position.set(x, 4.8, z);
        light.target.position.set(x, 0, z);
        scene.add(light);
        scene.add(light.target);

        // Boîtier de la lumière réutilisant la géométrie partagée
        const fixture = new THREE.Mesh(
          sharedGeometries.box.clone().scale(2, 0.1, 0.2),
          sharedMaterials.metal
        );
        fixture.position.set(x, 4.9, z);
        scene.add(fixture);
      };

      // nombre de lumières 
      createCeilingLight(-4, -4);
      createCeilingLight(4, -4);
      createCeilingLight(-4, 4);
      createCeilingLight(4, 4);
    };

    createLighting();

    // Gestion des collisions
    const createCollisionBoxes = () => {
      // Murs
      const walls = [
        { pos: [0, 2.5, -10], size: [20, 5, 0.5] },
        { pos: [0, 2.5, 10], size: [20, 5, 0.5] },
        { pos: [-10, 2.5, 0], size: [0.5, 5, 20] },
        { pos: [10, 2.5, 0], size: [0.5, 5, 20] }
      ];

      walls.forEach(({pos, size}) => {
        const collisionBox = new THREE.Mesh(
          new THREE.BoxGeometry(size[0], size[1], size[2]),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        collisionBox.position.set(pos[0], pos[1], pos[2]);
        collisionObjectsRef.current.push(collisionBox);
        scene.add(collisionBox);
      });

      // Tables
      [-5, 0, 5].forEach(x => {
        const tableCollision = new THREE.Mesh(
          new THREE.BoxGeometry(3, 1, 1.5),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        tableCollision.position.set(x, 0.5, 0);
        collisionObjectsRef.current.push(tableCollision);
        scene.add(tableCollision);
      });

      // Armoires
      [-9, -6, -3].forEach(x => {
        const cabinetCollision = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 2.5, 0.8),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        cabinetCollision.position.set(x, 1.25, -9);
        collisionObjectsRef.current.push(cabinetCollision);
        scene.add(cabinetCollision);
      });

      // Évier
      const sinkCollision = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.9, 0.8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      sinkCollision.position.set(9, 0.45, -8);
      collisionObjectsRef.current.push(sinkCollision);
      scene.add(sinkCollision);
    };

    createCollisionBoxes();

    // surbrillance
    const updateInteractiveHighlight = () => {
      if (!cameraRef.current || !sceneRef.current) return;

      raycasterRef.current.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
      
      // Créer une liste réduite d'objets interactifs seulement
      const interactiveObjects: THREE.Object3D[] = [];
      sceneRef.current.traverse((object) => {
        if (object.userData.interactive && !object.userData.collected && !object.userData.isOutline) {
          interactiveObjects.push(object);
        }
      });

      const intersects = raycasterRef.current.intersectObjects(interactiveObjects, true);

      // Réinitialiser l'objet précédemment survolé
      if (lastHoveredObjectRef.current) {
        lastHoveredObjectRef.current.userData.outlineMaterials?.forEach((material: THREE.Material) => {
          (material as THREE.MeshBasicMaterial).opacity = 0; // Masquer la surbrillance
        });
        lastHoveredObjectRef.current = null;
      }

      // Trouver l'objet interactif le plus proche avec vérification de distance
      for (const intersect of intersects) {
        let object: THREE.Object3D | null = intersect.object;
        
        // Remonter la hiérarchie pour trouver l'objet interactif parent
        while (object && !object.userData.interactive) {
          object = object.parent;
        }
        
        if (object?.userData.interactive && !object.userData.collected) {
          // Vérifier la distance - activer seulement si proche (moins de 3 unités)
          const distance = intersect.distance;
          const maxInteractionDistance = 3.0;
          
          if (distance <= maxInteractionDistance) {
            lastHoveredObjectRef.current = object;
            
            // Contours blancs fins et visibles pour les objets interactifs
            object.userData.outlineMaterials?.forEach((material: THREE.Material) => {
              const outlineMaterial = material as THREE.MeshBasicMaterial;
              outlineMaterial.opacity = 0.2; 
              outlineMaterial.color.setHex(0xffffff); 
            });
          }
          break; 
        }
      }
    };

    // Création des éléments interactifs
    const createInteractiveElements = () => {
      // Microscope interactif
      const createInteractiveMicroscope = () => {
        const microscope = new THREE.Group();
        
        // Base du microscope
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.05, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        microscope.add(base);

        // Colonne
        const column = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        column.position.set(0, 0.15, 0);
        microscope.add(column);

        // Tête
        const head = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.15, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        head.position.set(0, 0.3, 0);
        microscope.add(head);

        microscope.position.set(0.5, 1, 0);
        makeInteractive(microscope, 'microscope', 'equipment');
        scene.add(microscope);
      };

      // Béchers interactifs avec solutions colorées
      const createInteractiveBeakers = () => {
        const beakerColors = [
          { id: 'beaker-violet', color: 0x8B00FF },
          { id: 'beaker-bleu', color: 0x0000FF },
          { id: 'beaker-vert', color: 0x00FF00 },
          { id: 'beaker-jaune', color: 0xFFFF00 },
          { id: 'beaker-orange', color: 0xFFA500 },
          { id: 'beaker-rouge', color: 0xFF0000 }
        ];

        beakerColors.forEach((beaker, index) => {
          const beakerGroup = new THREE.Group();
          
          // Création du bécher en verre avec géométrie optimisée
          const glass = new THREE.Mesh(
            sharedGeometries.smallCylinder.clone().scale(0.1, 0.2, 0.1),
            sharedMaterials.glassClear
          );
          beakerGroup.add(glass);

          // Liquide coloré
          const liquid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.06, 0.15, 16),
            new THREE.MeshStandardMaterial({
              color: beaker.color,
              transparent: true,
              opacity: 0.6
            })
          );
          liquid.position.y = -0.02;
          beakerGroup.add(liquid);

          // Positionnement des béchers en arc de cercle autour du microscope
          const angle = (index * Math.PI) / 3; 
          const radius = 0.4;
          beakerGroup.position.set(
            0.5 + radius * Math.cos(angle),
            1,
            radius * Math.sin(angle)
          );

          makeInteractive(beakerGroup, beaker.id, 'chemical');
          scene.add(beakerGroup);
        });
      };

      // Tableau périodique interactif
      const createPeriodicTable = () => {
        const table = new THREE.Group();
        
        // Fond du tableau
        const background = new THREE.Mesh(
          new THREE.PlaneGeometry(2.5, 1.8),
          new THREE.MeshStandardMaterial({ 
            color: 0x202020,
            roughness: 0.9,
            metalness: 0.1
          })
        );
        table.add(background);

       

       

        // Position sur le mur du fond
        table.position.set(0, 2.2, 9.7);
        table.rotation.y = Math.PI;
        makeInteractive(table, 'periodic-table', 'puzzle');

        // Éclairage spécifique pour le tableau
        const spotLight = new THREE.SpotLight(0xffffff, 1);
        spotLight.position.set(0, 3, 8);
        spotLight.target = table;
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.5;
        scene.add(spotLight);

        scene.add(table);
      };

      // Ordinateur de laboratoire avec écran de sécurité
      const createLabComputer = () => {
        const computer = new THREE.Group();

        // === MONITEUR ===
        const monitor = new THREE.Group();

        // Cadre de l'écran (plastique noir)
        const screenFrame = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.45, 0.08),
          new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.8,
            metalness: 0.1
          })
        );
        monitor.add(screenFrame);

        // Écran LCD (légèrement enfoncé)
        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.35, 0.02),
          new THREE.MeshStandardMaterial({ 
            color: 0x0a0a0a,
            roughness: 0.1,
            metalness: 0.2,
            emissive: new THREE.Color(0x001122),
            emissiveIntensity: 0.3
          })
        );
        screen.position.z = 0.03;
        monitor.add(screen);

     

        // LED d'alimentation
        const powerLED = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, 0.015, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            emissive: new THREE.Color(0x00ff00),
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
          })
        );
        powerLED.position.set(0.15, -0.18, 0.041);
        powerLED.rotation.x = Math.PI / 2;
        monitor.add(powerLED);

       
        computer.add(monitor);

        // === CLAVIER ===
        const keyboard = new THREE.Group();

        // Corps du clavier
        const keyboardBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.03, 0.15),
          new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.7
          })
        );
        keyboard.add(keyboardBody);

        // Touches individuelles
        const keySize = 0.025;
        const keySpacing = 0.03;
        const startX = -0.18;
        const startZ = -0.05;

        // Rangées de touches
        const keyRows = [
          { keys: 13, offsetX: 0 }, // Rangée supérieure
          { keys: 12, offsetX: 0.015 }, // Rangée QWERTY
          { keys: 11, offsetX: 0.03 }, // Rangée ASDF
          { keys: 8, offsetX: 0.06 }  // Rangée inférieure
        ];

        keyRows.forEach((row, rowIndex) => {
          for (let i = 0; i < row.keys; i++) {
            const key = new THREE.Mesh(
              new THREE.BoxGeometry(keySize, 0.008, keySize),
              new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                roughness: 0.8
              })
            );
            key.position.set(
              startX + row.offsetX + i * keySpacing,
              0.02,
              startZ + rowIndex * keySpacing
            );
            keyboard.add(key);
          }
        });

        // Barre d'espace
        const spacebar = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.008, keySize),
          new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.8
          })
        );
        spacebar.position.set(0, 0.02, startZ + 4 * keySpacing);
        keyboard.add(spacebar);

        keyboard.position.set(0, -0.25, 0.1);
        computer.add(keyboard);

        // === SOURIS ===
        const mouse = new THREE.Group();

        // Corps de la souris
        const mouseBody = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.03, 0.08, 4, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.6
          })
        );
        mouseBody.rotation.x = Math.PI / 2;
        mouse.add(mouseBody);

        // Boutons de la souris
        const leftButton = new THREE.Mesh(
          new THREE.BoxGeometry(0.025, 0.04, 0.008),
          new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.7
          })
        );
        leftButton.position.set(-0.015, 0.025, -0.02);
        mouse.add(leftButton);

        const rightButton = new THREE.Mesh(
          new THREE.BoxGeometry(0.025, 0.04, 0.008),
          new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.7
          })
        );
        rightButton.position.set(0.015, 0.025, -0.02);
        mouse.add(rightButton);

        // Molette
        const scrollWheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            roughness: 0.8
          })
        );
        scrollWheel.position.set(0, 0.035, -0.01);
        scrollWheel.rotation.z = Math.PI / 2;
        mouse.add(scrollWheel);

        // LED optique (bas de la souris)
        const opticalLED = new THREE.Mesh(
          new THREE.CylinderGeometry(0.005, 0.005, 0.005, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: new THREE.Color(0xff0000),
            emissiveIntensity: 0.3
          })
        );
        opticalLED.position.set(0, -0.015, 0.02);
        opticalLED.rotation.x = Math.PI / 2;
        mouse.add(opticalLED);

        mouse.position.set(0.25, -0.25, 0.08);
        computer.add(mouse);

      

        // Positionnement et configuration finale
        computer.position.set(9.3, 1.2, -8);
        computer.rotation.y = Math.PI;
        makeInteractive(computer, 'lab-computer', 'security');
        scene.add(computer);
      };

      // Création d'une rangée de casiers
      const createLockerRow = () => {
        const lockerWidth = 1;
        const lockerPositions = [-6, -2, 2]; 

        lockerPositions.forEach((z, index) => {
          const locker = new THREE.Group();

          // Corps du casier
          const body = new THREE.Mesh(
            new THREE.BoxGeometry(lockerWidth, 2, 0.5),
            new THREE.MeshStandardMaterial({ 
              color: 0x666666,
              emissiveIntensity: index === 1 ? 0.1 : 0 
            })
          );
          locker.add(body);

          // Porte du casier
          const door = new THREE.Mesh(
            new THREE.BoxGeometry(lockerWidth - 0.05, 1.9, 0.05),
            new THREE.MeshStandardMaterial({ 
              color: 0x777777,
              emissiveIntensity: index === 1 ? 0.1 : 0
            })
          );
          door.position.z = 0.225;
          locker.add(door);

          // Poignée
          const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
          );
          handle.position.set(0.3, 0, 0.3);
          locker.add(handle);

          // Fentes de ventilation
          for (let i = 0; i < 3; i++) {
            const vent = new THREE.Mesh(
              new THREE.BoxGeometry(0.4, 0.02, 0.02),
              new THREE.MeshStandardMaterial({ color: 0x444444 })
            );
            vent.position.set(0, 0.5 - i * 0.2, 0.251);
            locker.add(vent);
          }

          // Seul le casier du milieu est interactif
          if (index === 1) {
            const keypad = new THREE.Mesh(
              new THREE.PlaneGeometry(0.2, 0.3),
              new THREE.MeshStandardMaterial({ color: 0x333333 })
            );
            keypad.position.set(0.35, 0, 0.251);
            locker.add(keypad);
            
            // Modification de la fonction makeInteractive pour ce casier spécifique
            makeInteractive(locker, 'secure-locker', 'code');
            
            // Réduire l'intensité de la surbrillance pour ce casier
            locker.traverse((child) => {
              if (child instanceof THREE.Mesh && !child.userData.isOutline) {
                const outlineMaterial = new THREE.MeshBasicMaterial({
                  color: 0xffffff,
                  transparent: true,
                  opacity: 0.15, 
                  side: THREE.BackSide
                });
                const outlineMesh = new THREE.Mesh(child.geometry, outlineMaterial);
                outlineMesh.scale.multiplyScalar(1.02); 
                outlineMesh.userData.isOutline = true;
                child.add(outlineMesh);

                if (child.material instanceof THREE.MeshStandardMaterial) {
                  child.material.emissive = new THREE.Color(0xffffff);
                  child.material.emissiveIntensity = 0.1; 
                }
              }
            });
          }

          // Positionner le casier contre le mur gauche
          locker.position.set(-9.7, 1, z);
          locker.rotation.y = Math.PI / 2;
          scene.add(locker);

          // Ajouter une boîte de collision
          collisionObjectsRef.current.push(new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 2, lockerWidth),
            new THREE.MeshBasicMaterial({ visible: false })
          ));
          const collision = collisionObjectsRef.current[collisionObjectsRef.current.length - 1];
          collision.position.set(-9.7, 1, z);
          collision.rotation.y = Math.PI / 2;
          scene.add(collision);
        });
      };

      // Exécution de la création des éléments
      createInteractiveMicroscope();
      createInteractiveBeakers();
      createPeriodicTable();
      createLabComputer();
      createLockerRow();
    };

    // Ajout des éléments interactifs à la scène
    createInteractiveElements();

    // Modification des contrôles pour QWERTY et de la vitesse
    const keyActions = {
      KeyW: () => moveStateRef.current.forward = true,
      ArrowUp: () => moveStateRef.current.forward = true,
      KeyS: () => moveStateRef.current.backward = true,
      ArrowDown: () => moveStateRef.current.backward = true,
      KeyA: () => moveStateRef.current.left = true,
      ArrowLeft: () => moveStateRef.current.left = true,
      KeyD: () => moveStateRef.current.right = true,
      ArrowRight: () => moveStateRef.current.right = true,
      KeyE: handleInteraction
    };

    const keyReleaseActions = {
      KeyW: () => moveStateRef.current.forward = false,
      ArrowUp: () => moveStateRef.current.backward = false,
      KeyS: () => moveStateRef.current.backward = false,
      ArrowDown: () => moveStateRef.current.forward = false,
      KeyA: () => moveStateRef.current.left = false,
      ArrowLeft: () => moveStateRef.current.left = false,
      KeyD: () => moveStateRef.current.right = false,
      ArrowRight: () => moveStateRef.current.right = false
    };

    // Gestion des événements
    handleResizeRef.current = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    handleKeyDownRef.current = (event: KeyboardEvent) => {
      const action = keyActions[event.code as keyof typeof keyActions];
      if (action) action();
    };

    handleKeyUpRef.current = (event: KeyboardEvent) => {
      const action = keyReleaseActions[event.code as keyof typeof keyReleaseActions];
      if (action) action();
    };

    handleClickRef.current = () => {
      if (controlsRef.current) {
        controlsRef.current.lock();
        handleInteraction();
      }
    };

    // Ajout des écouteurs d'événements
    if (handleResizeRef.current) window.addEventListener('resize', handleResizeRef.current);
    if (handleKeyDownRef.current) window.addEventListener('keydown', handleKeyDownRef.current);
    if (handleKeyUpRef.current) window.addEventListener('keyup', handleKeyUpRef.current);
    if (handleClickRef.current) window.addEventListener('click', handleClickRef.current);

    // Animation 
    let fpsLimit = 60;
    let fpsInterval = 1000 / fpsLimit;
    let then = performance.now();
    let lastRaycastTime = 0;
    
    const animate = () => {
      if (isDisposedRef.current) return;
      
      const now = performance.now();
      const elapsed = now - then;

      // Limiter le taux de rafraîchissement pour économiser les ressources
      if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        
        movePlayer();
        
        //raycasting - seulement 10 fois par seconde
        if (now - lastRaycastTime > 100) { // 100ms = 10 fois/seconde
          updateInteractiveHighlight();
          lastRaycastTime = now;
        }
        
        if (rendererRef.current && cameraRef.current && sceneRef.current) {
          //  utiliser un viewport plus petit si nécessaire
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Création des meubles scientifiques
    const createLabFurniture = () => {
      // Création d'une étagère avec équipements 
      const createEquipmentShelf = (position: THREE.Vector3, rotation: number) => {
        const shelf = new THREE.Group();

        // Structure de l'étagère avec géométrie partagée
        const frame = new THREE.Mesh(
          sharedGeometries.box.clone().scale(2, 2, 0.4),
          sharedMaterials.metal
        );
        shelf.add(frame);

        // Matériaux pré-définis pour les équipements
        const equipMaterials = [
          sharedMaterials.glassClear,
          new THREE.MeshStandardMaterial({ color: 0x885555, opacity: 0.8, transparent: true }),
          sharedMaterials.metalDark
        ];

        // Étagères horizontales
        for (let y = 0; y < 3; y++) {
          const board = new THREE.Mesh(
            sharedGeometries.box.clone().scale(2, 0.05, 0.4),
            sharedMaterials.metal
          );
          board.position.y = -1 + y * 0.8; 
          shelf.add(board);

          //  nombre d'équipements par étagère
          for (let x = -0.6; x <= 0.6; x += 0.6) { 
            const equipmentType = Math.floor(Math.random() * 3);
            let equipment;

            switch (equipmentType) {
              case 0: // Tube à essai
                equipment = new THREE.Mesh(
                  sharedGeometries.smallCylinder.clone().scale(0.03, 0.2, 0.03),
                  equipMaterials[0]
                );
                break;
              case 1: // Flacon
                equipment = new THREE.Mesh(
                  sharedGeometries.smallCylinder.clone().scale(0.05, 0.15, 0.05),
                  equipMaterials[1]
                );
                break;
              case 2: // Boîte de Petri
                equipment = new THREE.Mesh(
                  sharedGeometries.smallCylinder.clone().scale(0.08, 0.02, 0.08),
                  equipMaterials[2]
                );
                break;
            }

            if (equipment) {
              equipment.position.set(x, -0.8 + y * 0.8, 0.1);
              shelf.add(equipment);
            }
          }
        }

        shelf.position.copy(position);
        shelf.rotation.y = rotation;
        scene.add(shelf);

        // Ajouter une boîte de collision
        collisionObjectsRef.current.push(new THREE.Mesh(
          new THREE.BoxGeometry(2, 2, 0.4),
          new THREE.MeshBasicMaterial({ visible: false })
        ));
        const collision = collisionObjectsRef.current[collisionObjectsRef.current.length - 1];
        collision.position.copy(position);
        collision.rotation.copy(new THREE.Euler(0, rotation, 0));
        scene.add(collision);
      };

      // Création d'un établi avec instruments
      const createWorkbench = (position: THREE.Vector3, rotation: number) => {
        const workbench = new THREE.Group();

        // Surface de travail
        const surface = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.05, 0.8),
          new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        workbench.add(surface);

        // Pieds
        const legGeometry = new THREE.BoxGeometry(0.08, 0.9, 0.08);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        [-0.8, 0.8].forEach(x => {
          [-0.3, 0.3].forEach(z => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x, -0.45, z);
            workbench.add(leg);
          });
        });

        // Instruments sur l'établi 
        const instruments = [
          { 
            isBox: true,
            scale: new THREE.Vector3(0.3, 0.2, 0.2),
            position: new THREE.Vector3(-0.6, 0.1, 0),
            material: sharedMaterials.metal,
            name: 'spectrometre'
          },
          {
            isBox: false,
            scale: new THREE.Vector3(0.1, 0.25, 0.1),
            position: new THREE.Vector3(0, 0.1, 0),
            material: sharedMaterials.metalDark,
            name: 'centrifugeuse'
          },
          {
            isBox: true,
            scale: new THREE.Vector3(0.25, 0.15, 0.2),
            position: new THREE.Vector3(0.6, 0.1, 0),
            material: sharedMaterials.metalDark,
            name: 'balance'
          }
        ];

        instruments.forEach(inst => {
          const geometry = inst.isBox ? 
            sharedGeometries.box.clone().scale(inst.scale.x, inst.scale.y, inst.scale.z) :
            sharedGeometries.smallCylinder.clone().scale(inst.scale.x, inst.scale.y, inst.scale.z);
          
          const instrument = new THREE.Mesh(geometry, inst.material);
          instrument.position.copy(inst.position);
          makeInteractive(instrument, inst.name, 'equipment');
          workbench.add(instrument);
        });

        workbench.position.copy(position);
        workbench.rotation.y = rotation;
        scene.add(workbench);

        // Ajouter une boîte de collision
        collisionObjectsRef.current.push(new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 1, 0.8),
          new THREE.MeshBasicMaterial({ visible: false })
        ));
        const collision = collisionObjectsRef.current[collisionObjectsRef.current.length - 1];
        collision.position.copy(position);
        collision.rotation.copy(new THREE.Euler(0, rotation, 0));
        scene.add(collision);
      };

      // Création d'une hotte aspirante
      const createFumeHood = (position: THREE.Vector3, rotation: number) => {
        const fumeHood = new THREE.Group();

        // Structure principale 
        const body = new THREE.Mesh(
          sharedGeometries.box.clone().scale(1.5, 2, 0.8),
          sharedMaterials.wall
        );
        fumeHood.add(body);

        // Vitre de protection 
        const glass = new THREE.Mesh(
          sharedGeometries.plane.clone().scale(1.4, 1, 1),
          sharedMaterials.glassClear
        );
        glass.position.set(0, 0.2, 0.4);
        glass.rotation.x = -Math.PI / 6;
        fumeHood.add(glass);

        // Surface de travail
        const workspace = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.05, 0.7),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        workspace.position.y = -0.5;
        fumeHood.add(workspace);

        fumeHood.position.copy(position);
        fumeHood.rotation.y = rotation;
        makeInteractive(fumeHood, 'fume-hood', 'equipment');
        scene.add(fumeHood);

        // Ajouter une boîte de collision
        collisionObjectsRef.current.push(new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 2, 0.8),
          new THREE.MeshBasicMaterial({ visible: false })
        ));
        const collision = collisionObjectsRef.current[collisionObjectsRef.current.length - 1];
        collision.position.copy(position);
        collision.rotation.copy(new THREE.Euler(0, rotation, 0));
        scene.add(collision);
      };

      // Placement des meubles
      // Mur gauche
      createEquipmentShelf(new THREE.Vector3(-9.7, 1, -5), Math.PI / 2);
      createWorkbench(new THREE.Vector3(-9.7, 0.45, 0), Math.PI / 2);
      createEquipmentShelf(new THREE.Vector3(-9.7, 1, 5), Math.PI / 2);

      // Mur droit
      createFumeHood(new THREE.Vector3(9.7, 1, -5), -Math.PI / 2);
      createWorkbench(new THREE.Vector3(9.7, 0.45, 0), -Math.PI / 2);
      createEquipmentShelf(new THREE.Vector3(9.7, 1, 5), Math.PI / 2);

      // Mur du fond
      createWorkbench(new THREE.Vector3(-3, 0.45, 9.7), Math.PI);
      createFumeHood(new THREE.Vector3(3, 1, 9.7), Math.PI);
    };

    // Appel de la création des meubles après la création du laboratoire
    createLabFurniture();

    // Nettoyage optimisé des ressources
    return () => {
      // Annuler l'animation en cours
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Supprimer les event listeners
      if (handleKeyDownRef.current) window.removeEventListener('keydown', handleKeyDownRef.current);
      if (handleKeyUpRef.current) window.removeEventListener('keyup', handleKeyUpRef.current);
      if (handleClickRef.current) window.removeEventListener('click', handleClickRef.current);

      // Nettoyage du renderer
      if (rendererRef.current && mountRef.current) {
        try {
          mountRef.current.removeChild(rendererRef.current.domElement);
          rendererRef.current.dispose();
        } catch (error) {
          console.warn('Erreur lors du nettoyage du renderer:', error);
        }
      }

      // Nettoyage des ressources Three.js
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (object.material instanceof THREE.Material) {
                object.material.dispose();
              } else if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              }
            }
          }
        });
      }

      // Nettoyage optimisé des géométries et matériaux partagés
      Object.values(sharedGeometries).forEach(geometry => {
        if (geometry && typeof geometry.dispose === 'function') {
          geometry.dispose();
        }
      });
      Object.values(sharedMaterials).forEach(material => {
        if (material && typeof material.dispose === 'function') {
          material.dispose();
        }
      });

      // Réinitialiser les refs
      collisionObjectsRef.current = [];
      isDisposedRef.current = true;
      isInitializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initRenderer, onInteract, onUpdateGameState]);

  // Effet principal pour l'initialisation de la scène
  useEffect(() => {
    if (!mountRef.current || !isMountedRef.current || isDisposedRef.current) {
      return;
    }

    if (isInitializedRef.current) {
      return;
    }

    initScene();
  }, [initScene]);

  // Gérer la soumission du code
  const handleCodeSubmit = useCallback(async (code: string) => {
    try {
      // Valider le code via l'API - le serveur gère les tentatives
      const validationResult = await gameApi.validateCode('computer-code', code);

      if (validationResult.correct) {
        // Donner les points pour le code correct
        onInteract('computer-code', 'security', 'enterCode', { isCorrect: true });
        
        labStateRef.current.isComputerUnlocked = true;
        labStateRef.current.isLockerUnlocked = true;
        onUpdateGameState({ computerUnlocked: true });
        
        // Donner la clé en cristal
        onInteract('crystal-key', 'key', 'add_key_to_inventory');
        
       
        onInteract('computer-message', 'notification', 'display', 'Code correct ! Accès système autorisé.');
        onInteract('computer-message', 'notification', 'display', 'Déverrouillage du casier sécurisé en cours...');
        setTimeout(() => {
          onInteract('computer-message', 'notification', 'display', 'Le casier sécurisé est maintenant déverrouillé ! Vous pouvez maintenant l\'examiner pour découvrir ce qu\'il cache.');
        }, 2000);
      } else {
        // Donner les points pour le code incorrect - le serveur gère les pénalités
        onInteract('computer-code', 'security', 'enterCode', { isCorrect: false });
        
        
        const errorMessage = validationResult.message || 'Code incorrect';
        setCodeErrorMessage(errorMessage);
        setTimeout(() => setCodeErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la validation du code:', error);
      setCodeErrorMessage('Erreur de connexion - Connexion serveur requise');
      setTimeout(() => setCodeErrorMessage(''), 3000);
    }
    setShowCodeInput(false);
  }, [onInteract, onUpdateGameState]);

  return (
    <>
      <div
        ref={mountRef}
        className="laboratoire-scene-container"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <div className="laboratoire-crosshair">
        <div className="laboratoire-crosshair-vertical" />
        <div className="laboratoire-crosshair-horizontal" />
      </div>
      {showCodeInput && (
        <CodeInput
          onSubmit={handleCodeSubmit}
          onClose={() => setShowCodeInput(false)}
        />
      )}
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
    </>
  );
}, (prevProps, nextProps) => {
  // Optimisation des re-rendus
  return (
    prevProps.periodicTableUnlocked === nextProps.periodicTableUnlocked &&
    prevProps.onInteract === nextProps.onInteract &&
    prevProps.onUpdateGameState === nextProps.onUpdateGameState
  );
});

export default LaboratoireScene; 