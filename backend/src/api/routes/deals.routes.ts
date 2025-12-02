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

const router = Router();

// Все роуты требуют авторизации агента
router.use(requireAuthWithUser);
router.use(requireAgent);

// GET /api/deals — Список сделок агента
router.get('/', getDeals);

// GET /api/deals/stats — Статистика сделок
router.get('/stats', getDealsStats);

// POST /api/deals — Создать сделку из брони
router.post('/', createDeal);

// GET /api/deals/:id — Детали сделки
router.get('/:id', getDeal);

// PATCH /api/deals/:id — Обновить данные сделки
router.patch('/:id', updateDeal);

// PATCH /api/deals/:id/status — Обновить статус сделки
router.patch('/:id/status', updateDealStatus);

export default router;
