# ЭТАП 1: ЧАСТЬ 2 — Фичи F5-F7

## НАПОМИНАНИЕ ПЕРЕД НАЧАЛОМ

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ЭТО ПРОДОЛЖЕНИЕ PHASE_1_PLAN.md                                        │
│                                                                         │
│  ПЕРЕД НАЧАЛОМ УБЕДИСЬ:                                                 │
│  □ F1-F4 полностью завершены                                            │
│  □ docker-compose up работает                                           │
│  □ База заполнена данными из XML (12000+ записей)                       │
│  □ Ты прочитал CLAUDE.md                                                │
│                                                                         │
│  ПОРЯДОК ЧТЕНИЯ:                                                        │
│  1. PHASE_1_PLAN.md (F1-F4) — должно быть выполнено                     │
│  2. PHASE_1_PLAN_PART2.md (F5-F7) — этот документ                       │
│  3. PHASE_1_PLAN_PART3.md (F8-F10) — после завершения F7                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## F5: REST API (БАЗОВЫЙ)

### Цель
Создать базовые эндпоинты для получения данных: списки, фильтры, детали.

### Контекст для чтения ПЕРЕД началом
```
ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
├── /CLAUDE.md                    — Правила работы
├── /ТЗ_v2_расширенное.md         — Секция 6.3 (API архитектура)
├── /database_schema.sql          — Понимание связей таблиц
├── /backend/src/config/database.ts   — Как подключаться к БД
└── /backend/src/types/models.ts      — Типы данных
```

### Саб-таски

#### F5.1 Структура API слоя
```
ЗАДАЧА: Создать базовую структуру для роутов и контроллеров

ДО НАЧАЛА:
□ F4 полностью завершена
□ Прочитай backend/src/index.ts — как сейчас настроен Express
□ Прочитай секцию 6.3 в ТЗ

ДЕЙСТВИЯ:
1. Создай backend/src/api/index.ts:

import { Router } from 'express';
import offersRouter from './offers.router';
import complexesRouter from './complexes.router';
import filtersRouter from './filters.router';

const router = Router();

router.use('/offers', offersRouter);
router.use('/complexes', complexesRouter);
router.use('/filters', filtersRouter);

export default router;

2. Обнови backend/src/index.ts — добавь после app.get('/health'):

import apiRouter from './api';
app.use('/api', apiRouter);

ПРОВЕРКА:
□ npm run dev запускается без ошибок
□ (пока роутеры не существуют — это нормально, исправим далее)

КОММИТ:
git add -A && git commit -m "feat(api): add router structure"

ПОСЛЕ:
□ Отметь F5.1 как completed
```

#### F5.2 Offers Router — список объявлений
```
ЗАДАЧА: Создать эндпоинт GET /api/offers с пагинацией

ДО НАЧАЛА:
□ F5.1 завершена
□ Прочитай database_schema.sql — таблица offers
□ Прочитай backend/src/types/models.ts — интерфейс Offer

ДЕЙСТВИЯ:
1. Создай backend/src/api/offers.router.ts:

import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// GET /api/offers — список с пагинацией
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    // Получаем общее количество
    const countResult = await pool.query('SELECT COUNT(*) FROM offers WHERE is_active = true');
    const total = parseInt(countResult.rows[0].count);

    // Получаем записи
    const result = await pool.query(`
      SELECT
        o.id,
        o.external_id,
        o.rooms,
        o.room_type,
        o.is_euro_layout,
        o.floor,
        o.floors_total,
        o.area_total,
        o.area_living,
        o.area_kitchen,
        o.price,
        o.price_per_meter,
        o.renovation,
        o.building_state,
        o.address,
        o.district,
        c.name as complex_name,
        (SELECT url FROM offer_images WHERE offer_id = o.id AND tag = 'plan' LIMIT 1) as image_plan,
        (SELECT url FROM offer_images WHERE offer_id = o.id AND tag = 'housemain' LIMIT 1) as image_main
      FROM offers o
      LEFT JOIN complexes c ON o.complex_id = c.id
      WHERE o.is_active = true
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

ПРОВЕРКА:
□ npm run dev — без ошибок
□ curl http://localhost:3001/api/offers — возвращает JSON с данными
□ curl "http://localhost:3001/api/offers?page=2&limit=10" — пагинация работает

КОММИТ:
git add -A && git commit -m "feat(api): add GET /api/offers with pagination"

ПОСЛЕ:
□ Отметь F5.2 как completed
```

#### F5.3 Offers Router — фильтрация
```
ЗАДАЧА: Добавить фильтры к списку объявлений

ДО НАЧАЛА:
□ F5.2 завершена
□ Прочитай секцию 4.1-4.3 в ТЗ (фильтры)

