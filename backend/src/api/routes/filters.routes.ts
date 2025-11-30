import { Router } from 'express';
import { getFilters } from '../controllers/offers.controller';

const router = Router();

// GET /api/filters - Доступные значения фильтров
router.get('/', getFilters);

export default router;
