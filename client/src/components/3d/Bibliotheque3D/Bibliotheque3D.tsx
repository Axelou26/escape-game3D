import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { TextureLoader } from 'three';

// Géométries réutilisables
const sharedGeometries = {
  book: new THREE.BoxGeometry(0.3, 0.65, 0.8),
  shelf: new THREE.BoxGeometry(9, 2.8, 1.2),
  wall: new THREE.BoxGeometry(20, 5, 0.5),
  floor: new THREE.PlaneGeometry(20, 20),
  drawer: new THREE.BoxGeometry(0.55, 0.15, 0.05),
  chair: new THREE.BoxGeometry(0.6, 0.1, 0.6),
  table: new THREE.BoxGeometry(2.4, 0.08, 1.4),
  panel: new THREE.BoxGeometry(0.03, 0.8, 1.0),
  cylinder: new THREE.CylinderGeometry(0.04, 0.03, 0.4, 8),
  sphere: new THREE.SphereGeometry(0.15, 10, 10),
  torus: new THREE.TorusGeometry(0.06, 0.015, 16, 32, Math.PI)
};

// Matériaux réutilisables
const sharedMaterials = {
  darkWood: new THREE.MeshStandardMaterial({
    color: 0x2B1810,
    roughness: 0.7,
    metalness: 0.1
  }),
  veryDarkWood: new THREE.MeshStandardMaterial({
    color: 0x1A0F0A,
    roughness: 0.8,
    metalness: 0.1
  }),
  maroonLeather: new THREE.MeshStandardMaterial({
    color: 0x8B0000,
    roughness: 0.8,
    metalness: 0.2
  }),
  brass: new THREE.MeshStandardMaterial({
    color: 0xB87333,
    roughness: 0.3,
    metalness: 0.8
  }),
  gold: new THREE.MeshStandardMaterial({
    color: 0xDAA520,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xDAA520,
    emissiveIntensity: 0.3
  }),
  wallMaterial: new THREE.MeshStandardMaterial({
    color: 0x3B2506,
    roughness: 0.7,
    metalness: 0.1
  })
};

// Ajout des couleurs de livres au début du fichier, après les matériaux partagés
const bookColors = [
  0x8B4513, // Marron classique
  0x654321, // Brun rougeâtre
  0x8B0000, // Rouge foncé
  0x006400, // Vert foncé
  0x191970, // Bleu minuit
  0x4B0082, // Indigo
  0x800000, // Bordeaux
  0x556B2F, // Vert olive foncé
  0x2F4F4F, // Gris ardoise foncé
  0x8B008B, // Magenta foncé
  0x800080, // Pourpre
  0x4A0404, // Rouge vin
  0x004225, // Vert forêt
  0x000080, // Bleu marine
  0x4A3C32, // Taupe
  0x704214  // Brun sépia
];

interface Bibliotheque3DProps {
  onInteract: (objectId: string, objectType: string, action?: string) => void;
}

