import { Router, Request, Response } from 'express';
import db from '../config/database';

const router = Router();

// GET /api/v1/complexes — список ЖК
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;

    const search = req.query.search as string;

    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE c.name ILIKE $1';
      params.push(`%${search}%`);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM complexes c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `
      SELECT
        c.id,
        c.name,
        c.address,
        dist.name as district,
        c.min_price,
        c.max_price,
        c.avg_price_per_sqm,
        c.total_apartments,
        dev.name as developer_name,
        (SELECT COUNT(*) FROM offers o WHERE o.complex_id = c.id AND o.is_active = true) as offers_count
      FROM complexes c
      LEFT JOIN developers dev ON c.developer_id = dev.id
      LEFT JOIN districts dist ON c.district_id = dist.id
      ${whereClause}
      ORDER BY c.name ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
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
    });
  } catch (error) {
    console.error('Error fetching complexes:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/v1/complexes/:id — детали ЖК
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
        c.*,
        dev.name as developer_name,
        dist.name as district_name
      FROM complexes c
      LEFT JOIN developers dev ON c.developer_id = dev.id
      LEFT JOIN districts dist ON c.district_id = dist.id
      WHERE c.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Complex not found' });
      return;
    }

    const complex = result.rows[0];

    // Статистика по квартирам
    const statsResult = await db.query(
      `
      SELECT
        rooms,
        COUNT(*) as count,
        MIN(price) as price_min,
        MAX(price) as price_max,
        MIN(area_total) as area_min,
        MAX(area_total) as area_max
      FROM offers
      WHERE complex_id = $1 AND is_active = true
      GROUP BY rooms
      ORDER BY rooms
    `,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...complex,
        stats_by_rooms: statsResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching complex:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/v1/complexes/:id/offers — квартиры в ЖК
router.get('/:id/offers', async (req: Request, res: Response): Promise<void> => {
  try {
    const complexId = parseInt(req.params.id);
    if (isNaN(complexId)) {
      res.status(400).json({ success: false, error: 'Invalid ID' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const countResult = await db.query(
      'SELECT COUNT(*) FROM offers WHERE complex_id = $1 AND is_active = true',
      [complexId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `
      SELECT
        id,
        rooms,
        room_type,
        is_euro_layout,
        floor,
        floors_total,
        area_total,
        area_living,
        area_kitchen,
        price,
        price_per_sqm,
        renovation,
        (SELECT url FROM images WHERE offer_id = offers.id AND tag = 'plan' LIMIT 1) as image_plan
      FROM offers
      WHERE complex_id = $1 AND is_active = true
      ORDER BY rooms ASC, price ASC
      LIMIT $2 OFFSET $3
    `,
      [complexId, limit, offset]
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
    });
  } catch (error) {
    console.error('Error fetching complex offers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
