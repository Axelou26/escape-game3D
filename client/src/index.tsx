import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { enableErrorFiltering, setupGlobalErrorHandler } from './utils/errorHandler';

// Intercepter les erreurs React avant qu'elles n'atteignent l'interface utilisateur
const originalCreateRoot = ReactDOM.createRoot;
ReactDOM.createRoot = function(container: ReactDOM.Container, options?: ReactDOM.RootOptions) {
  const root = originalCreateRoot(container, options);
  const originalRender = root.render.bind(root);
  
  root.render = function(element: React.ReactNode) {
    try {
      return originalRender(element);
    } catch (error: any) {
      const message = error?.message || error?.toString() || '';
      const ignoredErrors = [
        'The user has exited the lock before this request was completed',
        'SecurityError: The user has exited the lock',
        'THREE.PointerLockControls: Unable to use Pointer Lock API'
      ];
      
      if (ignoredErrors.some(ignored => message.includes(ignored))) {
        // Ignorer silencieusement les erreurs de PointerLock
        return;
      }
      throw error;
    }
  };
  
  return root;
};

// Activer le filtrage des erreurs dès le démarrage
enableErrorFiltering();
setupGlobalErrorHandler();

// Intercepteur direct pour masquer l'overlay d'erreur React
if (process.env.NODE_ENV === 'development') {
  // Intercepter les erreurs avant qu'elles n'atteignent l'overlay React
  const originalOnerror = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    const errorMessage = message?.toString() || error?.message || '';
    const pointerLockErrors = [
      'The user has exited the lock before this request was completed',
      'SecurityError: The user has exited the lock',
      'THREE.PointerLockControls: Unable to use Pointer Lock API'
    ];
    
    if (pointerLockErrors.some(err => errorMessage.includes(err))) {
      return true; // Empêcher l'affichage de l'erreur
    }
    
    if (originalOnerror) {
      return originalOnerror.call(window, message, source, lineno, colno, error);
    }
    return false;
  };

  // Observer pour masquer l'overlay d'erreur s'il apparaît malgré tout
  const hideErrorOverlay = () => {
    // Chercher tous les divs qui pourraient être des overlays d'erreur
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach(div => {
      const text = div.textContent || '';
      if (text.includes('Uncaught runtime errors') && 
          text.includes('The user has exited the lock')) {
        div.style.display = 'none';
        div.style.visibility = 'hidden';
        div.style.opacity = '0';
        // Essayer de supprimer l'élément
        setTimeout(() => {
          if (div.parentNode) {
            div.parentNode.removeChild(div);
          }
        }, 100);
      }
    });
  };

  // Exécuter immédiatement et répéter
  hideErrorOverlay();
  setInterval(hideErrorOverlay, 1000);

  // Observer les changements dans le DOM
  const observer = new MutationObserver(() => {
    hideErrorOverlay();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Intercepteur supplémentaire pour React en mode développement
if (process.env.NODE_ENV === 'development') {
  // Intercepter les erreurs de rendu React
  const originalLogRecoverableError = console.error;
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    const ignoredErrors = [
      'The user has exited the lock before this request was completed',
      'SecurityError: The user has exited the lock',
      'THREE.PointerLockControls: Unable to use Pointer Lock API',
      'The above error occurred in the'
    ];
    
    if (!ignoredErrors.some(ignored => message.includes(ignored))) {
      originalLogRecoverableError.apply(console, args);
    }
  };
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
