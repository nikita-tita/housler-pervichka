import { Request, Response } from 'express';
import { FixationsService, FixationStatus } from '../../services/fixations.service';

const fixationsService = new FixationsService();

const VALID_STATUSES: FixationStatus[] = ['pending', 'approved', 'rejected', 'expired', 'converted'];

/**
 * GET /api/fixations — Список фиксаций агента
 */
export async function getFixations(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const { status, clientId, dateFrom, dateTo } = req.query;

    const filters = {
      status: VALID_STATUSES.includes(status as FixationStatus) ? status as FixationStatus : undefined,
      clientId: clientId ? parseInt(clientId as string) : undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const fixations = await fixationsService.getAgentFixations(req.user.id, filters);

    res.json({
      success: true,
      data: fixations
    });
  } catch (error) {
    console.error('Error in getFixations:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении фиксаций' });
  }
}

/**
 * POST /api/fixations — Создать фиксацию
 */
export async function createFixation(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const { clientId, offerId, clientName, clientPhone, clientEmail, requestedDays, comment } = req.body;

    // Валидация
    if (!offerId || !clientName || !clientPhone) {
      return res.status(400).json({
        success: false,
        error: 'offerId, clientName и clientPhone обязательны'
      });
    }

    const phoneRegex = /^[\d\s\+\-\(\)]{10,20}$/;
    if (!phoneRegex.test(clientPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный номер телефона'
      });
    }

    const fixation = await fixationsService.createFixation(req.user.id, {
      clientId,
      offerId,
      clientName,
      clientPhone,
      clientEmail,
      requestedDays,
      comment
    });

    if (!fixation) {
      return res.status(404).json({
        success: false,
        error: 'Объект недвижимости не найден'
      });
    }

    res.status(201).json({
      success: true,
      data: fixation
    });
  } catch (error) {
    console.error('Error in createFixation:', error);
    res.status(500).json({ success: false, error: 'Ошибка при создании фиксации' });
  }
}

/**
 * GET /api/fixations/stats — Статистика фиксаций
 */
export async function getFixationsStats(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const stats = await fixationsService.getFixationsStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getFixationsStats:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении статистики' });
  }
}

/**
 * GET /api/fixations/:id — Детали фиксации
 */
export async function getFixation(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const fixation = await fixationsService.getFixationById(id, req.user.id);

    if (!fixation) {
      return res.status(404).json({ success: false, error: 'Фиксация не найдена' });
    }

    res.json({
      success: true,
      data: fixation
    });
  } catch (error) {
    console.error('Error in getFixation:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении фиксации' });
  }
}

/**
 * PATCH /api/fixations/:id/status — Обновить статус фиксации (для оператора)
 */
export async function updateFixationStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const { status, approvedDays, comment, developerResponse } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Некорректный статус. Допустимые: ${VALID_STATUSES.join(', ')}`
      });
    }

    const fixation = await fixationsService.updateFixationStatus(
      id,
      req.user.id,
      status as FixationStatus,
      { approvedDays, comment, developerResponse }
    );

    if (!fixation) {
      return res.status(404).json({ success: false, error: 'Фиксация не найдена' });
    }

    res.json({
      success: true,
      data: fixation
    });
  } catch (error) {
    console.error('Error in updateFixationStatus:', error);
    res.status(500).json({ success: false, error: 'Ошибка при обновлении статуса' });
  }
}

/**
 * POST /api/fixations/:id/convert — Конвертировать в бронь
 */
export async function convertToBooking(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const result = await fixationsService.convertToBooking(id, req.user.id);

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Невозможно конвертировать. Фиксация не найдена или не одобрена.'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in convertToBooking:', error);
    res.status(500).json({ success: false, error: 'Ошибка при конвертации в бронь' });
  }
}

/**
 * DELETE /api/fixations/:id — Удалить фиксацию (только pending)
 */
export async function deleteFixation(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const deleted = await fixationsService.deleteFixation(id, req.user.id);

    if (!deleted) {
      return res.status(400).json({
        success: false,
        error: 'Фиксация не найдена или её нельзя удалить (не в статусе pending)'
      });
    }

    res.json({
      success: true,
      message: 'Фиксация удалена'
    });
  } catch (error) {
    console.error('Error in deleteFixation:', error);
    res.status(500).json({ success: false, error: 'Ошибка при удалении фиксации' });
  }
}
