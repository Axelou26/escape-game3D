# Escape Game

Application de jeu d'évasion interactive.

## Structure du Projet

```
escape-game/
├── client/                 # Application frontend React
│   ├── public/            # Fichiers statiques
│   └── src/               # Code source React
│       ├── components/    # Composants React
│       ├── pages/         # Pages de l'application
│       ├── assets/        # Images, styles, etc.
│       ├── utils/         # Utilitaires et helpers
│       └── types/         # Types TypeScript
│
├── server/                # Serveur backend Node.js
│   └── src/              # Code source du serveur
│       ├── controllers/  # Contrôleurs
│       ├── models/       # Modèles de données
│       ├── routes/       # Routes API
│       ├── services/     # Services métier
│       └── utils/        # Utilitaires
│
└── shared/               # Code partagé entre client et serveur
    └── types/           # Types TypeScript partagés

```

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- Base de données (selon votre configuration)

## Installation

1. Cloner le repository :
   ```bash
   git clone [votre-repo]
   cd escape-game
   ```

2. Installer les dépendances :
   ```bash
   # Installation des dépendances racine
   npm install

   # Installation des dépendances client
   cd client
   npm install

   # Installation des dépendances serveur
   cd ../server
   npm install
   ```

3. Configuration :
   - Copier `.env.example` vers `.env` dans le dossier serveur
   - Ajuster les variables d'environnement selon vos besoins

4. Démarrer l'application :
   ```bash
   # Démarrer le serveur de développement
   npm run dev
   ```

## Scripts Disponibles

- `npm run dev` : Démarre l'application en mode développement
- `npm run build` : Compile l'application pour la production
- `npm run test` : Lance les tests
- `npm run lint` : Vérifie le code avec ESLint

## Technologies Utilisées

- Frontend :
  - React
  - TypeScript
  - Material-UI

- Backend :
  - Node.js
  - Express
  - TypeScript
  - Sequelize

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 