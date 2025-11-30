import { Router, Request, Response } from 'express';
import db from '../config/database';

const router = Router();

// GET /api/v1/offers — список с пагинацией
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    // Получаем общее количество
    const countResult = await db.query('SELECT COUNT(*) FROM offers WHERE is_active = true');
    const total = parseInt(countResult.rows[0].count);

    // Получаем записи
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
      WHERE o.is_active = true
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `,
      [limit, offset]
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
    console.error('Error fetching offers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
