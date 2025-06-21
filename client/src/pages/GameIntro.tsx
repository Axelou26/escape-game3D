import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Container, Box, Paper } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import { styled } from '@mui/material/styles';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

const IntroContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
  padding: theme.spacing(4),
  paddingBottom: theme.spacing(8),
}));

const GamePanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  maxWidth: 800,
  width: '100%',
  position: 'relative',
  overflow: 'visible',
  margin: theme.spacing(8, 0),
  zIndex: 1,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #ff4d4d, #f9cb28)',
  }
}));

const IconContainer = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(255, 77, 77, 0.2)',
  borderRadius: '50%',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

const NewGameButton = styled(Button)(({ theme }) => ({
  borderRadius: '25px',
  padding: '12px 30px',
  fontSize: '1.1rem',
  textTransform: 'none',
  background: 'linear-gradient(45deg, #ff4d4d 30%, #f9cb28 90%)',
  color: 'white',
  border: 'none',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    background: 'linear-gradient(45deg, #ff3333 30%, #f9bc28 90%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
  },
}));

const ContinueButton = styled(Button)(({ theme }) => ({
  borderRadius: '25px',
  padding: '12px 30px',
  fontSize: '1.1rem',
  textTransform: 'none',
  background: 'transparent',
  border: '2px solid #f9cb28',
  color: '#f9cb28',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    background: 'rgba(249, 203, 40, 0.1)',
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
  },
}));

const LogoutButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  top: 20,
  right: 20,
  color: 'rgba(255, 255, 255, 0.7)',
  borderRadius: '20px',
  padding: '8px 20px',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
  },
}));

export const GameIntro: React.FC = () => {
  const navigate = useNavigate();
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useEffect(() => {
    const checkSavedGame = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/game/current', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setHasSavedGame(!!data.data);
        } else if (response.status === 404) {
          // Pas de partie en cours - c'est normal
          setHasSavedGame(false);
        } else {
          console.warn('Erreur lors de la vérification de la sauvegarde:', response.status);
          setHasSavedGame(false);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la sauvegarde:', error);
        setHasSavedGame(false);
      }
    };

    checkSavedGame();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const startNewGame = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/game/reset', {
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
        navigate('/game');
      } else {
        throw new Error(data.message || 'Erreur lors de la réinitialisation du jeu');
      }
    } catch (error) {
      console.error('Erreur lors du démarrage d\'une nouvelle partie:', error);
      alert('Une erreur est survenue lors du demarrage d\'une nouvelle partie. Veuillez reessayer.');
    }
  };

  const continueGame = () => {
    navigate('/game');
  };

  return (
    <>
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto',
        background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
      }}>
        <IntroContainer maxWidth={false}>
          <LogoutButton
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ position: 'fixed', top: 20, right: 20, zIndex: 2 }}
          >
            Déconnexion
          </LogoutButton>

          <GamePanel elevation={3}>
            <Box sx={{ textAlign: 'center', position: 'relative' }}>
              <IconContainer>
                <MeetingRoomIcon sx={{ fontSize: 60, color: '#f9cb28' }} />
              </IconContainer>

              <Typography 
                variant="h3" 
                component="h1" 
                sx={{
                  color: '#f9cb28',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 4,
                  textShadow: '0 0 10px rgba(249, 203, 40, 0.3)',
                }}
              >
                Le Secret du Professeur Blackwood
              </Typography>

              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  marginBottom: 3,
                  textAlign: 'justify',
                }}
              >
                En tant que brillant étudiant en archéologie, vous avez toujours admiré le travail du Professeur Blackwood, 
                un éminent chercheur connu pour ses découvertes révolutionnaires sur les civilisations anciennes.
              </Typography>

              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  marginBottom: 3,
                  textAlign: 'justify',
                }}
              >
                Cependant, sa disparition soudaine il y a un mois a laissé la communauté scientifique perplexe. 
                Dans son bureau, vous avez découvert une série d'énigmes et de mécanismes complexes, suggérant 
                qu'il cachait quelque chose d'une importance capitale.
              </Typography>

              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  marginBottom: 5,
                  textAlign: 'justify',
                }}
              >
                Vous avez une heure pour explorer son bureau, résoudre les énigmes et découvrir ce que le 
                Professeur Blackwood tentait de protéger. Le temps presse, car vous n'êtes peut-être pas 
                le seul sur cette piste...
              </Typography>

              <Box sx={{ 
                display: 'flex', 
                gap: 3,
                justifyContent: 'center',
                marginTop: 6,
                marginBottom: 3,
                position: 'relative',
                zIndex: 2
              }}>
                <NewGameButton
                  onClick={startNewGame}
                  startIcon={<PlayArrowIcon />}
                >
                  Nouvelle Partie
                </NewGameButton>

                {hasSavedGame && (
                  <ContinueButton
                    onClick={continueGame}
                    startIcon={<RestoreIcon />}
                  >
                    Continuer
                  </ContinueButton>
                )}
              </Box>
            </Box>
          </GamePanel>
        </IntroContainer>
      </Box>
    </>
  );
}; 