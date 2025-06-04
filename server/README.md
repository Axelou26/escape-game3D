# Serveur Escape Game

Ce serveur fournit l'API backend pour le jeu d'évasion, gérant l'authentification, la progression du jeu et la communication en temps réel.

## Technologies utilisées

- Node.js avec Express
- TypeScript
- MongoDB avec Mongoose
- WebSocket pour la communication en temps réel
- JWT pour l'authentification

## Installation

1. Cloner le projet
```bash
git clone <url-du-repo>
cd server
```

2. Installer les dépendances
```bash
npm install
```

3. Configuration
Créez un fichier `.env` à la racine du projet avec les variables suivantes :
```
# Configuration du serveur
PORT=3001
NODE_ENV=development

# Configuration de la base de données
MONGODB_URI=mongodb://localhost:27017/escape-game

# Configuration JWT
JWT_SECRET=votre-secret-jwt-super-securise

# Configuration du client
CLIENT_URL=http://localhost:3000
```

4. Démarrer MongoDB
Assurez-vous que MongoDB est installé et en cours d'exécution sur votre machine.

5. Démarrer le serveur
```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

## Structure du projet

```
server/
├── src/
│   ├── controllers/    # Logique métier
│   ├── middleware/     # Middleware Express
│   ├── models/         # Modèles Mongoose
│   ├── routes/         # Routes API
│   ├── websocket/      # Gestionnaire WebSocket
│   └── index.ts        # Point d'entrée
├── dist/               # Code compilé
└── package.json
```

## API Endpoints

### Authentification
- POST `/api/auth/register` - Inscription
- POST `/api/auth/login` - Connexion
- POST `/api/auth/logout` - Déconnexion

### Jeu
- GET `/api/game/rooms` - Liste des salles
- GET `/api/game/rooms/:id` - Détails d'une salle
- POST `/api/game/rooms/:id/solve` - Résoudre une énigme

### Utilisateur
- GET `/api/users/profile` - Profil utilisateur
- PUT `/api/users/profile` - Mise à jour du profil

## WebSocket Events

- `JOIN_GAME` - Rejoindre une partie
- `GAME_ACTION` - Action dans le jeu
- `GAME_UPDATE` - Mise à jour de l'état du jeu
- `CHAT` - Message de chat

## Tests

```bash
npm test
```

## Sécurité

- Toutes les routes API sont protégées par JWT
- Les mots de passe sont hashés avec bcrypt
- Protection CORS configurée
- Validation des données entrantes
- Rate limiting sur les routes sensibles

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`)
4. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request 