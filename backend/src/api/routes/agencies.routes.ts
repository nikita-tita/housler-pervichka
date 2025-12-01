import { Router } from 'express';
import {
  getAgencies,
  getAgencyBySlug,
  getDefaultAgency,
  getMyAgencies,
  linkToAgency
} from '../controllers/agencies.controller';
import { requireAuthWithUser, loadUser } from '../../middleware/auth.middleware';

const router = Router();

// GET /api/agencies - Список всех агентств
router.get('/', getAgencies);

// GET /api/agencies/default - Дефолтное агентство
router.get('/default', getDefaultAgency);

// GET /api/agencies/my - Агентства текущего пользователя
router.get('/my', requireAuthWithUser, getMyAgencies);

// GET /api/agencies/:slug - Агентство по slug
router.get('/:slug', getAgencyBySlug);

// POST /api/agencies/:slug/link - Привязать к агентству
router.post('/:slug/link', requireAuthWithUser, linkToAgency);

export default router;