ДЕЙСТВИЯ:
1. Обнови backend/src/api/offers.router.ts — замени весь router.get('/'):

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    // Собираем фильтры
    const conditions: string[] = ['o.is_active = true'];
    const params: any[] = [];
    let paramIndex = 1;

    // Комнаты
    if (req.query.rooms) {
      const rooms = (req.query.rooms as string).split(',').map(Number).filter(n => !isNaN(n));
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

    // Район
    if (req.query.district) {
      conditions.push(`o.district = $${paramIndex}`);
      params.push(req.query.district);
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

    // Состояние здания
    if (req.query.building_state) {
      conditions.push(`o.building_state = $${paramIndex}`);
      params.push(req.query.building_state);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Сортировка
    const sortOptions: Record<string, string> = {
      'price_asc': 'o.price ASC',
      'price_desc': 'o.price DESC',
      'area_asc': 'o.area_total ASC',
      'area_desc': 'o.area_total DESC',
      'date_desc': 'o.created_at DESC',
      'price_per_meter_asc': 'o.price_per_meter ASC'
    };
    const sort = sortOptions[req.query.sort as string] || 'o.created_at DESC';

    // Получаем общее количество
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM offers o WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Получаем записи
    params.push(limit, offset);
    const result = await pool.query(`
      SELECT
        o.id,
        o.external_id,
        o.rooms,
        o.room_type,
        o.is_euro_layout,
        o.floor,
        o.floors_total,
        o.area_total,
        o.area_living,
        o.area_kitchen,
        o.price,
        o.price_per_meter,
        o.renovation,
        o.building_state,
        o.address,
        o.district,
        c.name as complex_name,
        (SELECT url FROM offer_images WHERE offer_id = o.id AND tag = 'plan' LIMIT 1) as image_plan,
        (SELECT url FROM offer_images WHERE offer_id = o.id AND tag = 'housemain' LIMIT 1) as image_main
      FROM offers o
      LEFT JOIN complexes c ON o.complex_id = c.id
      WHERE ${whereClause}
      ORDER BY ${sort}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters_applied: Object.keys(req.query).filter(k => !['page', 'limit', 'sort'].includes(k))
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

ПРОВЕРКА:
□ curl "http://localhost:3001/api/offers?rooms=1,2" — фильтр по комнатам
□ curl "http://localhost:3001/api/offers?price_min=5000000&price_max=10000000" — диапазон цены
□ curl "http://localhost:3001/api/offers?euro=true" — только евро-планировки
□ curl "http://localhost:3001/api/offers?sort=price_asc" — сортировка

КОММИТ:
git add -A && git commit -m "feat(api): add filtering to GET /api/offers"

ПОСЛЕ:
□ Отметь F5.3 как completed
```

#### F5.4 Offers Router — детали объявления
```
ЗАДАЧА: Создать эндпоинт GET /api/offers/:id

ДО НАЧАЛА:
□ F5.3 завершена

ДЕЙСТВИЯ:
1. Добавь в backend/src/api/offers.router.ts ПОСЛЕ router.get('/'):

// GET /api/offers/:id — детали объявления
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid ID' });
    }

    const result = await pool.query(`
      SELECT
        o.*,
        c.name as complex_name,
        c.address as complex_address,
        c.website as complex_website,
        d.name as developer_name,
        d.logo_url as developer_logo
      FROM offers o
      LEFT JOIN complexes c ON o.complex_id = c.id
      LEFT JOIN developers d ON c.developer_id = d.id
      WHERE o.id = $1 AND o.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    const offer = result.rows[0];

    // Получаем все изображения
    const imagesResult = await pool.query(`
      SELECT url, tag, sort_order
      FROM offer_images
      WHERE offer_id = $1
      ORDER BY sort_order ASC
    `, [id]);

    // Получаем метро
    const metroResult = await pool.query(`
      SELECT
        ms.name,
        ms.line_name,
        ms.line_color,
        om.distance_meters,
        om.time_minutes,
        om.transport_type
      FROM offer_metro om
      JOIN metro_stations ms ON om.metro_station_id = ms.id
      WHERE om.offer_id = $1
      ORDER BY om.time_minutes ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...offer,
        images: imagesResult.rows,
        metro: metroResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

ПРОВЕРКА:
□ curl http://localhost:3001/api/offers/1 — возвращает детали первого объекта
□ curl http://localhost:3001/api/offers/999999 — возвращает 404
□ Проверь что images и metro массивы присутствуют в ответе

КОММИТ:
git add -A && git commit -m "feat(api): add GET /api/offers/:id"

ПОСЛЕ:
□ Отметь F5.4 как completed
```

#### F5.5 Complexes Router
```
ЗАДАЧА: Создать эндпоинты для ЖК

ДО НАЧАЛА:
□ F5.4 завершена
□ Прочитай database_schema.sql — таблица complexes

ДЕЙСТВИЯ:
1. Создай backend/src/api/complexes.router.ts:

import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// GET /api/complexes — список ЖК
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;

    const search = req.query.search as string;

    let whereClause = '';
    const params: any[] = [];

    if (search) {
      whereClause = 'WHERE c.name ILIKE $1';
      params.push(`%${search}%`);
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM complexes c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.address,
        c.district,
        c.building_type,
        c.building_state,
        c.floors_min,
        c.floors_max,
        c.built_year,
        c.ready_quarter,
        d.name as developer_name,
        (SELECT COUNT(*) FROM offers o WHERE o.complex_id = c.id AND o.is_active = true) as offers_count,
        (SELECT MIN(price) FROM offers o WHERE o.complex_id = c.id AND o.is_active = true) as price_min,
        (SELECT MAX(price) FROM offers o WHERE o.complex_id = c.id AND o.is_active = true) as price_max
      FROM complexes c
      LEFT JOIN developers d ON c.developer_id = d.id
      ${whereClause}
      ORDER BY c.name ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching complexes:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/complexes/:id — детали ЖК
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid ID' });
    }

    const result = await pool.query(`
      SELECT
        c.*,
        d.name as developer_name,
        d.logo_url as developer_logo,
        d.website as developer_website
      FROM complexes c
      LEFT JOIN developers d ON c.developer_id = d.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Complex not found' });
    }

    const complex = result.rows[0];

    // Статистика по квартирам
    const statsResult = await pool.query(`
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
    `, [id]);

    res.json({
      success: true,
      data: {
        ...complex,
        stats_by_rooms: statsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching complex:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/complexes/:id/offers — квартиры в ЖК
router.get('/:id/offers', async (req: Request, res: Response) => {
  try {
    const complexId = parseInt(req.params.id);
    if (isNaN(complexId)) {
      return res.status(400).json({ success: false, error: 'Invalid ID' });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM offers WHERE complex_id = $1 AND is_active = true',
      [complexId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
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
        price_per_meter,
        renovation,
        (SELECT url FROM offer_images WHERE offer_id = offers.id AND tag = 'plan' LIMIT 1) as image_plan
      FROM offers
      WHERE complex_id = $1 AND is_active = true
      ORDER BY rooms ASC, price ASC
      LIMIT $2 OFFSET $3
    `, [complexId, limit, offset]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching complex offers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

ПРОВЕРКА:
□ curl http://localhost:3001/api/complexes — список ЖК
□ curl "http://localhost:3001/api/complexes?search=Новатория" — поиск
□ curl http://localhost:3001/api/complexes/1 — детали ЖК
□ curl http://localhost:3001/api/complexes/1/offers — квартиры в ЖК

КОММИТ:
git add -A && git commit -m "feat(api): add complexes router"

ПОСЛЕ:
□ Отметь F5.5 как completed
```

#### F5.6 Filters Router — справочники для фильтров
```
ЗАДАЧА: Создать эндпоинты для получения справочных данных

ДО НАЧАЛА:
□ F5.5 завершена

ДЕЙСТВИЯ:
1. Создай backend/src/api/filters.router.ts:

import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// GET /api/filters/districts — список районов
router.get('/districts', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        d.id,
        d.name,
        d.name_en,
        (SELECT COUNT(*) FROM offers o WHERE o.district = d.name AND o.is_active = true) as offers_count
      FROM districts d
      ORDER BY d.name ASC
    `);

    res.json({
      success: true,
      data: result.rows.filter(d => d.offers_count > 0)
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/filters/metro — список станций метро
router.get('/metro', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        ms.id,
        ms.name,
        ms.line_name,
        ms.line_color,
        (SELECT COUNT(DISTINCT o.id)
         FROM offer_metro om
         JOIN offers o ON om.offer_id = o.id
         WHERE om.metro_station_id = ms.id AND o.is_active = true) as offers_count
      FROM metro_stations ms
      ORDER BY ms.line_name ASC, ms.name ASC
    `);

    res.json({
      success: true,
      data: result.rows.filter(m => m.offers_count > 0)
    });
  } catch (error) {
    console.error('Error fetching metro:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/filters/renovations — типы отделки
router.get('/renovations', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
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
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching renovations:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/filters/ranges — диапазоны цен и площадей
router.get('/ranges', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
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
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching ranges:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/filters/all — все фильтры одним запросом
router.get('/all', async (_req: Request, res: Response) => {
  try {
    const [districts, metro, renovations, ranges] = await Promise.all([
      pool.query(`
        SELECT d.id, d.name,
          (SELECT COUNT(*) FROM offers o WHERE o.district = d.name AND o.is_active = true) as offers_count
        FROM districts d ORDER BY d.name
      `),
      pool.query(`
        SELECT ms.id, ms.name, ms.line_name, ms.line_color,
          (SELECT COUNT(DISTINCT o.id) FROM offer_metro om
           JOIN offers o ON om.offer_id = o.id
           WHERE om.metro_station_id = ms.id AND o.is_active = true) as offers_count
        FROM metro_stations ms ORDER BY ms.line_name, ms.name
      `),
      pool.query(`
        SELECT renovation as value, COUNT(*) as count
        FROM offers WHERE is_active = true AND renovation IS NOT NULL
        GROUP BY renovation ORDER BY count DESC
      `),
      pool.query(`
        SELECT MIN(price) as price_min, MAX(price) as price_max,
          MIN(area_total) as area_min, MAX(area_total) as area_max,
          MIN(floor) as floor_min, MAX(floor) as floor_max
        FROM offers WHERE is_active = true
      `)
    ]);

    res.json({
      success: true,
      data: {
        districts: districts.rows.filter(d => d.offers_count > 0),
        metro: metro.rows.filter(m => m.offers_count > 0),
        renovations: renovations.rows,
        ranges: ranges.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching all filters:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

ПРОВЕРКА:
□ curl http://localhost:3001/api/filters/districts — список районов
□ curl http://localhost:3001/api/filters/metro — станции метро
□ curl http://localhost:3001/api/filters/renovations — типы отделки
□ curl http://localhost:3001/api/filters/ranges — диапазоны
□ curl http://localhost:3001/api/filters/all — всё вместе

КОММИТ:
git add -A && git commit -m "feat(api): add filters router with reference data"

ПОСЛЕ:
□ Отметь F5.6 как completed
```

#### F5.7 Error Handling Middleware
```
ЗАДАЧА: Добавить централизованную обработку ошибок

ДО НАЧАЛА:
□ F5.6 завершена

ДЕЙСТВИЯ:
1. Создай backend/src/middleware/error.middleware.ts:

import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
};

2. Обнови backend/src/index.ts — добавь в конец перед app.listen():

import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// После всех роутов
app.use(notFoundHandler);
app.use(errorHandler);

ПРОВЕРКА:
□ curl http://localhost:3001/api/nonexistent — возвращает 404 JSON
□ npm run dev — без ошибок

КОММИТ:
git add -A && git commit -m "feat(api): add error handling middleware"

ПОСЛЕ:
□ Отметь F5.7 как completed
```

#### F5.8 Request Validation с Zod
```
ЗАДАЧА: Добавить валидацию входящих запросов

ДО НАЧАЛА:
□ F5.7 завершена
□ Убедись что zod установлен: grep zod backend/package.json

ДЕЙСТВИЯ:
1. Создай backend/src/validators/offer.validator.ts:

import { z } from 'zod';

export const offersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().regex(/^\d+$/).optional().transform(v => v ? Math.min(100, parseInt(v)) : 20),
  rooms: z.string().regex(/^[\d,]+$/).optional(),
  euro: z.enum(['true', 'false']).optional(),
  price_min: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : undefined),
  price_max: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : undefined),
  area_min: z.string().regex(/^[\d.]+$/).optional().transform(v => v ? parseFloat(v) : undefined),
  area_max: z.string().regex(/^[\d.]+$/).optional().transform(v => v ? parseFloat(v) : undefined),
  floor_min: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : undefined),
  floor_max: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : undefined),
  not_first: z.enum(['true', 'false']).optional(),
  not_last: z.enum(['true', 'false']).optional(),
  district: z.string().optional(),
  complex_id: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : undefined),
  renovation: z.string().optional(),
  building_state: z.enum(['unfinished', 'hand-over']).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'area_asc', 'area_desc', 'date_desc', 'price_per_meter_asc']).optional()
});

export type OffersQuery = z.infer<typeof offersQuerySchema>;

2. Создай backend/src/middleware/validate.middleware.ts:

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

ПРОВЕРКА:
□ npm run dev — без ошибок
□ Валидаторы можно использовать в роутерах (опционально пока)

КОММИТ:
git add -A && git commit -m "feat(api): add zod validation schemas"

ПОСЛЕ:
□ Отметь F5.8 как completed
□ git push origin main
□ Переходи к F6
```

### Критерии завершения F5
- [ ] GET /api/offers — работает с пагинацией
- [ ] GET /api/offers?rooms=1,2&price_min=5000000 — фильтрация работает
- [ ] GET /api/offers/:id — возвращает детали с изображениями
- [ ] GET /api/complexes — список ЖК с количеством квартир
- [ ] GET /api/complexes/:id — детали ЖК со статистикой
- [ ] GET /api/filters/all — все справочники

---

## F6: FRONTEND (КАРКАС)

### Цель
Создать базовый Next.js фронтенд с главной страницей и списком объявлений.

### Контекст для чтения ПЕРЕД началом
```
ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
├── /CLAUDE.md                    — Правила работы
├── /ТЗ_v2_расширенное.md         — Секция 4 (интерфейс), Секция 6.2.3 (структура фронта)
├── /frontend/package.json        — Что уже установлено
└── /backend/src/api/             — Какие API доступны
```

### Саб-таски

#### F6.1 Настройка API клиента
```
ЗАДАЧА: Создать клиент для работы с API

ДО НАЧАЛА:
□ F5 полностью завершена
□ Backend запущен на localhost:3001
□ Прочитай frontend/package.json

ДЕЙСТВИЯ:
1. Создай frontend/src/services/api.ts:

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export const api = new ApiClient(API_BASE);

// Типизированные методы
export const offersApi = {
  getList: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<OfferListItem[]>(`/api/offers${query}`);
  },

  getById: (id: number) => {
    return api.get<OfferDetails>(`/api/offers/${id}`);
  }
};

export const complexesApi = {
  getList: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<ComplexListItem[]>(`/api/complexes${query}`);
  },

  getById: (id: number) => {
    return api.get<ComplexDetails>(`/api/complexes/${id}`);
  }
};

export const filtersApi = {
  getAll: () => api.get<FilterData>('/api/filters/all')
};

// Типы (временные, потом вынесем)
export interface OfferListItem {
  id: number;
  rooms: number;
  room_type: string | null;
  is_euro_layout: boolean;
  floor: number;
  floors_total: number;
  area_total: number;
  area_living: number | null;
  area_kitchen: number | null;
  price: number;
  price_per_meter: number;
  renovation: string | null;
  building_state: string | null;
  address: string;
  district: string | null;
  complex_name: string | null;
  image_plan: string | null;
  image_main: string | null;
}

export interface OfferDetails extends OfferListItem {
  description: string | null;
  images: { url: string; tag: string; sort_order: number }[];
  metro: { name: string; line_name: string; line_color: string; time_minutes: number }[];
}

export interface ComplexListItem {
  id: number;
  name: string;
  address: string;
  district: string | null;
  building_type: string | null;
  building_state: string | null;
  developer_name: string | null;
  offers_count: number;
  price_min: number | null;
  price_max: number | null;
}

export interface ComplexDetails extends ComplexListItem {
  stats_by_rooms: {
    rooms: number;
    count: number;
    price_min: number;
    price_max: number;
    area_min: number;
    area_max: number;
  }[];
}

export interface FilterData {
  districts: { id: number; name: string; offers_count: number }[];
  metro: { id: number; name: string; line_name: string; line_color: string; offers_count: number }[];
  renovations: { value: string; count: number }[];
  ranges: {
    price_min: number;
    price_max: number;
    area_min: number;
    area_max: number;
    floor_min: number;
    floor_max: number;
  };
}

ПРОВЕРКА:
□ npm run dev во frontend работает
□ Нет ошибок TypeScript

КОММИТ:
git add -A && git commit -m "feat(frontend): add API client with types"

ПОСЛЕ:
□ Отметь F6.1 как completed
```

#### F6.2 Главная страница — layout
```
ЗАДАЧА: Создать базовый layout и главную страницу

ДО НАЧАЛА:
□ F6.1 завершена
□ Прочитай секцию 4.2 в ТЗ (главная страница)

ДЕЙСТВИЯ:
1. Создай/обнови frontend/src/app/layout.tsx:

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Housler - Агрегатор новостроек СПб',
  description: 'Поиск квартир в новостройках Санкт-Петербурга',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <a href="/" className="text-xl font-bold text-blue-600">
              Housler
            </a>
            <nav className="flex gap-4">
              <a href="/offers" className="text-gray-600 hover:text-gray-900">
                Квартиры
              </a>
              <a href="/complexes" className="text-gray-600 hover:text-gray-900">
                ЖК
              </a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-gray-100 border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
            Housler © 2024 — Агрегатор новостроек
          </div>
        </footer>
      </body>
    </html>
  );
}

2. Создай/обнови frontend/src/app/globals.css:

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

3. Создай/обнови frontend/src/app/page.tsx:

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">
          Найдите квартиру в новостройке
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          12 000+ квартир от застройщиков Санкт-Петербурга
        </p>
        <Link
          href="/offers"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
        >
          Смотреть все квартиры
        </Link>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Только первичка</h3>
          <p className="text-gray-600">
            Все квартиры напрямую от застройщиков, без посредников
          </p>
        </div>
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Актуальные данные</h3>
          <p className="text-gray-600">
            Цены и наличие обновляются ежедневно из официальных фидов
          </p>
        </div>
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Удобные фильтры</h3>
          <p className="text-gray-600">
            Евро-планировки, метро, районы, отделка — всё под рукой
          </p>
        </div>
      </section>
    </div>
  );
}

ПРОВЕРКА:
□ npm run dev — открывается без ошибок
□ http://localhost:3000 — показывает главную страницу
□ Header и footer отображаются

КОММИТ:
git add -A && git commit -m "feat(frontend): add layout and home page"

ПОСЛЕ:
□ Отметь F6.2 как completed
```

#### F6.3 Страница списка квартир
```
ЗАДАЧА: Создать страницу /offers со списком объявлений

ДО НАЧАЛА:
□ F6.2 завершена
□ Backend запущен

ДЕЙСТВИЯ:
1. Создай frontend/src/app/offers/page.tsx:

import { offersApi, OfferListItem } from '@/services/api';
import OfferCard from '@/components/OfferCard';

interface SearchParams {
  page?: string;
  rooms?: string;
  price_min?: string;
  price_max?: string;
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params: Record<string, string> = {};

  if (searchParams.page) params.page = searchParams.page;
  if (searchParams.rooms) params.rooms = searchParams.rooms;
  if (searchParams.price_min) params.price_min = searchParams.price_min;
  if (searchParams.price_max) params.price_max = searchParams.price_max;

  const response = await offersApi.getList(params);
  const offers = response.data;
  const pagination = response.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Квартиры в новостройках
        </h1>
        {pagination && (
          <span className="text-gray-500">
            Найдено: {pagination.total.toLocaleString('ru-RU')} квартир
          </span>
        )}
      </div>

      {/* Список карточек */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>

      {/* Пагинация */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(10, pagination.pages) }, (_, i) => i + 1).map((page) => (
            <a
              key={page}
              href={`/offers?page=${page}`}
              className={`px-4 py-2 rounded ${
                page === pagination.page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {page}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

2. Создай frontend/src/components/OfferCard.tsx:

import { OfferListItem } from '@/services/api';
import Link from 'next/link';

interface Props {
  offer: OfferListItem;
}

export default function OfferCard({ offer }: Props) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const formatArea = (area: number) => {
    return area.toFixed(1) + ' м²';
  };

  const getRoomLabel = (rooms: number, isEuro: boolean) => {
    if (rooms === 0) return 'Студия';
    if (isEuro) return `Евро-${rooms}`;
    return `${rooms}-комн.`;
  };

  return (
    <Link
      href={`/offers/${offer.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden"
    >
      {/* Изображение */}
      <div className="aspect-[4/3] bg-gray-100 relative">
        {offer.image_plan ? (
          <img
            src={offer.image_plan}
            alt="План квартиры"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Нет фото
          </div>
        )}
        {offer.is_euro_layout && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Евро
          </span>
        )}
      </div>

      {/* Контент */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-lg font-semibold">
              {getRoomLabel(offer.rooms, offer.is_euro_layout)}
            </span>
            <span className="text-gray-500 ml-2">
              {formatArea(offer.area_total)}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {offer.floor}/{offer.floors_total} эт.
          </span>
        </div>

        <div className="text-xl font-bold text-blue-600 mb-2">
          {formatPrice(offer.price)}
        </div>

        <div className="text-sm text-gray-500">
          {formatPrice(offer.price_per_meter)}/м²
        </div>

        {offer.complex_name && (
          <div className="text-sm text-gray-600 mt-2 truncate">
            {offer.complex_name}
          </div>
        )}

        {offer.district && (
          <div className="text-xs text-gray-400 mt-1">
            {offer.district}
          </div>
        )}
      </div>
    </Link>
  );
}

ПРОВЕРКА:
□ http://localhost:3000/offers — показывает список квартир
□ Карточки отображаются с ценами и площадями
□ Пагинация работает
□ Клик на карточку переходит на /offers/:id (пока 404)

КОММИТ:
git add -A && git commit -m "feat(frontend): add offers list page"

ПОСЛЕ:
□ Отметь F6.3 как completed
```

#### F6.4 Утилиты форматирования
```
ЗАДАЧА: Вынести форматирование в отдельный модуль

ДО НАЧАЛА:
□ F6.3 завершена

ДЕЙСТВИЯ:
1. Создай frontend/src/utils/format.ts:

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

export function formatPriceShort(price: number): string {
  if (price >= 1_000_000) {
    return (price / 1_000_000).toFixed(1).replace('.0', '') + ' млн ₽';
  }
  return formatPrice(price);
}

export function formatArea(area: number): string {
  return area.toFixed(1).replace('.0', '') + ' м²';
}

export function formatRooms(rooms: number, isEuro: boolean = false): string {
  if (rooms === 0) return 'Студия';
  if (isEuro) return `Евро-${rooms}`;
  return `${rooms}-комн.`;
}

export function formatFloor(floor: number, floorsTotal: number): string {
  return `${floor}/${floorsTotal} эт.`;
}

export function formatMetroTime(minutes: number): string {
  return `${minutes} мин`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatQuarter(quarter: number, year: number): string {
  return `${quarter} кв. ${year}`;
}

2. Обнови frontend/src/components/OfferCard.tsx — используй утилиты:

import { OfferListItem } from '@/services/api';
import Link from 'next/link';
import { formatPrice, formatArea, formatRooms, formatFloor } from '@/utils/format';

// ... остальной код аналогичен, но с использованием импортированных функций

ПРОВЕРКА:
□ npm run dev — без ошибок
□ Страница /offers работает как раньше

КОММИТ:
git add -A && git commit -m "feat(frontend): add formatting utilities"

ПОСЛЕ:
□ Отметь F6.4 как completed
```

#### F6.5 Loading и Error состояния
```
ЗАДАЧА: Добавить индикаторы загрузки и обработку ошибок

ДО НАЧАЛА:
□ F6.4 завершена

ДЕЙСТВИЯ:
1. Создай frontend/src/app/offers/loading.tsx:

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-[4/3] bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

2. Создай frontend/src/app/offers/error.tsx:

'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4">Произошла ошибка</h2>
      <p className="text-gray-600 mb-8">
        Не удалось загрузить список квартир. Попробуйте обновить страницу.
      </p>
      <button
        onClick={() => reset()}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Попробовать снова
      </button>
    </div>
  );
}

3. Создай frontend/src/app/not-found.tsx:

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-4">Страница не найдена</h2>
      <p className="text-gray-600 mb-8">
        Возможно, она была удалена или вы перешли по неверной ссылке.
      </p>
      <Link
        href="/"
        className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        На главную
      </Link>
    </div>
  );
}

ПРОВЕРКА:
□ Остановите backend — страница /offers показывает ошибку с кнопкой "Попробовать снова"
□ Запустите backend снова — всё работает
□ http://localhost:3000/random-page — показывает 404

КОММИТ:
git add -A && git commit -m "feat(frontend): add loading and error states"

ПОСЛЕ:
□ Отметь F6.5 как completed
□ git push origin main
□ Переходи к F7
```

### Критерии завершения F6
- [ ] http://localhost:3000 — главная страница работает
- [ ] http://localhost:3000/offers — список квартир с пагинацией
- [ ] Карточки показывают: комнаты, площадь, цену, этаж, ЖК
- [ ] Loading skeleton отображается при загрузке
- [ ] Error страница при ошибке API
- [ ] 404 страница для несуществующих роутов

---

## F7: ПОИСК И ФИЛЬТРАЦИЯ

### Цель
Добавить функциональные фильтры на странице списка квартир.

### Контекст для чтения ПЕРЕД началом
```
ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
├── /CLAUDE.md                    — Правила работы
├── /ТЗ_v2_расширенное.md         — Секция 4.1 (фильтры), 4.2 (интерфейс)
├── /frontend/src/app/offers/page.tsx   — Текущая реализация
├── /frontend/src/services/api.ts       — API клиент
└── /backend/src/api/filters.router.ts  — Какие фильтры доступны
```

### Саб-таски

#### F7.1 Компонент фильтров — структура
```
ЗАДАЧА: Создать компонент фильтров с базовой структурой

ДО НАЧАЛА:
□ F6 полностью завершена
□ Прочитай секцию 4.1 в ТЗ — какие фильтры нужны

ДЕЙСТВИЯ:
1. Создай frontend/src/components/OffersFilter.tsx:

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { FilterData, filtersApi } from '@/services/api';

export default function OffersFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Текущие значения фильтров
  const currentRooms = searchParams.get('rooms')?.split(',') || [];
  const currentEuro = searchParams.get('euro') === 'true';
  const currentPriceMin = searchParams.get('price_min') || '';
  const currentPriceMax = searchParams.get('price_max') || '';
  const currentAreaMin = searchParams.get('area_min') || '';
  const currentAreaMax = searchParams.get('area_max') || '';
  const currentDistrict = searchParams.get('district') || '';
  const currentRenovation = searchParams.get('renovation')?.split(',') || [];

  // Загрузка данных для фильтров
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await filtersApi.getAll();
        setFilterData(response.data);
      } catch (error) {
        console.error('Failed to load filters:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFilters();
  }, []);

  // Применение фильтров
  const applyFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Сбрасываем на первую страницу при изменении фильтров
    params.delete('page');

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`/offers?${params.toString()}`);
  }, [router, searchParams]);

  // Сброс всех фильтров
  const resetFilters = useCallback(() => {
    router.push('/offers');
  }, [router]);

  // Проверка есть ли активные фильтры
  const hasActiveFilters = currentRooms.length > 0 || currentEuro ||
    currentPriceMin || currentPriceMax || currentAreaMin || currentAreaMax ||
    currentDistrict || currentRenovation.length > 0;

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Комнаты */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Комнаты
          </label>
          <div className="flex flex-wrap gap-1">
            {['0', '1', '2', '3', '4'].map((room) => (
              <button
                key={room}
                onClick={() => {
                  const newRooms = currentRooms.includes(room)
                    ? currentRooms.filter(r => r !== room)
                    : [...currentRooms, room];
                  applyFilters({ rooms: newRooms.length > 0 ? newRooms.join(',') : null });
                }}
                className={`px-3 py-1 text-sm rounded border ${
                  currentRooms.includes(room)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {room === '0' ? 'Ст' : room}
              </button>
            ))}
          </div>
        </div>

        {/* Евро-планировка */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Планировка
          </label>
          <button
            onClick={() => applyFilters({ euro: currentEuro ? null : 'true' })}
            className={`px-3 py-1 text-sm rounded border ${
              currentEuro
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
            }`}
          >
            Евро
          </button>
        </div>

        {/* Цена */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Цена, ₽
          </label>
          <div className="flex gap-1">
            <input
              type="number"
              placeholder="от"
              value={currentPriceMin}
              onChange={(e) => applyFilters({ price_min: e.target.value || null })}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="number"
              placeholder="до"
              value={currentPriceMax}
              onChange={(e) => applyFilters({ price_max: e.target.value || null })}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Площадь */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Площадь, м²
          </label>
          <div className="flex gap-1">
            <input
              type="number"
              placeholder="от"
              value={currentAreaMin}
              onChange={(e) => applyFilters({ area_min: e.target.value || null })}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <input
              type="number"
              placeholder="до"
              value={currentAreaMax}
              onChange={(e) => applyFilters({ area_max: e.target.value || null })}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Район */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Район
          </label>
          <select
            value={currentDistrict}
            onChange={(e) => applyFilters({ district: e.target.value || null })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="">Все районы</option>
            {filterData?.districts.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name} ({d.offers_count})
              </option>
            ))}
          </select>
        </div>

        {/* Сброс */}
        <div className="flex items-end">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

ПРОВЕРКА:
□ npm run dev — без ошибок
□ Компонент создан, но ещё не подключен к странице

КОММИТ:
git add -A && git commit -m "feat(frontend): add OffersFilter component"

ПОСЛЕ:
□ Отметь F7.1 как completed
```

#### F7.2 Интеграция фильтров со страницей
```
ЗАДАЧА: Подключить фильтры к странице /offers

ДО НАЧАЛА:
□ F7.1 завершена

ДЕЙСТВИЯ:
1. Обнови frontend/src/app/offers/page.tsx:

import { offersApi, OfferListItem } from '@/services/api';
import OfferCard from '@/components/OfferCard';
import OffersFilter from '@/components/OffersFilter';
import { Suspense } from 'react';

interface SearchParams {
  page?: string;
  rooms?: string;
  euro?: string;
  price_min?: string;
  price_max?: string;
  area_min?: string;
  area_max?: string;
  district?: string;
  renovation?: string;
  not_first?: string;
  not_last?: string;
  sort?: string;
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Передаём все параметры в API
  const params: Record<string, string> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params[key] = value;
  });

  const response = await offersApi.getList(params);
  const offers = response.data;
  const pagination = response.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Квартиры в новостройках
      </h1>

      {/* Фильтры */}
      <Suspense fallback={<div className="h-20 bg-gray-100 rounded-lg animate-pulse mb-6" />}>
        <OffersFilter />
      </Suspense>

      {/* Результаты */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-500">
          {pagination ? `Найдено: ${pagination.total.toLocaleString('ru-RU')} квартир` : 'Загрузка...'}
        </span>
        {/* Сортировка - добавим позже */}
      </div>

      {/* Список карточек */}
      {offers.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          По вашему запросу ничего не найдено. Попробуйте изменить фильтры.
        </div>
      )}

      {/* Пагинация */}
      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          baseUrl="/offers"
          searchParams={searchParams}
        />
      )}
    </div>
  );
}

// Компонент пагинации
function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string | undefined>;
}) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') params.set(key, value);
    });
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  // Показываем максимум 7 страниц
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex justify-center gap-1">
      {currentPage > 1 && (
        <a
          href={buildUrl(currentPage - 1)}
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
        >
          ←
        </a>
      )}

      {getPageNumbers().map((page, i) => (
        page === '...' ? (
          <span key={`dots-${i}`} className="px-3 py-2">...</span>
        ) : (
          <a
            key={page}
            href={buildUrl(page as number)}
            className={`px-3 py-2 rounded ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {page}
          </a>
        )
      ))}

      {currentPage < totalPages && (
        <a
          href={buildUrl(currentPage + 1)}
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
        >
          →
        </a>
      )}
    </div>
  );
}

ПРОВЕРКА:
□ http://localhost:3000/offers — фильтры отображаются
□ Выбор комнат меняет URL и результаты
□ Фильтр по цене работает
□ Фильтр по району работает
□ Кнопка "Сбросить" очищает фильтры
□ Пагинация сохраняет фильтры при переходе

КОММИТ:
git add -A && git commit -m "feat(frontend): integrate filters with offers page"

ПОСЛЕ:
□ Отметь F7.2 как completed
```

#### F7.3 Сортировка результатов
```
ЗАДАЧА: Добавить выбор сортировки

ДО НАЧАЛА:
□ F7.2 завершена

ДЕЙСТВИЯ:
1. Создай frontend/src/components/OffersSort.tsx:

'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Сначала дешевые' },
  { value: 'price_desc', label: 'Сначала дорогие' },
  { value: 'area_asc', label: 'По площади ↑' },
  { value: 'area_desc', label: 'По площади ↓' },
  { value: 'price_per_meter_asc', label: 'По цене за м²' },
];

export default function OffersSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'date_desc';

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page'); // сброс на первую страницу
    if (value === 'date_desc') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    router.push(`/offers?${params.toString()}`);
  };

  return (
    <select
      value={currentSort}
      onChange={(e) => handleChange(e.target.value)}
      className="px-3 py-1 text-sm border border-gray-300 rounded bg-white"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

2. Обнови frontend/src/app/offers/page.tsx — добавь сортировку:

import OffersSort from '@/components/OffersSort';

// В JSX замени комментарий "Сортировка - добавим позже" на:
<div className="flex justify-between items-center mb-4">
  <span className="text-gray-500">
    {pagination ? `Найдено: ${pagination.total.toLocaleString('ru-RU')} квартир` : 'Загрузка...'}
  </span>
  <Suspense fallback={null}>
    <OffersSort />
  </Suspense>
</div>

ПРОВЕРКА:
□ Селект сортировки отображается
□ Выбор "Сначала дешевые" — первые квартиры дешевле
□ Выбор "По площади ↓" — первые квартиры больше
□ URL обновляется при смене сортировки

КОММИТ:
git add -A && git commit -m "feat(frontend): add offers sorting"

ПОСЛЕ:
□ Отметь F7.3 как completed
```

#### F7.4 Расширенные фильтры — этаж
```
ЗАДАЧА: Добавить фильтры по этажу

ДО НАЧАЛА:
□ F7.3 завершена

ДЕЙСТВИЯ:
1. Обнови frontend/src/components/OffersFilter.tsx — добавь в grid после площади:

{/* Этаж */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Этаж
  </label>
  <div className="flex flex-wrap gap-1">
    <button
      onClick={() => applyFilters({
        not_first: searchParams.get('not_first') === 'true' ? null : 'true'
      })}
      className={`px-2 py-1 text-xs rounded border ${
        searchParams.get('not_first') === 'true'
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
      }`}
    >
      Не первый
    </button>
    <button
      onClick={() => applyFilters({
        not_last: searchParams.get('not_last') === 'true' ? null : 'true'
      })}
      className={`px-2 py-1 text-xs rounded border ${
        searchParams.get('not_last') === 'true'
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
      }`}
    >
      Не последний
    </button>
  </div>
</div>

2. Обнови hasActiveFilters:

const hasActiveFilters = currentRooms.length > 0 || currentEuro ||
  currentPriceMin || currentPriceMax || currentAreaMin || currentAreaMax ||
  currentDistrict || currentRenovation.length > 0 ||
  searchParams.get('not_first') === 'true' || searchParams.get('not_last') === 'true';

ПРОВЕРКА:
□ Кнопки "Не первый" и "Не последний" отображаются
□ При клике фильтр применяется
□ Результаты не содержат квартиры на 1 этаже (при "Не первый")
□ Кнопка "Сбросить" сбрасывает и эти фильтры

КОММИТ:
git add -A && git commit -m "feat(frontend): add floor filters"

ПОСЛЕ:
□ Отметь F7.4 как completed
```

#### F7.5 Расширенные фильтры — отделка
```
ЗАДАЧА: Добавить мультиселект для типа отделки

ДО НАЧАЛА:
□ F7.4 завершена

ДЕЙСТВИЯ:
1. Обнови frontend/src/components/OffersFilter.tsx — добавь после района:

{/* Отделка */}
<div className="col-span-2 md:col-span-1">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Отделка
  </label>
  <div className="flex flex-wrap gap-1">
    {filterData?.renovations.slice(0, 4).map((r) => (
      <button
        key={r.value}
        onClick={() => {
          const newRenovations = currentRenovation.includes(r.value)
            ? currentRenovation.filter(v => v !== r.value)
            : [...currentRenovation, r.value];
          applyFilters({
            renovation: newRenovations.length > 0 ? newRenovations.join(',') : null
          });
        }}
        className={`px-2 py-1 text-xs rounded border truncate max-w-[120px] ${
          currentRenovation.includes(r.value)
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
        }`}
        title={r.value}
      >
        {r.value.replace('Отделка', '').replace('отделка', '').trim() || r.value}
      </button>
    ))}
  </div>
</div>

ПРОВЕРКА:
□ Кнопки типов отделки отображаются
□ Можно выбрать несколько типов
□ Фильтрация работает корректно
□ URL содержит renovation=тип1,тип2

КОММИТ:
git add -A && git commit -m "feat(frontend): add renovation filter"

ПОСЛЕ:
□ Отметь F7.5 как completed
```

#### F7.6 Сохранение фильтров в URL
```
ЗАДАЧА: Убедиться что все фильтры корректно сохраняются и восстанавливаются

ДО НАЧАЛА:
□ F7.5 завершена

ДЕЙСТВИЯ:
1. Проверь что URL полностью отражает состояние фильтров:

// Тестовые сценарии:
// 1. Выбери 1-комнатные → URL: ?rooms=1
// 2. Добавь евро → URL: ?rooms=1&euro=true
// 3. Добавь цену от 5млн → URL: ?rooms=1&euro=true&price_min=5000000
// 4. Скопируй URL, открой в новой вкладке → все фильтры восстановлены
// 5. Нажми "Сбросить" → URL: /offers (чистый)

2. Если есть баги — исправь их в OffersFilter.tsx

3. Добавь документирующий комментарий в начало файла:

/**
 * OffersFilter — компонент фильтрации списка квартир
 *
 * Поддерживаемые фильтры (все сохраняются в URL):
 * - rooms: комнаты (0,1,2,3,4) — мультиселект
 * - euro: евро-планировка (true/false)
 * - price_min/price_max: диапазон цены
 * - area_min/area_max: диапазон площади
 * - district: район (single select)
 * - renovation: тип отделки (мультиселект)
 * - not_first/not_last: исключение этажей
 */

ПРОВЕРКА:
□ Все 5 тестовых сценариев работают
□ При обновлении страницы фильтры сохраняются
□ Шаринг ссылки работает — получатель видит те же фильтры

КОММИТ:
git add -A && git commit -m "feat(frontend): ensure filter state persistence in URL"

ПОСЛЕ:
□ Отметь F7.6 как completed
```

#### F7.7 Мобильная адаптация фильтров
```
ЗАДАЧА: Сделать фильтры удобными на мобильных устройствах

ДО НАЧАЛА:
□ F7.6 завершена

ДЕЙСТВИЯ:
1. Обнови frontend/src/components/OffersFilter.tsx:

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { FilterData, filtersApi } from '@/services/api';

export default function OffersFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // ... (весь остальной код остаётся)

  // В return замени весь JSX на:
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      {/* Мобильный заголовок */}
      <div
        className="md:hidden p-4 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-medium">
          Фильтры {hasActiveFilters && <span className="text-blue-600">•</span>}
        </span>
        <span className={`transform transition ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </div>

      {/* Контент фильтров */}
      <div className={`p-4 pt-0 md:pt-4 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* ... все фильтры ... */}
        </div>
      </div>
    </div>
  );
}

ПРОВЕРКА:
□ На десктопе фильтры всегда видны
□ На мобильном (< 768px) фильтры скрыты под аккордеоном
□ Клик на "Фильтры" раскрывает/скрывает
□ Индикатор "•" показывает наличие активных фильтров

КОММИТ:
git add -A && git commit -m "feat(frontend): add mobile-friendly filter accordion"

ПОСЛЕ:
□ Отметь F7.7 как completed
□ git push origin main
□ Переходи к F8 (см. PHASE_1_PLAN_PART3.md)
```

### Критерии завершения F7
- [ ] Фильтры по комнатам работают (мультиселект)
- [ ] Фильтр евро-планировки работает
- [ ] Диапазоны цены и площади работают
- [ ] Фильтр по району работает
- [ ] Фильтр по отделке работает
- [ ] Фильтры "не первый/не последний этаж" работают
- [ ] Сортировка работает (6 вариантов)
- [ ] Все фильтры сохраняются в URL
- [ ] На мобильных фильтры в аккордеоне

---

## ПРОДОЛЖЕНИЕ

**Следующий документ:** `PHASE_1_PLAN_PART3.md`

Содержит:
- F8: Карточка объекта (детальная страница)
- F9: Авторизация и подборки
- F10: Бронирование и ЛК агента

---

## QUICK REFERENCE

### Часто используемые команды

```bash
# Backend
cd backend && npm run dev          # Запуск с hot-reload
npm run lint                       # Проверка кода

# Frontend
cd frontend && npm run dev         # Запуск Next.js
npm run build                      # Production build

# Docker
docker-compose -f docker-compose.dev.yml up -d    # Запуск БД
docker-compose -f docker-compose.dev.yml logs -f  # Логи
docker-compose -f docker-compose.dev.yml down     # Остановка

# Git
git add -A && git commit -m "message"
git push origin main
```

### Проверка API

```bash
# Список квартир
curl "http://localhost:3001/api/offers?page=1&limit=5"

# С фильтрами
curl "http://localhost:3001/api/offers?rooms=1,2&euro=true&price_max=10000000"

# Детали квартиры
curl "http://localhost:3001/api/offers/1"

# Справочники
curl "http://localhost:3001/api/filters/all"
```
