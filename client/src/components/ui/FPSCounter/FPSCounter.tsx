import React, { useEffect, useState, useRef, useCallback } from 'react';
import './FPSCounter.css';

export const FPSCounter: React.FC = () => {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();

  // Fonction de calcul FPS optimisée avec debounce
  const updateFPS = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;

    // Calculer les FPS toutes les 500ms au lieu de chaque seconde
    // pour une meilleure réactivité mais moins de calculs
    if (now >= lastTimeRef.current + 500) {
      const deltaTime = now - lastTimeRef.current;
      const currentFPS = Math.round((frameCountRef.current * 1000) / deltaTime);
      
      // Limiter les mises à jour du state seulement si la différence est significative
      setFps(prevFps => {
        const difference = Math.abs(currentFPS - prevFps);
        if (difference > 2) { // Seuil de 2 FPS pour éviter les micro-variations
          return currentFPS;
        }
        return prevFps;
      });
      
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    animationFrameRef.current = requestAnimationFrame(updateFPS);
  }, []);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateFPS);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateFPS]);

  const getFPSColor = useCallback((fps: number) => {
    if (fps >= 60) return '#4CAF50'; // Vert pour 60+ FPS
    if (fps >= 30) return '#FFC107'; // Jaune pour 30-59 FPS
    return '#F44336'; // Rouge pour moins de 30 FPS
  }, []);

  return (
    <div className="fps-counter">
      <div className="fps-label">FPS</div>
      <div 
        className="fps-value" 
        style={{ color: getFPSColor(fps) }}
      >
        {fps}
      </div>
    </div>
  );
}; 