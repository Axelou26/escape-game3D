/**
 * Ce fichier n'est plus utilisé.
 * La gestion des erreurs PointerLock est maintenant assurée par :
 * - Le script dans public/index.html (interception précoce)
 * - Les intercepteurs dans src/index.tsx (gestion React)
 * - Les styles CSS dans src/index.css (masquage visuel)
 * - L'Error Boundary PointerLockErrorBoundary.tsx (protection React)
 */

export function patchReactErrorOverlay(): void {
  // Fonction vide - la gestion est faite ailleurs
} 