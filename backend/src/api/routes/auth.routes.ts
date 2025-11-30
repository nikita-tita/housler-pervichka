import { Router } from 'express';
import {
  requestCode,
  verifyCode,
  getCurrentUser,
  updateProfile
} from '../controllers/auth.controller';
import { requireAuthWithUser } from '../../middleware/auth.middleware';

const router = Router();

// POST /api/auth/request-code - Запросить код
router.post('/request-code', requestCode);

// POST /api/auth/verify-code - Проверить код
router.post('/verify-code', verifyCode);

// GET /api/auth/me - Текущий пользователь (требует авторизацию)
router.get('/me', requireAuthWithUser, getCurrentUser);

// PATCH /api/auth/profile - Обновить профиль
router.patch('/profile', requireAuthWithUser, updateProfile);

export default router;
