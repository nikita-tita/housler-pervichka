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

const router = Router();

// Все роуты требуют авторизации агента
router.use(requireAuthWithUser);
router.use(requireAgent);

// GET /api/clients/stats — Статистика воронки (до /:id чтобы не конфликтовать)
router.get('/stats', getClientsStats);

// GET /api/clients — Список клиентов
router.get('/', getClients);

// POST /api/clients — Создать клиента
router.post('/', createClient);

// GET /api/clients/:id — Детали клиента
router.get('/:id', getClient);

// PATCH /api/clients/:id — Обновить клиента
router.patch('/:id', updateClient);

// DELETE /api/clients/:id — Удалить клиента
router.delete('/:id', deleteClient);

// PATCH /api/clients/:id/stage — Изменить этап воронки
router.patch('/:id/stage', updateClientStage);

// GET /api/clients/:id/activity — Лог активности
router.get('/:id/activity', getClientActivity);

// POST /api/clients/:id/link-selection — Привязать подборку
router.post('/:id/link-selection', linkSelection);

// POST /api/clients/:id/contact — Записать контакт
router.post('/:id/contact', recordContact);

export default router;
