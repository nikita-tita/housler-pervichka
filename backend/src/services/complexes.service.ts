import { pool } from '../config/database';

export interface ComplexListItem {
  id: number;
  name: string;
  district: string | null;
  address: string | null;
  offers_count: number;
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  building_state: string | null;
}

export interface ComplexDetail extends ComplexListItem {
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  rooms_stats: { rooms: number; count: number; min_price: number }[];
}

export interface ComplexFilters {
  district?: string;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  buildingState?: string;
}

export interface PaginationParams {
  page: number;
  perPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export class ComplexesService {
  /**
   * Список ЖК с агрегированными данными по объявлениям
   */
  async searchComplexes(
    filters: ComplexFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<ComplexListItem>> {
    const { conditions, params, havingConditions } = this.buildWhereClause(filters);
    const offset = (pagination.page - 1) * pagination.perPage;

    const sortColumn = this.getSortColumn(pagination.sortBy);
    const sortOrder = pagination.sortOrder === 'desc' ? 'DESC' : 'ASC';

    // Запрос с агрегацией по объявлениям
    const dataQuery = `
      SELECT
        c.id,
        c.name,
        d.name as district,
        c.address,
        COUNT(o.id)::int as offers_count,
        MIN(o.price)::numeric as min_price,
        MAX(o.price)::numeric as max_price,
        MIN(o.area_total)::numeric as min_area,
        MAX(o.area_total)::numeric as max_area,
        (SELECT o2.building_state FROM offers o2 WHERE o2.complex_id = c.id AND o2.is_active = true LIMIT 1) as building_state
      FROM complexes c
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN offers o ON o.complex_id = c.id AND o.is_active = true
      ${conditions}
      GROUP BY c.id, c.name, d.name, c.address
      ${havingConditions}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    // Запрос количества (нужен отдельный подзапрос из-за GROUP BY)
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT c.id
        FROM complexes c
        LEFT JOIN districts d ON c.district_id = d.id
        LEFT JOIN offers o ON o.complex_id = c.id AND o.is_active = true
        ${conditions}
        GROUP BY c.id, d.name
        ${havingConditions}
      ) as subquery
    `;

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...params, pagination.perPage, offset]),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);

    return {
      data: dataResult.rows,
      pagination: {
        page: pagination.page,
        perPage: pagination.perPage,
        total,
        totalPages: Math.ceil(total / pagination.perPage)
      }
    };
  }

  /**
   * Детали одного ЖК с расширенной статистикой
   */
  async getComplexById(id: number): Promise<ComplexDetail | null> {
    const query = `
      SELECT
        c.id,
        c.name,
        d.name as district,
        c.address,
        c.description,
        ST_Y(c.coordinates::geometry) as latitude,
        ST_X(c.coordinates::geometry) as longitude,
        c.created_at,
        c.updated_at,
        COUNT(o.id)::int as offers_count,
        MIN(o.price)::numeric as min_price,
        MAX(o.price)::numeric as max_price,
        MIN(o.area_total)::numeric as min_area,
        MAX(o.area_total)::numeric as max_area,
        (SELECT o2.building_state FROM offers o2 WHERE o2.complex_id = c.id AND o2.is_active = true LIMIT 1) as building_state
      FROM complexes c
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN offers o ON o.complex_id = c.id AND o.is_active = true
      WHERE c.id = $1
      GROUP BY c.id, c.name, d.name, c.address, c.description, c.coordinates, c.created_at, c.updated_at
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const complex = result.rows[0];

    // Получить статистику по комнатам
    const roomsStatsResult = await pool.query(`
      SELECT
        rooms,
        COUNT(*)::int as count,
        MIN(price)::numeric as min_price
      FROM offers
      WHERE complex_id = $1 AND is_active = true
      GROUP BY rooms
      ORDER BY rooms
    `, [id]);

    return {
      ...complex,
      rooms_stats: roomsStatsResult.rows
    };
  }

  /**
   * Поиск ЖК по названию (для автокомплита)
   */
  async searchByName(query: string, limit: number = 10): Promise<{ id: number; name: string; district: string | null; offers_count: number }[]> {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        d.name as district,
        COUNT(o.id)::int as offers_count
      FROM complexes c
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN offers o ON o.complex_id = c.id AND o.is_active = true
      WHERE c.name ILIKE $1
      GROUP BY c.id, c.name, d.name
      HAVING COUNT(o.id) > 0
      ORDER BY COUNT(o.id) DESC, c.name
      LIMIT $2
    `, [`%${query}%`, limit]);

    return result.rows;
  }

  /**
   * Построение WHERE условий
   */
  private buildWhereClause(filters: ComplexFilters): {
    conditions: string;
    params: any[];
    havingConditions: string;
  } {
    const conditions: string[] = [];
    const havingConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Поиск по названию
    if (filters.search) {
      conditions.push(`c.name ILIKE $${paramIndex}`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Район
    if (filters.district) {
      conditions.push(`d.name = $${paramIndex}`);
      params.push(filters.district);
      paramIndex++;
    }

    // Фильтр по минимальной цене в ЖК
    if (filters.priceMin !== undefined) {
      havingConditions.push(`MIN(o.price) >= ${filters.priceMin}`);
    }
    if (filters.priceMax !== undefined) {
      havingConditions.push(`MAX(o.price) <= ${filters.priceMax}`);
    }

    // Только ЖК с объявлениями
    havingConditions.push('COUNT(o.id) > 0');

    return {
      conditions: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
      params,
      havingConditions: havingConditions.length > 0 ? 'HAVING ' + havingConditions.join(' AND ') : ''
    };
  }

  /**
   * Колонка для сортировки
   */
  private getSortColumn(sortBy?: string): string {
    const allowedColumns: Record<string, string> = {
      name: 'c.name',
      offers: 'offers_count',
      price: 'min_price',
      updated: 'c.updated_at'
    };

    return allowedColumns[sortBy || 'offers'] || 'offers_count';
  }
}
