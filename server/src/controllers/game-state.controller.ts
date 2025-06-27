import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import Game from '../models/game.model';
import { GAME_CONFIG } from '../config/gameConfig';
import db from '../database/db';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: string;
  content?: any;
}

interface GameStateData {
  currentRoom: string;
  inventory: InventoryItem[];
  score: number;
  elapsedTime: number;
  microscopeEnigmeResolved: boolean;
  periodicTableUnlocked?: boolean;
  unlockedRooms: string[];
  computerUnlocked?: boolean;
  gameCompleted?: boolean;
  artifactUnlocked?: boolean;
  hintsUsed?: number;
  attemptsCount?: number;
  solvedPuzzles: string[];
}

// Utilitaire pour traiter le contenu JSON de manière sécurisée
const parseItemContent = (itemContent: any): any => {
  if (!itemContent) return undefined;
  if (typeof itemContent === 'string') {
    try {
      return JSON.parse(itemContent);
    } catch (error) {
      return itemContent;
    }
  }
  return itemContent;
};

export const gameStateController = {
  // Valider l'ajout d'un objet à l'inventaire
  async addToInventory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Utilisateur non authentifié' });
      }

      const { itemId, itemType, itemName, itemDescription, itemContent } = req.body;

      if (!itemId || !itemType || !itemName) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Paramètres manquants (itemId, itemType, itemName requis)'
        });
      }

      // Vérifier si l'objet existe déjà
      const [existing] = await db.execute(
        'SELECT id FROM inventory WHERE user_id = ? AND item_id = ?',
        [userId, itemId]
      );

      if ((existing as any[]).length > 0) {
        // Au lieu d'une erreur, renvoyer l'inventaire actuel
        const [rows] = await db.execute(
          'SELECT item_id, item_type, item_name, item_description, item_content FROM inventory WHERE user_id = ? ORDER BY created_at ASC',
          [userId]
        );

        const inventory = (rows as any[]).map(row => ({
          id: row.item_id,
          type: row.item_type,
          name: row.item_name,
          description: row.item_description,
          content: parseItemContent(row.item_content)
        }));

        return res.status(409).json({
          status: 'warning',
          message: `Cet objet (${itemId}) est déjà dans l'inventaire`,
          inventory,
          alreadyExists: true
        });
      }

      // Vérifier la limite d'inventaire (20 objets max)
      const [countResult] = await db.execute(
        'SELECT COUNT(*) as count FROM inventory WHERE user_id = ?',
        [userId]
      );
      const currentCount = (countResult as any[])[0].count;

      if (currentCount >= 20) {
        return res.status(400).json({ 
          status: 'error', 
          message: `Inventaire plein (${currentCount}/20 objets)`
        });
      }

      // Ajouter l'objet à l'inventaire
      await db.execute(
        'INSERT INTO inventory (user_id, item_id, item_type, item_name, item_description, item_content) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, itemId, itemType, itemName, itemDescription, itemContent ? JSON.stringify(itemContent) : null]
      );

      // Récupérer l'inventaire mis à jour
      const [rows] = await db.execute(
        'SELECT item_id, item_type, item_name, item_description, item_content FROM inventory WHERE user_id = ? ORDER BY created_at ASC',
        [userId]
      );

      const inventory = (rows as any[]).map(row => ({
        id: row.item_id,
        type: row.item_type,
        name: row.item_name,
        description: row.item_description,
        content: parseItemContent(row.item_content)
      }));

      const newItem = {
        id: itemId,
        type: itemType,
        name: itemName,
        description: itemDescription,
        content: itemContent
      };

      res.json({
        status: 'success',
        inventory,
        newItem
      });
    } catch (error) {
      console.error('Erreur addToInventory:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Erreur serveur'
      });
    }
  },

  // Valider le changement de salle
  async changeRoom(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const { newRoom } = req.body;

      // Validation de la salle
      if (!GAME_CONFIG.ROOMS.AVAILABLE_ROOMS.includes(newRoom)) {
        throw new AppError(400, 'Salle invalide');
      }

      const game = await Game.findOne({
        where: { userId: req.user.id, isCompleted: false }
      });

      if (!game) {
        throw new AppError(404, 'Partie non trouvée');
      }

      const gameState = game.gameState as GameStateData;

      // Vérifier les prérequis pour la salle
      const requirements = GAME_CONFIG.ROOMS.ROOM_UNLOCK_REQUIREMENTS[newRoom as keyof typeof GAME_CONFIG.ROOMS.ROOM_UNLOCK_REQUIREMENTS];
      if (requirements && Array.isArray(requirements)) {
        const hasRequiredItems = requirements.every((requiredItem: string) =>
          gameState.inventory.some(item => item.id === requiredItem)
        );
        
        if (!hasRequiredItems) {
          throw new AppError(403, 'Vous n\'avez pas les objets requis pour accéder à cette salle');
        }
      }

      // Mettre à jour la salle actuelle
      gameState.currentRoom = newRoom;
      
      // Initialiser unlockedRooms si nécessaire
      if (!gameState.unlockedRooms) {
        gameState.unlockedRooms = [];
      }
      
      // Ajouter la salle aux salles débloquées si pas déjà présente
      if (!gameState.unlockedRooms.includes(newRoom)) {
        gameState.unlockedRooms.push(newRoom);
      }

      await game.update({ gameState });

      res.json({
        status: 'success',
        message: `Vous êtes maintenant dans : ${newRoom}`,
        currentRoom: newRoom,
        unlockedRooms: gameState.unlockedRooms
      });

    } catch (error) {
      console.error('Erreur changeRoom:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors du changement de salle'
      });
    }
  },

  // Valider l'état de progression
  async updateGameProgress(req: Request, res: Response) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Non authentifié');
      }

      const { progressType, value } = req.body;

      const game = await Game.findOne({
        where: { userId: req.user.id, isCompleted: false }
      });

      if (!game) {
        throw new AppError(404, 'Partie non trouvée');
      }

      const gameState = game.gameState as GameStateData;

      // Mettre à jour selon le type de progression
      switch (progressType) {
        case 'microscopeEnigmeResolved':
          gameState.microscopeEnigmeResolved = Boolean(value);
          break;
        case 'periodicTableUnlocked':
          gameState.periodicTableUnlocked = Boolean(value);
          break;
        case 'computerUnlocked':
          gameState.computerUnlocked = Boolean(value);
          break;
        case 'artifactUnlocked':
          gameState.artifactUnlocked = Boolean(value);
          break;
        case 'gameCompleted':
          gameState.gameCompleted = Boolean(value);
          if (value) {
            await game.update({ isCompleted: true, gameState });
          }
          break;
        default:
          throw new AppError(400, 'Type de progression invalide');
      }

      if (progressType !== 'gameCompleted') {
        await game.update({ gameState });
      }

      res.json({
        status: 'success',
        message: 'Progression mise à jour',
        gameState
      });

    } catch (error) {
      console.error('Erreur updateGameProgress:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la mise à jour de la progression'
      });
    }
  },

  // Récupérer l'inventaire complet
  async getInventory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Utilisateur non authentifié' });
      }

      const [rows] = await db.execute(
        'SELECT item_id, item_type, item_name, item_description, item_content FROM inventory WHERE user_id = ? ORDER BY created_at ASC',
        [userId]
      );

      const inventory = (rows as any[]).map(row => ({
        id: row.item_id,
        type: row.item_type,
        name: row.item_name,
        description: row.item_description,
        content: parseItemContent(row.item_content)
      }));

      res.json({
        status: 'success',
        inventory
      });
    } catch (error) {
      console.error('Erreur getInventory:', error);
      res.status(500).json({ status: 'error', message: 'Erreur lors de la récupération de l\'inventaire' });
    }
  },

  // Supprimer un objet de l'inventaire
  async removeFromInventory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Utilisateur non authentifié' });
      }

      const { itemId } = req.body;

      if (!itemId) {
        return res.status(400).json({ status: 'error', message: 'itemId manquant' });
      }

      await db.execute(
        'DELETE FROM inventory WHERE user_id = ? AND item_id = ?',
        [userId, itemId]
      );

      // Récupérer l'inventaire mis à jour
      const [rows] = await db.execute(
        'SELECT item_id, item_type, item_name, item_description, item_content FROM inventory WHERE user_id = ? ORDER BY created_at ASC',
        [userId]
      );

      const inventory = (rows as any[]).map(row => ({
        id: row.item_id,
        type: row.item_type,
        name: row.item_name,
        description: row.item_description,
        content: parseItemContent(row.item_content)
      }));

      res.json({
        status: 'success',
        inventory
      });
    } catch (error) {
      console.error('Erreur removeFromInventory:', error);
      res.status(500).json({ status: 'error', message: 'Erreur lors de la suppression de l\'inventaire' });
    }
  },

  // Obtenir la configuration du jeu
  async getGameConfig(req: Request, res: Response) {
    try {
      // Retourner seulement les informations non-sensibles
      const publicConfig = {
        initialScore: GAME_CONFIG.INITIAL_SCORE,
        maxGameDuration: GAME_CONFIG.LIMITS.MAX_GAME_DURATION,
        maxInventoryItems: GAME_CONFIG.INVENTORY.MAX_ITEMS,
        availableRooms: GAME_CONFIG.ROOMS.AVAILABLE_ROOMS,
        timePenaltyInterval: GAME_CONFIG.TIMER.TIME_PENALTY_INTERVAL
      };

      res.json({
        status: 'success',
        config: publicConfig
      });

    } catch (error) {
      console.error('Erreur getGameConfig:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération de la configuration'
      });
    }
  }
}; 