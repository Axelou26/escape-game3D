import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initModels } from './models';
import { sequelize } from './models/sequelize';

dotenv.config();

const app = express();
const server = createServer(app);

// Middleware de base
app.use(cors());
app.use(express.json());

// Configuration des routes API
setupRoutes(app);

// Middleware de gestion des erreurs global
app.use(errorHandler);

// Middleware de gestion d'erreur global
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Erreur globale:', err);
  res.setHeader('Content-Type', 'application/json');
  res.status(500).json({
    status: 'error',
    message: err.message || 'Une erreur est survenue'
  });
});

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../../client/build')));

// Route pour gérer toutes les autres requêtes vers le frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/build/index.html'));
});

const PORT = process.env.PORT || 3001;

// Connexion à la base de données et démarrage du serveur
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données établie avec succès.');

    // Initialiser les modèles et leurs associations
    await initModels();
    console.log('Modèles et associations initialisés avec succès.');

    server.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer(); 