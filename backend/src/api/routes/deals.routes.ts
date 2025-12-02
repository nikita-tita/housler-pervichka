import { Router } from 'express';
import { requireAuthWithUser, requireAgent } from '../../middleware/auth.middleware';
import {
  getDeals,
  createDeal,
  getDealsStats,
  getDeal,
  updateDeal,
  updateDealStatus
} from '../controllers/deals.controller';
import { validateBody, validateParams } from '../../validation/middleware';
import { idParamSchema, createDealSchema, updateDealStatusSchema } from '../../validation/schemas';

const router = Router();

// Все роуты требуют авторизации агента
router.use(requireAuthWithUser);
router.use(requireAgent);

// GET /api/deals — Список сделок агента
router.get('/', getDeals);

// GET /api/deals/stats — Статистика сделок
router.get('/stats', getDealsStats);

// POST /api/deals — Создать сделку из брони
router.post('/', validateBody(createDealSchema), createDeal);

// GET /api/deals/:id — Детали сделки
router.get('/:id', validateParams(idParamSchema), getDeal);

// PATCH /api/deals/:id — Обновить данные сделки
router.patch('/:id', validateParams(idParamSchema), updateDeal);

// PATCH /api/deals/:id/status — Обновить статус сделки
router.patch('/:id/status', validateParams(idParamSchema), validateBody(updateDealStatusSchema), updateDealStatus);

export default router;
