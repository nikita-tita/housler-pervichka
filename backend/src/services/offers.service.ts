import { pool } from '../config/database';

export interface OfferFilters {
  rooms?: number[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  floorMin?: number;
  floorMax?: number;
  notFirstFloor?: boolean;
  notLastFloor?: boolean;
  kitchenAreaMin?: number;
  kitchenAreaMax?: number;
  ceilingHeightMin?: number;
  districts?: string[];
  metro?: string[];
  metroTimeMax?: number;
  complexId?: number;
  renovation?: string[];
  buildingState?: string[];
  search?: string;
  isStudio?: boolean;
  hasFinishing?: boolean;
  completionYears?: number[];
  developers?: string[];
  // Bounds для поиска по карте (lat_min, lat_max, lng_min, lng_max)
  bounds?: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  };
}

export interface PaginationParams {
  page: number;
  perPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OfferListItem {
  id: number;
  external_id: string;
  rooms: number;
  is_studio: boolean;
  floor: number;
  floors_total: number;
  area_total: number;
  area_living: number | null;
  area_kitchen: number | null;
  price: number;
  price_per_sqm: number;
  address: string;
  district: string | null;
  metro_name: string | null;
  metro_time_on_foot: number | null;
  building_name: string | null;
  building_state: string | null;
  renovation: string | null;
  main_image: string | null;
}

export interface OfferDetail extends OfferListItem {
  offer_type: string;
  property_type: string;
  category: string;
  ceiling_height: number | null;
  balcony: string | null;
  bathroom_unit: string | null;
  building_type: string | null;
  built_year: number | null;
  ready_quarter: number | null;
  latitude: number | null;
  longitude: number | null;
  agent_phone: string | null;
  agent_email: string | null;
  agent_organization: string | null;
  description: string | null;
  images: { url: string; tag: string | null }[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export class OffersService {
  /**
   * Поиск объявлений с фильтрацией и пагинацией
   */
  async searchOffers(
    filters: OfferFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<OfferListItem>> {
    const { conditions, params } = this.buildWhereClause(filters);
    const offset = (pagination.page - 1) * pagination.perPage;

    // Определяем сортировку
    const sortColumn = this.getSortColumn(pagination.sortBy);
    const sortOrder = pagination.sortOrder === 'desc' ? 'DESC' : 'ASC';

    // Запрос данных
    const dataQuery = `
      SELECT
        o.id,
        o.external_id,
        o.rooms,
        o.is_studio,
        o.floor,
        o.floors_total,
        o.area_total::float as area_total,
        o.area_living::float as area_living,
        o.area_kitchen::float as area_kitchen,
        o.price::float as price,
        o.price_per_sqm::float as price_per_sqm,
        o.address,
        d.name as district_name,
        o.metro_name as metro_station,
        o.metro_time_on_foot as metro_distance,
        o.building_name as complex_name,
        o.building_state,
        o.renovation,
        CASE WHEN o.renovation IS NOT NULL AND o.renovation != '' THEN true ELSE false END as has_finishing,
        (
          SELECT url FROM images
          WHERE offer_id = o.id AND (tag = 'housemain' OR tag IS NULL)
          ORDER BY display_order LIMIT 1
        ) as image_url
      FROM offers o
      LEFT JOIN districts d ON o.district_id = d.id
      WHERE o.is_active = true ${conditions}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    // Запрос количества
    const countQuery = `
      SELECT COUNT(*) as total
      FROM offers o
      LEFT JOIN districts d ON o.district_id = d.id
      WHERE o.is_active = true ${conditions}
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
        limit: pagination.perPage,
        total,
        total_pages: Math.ceil(total / pagination.perPage)
      }
    };
  }

  /**
   * Получить детали одного объявления
   */
  async getOfferById(id: number): Promise<OfferDetail | null> {
    const query = `
      SELECT
        o.id,
        o.external_id,
        o.rooms,
        o.is_studio,
        o.floor,
        o.floors_total,
        o.area_total::float as area_total,
        o.area_living::float as area_living,
        o.area_kitchen::float as area_kitchen,
        o.price::float as price,
        o.price_per_sqm::float as price_per_sqm,
        o.ceiling_height::float as ceiling_height,
        o.balcony,
        o.bathroom_unit as bathroom,
        o.renovation,
        CASE WHEN o.renovation IS NOT NULL AND o.renovation != '' THEN true ELSE false END as has_finishing,
        o.building_name as complex_name,
        o.address as complex_address,
        d.name as district_name,
        o.metro_name as metro_station,
        o.metro_time_on_foot as metro_distance,
        o.description,
        o.latitude::float as latitude,
        o.longitude::float as longitude,
        o.building_state,
        o.built_year,
        o.ready_quarter,
        CASE
          WHEN o.building_state = 'hand-over' THEN 'Сдан'
          WHEN o.ready_quarter IS NOT NULL AND o.built_year IS NOT NULL
            THEN o.ready_quarter || ' кв. ' || o.built_year
          WHEN o.built_year IS NOT NULL THEN o.built_year::text
          ELSE NULL
        END as completion_date,
        o.agent_phone,
        o.agent_email,
        o.agent_organization as developer_name,
        o.created_at,
        o.updated_at
      FROM offers o
      LEFT JOIN districts d ON o.district_id = d.id
      WHERE o.id = $1 AND o.is_active = true
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const offer = result.rows[0];

    // Получить изображения с тегами
    const imagesResult = await pool.query(
      'SELECT url, tag FROM images WHERE offer_id = $1 ORDER BY tag NULLS LAST, display_order',
      [id]
    );

    return {
      ...offer,
      images: imagesResult.rows.map(row => ({ url: row.url, tag: row.tag }))
    };
  }

  /**
   * Получить историю цен для объявления
   */
  async getPriceHistory(offerId: number): Promise<{ price: number; price_per_sqm: number | null; recorded_at: string }[]> {
    const result = await pool.query(`
      SELECT
        price::float as price,
        price_per_sqm::float as price_per_sqm,
        recorded_at
      FROM price_history
      WHERE offer_id = $1
      ORDER BY recorded_at ASC
    `, [offerId]);

    return result.rows;
  }

  /**
   * Получить маркеры для карты (с фильтрами)
   */
  async getMapMarkers(filters: OfferFilters): Promise<{ id: number; lat: number; lng: number; price: number; rooms: number; is_studio: boolean }[]> {
    const { conditions, params } = this.buildWhereClause(filters);

    const query = `
      SELECT
        o.id,
        o.latitude::float as lat,
        o.longitude::float as lng,
        o.price::float as price,
        o.rooms,
        o.is_studio
      FROM offers o
      LEFT JOIN districts d ON o.district_id = d.id
      WHERE o.is_active = true
        AND o.latitude IS NOT NULL
        AND o.longitude IS NOT NULL
        ${conditions}
      LIMIT 5000
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Получить доступные фильтры (для UI)
   */
  async getAvailableFilters(): Promise<{
    districts: { name: string; count: number }[];
    metro_stations: { name: string; count: number }[];
    complexes: { name: string; count: number }[];
    rooms: { value: number; count: number }[];
    price_range: { min: number; max: number };
    area_range: { min: number; max: number };
    completion_years: { year: number; count: number }[];
    developers: { name: string; count: number }[];
  }> {
    const [districts, metro, complexes, priceRange, areaRange, roomsCount, completionYears, developers] = await Promise.all([
      pool.query(`
        SELECT d.name, COUNT(o.id)::int as count
        FROM districts d
        JOIN offers o ON o.district_id = d.id
        WHERE o.is_active = true
        GROUP BY d.name
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT metro_name as name, COUNT(*)::int as count
        FROM offers
        WHERE is_active = true AND metro_name IS NOT NULL
        GROUP BY metro_name
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT building_name as name, COUNT(*)::int as count
        FROM offers
        WHERE is_active = true AND building_name IS NOT NULL AND building_name != ''
        GROUP BY building_name
        ORDER BY count DESC
        LIMIT 100
      `),
      pool.query(`
        SELECT
          MIN(price)::int as min,
          MAX(price)::int as max
        FROM offers
        WHERE is_active = true
      `),
      pool.query(`
        SELECT
          MIN(area_total)::float as min,
          MAX(area_total)::float as max
        FROM offers
        WHERE is_active = true
      `),
      pool.query(`
        SELECT rooms as value, COUNT(*)::int as count
        FROM offers
        WHERE is_active = true
        GROUP BY rooms
        ORDER BY rooms
      `),
      // Год сдачи (completion_years)
      pool.query(`
        SELECT built_year as year, COUNT(*)::int as count
        FROM offers
        WHERE is_active = true AND built_year IS NOT NULL
        GROUP BY built_year
        ORDER BY built_year ASC
      `),
      // Застройщики (developers) - фильтруем URL-подобные и технические значения
      pool.query(`
        SELECT agent_organization as name, COUNT(*)::int as count
        FROM offers
        WHERE is_active = true
          AND agent_organization IS NOT NULL
          AND agent_organization != ''
          AND agent_organization NOT LIKE 'http%'
          AND agent_organization NOT LIKE '%.xml%'
          AND agent_organization NOT LIKE '%.allrealty%'
          AND agent_organization NOT LIKE '%www.%'
          AND agent_organization NOT LIKE '%.ru/%'
          AND agent_organization NOT LIKE '%.pro/%'
          AND agent_organization NOT LIKE '%.com/%'
          AND LENGTH(agent_organization) >= 3
          AND LENGTH(agent_organization) <= 100
        GROUP BY agent_organization
        ORDER BY count DESC
        LIMIT 50
      `)
    ]);

    return {
      districts: districts.rows,
      metro_stations: metro.rows,
      complexes: complexes.rows,
      rooms: roomsCount.rows,
      price_range: priceRange.rows[0] || { min: 0, max: 0 },
      area_range: areaRange.rows[0] || { min: 0, max: 0 },
      completion_years: completionYears.rows,
      developers: developers.rows
    };
  }

  /**
   * Построение WHERE условий
   */
  private buildWhereClause(filters: OfferFilters): { conditions: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Комнатность и студия (объединяем через OR если оба указаны)
    const hasRooms = filters.rooms && filters.rooms.length > 0;
    const hasStudio = filters.isStudio === true;

    if (hasRooms && hasStudio) {
      // Пользователь выбрал и комнаты, и студию — ищем ИЛИ комнаты ИЛИ студию
      conditions.push(`(o.rooms = ANY($${paramIndex}) OR o.is_studio = true)`);
      params.push(filters.rooms);
      paramIndex++;
    } else if (hasRooms) {
      // Только комнаты
      conditions.push(`o.rooms = ANY($${paramIndex})`);
      params.push(filters.rooms);
      paramIndex++;
    } else if (hasStudio) {
      // Только студии
      conditions.push(`o.is_studio = true`);
    }

    // Цена
    if (filters.priceMin !== undefined) {
      conditions.push(`o.price >= $${paramIndex}`);
      params.push(filters.priceMin);
      paramIndex++;
    }
    if (filters.priceMax !== undefined) {
      conditions.push(`o.price <= $${paramIndex}`);
      params.push(filters.priceMax);
      paramIndex++;
    }

    // Площадь
    if (filters.areaMin !== undefined) {
      conditions.push(`o.area_total >= $${paramIndex}`);
      params.push(filters.areaMin);
      paramIndex++;
    }
    if (filters.areaMax !== undefined) {
      conditions.push(`o.area_total <= $${paramIndex}`);
      params.push(filters.areaMax);
      paramIndex++;
    }

    // Этаж
    if (filters.floorMin !== undefined) {
      conditions.push(`o.floor >= $${paramIndex}`);
      params.push(filters.floorMin);
      paramIndex++;
    }
    if (filters.floorMax !== undefined) {
      conditions.push(`o.floor <= $${paramIndex}`);
      params.push(filters.floorMax);
      paramIndex++;
    }
    if (filters.notFirstFloor) {
      conditions.push(`o.floor > 1`);
    }
    if (filters.notLastFloor) {
      conditions.push(`o.floor < o.floors_total`);
    }

    // Районы
    if (filters.districts && filters.districts.length > 0) {
      conditions.push(`d.name = ANY($${paramIndex})`);
      params.push(filters.districts);
      paramIndex++;
    }

    // Метро
    if (filters.metro && filters.metro.length > 0) {
      conditions.push(`o.metro_name = ANY($${paramIndex})`);
      params.push(filters.metro);
      paramIndex++;
    }
    if (filters.metroTimeMax !== undefined) {
      conditions.push(`o.metro_time_on_foot <= $${paramIndex}`);
      params.push(filters.metroTimeMax);
      paramIndex++;
    }

    // ЖК
    if (filters.complexId !== undefined) {
      conditions.push(`o.complex_id = $${paramIndex}`);
      params.push(filters.complexId);
      paramIndex++;
    }

    // Ремонт
    if (filters.renovation && filters.renovation.length > 0) {
      conditions.push(`o.renovation = ANY($${paramIndex})`);
      params.push(filters.renovation);
      paramIndex++;
    }

    // Состояние здания
    if (filters.buildingState && filters.buildingState.length > 0) {
      conditions.push(`o.building_state = ANY($${paramIndex})`);
      params.push(filters.buildingState);
      paramIndex++;
    }

    // Поиск по тексту
    if (filters.search) {
      conditions.push(`(o.address ILIKE $${paramIndex} OR o.building_name ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Студия — обрабатывается вместе с комнатами выше

    // С отделкой
    if (filters.hasFinishing !== undefined && filters.hasFinishing) {
      conditions.push(`o.renovation IS NOT NULL AND o.renovation != ''`);
    }

    // Год сдачи
    if (filters.completionYears && filters.completionYears.length > 0) {
      conditions.push(`o.built_year = ANY($${paramIndex})`);
      params.push(filters.completionYears);
      paramIndex++;
    }

    // Застройщики
    if (filters.developers && filters.developers.length > 0) {
      conditions.push(`o.agent_organization = ANY($${paramIndex})`);
      params.push(filters.developers);
      paramIndex++;
    }

    // Площадь кухни
    if (filters.kitchenAreaMin !== undefined) {
      conditions.push(`o.area_kitchen >= $${paramIndex}`);
      params.push(filters.kitchenAreaMin);
      paramIndex++;
    }
    if (filters.kitchenAreaMax !== undefined) {
      conditions.push(`o.area_kitchen <= $${paramIndex}`);
      params.push(filters.kitchenAreaMax);
      paramIndex++;
    }

    // Высота потолков
    if (filters.ceilingHeightMin !== undefined) {
      conditions.push(`o.ceiling_height >= $${paramIndex}`);
      params.push(filters.ceilingHeightMin);
      paramIndex++;
    }

    // Bounds (поиск по области карты)
    if (filters.bounds) {
      conditions.push(`o.latitude >= $${paramIndex}`);
      params.push(filters.bounds.latMin);
      paramIndex++;
      conditions.push(`o.latitude <= $${paramIndex}`);
      params.push(filters.bounds.latMax);
      paramIndex++;
      conditions.push(`o.longitude >= $${paramIndex}`);
      params.push(filters.bounds.lngMin);
      paramIndex++;
      conditions.push(`o.longitude <= $${paramIndex}`);
      params.push(filters.bounds.lngMax);
      paramIndex++;
    }

    return {
      conditions: conditions.length > 0 ? ' AND ' + conditions.join(' AND ') : '',
      params
    };
  }

  /**
   * Получить колонку для сортировки
   */
  private getSortColumn(sortBy?: string): string {
    const allowedColumns: Record<string, string> = {
      price: 'o.price',
      price_per_sqm: 'o.price_per_sqm',
      area: 'o.area_total',
      floor: 'o.floor',
      date: 'o.updated_at',
      updated: 'o.updated_at',
      rooms: 'o.rooms'
    };

    return allowedColumns[sortBy || 'updated'] || 'o.updated_at';
  }
}
