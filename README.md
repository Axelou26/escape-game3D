# Escape Game - Jeu d'évasion en ligne

Un jeu d'évasion immersif où les joueurs doivent résoudre des énigmes dans un environnement mystérieux.

## 🎮 Fonctionnalités

- **Authentification** : Système de connexion/inscription sécurisé
- **Progression** : Sauvegarde automatique de la progression
- **Score** : Système de points basé sur le temps et les actions
- **Classement** : Tableau des meilleurs scores
- **Interface 3D** : Navigation immersive dans l'environnement de jeu
- **Inventaire** : Gestion des objets collectés
- **Énigmes** : Puzzles variés à résoudre

## 🛠️ Technologies

### Frontend
- React
- Three.js pour la 3D
- TypeScript
- Styled-components

### Backend
- Node.js
- Express
- TypeScript
- Sequelize (MySQL)
- JWT pour l'authentification

## 📋 Prérequis

- Node.js (v14 ou supérieur)
- MySQL (v8 ou supérieur)
- npm ou yarn

## 🚀 Installation

1. **Cloner le projet**
   ```bash
   git clone https://github.com/axelou26/escape-game.git
   cd escape-game
   ```

2. **Configuration de la base de données**
   - Créer une base de données MySQL nommée 'escape_game'
   - Copier `.env.example` vers `.env` dans le dossier `server`
   - Modifier les variables d'environnement dans `.env`

3. **Installation des dépendances**
   ```bash
   # Installation des dépendances du serveur
   cd server
   npm install

   # Installation des dépendances du client
   cd ../client
   npm install
   ```

4. **Démarrage en développement**
   ```bash
   # Dans le dossier server
   npm run dev

   # Dans le dossier client (nouvelle fenêtre de terminal)
   npm start
   ```

## 📁 Structure du Projet

```
escape-game/
├── client/               # Application React (frontend)
│   ├── src/
│   │   ├── components/  # Composants React
│   │   │   ├── 3d/     # Composants Three.js
│   │   │   ├── ui/     # Interface utilisateur
│   │   │   └── game/   # Logique de jeu
│   │   ├── hooks/      # Hooks React personnalisés
│   │   └── services/   # Services API
│   └── public/         # Ressources statiques
│
└── server/              # Serveur Express (backend)
    ├── src/
    │   ├── config/     # Configuration
    │   ├── controllers/# Contrôleurs
    │   ├── middleware/ # Middlewares
    │   ├── models/     # Modèles Sequelize
    │   ├── routes/     # Routes API
    │   └── types/      # Types TypeScript
    └── .env            # Variables d'environnement
```

## 🎯 Points d'API Principaux

### Authentification
- `POST /api/auth/register` : Inscription
- `POST /api/auth/login` : Connexion
- `POST /api/auth/logout` : Déconnexion

### Jeu
- `POST /api/game/start` : Démarrer une partie
- `GET /api/game/current` : Récupérer la partie en cours
- `PUT /api/game/save` : Sauvegarder la progression
- `PUT /api/game/end` : Terminer la partie
- `GET /api/game/leaderboard` : Obtenir le classement

## 🔒 Variables d'Environnement

### Server (.env)
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=escape_game
JWT_SECRET=votre_secret_jwt
NODE_ENV=development
```

## 👥 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout d'une nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 