# Escape Game - Frontend

Interface utilisateur du jeu d'évasion en ligne, développée avec React et Three.js.

## 🛠️ Technologies

- React 18
- TypeScript
- Three.js pour les graphiques 3D
- Styled-components pour le styling
- React Router pour la navigation
- Axios pour les requêtes API
- JWT pour l'authentification

## 📋 Structure des composants

```
src/
├── components/
│   ├── 3d/           # Composants Three.js
│   │   ├── Room/     # Scènes 3D des salles
│   │   ├── Objects/  # Objets 3D interactifs
│   │   └── Effects/  # Effets visuels
│   ├── ui/           # Interface utilisateur
│   │   ├── Auth/     # Composants d'authentification
│   │   ├── Game/     # Interface de jeu
│   │   └── Common/   # Composants réutilisables
│   └── game/         # Logique de jeu
├── hooks/            # Hooks personnalisés
├── services/         # Services API
├── contexts/         # Contextes React
├── utils/           # Fonctions utilitaires
└── types/           # Types TypeScript
```

## 🚀 Installation

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Variables d'environnement**
   - Copier `.env.example` vers `.env`
   - Configurer les variables :
     ```env
     REACT_APP_API_URL=http://localhost:3001
     REACT_APP_WEBSOCKET_URL=ws://localhost:3001
     ```

3. **Démarrer en développement**
   ```bash
   npm start
   ```
   L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📝 Scripts disponibles

### `npm start`
Lance l'application en mode développement.
- Hot reload activé
- Lint errors dans la console

### `npm test`
Lance les tests unitaires en mode watch.
- Utilise Jest et React Testing Library
- Couverture de code avec `npm test -- --coverage`

### `npm run build`
Compile l'application pour la production.
- Optimisation des performances
- Minification du code
- Génération des fichiers statiques dans `build/`

### `npm run lint`
Vérifie le code avec ESLint.
- Règles TypeScript
- Règles React
- Formatage automatique

## 🎮 Fonctionnalités principales

- **Interface 3D interactive**
  - Navigation fluide
  - Objets interactifs
  - Effets visuels

- **Système d'authentification**
  - Inscription/Connexion
  - Gestion de session
  - Protection des routes

- **Gestion du jeu**
  - Sauvegarde automatique
  - Système d'inventaire
  - Progression du joueur

- **Interface utilisateur**
  - Design responsive
  - Thème sombre/clair
  - Animations fluides

## 🔍 Tests

Les tests sont organisés par composant :
```
src/
└── __tests__/
    ├── components/
    ├── hooks/
    └── utils/
```

Pour lancer les tests :
```bash
# Tests unitaires
npm test

# Couverture de code
npm test -- --coverage

# Test d'un composant spécifique
npm test -- ComponentName
```

## 📚 Documentation

La documentation des composants est générée avec Storybook :
```bash
# Lancer Storybook
npm run storybook
```

## 🐛 Débogage

1. Utiliser les React DevTools
2. Logs de développement avec `DEBUG=true`
3. Tests unitaires ciblés
4. Inspection des requêtes réseau

## 🔄 Workflow de développement

1. Créer une branche feature
2. Développer et tester localement
3. Lancer les tests et le linting
4. Créer une Pull Request
5. Review et merge
