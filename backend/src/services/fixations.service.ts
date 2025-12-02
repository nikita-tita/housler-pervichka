import { pool } from '../config/database';

export type FixationStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'converted';

export interface Fixation {
  id: number;
  lock_number: string;
  agent_id: number;
  client_id: number | null;
  selection_id: number | null;
  offer_id: number;
  operator_id: number | null;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  locked_price: number;
  requested_days: number;
  approved_days: number | null;
  expires_at: string | null;
  status: FixationStatus;
  agent_comment: string | null;
  operator_comment: string | null;
  developer_response: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  expired_at: string | null;
  converted_at: string | null;
  booking_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FixationWithOffer extends Fixation {
  offer_address: string | null;
  offer_rooms: number | null;
  offer_area: number | null;
  complex_name: string | null;
  building_name: string | null;
  client_stage?: string;
}

export interface FixationDetail extends FixationWithOffer {
  offer_floor: number | null;
  offer_floors_total: number | null;
  offer_price_current: number | null;
  offer_image: string | null;
}

export interface CreateFixationDto {
  clientId?: number;
  offerId: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  requestedDays?: number;
  comment?: string;
}

export interface FixationFilters {
  status?: FixationStatus;
  clientId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export class FixationsService {
  /**
   * Генерация номера фиксации: PL-YYYY-NNNN
   */
  private async generateLockNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await pool.query(`
      SELECT COUNT(*) + 1 as next_num
      FROM price_locks
      WHERE EXTRACT(YEAR FROM created_at) = $1
    `, [year]);

    const nextNum = result.rows[0].next_num;
    return `PL-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  /**
   * Создать фиксацию цены
   */
  async createFixation(agentId: number, data: CreateFixationDto): Promise<Fixation | null> {
    // Проверяем существование объекта и получаем текущую цену
    const offerResult = await pool.query(`
      SELECT id, price FROM offers WHERE id = $1 AND is_active = true
    `, [data.offerId]);

    if (offerResult.rows.length === 0) {
      return null;
    }

    const lockedPrice = offerResult.rows[0].price;
    const lockNumber = await this.generateLockNumber();
    const requestedDays = data.requestedDays || 7;

    const result = await pool.query(`
      INSERT INTO price_locks (
        lock_number, agent_id, client_id, offer_id,
        client_name, client_phone, client_email,
        locked_price, requested_days, agent_comment, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING *
    `, [
      lockNumber,
      agentId,
      data.clientId || null,
      data.offerId,
      data.clientName,
      data.clientPhone,
      data.clientEmail || null,
      lockedPrice,
      requestedDays,
      data.comment || null
    ]);

    const fixation = result.rows[0];

    // Если привязан клиент — обновляем его этап на 'fixation'
    if (data.clientId) {
      await this.updateClientStageOnFixation(data.clientId, agentId);
      await this.logClientActivity(data.clientId, agentId, 'fixation_created', null, lockNumber);
    }

    return fixation;
  }

  /**
   * Получить фиксации агента
   */
  async getAgentFixations(agentId: number, filters?: FixationFilters): Promise<FixationWithOffer[]> {
    let query = `
      SELECT
        pl.*,
        pl.locked_price::float as locked_price,
        o.address as offer_address,
        o.rooms as offer_rooms,
        o.area_total::float as offer_area,
        c.name as complex_name,
        o.building_name,
        cl.stage as client_stage
      FROM price_locks pl
      JOIN offers o ON pl.offer_id = o.id
      LEFT JOIN complexes c ON o.complex_id = c.id
      LEFT JOIN clients cl ON pl.client_id = cl.id
      WHERE pl.agent_id = $1
    `;

    const params: any[] = [agentId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND pl.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.clientId) {
      query += ` AND pl.client_id = $${paramIndex}`;
      params.push(filters.clientId);
      paramIndex++;
    }

    if (filters?.dateFrom) {
      query += ` AND pl.created_at >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters?.dateTo) {
      query += ` AND pl.created_at <= $${paramIndex}`;
      params.push(filters.dateTo);
      paramIndex++;
    }

    query += ' ORDER BY pl.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Получить фиксацию по ID
   */
  async getFixationById(fixationId: number, agentId: number): Promise<FixationDetail | null> {
    const result = await pool.query(`
      SELECT
        pl.*,
        pl.locked_price::float as locked_price,
        o.address as offer_address,
        o.rooms as offer_rooms,
        o.area_total::float as offer_area,
        o.floor as offer_floor,
        o.floors_total as offer_floors_total,
        o.price::float as offer_price_current,
        c.name as complex_name,
        o.building_name,
        (SELECT url FROM offer_images oi WHERE oi.offer_id = o.id LIMIT 1) as offer_image,
        cl.stage as client_stage
      FROM price_locks pl
      JOIN offers o ON pl.offer_id = o.id
      LEFT JOIN complexes c ON o.complex_id = c.id
      LEFT JOIN clients cl ON pl.client_id = cl.id
      WHERE pl.id = $1 AND pl.agent_id = $2
    `, [fixationId, agentId]);

    return result.rows[0] || null;
  }

  /**
   * Обновить статус фиксации (для оператора)
   */
  async updateFixationStatus(
    fixationId: number,
    operatorId: number,
    status: FixationStatus,
    data?: { approvedDays?: number; comment?: string; developerResponse?: string }
  ): Promise<Fixation | null> {
    let expiresAt: Date | null = null;

    // Если одобрено — вычисляем дату истечения
    if (status === 'approved' && data?.approvedDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.approvedDays);
    }

    const result = await pool.query(`
      UPDATE price_locks
      SET
        status = $1,
        operator_id = $2,
        operator_comment = COALESCE($3, operator_comment),
        developer_response = COALESCE($4, developer_response),
        approved_days = COALESCE($5, approved_days),
        expires_at = COALESCE($6, expires_at),
        approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END,
        expired_at = CASE WHEN $1 = 'expired' THEN NOW() ELSE expired_at END,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [
      status,
      operatorId,
      data?.comment || null,
      data?.developerResponse || null,
      data?.approvedDays || null,
      expiresAt,
      fixationId
    ]);

    const fixation = result.rows[0];

    // Обновляем статус клиента если фиксация отклонена/истекла
    if (fixation && fixation.client_id && (status === 'rejected' || status === 'expired')) {
      await this.revertClientStage(fixation.client_id, fixation.agent_id);
    }

    return fixation || null;
  }

  /**
   * Конвертировать фиксацию в бронь
   */
  async convertToBooking(fixationId: number, agentId: number): Promise<{ booking_id: number } | null> {
    const fixation = await this.getFixationById(fixationId, agentId);

    if (!fixation || fixation.status !== 'approved') {
      return null;
    }

    // Создаём бронь
    const bookingResult = await pool.query(`
      INSERT INTO bookings (offer_id, agent_id, client_name, client_phone, client_email, agent_comment, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id
    `, [
      fixation.offer_id,
      agentId,
      fixation.client_name,
      fixation.client_phone,
      fixation.client_email,
      `Из фиксации ${fixation.lock_number}`
    ]);

    const bookingId = bookingResult.rows[0].id;

    // Обновляем фиксацию
    await pool.query(`
      UPDATE price_locks
      SET status = 'converted', converted_at = NOW(), booking_id = $1, updated_at = NOW()
      WHERE id = $2
    `, [bookingId, fixationId]);

    // Обновляем этап клиента на 'booking'
    if (fixation.client_id) {
      await pool.query(`
        UPDATE clients SET stage = 'booking', updated_at = NOW()
        WHERE id = $1 AND agent_id = $2
      `, [fixation.client_id, agentId]);

      await this.logClientActivity(fixation.client_id, agentId, 'booking_linked', fixation.lock_number, String(bookingId));
    }

    return { booking_id: bookingId };
  }

  /**
   * Получить статистику фиксаций агента
   */
  async getFixationsStats(agentId: number): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
    converted: number;
    expiringToday: number;
  }> {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE status = 'approved')::int as approved,
        COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected,
        COUNT(*) FILTER (WHERE status = 'expired')::int as expired,
        COUNT(*) FILTER (WHERE status = 'converted')::int as converted,
        COUNT(*) FILTER (WHERE status = 'approved' AND expires_at::date = CURRENT_DATE)::int as expiring_today
      FROM price_locks
      WHERE agent_id = $1
    `, [agentId]);

    return {
      total: result.rows[0].total,
      pending: result.rows[0].pending,
      approved: result.rows[0].approved,
      rejected: result.rows[0].rejected,
      expired: result.rows[0].expired,
      converted: result.rows[0].converted,
      expiringToday: result.rows[0].expiring_today
    };
  }

  /**
   * Обновить этап клиента при создании фиксации
   */
  private async updateClientStageOnFixation(clientId: number, agentId: number): Promise<void> {
    // Переводим в 'fixation' только если текущий этап ниже
    await pool.query(`
      UPDATE clients
      SET stage = 'fixation', updated_at = NOW()
      WHERE id = $1 AND agent_id = $2
        AND stage IN ('new', 'in_progress')
    `, [clientId, agentId]);
  }

  /**
   * Откатить этап клиента при отклонении/истечении фиксации
   */
  private async revertClientStage(clientId: number, agentId: number): Promise<void> {
    // Проверяем, есть ли другие активные фиксации
    const activeFixations = await pool.query(`
      SELECT COUNT(*) as cnt FROM price_locks
      WHERE client_id = $1 AND status IN ('pending', 'approved')
    `, [clientId]);

    if (activeFixations.rows[0].cnt === 0) {
      // Нет активных фиксаций — откатываем в 'in_progress'
      await pool.query(`
        UPDATE clients
        SET stage = 'in_progress', updated_at = NOW()
        WHERE id = $1 AND agent_id = $2 AND stage = 'fixation'
      `, [clientId, agentId]);
    }
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

  /**
   * Удалить фиксацию (только pending)
   */
  async deleteFixation(fixationId: number, agentId: number): Promise<boolean> {
    const result = await pool.query(`
      DELETE FROM price_locks
      WHERE id = $1 AND agent_id = $2 AND status = 'pending'
      RETURNING id
    `, [fixationId, agentId]);

    return result.rows.length > 0;
  }
}
