# Serveur Escape Game 3D

Serveur backend pour le jeu d'évasion 3D, fournissant une API REST sécurisée avec authentification JWT et communication temps réel via WebSocket.

## 🛠️ Technologies utilisées

- **Node.js** avec Express
- **TypeScript** pour le typage statique
- **MySQL** avec Sequelize ORM
- **JWT** pour l'authentification sécurisée
- **Socket.io** pour la communication temps réel
- **bcrypt** pour le hachage des mots de passe
- **Express Rate Limit** pour la protection anti-spam
- **CORS** pour la sécurité cross-origin

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <url-du-repo>
cd server
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de la base de données**
   - Installer MySQL Server
   - Créer une base de données `escape_game`
   - Configurer les variables d'environnement

4. **Variables d'environnement**
Créez un fichier `.env` à la racine du projet :
```env
# Configuration du serveur
PORT=3001
NODE_ENV=development

# Configuration de la base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=escape_game
DB_USER=root
DB_PASSWORD=votre-mot-de-passe

# Configuration JWT
JWT_SECRET=votre-secret-jwt-super-securise-et-long
JWT_EXPIRES_IN=24h

# Configuration du client
CLIENT_URL=http://localhost:3000

# Configuration de sécurité
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

5. **Initialiser la base de données**
```bash
# Synchroniser les modèles
npm run build
npm run migrate

# Peupler avec des données de test
npm run seed
```

6. **Démarrer le serveur**
```bash
# Mode développement (avec hot reload)
npm run dev

# Mode production
npm run build
npm start
```

## 🏗️ Structure du projet

```
server/
├── src/
│   ├── controllers/      # Logique métier et contrôleurs API
│   │   ├── auth.controller.ts
│   │   ├── game.controller.ts
│   │   ├── riddle.controller.ts
│   │   └── score.controller.ts
│   ├── middleware/       # Middleware Express
│   │   ├── auth.ts
│   │   ├── rateLimiter.ts
│   │   └── securityLogger.ts
│   ├── models/          # Modèles Sequelize
│   │   ├── user.model.ts
│   │   ├── game.model.ts
│   │   └── riddle.model.ts
│   ├── routes/          # Routes API organisées
│   │   ├── auth.routes.ts
│   │   ├── game.routes.ts
│   │   └── riddle.routes.ts
│   ├── database/        # Configuration base de données
│   │   └── db.ts
│   ├── config/          # Configuration serveur
│   │   ├── gameConfig.ts
│   │   └── seedData.ts
│   └── index.ts         # Point d'entrée principal
├── dist/                # Code TypeScript compilé
└── package.json
```

## 🔌 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/logout` - Déconnexion utilisateur
- `GET /api/auth/profile` - Profil utilisateur actuel

### Gestion du jeu
- `GET /api/game/start` - Démarrer une nouvelle partie
- `POST /api/game/save` - Sauvegarder l'état du jeu
- `GET /api/game/load` - Charger l'état du jeu
- `POST /api/game/complete` - Terminer une partie

### Énigmes et puzzles
- `GET /api/riddles` - Liste des énigmes
- `GET /api/riddles/:id` - Détails d'une énigme
- `POST /api/riddles/:id/solve` - Résoudre une énigme
- `GET /api/code-puzzles` - Puzzles à code
- `POST /api/code-puzzles/:id/verify` - Vérifier un code

### Scores et classements
- `GET /api/scores/leaderboard` - Tableau des scores
- `POST /api/scores/submit` - Soumettre un score
- `GET /api/scores/user/:userId` - Scores d'un utilisateur

### Timer et progression
- `POST /api/timer/start` - Démarrer le timer
- `POST /api/timer/pause` - Mettre en pause
- `GET /api/timer/status` - État du timer

## 🔄 WebSocket Events

### Événements client → serveur
- `JOIN_GAME` - Rejoindre une session de jeu
- `GAME_ACTION` - Action dans le jeu (mouvement, interaction)
- `CHAT_MESSAGE` - Message de chat
- `PAUSE_GAME` - Mettre en pause

### Événements serveur → client
- `GAME_UPDATE` - Mise à jour de l'état du jeu
- `CHAT_MESSAGE` - Diffusion de message
- `TIMER_UPDATE` - Mise à jour du timer
- `PLAYER_JOINED` - Nouveau joueur connecté

## 🗄️ Modèles de données

### User
- `id`, `username`, `email`, `password_hash`
- `created_at`, `updated_at`

### Game
- `id`, `user_id`, `current_room`, `status`
- `start_time`, `end_time`, `total_score`

### Riddle
- `id`, `room_id`, `title`, `description`
- `solution`, `hint`, `points`

### CodePuzzle
- `id`, `room_id`, `code_sequence`
- `is_active`, `points`

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests avec couverture
npm test -- --coverage

# Tests en mode watch
npm test -- --watch
```

## 🔒 Sécurité

### Authentification
- Tokens JWT avec expiration
- Hachage bcrypt (12 rounds)
- Validation des sessions

### Protection API
- Rate limiting (100 req/15min par IP)
- Validation des données d'entrée
- Sanitisation des requêtes SQL
- Headers de sécurité (CORS, CSP)

### Logs de sécurité
- Tentatives de connexion
- Erreurs d'authentification
- Requêtes suspectes
- Accès aux ressources sensibles

## 📊 Monitoring

Le serveur inclut :
- Logs détaillés avec timestamps
- Métriques de performance
- Surveillance des erreurs
- Alertes de sécurité

## 🚀 Déploiement

### Prérequis production
- Node.js 16+
- MySQL 8.0+
- Serveur web (nginx recommandé)
- Certificat SSL

### Variables d'environnement production
```env
NODE_ENV=production
PORT=3001
DB_HOST=votre-serveur-mysql
JWT_SECRET=secret-production-tres-long-et-securise
CLIENT_URL=https://votre-domaine.com
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Développer avec tests unitaires
4. Vérifier la sécurité et les performances
5. Commit avec messages descriptifs (`git commit -m 'Ajout: nouvelle fonctionnalité'`)
6. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
7. Créer une Pull Request avec description détaillée

## 📋 Scripts disponibles

- `npm run dev` - Développement avec hot reload
- `npm run build` - Compilation TypeScript
- `npm start` - Démarrage production
- `npm test` - Tests unitaires
- `npm run seed` - Données de test
- `npm run migrate` - Migrations base de données

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 