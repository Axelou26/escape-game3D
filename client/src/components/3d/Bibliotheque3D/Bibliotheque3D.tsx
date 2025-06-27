import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { handlePointerLockErrors } from '../../../utils/errorHandler';

// Fonction pour créer des géométries ultra-optimisées (réduction des segments pour les performances)
const createSharedGeometries = () => ({
  book: new THREE.BoxGeometry(0.3, 0.65, 0.8),
  shelf: new THREE.BoxGeometry(9, 2.8, 1.2),
  wall: new THREE.BoxGeometry(20, 5, 0.5),
  floor: new THREE.PlaneGeometry(20, 20, 1, 1), // Réduction des segments
  drawer: new THREE.BoxGeometry(0.55, 0.15, 0.05),
  chair: new THREE.BoxGeometry(0.6, 0.1, 0.6),
  table: new THREE.BoxGeometry(2.4, 0.08, 1.4),
  panel: new THREE.BoxGeometry(0.03, 0.8, 1.0),
  cylinder: new THREE.CylinderGeometry(0.04, 0.03, 0.4, 6), // Réduction de 8 à 6 segments
  sphere: new THREE.SphereGeometry(0.15, 8, 6), // Réduction de 10x10 à 8x6
  torus: new THREE.TorusGeometry(0.06, 0.015, 8, 16, Math.PI) // Réduction de 16 à 8 segments
});

// Fonction pour créer des matériaux ultra-optimisés (MeshLambertMaterial pour de meilleures performances)
const createSharedMaterials = () => ({
  darkWood: new THREE.MeshLambertMaterial({
    color: 0x2B1810
  }),
  veryDarkWood: new THREE.MeshLambertMaterial({
    color: 0x1A0F0A
  }),
  maroonLeather: new THREE.MeshLambertMaterial({
    color: 0x8B0000
  }),
  brass: new THREE.MeshLambertMaterial({
    color: 0xB87333
  }),
  gold: new THREE.MeshLambertMaterial({
    color: 0xDAA520,
    emissive: 0x332200 // Réduction de l'intensité émissive
  }),
  wallMaterial: new THREE.MeshLambertMaterial({
    color: 0x3B2506
  }),
  // Matériaux supplémentaires pour les livres (optimisés)
  bookMaterial1: new THREE.MeshLambertMaterial({ color: 0x3A2818 }),
  bookMaterial2: new THREE.MeshLambertMaterial({ color: 0x2D1B10 }),
  bookMaterial3: new THREE.MeshLambertMaterial({ color: 0x4A1515 }),
  bookMaterial4: new THREE.MeshLambertMaterial({ color: 0x1A2A1A }),
  bookMaterial5: new THREE.MeshLambertMaterial({ color: 0x1A1A2A })
});

interface Bibliotheque3DProps {
  onInteract: (objectId: string, objectType: string, action?: string) => void;
  isCodeValid?: boolean;
  isDrawerCodeValid?: boolean;
}

