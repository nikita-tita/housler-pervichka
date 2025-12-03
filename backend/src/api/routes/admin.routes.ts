import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUserRole,
  toggleUserActive,
  setUserAgency,
  createUser,
  deleteUser,
  getAgencies,
  getAgencyById,
  updateAgencyStatus,
  getPlatformStats
} from '../controllers/admin.controller';
import { requireAuthWithUser, requireAdmin } from '../../middleware/auth.middleware';
import { validateBody, validateParams } from '../../validation/middleware';
import {
  idParamSchema,
  createUserSchema,
  updateUserRoleSchema,
  toggleUserActiveSchema,
  setUserAgencySchema,
  updateAgencyStatusSchema
} from '../../validation/schemas';

const router = Router();

// Все роуты требуют авторизацию + роль admin
router.use(requireAuthWithUser);
router.use(requireAdmin);

// === Users ===

// GET /api/admin/users - Список пользователей
router.get('/users', getUsers);

// POST /api/admin/users - Создать пользователя
router.post('/users', validateBody(createUserSchema), createUser);

// GET /api/admin/users/:id - Пользователь по ID
router.get('/users/:id', validateParams(idParamSchema), getUserById);

// PATCH /api/admin/users/:id/role - Изменить роль
router.patch('/users/:id/role', validateParams(idParamSchema), validateBody(updateUserRoleSchema), updateUserRole);

// PATCH /api/admin/users/:id/active - Активировать/деактивировать
router.patch('/users/:id/active', validateParams(idParamSchema), validateBody(toggleUserActiveSchema), toggleUserActive);

// PATCH /api/admin/users/:id/agency - Привязать к агентству
router.patch('/users/:id/agency', validateParams(idParamSchema), validateBody(setUserAgencySchema), setUserAgency);

// DELETE /api/admin/users/:id - Удалить (деактивировать)
router.delete('/users/:id', validateParams(idParamSchema), deleteUser);

// === Agencies ===

// GET /api/admin/agencies - Список агентств
router.get('/agencies', getAgencies);

// GET /api/admin/agencies/:id - Агентство по ID
router.get('/agencies/:id', validateParams(idParamSchema), getAgencyById);

// PATCH /api/admin/agencies/:id/status - Изменить статус
router.patch('/agencies/:id/status', validateParams(idParamSchema), validateBody(updateAgencyStatusSchema), updateAgencyStatus);

// === Stats ===

// GET /api/admin/stats - Статистика платформы
router.get('/stats', getPlatformStats);

export default router;
