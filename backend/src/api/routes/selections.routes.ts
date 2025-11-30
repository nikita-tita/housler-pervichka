import { Router } from 'express';
import {
  getSelections,
  createSelection,
  getSelection,
  getSharedSelection,
  updateSelection,
  deleteSelection,
  addSelectionItem,
  removeSelectionItem,
  addSharedSelectionItem,
  removeSharedSelectionItem,
  recordSharedSelectionView,
  getSelectionActivity
} from '../controllers/selections.controller';
import { requireAuthWithUser, requireAgent } from '../../middleware/auth.middleware';

const router = Router();

// ============ ПУБЛИЧНЫЕ РОУТЫ (для клиентов по share_code) ============

// GET /api/selections/shared/:code - Просмотр подборки по коду
router.get('/shared/:code', getSharedSelection);

// POST /api/selections/shared/:code/items - Клиент добавляет объект
router.post('/shared/:code/items', addSharedSelectionItem);

// DELETE /api/selections/shared/:code/items/:offerId - Клиент удаляет объект
router.delete('/shared/:code/items/:offerId', removeSharedSelectionItem);

// POST /api/selections/shared/:code/view - Записать просмотр
router.post('/shared/:code/view', recordSharedSelectionView);

// ============ ЗАЩИЩЁННЫЕ РОУТЫ (для агентов) ============

router.use(requireAuthWithUser);
router.use(requireAgent);

// GET /api/selections - Список подборок
router.get('/', getSelections);

// POST /api/selections - Создать
router.post('/', createSelection);

// GET /api/selections/:id - Получить
router.get('/:id', getSelection);

// GET /api/selections/:id/activity - Лог действий
router.get('/:id/activity', getSelectionActivity);

// PATCH /api/selections/:id - Обновить
router.patch('/:id', updateSelection);

// DELETE /api/selections/:id - Удалить
router.delete('/:id', deleteSelection);

// POST /api/selections/:id/items - Добавить объект
router.post('/:id/items', addSelectionItem);

// DELETE /api/selections/:id/items/:offerId - Удалить объект
router.delete('/:id/items/:offerId', removeSelectionItem);

export default router;
