import { Router } from 'express';
import {
  getComplexes,
  getComplexById,
  searchComplexes
} from '../controllers/complexes.controller';

const router = Router();

// GET /api/complexes - Список ЖК
router.get('/', getComplexes);

// GET /api/complexes/search - Поиск по названию (автокомплит)
router.get('/search', searchComplexes);

// GET /api/complexes/:id - Детали ЖК
router.get('/:id', getComplexById);

export default router;