export const Bibliotheque3D: React.FC<Bibliotheque3DProps> = ({ onInteract }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<PointerLockControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const moveStateRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const playerVelocity = useRef(new THREE.Vector3());
  const playerDirection = useRef(new THREE.Vector3());
  const textureLoader = useRef(new TextureLoader());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const collisionObjectsRef = useRef<THREE.Mesh[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Optimisation avec useMemo pour la scène et la caméra
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000), []);

  // Fonction optimisée pour créer des objets interactifs
  const makeInteractive = (object: THREE.Object3D, id: string, type: string) => {
    object.userData.interactive = true;
    object.userData.id = id;
    object.userData.type = type;

    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.3,
      depthTest: true,
      blending: THREE.NormalBlending
    });

    if (object instanceof THREE.Group) {
      object.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const outlineMesh = new THREE.Mesh(child.geometry, outlineMaterial.clone());
          outlineMesh.scale.multiplyScalar(1.02);
          outlineMesh.position.copy(child.position);
          outlineMesh.rotation.copy(child.rotation);
          object.add(outlineMesh);
        }
      });
    } else if (object instanceof THREE.Mesh) {
      const outlineMesh = new THREE.Mesh(object.geometry, outlineMaterial);
      outlineMesh.scale.multiplyScalar(1.02);
      object.add(outlineMesh);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialisation de la scène
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a1a1a);

    // Configuration optimisée du renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      powerPreference: "high-performance",
      precision: "mediump"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Configuration de la caméra
    camera.position.set(0, 1.6, 5);
    cameraRef.current = camera;

    // Configuration des contrôles
    const controls = new PointerLockControls(camera, document.body);
    controlsRef.current = controls;

    // Éclairage optimisé
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Lumières principales optimisées
    const mainLights = [
      { pos: [0, 4, 0], intensity: 1 },
      { pos: [-5, 4, -5], intensity: 0.7 },
      { pos: [5, 4, -5], intensity: 0.7 },
      { pos: [-5, 4, 5], intensity: 0.7 },
      { pos: [5, 4, 5], intensity: 0.7 }
    ];

    mainLights.forEach(light => {
      const pointLight = new THREE.PointLight(0xffffff, light.intensity, 10);
      pointLight.position.set(light.pos[0], light.pos[1], light.pos[2]);
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

    // Animation optimisée
    const animate = (time: number) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (controlsRef.current?.isLocked) {
        const speed = 0.15 * (60 * delta); // Normalisation du mouvement basée sur les FPS

        if (moveStateRef.current.forward) movePlayer(0, -speed);
        if (moveStateRef.current.backward) movePlayer(0, speed);
        if (moveStateRef.current.left) movePlayer(-speed, 0);
        if (moveStateRef.current.right) movePlayer(speed, 0);
      }

      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    // Gestion du redimensionnement optimisée
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
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
        if (object?.userData.interactive) {
          switch (object.userData.id) {
            case 'laboratory-door':
              console.log('Interaction avec la porte détectée');
              onInteract(object.userData.id, object.userData.type, 'enter_laboratory');
              break;
            case 'mysterious-book':
              onInteract(object.userData.id, object.userData.type, 'add_to_inventory');
              object.visible = false;
              break;
            case 'locked-drawer':
              onInteract(object.userData.id, object.userData.type, 'prompt_code');
              break;
            case 'painting':
              onInteract(object.userData.id, object.userData.type, 'examine');
              break;
          }
          break;
        }
      }
    };

    // Création de la bibliothèque monumentale
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

      // Création des murs optimisés
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

      // Création de la bibliothèque murale optimisée
      const createWallBookshelf = () => {
        const createSingleBookshelf = (xOffset: number) => {
          const bookshelf = new THREE.Group();

          // Structure principale utilisant les géométries partagées
          const mainStructure = new THREE.Mesh(
            sharedGeometries.shelf,
            sharedMaterials.darkWood
          );
          bookshelf.add(mainStructure);

          // Création des livres optimisée
          const createBooks = (sectionStart: number, sectionEnd: number, row: number) => {
            const books = new THREE.Group();
              let xPos = sectionStart + 0.2;
              const yPos = -1.2 + row * 0.7;

              while (xPos < sectionEnd) {
                const book = new THREE.Group();
                const bookColor = bookColors[Math.floor(Math.random() * bookColors.length)];
              const bookMaterial = new THREE.MeshStandardMaterial({
                    color: bookColor,
                    roughness: 0.7,
                    metalness: 0.2,
                    emissive: 0x000000,
                    emissiveIntensity: 0
              });

              const bookBody = new THREE.Mesh(
                sharedGeometries.book,
                bookMaterial
                );
                book.add(bookBody);

              // Détails dorés du livre
                const goldDetail = new THREE.Mesh(
                new THREE.BoxGeometry(0.31, 0.03, 0.81),
                sharedMaterials.gold
              );
              goldDetail.position.y = 0.65 * 0.3;
                book.add(goldDetail);

              // Ajout de reliefs sur le dos du livre
              const spineDetail = new THREE.Mesh(
                new THREE.BoxGeometry(0.32, 0.02, 0.1),
                sharedMaterials.gold
              );
              spineDetail.position.z = 0.3;
              book.add(spineDetail);

                book.position.set(xPos, yPos, 0.95);
                book.rotation.z = (Math.random() - 0.5) * 0.1;
              books.add(book);

              xPos += 0.35;
            }
            return books;
          };

          // Création des sections de livres
          for (let section = 0; section < 3; section++) {
            const sectionStart = -4.5 + section * 3;
            const sectionEnd = sectionStart + 2.8;
            for (let row = 0; row < 4; row++) {
              bookshelf.add(createBooks(sectionStart, sectionEnd, row));
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

        positions.forEach(pos => {
          const shelf = createSingleBookshelf(pos.x);
          shelf.position.z = pos.z;
          shelf.rotation.y = pos.rot;
          scene.add(shelf);
        });
      };

      // Création du mobilier optimisé
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

      // Création des éléments interactifs optimisés
      const createInteractiveObjects = () => {
        // Livre mystérieux
        const book = new THREE.Group();
        const bookBody = new THREE.Mesh(
          sharedGeometries.book,
          sharedMaterials.darkWood
        );
        book.add(bookBody);
        book.position.set(-6.3, 1.9, -8);
        makeInteractive(book, 'mysterious-book', 'book');
        scene.add(book);

        // Tiroir verrouillé
        const drawer = new THREE.Group();
        const drawerBody = new THREE.Mesh(
          sharedGeometries.drawer,
          sharedMaterials.darkWood
        );
        drawer.add(drawerBody);
        drawer.position.set(0.9, 0.4, -2.425);
        makeInteractive(drawer, 'locked-drawer', 'drawer');
        scene.add(drawer);
      };

      // Création des éléments décoratifs optimisés
      const createDecorations = () => {
        // Tapis oriental optimisé
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

          // Motifs géométriques optimisés
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

        // Chandelier optimisé
        const createChandelier = () => {
          const chandelier = new THREE.Group();

          // Structure principale réutilisable
          const mainStructure = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8),
            sharedMaterials.brass
          );
          chandelier.add(mainStructure);

          // Bougies optimisées
          const candleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
          const candleMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFDD0,
            roughness: 0.9
          });

          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const radius = 0.3;
            
            const candle = new THREE.Mesh(candleGeometry, candleMaterial);
            candle.position.set(
              Math.cos(angle) * radius,
              0.1,
              Math.sin(angle) * radius
            );
            chandelier.add(candle);

            // Lumière optimisée
            const candleLight = new THREE.PointLight(0xFFA500, 0.3, 3);
            candleLight.position.set(
              Math.cos(angle) * radius,
              0.2,
              Math.sin(angle) * radius
            );
            chandelier.add(candleLight);
          }

          chandelier.position.set(0, 4, 0);
          scene.add(chandelier);
        };

        // Globe terrestre optimisé
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

        // Tableaux optimisés
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

        // Porte optimisée
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

        // Coin salon optimisé et détaillé
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

          // Lumière plus chaude
          const light = new THREE.PointLight(0xFFA500, 0.6, 4);
          light.position.y = 1.6;
            light.intensity = 0.5;
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }

      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      // Nettoyage des ressources Three.js
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          } else if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          }
        }
      });

      // Nettoyage des géométries et matériaux partagés
      Object.values(sharedGeometries).forEach(geometry => geometry.dispose());
      Object.values(sharedMaterials).forEach(material => material.dispose());

      collisionObjectsRef.current = [];
    };
  }, [scene, camera]);

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