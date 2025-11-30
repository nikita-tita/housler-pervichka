import { Request, Response } from 'express';
import { FavoritesService } from '../../services/favorites.service';

const favoritesService = new FavoritesService();

/**
 * GET /api/favorites - Получить избранное
 */
export async function getFavorites(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const favorites = await favoritesService.getUserFavorites(req.user.id);

    res.json({
      success: true,
      data: favorites
    });
  } catch (error) {
    console.error('Error in getFavorites:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении избранного' });
  }
}

/**
 * GET /api/favorites/ids - Получить ID избранных (для быстрой проверки)
 */
export async function getFavoriteIds(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const ids = await favoritesService.getFavoriteIds(req.user.id);

    res.json({
      success: true,
      data: ids
    });
  } catch (error) {
    console.error('Error in getFavoriteIds:', error);
    res.status(500).json({ success: false, error: 'Ошибка' });
  }
}

/**
 * POST /api/favorites - Добавить в избранное
 */
export async function addFavorite(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const { offerId } = req.body;

    if (!offerId || typeof offerId !== 'number') {
      return res.status(400).json({ success: false, error: 'offerId обязателен' });
    }

    const result = await favoritesService.addFavorite(req.user.id, offerId);

    if (!result.success) {
      return res.status(404).json({ success: false, error: 'Объявление не найдено' });
    }

    res.json({
      success: true,
      message: 'Добавлено в избранное'
    });
  } catch (error) {
    console.error('Error in addFavorite:', error);
    res.status(500).json({ success: false, error: 'Ошибка при добавлении в избранное' });
  }
}

/**
 * DELETE /api/favorites/:offerId - Удалить из избранного
 */
export async function removeFavorite(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const offerId = parseInt(req.params.offerId);

    if (isNaN(offerId)) {
      return res.status(400).json({ success: false, error: 'Некорректный offerId' });
    }

    await favoritesService.removeFavorite(req.user.id, offerId);

    res.json({
      success: true,
      message: 'Удалено из избранного'
    });
  } catch (error) {
    console.error('Error in removeFavorite:', error);
    res.status(500).json({ success: false, error: 'Ошибка при удалении из избранного' });
  }
}
