# Escape Game 3D - Frontend

Interface utilisateur immersive du jeu d'évasion en 3D, développée avec React et Three.js pour une expérience de jeu moderne et interactive.

## 🎮 Aperçu

Application web React avec environnements 3D navigables permettant aux joueurs d'explorer différentes salles (bibliothèque, laboratoire, chambre secrète) et de résoudre des énigmes interactives.

## 🛠️ Technologies

- **React 18** - Framework UI moderne
- **TypeScript** - Typage statique pour un code robuste
- **Three.js** - Moteur 3D pour les graphiques immersifs
- **@react-three/fiber** - Intégration React-Three.js
- **Material-UI** - Composants d'interface utilisateur
- **React Router** - Navigation entre les pages
- **Axios** - Client HTTP pour les requêtes API
- **Socket.io-client** - Communication temps réel
- **JWT** - Gestion des tokens d'authentification

## 🏗️ Structure des composants

```
src/
├── components/
│   ├── 3d/                    # Composants Three.js
│   │   ├── Bibliotheque3D/    # Scène de la bibliothèque
│   │   ├── LaboratoireScene/  # Scène du laboratoire
│   │   ├── SecretChamber3D/   # Chambre secrète
│   │   └── BibliothequeScene.tsx
│   ├── ui/                    # Interface utilisateur
│   │   ├── GameHUD/          # Interface de jeu principale
│   │   ├── Inventory/        # Système d'inventaire
│   │   ├── BookContent/      # Contenu des livres
│   │   ├── CodeInput/        # Saisie de codes
│   │   ├── Leaderboard/      # Tableau des scores
│   │   ├── PauseMenu/        # Menu pause
│   │   ├── FPSCounter/       # Compteur FPS
│   │   └── GameOverMessage/  # Messages de fin
│   ├── ErrorBoundary/        # Gestion d'erreurs
│   └── EscapeGame.tsx        # Composant principal
├── pages/                     # Pages de l'application
│   ├── GameIntro.tsx         # Introduction du jeu
│   ├── Login.tsx            # Connexion
│   └── Register.tsx         # Inscription
├── services/                 # Services et API
│   ├── authService.ts       # Authentification
│   ├── gameApi.ts          # API de jeu
│   ├── gameStateApi.ts     # Gestion d'état
│   ├── inventoryService.ts # Inventaire
│   ├── scoreService.ts     # Scores
│   └── secureTimer.ts      # Timer sécurisé
├── types/                   # Types TypeScript
│   ├── gameTypes.ts        # Types de jeu
│   └── gameState.ts        # États du jeu
└── utils/                  # Utilitaires
    └── errorHandler.ts     # Gestion d'erreurs
```

## 🚀 Installation

1. **Prérequis**
   - Node.js 16+ 
   - npm ou yarn
   - Serveur backend en cours d'exécution

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Variables d'environnement**
   Créez un fichier `.env` dans le dossier client :
   ```env
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_WEBSOCKET_URL=ws://localhost:3001
   REACT_APP_GAME_VERSION=1.0.0
   ```

4. **Démarrer en développement**
   ```bash
   npm start
   ```
   L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📝 Scripts disponibles

### `npm start`
Lance l'application en mode développement.
- Hot reload activé
- Affichage des erreurs lint dans la console
- Rechargement automatique à chaque modification

### `npm test`
Lance les tests unitaires en mode watch.
- Utilise Jest et React Testing Library
- Tests des composants React et fonctions utilitaires
- Couverture de code avec `npm test -- --coverage`

### `npm run build`
Compile l'application pour la production.
- Optimisation automatique des performances
- Minification et bundling du code
- Génération des fichiers statiques dans `build/`
- Optimisation des assets 3D

### `npm run eject`
⚠️ **Opération irréversible** - Expose la configuration Webpack

## 🎮 Fonctionnalités principales

