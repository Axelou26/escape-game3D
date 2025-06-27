# Escape Game 3D

Jeu d'évasion interactif en 3D avec interface web moderne, développé avec React et Three.js.

## 🎮 Aperçu

Un jeu d'évasion immersif en 3D où les joueurs naviguent dans différentes salles (bibliothèque, laboratoire, chambre secrète) pour résoudre des énigmes et progresser dans l'aventure.

## 🏗️ Architecture du Projet

```
escape-game3D/
├── client/                 # Application frontend React + Three.js
│   ├── public/            # Fichiers statiques
│   └── src/               # Code source React
│       ├── components/    # Composants React
│       │   ├── 3d/       # Scènes 3D (Three.js)
│       │   ├── ui/       # Interface utilisateur
│       │   └── game/     # Logique de jeu
│       ├── pages/         # Pages de l'application
│       ├── services/      # Services API et gestion d'état
│       ├── types/         # Types TypeScript
│       └── utils/         # Utilitaires et helpers
│
├── server/                # Serveur backend Node.js
│   └── src/              # Code source du serveur
│       ├── controllers/  # Contrôleurs API
│       ├── models/       # Modèles Sequelize
│       ├── routes/       # Routes API
│       ├── middleware/   # Middleware Express
│       ├── database/     # Configuration base de données
│       └── config/       # Configuration serveur
│
└── public/               # Assets partagés
```

## 🛠️ Technologies

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Three.js** - Graphiques 3D
- **Material-UI** - Composants UI
- **React Router** - Navigation
- **Axios** - Requêtes HTTP
- **Socket.io** - Communication temps réel

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Typage statique
- **Sequelize** - ORM pour base de données
- **MySQL** - Base de données
- **JWT** - Authentification
- **Socket.io** - WebSocket
- **bcrypt** - Hachage des mots de passe

## 🚀 Installation rapide

1. **Cloner le repository**
   ```bash
   git clone [votre-repo]
   cd escape-game3D
   ```

2. **Installer les dépendances**
   ```bash
   # Dépendances racine
   npm install

   # Dépendances client
   cd client
   npm install
   cd ..

   # Dépendances serveur
   cd server
   npm install
   cd ..
   ```

3. **Configuration de la base de données**
   - Installer MySQL
   - Créer une base de données `escape_game`
   - Configurer les variables d'environnement dans `server/.env`

   # mes env :
      
      PORT=3001
      NODE_ENV=development
      
      
      DB_HOST=localhost
      DB_USER=root
      DB_PASSWORD=azerty-26
      DB_NAME=escape_game
      
      
      JWT_SECRET=dfrtyrer_5245_dfseFR
      JWT_EXPIRES_IN=24h
      
      CLIENT_URL=http://localhost:3000
      
      API_URL=http://localhost:3001/api


4. **Démarrer l'application**
   ```bash
   # Terminal 1 : Serveur backend
   cd server
   npm run dev

   # Terminal 2 : Client frontend
   cd client
   npm start
   ```

   - Frontend : [http://localhost:3000](http://localhost:3000)
   - Backend API : [http://localhost:3001](http://localhost:3001)

## 📋 Scripts disponibles

### Scripts racine
- `npm start` - Démarre le client React
- `npm run build` - Compile le client pour la production
- `npm test` - Lance les tests du client

### Scripts serveur (`cd server/`)
- `npm run dev` - Serveur en mode développement
- `npm run build` - Compile le serveur TypeScript
- `npm start` - Démarre le serveur compilé
- `npm run seed` - Initialise les données de test

### Scripts client (`cd client/`)
- `npm start` - Serveur de développement React
- `npm run build` - Build de production
- `npm test` - Tests unitaires

## 🎯 Fonctionnalités principales

- **Environnement 3D immersif** avec Three.js
- **Système d'authentification** sécurisé
- **Multiples salles** : Bibliothèque, Laboratoire, Chambre secrète
- **Énigmes interactives** et puzzles
- **Système d'inventaire** pour collecter des objets
- **Sauvegarde automatique** de la progression
- **Tableau des scores** et classements
- **Interface responsive** adaptée à tous les écrans

## 🗄️ Base de données

Le projet utilise MySQL avec Sequelize ORM. Les principales tables :
- `users` - Utilisateurs et authentification
- `games` - Sessions de jeu
- `riddles` - Énigmes et solutions
- `code_puzzles` - Puzzles à code
- `score_events` - Événements de score

## 🔒 Sécurité

- Authentification JWT
- Hachage bcrypt pour les mots de passe
- Validation des données d'entrée
- Protection CORS
- Rate limiting sur les API
- Logs de sécurité

## 🧪 Tests

```bash
# Tests frontend
cd client && npm test

# Tests backend
cd server && npm test
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout: nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 
