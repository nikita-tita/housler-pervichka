import { pool } from '../config/database';

export type DealStatus = 'pending' | 'signed' | 'registered' | 'completed' | 'cancelled';
export type CommissionStatus = 'pending' | 'invoiced' | 'paid';

export interface Deal {
  id: number;
  deal_number: string;
  booking_id: number | null;
  client_id: number | null;
  agent_id: number;
  offer_id: number;
  contract_number: string | null;
  contract_date: string | null;
  final_price: number;
  discount_amount: number;
  discount_reason: string | null;
  commission_percent: number | null;
  commission_amount: number | null;
  commission_paid_at: string | null;
  commission_payment_status: CommissionStatus;
  status: DealStatus;
  signed_at: string | null;
  registered_at: string | null;
  registration_number: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealWithOffer extends Deal {
  offer_address: string | null;
  offer_rooms: number | null;
  offer_area: number | null;
  complex_name: string | null;
  building_name: string | null;
  client_name: string | null;
  client_phone: string | null;
}

export interface DealDetail extends DealWithOffer {
  offer_floor: number | null;
  offer_floors_total: number | null;
  offer_image: string | null;
  booking_status: string | null;
}

export interface CreateDealDto {
  bookingId: number;
  finalPrice?: number;
  discountAmount?: number;
  discountReason?: string;
  commissionPercent?: number;
  notes?: string;
}

export interface UpdateDealDto {
  contractNumber?: string;
  contractDate?: string;
  finalPrice?: number;
  discountAmount?: number;
  discountReason?: string;
  commissionPercent?: number;
  registrationNumber?: string;
  notes?: string;
}

export interface DealFilters {
  status?: DealStatus;
  clientId?: number;
  commissionStatus?: CommissionStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export class DealsService {
  /**
   * Генерация номера сделки: D-YYYY-NNNN
   */
  private async generateDealNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await pool.query(`
      SELECT COUNT(*) + 1 as next_num
      FROM deals
      WHERE EXTRACT(YEAR FROM created_at) = $1
    `, [year]);

    const nextNum = result.rows[0].next_num;
    return `D-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  /**
   * Создать сделку из брони
   */
  async createDeal(agentId: number, data: CreateDealDto): Promise<Deal | null> {
    // Получаем бронь с информацией об объекте
    const bookingResult = await pool.query(`
      SELECT b.*, o.price::float as offer_price, c.id as client_id
      FROM bookings b
      JOIN offers o ON b.offer_id = o.id
      LEFT JOIN clients c ON c.phone = b.client_phone AND c.agent_id = $1
      WHERE b.id = $2 AND (b.agent_id = $1 OR b.agent_id IS NULL)
    `, [agentId, data.bookingId]);

    if (bookingResult.rows.length === 0) {
      return null;
    }

    const booking = bookingResult.rows[0];
    const finalPrice = data.finalPrice || booking.offer_price;
    const dealNumber = await this.generateDealNumber();

    // Рассчитываем комиссию
    const commissionAmount = data.commissionPercent
      ? finalPrice * (data.commissionPercent / 100)
      : null;

    const result = await pool.query(`
      INSERT INTO deals (
        deal_number, booking_id, client_id, agent_id, offer_id,
        final_price, discount_amount, discount_reason,
        commission_percent, commission_amount, notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *
    `, [
      dealNumber,
      data.bookingId,
      booking.client_id || null,
      agentId,
      booking.offer_id,
      finalPrice,
      data.discountAmount || 0,
      data.discountReason || null,
      data.commissionPercent || null,
      commissionAmount,
      data.notes || null
    ]);

    const deal = result.rows[0];

    // Обновляем статус клиента на 'deal'
    if (booking.client_id) {
      await pool.query(`
        UPDATE clients SET stage = 'deal', updated_at = NOW()
        WHERE id = $1 AND agent_id = $2
      `, [booking.client_id, agentId]);

      await this.logClientActivity(booking.client_id, agentId, 'deal_created', null, dealNumber);
    }

    return deal;
  }

  /**
   * Получить сделки агента
   */
  async getAgentDeals(agentId: number, filters?: DealFilters): Promise<DealWithOffer[]> {
    let query = `
      SELECT
        d.*,
        d.final_price::float as final_price,
        d.discount_amount::float as discount_amount,
        d.commission_amount::float as commission_amount,
        o.address as offer_address,
        o.rooms as offer_rooms,
        o.area_total::float as offer_area,
        cx.name as complex_name,
        o.building_name,
        COALESCE(c.name, b.client_name) as client_name,
        COALESCE(c.phone, b.client_phone) as client_phone
      FROM deals d
      JOIN offers o ON d.offer_id = o.id
      LEFT JOIN complexes cx ON o.complex_id = cx.id
      LEFT JOIN bookings b ON d.booking_id = b.id
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.agent_id = $1
    `;

    const params: any[] = [agentId];
    let paramIndex = 2;

    if (filters?.status) {
      query += ` AND d.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.clientId) {
      query += ` AND d.client_id = $${paramIndex}`;
      params.push(filters.clientId);
      paramIndex++;
    }

    if (filters?.commissionStatus) {
      query += ` AND d.commission_payment_status = $${paramIndex}`;
      params.push(filters.commissionStatus);
      paramIndex++;
    }

    if (filters?.dateFrom) {
      query += ` AND d.created_at >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters?.dateTo) {
      query += ` AND d.created_at <= $${paramIndex}`;
      params.push(filters.dateTo);
      paramIndex++;
    }

    query += ' ORDER BY d.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Получить сделку по ID
   */
  async getDealById(dealId: number, agentId: number): Promise<DealDetail | null> {
    const result = await pool.query(`
      SELECT
        d.*,
        d.final_price::float as final_price,
        d.discount_amount::float as discount_amount,
        d.commission_amount::float as commission_amount,
        o.address as offer_address,
        o.rooms as offer_rooms,
        o.area_total::float as offer_area,
        o.floor as offer_floor,
        o.floors_total as offer_floors_total,
        cx.name as complex_name,
        o.building_name,
        COALESCE(c.name, b.client_name) as client_name,
        COALESCE(c.phone, b.client_phone) as client_phone,
        (SELECT url FROM offer_images oi WHERE oi.offer_id = o.id LIMIT 1) as offer_image,
        b.status as booking_status
      FROM deals d
      JOIN offers o ON d.offer_id = o.id
      LEFT JOIN complexes cx ON o.complex_id = cx.id
      LEFT JOIN bookings b ON d.booking_id = b.id
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.id = $1 AND d.agent_id = $2
    `, [dealId, agentId]);

    return result.rows[0] || null;
  }

  /**
   * Обновить данные сделки
   */
  async updateDeal(dealId: number, agentId: number, data: UpdateDealDto): Promise<Deal | null> {
    // Пересчитываем комиссию если изменилась цена или процент
    let commissionAmount: number | null = null;

    if (data.finalPrice !== undefined || data.commissionPercent !== undefined) {
      const currentDeal = await this.getDealById(dealId, agentId);
      if (currentDeal) {
        const price = data.finalPrice ?? currentDeal.final_price;
        const percent = data.commissionPercent ?? currentDeal.commission_percent;
        if (percent) {
          commissionAmount = price * (percent / 100);
        }
      }
    }

    const result = await pool.query(`
      UPDATE deals
      SET
        contract_number = COALESCE($1, contract_number),
        contract_date = COALESCE($2, contract_date),
        final_price = COALESCE($3, final_price),
        discount_amount = COALESCE($4, discount_amount),
        discount_reason = COALESCE($5, discount_reason),
        commission_percent = COALESCE($6, commission_percent),
        commission_amount = COALESCE($7, commission_amount),
        registration_number = COALESCE($8, registration_number),
        notes = COALESCE($9, notes),
        updated_at = NOW()
      WHERE id = $10 AND agent_id = $11
      RETURNING *
    `, [
      data.contractNumber || null,
      data.contractDate || null,
      data.finalPrice || null,
      data.discountAmount || null,
      data.discountReason || null,
      data.commissionPercent || null,
      commissionAmount,
      data.registrationNumber || null,
      data.notes || null,
      dealId,
      agentId
    ]);

    return result.rows[0] || null;
  }

  /**
   * Обновить статус сделки
   */
  async updateDealStatus(dealId: number, agentId: number, status: DealStatus): Promise<Deal | null> {
    const timestampFields: Record<DealStatus, string | null> = {
      pending: null,
      signed: 'signed_at',
      registered: 'registered_at',
      completed: 'completed_at',
      cancelled: 'cancelled_at'
    };
    const timestampField = timestampFields[status];

    let query = `
      UPDATE deals
      SET status = $1, updated_at = NOW()
    `;

    if (timestampField) {
      query += `, ${timestampField} = NOW()`;
    }

    query += ` WHERE id = $2 AND agent_id = $3 RETURNING *`;

    const result = await pool.query(query, [status, dealId, agentId]);
    const deal = result.rows[0];

    // Обновляем статус клиента
    if (deal && deal.client_id) {
      if (status === 'completed') {
        await pool.query(`
          UPDATE clients SET stage = 'completed', updated_at = NOW()
          WHERE id = $1 AND agent_id = $2
        `, [deal.client_id, agentId]);

        await this.logClientActivity(deal.client_id, agentId, 'deal_completed', 'deal', 'completed');
      } else if (status === 'cancelled') {
        // При отмене — откатываем в 'booking' или 'in_progress'
        await pool.query(`
          UPDATE clients SET stage = 'in_progress', updated_at = NOW()
          WHERE id = $1 AND agent_id = $2 AND stage = 'deal'
        `, [deal.client_id, agentId]);

        await this.logClientActivity(deal.client_id, agentId, 'deal_cancelled', deal.deal_number, null);
      }
    }

    return deal || null;
  }

  /**
   * Получить статистику сделок агента
   */
  async getDealsStats(agentId: number): Promise<{
    total: number;
    pending: number;
    signed: number;
    registered: number;
    completed: number;
    cancelled: number;
    totalValue: number;
    totalCommission: number;
    pendingCommission: number;
  }> {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE status = 'signed')::int as signed,
        COUNT(*) FILTER (WHERE status = 'registered')::int as registered,
        COUNT(*) FILTER (WHERE status = 'completed')::int as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int as cancelled,
        COALESCE(SUM(final_price) FILTER (WHERE status = 'completed'), 0)::float as total_value,
        COALESCE(SUM(commission_amount) FILTER (WHERE status = 'completed'), 0)::float as total_commission,
        COALESCE(SUM(commission_amount) FILTER (WHERE status = 'completed' AND commission_payment_status != 'paid'), 0)::float as pending_commission
      FROM deals
      WHERE agent_id = $1
    `, [agentId]);

    return {
      total: result.rows[0].total,
      pending: result.rows[0].pending,
      signed: result.rows[0].signed,
      registered: result.rows[0].registered,
      completed: result.rows[0].completed,
      cancelled: result.rows[0].cancelled,
      totalValue: result.rows[0].total_value,
      totalCommission: result.rows[0].total_commission,
      pendingCommission: result.rows[0].pending_commission
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
