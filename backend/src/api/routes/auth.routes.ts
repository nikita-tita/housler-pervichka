import { Router } from 'express';
import {
  requestCode,
  verifyCode,
  getCurrentUser,
  updateProfile,
  requestSmsCode,
  verifySmsCode,
  registerRealtor,
  checkInn,
  registerAgency,
  loginAgency
} from '../controllers/auth.controller';
import { requireAuthWithUser } from '../../middleware/auth.middleware';
import { authLimiter, verifyCodeLimiter } from '../../middleware/rate-limit.middleware';
import { validateBody } from '../../validation/middleware';
import {
  requestCodeSchema,
  verifyCodeSchema,
  updateProfileSchema,
  requestSmsCodeSchema,
  verifySmsCodeSchema,
  registerRealtorSchema,
  checkInnSchema,
  registerAgencySchema,
  loginAgencySchema
} from '../../validation/schemas';

const router = Router();

// POST /api/auth/request-code - Запросить код (rate limited)
router.post('/request-code', authLimiter, validateBody(requestCodeSchema), requestCode);

// POST /api/auth/verify-code - Проверить код (строгий rate limit)
router.post('/verify-code', verifyCodeLimiter, validateBody(verifyCodeSchema), verifyCode);

// GET /api/auth/me - Текущий пользователь (требует авторизацию)
router.get('/me', requireAuthWithUser, getCurrentUser);

// PATCH /api/auth/profile - Обновить профиль
router.patch('/profile', requireAuthWithUser, validateBody(updateProfileSchema), updateProfile);

// ============ SMS-авторизация ============

// POST /api/auth/request-sms - Запросить SMS-код
router.post('/request-sms', authLimiter, validateBody(requestSmsCodeSchema), requestSmsCode);

// POST /api/auth/verify-sms - Проверить SMS-код
router.post('/verify-sms', verifyCodeLimiter, validateBody(verifySmsCodeSchema), verifySmsCode);

// ============ Регистрация ============

// POST /api/auth/register-realtor - Регистрация частного риелтора
router.post('/register-realtor', authLimiter, validateBody(registerRealtorSchema), registerRealtor);

// POST /api/auth/check-inn - Проверить ИНН
router.post('/check-inn', validateBody(checkInnSchema), checkInn);

// POST /api/auth/register-agency - Регистрация агентства
router.post('/register-agency', authLimiter, validateBody(registerAgencySchema), registerAgency);

// POST /api/auth/login-agency - Вход для агентств
router.post('/login-agency', verifyCodeLimiter, validateBody(loginAgencySchema), loginAgency);

export default router;
