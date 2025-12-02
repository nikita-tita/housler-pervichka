import { Router } from 'express';
import { requireAuthWithUser, requireAgent, requireOperator } from '../../middleware/auth.middleware';
import {
  getFixations,
  createFixation,
  getFixationsStats,
  getFixation,
  updateFixationStatus,
  convertToBooking,
  deleteFixation
} from '../controllers/fixations.controller';

const router = Router();

// Все роуты требуют авторизации агента
router.use(requireAuthWithUser);
router.use(requireAgent);

// GET /api/fixations — Список фиксаций агента
router.get('/', getFixations);

// GET /api/fixations/stats — Статистика фиксаций
router.get('/stats', getFixationsStats);

// POST /api/fixations — Создать фиксацию
router.post('/', createFixation);

// GET /api/fixations/:id — Детали фиксации
router.get('/:id', getFixation);

// PATCH /api/fixations/:id/status — Обновить статус (для оператора/агента)
router.patch('/:id/status', updateFixationStatus);

// POST /api/fixations/:id/convert — Конвертировать в бронь
router.post('/:id/convert', convertToBooking);

// DELETE /api/fixations/:id — Удалить фиксацию
router.delete('/:id', deleteFixation);

export default router;

// Отдельный роутер для операторов (полный доступ)
export const operatorFixationsRouter = Router();
operatorFixationsRouter.use(requireAuthWithUser);
operatorFixationsRouter.use(requireOperator);

// TODO: Добавить эндпоинты для операторов при необходимости
