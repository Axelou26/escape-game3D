import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import gameRoutes from './routes/game.routes';
import leaderboardRoutes from './routes/leaderboard.routes';

const app = express();

// Middleware pour le parsing JSON et CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API opérationnelle' });
});

export default app; 