import { pool } from '../config/database';

// === TYPES ===

export type ClientSource = 'manual' | 'selection' | 'booking' | 'import' | 'website';
export type ClientStage = 'new' | 'in_progress' | 'fixation' | 'booking' | 'deal' | 'completed' | 'failed';
export type ClientPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Client {
  id: number;
  agent_id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  telegram: string | null;
  whatsapp: string | null;
  source: ClientSource;
  stage: ClientStage;
  priority: ClientPriority;
  comment: string | null;
  budget_min: number | null;
  budget_max: number | null;
  desired_rooms: number[] | null;
  desired_districts: number[] | null;
  desired_deadline: string | null;
  next_contact_date: string | null;
  last_contact_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientListItem extends Client {
  selections_count: number;
  bookings_count: number;
}

export interface ClientDetail extends Client {
  selections: {
    id: number;
    name: string;
    items_count: number;
    created_at: string;
  }[];
  bookings: {
    id: number;
    offer_id: number;
    status: string;
    created_at: string;
    complex_name: string | null;
  }[];
  activity: {
    id: number;
    action: string;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
  }[];
}

export interface CreateClientDto {
  name?: string;
  phone?: string;
  email?: string;
  telegram?: string;
  whatsapp?: string;
  source?: ClientSource;
  stage?: ClientStage;
  priority?: ClientPriority;
  comment?: string;
  budget_min?: number;
  budget_max?: number;
  desired_rooms?: number[];
  desired_districts?: number[];
  desired_deadline?: string;
  next_contact_date?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export interface ClientFilters {
  search?: string;
  stage?: ClientStage;
  priority?: ClientPriority;
  hasNextContact?: boolean;
}

export interface FunnelStats {
  new: number;
  in_progress: number;
  fixation: number;
  booking: number;
  deal: number;
  completed: number;
  failed: number;
  total: number;
}

// === SERVICE ===

export class ClientsService {

  /**
   * Получить список клиентов агента
   */
  async getAgentClients(agentId: number, filters?: ClientFilters): Promise<ClientListItem[]> {
    let query = `
      SELECT
        c.*,
        COALESCE(s.cnt, 0)::int as selections_count,
        COALESCE(b.cnt, 0)::int as bookings_count
      FROM clients c
      LEFT JOIN (
        SELECT client_id, COUNT(*) as cnt
        FROM selections
        WHERE client_id IS NOT NULL
        GROUP BY client_id
      ) s ON s.client_id = c.id
      LEFT JOIN (
        SELECT client_id, COUNT(*) as cnt
        FROM bookings
        WHERE client_id IS NOT NULL
        GROUP BY client_id
      ) b ON b.client_id = c.id
      WHERE c.agent_id = $1
    `;

    const params: any[] = [agentId];
    let paramIndex = 2;

    if (filters?.search) {
      query += ` AND (
        c.name ILIKE $${paramIndex} OR
        c.phone ILIKE $${paramIndex} OR
        c.email ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.stage) {
      query += ` AND c.stage = $${paramIndex}`;
      params.push(filters.stage);
      paramIndex++;
    }

    if (filters?.priority) {
      query += ` AND c.priority = $${paramIndex}`;
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters?.hasNextContact) {
      query += ` AND c.next_contact_date IS NOT NULL`;
    }

    query += ` ORDER BY
      CASE c.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      c.next_contact_date ASC NULLS LAST,
      c.created_at DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Создать клиента
   */
  async createClient(agentId: number, data: CreateClientDto): Promise<Client> {
    const result = await pool.query(`
      INSERT INTO clients (
        agent_id, name, phone, email, telegram, whatsapp,
        source, stage, priority, comment,
        budget_min, budget_max, desired_rooms, desired_districts,
        desired_deadline, next_contact_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      agentId,
      data.name || null,
      data.phone || null,
      data.email || null,
      data.telegram || null,
      data.whatsapp || null,
      data.source || 'manual',
      data.stage || 'new',
      data.priority || 'medium',
      data.comment || null,
      data.budget_min || null,
      data.budget_max || null,
      data.desired_rooms || null,
      data.desired_districts || null,
      data.desired_deadline || null,
      data.next_contact_date || null
    ]);

    // Логируем создание
    await this.logActivity(result.rows[0].id, 'created', null, null, agentId);

    return result.rows[0];
  }

  /**
   * Получить клиента по ID
   */
  async getClientById(clientId: number, agentId: number): Promise<ClientDetail | null> {
    // Основные данные клиента
    const clientResult = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND agent_id = $2',
      [clientId, agentId]
    );

    if (clientResult.rows.length === 0) {
      return null;
    }

    const client = clientResult.rows[0];

    // Подборки клиента
    const selectionsResult = await pool.query(`
      SELECT
        s.id,
        s.name,
        COUNT(si.id)::int as items_count,
        s.created_at
      FROM selections s
      LEFT JOIN selection_items si ON si.selection_id = s.id
      WHERE s.client_id = $1
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [clientId]);

    // Брони клиента
    const bookingsResult = await pool.query(`
      SELECT
        b.id,
        b.offer_id,
        b.status,
        b.created_at,
        c.name as complex_name
      FROM bookings b
      LEFT JOIN offers o ON o.id = b.offer_id
      LEFT JOIN complexes c ON c.id = o.complex_id
      WHERE b.client_id = $1
      ORDER BY b.created_at DESC
    `, [clientId]);

    // Лог активности
    const activityResult = await pool.query(`
      SELECT id, action, old_value, new_value, created_at
      FROM client_activity_log
      WHERE client_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [clientId]);

    return {
      ...client,
      selections: selectionsResult.rows,
      bookings: bookingsResult.rows,
      activity: activityResult.rows
    };
  }

  /**
   * Обновить клиента
   */
  async updateClient(clientId: number, agentId: number, data: UpdateClientDto): Promise<Client | null> {
    // Проверяем права
    const existing = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND agent_id = $2',
      [clientId, agentId]
    );

    if (existing.rows.length === 0) {
      return null;
    }

    const oldClient = existing.rows[0];

    const result = await pool.query(`
      UPDATE clients SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        telegram = COALESCE($4, telegram),
        whatsapp = COALESCE($5, whatsapp),
        priority = COALESCE($6, priority),
        comment = COALESCE($7, comment),
        budget_min = COALESCE($8, budget_min),
        budget_max = COALESCE($9, budget_max),
        desired_rooms = COALESCE($10, desired_rooms),
        desired_districts = COALESCE($11, desired_districts),
        desired_deadline = COALESCE($12, desired_deadline),
        next_contact_date = COALESCE($13, next_contact_date),
        updated_at = NOW()
      WHERE id = $14 AND agent_id = $15
      RETURNING *
    `, [
      data.name,
      data.phone,
      data.email,
      data.telegram,
      data.whatsapp,
      data.priority,
      data.comment,
      data.budget_min,
      data.budget_max,
      data.desired_rooms,
      data.desired_districts,
      data.desired_deadline,
      data.next_contact_date,
      clientId,
      agentId
    ]);

    // Логируем изменения ключевых полей
    if (data.priority && data.priority !== oldClient.priority) {
      await this.logActivity(clientId, 'priority_changed', oldClient.priority, data.priority, agentId);
    }

    return result.rows[0] || null;
  }

  /**
   * Изменить этап воронки
   */
  async updateStage(clientId: number, agentId: number, stage: ClientStage): Promise<Client | null> {
    const existing = await pool.query(
      'SELECT stage FROM clients WHERE id = $1 AND agent_id = $2',
      [clientId, agentId]
    );

    if (existing.rows.length === 0) {
      return null;
    }

    const oldStage = existing.rows[0].stage;

    const result = await pool.query(`
      UPDATE clients SET
        stage = $1,
        last_contact_date = NOW(),
        updated_at = NOW()
      WHERE id = $2 AND agent_id = $3
      RETURNING *
    `, [stage, clientId, agentId]);

    // Логируем изменение этапа
    await this.logActivity(clientId, 'stage_changed', oldStage, stage, agentId);

    return result.rows[0] || null;
  }

  /**
   * Удалить клиента
   */
  async deleteClient(clientId: number, agentId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND agent_id = $2 RETURNING id',
      [clientId, agentId]
    );
    return result.rows.length > 0;
  }

  /**
   * Получить статистику воронки
   */
  async getFunnelStats(agentId: number): Promise<FunnelStats> {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE stage = 'new')::int as new,
        COUNT(*) FILTER (WHERE stage = 'in_progress')::int as in_progress,
        COUNT(*) FILTER (WHERE stage = 'fixation')::int as fixation,
        COUNT(*) FILTER (WHERE stage = 'booking')::int as booking,
        COUNT(*) FILTER (WHERE stage = 'deal')::int as deal,
        COUNT(*) FILTER (WHERE stage = 'completed')::int as completed,
        COUNT(*) FILTER (WHERE stage = 'failed')::int as failed,
        COUNT(*)::int as total
      FROM clients
      WHERE agent_id = $1
    `, [agentId]);

    return result.rows[0];
  }

  /**
   * Получить лог активности клиента
   */
  async getActivityLog(clientId: number, agentId: number): Promise<any[]> {
    // Проверяем права
    const client = await pool.query(
      'SELECT id FROM clients WHERE id = $1 AND agent_id = $2',
      [clientId, agentId]
    );

    if (client.rows.length === 0) {
      return [];
    }

    const result = await pool.query(`
      SELECT * FROM client_activity_log
      WHERE client_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `, [clientId]);

    return result.rows;
  }

  /**
   * Привязать подборку к клиенту
   */
  async linkSelection(selectionId: number, clientId: number, agentId: number): Promise<boolean> {
    // Проверяем права на клиента и подборку
    const check = await pool.query(`
      SELECT c.id FROM clients c
      JOIN selections s ON s.agent_id = c.agent_id
      WHERE c.id = $1 AND c.agent_id = $2 AND s.id = $3
    `, [clientId, agentId, selectionId]);

    if (check.rows.length === 0) {
      return false;
    }

    await pool.query(
      'UPDATE selections SET client_id = $1 WHERE id = $2',
      [clientId, selectionId]
    );

    await this.logActivity(clientId, 'selection_linked', null, String(selectionId), agentId);

    return true;
  }

  /**
   * Привязать бронь к клиенту
   */
  async linkBooking(bookingId: number, clientId: number, agentId: number): Promise<boolean> {
    // Проверяем права
    const check = await pool.query(`
      SELECT c.id FROM clients c
      JOIN bookings b ON b.agent_id = c.agent_id
      WHERE c.id = $1 AND c.agent_id = $2 AND b.id = $3
    `, [clientId, agentId, bookingId]);

    if (check.rows.length === 0) {
      return false;
    }

    await pool.query(
      'UPDATE bookings SET client_id = $1 WHERE id = $2',
      [clientId, bookingId]
    );

    await this.logActivity(clientId, 'booking_linked', null, String(bookingId), agentId);

    // Автоматически переводим на этап "бронь" если текущий этап ниже
    await pool.query(`
      UPDATE clients SET
        stage = 'booking',
        updated_at = NOW()
      WHERE id = $1 AND stage IN ('new', 'in_progress', 'fixation')
    `, [clientId]);

    return true;
  }

  /**
   * Записать контакт с клиентом
   */
  async recordContact(clientId: number, agentId: number, comment?: string): Promise<Client | null> {
    const result = await pool.query(`
      UPDATE clients SET
        last_contact_date = NOW(),
        updated_at = NOW()
      WHERE id = $1 AND agent_id = $2
      RETURNING *
    `, [clientId, agentId]);

    if (result.rows.length > 0) {
      await this.logActivity(clientId, 'contact_made', null, comment || null, agentId);
    }

    return result.rows[0] || null;
  }

  /**
   * Логирование активности
   */
  private async logActivity(
    clientId: number,
    action: string,
    oldValue: string | null,
    newValue: string | null,
    userId?: number
  ): Promise<void> {
    await pool.query(`
      INSERT INTO client_activity_log (client_id, action, old_value, new_value, created_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [clientId, action, oldValue, newValue, userId || null]);
  }
}
