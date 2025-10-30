import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Leaderboard.css';

interface LeaderboardEntry {
  username: string;
  score: number;
  completionTime: number;
}

export const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {

        const response = await fetch('/api/leaderboard', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const contentType = response.headers.get('content-type');

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Réponse erreur:', errorText);
          throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
        }

        // Essayer de lire le corps de la réponse comme texte d'abord
        const responseText = await response.text();

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Erreur de parsing JSON:', parseError);
          throw new Error(`Impossible de parser la réponse JSON: ${responseText.substring(0, 100)}...`);
        }



        if (!data.leaderboard && !data.data) {
          throw new Error('Format de données invalide');
        }

        // Gestion des deux formats possibles de réponse
        const leaderboardData = data.leaderboard || data.data;
        setLeaderboard(leaderboardData.map((entry: any) => ({
          username: entry.username || entry.User?.username || 'Joueur Anonyme',
          score: entry.score,
          completionTime: entry.completionTime || entry.time || 0
        })));
      } catch (err) {
        console.error('Erreur détaillée:', err);
        if (err instanceof Error) {
          setError(`Impossible de charger le classement: ${err.message}`);
        } else {
          setError('Erreur inconnue lors du chargement du classement');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${remainingSeconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  if (isLoading) {
    return <div className="leaderboard-loading">Chargement du classement...</div>;
  }

  if (error) {
    return <div className="leaderboard-error">{error}</div>;
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header-section">
        <h1>🏆 Classement des Joueurs</h1>
        <button 
          className="back-to-intro-btn"
          onClick={() => navigate('/')}
        >
          ← Retour à l'Accueil
        </button>
      </div>
      <div className="leaderboard-table">
        <div className="leaderboard-header">
          <div className="rank">Rang</div>
          <div className="username">Joueur</div>
          <div className="score">Score</div>
          <div className="time">Temps</div>
        </div>
        {leaderboard.map((entry, index) => (
          <div key={index} className="leaderboard-row">
            <div className="rank">{getMedalEmoji(index + 1) || `#${index + 1}`}</div>
            <div className="username">{entry.username}</div>
            <div className="score">{entry.score}</div>
            <div className="time">{formatTime(entry.completionTime)}</div>
          </div>
        ))}
        {leaderboard.length === 0 && (
          <div className="leaderboard-row">
            <div className="rank">-</div>
            <div className="username">Aucun score enregistré</div>
            <div className="score">-</div>
            <div className="time">-</div>
          </div>
        )}
      </div>
    </div>
  );
}; 