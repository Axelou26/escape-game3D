# 🎮 Fonctionnement de votre Escape Game 3D

Documentation complète du fonctionnement de l'application et localisation des fonctions principales.

## 🏗️ Architecture Générale

Votre application est un **jeu d'évasion immersif en 3D** avec une architecture **client-serveur** :

**Frontend (Client React)** ↔️ **Backend (Serveur Node.js)** ↔️ **Base de données MySQL**

---

## 📁 CÔTÉ CLIENT (React + Three.js)

### 🎯 Point d'entrée principal
- **Fichier** : `client/src/App.tsx`
- **Fonction principale** : `App()` - Gère l'authentification et les routes
- **Fonctions clés** :
  - Navigation entre les pages (Login, Jeu, Leaderboard)
  - Vérification de l'authentification via localStorage
  - Protection des routes

### 🎮 Composant principal du jeu
- **Fichier** : `client/src/components/EscapeGame.tsx`
- **Fonction principale** : `EscapeGame()` - Orchestre tout le gameplay
- **Fonctions importantes** :
  - `saveGameState()` - Sauvegarde automatique de l'état du jeu
  - `updateGameState()` - Met à jour l'état du jeu avec protection anti-corruption
  - `handleScoreUpdate()` - Gestion des événements de score
  - `initializeGame()` - Initialisation complète du jeu
  - `endGame()` - Finalisation de la partie
  - `syncInventoryWithServer()` - Synchronisation de l'inventaire
  - `handleUseItem()` - Utilisation d'objets de l'inventaire
  - `handleRestart()` - Redémarrage du jeu

### 🌍 Scènes 3D (Three.js)
- **Bibliothèque** : `client/src/components/3d/BibliothequeScene.tsx`
  - Première salle du jeu avec livres interactifs
- **Laboratoire** : `client/src/components/3d/LaboratoireScene/index.tsx`
  - Salle scientifique avec microscope et tableau périodique
- **Chambre secrète** : `client/src/components/3d/SecretChamber3D/SecretChamber3D.tsx`
  - Salle finale avec artefact

### 🎨 Interface utilisateur
- **Inventaire** : `client/src/components/ui/Inventory/Inventory.tsx`
  - Gestion des objets collectés
- **HUD de jeu** : `client/src/components/ui/GameHUD/GameHUD.tsx`
  - Interface principale avec score, temps, boutons
- **Saisie de codes** : `client/src/components/ui/CodeInput/CodeInput.tsx`
  - Interface pour entrer les codes secrets
- **Contenu des livres** : `client/src/components/ui/BookContent/BookContent.tsx`
  - Affichage du contenu des livres interactifs
- **Contenu des énigmes** : `client/src/components/ui/RiddleContent/RiddleContent.tsx`
  - Interface pour résoudre les énigmes
- **Menu pause** : `client/src/components/ui/PauseMenu/PauseMenu.tsx`
- **Compteur FPS** : `client/src/components/ui/FPSCounter/FPSCounter.tsx`
- **Messages de succès/échec** : `client/src/components/ui/SuccessMessage/` et `GameOverMessage/`

### 📡 Services de communication
- **API de jeu** : `client/src/services/gameApi.ts`
  - `getRiddlesByRoom()` - Récupère les énigmes par salle
  - `validateRiddleAnswer()` - Valide les réponses aux énigmes
  - `validateCode()` - Valide les codes saisis
  - `addScoreEvent()` - Ajoute des événements de score
  - `getCodePuzzlesByRoom()` - Récupère les puzzles par salle
  - `getRiddleHint()` - Obtient des indices pour les énigmes

- **Service de score** : `client/src/services/scoreService.ts`
  - Gestion centralisée des points et événements de score

- **API d'état de jeu** : `client/src/services/gameStateApi.ts`
  - Synchronisation de l'état entre client et serveur

- **Service d'inventaire** : `client/src/services/inventoryService.ts`
  - Gestion des objets dans l'inventaire

