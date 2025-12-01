import { Request, Response } from 'express';
import { ClientsService, ClientStage, ClientPriority } from '../../services/clients.service';

const clientsService = new ClientsService();

// Валидаторы
const VALID_STAGES: ClientStage[] = ['new', 'in_progress', 'fixation', 'booking', 'deal', 'completed', 'failed'];
const VALID_PRIORITIES: ClientPriority[] = ['low', 'medium', 'high', 'urgent'];

/**
 * GET /api/clients — Список клиентов агента
 */
export async function getClients(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const { search, stage, priority, hasNextContact } = req.query;

    const filters = {
      search: search as string | undefined,
      stage: VALID_STAGES.includes(stage as ClientStage) ? stage as ClientStage : undefined,
      priority: VALID_PRIORITIES.includes(priority as ClientPriority) ? priority as ClientPriority : undefined,
      hasNextContact: hasNextContact === 'true'
    };

    const clients = await clientsService.getAgentClients(req.user.id, filters);

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Error in getClients:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении клиентов' });
  }
}

/**
 * POST /api/clients — Создать клиента
 */
export async function createClient(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const {
      name, phone, email, telegram, whatsapp,
      source, stage, priority, comment,
      budget_min, budget_max, desired_rooms, desired_districts,
      desired_deadline, next_contact_date
    } = req.body;

    // Валидация: нужен хотя бы телефон или email или имя
    if (!name && !phone && !email) {
      return res.status(400).json({
        success: false,
        error: 'Укажите имя, телефон или email клиента'
      });
    }

    const client = await clientsService.createClient(req.user.id, {
      name, phone, email, telegram, whatsapp,
      source, stage, priority, comment,
      budget_min, budget_max, desired_rooms, desired_districts,
      desired_deadline, next_contact_date
    });

    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error in createClient:', error);
    res.status(500).json({ success: false, error: 'Ошибка при создании клиента' });
  }
}

/**
 * GET /api/clients/stats — Статистика воронки
 */
export async function getClientsStats(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const stats = await clientsService.getFunnelStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getClientsStats:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении статистики' });
  }
}

/**
 * GET /api/clients/:id — Детали клиента
 */
export async function getClient(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const client = await clientsService.getClientById(id, req.user.id);

    if (!client) {
      return res.status(404).json({ success: false, error: 'Клиент не найден' });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error in getClient:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении клиента' });
  }
}

/**
 * PATCH /api/clients/:id — Обновить клиента
 */
export async function updateClient(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const {
      name, phone, email, telegram, whatsapp,
      priority, comment,
      budget_min, budget_max, desired_rooms, desired_districts,
      desired_deadline, next_contact_date
    } = req.body;

    const client = await clientsService.updateClient(id, req.user.id, {
      name, phone, email, telegram, whatsapp,
      priority, comment,
      budget_min, budget_max, desired_rooms, desired_districts,
      desired_deadline, next_contact_date
    });

    if (!client) {
      return res.status(404).json({ success: false, error: 'Клиент не найден' });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error in updateClient:', error);
    res.status(500).json({ success: false, error: 'Ошибка при обновлении клиента' });
  }
}

/**
 * PATCH /api/clients/:id/stage — Изменить этап воронки
 */
export async function updateClientStage(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const { stage } = req.body;

    if (!VALID_STAGES.includes(stage)) {
      return res.status(400).json({
        success: false,
        error: `Некорректный этап. Допустимые: ${VALID_STAGES.join(', ')}`
      });
    }

    const client = await clientsService.updateStage(id, req.user.id, stage);

    if (!client) {
      return res.status(404).json({ success: false, error: 'Клиент не найден' });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error in updateClientStage:', error);
    res.status(500).json({ success: false, error: 'Ошибка при изменении этапа' });
  }
}

/**
 * DELETE /api/clients/:id — Удалить клиента
 */
export async function deleteClient(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const deleted = await clientsService.deleteClient(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Клиент не найден' });
    }

    res.json({
      success: true,
      message: 'Клиент удалён'
    });
  } catch (error) {
    console.error('Error in deleteClient:', error);
    res.status(500).json({ success: false, error: 'Ошибка при удалении клиента' });
  }
}

/**
 * GET /api/clients/:id/activity — Лог активности клиента
 */
export async function getClientActivity(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const activity = await clientsService.getActivityLog(id, req.user.id);

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error in getClientActivity:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении активности' });
  }
}

/**
 * POST /api/clients/:id/link-selection — Привязать подборку к клиенту
 */
export async function linkSelection(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const clientId = parseInt(req.params.id);
    const { selectionId } = req.body;

    if (isNaN(clientId) || !selectionId) {
      return res.status(400).json({ success: false, error: 'Некорректные параметры' });
    }

    const linked = await clientsService.linkSelection(selectionId, clientId, req.user.id);

    if (!linked) {
      return res.status(404).json({ success: false, error: 'Клиент или подборка не найдены' });
    }

    res.json({
      success: true,
      message: 'Подборка привязана к клиенту'
    });
  } catch (error) {
    console.error('Error in linkSelection:', error);
    res.status(500).json({ success: false, error: 'Ошибка при привязке подборки' });
  }
}

/**
 * POST /api/clients/:id/contact — Записать контакт с клиентом
 */
export async function recordContact(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const clientId = parseInt(req.params.id);
    const { comment } = req.body;

    if (isNaN(clientId)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const client = await clientsService.recordContact(clientId, req.user.id, comment);

    if (!client) {
      return res.status(404).json({ success: false, error: 'Клиент не найден' });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error in recordContact:', error);
    res.status(500).json({ success: false, error: 'Ошибка при записи контакта' });
  }
}
