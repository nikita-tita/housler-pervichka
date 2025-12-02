import { Request, Response } from 'express';
import { DealsService, DealStatus, CommissionStatus } from '../../services/deals.service';

const dealsService = new DealsService();

const VALID_STATUSES: DealStatus[] = ['pending', 'signed', 'registered', 'completed', 'cancelled'];
const VALID_COMMISSION_STATUSES: CommissionStatus[] = ['pending', 'invoiced', 'paid'];

/**
 * GET /api/deals — Список сделок агента
 */
export async function getDeals(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const { status, clientId, commissionStatus, dateFrom, dateTo } = req.query;

    const filters = {
      status: VALID_STATUSES.includes(status as DealStatus) ? status as DealStatus : undefined,
      clientId: clientId ? parseInt(clientId as string) : undefined,
      commissionStatus: VALID_COMMISSION_STATUSES.includes(commissionStatus as CommissionStatus)
        ? commissionStatus as CommissionStatus
        : undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const deals = await dealsService.getAgentDeals(req.user.id, filters);

    res.json({
      success: true,
      data: deals
    });
  } catch (error) {
    console.error('Error in getDeals:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении сделок' });
  }
}

/**
 * POST /api/deals — Создать сделку из брони
 */
export async function createDeal(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const { bookingId, finalPrice, discountAmount, discountReason, commissionPercent, notes } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'bookingId обязателен'
      });
    }

    const deal = await dealsService.createDeal(req.user.id, {
      bookingId,
      finalPrice,
      discountAmount,
      discountReason,
      commissionPercent,
      notes
    });

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Бронь не найдена или не принадлежит агенту'
      });
    }

    res.status(201).json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Error in createDeal:', error);
    res.status(500).json({ success: false, error: 'Ошибка при создании сделки' });
  }
}

/**
 * GET /api/deals/stats — Статистика сделок
 */
export async function getDealsStats(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const stats = await dealsService.getDealsStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getDealsStats:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении статистики' });
  }
}

/**
 * GET /api/deals/:id — Детали сделки
 */
export async function getDeal(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const deal = await dealsService.getDealById(id, req.user.id);

    if (!deal) {
      return res.status(404).json({ success: false, error: 'Сделка не найдена' });
    }

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Error in getDeal:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении сделки' });
  }
}

/**
 * PATCH /api/deals/:id — Обновить данные сделки
 */
export async function updateDeal(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const {
      contractNumber, contractDate, finalPrice, discountAmount,
      discountReason, commissionPercent, registrationNumber, notes
    } = req.body;

    const deal = await dealsService.updateDeal(id, req.user.id, {
      contractNumber, contractDate, finalPrice, discountAmount,
      discountReason, commissionPercent, registrationNumber, notes
    });

    if (!deal) {
      return res.status(404).json({ success: false, error: 'Сделка не найдена' });
    }

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Error in updateDeal:', error);
    res.status(500).json({ success: false, error: 'Ошибка при обновлении сделки' });
  }
}

/**
 * PATCH /api/deals/:id/status — Обновить статус сделки
 */
export async function updateDealStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Некорректный статус. Допустимые: ${VALID_STATUSES.join(', ')}`
      });
    }

    const deal = await dealsService.updateDealStatus(id, req.user.id, status as DealStatus);

    if (!deal) {
      return res.status(404).json({ success: false, error: 'Сделка не найдена' });
    }

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Error in updateDealStatus:', error);
    res.status(500).json({ success: false, error: 'Ошибка при обновлении статуса' });
  }
}