- **Service d'authentification** : `client/src/services/authService.ts`
  - Gestion de la connexion et des tokens

### 📄 Pages
- **Introduction** : `client/src/pages/GameIntro.tsx`
- **Connexion** : `client/src/pages/Login.tsx`
- **Inscription** : `client/src/pages/Register.tsx`

### 🔧 Types et configuration
- **Types de jeu** : `client/src/types/gameTypes.ts`
- **État de jeu** : `client/src/types/gameState.ts`
- **Configuration** : `client/src/config.ts`

---

## 🖥️ CÔTÉ SERVEUR (Node.js + Express)

### 🚀 Point d'entrée serveur
- **Fichier principal** : `server/src/app.ts`
  - Configuration CORS, middleware, routes principales
- **Démarrage** : `server/src/index.ts`

### 🛣️ Routes API
- **Configuration** : `server/src/routes/index.ts`
- **Routes disponibles** :
  - `/api/auth` - Authentification (`server/src/routes/auth.routes.ts`)
  - `/api/game` - Gestion des parties (`server/src/routes/game.routes.ts`)
  - `/api/riddles` - Énigmes (`server/src/routes/riddle.routes.ts`)
  - `/api/codes` - Puzzles à codes (`server/src/routes/code-puzzle.routes.ts`)
  - `/api/score` - Système de score (`server/src/routes/score.routes.ts`)
  - `/api/leaderboard` - Classements (`server/src/routes/leaderboard.routes.ts`)
  - `/api/game-state` - État du jeu (`server/src/routes/game-state.routes.ts`)

### 🎮 Contrôleurs
- **Jeu principal** : `server/src/controllers/game.controller.ts`
  - `startGame()` - Démarre une nouvelle partie
  - `getCurrentGame()` - Récupère la partie en cours
  - `saveGame()` - Sauvegarde l'état du jeu
  - `endGame()` - Termine la partie
  - `resetGame()` - Remet à zéro le jeu
  - `getLeaderboard()` - Récupère le classement

- **Authentification** : `server/src/controllers/auth.controller.ts`
  - `register()` - Inscription d'un nouvel utilisateur
  - `login()` - Connexion utilisateur
  - `logout()` - Déconnexion

- **Énigmes** : `server/src/controllers/riddle.controller.ts`
  - `getRiddlesByRoom()` - Récupère les énigmes d'une salle
  - `getRiddleById()` - Récupère une énigme spécifique
  - `validateAnswer()` - Valide une réponse
  - `getHint()` - Fournit un indice

- **Codes/Puzzles** : `server/src/controllers/code-puzzle.controller.ts`
  - `getCodePuzzlesByRoom()` - Récupère les puzzles d'une salle
  - `validateCode()` - Valide un code saisi
  - `getHint()` - Fournit des indices

- **Scores** : `server/src/controllers/score.controller.ts`
  - `addScoreEvent()` - Ajoute un événement de score
  - `getCurrentScore()` - Récupère le score actuel
  - `addTimePenalty()` - Ajoute une pénalité de temps

- **État du jeu** : `server/src/controllers/game-state.controller.ts`
  - Gestion de la synchronisation d'état

- **Classements** : `server/src/controllers/leaderboard.controller.ts`
  - Gestion des tableaux de scores

### 💾 Modèles de données (Sequelize)
- **Utilisateur** : `server/src/models/user.model.ts`
- **Jeu** : `server/src/models/game.model.ts`
- **Énigmes** : `server/src/models/riddle.model.ts`
- **Puzzles** : `server/src/models/code-puzzle.model.ts`
- **Événements de score** : `server/src/models/score-event.model.ts`
- **Salles** : `server/src/models/room.model.ts`

