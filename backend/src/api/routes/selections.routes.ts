import { Router } from 'express';
import {
  getSelections,
  createSelection,
  getSelection,
  getSharedSelection,
  updateSelection,
  deleteSelection,
  addSelectionItem,
  removeSelectionItem
} from '../controllers/selections.controller';
import { requireAuthWithUser, requireAgent } from '../../middleware/auth.middleware';

const router = Router();

// Публичный роут для просмотра по коду (без авторизации)
router.get('/shared/:code', getSharedSelection);

// Остальные роуты требуют авторизации агента
router.use(requireAuthWithUser);
router.use(requireAgent);

// GET /api/selections - Список подборок
router.get('/', getSelections);

// POST /api/selections - Создать
router.post('/', createSelection);

// GET /api/selections/:id - Получить
router.get('/:id', getSelection);

// PATCH /api/selections/:id - Обновить
router.patch('/:id', updateSelection);

// DELETE /api/selections/:id - Удалить
router.delete('/:id', deleteSelection);

// POST /api/selections/:id/items - Добавить объект
router.post('/:id/items', addSelectionItem);

// DELETE /api/selections/:id/items/:offerId - Удалить объект
router.delete('/:id/items/:offerId', removeSelectionItem);

export default router;
