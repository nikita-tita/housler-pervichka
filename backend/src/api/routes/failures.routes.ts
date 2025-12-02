import { Router } from 'express';
import { requireAuthWithUser, requireAgent } from '../../middleware/auth.middleware';
import {
  getFailures,
  createFailure,
  getCancellationReasons,
  getFailuresStats
} from '../controllers/failures.controller';

const router = Router();

// GET /api/failures/reasons — Справочник причин (доступен всем авторизованным)
router.get('/reasons', getCancellationReasons);

// Остальные роуты требуют авторизации агента
router.use(requireAuthWithUser);
router.use(requireAgent);

// GET /api/failures — Список срывов агента
router.get('/', getFailures);

// GET /api/failures/stats — Статистика срывов
router.get('/stats', getFailuresStats);

// POST /api/failures — Зарегистрировать срыв
router.post('/', createFailure);

export default router;
