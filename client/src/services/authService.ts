interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  tokenExpiry: number | null;
}

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    token: null,
    tokenExpiry: null
  };

  private readonly TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes avant expiration

  // Initialiser depuis localStorage 
  init(): void {
    try {
      const token = localStorage.getItem('token');
      const expiry = localStorage.getItem('tokenExpiry');
      
      if (token && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime - this.TOKEN_EXPIRY_BUFFER) {
          this.authState = {
            isAuthenticated: true,
            token,
            tokenExpiry: expiryTime
          };
        } else {
          // Token expiré
          this.logout();
        }
      }
    } catch (error) {
      // Token expiré ou invalide
      this.logout();
    }
  }

  // Connexion avec gestion sécurisée du token
  login(token: string, expiresIn: number = 24 * 60 * 60 * 1000): void {
    const expiry = Date.now() + expiresIn;
    
    this.authState = {
      isAuthenticated: true,
      token,
      tokenExpiry: expiry
    };

    // Stockage temporaire (à remplacer par httpOnly cookies)
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiry', expiry.toString());

    // Programmer la déconnexion automatique
    this.scheduleAutoLogout();
  }

  // Déconnexion sécurisée
  logout(): void {
    this.authState = {
      isAuthenticated: false,
      token: null,
      tokenExpiry: null
    };

    // Nettoyer le stockage
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('gameState');

    // Rediriger vers la page de connexion
    window.location.href = '/login';
  }

  // Obtenir le token valide
  getValidToken(): string | null {
    if (!this.authState.isAuthenticated || !this.authState.token || !this.authState.tokenExpiry) {
      return null;
    }

    // Vérifier l'expiration
    if (Date.now() >= this.authState.tokenExpiry - this.TOKEN_EXPIRY_BUFFER) {
      console.warn('Token expiré - déconnexion automatique');
      this.logout();
      return null;
    }

    return this.authState.token;
  }

  // Vérifier l'authentification
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && this.getValidToken() !== null;
  }

  // Headers d'authentification pour les requêtes
  getAuthHeaders(): Record<string, string> {
    const token = this.getValidToken();
    if (!token) {
      throw new Error('Token d\'authentification manquant ou expiré');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Programmer la déconnexion automatique
  private scheduleAutoLogout(): void {
    if (!this.authState.tokenExpiry) return;

    const timeUntilExpiry = this.authState.tokenExpiry - Date.now() - this.TOKEN_EXPIRY_BUFFER;
    
    if (timeUntilExpiry > 0) {
      setTimeout(() => {
        this.logout();
      }, timeUntilExpiry);
    }
  }

  // Vérifier périodiquement la validité du token
  startTokenValidation(): void {
    setInterval(() => {
      if (this.authState.isAuthenticated && !this.getValidToken()) {
        this.logout();
      }
    }, 60000); // Vérification toutes les minutes
  }
}

export const authService = new AuthService(); 