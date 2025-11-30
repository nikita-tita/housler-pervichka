import { Router, Request, Response } from 'express';
import db from '../config/database';

const router = Router();

// GET /api/v1/filters/districts — список районов
router.get('/districts', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        d.id,
        d.name,
        (SELECT COUNT(*) FROM offers o WHERE o.district_id = d.id AND o.is_active = true) as offers_count
      FROM districts d
      ORDER BY d.name ASC
    `);

    res.json({
      success: true,
      data: result.rows.filter((d) => parseInt(d.offers_count) > 0),
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/v1/filters/metro — список станций метро
router.get('/metro', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        ms.id,
        ms.name,
        ms.line,
        (SELECT COUNT(*) FROM offers o WHERE o.metro_station_id = ms.id AND o.is_active = true) as offers_count
      FROM metro_stations ms
      ORDER BY ms.line ASC NULLS LAST, ms.name ASC
    `);

    res.json({
      success: true,
      data: result.rows.filter((m) => parseInt(m.offers_count) > 0),
    });
  } catch (error) {
    console.error('Error fetching metro:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/v1/filters/renovations — типы отделки
router.get('/renovations', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        renovation as value,
        COUNT(*) as count
      FROM offers
      WHERE is_active = true AND renovation IS NOT NULL
      GROUP BY renovation
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching renovations:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/v1/filters/ranges — диапазоны цен и площадей
router.get('/ranges', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT
        MIN(price) as price_min,
        MAX(price) as price_max,
        MIN(area_total) as area_min,
        MAX(area_total) as area_max,
        MIN(floor) as floor_min,
        MAX(floor) as floor_max
      FROM offers
      WHERE is_active = true
    `);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching ranges:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/v1/filters/all — все фильтры одним запросом
router.get('/all', async (_req: Request, res: Response) => {
  try {
    const [districts, metro, renovations, ranges] = await Promise.all([
      db.query(`
        SELECT d.id, d.name,
          (SELECT COUNT(*) FROM offers o WHERE o.district_id = d.id AND o.is_active = true) as offers_count
        FROM districts d ORDER BY d.name
      `),
      db.query(`
        SELECT ms.id, ms.name, ms.line,
          (SELECT COUNT(*) FROM offers o WHERE o.metro_station_id = ms.id AND o.is_active = true) as offers_count
        FROM metro_stations ms ORDER BY ms.line NULLS LAST, ms.name
      `),
      db.query(`
        SELECT renovation as value, COUNT(*) as count
        FROM offers WHERE is_active = true AND renovation IS NOT NULL
        GROUP BY renovation ORDER BY count DESC
      `),
      db.query(`
        SELECT MIN(price) as price_min, MAX(price) as price_max,
          MIN(area_total) as area_min, MAX(area_total) as area_max,
          MIN(floor) as floor_min, MAX(floor) as floor_max
        FROM offers WHERE is_active = true
      `),
    ]);

    res.json({
      success: true,
      data: {
        districts: districts.rows.filter((d) => parseInt(d.offers_count) > 0),
        metro: metro.rows.filter((m) => parseInt(m.offers_count) > 0),
        renovations: renovations.rows,
        ranges: ranges.rows[0],
      },
    });
  } catch (error) {
    console.error('Error fetching all filters:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