### Interface 3D Interactive
- **Navigation fluide** dans les environnements 3D
- **Contrôles FPS** avec déplacement WASD et souris
- **Objets interactifs** avec détection de collision
- **Éclairage dynamique** et effets visuels
- **Animations** fluides des objets et transitions

### Système de Jeu
- **Authentification sécurisée** avec JWT
- **Sauvegarde automatique** de la progression
- **Système d'inventaire** pour collecter des objets
- **Timer intelligent** avec pénalités et bonus
- **Progression multi-niveaux** à travers les salles

### Interface Utilisateur
- **HUD de jeu** avec informations temps réel
- **Inventaire visuel** avec emojis et descriptions
- **Messages contextuels** pour les interactions
- **Menu pause** avec options de jeu
- **Tableau des scores** en temps réel
- **Compteur FPS** pour le monitoring des performances

### Système d'Énigmes
- **Puzzles interactifs** dans l'environnement 3D
- **Codes secrets** à saisir
- **Indices progressifs** pour aider les joueurs
- **Validation côté serveur** pour la sécurité

## 🔍 Tests

Les tests sont organisés par type de composant :
```
src/
└── __tests__/
    ├── components/
    │   ├── 3d/
    │   └── ui/
    ├── services/
    ├── utils/
    └── pages/
```

### Commandes de test
```bash
# Tests unitaires
npm test

# Tests avec couverture de code
npm test -- --coverage

# Test d'un composant spécifique
npm test -- GameHUD

# Tests en mode watch
npm test -- --watchAll
```

## 🎨 Développement 3D

### Optimisation des performances
- **Frustum culling** pour les objets hors écran
- **Level of Detail (LOD)** pour les objets distants
- **Texture compression** pour réduire la mémoire
- **Batching** des rendus similaires

### Outils de débogage
- **Stats.js** intégré pour le monitoring FPS
- **Three.js DevTools** pour l'inspection 3D
- **React DevTools** pour les composants
- **Console logs** détaillés en mode développement

## 🔄 Workflow de développement

1. **Créer une branche feature**
   ```bash
   git checkout -b feature/nouvelle-fonctionnalite
   ```

2. **Développer localement**
   - Utiliser le hot reload pour les tests rapides
   - Tester sur différentes résolutions d'écran
   - Vérifier les performances 3D

3. **Tests et validation**
   ```bash
   npm test
   npm run build  # Vérifier que le build fonctionne
   ```

4. **Pull Request**
   - Décrire les changements 3D/UI
   - Inclure des captures d'écran si pertinent
   - Tester sur différents navigateurs

## 🌐 Compatibilité navigateurs

- **Chrome 90+** (Recommandé)
- **Firefox 88+**
- **Safari 14+**
- **Edge 90+**

⚠️ **WebGL requis** pour les fonctionnalités 3D

## 🐛 Débogage

### Problèmes courants
1. **Performance 3D lente**
   - Vérifier le compteur FPS
   - Réduire la qualité graphique si nécessaire
   - Fermer les autres onglets

2. **Erreurs WebGL**
   - Vérifier la compatibilité du navigateur
   - Mettre à jour les drivers graphiques
   - Redémarrer le navigateur

3. **Problèmes de connexion**
   - Vérifier que le serveur backend fonctionne
   - Contrôler les variables d'environnement
   - Inspecter les requêtes réseau dans DevTools

### Outils de débogage
- **React DevTools** pour les composants
- **Three.js Inspector** pour les scènes 3D
- **Network tab** pour les requêtes API
- **Console** pour les logs détaillés

## 📚 Ressources utiles

- [Documentation Three.js](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Material-UI Documentation](https://mui.com/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 🚀 Optimisation de production

### Build optimisé
```bash
npm run build
```
- Code splitting automatique
- Tree shaking des dépendances
- Compression des assets 3D
- Minification JavaScript/CSS

### Déploiement
- Compatible avec Netlify, Vercel, AWS S3
- Serveur statique pour les fichiers build
- Configuration HTTPS recommandée
- CDN pour les assets 3D volumineux
