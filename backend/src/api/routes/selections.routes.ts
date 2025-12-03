import { Router } from 'express';
import {
  getSelections,
  createSelection,
  getSelection,
  getSharedSelection,
  getSharedSelectionContext,
  updateSelection,
  deleteSelection,
  addSelectionItem,
  removeSelectionItem,
  addSharedSelectionItem,
  removeSharedSelectionItem,
  recordSharedSelectionView,
  getSelectionActivity,
  getMySelections
} from '../controllers/selections.controller';
import { requireAuthWithUser, requireAgent } from '../../middleware/auth.middleware';
import { validateBody, validateParams } from '../../validation/middleware';
import {
  idParamSchema,
  createSelectionSchema,
  updateSelectionSchema,
  addSelectionItemSchema
} from '../../validation/schemas';
import { guestActionsLimiter, sharedSelectionLimiter } from '../../middleware/rate-limit.middleware';

const router = Router();

// ============ ПУБЛИЧНЫЕ РОУТЫ (для клиентов по share_code) ============
// Все публичные роуты защищены rate limiting

// GET /api/selections/shared/:code - Просмотр подборки по коду
// Rate limit: 30 req/min (защита от брутфорса share_code)
router.get('/shared/:code', sharedSelectionLimiter, getSharedSelection);

// GET /api/selections/shared/:code/context - Контекст подборки (агент, агентство) для гостей
router.get('/shared/:code/context', sharedSelectionLimiter, getSharedSelectionContext);

// POST /api/selections/shared/:code/items - Клиент добавляет объект
// Rate limit: 20 действий/мин
router.post('/shared/:code/items', guestActionsLimiter, addSharedSelectionItem);

// DELETE /api/selections/shared/:code/items/:offerId - Клиент удаляет объект
router.delete('/shared/:code/items/:offerId', guestActionsLimiter, removeSharedSelectionItem);

// POST /api/selections/shared/:code/view - Записать просмотр
router.post('/shared/:code/view', guestActionsLimiter, recordSharedSelectionView);

// ============ РОУТЫ ДЛЯ АВТОРИЗОВАННЫХ КЛИЕНТОВ ============

// GET /api/selections/my - Подборки где клиент указан по email
router.get('/my', requireAuthWithUser, getMySelections);

// ============ ЗАЩИЩЁННЫЕ РОУТЫ (для агентов) ============

router.use(requireAuthWithUser);
router.use(requireAgent);

// GET /api/selections - Список подборок
router.get('/', getSelections);

// POST /api/selections - Создать
router.post('/', validateBody(createSelectionSchema), createSelection);

// GET /api/selections/:id - Получить
router.get('/:id', validateParams(idParamSchema), getSelection);

// GET /api/selections/:id/activity - Лог действий
router.get('/:id/activity', validateParams(idParamSchema), getSelectionActivity);

// PATCH /api/selections/:id - Обновить
router.patch('/:id', validateParams(idParamSchema), validateBody(updateSelectionSchema), updateSelection);

// DELETE /api/selections/:id - Удалить
router.delete('/:id', validateParams(idParamSchema), deleteSelection);

// POST /api/selections/:id/items - Добавить объект
router.post('/:id/items', validateParams(idParamSchema), validateBody(addSelectionItemSchema), addSelectionItem);

// DELETE /api/selections/:id/items/:offerId - Удалить объект
router.delete('/:id/items/:offerId', validateParams(idParamSchema), removeSelectionItem);

export default router;
