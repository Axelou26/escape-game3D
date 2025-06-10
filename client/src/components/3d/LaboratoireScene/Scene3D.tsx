import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

interface Scene3DProps {
  onInteract: (objectId: string, objectType: string, action?: string, data?: any) => void;
  isPeriodicTableLocked: boolean;
}

export const Scene3D: React.FC<Scene3DProps> = ({ onInteract, isPeriodicTableLocked }): JSX.Element => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<PointerLockControls | null>(null);

  // Matériaux partagés
  const sharedMaterials = useMemo(() => ({
    floorDark: new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8
    }),
    floorLight: new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8
    }),
    wall: new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7
    })
  }), []);

  const glassMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1
  }), []);

  const metalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.8,
    roughness: 0.2
  }), []);

  // Géométries partagées
  const sharedGeometries = useMemo(() => ({
    floorTile: new THREE.PlaneGeometry(1, 1),
    wallPlane: new THREE.PlaneGeometry(20, 5),
    wallTile: new THREE.PlaneGeometry(0.5 - 0.01, 0.5 - 0.01),
    tableTop: new THREE.BoxGeometry(3, 0.1, 1.5),
    tableLeg: new THREE.BoxGeometry(0.1, 0.9, 0.1),
    cabinetBody: new THREE.BoxGeometry(2.5, 2.5, 0.8),
    beaker: new THREE.CylinderGeometry(0.1, 0.08, 0.2, 16),
    bottle: new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8)
  }), []);

  // Initialisation de la scène
  useEffect(() => {
    if (!mountRef.current) return;

    // Création de la scène
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Création du renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Création de la caméra
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.8, 0);

    // Création des contrôles
    const controls = new PointerLockControls(camera, document.body);
    controlsRef.current = controls;

    // Nettoyage
    return () => {
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      scene.clear();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="scene3d-container"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}; 