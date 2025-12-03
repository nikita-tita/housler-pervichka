import { Request, Response } from 'express';
import { SelectionsService } from '../../services/selections.service';
import { getClientIp } from '../../middleware/rate-limit.middleware';

const selectionsService = new SelectionsService();

// Regex для валидации share_code: 32 символа hex или slug формата "name-hex"
const SHARE_CODE_REGEX = /^[a-f0-9]{32}$|^[a-z0-9-]+-[a-f0-9]{8}$/;

/**
 * Валидация share_code
 */
function isValidShareCode(code: string): boolean {
  return typeof code === 'string' && code.length > 0 && code.length <= 100 && SHARE_CODE_REGEX.test(code);
}

/**
 * GET /api/selections - Список подборок агента
 */
export async function getSelections(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const selections = await selectionsService.getAgentSelections(req.user.id);

    res.json({
      success: true,
      data: selections
    });
  } catch (error) {
    console.error('Error in getSelections:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении подборок' });
  }
}

/**
 * POST /api/selections - Создать подборку
 */
export async function createSelection(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const { name, clientEmail, clientName, isPublic } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'Название обязательно' });
    }

    const selection = await selectionsService.createSelection(req.user.id, {
      name,
      clientEmail,
      clientName,
      isPublic
    });

    res.status(201).json({
      success: true,
      data: selection
    });
  } catch (error) {
    console.error('Error in createSelection:', error);
    res.status(500).json({ success: false, error: 'Ошибка при создании подборки' });
  }
}

/**
 * GET /api/selections/:id - Получить подборку
 */
export async function getSelection(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const selection = await selectionsService.getSelectionById(id, req.user.id);

    if (!selection) {
      return res.status(404).json({ success: false, error: 'Подборка не найдена' });
    }

    res.json({
      success: true,
      data: selection
    });
  } catch (error) {
    console.error('Error in getSelection:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении подборки' });
  }
}

/**
 * GET /api/selections/shared/:code - Получить подборку по коду (публично)
 */
export async function getSharedSelection(req: Request, res: Response) {
  try {
    const { code } = req.params;

    if (!code || !isValidShareCode(code)) {
      return res.status(400).json({ success: false, error: 'Некорректный код подборки' });
    }

    const selection = await selectionsService.getSelectionByShareCode(code);

    if (!selection) {
      return res.status(404).json({ success: false, error: 'Подборка не найдена' });
    }

    res.json({
      success: true,
      data: selection
    });
  } catch (error) {
    console.error('Error in getSharedSelection:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении подборки' });
  }
}

/**
 * PATCH /api/selections/:id - Обновить подборку
 */
export async function updateSelection(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const { name, clientEmail, clientName, isPublic } = req.body;

    const selection = await selectionsService.updateSelection(id, req.user.id, {
      name,
      clientEmail,
      clientName,
      isPublic
    });

    if (!selection) {
      return res.status(404).json({ success: false, error: 'Подборка не найдена' });
    }

    res.json({
      success: true,
      data: selection
    });
  } catch (error) {
    console.error('Error in updateSelection:', error);
    res.status(500).json({ success: false, error: 'Ошибка при обновлении подборки' });
  }
}

/**
 * DELETE /api/selections/:id - Удалить подборку
 */
export async function deleteSelection(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const deleted = await selectionsService.deleteSelection(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Подборка не найдена' });
    }

    res.json({
      success: true,
      message: 'Подборка удалена'
    });
  } catch (error) {
    console.error('Error in deleteSelection:', error);
    res.status(500).json({ success: false, error: 'Ошибка при удалении подборки' });
  }
}

/**
 * POST /api/selections/:id/items - Добавить объект в подборку
 */
export async function addSelectionItem(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    const { offerId, comment } = req.body;

    if (isNaN(id) || !offerId) {
      return res.status(400).json({ success: false, error: 'ID и offerId обязательны' });
    }

    const added = await selectionsService.addItem(id, req.user.id, offerId, comment);

    if (!added) {
      return res.status(404).json({ success: false, error: 'Подборка или объявление не найдены' });
    }

    res.json({
      success: true,
      message: 'Объект добавлен в подборку'
    });
  } catch (error) {
    console.error('Error in addSelectionItem:', error);
    res.status(500).json({ success: false, error: 'Ошибка при добавлении объекта' });
  }
}

/**
 * DELETE /api/selections/:id/items/:offerId - Удалить объект из подборки
 */
