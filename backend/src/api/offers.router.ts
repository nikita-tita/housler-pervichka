import { Router, Request, Response } from 'express';
import db from '../config/database';

const router = Router();

// GET /api/v1/offers — список с пагинацией и фильтрацией
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    // Собираем фильтры
    const conditions: string[] = ['o.is_active = true'];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Комнаты
    if (req.query.rooms) {
      const rooms = (req.query.rooms as string)
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n));
      if (rooms.length > 0) {
        conditions.push(`o.rooms = ANY($${paramIndex})`);
        params.push(rooms);
        paramIndex++;
      }
    }

    // Евро-планировка
    if (req.query.euro === 'true') {
      conditions.push('o.is_euro_layout = true');
    }

    // Цена
    if (req.query.price_min) {
      conditions.push(`o.price >= $${paramIndex}`);
      params.push(parseInt(req.query.price_min as string));
      paramIndex++;
    }
    if (req.query.price_max) {
      conditions.push(`o.price <= $${paramIndex}`);
      params.push(parseInt(req.query.price_max as string));
      paramIndex++;
    }

    // Площадь
    if (req.query.area_min) {
      conditions.push(`o.area_total >= $${paramIndex}`);
      params.push(parseFloat(req.query.area_min as string));
      paramIndex++;
    }
    if (req.query.area_max) {
      conditions.push(`o.area_total <= $${paramIndex}`);
      params.push(parseFloat(req.query.area_max as string));
      paramIndex++;
    }

    // Этаж
    if (req.query.floor_min) {
      conditions.push(`o.floor >= $${paramIndex}`);
      params.push(parseInt(req.query.floor_min as string));
      paramIndex++;
    }
    if (req.query.floor_max) {
      conditions.push(`o.floor <= $${paramIndex}`);
      params.push(parseInt(req.query.floor_max as string));
      paramIndex++;
    }
    if (req.query.not_first === 'true') {
      conditions.push('o.floor > 1');
    }
    if (req.query.not_last === 'true') {
      conditions.push('o.floor < o.floors_total');
    }

    // Район (по id района)
    if (req.query.district_id) {
      conditions.push(`o.district_id = $${paramIndex}`);
      params.push(parseInt(req.query.district_id as string));
      paramIndex++;
    }

    // ЖК
    if (req.query.complex_id) {
      conditions.push(`o.complex_id = $${paramIndex}`);
      params.push(parseInt(req.query.complex_id as string));
      paramIndex++;
    }

    // Отделка
    if (req.query.renovation) {
      const renovations = (req.query.renovation as string).split(',');
      conditions.push(`o.renovation = ANY($${paramIndex})`);
      params.push(renovations);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Сортировка
    const sortOptions: Record<string, string> = {
      price_asc: 'o.price ASC',
      price_desc: 'o.price DESC',
      area_asc: 'o.area_total ASC',
      area_desc: 'o.area_total DESC',
      date_desc: 'o.created_at DESC',
      price_per_sqm_asc: 'o.price_per_sqm ASC',
    };
    const sort = sortOptions[req.query.sort as string] || 'o.created_at DESC';

    // Получаем общее количество
    const countResult = await db.query(
      `SELECT COUNT(*) FROM offers o WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Получаем записи
    params.push(limit, offset);
    const result = await db.query(
      `
      SELECT
        o.id,
        o.rooms,
        o.room_type,
        o.is_euro_layout,
        o.floor,
        o.floors_total,
        o.area_total,
        o.area_living,
        o.area_kitchen,
        o.price,
        o.price_per_sqm,
        o.renovation,
        o.address,
        d.name as district,
        c.name as complex_name,
        (SELECT url FROM images WHERE offer_id = o.id AND tag = 'plan' LIMIT 1) as image_plan,
        (SELECT url FROM images WHERE offer_id = o.id AND tag = 'housemain' LIMIT 1) as image_main
      FROM offers o
      LEFT JOIN complexes c ON o.complex_id = c.id
      LEFT JOIN districts d ON o.district_id = d.id
      WHERE ${whereClause}
      ORDER BY ${sort}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters_applied: Object.keys(req.query).filter(
        (k) => !['page', 'limit', 'sort'].includes(k)
      ),
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/v1/offers/:id — детали объявления
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid ID' });
      return;
    }

    const result = await db.query(
      `
      SELECT
        o.*,
        c.name as complex_name,
        c.address as complex_address,
        d.name as district_name,
        dev.name as developer_name
      FROM offers o
      LEFT JOIN complexes c ON o.complex_id = c.id
      LEFT JOIN districts d ON o.district_id = d.id
      LEFT JOIN developers dev ON c.developer_id = dev.id
      WHERE o.id = $1 AND o.is_active = true
    `,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Offer not found' });
      return;
    }

    const offer = result.rows[0];

    // Получаем все изображения
    const imagesResult = await db.query(
      `
      SELECT url, tag, display_order
      FROM images
      WHERE offer_id = $1
      ORDER BY display_order ASC
    `,
      [id]
    );

    // Получаем метро
    const metroResult = await db.query(
      `
      SELECT
        ms.name,
        ms.line,
        o.metro_time_on_foot
      FROM metro_stations ms
      JOIN offers o ON o.metro_station_id = ms.id
      WHERE o.id = $1
    `,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...offer,
        images: imagesResult.rows,
        metro: metroResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
