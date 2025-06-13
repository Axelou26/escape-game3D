import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GameState } from '../../../types/gameState';
import './SecretChamber3D.css';
import { CodeInput } from '../../ui/CodeInput/CodeInput';
import { SuccessMessage } from '../../ui/SuccessMessage/SuccessMessage';
import { useNavigate } from 'react-router-dom';
import { handlePointerLockErrors } from '../../../utils/errorHandler';
import { gameApi } from '../../../services/gameApi';



// Déclaration de type personnalisée pour corriger l'erreur TypeScript
declare module 'three/examples/jsm/controls/PointerLockControls' {
  interface PointerLockControls {
    connect(): void;
  }
}

interface SecretChamber3DProps {
  onInteract?: (objectId: string, objectType: string, action?: string, data?: any) => void;
  onUpdateGameState?: (updates: Partial<GameState>) => void;
  onEndGame?: () => Promise<void>;
}

export const SecretChamber3D: React.FC<SecretChamber3DProps> = ({ onInteract, onUpdateGameState, onEndGame }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<PointerLockControls | null>(null);
  const moveStateRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number>();
  const isInitializedRef = useRef(false);
  const isDisposedRef = useRef(false);
  const isMountedRef = useRef(false);
  const handleResizeRef = useRef<(() => void) | null>(null);
  const handleKeyDownRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  const handleKeyUpRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  const handleClickRef = useRef<(() => void) | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [artifactUnlocked, setArtifactUnlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Ajouter une ref pour l'état de l'énigme
  const riddleStateRef = useRef({
    isCollected: false,
    mirrorRiddleCollected: false,
    bookRiddleCollected: false,
    sunRiddleCollected: false
  });

  const gameStateRef = useRef<GameState>({
    score: 1000,
    elapsedTime: 0,
    currentRoom: 'secret-chamber',
    inventory: [],
    microscopeEnigmeResolved: false,
    periodicTableUnlocked: false,
    unlockedRooms: [],
    computerUnlocked: false,
    gameCompleted: false,
    artifactUnlocked: false
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const navigate = useNavigate();

  const lastFrameTimeRef = useRef<number>(0);

  // Ajouter les références pour les matériaux et géométries partagés
  const sharedMaterials = useMemo(() => ({
    floorMaterial: new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    }),
    wallMaterial: new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.BackSide
    })
  }), []);

  const sharedGeometries = useMemo(() => ({
    floorGeometry: new THREE.CircleGeometry(10, 32),
    wallGeometry: new THREE.CylinderGeometry(10, 10, 4, 32, 1, true)
  }), []);

  const makeInteractive = useCallback((object: THREE.Object3D, id: string, type: string) => {
    object.userData.interactive = true;
    object.userData.id = id;
    object.userData.type = type;
  }, []);

  const createSunSymbol = useCallback(() => {
    if (!sceneRef.current) return;

    const sunGroup = new THREE.Group();

    // Cercle central
    const centerGeometry = new THREE.CircleGeometry(0.4, 32);
    const centerMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x332200,
      emissiveIntensity: 0.2
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    sunGroup.add(center);

    // Rayons du soleil
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const rayGeometry = new THREE.PlaneGeometry(0.2, 0.6);
      const ray = new THREE.Mesh(rayGeometry, centerMaterial);
      ray.position.set(
        Math.cos(angle) * 0.6,
        Math.sin(angle) * 0.6,
        0
      );
      ray.rotation.z = angle + Math.PI / 2;
      sunGroup.add(ray);
    }

    // Position et orientation
    sunGroup.position.set(5.2, 2.5, -8.2);
    sunGroup.rotation.y = -Math.PI / 4;

    makeInteractive(sunGroup, 'sun-symbol', 'symbol');
    sceneRef.current.add(sunGroup);
  }, [makeInteractive]);

  const handleObjectInteraction = useCallback((id: string, type: string) => {
    if (!riddleStateRef.current) return;

    switch (id) {
      case 'ancient-book': {
        if (!riddleStateRef.current.bookRiddleCollected) {
          onInteract?.(id, 'ancient-book', 'add_to_inventory');
          riddleStateRef.current.bookRiddleCollected = true;
        } else {
          onInteract?.('book-riddle-message', 'message', 'examine', 'Vous avez déjà récupéré l\'énigme de ce livre.');
        }
        break;
      }
      case 'shadow-riddle-symbol': {
        if (!riddleStateRef.current.isCollected) {
          onInteract?.(id, type, 'add_to_inventory');
          onInteract?.('shadow-riddle-message', 'message', 'examine', 'Une énigme mystérieuse est apparue sur le symbole ! Elle a été ajoutée à votre inventaire.');
          riddleStateRef.current.isCollected = true;
        } else {
          onInteract?.('shadow-riddle-message', 'message', 'examine', 'Vous avez déjà récupéré l\'énigme de ce symbole.');
        }
        break;
      }
      case 'mirror-riddle-glyph': {
        if (!riddleStateRef.current.mirrorRiddleCollected) {
          onInteract?.(id, type, 'add_to_inventory');
          onInteract?.('mirror-riddle-message', 'message', 'examine', 'Une énigme est apparue dans les hiéroglyphes ! Elle a été ajoutée à votre inventaire.');
          riddleStateRef.current.mirrorRiddleCollected = true;
        } else {
          onInteract?.('mirror-riddle-message', 'message', 'examine', 'Vous avez déjà récupéré l\'énigme de ces hiéroglyphes.');
        }
        break;
      }
      case 'sun-symbol': {
        if (!riddleStateRef.current.sunRiddleCollected) {
          onInteract?.(id, 'sun-symbol', 'add_to_inventory');
          riddleStateRef.current.sunRiddleCollected = true;
        } else {
          onInteract?.('sun-riddle-message', 'message', 'examine', 'Vous avez déjà récupéré l\'énigme de ce symbole solaire.');
        }
        break;
      }
      case 'sacred-artifact':
        if (!artifactUnlocked) {
          setShowCodeInput(true);
          if (controlsRef.current) {
            controlsRef.current.unlock();
          }
        } else {
          onInteract?.('artifact-message', 'message', 'examine', 'L\'artéfact a déjà été déverrouillé.');
        }
        break;
    }
  }, [onInteract, artifactUnlocked]);

  const handleCodeSubmit = useCallback(async (code: string) => {
    try {
      // Valider le code via l'API backend
      const result = await gameApi.validateCode('final-code', code);
      
      if (result.correct) {
        // Code correct : +200 points et arrêt du jeu
        onInteract?.('final-code', 'security', 'enterCode', { isCorrect: true, isGameComplete: true });
        
        setArtifactUnlocked(true);
        setShowCodeInput(false);
        setShowSuccessMessage(true);
        if (onUpdateGameState) {
          const updates: Partial<GameState> = {
            artifactUnlocked: true,
            gameCompleted: true
          };
          onUpdateGameState(updates);
        }
      } else {
        // Code incorrect : -10 points
        onInteract?.('final-code', 'security', 'enterCode', { isCorrect: false });
        setErrorMessage('Code incorrect');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la validation du code final:', error);
      setErrorMessage('Erreur de connexion');
      setTimeout(() => setErrorMessage(''), 3000);
    }
    
    if (controlsRef.current) {
      controlsRef.current.lock();
    }
  }, [onInteract, onUpdateGameState]);

  const handleSuccessClose = useCallback(async () => {
    setShowSuccessMessage(false);
    
    // Sauvegarder le score final avant de naviguer
    try {
      if (onEndGame) {
        await onEndGame();
      }
      navigate('/leaderboard');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du score final:', error);
      // Naviguer quand même vers le leaderboard
      navigate('/leaderboard');
    }
  }, [navigate, onEndGame]);

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

      if (object && object.userData && object.userData.interactive) {
        const { id, type } = object.userData;
        handleObjectInteraction(id, type);
      }
    }
  }, [handleObjectInteraction]);

  const movePlayer = useCallback((x: number, z: number) => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const sideways = new THREE.Vector3(-direction.z, 0, direction.x);
    const currentPosition = camera.position.clone();
    const newPosition = currentPosition.clone();

    if (x !== 0) {
      newPosition.add(sideways.multiplyScalar(x));
    }
    if (z !== 0) {
      newPosition.add(direction.multiplyScalar(z));
    }

    // Limiter la position du joueur aux murs de la salle
    const radius = 9.5;
    const positionCheck = newPosition.clone();
    positionCheck.y = 0;
    if (positionCheck.length() > radius) {
      return;
    }

    // Appliquer la nouvelle position
    camera.position.copy(newPosition);
    camera.position.y = 2.5; // Hauteur fixe du joueur
  }, []);

  const updateInteractiveHighlight = useCallback(() => {
    if (!cameraRef.current || !sceneRef.current) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    // Réinitialiser tous les objets interactifs
    sceneRef.current.traverse((object) => {
      if (object.userData.interactive) {
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.emissiveIntensity = 0.2;
              child.material.emissive.setHex(0x000000);
            }
          }
        });
      }
    });

    // Mettre en surbrillance l'objet visé
    for (const intersect of intersects) {
      let object: THREE.Object3D | null = intersect.object;
      while (object && !object.userData.interactive) {
        object = object.parent;
      }

      if (object?.userData.interactive) {
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.emissiveIntensity = 0.5;
              child.material.emissive.setHex(0xffffff);
            }
          }
        });
        break;
      }
    }
  }, []);

  const initRenderer = useCallback(() => {
    if (!mountRef.current || !document.body.contains(mountRef.current) || !isMountedRef.current) {
      console.error("Le div de montage n'est pas disponible ou pas attaché au DOM pour l'initialisation du renderer.");
      return null;
    }

    try {
          if (rendererRef.current) {
      return rendererRef.current;
    }

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      mountRef.current.appendChild(renderer.domElement);
      return renderer;
    } catch (error) {
      console.error("Erreur explicite lors de la création de WebGLRenderer:", error);
      return null;
    }
  }, []);

  const initScene = useCallback(() => {
    if (!mountRef.current || !isMountedRef.current || isDisposedRef.current) {
      console.error("Le composant n'est pas monté correctement ou a été disposé");
      return;
    }

    if (isInitializedRef.current) {
      
      return;
    }

    isInitializedRef.current = true;
    isDisposedRef.current = false;
    

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);

    // Sol et murs avec matériaux partagés
    const mainFloor = new THREE.Mesh(sharedGeometries.floorGeometry, sharedMaterials.floorMaterial);
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.position.y = -0.1;
    mainFloor.receiveShadow = true;
    scene.add(mainFloor);

    const mainWall = new THREE.Mesh(sharedGeometries.wallGeometry, sharedMaterials.wallMaterial);
    mainWall.position.y = 2;
    mainWall.receiveShadow = true;
    scene.add(mainWall);

    // Plafond
    const ceilingGeometry = new THREE.CircleGeometry(10, 32);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.DoubleSide
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 5;
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    // Configuration de la caméra
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2.5, 5);
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

    // Garder une référence au mountRef.current pour le nettoyage
    const mountElement = mountRef.current;

    // Sol circulaire
    const floorGeometry = new THREE.CircleGeometry(10, 32);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Mur circulaire
    const wallGeometry = new THREE.CylinderGeometry(10, 10, 4, 32, 1, true);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.BackSide
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = 2;
    wall.receiveShadow = true;
    scene.add(wall);

    // Hiéroglyphes sur les murs
    const createHieroglyphs = () => {
      const segments = 16;
      const angleStep = (Math.PI * 2) / segments;
      
      // Création des hiéroglyphes standards sur les murs
      for (let i = 0; i < segments; i++) {
        const angle = i * angleStep;
        const x = Math.cos(angle) * 9.9;
        const z = Math.sin(angle) * 9.9;

        const glyphGeometry = new THREE.PlaneGeometry(1.2, 0.8);
        const glyphMaterial = new THREE.MeshStandardMaterial({
          color: 0x3D2B1F,
          roughness: 1,
          metalness: 0,
          emissive: 0x000000
        });
        const glyph = new THREE.Mesh(glyphGeometry, glyphMaterial);
        glyph.position.set(x, 2, z);
        glyph.lookAt(0, 2, 0);
        scene.add(glyph);
      }

      // Création du hiéroglyphe spécial interactif
      const specialGlyphGeometry = new THREE.PlaneGeometry(1.2, 0.8);
      const specialGlyphMaterial = new THREE.MeshStandardMaterial({
        color: 0x3D2B1F,
        roughness: 0.9,
        metalness: 0.1,
        emissive: 0x110805,
        emissiveIntensity: 0.2
      });
      const specialGlyph = new THREE.Mesh(specialGlyphGeometry, specialGlyphMaterial);
      
      // Position du hiéroglyphe spécial
      specialGlyph.position.set(-9.1, 2, -3.8);
      specialGlyph.lookAt(0, 1.8, 0);
      
      makeInteractive(specialGlyph, 'mirror-riddle-glyph', 'riddle');
      scene.add(specialGlyph);
    };

    // Vitrine avec l'artéfact
    const createArtifactCase = () => {
      const caseGroup = new THREE.Group();

      // Base
      const baseGeometry = new THREE.CylinderGeometry(0.8, 1, 0.2, 8);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0xB87333,
        roughness: 0.3,
        metalness: 0.8
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      caseGroup.add(base);

      // Vitrine en verre
      const glassGeometry = new THREE.CylinderGeometry(0.7, 0.7, 1.5, 16, 1, false);
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
        roughness: 0,
        metalness: 0.2,
        clearcoat: 1
      });
      const glass = new THREE.Mesh(glassGeometry, glassMaterial);
      glass.position.y = 0.85;
      caseGroup.add(glass);

      // Couvercle supérieur
      const topGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 8);
      const topMaterial = new THREE.MeshStandardMaterial({
        color: 0xB87333,
        roughness: 0.3,
        metalness: 0.8
      });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.y = 1.6;
      caseGroup.add(top);

      // Détails décoratifs sur le couvercle
      const ringGeometry = new THREE.TorusGeometry(0.6, 0.05, 8, 24);
      const ring = new THREE.Mesh(ringGeometry, topMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 1.65;
      caseGroup.add(ring);

      // Artéfact (une sorte d'amulette)
      const artifactGroup = new THREE.Group();
      
      // Corps de l'amulette
      const amuletGeometry = new THREE.TorusGeometry(0.2, 0.05, 16, 100);
      const amuletMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        roughness: 0.3,
        metalness: 0.8
      });
      const amulet = new THREE.Mesh(amuletGeometry, amuletMaterial);
      artifactGroup.add(amulet);

      // Symboles sur l'amulette
      const symbolsGeometry = new THREE.TorusGeometry(0.15, 0.02, 16, 8);
      const symbols = new THREE.Mesh(symbolsGeometry, amuletMaterial);
      symbols.rotation.x = Math.PI / 4;
      artifactGroup.add(symbols);

      artifactGroup.position.y = 0.85;
      makeInteractive(artifactGroup, 'sacred-artifact', 'artifact');
      caseGroup.add(artifactGroup);

      caseGroup.position.set(5, 0, 0);
      scene.add(caseGroup);
    };

    // Piédestal pour l'artéfact
    const createPedestal = () => {
      const pedestalGroup = new THREE.Group();

      // Base du piédestal
      const baseGeometry = new THREE.CylinderGeometry(1, 1.2, 0.3, 8);
      const pedestalMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.7,
        metalness: 0.3
      });
      const base = new THREE.Mesh(baseGeometry, pedestalMaterial);
      pedestalGroup.add(base);

      // Colonne
      const columnGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8);
      const column = new THREE.Mesh(columnGeometry, pedestalMaterial);
      column.position.y = 0.9;
      pedestalGroup.add(column);

      // Plateau supérieur
      const topGeometry = new THREE.CylinderGeometry(0.8, 0.6, 0.2, 8);
      const top = new THREE.Mesh(topGeometry, pedestalMaterial);
      top.position.y = 1.75;
      pedestalGroup.add(top);

      // Symboles gravés
      const symbolsGeometry = new THREE.RingGeometry(0.3, 0.4, 16);
      const symbolsMaterial = new THREE.MeshStandardMaterial({
        color: 0x3D2B1F,
        roughness: 1,
        metalness: 0
      });
      const symbols = new THREE.Mesh(symbolsGeometry, symbolsMaterial);
      symbols.rotation.x = -Math.PI / 2;
      symbols.position.y = 1.86;
      pedestalGroup.add(symbols);

      // Ajout du livre mystérieux
      const bookGroup = new THREE.Group();
      
      // Corps du livre
      const bookGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.3);
      const bookMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.9,
        metalness: 0.1,
        emissive: 0x110805,
        emissiveIntensity: 0.2
      });
      const book = new THREE.Mesh(bookGeometry, bookMaterial);
      book.position.y = 1.9;
      makeInteractive(book, 'ancient-book', 'book');
      bookGroup.add(book);

      // Couverture avec des détails dorés
      const coverGeometry = new THREE.BoxGeometry(0.42, 0.06, 0.32);
      const coverMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A0404, // Rouge foncé
        roughness: 0.7,
        metalness: 0.3,
        emissive: 0x1a0000
      });
      const cover = new THREE.Mesh(coverGeometry, coverMaterial);
      cover.position.y = 1.9;
      bookGroup.add(cover);

      // Symboles dorés sur la couverture
      const symbolsBookGeometry = new THREE.PlaneGeometry(0.3, 0.2);
      const symbolsBookMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700, // Or
        roughness: 0.3,
        metalness: 0.8,
        emissive: 0x332200
      });
      const symbolsBook = new THREE.Mesh(symbolsBookGeometry, symbolsBookMaterial);
      symbolsBook.rotation.x = -Math.PI / 2;
      symbolsBook.position.set(0, 1.93, 0);
      bookGroup.add(symbolsBook);

      // Rendre le livre interactif
      makeInteractive(bookGroup, 'ancient-book', 'book');
      pedestalGroup.add(bookGroup);

      pedestalGroup.position.set(-5, 0, 0);

      scene.add(pedestalGroup);
    };

    // Créer les torches animées
    const createTorch = (position: THREE.Vector3) => {
      const torchGroup = new THREE.Group();

      // Support de la torche
      const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
      const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3c2b,
        roughness: 0.8,
        metalness: 0.2
      });
      const handle = new THREE.Mesh(handleGeometry, handleMaterial);
      handle.position.z = 0.25; // Déplacer le manche vers l'avant
      handle.position.y = 0.25; // Monter le manche
      torchGroup.add(handle);

     

      // Feu de la torche (lumière)
      const fireLight = new THREE.PointLight(0xff6600, 4, 5);
      fireLight.position.z = 0.25; 
      fireLight.position.y = 0.5; 
      torchGroup.add(fireLight);

      // Effet de particules de feu
      const fireGeometry = new THREE.SphereGeometry(0.12, 8, 8);
      const fireMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        transparent: true,
        opacity: 0.7
      });
      const fire = new THREE.Mesh(fireGeometry, fireMaterial);
      fire.position.z = 0.25; 
      fire.position.y = 0.5; 
      torchGroup.add(fire);

      torchGroup.position.copy(position);
      return torchGroup;
    };

    const addMysticElements = () => {
      // Ajouter les torches sur les murs
      const torchPositions = [
        // Torches principales aux points cardinaux
        { pos: new THREE.Vector3(9.5, 2.5, 0), rot: Math.PI / 2 },
        { pos: new THREE.Vector3(-9.5, 2.5, 0), rot: -Math.PI / 2 },
        { pos: new THREE.Vector3(0, 2.5, 9.5), rot: Math.PI },
        { pos: new THREE.Vector3(6.7, 2.5, 6.7), rot: Math.PI * 3/4 },
        { pos: new THREE.Vector3(-6.7, 2.5, 6.7), rot: Math.PI * 5/4 },
        { pos: new THREE.Vector3(6.7, 2.5, -6.7), rot: Math.PI / 4 },
        { pos: new THREE.Vector3(-6.7, 2.5, -6.7), rot: -Math.PI / 4 }
      ];
      torchPositions.forEach(({ pos, rot }) => {
        const torch = createTorch(pos);
        torch.rotation.y = rot; 
        scene.add(torch);
      });

    // Créer les symboles mystiques lumineux
    const createMysticSymbol = (position: THREE.Vector3, rotation: number, isInteractive: boolean) => {
      const symbolGroup = new THREE.Group();

      // Cercle extérieur
      const circleGeometry = new THREE.RingGeometry(0.4, 0.45, 32);
      const symbolMaterial = new THREE.MeshStandardMaterial({
        color: 0x6600cc,
        emissive: 0x3300cc,
        roughness: 0.5,
        metalness: 0.8,
        side: THREE.DoubleSide
      });
      const circle = new THREE.Mesh(circleGeometry, symbolMaterial);
      symbolGroup.add(circle);

      // Symboles intérieurs
      const innerSymbolGeometry = new THREE.PlaneGeometry(0.6, 0.6);
      const innerSymbol = new THREE.Mesh(innerSymbolGeometry, symbolMaterial);
      symbolGroup.add(innerSymbol);

      // Ajouter une lumière pour le faire briller
      const symbolLight = new THREE.PointLight(0x6600cc, 0.5, 2);
      symbolLight.position.z = 0.1;
      symbolGroup.add(symbolLight);

      symbolGroup.position.copy(position);
      symbolGroup.rotation.y = rotation;

      if (isInteractive) {
        makeInteractive(symbolGroup, 'shadow-riddle-symbol', 'riddle');
      }
      return symbolGroup;
    };

      // Ajouter les symboles mystiques répartis sur les murs
      const symbolPositions = [
        { pos: new THREE.Vector3(8.2, 2, 5), rot: Math.PI / 4, interactive: true },    // Mur droit - celui-ci sera interactif
        { pos: new THREE.Vector3(-8.5, 2, -4.8), rot: Math.PI / 4, interactive: false }, // Mur gauche
        { pos: new THREE.Vector3(-2, 2, 9.5), rot: Math.PI, interactive: false }         // Mur du fond
      ];
      symbolPositions.forEach(({ pos, rot, interactive }) => {
        const symbol = createMysticSymbol(pos, rot, interactive);
        scene.add(symbol);
      });

    // Créer la porte secrète
    const createSecretDoor = () => {
      const doorGroup = new THREE.Group();

      // Cadre de la porte
      const frameGeometry = new THREE.BoxGeometry(2, 3, 0.2);
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.7,
        metalness: 0.3
      });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      doorGroup.add(frame);

      // Porte elle-même
      const doorGeometry = new THREE.BoxGeometry(1.8, 2.8, 0.1);
      const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0.4
      });
      const door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.z = 0.05;
      doorGroup.add(door);

      // Symboles sur la porte
      const symbolsGeometry = new THREE.PlaneGeometry(1.5, 2.5);
      const symbolsMaterial = new THREE.MeshStandardMaterial({
        color: 0x3D2B1F,
        roughness: 1,
        metalness: 0,
        emissive: 0x1a0f0a
      });
      const symbols = new THREE.Mesh(symbolsGeometry, symbolsMaterial);
      symbols.position.z = 0.11;
      doorGroup.add(symbols);

      doorGroup.position.set(0, 1.5, -9.5);
      return doorGroup;
    };

   

      // Ajouter la porte secrète
      const secretDoor = createSecretDoor();
      scene.add(secretDoor);
    };

  

    // Créer une table d'alchimiste
    const createAlchemyTable = (position: THREE.Vector3, rotation: number) => {
      const tableGroup = new THREE.Group();

      // Table
      const tableGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.8);
      const tableMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a1810,
        roughness: 0.8,
        metalness: 0.2
      });
      const table = new THREE.Mesh(tableGeometry, tableMaterial);
      tableGroup.add(table);

      // Pieds de la table
      const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeometry, tableMaterial);
        leg.position.set(
          (i % 2 === 0 ? 0.6 : -0.6),
          -0.4,
          (i < 2 ? 0.3 : -0.3)
        );
        tableGroup.add(leg);
      }

      // Fioles et équipement d'alchimie
      const colors = [0x9933ff, 0x33ff99, 0xff3366];
      for (let i = 0; i < 3; i++) {
        // Fiole
        const bottleGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.2, 8);
        const bottleMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.6,
          roughness: 0,
          metalness: 0.2
        });
        const bottle = new THREE.Mesh(bottleGeometry, bottleMaterial);
        bottle.position.set(-0.5 + i * 0.4, 0.15, 0);

        // Liquide dans la fiole
        const liquidGeometry = new THREE.CylinderGeometry(0.04, 0.07, 0.1, 8);
        const liquidMaterial = new THREE.MeshPhysicalMaterial({
          color: colors[i],
          transparent: true,
          opacity: 0.8,
          roughness: 0.2
        });
        const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
        liquid.position.y = -0.05;
        bottle.add(liquid);

        // Lumière pour le liquide
        const bottleLight = new THREE.PointLight(colors[i], 0.5, 0.5);
        bottleLight.position.y = -0.05;
        bottle.add(bottleLight);

        tableGroup.add(bottle);
      }

      tableGroup.position.copy(position);
      tableGroup.rotation.y = rotation;
      return tableGroup;
    };

    // Créer un tapis mystique
    const createMysticCarpet = (position: THREE.Vector3) => {
      const carpetGroup = new THREE.Group();

      // Base du tapis
      const carpetGeometry = new THREE.CircleGeometry(1.5, 32);
      const carpetMaterial = new THREE.MeshStandardMaterial({
        color: 0x660033,
        roughness: 0.9,
        metalness: 0.1
      });
      const carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
      carpet.rotation.x = -Math.PI / 2;
      carpet.position.y = 0.01; // Légèrement au-dessus du sol

      // Motifs géométriques
      const patternGeometry = new THREE.RingGeometry(0.5, 1.3, 8);
      const patternMaterial = new THREE.MeshStandardMaterial({
        color: 0x993366,
        roughness: 0.8,
        metalness: 0.2
      });
      const pattern = new THREE.Mesh(patternGeometry, patternMaterial);
      pattern.rotation.x = -Math.PI / 2;
      pattern.position.y = 0.015;

      carpetGroup.add(carpet);
      carpetGroup.add(pattern);
      carpetGroup.position.copy(position);
      return carpetGroup;
    };

    // Créer les éléments de la salle
    createHieroglyphs();
    createArtifactCase();
    createPedestal();
    createSunSymbol();
    addMysticElements();

  

    const alchemyTable = createAlchemyTable(new THREE.Vector3(-3, 0.8, -8), 0);
    scene.add(alchemyTable);

    const carpet = createMysticCarpet(new THREE.Vector3(0, 0, 0));
    scene.add(carpet);

    // Éclairage mystique
    const ambientLight = new THREE.AmbientLight(0x666666, 0.8); // Lumière ambiante plus forte et plus claire
    scene.add(ambientLight);
    
    // Ajout d'une hémisphère light pour un éclairage plus naturel
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    scene.add(hemisphereLight);

    // Lumières focalisées
    const createFocusLight = (position: THREE.Vector3, target: THREE.Vector3, color: number = 0x3366ff) => {
      const light = new THREE.SpotLight(color, 2.0); // Intensité encore plus forte
      light.position.copy(position);
      light.target.position.copy(target);
      light.angle = Math.PI / 3; 
      light.penumbra = 0.8; 
      light.decay = 1.2; 
      light.distance = 25; 
      light.castShadow = true;
      scene.add(light);
      scene.add(light.target);
      return light;
    };

    // Lumières principales
    createFocusLight(
      new THREE.Vector3(5, 4, 0),
      new THREE.Vector3(5, 0, 0),
      0x6600cc
    );
    createFocusLight(
      new THREE.Vector3(-5, 4, 0),
      new THREE.Vector3(-5, 0, 0),
      0x3366ff
    );

    // Lumières supplémentaires pour plus d'éclairage
    createFocusLight(
      new THREE.Vector3(0, 4, 5),
      new THREE.Vector3(0, 0, 5),
      0x4b0082
    );
    createFocusLight(
      new THREE.Vector3(0, 4, -5),
      new THREE.Vector3(0, 0, -5),
      0x800080
    );

    // Ajout de points de lumière doux près des murs
    const wallLights = [
      { pos: new THREE.Vector3(7, 2, 7), color: 0x2b0057 },
      { pos: new THREE.Vector3(-7, 2, 7), color: 0x2b0057 },
      { pos: new THREE.Vector3(7, 2, -7), color: 0x2b0057 },
      { pos: new THREE.Vector3(-7, 2, -7), color: 0x2b0057 }
    ];

    wallLights.forEach(({ pos, color }) => {
      const pointLight = new THREE.PointLight(color, 1.2, 12);
      pointLight.position.copy(pos);
      scene.add(pointLight);
    });

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
      switch (event.code) {
        case 'KeyS':
        case 'ArrowUp':
          moveStateRef.current.forward = true;
          break;
        case 'KeyW':
        case 'ArrowDown':
          moveStateRef.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          moveStateRef.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          moveStateRef.current.right = true;
          break;
        case 'KeyE':
          handleInteraction();
          break;
      }
    };

    handleKeyUpRef.current = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyS':
        case 'ArrowUp':
          moveStateRef.current.forward = false;
          break;
        case 'KeyW':
        case 'ArrowDown':
          moveStateRef.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          moveStateRef.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          moveStateRef.current.right = false;
          break;
      }
    };

    handleClickRef.current = () => {
      if (controlsRef.current) {
        controlsRef.current.lock();
      }
      handleInteraction();
    };

    // Ajout des écouteurs d'événements
    if (handleResizeRef.current) window.addEventListener('resize', handleResizeRef.current);
    if (handleKeyDownRef.current) window.addEventListener('keydown', handleKeyDownRef.current);
    if (handleKeyUpRef.current) window.addEventListener('keyup', handleKeyUpRef.current);
    if (handleClickRef.current) window.addEventListener('click', handleClickRef.current);

    // Animation
    const animate = () => {
      if (isDisposedRef.current) return;
      
      const now = performance.now();
      const deltaTime = now - (lastFrameTimeRef.current || now);
      lastFrameTimeRef.current = now;

      // Limiter le frame rate à environ 60 FPS
      if (deltaTime < 16.67) { // 1000ms / 60fps ≈ 16.67ms
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      if (controlsRef.current?.isLocked) {
        const speed = 0.15 * (deltaTime / 16.67); // Normaliser la vitesse par rapport au frame rate
        if (moveStateRef.current.forward) movePlayer(0, -speed);
        if (moveStateRef.current.backward) movePlayer(0, speed);
        if (moveStateRef.current.left) movePlayer(-speed, 0);
        if (moveStateRef.current.right) movePlayer(speed, 0);

        // Ne mettre à jour la surbrillance que si le joueur bouge
        if (Object.values(moveStateRef.current).some(value => value)) {
          updateInteractiveHighlight();
        }
      }

      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [sharedGeometries, sharedMaterials, initRenderer]);

  // Effet pour gérer le montage initial
  useEffect(() => {
    isMountedRef.current = true;
    isDisposedRef.current = false;
    

    return () => {
      console.log("Début du démontage du composant");
      
      //Marquer le composant comme en cours de démontage
      isMountedRef.current = false;
      
      //  Nettoyer les animations
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

      // Nettoyer Three.js
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
        if (mountRef.current?.contains(rendererRef.current.domElement)) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
        rendererRef.current = null;
      }

      //  Réinitialiser les autres refs
      cameraRef.current = null;
      controlsRef.current = null;

      //  Marquer comme complètement disposé
      isDisposedRef.current = true;
      isInitializedRef.current = false;

      // Dispose of shared materials and geometries
      Object.values(sharedMaterials).forEach(material => material.dispose());
      Object.values(sharedGeometries).forEach(geometry => geometry.dispose());

      console.log("Composant complètement démonté");
    };
  }, []);

  // Effet principal pour l'initialisation de la scène
  useEffect(() => {
    if (!mountRef.current || !isMountedRef.current || isDisposedRef.current) {
      console.log("Initialisation de la scène impossible : composant non monté ou déjà disposé");
      return;
    }

    if (isInitializedRef.current) {
      console.log("La scène est déjà initialisée");
      return;
    }

    console.log("Début de l'initialisation de la scène");
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) {
        console.log("Annulation de l'initialisation : composant démonté");
        return;
      }
      initScene();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [initRenderer, handleInteraction, movePlayer, updateInteractiveHighlight]);

  return (
    <>
      <div
        ref={mountRef}
        className="secret-chamber-container"
        style={{ width: '100%', height: '100%' }}
      /> 
      <div className="secret-chamber-crosshair">
        <div className="secret-chamber-crosshair-vertical" />
        <div className="secret-chamber-crosshair-horizontal" />
      </div>
      {showCodeInput && (
        <CodeInput 
          onSubmit={handleCodeSubmit}
          onClose={() => {
            setShowCodeInput(false);
            if (controlsRef.current) {
              controlsRef.current.lock();
            }
          }}
        />
      )}
      {showSuccessMessage && (
        <SuccessMessage onClose={handleSuccessClose} />
      )}
      {errorMessage && (
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
          {errorMessage}
        </div>
      )}
    </>
  );
};

export default SecretChamber3D; 