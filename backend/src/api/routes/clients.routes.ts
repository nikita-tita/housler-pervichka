import { Router } from 'express';
import {
  getClients,
  createClient,
  getClient,
  updateClient,
  updateClientStage,
  deleteClient,
  getClientsStats,
  getClientActivity,
  linkSelection,
  recordContact
} from '../controllers/clients.controller';
import { requireAuthWithUser, requireAgent } from '../../middleware/auth.middleware';
import { validateBody, validateParams } from '../../validation/middleware';
import {
  idParamSchema,
  createClientSchema,
  updateClientSchema,
  updateClientStageSchema
} from '../../validation/schemas';

const router = Router();

// Все роуты требуют авторизации агента
router.use(requireAuthWithUser);
router.use(requireAgent);

// GET /api/clients/stats — Статистика воронки (до /:id чтобы не конфликтовать)
router.get('/stats', getClientsStats);

// GET /api/clients — Список клиентов
router.get('/', getClients);

// POST /api/clients — Создать клиента
router.post('/', validateBody(createClientSchema), createClient);

// GET /api/clients/:id — Детали клиента
router.get('/:id', validateParams(idParamSchema), getClient);

// PATCH /api/clients/:id — Обновить клиента
router.patch('/:id', validateParams(idParamSchema), validateBody(updateClientSchema), updateClient);

// DELETE /api/clients/:id — Удалить клиента
router.delete('/:id', validateParams(idParamSchema), deleteClient);

// PATCH /api/clients/:id/stage — Изменить этап воронки
router.patch('/:id/stage', validateParams(idParamSchema), validateBody(updateClientStageSchema), updateClientStage);

// GET /api/clients/:id/activity — Лог активности
router.get('/:id/activity', validateParams(idParamSchema), getClientActivity);

// POST /api/clients/:id/link-selection — Привязать подборку
router.post('/:id/link-selection', validateParams(idParamSchema), linkSelection);

// POST /api/clients/:id/contact — Записать контакт
router.post('/:id/contact', validateParams(idParamSchema), recordContact);

export default router;
