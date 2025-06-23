/**
 * Gestionnaire d'erreurs pour supprimer les messages d'erreur indésirables
 * liés au Pointer Lock API et aux extensions de navigateur
 */

// Stocker les méthodes console originales
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Liste des messages d'erreur à filtrer
const ERROR_FILTERS = [
  'THREE.PointerLockControls: Unable to use Pointer Lock API',
  'The user has exited the lock before this request was completed',
  'Unchecked runtime.lastError',
  'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received',
  '[ContentMain]',
  '[ContentService]',
  'document.readyState: loading',
  'SecurityError: The user has exited the lock',
  'Failed to execute \'requestPointerLock\'',
  'NotAllowedError: The request is not allowed by the user agent',
  'SecurityError',
  'La scène est déjà initialisée'
];

/**
 * Filtre les messages d'erreur pour masquer ceux qui sont indésirables
 */
function shouldFilterMessage(message: string): boolean {
  return ERROR_FILTERS.some(filter => message.includes(filter));
}

/**
 * Console.error personnalisée qui filtre les messages indésirables
 */
function filteredConsoleError(...args: any[]): void {
  const message = args.join(' ');
  if (!shouldFilterMessage(message)) {
    originalConsoleError.apply(console, args);
  }
}

/**
 * Console.warn personnalisée qui filtre les messages indésirables
 */
function filteredConsoleWarn(...args: any[]): void {
  const message = args.join(' ');
  if (!shouldFilterMessage(message)) {
    originalConsoleWarn.apply(console, args);
  }
}

/**
 * Console.log personnalisée qui filtre les messages indésirables
 */
function filteredConsoleLog(...args: any[]): void {
  const message = args.join(' ');
  if (!shouldFilterMessage(message)) {
    originalConsoleLog.apply(console, args);
  }
}

/**
 * Active le filtrage des erreurs
 */
export function enableErrorFiltering(): void {
  console.error = filteredConsoleError;
  console.warn = filteredConsoleWarn;
  console.log = filteredConsoleLog;
}

/**
 * Désactive le filtrage des erreurs (restaure les méthodes originales)
 */
export function disableErrorFiltering(): void {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
}

/**
 * Gestionnaire global pour les erreurs non capturées
 */
export function setupGlobalErrorHandler(): void {
  // Gestion des erreurs non capturées
  window.addEventListener('error', (event) => {
    const message = event.message || event.error?.message || '';
    if (shouldFilterMessage(message)) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }, true); // Utiliser capture pour intercepter plus tôt

  // Gestion des promesses rejetées non capturées
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason?.toString() || '';
    if (shouldFilterMessage(message)) {
      event.preventDefault();
      return false;
    }
  }, true);

  // Intercepter les erreurs React en développement
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    const errorMessage = message?.toString() || error?.message || '';
    if (shouldFilterMessage(errorMessage)) {
      return true; // Empêche l'affichage de l'erreur
    }
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };
}

/**
 * Wrapper sécurisé pour la méthode lock des contrôles PointerLock
 */
export function createSafeLockFunction(controls: any) {
  if (!controls || !controls.lock) return () => {};

  const originalLock = controls.lock.bind(controls);
  let isLocking = false;

  return function safeLock() {
    if (isLocking) return; // Éviter les appels multiples
    
    isLocking = true;
    
    // Utiliser requestAnimationFrame pour différer l'exécution
    requestAnimationFrame(() => {
      try {
        originalLock();
      } catch (error: any) {
        // Ignorer silencieusement toutes les erreurs de PointerLock
        const message = error?.message || error?.toString() || '';
        if (!shouldFilterMessage(message)) {
          console.warn('Erreur PointerLock non filtrée:', error);
        }
      } finally {
        setTimeout(() => {
          isLocking = false;
        }, 100);
      }
    });
  };
}

/**
 * Gestionnaire spécifique pour les erreurs PointerLock (version améliorée)
 */
export function handlePointerLockErrors(controls: any): void {
  if (!controls) return;

  // Remplacer complètement la méthode lock par une version sécurisée
  controls.lock = createSafeLockFunction(controls);

  // Intercepter tous les événements d'erreur possibles
  const eventTypes = ['error', 'pointerlockerror', 'pointerlockchange'];
  
  eventTypes.forEach(eventType => {
    controls.addEventListener?.(eventType, (event: any) => {
      if (eventType === 'error' || eventType === 'pointerlockerror') {
        event.stopPropagation();
        event.preventDefault();
      }
    });
  });

  // Intercepter les erreurs au niveau du domElement
  const domElement = controls.domElement || document.body;
  if (domElement) {
    // Ajouter un gestionnaire d'erreurs direct
    const errorHandler = (event: any) => {
      const message = event.message || event.error?.message || '';
      if (shouldFilterMessage(message)) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
    };

    domElement.addEventListener('error', errorHandler, true);
    domElement.addEventListener('pointerlockerror', errorHandler, true);
    
    // Intercepter requestPointerLock directement si possible
    if (domElement.requestPointerLock) {
      const originalRequestPointerLock = domElement.requestPointerLock.bind(domElement);
      domElement.requestPointerLock = function() {
        try {
          return originalRequestPointerLock();
        } catch (error: any) {
          // Ignorer silencieusement les erreurs
          return Promise.resolve();
        }
      };
    }
  }
}

/**
 * Gestionnaire d'erreurs générique pour les services
 */
export function handleError(error: any, context?: string): void {
  const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
  
  // Filtrer les erreurs connues
  if (shouldFilterMessage(errorMessage)) {
    return;
  }
  
  // Afficher l'erreur avec le contexte
  if (context) {
    console.error(`${context}:`, errorMessage);
  } else {
    console.error('Erreur:', errorMessage);
  }
  
  // En mode développement, afficher la stack trace
  if (process.env.NODE_ENV === 'development' && error?.stack) {
    console.error('Stack trace:', error.stack);
  }
} 