export const Bibliotheque3D: React.FC<Bibliotheque3DProps> = ({ onInteract, isCodeValid = false, isDrawerCodeValid = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<PointerLockControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const moveStateRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const sceneRef = useRef<THREE.Scene | null>(null);
  const collisionObjectsRef = useRef<THREE.Mesh[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastHoveredObject = useRef<THREE.Object3D | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mysteriousBookCreated = useRef<boolean>(false);
  const isCodeValidRef = useRef(isCodeValid);
  const isDrawerCodeValidRef = useRef(isDrawerCodeValid);
  
  // Ajout d'une ref pour éviter la recreation en boucle
  const isInitializedRef = useRef<boolean>(false);
  const isDisposedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(false);

  // Mettre à jour les refs à chaque changement des props
  useEffect(() => {
    isCodeValidRef.current = isCodeValid;
  }, [isCodeValid]);

  useEffect(() => {
    isDrawerCodeValidRef.current = isDrawerCodeValid;
  }, [isDrawerCodeValid]);

  // Optimisation avec useMemo pour la scène et la caméra
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000), []);

  // Fonction optimisée pour créer des objets interactifs avec surbrillance blanche
  const makeInteractive = (object: THREE.Object3D, id: string, type: string) => {
    object.userData.interactive = true;
    object.userData.id = id;
    object.userData.type = type;

    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff, // Blanc pour la surbrillance
      side: THREE.BackSide,
      transparent: true,
      opacity: 0, // Démarrer invisible, sera ajusté au survol
      depthTest: false, // Améliore la visibilité de la surbrillance
      depthWrite: false,
      blending: THREE.NormalBlending // Rendu normal pour contours plus doux
    });

    // Stocker les matériaux outline pour pouvoir les modifier plus tard
    object.userData.outlineMaterials = [];

    const processChild = (child: THREE.Object3D, parent: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const clonedOutlineMaterial = outlineMaterial.clone();
        const outlineMesh = new THREE.Mesh(child.geometry, clonedOutlineMaterial);
        
        // Contour fin et net - juste les bords
        outlineMesh.scale.multiplyScalar(1.015);
        outlineMesh.position.copy(child.position);
        outlineMesh.rotation.copy(child.rotation);
        outlineMesh.userData.isOutline = true; // Marquer comme contour
        
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
  };

  // Effet pour gérer le montage initial
  useEffect(() => {
    isMountedRef.current = true;
    isDisposedRef.current = false;
    
    // Réinitialiser toutes les refs au montage
    isInitializedRef.current = false;
    mysteriousBookCreated.current = false;
    frameIdRef.current = 0;
    frameCountRef.current = 0;
    lastTimeRef.current = 0;
    lastHoveredObject.current = null;
    collisionObjectsRef.current = [];

    return () => {
      isMountedRef.current = false;
      isDisposedRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current || !isMountedRef.current || isDisposedRef.current) return;

    // Si déjà initialisé, on ne recrée pas la scène
    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    // Créer les géométries et matériaux partagés pour cette instance
    const sharedGeometries = createSharedGeometries();
    const sharedMaterials = createSharedMaterials();

    // Initialisation de la scène
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a1a1a);

    // Configuration ultra-optimisée du renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      powerPreference: "high-performance",
      precision: "mediump",
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Réduction pour plus de FPS
    renderer.shadowMap.enabled = false; // Désactiver les ombres pour plus de performance
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Optimisations supplémentaires du renderer
    renderer.info.autoReset = false;
    renderer.sortObjects = false; // Désactiver le tri automatique
    renderer.autoClear = true;
    renderer.autoClearColor = true;
    renderer.autoClearDepth = true;
    renderer.autoClearStencil = false;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Configuration de la caméra
    camera.position.set(0, 1.6, 5);
    cameraRef.current = camera;

    // Configuration des contrôles
    const controls = new PointerLockControls(camera, document.body);
    handlePointerLockErrors(controls);
    controlsRef.current = controls;

    // Éclairage ultra-optimisé - minimal pour maximiser les FPS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Augmentation de l'éclairage ambiant
    scene.add(ambientLight);

    // Réduction drastique du nombre de lumières pour les performances
    const mainLights = [
      { pos: [0, 4, 0], intensity: 0.8, distance: 15 },
      { pos: [-8, 3, 0], intensity: 0.5, distance: 12 },
      { pos: [8, 3, 0], intensity: 0.5, distance: 12 }
    ];

    mainLights.forEach(light => {
      const pointLight = new THREE.PointLight(0xffffff, light.intensity, light.distance);
      pointLight.position.set(light.pos[0], light.pos[1], light.pos[2]);
      // Désactiver les ombres pour toutes les lumières
      pointLight.castShadow = false;
      scene.add(pointLight);
    });

    // Système de collision optimisé
    const createCollisionBox = (() => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ 
        visible: false,
        transparent: true,
        opacity: 0
      });

      return (width: number, height: number, depth: number, position: THREE.Vector3, rotation?: THREE.Euler) => {
        const collisionBox = new THREE.Mesh(geometry, material);
        collisionBox.scale.set(width, height, depth);
        collisionBox.position.copy(position);
        if (rotation) {
          collisionBox.rotation.copy(rotation);
        }
        collisionObjectsRef.current.push(collisionBox);
        scene.add(collisionBox);
      };
    })();

    // Détection de collision optimisée
    const checkCollision = (() => {
      const playerBoundingBox = new THREE.Box3();
      const objectBoundingBox = new THREE.Box3();
      const playerSize = new THREE.Vector3(0.6, 1.8, 0.6);

      return (position: THREE.Vector3): boolean => {
        playerBoundingBox.setFromCenterAndSize(position, playerSize);
        for (const object of collisionObjectsRef.current) {
          objectBoundingBox.setFromObject(object);
          if (playerBoundingBox.intersectsBox(objectBoundingBox)) {
            return true;
          }
        }
        return false;
      };
    })();

    // Système de mouvement optimisé
    const movePlayer = (() => {
      const movement = new THREE.Vector3();
      const direction = new THREE.Vector3();
      const sideways = new THREE.Vector3();
      const newPosition = new THREE.Vector3();

      return (deltaX: number, deltaZ: number) => {
        if (!cameraRef.current) return;

        const camera = cameraRef.current;
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        sideways.set(-direction.z, 0, direction.x);

        movement.set(0, 0, 0);
        movement.addScaledVector(direction, -deltaZ);
        movement.addScaledVector(sideways, deltaX);

        newPosition.copy(camera.position).add(movement);

        if (!checkCollision(newPosition)) {
          camera.position.copy(newPosition);
        }
      };
    })();

    // Gestion des événements optimisée
    const handleKeyDown = (event: KeyboardEvent) => {
      switch(event.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveStateRef.current.forward = true;
          break;
        case 'KeyS':
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

    const handleKeyUp = (event: KeyboardEvent) => {
      switch(event.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveStateRef.current.forward = false;
          break;
        case 'KeyS':
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

    const handleClick = () => {
      if (controlsRef.current) {
        controlsRef.current.lock();
      }
      handleInteraction();
    };

    // Animation ultra-optimisée pour maximiser les FPS
    const animate = (time: number) => {
      if (isDisposedRef.current) return;

      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      frameCountRef.current++;

      if (controlsRef.current?.isLocked) {
        const speed = 0.12 * Math.min(delta * 60, 2);

        if (moveStateRef.current.forward) movePlayer(0, -speed);
        if (moveStateRef.current.backward) movePlayer(0, speed);
        if (moveStateRef.current.left) movePlayer(-speed, 0);
        if (moveStateRef.current.right) movePlayer(speed, 0);

        // Raycasting optimisé - 1 frame sur 5 pour meilleure réactivité de la surbrillance
        if (frameCountRef.current % 5 === 0) {
          raycasterRef.current.setFromCamera(new THREE.Vector2(0, 0), camera);
          
          // Créer une liste réduite d'objets interactifs seulement
          const interactiveObjects: THREE.Object3D[] = [];
          scene.traverse((object) => {
            if (object.userData.interactive && !object.userData.collected && !object.userData.isOutline) {
              interactiveObjects.push(object);
            }
          });

          const intersects = raycasterRef.current.intersectObjects(interactiveObjects, true);

          // Réinitialiser l'objet précédemment survolé
          if (lastHoveredObject.current) {
            lastHoveredObject.current.userData.outlineMaterials?.forEach((material: THREE.Material) => {
              (material as THREE.MeshBasicMaterial).opacity = 0; // Masquer la surbrillance
            });
            lastHoveredObject.current = null;
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
                lastHoveredObject.current = object;
                
                // Contours blancs très fins et discrets pour les objets interactifs
                object.userData.outlineMaterials?.forEach((material: THREE.Material) => {
                  const outlineMaterial = material as THREE.MeshBasicMaterial;
                  outlineMaterial.opacity = 0.1; // 10% d'opacité pour contours très discrets
                  outlineMaterial.color.setHex(0xffffff); // Blanc pur
                });
              }
              break; // Prendre seulement le premier objet interactif trouvé
            }
          }
        }
      }

      // Render optimisé
      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    // Gestion du redimensionnement ultra-optimisée avec debounce
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!isDisposedRef.current && camera && renderer) {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
      }, 100); // Debounce de 100ms pour éviter les redimensionnements trop fréquents
    };

    // Ajout des événements
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    // Démarrage de l'animation
    frameIdRef.current = requestAnimationFrame(animate);

    // Gestion des interactions
    const handleInteraction = () => {
      if (!cameraRef.current || !sceneRef.current) return;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

      for (const intersect of intersects) {
        let object: THREE.Object3D | null = intersect.object;
        while (object && !object.userData.interactive) {
          object = object.parent;
        }
        if (object?.userData.interactive && !object.userData.collected) {
          switch (object.userData.id) {
            case 'laboratory-door':
              // Vérifier si le joueur a la clé du laboratoire dans son inventaire
              onInteract(object.userData.id, object.userData.type, isCodeValidRef.current ? 'enter_laboratory' : 'examine');
              break;
            case 'mysterious-book':
              if (object.userData.collected) {
                // Livre déjà collecté, ne rien faire
                return;
              }

              if (!mysteriousBookCreated.current) {
                // Livre pas encore créé, ne rien faire
                return;
              }

              // Protection contre double collection
              object.userData.collected = true;
              object.userData.interactive = false;
              
              // Appeler l'interaction AVANT de faire disparaître le livre
              onInteract('mysterious-book', 'book', 'add_to_inventory');
              
              // Retirer SEULEMENT le livre mystérieux de la scène
              if (object.parent) {
                // Vérifier que c'est bien le livre mystérieux
                if (object.name === 'mysterious-book-object' || object.userData.id === 'mysterious-book') {
                  // Faire disparaître immédiatement le livre
                  object.visible = false;
                  
                  // Capturer la référence de l'objet pour éviter les erreurs TypeScript
                  const bookToRemove = object;
                  const parentObject = object.parent;
                  
                  // Retirer de la scène après un très court délai
                  setTimeout(() => {
                    if (parentObject && bookToRemove) {
                      parentObject.remove(bookToRemove);
                    }
                  }, 50);
                }
              }
              break;
            case 'locked-drawer':
              // Vérifier si le code du tiroir est déjà valide - si oui, ne plus permettre l'interaction
              if (isDrawerCodeValidRef.current) {
                return; // Ne pas permettre l'interaction si le code est déjà validé
              }
              onInteract(object.userData.id, object.userData.type, 'prompt_code');
              break;
            case 'painting':
              // Vérifier si le code du tableau est déjà valide - si oui, ne plus permettre l'interaction
              if (isCodeValidRef.current) {
                return; // Ne pas permettre l'interaction si le code est déjà validé
              }
              onInteract(object.userData.id, object.userData.type, 'prompt_painting_code');
              break;
          }
          break;
        }
      }
    };

    // Création de la bibliothèque 3D
    const createGrandLibrary = () => {
      // Création du sol en parquet optimisé
      const createWoodenFloor = () => {
        const floorGroup = new THREE.Group();
        
        // Utilisation des matériaux partagés
        const floorGeometry = sharedGeometries.floor;
        const floorMaterial = sharedMaterials.darkWood;
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        floorGroup.add(floor);

        scene.add(floorGroup);
      };

      // Création des murs 
      const createWalls = () => {
        const wallGeometry = sharedGeometries.wall;
        const wallMaterial = sharedMaterials.wallMaterial;

        // Murs
        const walls = [
          { pos: [0, 2.5, -10], rot: [0, 0, 0] },
          { pos: [0, 2.5, 10], rot: [0, 0, 0] },
          { pos: [-10, 2.5, 0], rot: [0, Math.PI / 2, 0] },
          { pos: [10, 2.5, 0], rot: [0, Math.PI / 2, 0] }
        ];

        walls.forEach(({pos, rot}) => {
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(pos[0], pos[1], pos[2]);
          wall.rotation.set(rot[0], rot[1], rot[2]);
          wall.receiveShadow = true;
          scene.add(wall);
        });
      };

      // Création de la bibliothèque murale 
      const createWallBookshelf = () => {
        const createSingleBookshelf = (xOffset: number, zOffset: number, shelfIndex: number) => {
          const bookshelf = new THREE.Group();

          // Structure principale utilisant les géométries partagées
          const mainStructure = new THREE.Mesh(
            sharedGeometries.shelf,
            sharedMaterials.darkWood
          );
          bookshelf.add(mainStructure);

          // Création ultra-optimisée des livres avec matériaux pré-créés
          const createBooks = (sectionStart: number, sectionEnd: number, row: number, shelfXOffset: number, section: number, shelfIndex: number) => {
            const books = new THREE.Group();
            let xPos = sectionStart + 0.2;
            const yPos = -1.2 + row * 0.7;

            // Matériaux de livres pré-définis pour éviter les créations répétées
            const bookMaterials = [
              sharedMaterials.bookMaterial1,
              sharedMaterials.bookMaterial2,
              sharedMaterials.bookMaterial3,
              sharedMaterials.bookMaterial4,
              sharedMaterials.bookMaterial5
            ];

            let bookIndex = 0;

            while (xPos < sectionEnd) {
              const book = new THREE.Group();
              let isMysterious = false;

              // Créer le livre mystérieux UNIQUEMENT dans la première étagère
              if (!mysteriousBookCreated.current && 
                  shelfIndex === 0 && 
                  row === 3 && 
                  section === 0 && 
                  Math.abs(xPos - (sectionStart + 0.2)) < 0.1) {
                isMysterious = true;
                book.name = 'mysterious-book-object';
                mysteriousBookCreated.current = true;
              }

              // Utilisation cyclique des matériaux pré-créés pour optimiser
              const materialIndex = bookIndex % bookMaterials.length;
              const bookMaterial = isMysterious ? 
                new THREE.MeshLambertMaterial({ color: 0x4A0404 }) : 
                bookMaterials[materialIndex];

              const bookBody = new THREE.Mesh(sharedGeometries.book, bookMaterial);
              book.add(bookBody);

              // Détails dorés restaurés sur tous les livres
              const goldDetail = new THREE.Mesh(
                new THREE.BoxGeometry(0.31, 0.03, 0.81),
                sharedMaterials.gold
              );
              goldDetail.position.y = 0.65 * 0.3;
              book.add(goldDetail);

              // Ajout du trait d'or sur le dos du livre (spine detail)
              const spineDetail = new THREE.Mesh(
                new THREE.BoxGeometry(0.32, 0.02, 0.1),
                sharedMaterials.gold
              );
              spineDetail.position.z = 0.3;
              book.add(spineDetail);

              // Si c'est le livre mystérieux, ajouter un symbole distinctif
              if (isMysterious) {
                const symbol = new THREE.Mesh(
                  new THREE.BoxGeometry(0.32, 0.02, 0.1),
                  sharedMaterials.gold
                );
                symbol.position.z = 0.3;
                symbol.position.y = 0.1;
                book.add(symbol);
                
                // Rendre le livre mystérieux interactif
                makeInteractive(book, 'mysterious-book', 'book');
              }

              book.position.set(xPos, yPos, 0.95);
              // Réduction des rotations aléatoires pour optimiser
              if (bookIndex % 3 === 0) {
                book.rotation.z = (Math.random() - 0.5) * 0.05; // Rotation réduite
              }
              books.add(book);

              xPos += 0.35;
              bookIndex++;
            }
            return books;
          };

          // Création des sections de livres
          for (let section = 0; section < 3; section++) {
            const sectionStart = -4.5 + section * 3;
            const sectionEnd = sectionStart + 2.8;
            for (let row = 0; row < 4; row++) {
              bookshelf.add(createBooks(sectionStart, sectionEnd, row, xOffset, section, shelfIndex));
            }
          }

          bookshelf.position.set(xOffset, 1.7, -9);
          return bookshelf;
        };

        // Création des bibliothèques
        const positions = [
          { x: -5, z: -9, rot: 0 },
          { x: 5, z: -9, rot: 0 },
          { x: -5, z: 9, rot: Math.PI },
          { x: 5, z: 9, rot: Math.PI }
        ];

        positions.forEach((pos, index) => {
          const shelf = createSingleBookshelf(pos.x, pos.z, index);
          shelf.position.z = pos.z;
          shelf.rotation.y = pos.rot;
          scene.add(shelf);
        });
      };

      // Création du mobilier 
      const createFurniture = () => {
        // Bureau avec tiroirs
          const desk = new THREE.Group();

        // Plateau du bureau
        const deskTop = new THREE.Mesh(
          sharedGeometries.table,
          sharedMaterials.darkWood
        );
          desk.add(deskTop);

        // Ajout des unités latérales avec tiroirs
            const createSideUnit = (x: number) => {
              const unit = new THREE.Group();

              // Panneau principal
              const mainPanel = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.8, 1.2),
            sharedMaterials.darkWood
              );
              unit.add(mainPanel);

          // Création des tiroirs
              const createDrawer = (y: number) => {
                const drawer = new THREE.Group();

                // Façade du tiroir
                const front = new THREE.Mesh(
              sharedGeometries.drawer,
              sharedMaterials.darkWood
                );
                drawer.add(front);

            // Bordure du tiroir
                const frame = new THREE.Mesh(
                  new THREE.BoxGeometry(0.57, 0.17, 0.01),
              sharedMaterials.veryDarkWood
                );
                frame.position.z = 0.025;
                drawer.add(frame);

            // Poignée
                const handle = new THREE.Mesh(
              sharedGeometries.torus,
              sharedMaterials.brass
                );
                handle.rotation.x = Math.PI / 2;
                handle.rotation.y = Math.PI / 2;
                handle.position.set(0, 0, 0.03);
                drawer.add(handle);

                drawer.position.set(0, y, 0.575);
                return drawer;
              };

              // Ajout de 3 tiroirs
              [-0.25, 0, 0.25].forEach(y => {
                unit.add(createDrawer(y));
              });

              unit.position.set(x, -0.4, 0);
              return unit;
            };

            // Ajout des unités latérales
        desk.add(createSideUnit(-0.9));
        desk.add(createSideUnit(0.9));
          desk.position.set(0, 0.8, -3);
          scene.add(desk);

        // Chaise avec détails
          const chair = new THREE.Group();

        // Assise
          const seat = new THREE.Mesh(
          sharedGeometries.chair,
          sharedMaterials.darkWood
          );
          chair.add(seat);

          // Dossier orné
        const backrest = new THREE.Mesh(
              new THREE.BoxGeometry(0.6, 0.9, 0.05),
          sharedMaterials.darkWood
        );
        backrest.position.set(0, 0.45, -0.3);
        chair.add(backrest);

            // Barreaux décoratifs verticaux
            for (let i = -0.2; i <= 0.2; i += 0.1) {
              const bar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8),
            sharedMaterials.veryDarkWood
          );
          bar.position.set(i, 0.45, -0.3);
          chair.add(bar);
        }

          // Pieds sculptés
          const createOrnateLeg = (x: number, z: number) => {
          const leg = new THREE.Group();

          // Partie principale du pied
          const mainLeg = new THREE.Mesh(
            sharedGeometries.cylinder,
            sharedMaterials.veryDarkWood
          );
          leg.add(mainLeg);

          // Ornement du pied
          const ornament = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 8, 8),
            sharedMaterials.darkWood
          );
          ornament.position.y = -0.2;
          leg.add(ornament);

            leg.position.set(x, -0.25, z);
            return leg;
          };

          // Placement des pieds
          [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]].forEach(pos => {
            chair.add(createOrnateLeg(pos[0], pos[1]));
          });

          chair.position.set(0, 0.45, -2);
          chair.rotation.y = -Math.PI;
          scene.add(chair);
        };

      // Création des éléments interactifs 
      const createInteractiveObjects = () => {
        // Vérifier si le tiroir verrouillé existe déjà dans la scène
        const existingDrawer = scene.getObjectByName('locked-drawer-object');
        if (!existingDrawer) {
          // Tiroir verrouillé
          const drawer = new THREE.Group();
          drawer.name = 'locked-drawer-object'; // Nom unique pour identification
          const drawerBody = new THREE.Mesh(
            sharedGeometries.drawer,
            sharedMaterials.darkWood
          );
          drawer.add(drawerBody);
          drawer.position.set(0.9, 0.4, -2.425);
          makeInteractive(drawer, 'locked-drawer', 'drawer');
          scene.add(drawer);
        }
      };

      // Création des éléments décoratifs   
      const createDecorations = () => {
        // Tapis oriental 
        const createOrientalRug = () => {
          const rugGroup = new THREE.Group();

          // Base du tapis avec motif persan
          const carpetBase = new THREE.Mesh(
            new THREE.CircleGeometry(2.5, 32),
            new THREE.MeshStandardMaterial({
              color: 0x3B2506,
              roughness: 0.6,
              side: THREE.DoubleSide,
              emissive: 0x2B1810,
              emissiveIntensity: 0.2
            })
          );
          carpetBase.rotation.x = -Math.PI / 2;
          carpetBase.position.y = 0.05;
          rugGroup.add(carpetBase);

          // Motifs géométriques 
          const patternGeometry = new THREE.CircleGeometry(0.2, 8);
          const patternMaterial = new THREE.MeshStandardMaterial({
            color: 0x2B1810,
                  roughness: 0.6,
                  side: THREE.DoubleSide,
                  emissive: 0x1A0F0A,
            emissiveIntensity: 0.3
          });

            for (let i = 0; i < 8; i++) {
              const angle = (i * Math.PI) / 4;
              const radius = 1.5;
            const ornament = new THREE.Mesh(patternGeometry, patternMaterial);
            ornament.position.set(
              Math.cos(angle) * radius,
              0.06,
              Math.sin(angle) * radius
              );
              ornament.rotation.x = -Math.PI / 2;
            rugGroup.add(ornament);
          }

          rugGroup.position.set(0, 0.01, -3);
          scene.add(rugGroup);
        };

        // Chandelier 
        const createChandelier = () => {
          const chandelier = new THREE.Group();

          // Structure principale réutilisable
          const mainStructure = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8),
            sharedMaterials.brass
          );
          chandelier.add(mainStructure);

          // Bougies optimisées - réduction du nombre et de la complexité
          const candleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6); // Réduction des segments
          const candleMaterial = new THREE.MeshLambertMaterial({
            color: 0xFFFDD0
          });

          // Réduction du nombre de bougies de 8 à 4 pour optimiser
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI * 2) / 4;
            const radius = 0.3;
            
            const candle = new THREE.Mesh(candleGeometry, candleMaterial);
            candle.position.set(
              Math.cos(angle) * radius,
              0.1,
              Math.sin(angle) * radius
            );
            chandelier.add(candle);

            // Lumière réduite - seulement 2 lumières au lieu de 8
            if (i % 2 === 0) {
              const candleLight = new THREE.PointLight(0xFFA500, 0.2, 2);
              candleLight.position.set(
                Math.cos(angle) * radius,
                0.2,
                Math.sin(angle) * radius
              );
              candleLight.castShadow = false;
              chandelier.add(candleLight);
            }
          }

          chandelier.position.set(0, 4, 0);
          scene.add(chandelier);
        };

        // Globe terrestre 
        const createGlobe = () => {
          const globe = new THREE.Group();
          
          // Sphère du globe
          const sphere = new THREE.Mesh(
            sharedGeometries.sphere,
              new THREE.MeshStandardMaterial({
              color: 0x8B4513,
              roughness: 0.7,
              metalness: 0.3
            })
          );
          globe.add(sphere);

          // Support en bois
          const stand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.1, 0.2, 8),
            sharedMaterials.darkWood
          );
          stand.position.y = -0.2;
          globe.add(stand);

          globe.position.set(0.8, 1.2, -3);
          scene.add(globe);
        };

        // Tableaux 
        const createPaintings = () => {
          // Réutilisation des géométries et matériaux
          const frameGeometry = new THREE.BoxGeometry(1.7, 2.2, 0.05);
          const canvasGeometry = new THREE.PlaneGeometry(1.5, 2);
          const frameMaterial = sharedMaterials.darkWood;
          
          const createPainting = (x: number, z: number, isInteractive: boolean) => {
            const frame = new THREE.Group();

            // Cadre
            const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.add(frameMesh);

            // Toile
            const canvasMaterial = new THREE.MeshStandardMaterial({
              color: 0xE0C9A6,
              roughness: 0.7,
              metalness: 0.1
            });
            const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial);
            canvas.position.z = 0.03;
            frame.add(canvas);

            frame.position.set(x, 2.5, z);
            
            // Rotation selon le mur (gauche ou droite)
            if (x < 0) {
              frame.rotation.y = Math.PI / 2;  // Rotation pour le mur gauche
            } else {
              frame.rotation.y = -Math.PI / 2;  // Rotation pour le mur droit
            }

            if (isInteractive) {
              makeInteractive(frame, 'painting', 'painting');
            }

            scene.add(frame);
          };

          // Création des tableaux (seul le premier est interactif)
          createPainting(-9.7, 0, true);    // Tableau interactif sur le mur gauche
          createPainting(9.7, -2, false);   // Tableau non-interactif sur le mur droit
        };

        // Porte 
      const createDoor = () => {
        const doorGroup = new THREE.Group();

          // Cadre de la porte
          const doorFrame = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 2.8, 1.8),
            sharedMaterials.darkWood
          );
        doorGroup.add(doorFrame);

          // Porte
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 2.6, 1.6),
            sharedMaterials.darkWood
        );
        door.position.x = 0.15;
        doorGroup.add(door);

          // Poignée
          const handle = new THREE.Mesh(
            sharedGeometries.torus,
            sharedMaterials.brass
          );
          handle.rotation.y = Math.PI / 2;
          handle.position.set(0.1, 0, 0.4);
          door.add(handle);

        doorGroup.position.set(9.8, 1.2, 3.2);
        doorGroup.rotation.y = Math.PI;

        makeInteractive(doorGroup, 'laboratory-door', 'door');
        scene.add(doorGroup);
      };

        // Coin salon   
      const createLounge = () => {
          // Création d'un fauteuil club détaillé
        const createArmchair = (x: number, z: number, rotation: number) => {
          const chair = new THREE.Group();

          // Assise plus profonde et incurvée
          const seat = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 0.2, 0.9),
              sharedMaterials.maroonLeather
          );
          seat.position.y = 0.4;
          chair.add(seat);

            // Coussin d'assise
            const cushion = new THREE.Mesh(
              new THREE.BoxGeometry(0.7, 0.12, 0.7),
              new THREE.MeshStandardMaterial({
                color: 0x660000,
                roughness: 0.9,
                metalness: 0.1
              })
            );
            cushion.position.set(0, 0.48, 0);
            chair.add(cushion);

          // Dossier plus haut et orné
          const backrest = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 1.1, 0.2),
              sharedMaterials.maroonLeather
          );
          backrest.position.set(0, 0.95, -0.35);
          chair.add(backrest);

          // Ornements en bois sculpté sur le dossier
          const createWoodCarving = (y: number) => {
            const carving = new THREE.Mesh(
              new THREE.BoxGeometry(0.8, 0.1, 0.05),
                sharedMaterials.darkWood
            );
            carving.position.set(0, y, -0.24);
            backrest.add(carving);
          };
          createWoodCarving(0.4);
          createWoodCarving(-0.4);

          // Accoudoirs plus ornés
          const createArmrest = (x: number) => {
            const armrest = new THREE.Group();
            
            // Base de l'accoudoir
            const base = new THREE.Mesh(
              new THREE.BoxGeometry(0.2, 0.35, 0.7),
                sharedMaterials.maroonLeather
              );
            armrest.add(base);

            // Ornement en bois sur l'accoudoir
            const ornament = new THREE.Mesh(
              new THREE.BoxGeometry(0.22, 0.05, 0.72),
                sharedMaterials.darkWood
              );
              ornament.position.y = 0.2;
            armrest.add(ornament);

            armrest.position.set(x, 0.55, -0.1);
            chair.add(armrest);
          };
          createArmrest(0.35);
          createArmrest(-0.35);

          // Pieds en bois tourné
          const createLeg = (x: number, z: number) => {
              const leg = new THREE.Group();
              
              // Base du pied
              const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.04, 0.45, 8),
                sharedMaterials.darkWood
              );
              leg.add(base);

              // Ornement du pied
              const ornament = new THREE.Mesh(
                new THREE.SphereGeometry(0.07, 8, 8),
                sharedMaterials.darkWood
              );
              ornament.position.y = -0.2;
              leg.add(ornament);

            leg.position.set(x, 0.2, z);
            chair.add(leg);
          };

          // Placement des pieds
          createLeg(0.35, 0.35);
          createLeg(-0.35, 0.35);
          createLeg(0.35, -0.35);
          createLeg(-0.35, -0.35);

          chair.position.set(x, 0, z);
          chair.rotation.y = rotation;
          return chair;
        };

        // Table basse plus ornée
        const createCoffeeTable = () => {
          const table = new THREE.Group();

          // Plateau plus orné
          const top = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 0.08, 1),
              sharedMaterials.darkWood
          );
          top.position.y = 0.45;
          table.add(top);

            // Bordure décorative du plateau
            const edge = new THREE.Mesh(
              new THREE.BoxGeometry(1.5, 0.12, 1.1),
              sharedMaterials.veryDarkWood
            );
            edge.position.y = 0.42;
            table.add(edge);

          // Pieds plus travaillés
          const createLeg = (x: number, z: number) => {
            const leg = new THREE.Group();
            
            // Base du pied
            const base = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.04, 0.45, 8),
                sharedMaterials.darkWood
            );
            leg.add(base);

            // Ornement du pied
            const ornament = new THREE.Mesh(
              new THREE.SphereGeometry(0.07, 8, 8),
                sharedMaterials.darkWood
            );
            ornament.position.y = -0.2;
            leg.add(ornament);

            leg.position.set(x, 0.225, z);
            table.add(leg);
          };

          // Placement des pieds
          createLeg(0.65, 0.45);
          createLeg(-0.65, 0.45);
          createLeg(0.65, -0.45);
          createLeg(-0.65, -0.45);

            // Ajout d'objets décoratifs sur la table
            const createBookStack = () => {
              const stack = new THREE.Group();
              const bookColors = [0x2B1810, 0x3C2415, 0x4A3520];
              
              for (let i = 0; i < 3; i++) {
                const book = new THREE.Mesh(
                  new THREE.BoxGeometry(0.3, 0.05, 0.2),
                  new THREE.MeshStandardMaterial({
                    color: bookColors[i],
                    roughness: 0.8
                  })
                );
                book.position.y = i * 0.05;
                book.rotation.y = (Math.random() - 0.5) * 0.3;
                stack.add(book);
              }
              
              stack.position.set(-0.4, 0.5, 0);
              table.add(stack);
            };

            // Ajout d'un chandelier sur la table
            const createTableCandlestick = () => {
              const candlestick = new THREE.Group();

              // Base
              const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.1, 0.05, 8),
                sharedMaterials.brass
              );
              candlestick.add(base);

              // Tige
              const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
                sharedMaterials.brass
              );
              stem.position.y = 0.12;
              candlestick.add(stem);

              // Bougie
              const candle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.025, 0.025, 0.15, 8),
                new THREE.MeshStandardMaterial({
                  color: 0xFFFDD0,
                  roughness: 0.9
                })
              );
              candle.position.y = 0.3;
              candlestick.add(candle);

              // Lumière de la bougie
              const candleLight = new THREE.PointLight(0xFFA500, 0.5, 2);
              candleLight.position.y = 0.4;
              candlestick.add(candleLight);

              candlestick.position.set(0.4, 0.5, 0);
              table.add(candlestick);
            };

            createBookStack();
            createTableCandlestick();

          return table;
        };

        // Tapis oriental plus détaillé
        const createOrientalRug = () => {
          const rugGroup = new THREE.Group();

          // Base du tapis avec motif persan
          const carpetBase = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 2.5),
            new THREE.MeshStandardMaterial({
              color: 0x3B2506,
              roughness: 0.6,
              side: THREE.DoubleSide,
              emissive: 0x2B1810,
              emissiveIntensity: 0.2
            })
          );
          carpetBase.rotation.x = -Math.PI / 2;
          carpetBase.position.y = 0.05;
          rugGroup.add(carpetBase);

            // Bordures concentriques ornées
            [2.8, 2.3, 1.8, 1.3].forEach((radius, index) => {
              const border = new THREE.Mesh(
                new THREE.RingGeometry(radius - 0.1, radius, 32, 8),
                new THREE.MeshStandardMaterial({
                  color: index % 2 === 0 ? 0x2B1810 : 0x3B2506,
                  roughness: 0.6,
                  side: THREE.DoubleSide,
                  emissive: 0x1A0F0A,
                  emissiveIntensity: 0.2
                })
              );
              border.rotation.x = -Math.PI / 2;
              border.position.y = 0.055 + (index * 0.002);
              rugGroup.add(border);
            });

            // Motifs géométriques
            const createPattern = () => {
              const pattern = new THREE.Group();
            for (let i = 0; i < 8; i++) {
              const angle = (i * Math.PI) / 4;
              const radius = 1.8;
              const ornament = new THREE.Mesh(
                new THREE.CircleGeometry(0.3, 8),
                new THREE.MeshStandardMaterial({
                  color: 0x2B1810,
                  roughness: 0.6,
                  side: THREE.DoubleSide,
                  emissive: 0x1A0F0A,
                  emissiveIntensity: 0.3
                })
              );
                ornament.position.set(
                  Math.cos(angle) * radius,
                  0.06,
                  Math.sin(angle) * radius
              );
              ornament.rotation.x = -Math.PI / 2;
              pattern.add(ornament);
            }
            return pattern;
          };

            rugGroup.add(createPattern());
            rugGroup.position.set(-7, 0.01, 4);
          return rugGroup;
        };

        // Lampadaire style ancien
        const createFloorLamp = () => {
          const lamp = new THREE.Group();

          // Pied plus orné
          const stand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.15, 1.8, 8),
              sharedMaterials.brass
          );
          lamp.add(stand);

            // Ornements sur le pied
            [0.2, 0.8, 1.4].forEach(y => {
              const ornament = new THREE.Mesh(
                new THREE.TorusGeometry(0.12, 0.02, 8, 16),
                sharedMaterials.brass
              );
              ornament.position.y = y;
              ornament.rotation.x = Math.PI / 2;
              lamp.add(ornament);
            });

          // Abat-jour plus travaillé
          const shade = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.35, 0.5, 8, 1, true),
            new THREE.MeshStandardMaterial({
              color: 0xFFF8DC,
              roughness: 0.7,
              metalness: 0.2,
              side: THREE.DoubleSide
            })
          );
          shade.position.y = 1.6;
          lamp.add(shade);

          // Lumière optimisée
          const light = new THREE.PointLight(0xFFA500, 0.3, 3);
          light.position.y = 1.6;
          light.castShadow = false;
          lamp.add(light);

            lamp.position.set(-8.5, 0, 4);
          return lamp;
        };

          // Création et placement des éléments
        const rug = createOrientalRug();
          scene.add(rug);

        const chair1 = createArmchair(-8, 3, Math.PI / 3);
        const chair2 = createArmchair(-5.5, 2.7, -Math.PI / 3);
          scene.add(chair1);
          scene.add(chair2);

        const table = createCoffeeTable();
        table.position.set(-7, 0, 4.5);
          scene.add(table);

        const lamp = createFloorLamp();
          scene.add(lamp);
      };

        createOrientalRug();
        createChandelier();
        createGlobe();
        createPaintings();
        createDoor();
      createLounge();
    };

      // Installation des éléments
      createWoodenFloor();
      createWalls();
      createWallBookshelf();
      createFurniture();
      createInteractiveObjects();
      createDecorations();

      // Ajout des collisions principales
      const addCollisions = () => {
        // Murs
        createCollisionBox(20, 5, 0.5, new THREE.Vector3(0, 2.5, -10));
        createCollisionBox(20, 5, 0.5, new THREE.Vector3(0, 2.5, 10));
        createCollisionBox(0.5, 5, 20, new THREE.Vector3(-10, 2.5, 0));
        createCollisionBox(0.5, 5, 20, new THREE.Vector3(10, 2.5, 0));

        // Mobilier
    createCollisionBox(2.4, 1, 1.4, new THREE.Vector3(0, 0.8, -3)); // Bureau
    createCollisionBox(0.6, 1.2, 0.6, new THREE.Vector3(0, 0.6, -2)); // Chaise

        // Bibliothèques
        createCollisionBox(9, 2.8, 1.2, new THREE.Vector3(-5, 1.7, -9));
        createCollisionBox(9, 2.8, 1.2, new THREE.Vector3(5, 1.7, -9));
        createCollisionBox(9, 2.8, 1.2, new THREE.Vector3(-5, 1.7, 9));
        createCollisionBox(9, 2.8, 1.2, new THREE.Vector3(5, 1.7, 9));
      };

      addCollisions();
    };

    // Création de la bibliothèque
    createGrandLibrary();

    // Nettoyage optimisé
    return () => {
      // Marquer comme en cours de démontage
      isDisposedRef.current = true;
      
      const mountElement = mountRef.current;
      
      // Nettoyer les event listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      
      // Annuler l'animation frame
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = 0;
      }

      // Nettoyer le renderer
      if (rendererRef.current) {
        try {
          if (mountElement && rendererRef.current.domElement.parentNode) {
            mountElement.removeChild(rendererRef.current.domElement);
          }
          rendererRef.current.dispose();
          rendererRef.current = null;
        } catch (error) {
          console.warn('Erreur lors du nettoyage du renderer:', error);
        }
      }

      // Nettoyer les contrôles
      if (controlsRef.current) {
        try {
          controlsRef.current.dispose();
          controlsRef.current = null;
        } catch (error) {
          console.warn('Erreur lors du nettoyage des contrôles:', error);
        }
      }

      // Nettoyage des ressources Three.js
      try {
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            }
          }
        });

        // Vider la scène
        scene.clear();
      } catch (error) {
        console.warn('Erreur lors du nettoyage de la scène:', error);
      }

      // Nettoyer les géométries et matériaux partagés
      try {
        Object.values(sharedGeometries).forEach(geometry => {
          if (geometry) geometry.dispose();
        });
        Object.values(sharedMaterials).forEach(material => {
          if (material) material.dispose();
        });
      } catch (error) {
        console.warn('Erreur lors du nettoyage des ressources partagées:', error);
      }

      // Réinitialiser toutes les refs
      collisionObjectsRef.current = [];
      lastHoveredObject.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      isInitializedRef.current = false;
      mysteriousBookCreated.current = false;
      frameCountRef.current = 0;
      lastTimeRef.current = 0;
      
      // Réinitialiser l'état de mouvement
      moveStateRef.current = {
        forward: false,
        backward: false,
        left: false,
        right: false,
      };
    };
  }, [scene, camera]);

  // Effet séparé pour gérer les changements de isCodeValid sans recréer la scène
  useEffect(() => {
    
  }, [camera, onInteract, scene]);

  return (
    <>
      <div ref={mountRef} style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }} />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        <div style={{
          position: 'absolute',
          width: '20px',
          height: '2px',
          backgroundColor: 'white',
          left: '-10px',
        }} />
        <div style={{
          position: 'absolute',
          width: '2px',
          height: '20px',
          backgroundColor: 'white',
          top: '-10px',
        }} />
      </div>
    </>
  );
}; 