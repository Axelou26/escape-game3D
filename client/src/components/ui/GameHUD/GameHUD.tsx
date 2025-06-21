import React, { useEffect, useState } from 'react';
import './GameHUD.css';

interface GameHUDProps {
  score: number;
  elapsedTime: number;
  hintsUsed: number;
  attemptsCount: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({ score, elapsedTime, hintsUsed, attemptsCount }) => {
  const [timeDisplay, setTimeDisplay] = useState('00:00');
  const [prevScore, setPrevScore] = useState(score);
  const [scoreChanged, setScoreChanged] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const newTimeDisplay = formatTime(elapsedTime);
    setTimeDisplay(newTimeDisplay);
  }, [elapsedTime]);

  // Effet d'animation quand le score change
  useEffect(() => {
    if (score !== prevScore) {
      setScoreChanged(true);
      setPrevScore(score);
      
      // Retirer l'animation après 500ms
      const timeout = setTimeout(() => {
        setScoreChanged(false);
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [score, prevScore]);

  return (
    <div className="game-hud">
      <div className="hud-section score">
        <div className="hud-label">Score</div>
        <div className={`hud-value ${scoreChanged ? 'changed' : ''}`}>{score}</div>
      </div>
      <div className="hud-section time">
        <div className="hud-label">Temps</div>
        <div className="hud-value">{timeDisplay}</div>
      </div>
      </div>
  );
}; 