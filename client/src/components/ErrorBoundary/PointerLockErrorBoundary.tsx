import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary spécifique pour les erreurs de Pointer Lock
 * Intercepte les erreurs avant qu'elles n'atteignent l'interface utilisateur React
 */
export class PointerLockErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  // Liste des erreurs à intercepter silencieusement
  private readonly ignoredErrors = [
    'The user has exited the lock before this request was completed',
    'SecurityError: The user has exited the lock',
    'THREE.PointerLockControls: Unable to use Pointer Lock API',
    'Failed to execute \'requestPointerLock\'',
    'NotAllowedError: The request is not allowed by the user agent',
    'SecurityError'
  ];

  private shouldIgnoreError(error: Error): boolean {
    const message = error.message || error.toString();
    return this.ignoredErrors.some(ignoredError => message.includes(ignoredError));
  }

  static getDerivedStateFromError(error: Error): State | null {
    // Ne pas changer l'état pour les erreurs de PointerLock
    const message = error.message || error.toString();
    const ignoredErrors = [
      'The user has exited the lock before this request was completed',
      'SecurityError: The user has exited the lock',
      'THREE.PointerLockControls: Unable to use Pointer Lock API',
      'Failed to execute \'requestPointerLock\'',
      'NotAllowedError: The request is not allowed by the user agent',
      'SecurityError'
    ];
    
    if (ignoredErrors.some(ignored => message.includes(ignored))) {
      return null; // Ne pas changer l'état
    }
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Ignorer silencieusement les erreurs de PointerLock
    if (this.shouldIgnoreError(error)) {
      // Réinitialiser l'état si une erreur était précédemment capturée
      if (this.state.hasError) {
        this.setState({ hasError: false });
      }
      return;
    }

    // Logger les autres erreurs pour le debugging
    console.error('Erreur capturée par PointerLockErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Interface de fallback pour les erreurs réelles (non-PointerLock)
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#000',
          color: '#fff',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2>Une erreur s'est produite</h2>
          <p>Veuillez recharger la page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 