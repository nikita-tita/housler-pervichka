import { pool } from '../config/database';

export interface Agency {
  id: number;
  name: string;
  slug: string;
  is_default: boolean;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientAgencyLink {
  id: number;
  user_id: number;
  agency_id: number;
  source: string;
  referral_code: string | null;
  created_at: string;
}

export class AgenciesService {
  /**
   * Получить агентство по slug
   */
  async getBySlug(slug: string): Promise<Agency | null> {
    const result = await pool.query(
      'SELECT * FROM agencies WHERE slug = $1 AND is_active = true',
      [slug]
    );
    return result.rows[0] || null;
  }

  /**
   * Получить агентство по ID
   */
  async getById(id: number): Promise<Agency | null> {
    const result = await pool.query(
      'SELECT * FROM agencies WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Получить дефолтное агентство (Housler)
   */
  async getDefault(): Promise<Agency | null> {
    const result = await pool.query(
      'SELECT * FROM agencies WHERE is_default = true AND is_active = true LIMIT 1'
    );
    return result.rows[0] || null;
  }

  /**
   * Получить ID дефолтного агентства
   */
  async getDefaultId(): Promise<number | null> {
    const agency = await this.getDefault();
    return agency?.id || null;
  }

  /**
   * Получить все агентства
   */
  async getAll(): Promise<Agency[]> {
    const result = await pool.query(
      'SELECT * FROM agencies WHERE is_active = true ORDER BY is_default DESC, name ASC'
    );
    return result.rows;
  }

  /**
   * Создать агентство
   */
  async create(data: {
    name: string;
    slug: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
    description?: string;
  }): Promise<Agency> {
    const result = await pool.query(`
      INSERT INTO agencies (name, slug, logo_url, phone, email, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      data.name,
      data.slug,
      data.logoUrl || null,
      data.phone || null,
      data.email || null,
      data.description || null
    ]);
    return result.rows[0];
  }

  /**
   * Обновить агентство
   */
  async update(id: number, data: Partial<{
    name: string;
    logoUrl: string;
    phone: string;
    email: string;
    description: string;
    isActive: boolean;
  }>): Promise<Agency | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.logoUrl !== undefined) {
      updates.push(`logo_url = $${paramIndex++}`);
      values.push(data.logoUrl);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    if (updates.length === 0) return this.getById(id);

    values.push(id);
    const result = await pool.query(`
      UPDATE agencies SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    return result.rows[0] || null;
  }

  // ============================================
  // Привязка клиентов к агентствам
  // ============================================

  /**
   * Привязать клиента к агентству
   */
  async linkClientToAgency(
    userId: number,
    agencyId: number,
    source: string = 'direct',
    referralCode?: string
  ): Promise<ClientAgencyLink | null> {
    try {
      const result = await pool.query(`
        INSERT INTO client_agency_links (user_id, agency_id, source, referral_code)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, agency_id) DO UPDATE SET
          source = EXCLUDED.source,
          referral_code = COALESCE(EXCLUDED.referral_code, client_agency_links.referral_code)
        RETURNING *
      `, [userId, agencyId, source, referralCode || null]);
      return result.rows[0];
    } catch (error) {
      console.error('Error linking client to agency:', error);
      return null;
    }
  }

  /**
   * Получить агентства клиента
   */
  async getClientAgencies(userId: number): Promise<Agency[]> {
    const result = await pool.query(`
      SELECT a.* FROM agencies a
      JOIN client_agency_links cal ON a.id = cal.agency_id
      WHERE cal.user_id = $1 AND a.is_active = true
      ORDER BY cal.created_at DESC
    `, [userId]);
    return result.rows;
  }

  /**
   * Получить последнее агентство клиента (для роутинга заявок)
   */
  async getClientLastAgency(userId: number): Promise<Agency | null> {
    const result = await pool.query(`
      SELECT a.* FROM agencies a
      JOIN client_agency_links cal ON a.id = cal.agency_id
      WHERE cal.user_id = $1 AND a.is_active = true
      ORDER BY cal.created_at DESC
      LIMIT 1
    `, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Проверить, привязан ли клиент к агентству
   */
  async isClientLinkedToAgency(userId: number, agencyId: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM client_agency_links WHERE user_id = $1 AND agency_id = $2',
      [userId, agencyId]
    );
    return result.rows.length > 0;
  }

  /**
   * Получить агентство для роутинга заявки
   * - Если клиент привязан к агентствам — последнее
   * - Иначе — дефолтное (Housler)
   */
  async getAgencyForBooking(userId: number | null): Promise<number> {
    if (userId) {
      const clientAgency = await this.getClientLastAgency(userId);
      if (clientAgency) {
        return clientAgency.id;
      }
    }

    const defaultAgency = await this.getDefault();
    if (!defaultAgency) {
      throw new Error('No default agency configured');
    }
    return defaultAgency.id;
  }
}