export async function removeSelectionItem(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    const offerId = parseInt(req.params.offerId);

    if (isNaN(id) || isNaN(offerId)) {
      return res.status(400).json({ success: false, error: 'Некорректные параметры' });
    }

    await selectionsService.removeItem(id, req.user.id, offerId);

    res.json({
      success: true,
      message: 'Объект удалён из подборки'
    });
  } catch (error) {
    console.error('Error in removeSelectionItem:', error);
    res.status(500).json({ success: false, error: 'Ошибка при удалении объекта' });
  }
}

/**
 * POST /api/selections/shared/:code/items - Клиент добавляет объект в подборку
 */
export async function addSharedSelectionItem(req: Request, res: Response) {
  try {
    const { code } = req.params;
    const { offerId, comment, clientId } = req.body;

    if (!code || !isValidShareCode(code)) {
      return res.status(400).json({ success: false, error: 'Некорректный код подборки' });
    }

    if (!offerId || typeof offerId !== 'number' || offerId <= 0) {
      return res.status(400).json({ success: false, error: 'Некорректный offerId' });
    }

    // clientId - идентификатор клиента (генерируется на фронте, хранится в localStorage)
    // Используем getClientIp для надёжной идентификации клиента
    const clientIdentifier = clientId || getClientIp(req) || 'anonymous';

    const result = await selectionsService.addItemByClient(code, offerId, clientIdentifier, comment);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      message: 'Объект добавлен в подборку'
    });
  } catch (error) {
    console.error('Error in addSharedSelectionItem:', error);
    res.status(500).json({ success: false, error: 'Ошибка при добавлении объекта' });
  }
}

/**
 * DELETE /api/selections/shared/:code/items/:offerId - Клиент удаляет объект из подборки
 */
export async function removeSharedSelectionItem(req: Request, res: Response) {
  try {
    const { code, offerId } = req.params;
    const { clientId } = req.body;

    if (!code || !isValidShareCode(code)) {
      return res.status(400).json({ success: false, error: 'Некорректный код подборки' });
    }

    const parsedOfferId = parseInt(offerId);
    if (isNaN(parsedOfferId) || parsedOfferId <= 0) {
      return res.status(400).json({ success: false, error: 'Некорректный offerId' });
    }

    const clientIdentifier = clientId || getClientIp(req) || 'anonymous';

    const result = await selectionsService.removeItemByClient(code, parsedOfferId, clientIdentifier);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      message: 'Объект удалён из подборки'
    });
  } catch (error) {
    console.error('Error in removeSharedSelectionItem:', error);
    res.status(500).json({ success: false, error: 'Ошибка при удалении объекта' });
  }
}

/**
 * POST /api/selections/shared/:code/view - Записать просмотр подборки
 */
export async function recordSharedSelectionView(req: Request, res: Response) {
  try {
    const { code } = req.params;
    const { clientId } = req.body;

    if (!code || !isValidShareCode(code)) {
      return res.status(400).json({ success: false, error: 'Некорректный код подборки' });
    }

    const clientIdentifier = clientId || getClientIp(req) || 'anonymous';

    await selectionsService.recordView(code, clientIdentifier);

    res.json({ success: true });
  } catch (error) {
    console.error('Error in recordSharedSelectionView:', error);
    res.status(500).json({ success: false, error: 'Ошибка' });
  }
}

/**
 * GET /api/selections/my - Подборки для клиента (по его email)
 */
export async function getMySelections(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    if (!req.user.email) {
      return res.json({ success: true, data: [] });
    }

    const selections = await selectionsService.getClientSelections(req.user.email);

    res.json({
      success: true,
      data: selections
    });
  } catch (error) {
    console.error('Error in getMySelections:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении подборок' });
  }
}

/**
 * GET /api/selections/:id/activity - Лог действий подборки (для агента)
 */
export async function getSelectionActivity(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const activity = await selectionsService.getActivityLog(id, req.user.id);

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error in getSelectionActivity:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении активности' });
  }
}

/**
 * GET /api/selections/shared/:code/context - Получить контекст подборки для гостя
 * Возвращает информацию об агенте и агентстве для брендинга в гостевом режиме
 */
export async function getSharedSelectionContext(req: Request, res: Response) {
  try {
    const { code } = req.params;

    if (!code || !isValidShareCode(code)) {
      return res.status(400).json({ success: false, error: 'Некорректный код подборки' });
    }

    const context = await selectionsService.getSelectionGuestContext(code);

    if (!context) {
      return res.status(404).json({ success: false, error: 'Подборка не найдена' });
    }

    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    console.error('Error in getSharedSelectionContext:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении контекста' });
  }
}
