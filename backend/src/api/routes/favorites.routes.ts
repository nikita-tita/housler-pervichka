import { Router } from 'express';
import {
  getFavorites,
  getFavoriteIds,
  addFavorite,
  removeFavorite
} from '../controllers/favorites.controller';
import { requireAuthWithUser } from '../../middleware/auth.middleware';

const router = Router();

// Все роуты требуют авторизации
router.use(requireAuthWithUser);

// GET /api/favorites - Список избранного
router.get('/', getFavorites);

// GET /api/favorites/ids - Только ID (для быстрой проверки)
router.get('/ids', getFavoriteIds);

// POST /api/favorites - Добавить
router.post('/', addFavorite);

// DELETE /api/favorites/:offerId - Удалить
router.delete('/:offerId', removeFavorite);

export default router;
