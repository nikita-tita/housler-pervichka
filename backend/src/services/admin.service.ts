import { pool } from '../config/database';
import type { UserRole, User } from './auth.service';

// === TYPES ===

export interface UserListItem {
  id: number;
  email: string;
  phone: string | null;
  name: string | null;
  role: UserRole;
  agency_id: number | null;
  agency_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface AgencyListItem {
  id: number;
  name: string;
  slug: string;
  inn: string | null;
  phone: string | null;
  email: string | null;
  is_default: boolean;
  registration_status: string;
  agents_count: number;
  created_at: string;
}

export interface PlatformStats {
  users: {
    total: number;
    clients: number;
    agents: number;
    agency_admins: number;
    operators: number;
    admins: number;
    active_today: number;
    active_week: number;
  };
  agencies: {
    total: number;
    pending: number;
    active: number;
    rejected: number;
  };
  offers: {
    total: number;
    active: number;
  };
  bookings: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  selections: {
    total: number;
    public: number;
  };
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  is_active?: boolean;
  agency_id?: number;
}

export interface AgencyFilters {
  search?: string;
  registration_status?: string;
}

// === SERVICE ===

export class AdminService {

  /**
   * Получить список пользователей с фильтрацией
   */
  async getUsers(filters?: UserFilters, limit = 50, offset = 0): Promise<{ users: UserListItem[]; total: number }> {
    let query = `
      SELECT
        u.id, u.email, u.phone, u.name, u.role, u.agency_id,
        u.is_active, u.last_login_at, u.created_at,
        a.name as agency_name
      FROM users u
      LEFT JOIN agencies a ON a.id = u.agency_id
      WHERE 1=1
    `;

    let countQuery = 'SELECT COUNT(*) FROM users u WHERE 1=1';
    const params: unknown[] = [];
    const countParams: unknown[] = [];
    let paramIndex = 1;

    if (filters?.search) {
      const searchCondition = ` AND (u.email ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
      query += searchCondition;
      countQuery += searchCondition.replace(/\$\d+/g, `$${countParams.length + 1}`);
      params.push(`%${filters.search}%`);
      countParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.role) {
      query += ` AND u.role = $${paramIndex}`;
      countQuery += ` AND u.role = $${countParams.length + 1}`;
      params.push(filters.role);
      countParams.push(filters.role);
      paramIndex++;
    }

    if (filters?.is_active !== undefined) {
      query += ` AND u.is_active = $${paramIndex}`;
      countQuery += ` AND u.is_active = $${countParams.length + 1}`;
      params.push(filters.is_active);
      countParams.push(filters.is_active);
      paramIndex++;
    }

    if (filters?.agency_id) {
      query += ` AND u.agency_id = $${paramIndex}`;
      countQuery += ` AND u.agency_id = $${countParams.length + 1}`;
      params.push(filters.agency_id);
      countParams.push(filters.agency_id);
      paramIndex++;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].count, 10)
    };
  }

  /**
   * Получить пользователя по ID
   */
  async getUserById(userId: number): Promise<UserListItem | null> {
    const result = await pool.query(`
      SELECT
        u.id, u.email, u.phone, u.name, u.role, u.agency_id,
        u.is_active, u.last_login_at, u.created_at,
        a.name as agency_name
      FROM users u
      LEFT JOIN agencies a ON a.id = u.agency_id
      WHERE u.id = $1
    `, [userId]);

    return result.rows[0] || null;
  }

  /**
   * Обновить роль пользователя
   */
  async updateUserRole(userId: number, role: UserRole): Promise<User | null> {
    const result = await pool.query(`
      UPDATE users SET role = $1
      WHERE id = $2
      RETURNING id, email, phone, name, role, agency_id, is_active, last_login_at, created_at
    `, [role, userId]);

    return result.rows[0] || null;
  }

  /**
   * Активировать/деактивировать пользователя
   */
  async toggleUserActive(userId: number, isActive: boolean): Promise<User | null> {
    const result = await pool.query(`
      UPDATE users SET is_active = $1
      WHERE id = $2
      RETURNING id, email, phone, name, role, agency_id, is_active, last_login_at, created_at
    `, [isActive, userId]);

    return result.rows[0] || null;
  }

  /**
   * Привязать пользователя к агентству
   */
  async setUserAgency(userId: number, agencyId: number | null): Promise<User | null> {
    const result = await pool.query(`
      UPDATE users SET agency_id = $1
      WHERE id = $2
      RETURNING id, email, phone, name, role, agency_id, is_active, last_login_at, created_at
    `, [agencyId, userId]);

    return result.rows[0] || null;
  }

  /**
   * Получить список агентств
   */
  async getAgencies(filters?: AgencyFilters, limit = 50, offset = 0): Promise<{ agencies: AgencyListItem[]; total: number }> {
    let query = `
      SELECT
        a.id, a.name, a.slug, a.inn, a.phone, a.email,
        a.is_default, a.registration_status, a.created_at,
        COALESCE(uc.cnt, 0)::int as agents_count
      FROM agencies a
      LEFT JOIN (
        SELECT agency_id, COUNT(*) as cnt
        FROM users
        WHERE role IN ('agent', 'agency_admin')
        GROUP BY agency_id
      ) uc ON uc.agency_id = a.id
      WHERE 1=1
    `;

    let countQuery = 'SELECT COUNT(*) FROM agencies a WHERE 1=1';
    const params: unknown[] = [];
    const countParams: unknown[] = [];
    let paramIndex = 1;

    if (filters?.search) {
      const searchCondition = ` AND (a.name ILIKE $${paramIndex} OR a.inn ILIKE $${paramIndex} OR a.email ILIKE $${paramIndex})`;
      query += searchCondition;
      countQuery += searchCondition.replace(/\$\d+/g, `$${countParams.length + 1}`);
      params.push(`%${filters.search}%`);
      countParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.registration_status) {
      query += ` AND a.registration_status = $${paramIndex}`;
      countQuery += ` AND a.registration_status = $${countParams.length + 1}`;
      params.push(filters.registration_status);
      countParams.push(filters.registration_status);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [agenciesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    return {
      agencies: agenciesResult.rows,
      total: parseInt(countResult.rows[0].count, 10)
    };
  }

  /**
   * Получить агентство по ID
   */
  async getAgencyById(agencyId: number): Promise<AgencyListItem | null> {
    const result = await pool.query(`
      SELECT
        a.id, a.name, a.slug, a.inn, a.phone, a.email,
        a.is_default, a.registration_status, a.created_at,
        COALESCE(uc.cnt, 0)::int as agents_count
      FROM agencies a
      LEFT JOIN (
        SELECT agency_id, COUNT(*) as cnt
        FROM users
        WHERE role IN ('agent', 'agency_admin')
        GROUP BY agency_id
      ) uc ON uc.agency_id = a.id
      WHERE a.id = $1
    `, [agencyId]);

    return result.rows[0] || null;
  }

  /**
   * Изменить статус регистрации агентства
   */
  async updateAgencyStatus(agencyId: number, status: string): Promise<AgencyListItem | null> {
    await pool.query(`
      UPDATE agencies SET registration_status = $1
      WHERE id = $2
    `, [status, agencyId]);

    return this.getAgencyById(agencyId);
  }

  /**
   * Получить статистику платформы
   */
  async getPlatformStats(): Promise<PlatformStats> {
    const [usersStats, agenciesStats, offersStats, bookingsStats, selectionsStats] = await Promise.all([
      // Users stats
      pool.query(`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE role = 'client')::int as clients,
          COUNT(*) FILTER (WHERE role = 'agent')::int as agents,
          COUNT(*) FILTER (WHERE role = 'agency_admin')::int as agency_admins,
          COUNT(*) FILTER (WHERE role = 'operator')::int as operators,
          COUNT(*) FILTER (WHERE role = 'admin')::int as admins,
          COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '1 day')::int as active_today,
          COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '7 days')::int as active_week
        FROM users
      `),

      // Agencies stats
      pool.query(`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE registration_status = 'pending')::int as pending,
          COUNT(*) FILTER (WHERE registration_status = 'active')::int as active,
          COUNT(*) FILTER (WHERE registration_status = 'rejected')::int as rejected
        FROM agencies
      `),

      // Offers stats
      pool.query(`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE is_active = TRUE)::int as active
        FROM offers
      `),

      // Bookings stats
      pool.query(`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
          COUNT(*) FILTER (WHERE status = 'approved')::int as approved,
          COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected
        FROM bookings
      `),

      // Selections stats
      pool.query(`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE is_public = TRUE)::int as public
        FROM selections
      `)
    ]);

    return {
      users: usersStats.rows[0],
      agencies: agenciesStats.rows[0],
      offers: offersStats.rows[0],
      bookings: bookingsStats.rows[0],
      selections: selectionsStats.rows[0]
    };
  }

  /**
   * Удалить пользователя (мягкое удаление - деактивация)
   */
  async deleteUser(userId: number): Promise<boolean> {
    const result = await pool.query(`
      UPDATE users SET is_active = FALSE
      WHERE id = $1
      RETURNING id
    `, [userId]);

    return result.rows.length > 0;
  }

  /**
   * Создать пользователя (админом)
   */
  async createUser(data: {
    email: string;
    name?: string;
    phone?: string;
    role: UserRole;
    agency_id?: number;
  }): Promise<User> {
    const result = await pool.query(`
      INSERT INTO users (email, name, phone, role, agency_id, is_active)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      RETURNING id, email, phone, name, role, agency_id, is_active, last_login_at, created_at
    `, [
      data.email.toLowerCase().trim(),
      data.name || null,
      data.phone || null,
      data.role,
      data.agency_id || null
    ]);

    return result.rows[0];
  }
}