### 🔐 Middleware de sécurité
- **Authentification JWT** : `server/src/middleware/auth.ts`
- **Validation des données** : `server/src/middleware/dataValidation.ts`
- **Rate limiting** : `server/src/middleware/rateLimiter.ts`
- **Authentification sécurisée** : `server/src/middleware/secureAuth.ts`
- **Logs de sécurité** : `server/src/middleware/securityLogger.ts`
- **Gestion d'erreurs** : `server/src/middleware/errorHandler.ts`

### ⚙️ Configuration
- **Configuration générale** : `server/src/config/config.js`
- **Configuration du jeu** : `server/src/config/gameConfig.ts`
- **Données initiales** : `server/src/config/seedData.ts`

### 🗄️ Base de données
- **Configuration** : `server/src/database/db.ts`
- **Migrations** : `server/src/migrations/`
- **Scripts** : `server/src/scripts/populate-riddles.ts`

---

## 🔄 Flux de données typique

### 1. **Connexion utilisateur**
```
Login.tsx → authService.ts → auth.controller.ts → user.model.ts → Base de données
```

### 2. **Démarrage du jeu**
```
EscapeGame.tsx → gameApi.ts → game.controller.ts → game.model.ts → Base de données
```

### 3. **Interaction 3D**
```
Scène Three.js → EscapeGame.tsx → gameApi.ts → Contrôleurs serveur → Base de données
```

### 4. **Résolution d'énigme**
```
RiddleContent.tsx → gameApi.ts → riddle.controller.ts → riddle.model.ts → Base de données
Score mis à jour → score.controller.ts → score-event.model.ts
```

### 5. **Sauvegarde automatique**
```
updateGameState() → saveGameState() → gameApi.ts → game.controller.ts → Base de données
```

### 6. **Gestion des scores**
```
Action joueur → scoreService.ts → gameApi.ts → score.controller.ts → Base de données
```

---

## 🎯 Fonctionnalités principales

### 🌍 **Environnement 3D immersif**
- Navigation fluide entre 3 salles (Bibliothèque, Laboratoire, Chambre secrète)
- Interactions avec objets 3D
- Contrôles au clavier et souris

### 🧩 **Système d'énigmes**
- Énigmes textuelles avec validation côté serveur
- Puzzles à codes numériques
- Système d'indices avec pénalités
- Progression sauvegardée

### 🎒 **Inventaire**
- Collection d'objets interactifs
- Utilisation d'objets pour débloquer contenu
- Synchronisation temps réel avec le serveur

### 💾 **Sauvegarde automatique**
- État du jeu sauvegardé en continu
- Reprise de partie possible
- Protection contre la corruption de données

### 🏆 **Système de score**
- Points pour résolutions d'énigmes
- Pénalités pour indices et erreurs
- Bonus de temps
- Événements trackés

### 🔐 **Sécurité**
- Authentification JWT
- Validation des données
- Protection CORS
- Rate limiting
- Logs de sécurité

### 📊 **Classements**
- Tableau des meilleurs scores
- Comparaison des performances
- Historique des parties

---

## 🚀 Démarrage de l'application

### Prérequis
- Node.js installé
- MySQL configuré
- Dépendances installées (`npm install` dans `/client` et `/server`)

### Lancement
1. **Serveur** : `cd server && npm run dev` (port 3001)
2. **Client** : `cd client && npm start` (port 3000)

### URLs
- **Frontend** : http://localhost:3000
- **API Backend** : http://localhost:3001/api
- **Health check** : http://localhost:3001/api/health

---

## 📝 Notes techniques

- **Framework frontend** : React 18 + TypeScript + Three.js
- **Framework backend** : Node.js + Express + TypeScript
- **Base de données** : MySQL avec Sequelize ORM
- **Authentification** : JWT (JSON Web Tokens)
- **Communication** : REST API + WebSocket (Socket.io)
- **3D** : Three.js pour le rendu 3D
- **UI** : Material-UI pour l'interface

Cette architecture garantit une expérience de jeu fluide, sécurisée et scalable ! 