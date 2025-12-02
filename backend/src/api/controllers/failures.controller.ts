import { Request, Response } from 'express';
import { FailuresService, CancellationStage, InitiatedBy } from '../../services/failures.service';

const failuresService = new FailuresService();

const VALID_STAGES: CancellationStage[] = ['at_fixation', 'at_booking', 'at_deal'];
const VALID_INITIATORS: InitiatedBy[] = ['client', 'developer', 'agent', 'bank'];

/**
 * GET /api/failures — Список срывов агента
 */
export async function getFailures(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const { stage, reason, initiatedBy, dateFrom, dateTo } = req.query;

    const filters = {
      stage: VALID_STAGES.includes(stage as CancellationStage) ? stage as CancellationStage : undefined,
      reason: reason as string | undefined,
      initiatedBy: VALID_INITIATORS.includes(initiatedBy as InitiatedBy) ? initiatedBy as InitiatedBy : undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const failures = await failuresService.getAgentFailures(req.user.id, filters);

    res.json({
      success: true,
      data: failures
    });
  } catch (error) {
    console.error('Error in getFailures:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении срывов' });
  }
}

/**
 * POST /api/failures — Зарегистрировать срыв
 */
export async function createFailure(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const {
      stage, priceLockId, bookingId, dealId, clientId, offerId,
      reason, reasonDetails, initiatedBy, penaltyAmount
    } = req.body;

    // Валидация
    if (!stage || !VALID_STAGES.includes(stage)) {
      return res.status(400).json({
        success: false,
        error: `stage обязателен. Допустимые: ${VALID_STAGES.join(', ')}`
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'reason обязателен'
      });
    }

    if (!initiatedBy || !VALID_INITIATORS.includes(initiatedBy)) {
      return res.status(400).json({
        success: false,
        error: `initiatedBy обязателен. Допустимые: ${VALID_INITIATORS.join(', ')}`
      });
    }

    const failure = await failuresService.createFailure(req.user.id, {
      stage,
      priceLockId,
      bookingId,
      dealId,
      clientId,
      offerId,
      reason,
      reasonDetails,
      initiatedBy,
      penaltyAmount
    });

    if (!failure) {
      return res.status(500).json({
        success: false,
        error: 'Ошибка при создании записи о срыве'
      });
    }

    res.status(201).json({
      success: true,
      data: failure
    });
  } catch (error) {
    console.error('Error in createFailure:', error);
    res.status(500).json({ success: false, error: 'Ошибка при регистрации срыва' });
  }
}

/**
 * GET /api/failures/reasons — Справочник причин срыва
 */
export async function getCancellationReasons(req: Request, res: Response) {
  try {
    const { stage } = req.query;

    const stageFilter = VALID_STAGES.includes(stage as CancellationStage)
      ? stage as CancellationStage
      : undefined;

    const reasons = await failuresService.getCancellationReasons(stageFilter);

    res.json({
      success: true,
      data: reasons
    });
  } catch (error) {
    console.error('Error in getCancellationReasons:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении причин' });
  }
}

/**
 * GET /api/failures/stats — Статистика срывов
 */
export async function getFailuresStats(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const stats = await failuresService.getFailuresStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getFailuresStats:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении статистики' });
  }
}
