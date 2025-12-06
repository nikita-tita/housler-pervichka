import { Router } from 'express';
import { searchOffers, getOfferById, getOffersByIds, getFilters, getPriceHistory, getMapMarkers } from '../controllers/offers.controller';

const router = Router();

// GET /api/offers - Поиск объявлений
router.get('/', searchOffers);

// GET /api/offers/map/markers - Маркеры для карты (до :id!)
router.get('/map/markers', getMapMarkers);

// POST /api/offers/batch - Получить несколько объявлений по ID (до :id!)
router.post('/batch', getOffersByIds);

// GET /api/offers/:id - Детали объявления
router.get('/:id', getOfferById);

// GET /api/offers/:id/price-history - История цен
router.get('/:id/price-history', getPriceHistory);

export default router;
