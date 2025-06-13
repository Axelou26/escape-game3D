import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { EscapeGame } from './components/EscapeGame';
import { GameIntro } from './pages/GameIntro';
import { Leaderboard } from './components/ui/Leaderboard/Leaderboard';
import { PointerLockErrorBoundary } from './components/ErrorBoundary/PointerLockErrorBoundary';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
    return <div>Chargement...</div>;
  }

  return (
    <PointerLockErrorBoundary>
      <Router>
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#1a1a1a',
          color: 'white',
          padding: 0
        }}>
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                  <Navigate to="/intro" replace /> : 
                  <Login setIsAuthenticated={setIsAuthenticated} />
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? 
                  <Navigate to="/intro" replace /> : 
                  <Register />
              } 
            />
            <Route 
              path="/intro" 
              element={
                isAuthenticated ? 
                  <GameIntro /> : 
                  <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/game" 
              element={
                isAuthenticated ? 
                  <EscapeGame /> : 
                  <Navigate to="/login" replace />
              } 
            />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="*" element={<Navigate to={isAuthenticated ? "/intro" : "/login"} replace />} />
          </Routes>
        </div>
      </Router>
    </PointerLockErrorBoundary>
  );
}

export default App;
