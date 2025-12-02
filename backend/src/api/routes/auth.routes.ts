import { Router } from 'express';
import {
  requestCode,
  verifyCode,
  getCurrentUser,
  updateProfile
} from '../controllers/auth.controller';
import { requireAuthWithUser } from '../../middleware/auth.middleware';
import { authLimiter, verifyCodeLimiter } from '../../middleware/rate-limit.middleware';
import { validateBody } from '../../validation/middleware';
import { requestCodeSchema, verifyCodeSchema, updateProfileSchema } from '../../validation/schemas';

const router = Router();

// POST /api/auth/request-code - Запросить код (rate limited)
router.post('/request-code', authLimiter, validateBody(requestCodeSchema), requestCode);

// POST /api/auth/verify-code - Проверить код (строгий rate limit)
router.post('/verify-code', verifyCodeLimiter, validateBody(verifyCodeSchema), verifyCode);

// GET /api/auth/me - Текущий пользователь (требует авторизацию)
router.get('/me', requireAuthWithUser, getCurrentUser);

// PATCH /api/auth/profile - Обновить профиль
router.patch('/profile', requireAuthWithUser, validateBody(updateProfileSchema), updateProfile);

export default router;
