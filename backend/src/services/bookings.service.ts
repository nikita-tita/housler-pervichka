import { pool } from '../config/database';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: number;
  offer_id: number;
  agent_id: number | null;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  status: BookingStatus;
  agent_comment: string | null;
  operator_comment: string | null;
  processed_by: number | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithOffer extends Booking {
  offer_external_id: string;
  offer_address: string;
  offer_rooms: number;
  offer_price: number;
  offer_building_name: string | null;
}

export class BookingsService {
  /**
   * Создать заявку на бронирование
   */
  async createBooking(data: {
    offerId: number;
    agentId?: number;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    comment?: string;
  }): Promise<Booking | null> {
    // Проверяем существование объявления
    const offerExists = await pool.query(
      'SELECT id FROM offers WHERE id = $1 AND is_active = true',
      [data.offerId]
    );

    if (offerExists.rows.length === 0) {
      return null;
    }

    const result = await pool.query(`
      INSERT INTO bookings (offer_id, agent_id, client_name, client_phone, client_email, agent_comment)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      data.offerId,
      data.agentId || null,
      data.clientName,
      data.clientPhone,
      data.clientEmail || null,
      data.comment || null
    ]);

    return result.rows[0];
  }

  /**
   * Получить заявки агента
   */
  async getAgentBookings(agentId: number): Promise<BookingWithOffer[]> {
    const result = await pool.query(`
      SELECT
        b.*,
        o.external_id as offer_external_id,
        o.address as offer_address,
        o.rooms as offer_rooms,
        o.price as offer_price,
        o.building_name as offer_building_name
      FROM bookings b
      JOIN offers o ON b.offer_id = o.id
      WHERE b.agent_id = $1
      ORDER BY b.created_at DESC
    `, [agentId]);

    return result.rows;
  }

  /**
   * Получить все заявки (для оператора)
   */
  async getAllBookings(filters?: {
    status?: BookingStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<BookingWithOffer[]> {
    let query = `
      SELECT
        b.*,
        o.external_id as offer_external_id,
        o.address as offer_address,
        o.rooms as offer_rooms,
        o.price as offer_price,
        o.building_name as offer_building_name
      FROM bookings b
      JOIN offers o ON b.offer_id = o.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.dateFrom) {
      query += ` AND b.created_at >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters?.dateTo) {
      query += ` AND b.created_at <= $${paramIndex}`;
      params.push(filters.dateTo);
      paramIndex++;
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Получить заявку по ID
   */
  async getBookingById(bookingId: number): Promise<BookingWithOffer | null> {
    const result = await pool.query(`
      SELECT
        b.*,
        o.external_id as offer_external_id,
        o.address as offer_address,
        o.rooms as offer_rooms,
        o.price as offer_price,
        o.building_name as offer_building_name
      FROM bookings b
      JOIN offers o ON b.offer_id = o.id
      WHERE b.id = $1
    `, [bookingId]);

    return result.rows[0] || null;
  }

  /**
   * Обновить статус заявки (для оператора)
   */
  async updateBookingStatus(
    bookingId: number,
    operatorId: number,
    status: BookingStatus,
    comment?: string
  ): Promise<Booking | null> {
    const result = await pool.query(`
      UPDATE bookings
      SET status = $1,
          operator_comment = COALESCE($2, operator_comment),
          processed_by = $3,
          processed_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [status, comment || null, operatorId, bookingId]);

    return result.rows[0] || null;
  }

  /**
   * Получить статистику заявок
   */
  async getBookingsStats(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    todayCount: number;
  }> {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE status = 'confirmed')::int as confirmed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int as cancelled,
        COUNT(*) FILTER (WHERE status = 'completed')::int as completed,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int as today_count
      FROM bookings
    `);

    return {
      total: result.rows[0].total,
      pending: result.rows[0].pending,
      confirmed: result.rows[0].confirmed,
      cancelled: result.rows[0].cancelled,
      completed: result.rows[0].completed,
      todayCount: result.rows[0].today_count
    };
  }
}
