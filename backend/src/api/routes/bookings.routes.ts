import { Router } from 'express';
import {
  createBooking,
  getAgentBookings,
  getAllBookings,
  getBookingsStats,
  updateBookingStatus
} from '../controllers/bookings.controller';
import { loadUser, requireAuthWithUser, requireOperator } from '../../middleware/auth.middleware';
import { validateBody, validateParams } from '../../validation/middleware';
import { idParamSchema, createBookingSchema, updateBookingStatusSchema } from '../../validation/schemas';

const router = Router();

// POST /api/bookings - Создать заявку (может быть без авторизации, но если есть — привязываем к агенту)
router.post('/', loadUser, validateBody(createBookingSchema), createBooking);

// GET /api/bookings - Заявки агента (требует авторизации)
router.get('/', requireAuthWithUser, getAgentBookings);

export default router;

// Отдельный роутер для оператора
export const operatorBookingsRouter = Router();

// Все роуты требуют роль оператора
operatorBookingsRouter.use(requireAuthWithUser);
operatorBookingsRouter.use(requireOperator);

// GET /api/operator/bookings - Все заявки
operatorBookingsRouter.get('/', getAllBookings);

// GET /api/operator/bookings/stats - Статистика
operatorBookingsRouter.get('/stats', getBookingsStats);

// PATCH /api/operator/bookings/:id - Обновить статус
operatorBookingsRouter.patch('/:id', validateParams(idParamSchema), validateBody(updateBookingStatusSchema), updateBookingStatus);
