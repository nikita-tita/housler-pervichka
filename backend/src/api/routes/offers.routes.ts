import { Router } from 'express';
import { searchOffers, getOfferById, getFilters } from '../controllers/offers.controller';

const router = Router();

// GET /api/offers - Поиск объявлений
router.get('/', searchOffers);

// GET /api/offers/:id - Детали объявления
router.get('/:id', getOfferById);

export default router;
