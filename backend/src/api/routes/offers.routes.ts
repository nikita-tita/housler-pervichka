import { Router } from 'express';
import { searchOffers, getOfferById, getFilters, getPriceHistory } from '../controllers/offers.controller';

const router = Router();

// GET /api/offers - Поиск объявлений
router.get('/', searchOffers);

// GET /api/offers/:id - Детали объявления
router.get('/:id', getOfferById);

// GET /api/offers/:id/price-history - История цен
router.get('/:id/price-history', getPriceHistory);

export default router;
