import { pool } from '../config/database';

export type CancellationStage = 'at_fixation' | 'at_booking' | 'at_deal';
export type InitiatedBy = 'client' | 'developer' | 'agent' | 'bank';

export interface Failure {
  id: number;
  price_lock_id: number | null;
  booking_id: number | null;
  deal_id: number | null;
  client_id: number | null;
  agent_id: number;
  offer_id: number | null;
  stage: CancellationStage;
  reason: string;
  reason_details: string | null;
  initiated_by: InitiatedBy;
  penalty_amount: number;
  created_at: string;
}

export interface FailureWithDetails extends Failure {
  offer_address: string | null;
  offer_rooms: number | null;
  complex_name: string | null;
  client_name: string | null;
  client_phone: string | null;
  reason_name: string | null;
}

export interface CancellationReason {
  id: number;
  stage: CancellationStage;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface CreateFailureDto {
  stage: CancellationStage;
  priceLockId?: number;
  bookingId?: number;
  dealId?: number;
  clientId?: number;
  offerId?: number;
  reason: string;
  reasonDetails?: string;
  initiatedBy: InitiatedBy;
  penaltyAmount?: number;
}

export interface FailureFilters {
  stage?: CancellationStage;
  reason?: string;
  initiatedBy?: InitiatedBy;
  dateFrom?: Date;
  dateTo?: Date;
}

export class FailuresService {
  /**
   * Создать запись о срыве
   */
  async createFailure(agentId: number, data: CreateFailureDto): Promise<Failure | null> {
    const result = await pool.query(`
      INSERT INTO deal_cancellations (
        price_lock_id, booking_id, deal_id, client_id, agent_id, offer_id,
        stage, reason, reason_details, initiated_by, penalty_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      data.priceLockId || null,
      data.bookingId || null,
      data.dealId || null,
      data.clientId || null,
      agentId,
      data.offerId || null,
      data.stage,
      data.reason,
      data.reasonDetails || null,
      data.initiatedBy,
      data.penaltyAmount || 0
    ]);

    const failure = result.rows[0];

    // Обновляем статус клиента на 'failed'
    if (data.clientId) {
      await pool.query(`
        UPDATE clients SET stage = 'failed', updated_at = NOW()
        WHERE id = $1 AND agent_id = $2
      `, [data.clientId, agentId]);

      await this.logClientActivity(data.clientId, agentId, 'deal_failed', data.stage, data.reason);
    }

    // Обновляем статус связанной сущности
    if (data.priceLockId) {
      await pool.query(`
        UPDATE price_locks SET status = 'rejected', updated_at = NOW()
        WHERE id = $1
      `, [data.priceLockId]);
    }

    if (data.bookingId) {
      await pool.query(`
        UPDATE bookings SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1
      `, [data.bookingId]);
    }

    if (data.dealId) {
      await pool.query(`
        UPDATE deals SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [data.dealId]);
    }

    return failure;
  }

  /**
   * Получить список срывов агента
   */
  async getAgentFailures(agentId: number, filters?: FailureFilters): Promise<FailureWithDetails[]> {
    let query = `
      SELECT
        dc.*,
        dc.penalty_amount::float as penalty_amount,
        o.address as offer_address,
        o.rooms as offer_rooms,
        cx.name as complex_name,
        c.name as client_name,
        c.phone as client_phone,
        cr.name as reason_name
      FROM deal_cancellations dc
      LEFT JOIN offers o ON dc.offer_id = o.id
      LEFT JOIN complexes cx ON o.complex_id = cx.id
      LEFT JOIN clients c ON dc.client_id = c.id
      LEFT JOIN cancellation_reasons cr ON dc.reason = cr.code AND dc.stage = cr.stage
      WHERE dc.agent_id = $1
    `;

    const params: any[] = [agentId];
    let paramIndex = 2;

    if (filters?.stage) {
      query += ` AND dc.stage = $${paramIndex}`;
      params.push(filters.stage);
      paramIndex++;
    }

    if (filters?.reason) {
      query += ` AND dc.reason = $${paramIndex}`;
      params.push(filters.reason);
      paramIndex++;
    }

    if (filters?.initiatedBy) {
      query += ` AND dc.initiated_by = $${paramIndex}`;
      params.push(filters.initiatedBy);
      paramIndex++;
    }

    if (filters?.dateFrom) {
      query += ` AND dc.created_at >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters?.dateTo) {
      query += ` AND dc.created_at <= $${paramIndex}`;
      params.push(filters.dateTo);
      paramIndex++;
    }

    query += ' ORDER BY dc.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Получить справочник причин срыва
   */
  async getCancellationReasons(stage?: CancellationStage): Promise<CancellationReason[]> {
    let query = `
      SELECT * FROM cancellation_reasons
      WHERE is_active = true
    `;

    const params: any[] = [];

    if (stage) {
      query += ` AND stage = $1`;
      params.push(stage);
    }

    query += ' ORDER BY stage, name';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Получить статистику срывов агента
   */
  async getFailuresStats(agentId: number): Promise<{
    total: number;
    atFixation: number;
    atBooking: number;
    atDeal: number;
    byClient: number;
    byDeveloper: number;
    byAgent: number;
    byBank: number;
    totalPenalty: number;
    topReasons: { reason: string; count: number }[];
  }> {
    const statsResult = await pool.query(`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE stage = 'at_fixation')::int as at_fixation,
        COUNT(*) FILTER (WHERE stage = 'at_booking')::int as at_booking,
        COUNT(*) FILTER (WHERE stage = 'at_deal')::int as at_deal,
        COUNT(*) FILTER (WHERE initiated_by = 'client')::int as by_client,
        COUNT(*) FILTER (WHERE initiated_by = 'developer')::int as by_developer,
        COUNT(*) FILTER (WHERE initiated_by = 'agent')::int as by_agent,
        COUNT(*) FILTER (WHERE initiated_by = 'bank')::int as by_bank,
        COALESCE(SUM(penalty_amount), 0)::float as total_penalty
      FROM deal_cancellations
      WHERE agent_id = $1
    `, [agentId]);

    const reasonsResult = await pool.query(`
      SELECT
        COALESCE(cr.name, dc.reason) as reason,
        COUNT(*)::int as count
      FROM deal_cancellations dc
      LEFT JOIN cancellation_reasons cr ON dc.reason = cr.code AND dc.stage = cr.stage
      WHERE dc.agent_id = $1
      GROUP BY COALESCE(cr.name, dc.reason)
      ORDER BY count DESC
      LIMIT 5
    `, [agentId]);

    const stats = statsResult.rows[0];

    return {
      total: stats.total,
      atFixation: stats.at_fixation,
      atBooking: stats.at_booking,
      atDeal: stats.at_deal,
      byClient: stats.by_client,
      byDeveloper: stats.by_developer,
      byAgent: stats.by_agent,
      byBank: stats.by_bank,
      totalPenalty: stats.total_penalty,
      topReasons: reasonsResult.rows
    };
  }

  /**
   * Записать в лог активности клиента
   */
  private async logClientActivity(
    clientId: number,
    agentId: number,
    action: string,
    oldValue: string | null,
    newValue: string | null
  ): Promise<void> {
    await pool.query(`
      INSERT INTO client_activity_log (client_id, agent_id, action, old_value, new_value)
      VALUES ($1, $2, $3, $4, $5)
    `, [clientId, agentId, action, oldValue, newValue]);
  }
}
