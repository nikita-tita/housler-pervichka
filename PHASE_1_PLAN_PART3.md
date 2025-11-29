# ЭТАП 1: ЧАСТЬ 3 — Фичи F8-F10

## НАПОМИНАНИЕ ПЕРЕД НАЧАЛОМ

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ЭТО ЗАВЕРШАЮЩАЯ ЧАСТЬ PHASE_1_PLAN                                     │
│                                                                         │
│  ПЕРЕД НАЧАЛОМ УБЕДИСЬ:                                                 │
│  □ F1-F7 полностью завершены                                            │
│  □ Список квартир с фильтрами работает                                  │
│  □ API возвращает данные корректно                                      │
│  □ Ты прочитал CLAUDE.md                                                │
│                                                                         │
│  ПОРЯДОК ЧТЕНИЯ:                                                        │
│  1. PHASE_1_PLAN.md (F1-F4) — выполнено                                 │
│  2. PHASE_1_PLAN_PART2.md (F5-F7) — выполнено                           │
│  3. PHASE_1_PLAN_PART3.md (F8-F10) — этот документ                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## F8: КАРТОЧКА ОБЪЕКТА

### Цель

Создать детальную страницу квартиры с галереей, характеристиками и контактами.

### Контекст для чтения ПЕРЕД началом

```
ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
├── /CLAUDE.md                         — Правила работы
├── /ТЗ_v2_расширенное.md              — Секция 4.3 (карточка объекта)
├── /frontend/src/services/api.ts      — Типы OfferDetails
├── /backend/src/api/offers.router.ts  — Эндпоинт GET /api/offers/:id
└── /frontend/src/components/OfferCard.tsx — Для консистентности стилей
```

### Саб-таски

#### F8.1 Страница деталей квартиры — базовая структура

```
ЗАДАЧА: Создать страницу /offers/[id] с базовой информацией

ДО НАЧАЛА:
□ F7 полностью завершена
□ Прочитай секцию 4.3 в ТЗ
□ Проверь: curl http://localhost:3001/api/offers/1 — возвращает данные

ДЕЙСТВИЯ:
1. Создай frontend/src/app/offers/[id]/page.tsx:

import { offersApi, OfferDetails } from '@/services/api';
import { notFound } from 'next/navigation';
import { formatPrice, formatArea, formatRooms, formatFloor } from '@/utils/format';
import ImageGallery from '@/components/ImageGallery';
import MetroList from '@/components/MetroList';

interface Props {
  params: { id: string };
}

export default async function OfferPage({ params }: Props) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  let offer: OfferDetails;

  try {
    const response = await offersApi.getById(id);
    offer = response.data;
  } catch (error) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Хлебные крошки */}
      <nav className="text-sm text-gray-500 mb-4">
        <a href="/offers" className="hover:text-gray-700">Квартиры</a>
        <span className="mx-2">/</span>
        <span>{formatRooms(offer.rooms, offer.is_euro_layout)}</span>
        {offer.complex_name && (
          <>
            <span className="mx-2">/</span>
            <span>{offer.complex_name}</span>
          </>
        )}
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Левая колонка — галерея */}
        <div className="lg:col-span-2">
          <ImageGallery images={offer.images} />

          {/* Описание */}
          {offer.description && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Описание</h2>
              <div className="prose prose-gray max-w-none">
                <p className="whitespace-pre-line text-gray-700">
                  {offer.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Правая колонка — информация */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            {/* Заголовок */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">
                  {formatRooms(offer.rooms, offer.is_euro_layout)}
                </h1>
                {offer.is_euro_layout && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    Евро
                  </span>
                )}
              </div>
              <p className="text-gray-500">{offer.address}</p>
            </div>

            {/* Цена */}
            <div className="mb-6 pb-6 border-b">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {formatPrice(offer.price)}
              </div>
              <div className="text-gray-500">
                {formatPrice(offer.price_per_meter)}/м²
              </div>
            </div>

            {/* Характеристики */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Площадь общая</span>
                <span className="font-medium">{formatArea(offer.area_total)}</span>
              </div>
              {offer.area_living && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Площадь жилая</span>
                  <span className="font-medium">{formatArea(offer.area_living)}</span>
                </div>
              )}
              {offer.area_kitchen && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Площадь кухни</span>
                  <span className="font-medium">{formatArea(offer.area_kitchen)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Этаж</span>
                <span className="font-medium">{formatFloor(offer.floor, offer.floors_total)}</span>
              </div>
              {offer.renovation && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Отделка</span>
                  <span className="font-medium">{offer.renovation}</span>
                </div>
              )}
              {offer.building_state && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Статус</span>
                  <span className="font-medium">
                    {offer.building_state === 'hand-over' ? 'Сдан' : 'Строится'}
                  </span>
                </div>
              )}
            </div>

            {/* Метро */}
            {offer.metro && offer.metro.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Метро</h3>
                <MetroList metro={offer.metro} />
              </div>
            )}

            {/* ЖК */}
            {offer.complex_name && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Жилой комплекс</div>
                <div className="font-medium">{offer.complex_name}</div>
                {offer.developer_name && (
                  <div className="text-sm text-gray-500 mt-1">
                    {offer.developer_name}
                  </div>
                )}
              </div>
            )}

            {/* Кнопка бронирования (пока заглушка) */}
            <button
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              disabled
            >
              Забронировать
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Функция бронирования будет доступна после авторизации
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

ПРОВЕРКА:
□ Пока будут ошибки — нужны компоненты ImageGallery и MetroList

КОММИТ:
# Пока не коммитим — сначала создадим недостающие компоненты
```

#### F8.2 Компонент галереи изображений

```
ЗАДАЧА: Создать галерею с превью и модальным просмотром

ДО НАЧАЛА:
□ F8.1 начата

ДЕЙСТВИЯ:
1. Создай frontend/src/components/ImageGallery.tsx:

'use client';

import { useState } from 'react';

interface Image {
  url: string;
  tag: string;
  sort_order: number;
}

interface Props {
  images: Image[];
}

export default function ImageGallery({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        Нет изображений
      </div>
    );
  }

  // Сортируем: plan первым, потом housemain, потом остальные
  const sortedImages = [...images].sort((a, b) => {
    const priority: Record<string, number> = { plan: 1, housemain: 2, floorplan: 3 };
    return (priority[a.tag] || 99) - (priority[b.tag] || 99);
  });

  const activeImage = sortedImages[activeIndex];

  const getTagLabel = (tag: string) => {
    const labels: Record<string, string> = {
      plan: 'План квартиры',
      housemain: 'Фасад',
      floorplan: 'План этажа',
      complexscheme: 'Генплан',
    };
    return labels[tag] || tag;
  };

  return (
    <>
      {/* Основное изображение */}
      <div
        className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden cursor-pointer relative"
        onClick={() => setIsModalOpen(true)}
      >
        <img
          src={activeImage.url}
          alt={getTagLabel(activeImage.tag)}
          className="w-full h-full object-contain"
        />
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {getTagLabel(activeImage.tag)}
        </div>
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {activeIndex + 1} / {sortedImages.length}
        </div>
      </div>

      {/* Превью */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {sortedImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`flex-shrink-0 w-20 h-16 rounded overflow-hidden border-2 transition ${
                index === activeIndex ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <img
                src={img.url}
                alt={getTagLabel(img.tag)}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Модальное окно */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            onClick={() => setIsModalOpen(false)}
          >
            ✕
          </button>

          {/* Навигация */}
          {activeIndex > 0 && (
            <button
              className="absolute left-4 text-white text-4xl hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(activeIndex - 1);
              }}
            >
              ‹
            </button>
          )}
          {activeIndex < sortedImages.length - 1 && (
            <button
              className="absolute right-4 text-white text-4xl hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(activeIndex + 1);
              }}
            >
              ›
            </button>
          )}

          <img
            src={sortedImages[activeIndex].url}
            alt={getTagLabel(sortedImages[activeIndex].tag)}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {getTagLabel(sortedImages[activeIndex].tag)} • {activeIndex + 1} / {sortedImages.length}
          </div>
        </div>
      )}
    </>
  );
}

ПРОВЕРКА:
□ Компонент создан без ошибок TypeScript

КОММИТ:
# Пока не коммитим — нужен ещё MetroList
```

#### F8.3 Компонент списка метро

```
ЗАДАЧА: Создать компонент отображения ближайших станций метро

ДО НАЧАЛА:
□ F8.2 завершена

ДЕЙСТВИЯ:
1. Создай frontend/src/components/MetroList.tsx:

interface Metro {
  name: string;
  line_name: string;
  line_color: string;
  time_minutes: number;
}

interface Props {
  metro: Metro[];
  limit?: number;
}

export default function MetroList({ metro, limit = 3 }: Props) {
  const displayMetro = metro.slice(0, limit);

  return (
    <div className="space-y-2">
      {displayMetro.map((station, index) => (
        <div key={index} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: station.line_color || '#999' }}
          />
          <span className="text-sm">{station.name}</span>
          <span className="text-xs text-gray-400 ml-auto">
            {station.time_minutes} мин пешком
          </span>
        </div>
      ))}
      {metro.length > limit && (
        <div className="text-xs text-gray-400">
          +{metro.length - limit} станций рядом
        </div>
      )}
    </div>
  );
}

ПРОВЕРКА:
□ Компонент создан
□ npm run dev во frontend — без ошибок

КОММИТ:
git add -A && git commit -m "feat(frontend): add offer detail page with gallery"

ПОСЛЕ:
□ Отметь F8.1, F8.2, F8.3 как completed
```

#### F8.4 Loading и Error для страницы деталей

```
ЗАДАЧА: Добавить loading и error состояния

ДО НАЧАЛА:
□ F8.3 завершена

ДЕЙСТВИЯ:
1. Создай frontend/src/app/offers/[id]/loading.tsx:

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="aspect-[4/3] bg-gray-200 rounded-lg"></div>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

2. Создай frontend/src/app/offers/[id]/not-found.tsx:

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">Квартира не найдена</h1>
      <p className="text-gray-600 mb-8">
        Возможно, она была снята с продажи или ссылка неверная.
      </p>
      <Link
        href="/offers"
        className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Смотреть все квартиры
      </Link>
    </div>
  );
}

ПРОВЕРКА:
□ http://localhost:3000/offers/1 — показывает детали
□ http://localhost:3000/offers/999999 — показывает "Квартира не найдена"
□ Галерея работает, можно листать
□ Клик на изображение открывает модальное окно

КОММИТ:
git add -A && git commit -m "feat(frontend): add loading and not-found for offer details"

ПОСЛЕ:
□ Отметь F8.4 как completed
```

#### F8.5 SEO метаданные для страницы квартиры

```
ЗАДАЧА: Добавить динамические метаданные для SEO

ДО НАЧАЛА:
□ F8.4 завершена

ДЕЙСТВИЯ:
1. Обнови frontend/src/app/offers/[id]/page.tsx — добавь в начало:

import type { Metadata } from 'next';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return { title: 'Квартира не найдена | Housler' };
  }

  try {
    const response = await offersApi.getById(id);
    const offer = response.data;

    const title = `${formatRooms(offer.rooms, offer.is_euro_layout)} ${formatArea(offer.area_total)} за ${formatPrice(offer.price)}`;
    const description = `${offer.complex_name || 'Новостройка'}, ${offer.district || 'СПб'}. ${offer.renovation || 'Отделка'}. Этаж ${offer.floor}/${offer.floors_total}.`;

    return {
      title: `${title} | Housler`,
      description,
      openGraph: {
        title,
        description,
        images: offer.images?.[0]?.url ? [offer.images[0].url] : [],
      },
    };
  } catch {
    return { title: 'Квартира не найдена | Housler' };
  }
}

// Остальной код страницы остаётся без изменений

ПРОВЕРКА:
□ Открой страницу квартиры
□ Проверь <title> в HTML (View Source или DevTools)
□ Заголовок должен содержать комнаты, площадь и цену

КОММИТ:
git add -A && git commit -m "feat(frontend): add SEO metadata to offer page"

ПОСЛЕ:
□ Отметь F8.5 как completed
□ git push origin main
□ Переходи к F9
```

### Критерии завершения F8

- [ ] /offers/:id — страница открывается
- [ ] Галерея показывает все изображения
- [ ] Модальный просмотр работает
- [ ] Характеристики отображаются корректно
- [ ] Метро отображается с цветами линий
- [ ] Loading skeleton при загрузке
- [ ] 404 для несуществующих квартир
- [ ] SEO метаданные динамические

---

## F9: АВТОРИЗАЦИЯ И ПОДБОРКИ

### Цель

Реализовать авторизацию агентов и возможность создавать подборки для клиентов.

### Контекст для чтения ПЕРЕД началом

```
ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
├── /CLAUDE.md                         — Правила работы
├── /ТЗ_v2_расширенное.md              — Секции 4.6-4.8 (ЛК, подборки, авторизация)
├── /database_schema.sql               — Таблицы agents, selections, selection_offers
├── /backend/src/config/database.ts    — Подключение к БД
└── /backend/package.json              — Проверь наличие jsonwebtoken, bcryptjs
```

### Саб-таски

#### F9.1 API авторизации — регистрация и логин

```
ЗАДАЧА: Создать эндпоинты регистрации и входа для агентов

ДО НАЧАЛА:
□ F8 полностью завершена
□ Прочитай секцию 4.8 в ТЗ
□ Проверь: grep -r "agents" database_schema.sql — таблица существует

ДЕЙСТВИЯ:
1. Создай backend/src/api/auth.router.ts:

import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Схемы валидации
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  company: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Проверяем существует ли email
    const existing = await pool.query(
      'SELECT id FROM agents WHERE email = $1',
      [data.email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email уже зарегистрирован'
      });
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Создаём агента
    const result = await pool.query(`
      INSERT INTO agents (email, password_hash, name, phone, company)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, phone, company, created_at
    `, [data.email, passwordHash, data.name, data.phone || null, data.company || null]);

    const agent = result.rows[0];

    // Генерируем токен
    const token = jwt.sign(
      { id: agent.id, email: agent.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          email: agent.email,
          name: agent.name,
          phone: agent.phone,
          company: agent.company,
        },
        token
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      });
    }
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Ошибка регистрации' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    // Ищем агента
    const result = await pool.query(
      'SELECT id, email, password_hash, name, phone, company FROM agents WHERE email = $1',
      [data.email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    const agent = result.rows[0];

    // Проверяем пароль
    const isValid = await bcrypt.compare(data.password, agent.password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    // Генерируем токен
    const token = jwt.sign(
      { id: agent.id, email: agent.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          email: agent.email,
          name: agent.name,
          phone: agent.phone,
          company: agent.company,
        },
        token
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      });
    }
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Ошибка входа' });
  }
});

// GET /api/auth/me — получить текущего пользователя
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };

      const result = await pool.query(
        'SELECT id, email, name, phone, company FROM agents WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Пользователь не найден' });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch {
      return res.status(401).json({ success: false, error: 'Невалидный токен' });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ success: false, error: 'Ошибка проверки авторизации' });
  }
});

export default router;

2. Добавь в backend/src/api/index.ts:

import authRouter from './auth.router';
router.use('/auth', authRouter);

3. Добавь в .env.example:

# Auth
JWT_SECRET=your-super-secret-key-change-this

ПРОВЕРКА:
□ curl -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"123456","name":"Тест Агент"}'
□ Ответ содержит token и данные агента
□ curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"123456"}'
□ Ответ содержит token

КОММИТ:
git add -A && git commit -m "feat(api): add auth endpoints for agents"

ПОСЛЕ:
□ Отметь F9.1 как completed
```

#### F9.2 Middleware авторизации

```
ЗАДАЧА: Создать middleware для защиты роутов

ДО НАЧАЛА:
□ F9.1 завершена

ДЕЙСТВИЯ:
1. Создай backend/src/middleware/auth.middleware.ts:

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  agent?: {
    id: number;
    email: string;
  };
}

export const authRequired = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Требуется авторизация'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    req.agent = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Невалидный или истекший токен'
    });
  }
};

export const authOptional = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
      req.agent = decoded;
    } catch {
      // Игнорируем ошибку — пользователь просто не авторизован
    }
  }

  next();
};

ПРОВЕРКА:
□ npm run dev — без ошибок

КОММИТ:
git add -A && git commit -m "feat(api): add auth middleware"

ПОСЛЕ:
□ Отметь F9.2 как completed
```

#### F9.3 API подборок

```
ЗАДАЧА: Создать CRUD для подборок агента

ДО НАЧАЛА:
□ F9.2 завершена
□ Прочитай database_schema.sql — таблицы selections, selection_offers

ДЕЙСТВИЯ:
1. Создай backend/src/api/selections.router.ts:

import { Router, Response } from 'express';
import { pool } from '../config/database';
import { authRequired, AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

// Все роуты требуют авторизации
router.use(authRequired);

const createSelectionSchema = z.object({
  title: z.string().min(1).max(200),
  client_name: z.string().min(1).max(100),
  client_phone: z.string().optional(),
  client_email: z.string().email().optional(),
  notes: z.string().optional(),
});

// GET /api/selections — список подборок агента
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.title,
        s.client_name,
        s.public_link,
        s.status,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(*) FROM selection_offers so WHERE so.selection_id = s.id) as offers_count
      FROM selections s
      WHERE s.agent_id = $1
      ORDER BY s.updated_at DESC
    `, [req.agent!.id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching selections:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения подборок' });
  }
});

// POST /api/selections — создать подборку
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createSelectionSchema.parse(req.body);

    // Генерируем уникальную публичную ссылку
    const publicLink = crypto.randomBytes(8).toString('hex');

    const result = await pool.query(`
      INSERT INTO selections (agent_id, title, client_name, client_phone, client_email, notes, public_link)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      req.agent!.id,
      data.title,
      data.client_name,
      data.client_phone || null,
      data.client_email || null,
      data.notes || null,
      publicLink
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      });
    }
    console.error('Error creating selection:', error);
    res.status(500).json({ success: false, error: 'Ошибка создания подборки' });
  }
});

// GET /api/selections/:id — детали подборки
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const result = await pool.query(`
      SELECT * FROM selections
      WHERE id = $1 AND agent_id = $2
    `, [id, req.agent!.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Подборка не найдена' });
    }

    // Получаем квартиры в подборке
    const offersResult = await pool.query(`
      SELECT
        o.id,
        o.rooms,
        o.is_euro_layout,
        o.floor,
        o.floors_total,
        o.area_total,
        o.price,
        o.price_per_meter,
        o.address,
        c.name as complex_name,
        so.agent_comment,
        so.sort_order,
        (SELECT url FROM offer_images WHERE offer_id = o.id AND tag = 'plan' LIMIT 1) as image_plan
      FROM selection_offers so
      JOIN offers o ON so.offer_id = o.id
      LEFT JOIN complexes c ON o.complex_id = c.id
      WHERE so.selection_id = $1
      ORDER BY so.sort_order ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        offers: offersResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching selection:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения подборки' });
  }
});

// POST /api/selections/:id/offers — добавить квартиру в подборку
router.post('/:id/offers', async (req: AuthRequest, res: Response) => {
  try {
    const selectionId = parseInt(req.params.id);
    const { offer_id, agent_comment } = req.body;

    // Проверяем что подборка принадлежит агенту
    const selectionCheck = await pool.query(
      'SELECT id FROM selections WHERE id = $1 AND agent_id = $2',
      [selectionId, req.agent!.id]
    );

    if (selectionCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Подборка не найдена' });
    }

    // Проверяем что квартира существует
    const offerCheck = await pool.query(
      'SELECT id FROM offers WHERE id = $1 AND is_active = true',
      [offer_id]
    );

    if (offerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Квартира не найдена' });
    }

    // Получаем максимальный sort_order
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM selection_offers WHERE selection_id = $1',
      [selectionId]
    );

    // Добавляем квартиру
    await pool.query(`
      INSERT INTO selection_offers (selection_id, offer_id, agent_comment, sort_order)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (selection_id, offer_id) DO UPDATE SET agent_comment = $3
    `, [selectionId, offer_id, agent_comment || null, maxOrder.rows[0].max_order + 1]);

    // Обновляем updated_at подборки
    await pool.query(
      'UPDATE selections SET updated_at = NOW() WHERE id = $1',
      [selectionId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding offer to selection:', error);
    res.status(500).json({ success: false, error: 'Ошибка добавления квартиры' });
  }
});

// DELETE /api/selections/:id/offers/:offerId — удалить квартиру из подборки
router.delete('/:id/offers/:offerId', async (req: AuthRequest, res: Response) => {
  try {
    const selectionId = parseInt(req.params.id);
    const offerId = parseInt(req.params.offerId);

    // Проверяем что подборка принадлежит агенту
    const selectionCheck = await pool.query(
      'SELECT id FROM selections WHERE id = $1 AND agent_id = $2',
      [selectionId, req.agent!.id]
    );

    if (selectionCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Подборка не найдена' });
    }

    await pool.query(
      'DELETE FROM selection_offers WHERE selection_id = $1 AND offer_id = $2',
      [selectionId, offerId]
    );

    // Обновляем updated_at
    await pool.query(
      'UPDATE selections SET updated_at = NOW() WHERE id = $1',
      [selectionId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing offer from selection:', error);
    res.status(500).json({ success: false, error: 'Ошибка удаления квартиры' });
  }
});

export default router;

2. Добавь в backend/src/api/index.ts:

import selectionsRouter from './selections.router';
router.use('/selections', selectionsRouter);

ПРОВЕРКА:
□ Сначала получи токен через логин
□ curl -X POST http://localhost:3001/api/selections \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Тест подборка","client_name":"Иван Иванов"}'
□ curl http://localhost:3001/api/selections \
    -H "Authorization: Bearer YOUR_TOKEN"
□ Список подборок возвращается

КОММИТ:
git add -A && git commit -m "feat(api): add selections CRUD endpoints"

ПОСЛЕ:
□ Отметь F9.3 как completed
```

#### F9.4 Публичный доступ к подборке

```
ЗАДАЧА: Создать публичный роут для просмотра подборки клиентом

ДО НАЧАЛА:
□ F9.3 завершена

ДЕЙСТВИЯ:
1. Создай backend/src/api/public.router.ts:

import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// GET /api/public/selections/:link — публичный просмотр подборки
router.get('/selections/:link', async (req: Request, res: Response) => {
  try {
    const { link } = req.params;

    const result = await pool.query(`
      SELECT
        s.id,
        s.title,
        s.client_name,
        s.notes,
        s.created_at,
        a.name as agent_name,
        a.phone as agent_phone,
        a.company as agent_company
      FROM selections s
      JOIN agents a ON s.agent_id = a.id
      WHERE s.public_link = $1 AND s.status = 'active'
    `, [link]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Подборка не найдена' });
    }

    const selection = result.rows[0];

    // Получаем квартиры
    const offersResult = await pool.query(`
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
        o.price_per_meter,
        o.renovation,
        o.address,
        o.district,
        c.name as complex_name,
        so.agent_comment,
        (SELECT url FROM offer_images WHERE offer_id = o.id AND tag = 'plan' LIMIT 1) as image_plan,
        (SELECT url FROM offer_images WHERE offer_id = o.id AND tag = 'housemain' LIMIT 1) as image_main
      FROM selection_offers so
      JOIN offers o ON so.offer_id = o.id
      LEFT JOIN complexes c ON o.complex_id = c.id
      WHERE so.selection_id = $1 AND o.is_active = true
      ORDER BY so.sort_order ASC
    `, [selection.id]);

    // Записываем просмотр (для аналитики)
    await pool.query(`
      INSERT INTO selection_views (selection_id, ip_address, user_agent)
      VALUES ($1, $2, $3)
    `, [selection.id, req.ip, req.headers['user-agent']]);

    res.json({
      success: true,
      data: {
        ...selection,
        offers: offersResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching public selection:', error);
    res.status(500).json({ success: false, error: 'Ошибка загрузки подборки' });
  }
});

export default router;

2. Добавь в backend/src/api/index.ts:

import publicRouter from './public.router';
router.use('/public', publicRouter);

3. Создай таблицу для аналитики (добавь в database_schema.sql или выполни вручную):

CREATE TABLE IF NOT EXISTS selection_views (
    id SERIAL PRIMARY KEY,
    selection_id INTEGER NOT NULL REFERENCES selections(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT NOW()
);

ПРОВЕРКА:
□ Создай подборку, получи public_link из ответа
□ curl http://localhost:3001/api/public/selections/YOUR_PUBLIC_LINK
□ Возвращает данные подборки с квартирами

КОММИТ:
git add -A && git commit -m "feat(api): add public selection view endpoint"

ПОСЛЕ:
□ Отметь F9.4 как completed
```

#### F9.5 Страница авторизации на фронтенде

```
ЗАДАЧА: Создать страницы входа и регистрации

ДО НАЧАЛА:
□ F9.4 завершена

ДЕЙСТВИЯ:
1. Создай frontend/src/app/login/page.tsx:

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Ошибка входа');
        return;
      }

      // Сохраняем токен
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('agent', JSON.stringify(data.data.agent));

      // Редирект в ЛК
      router.push('/dashboard');
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-center mb-8">Вход для агентов</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="agent@company.ru"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p className="text-center text-gray-500 mt-4">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}

2. Создай frontend/src/app/register/page.tsx (аналогично, но с полями name, phone, company и POST на /api/auth/register)

3. Добавь ссылку на вход в header (frontend/src/app/layout.tsx):

<nav className="flex gap-4 items-center">
  <a href="/offers" className="text-gray-600 hover:text-gray-900">Квартиры</a>
  <a href="/complexes" className="text-gray-600 hover:text-gray-900">ЖК</a>
  <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">Войти</a>
</nav>

ПРОВЕРКА:
□ http://localhost:3000/login — форма входа
□ Вход с зарегистрированным аккаунтом работает
□ После входа редирект на /dashboard (пока 404)

КОММИТ:
git add -A && git commit -m "feat(frontend): add login page"

ПОСЛЕ:
□ Отметь F9.5 как completed
```

#### F9.6 Контекст авторизации

```
ЗАДАЧА: Создать React Context для состояния авторизации

ДО НАЧАЛА:
□ F9.5 завершена

ДЕЙСТВИЯ:
1. Создай frontend/src/contexts/AuthContext.tsx:

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Agent {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
}

interface AuthContextType {
  agent: Agent | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, agent: Agent) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем сохранённую сессию
    const savedToken = localStorage.getItem('token');
    const savedAgent = localStorage.getItem('agent');

    if (savedToken && savedAgent) {
      setToken(savedToken);
      setAgent(JSON.parse(savedAgent));
    }

    setIsLoading(false);
  }, []);

  const login = (newToken: string, newAgent: Agent) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('agent', JSON.stringify(newAgent));
    setToken(newToken);
    setAgent(newAgent);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('agent');
    setToken(null);
    setAgent(null);
  };

  return (
    <AuthContext.Provider value={{ agent, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

2. Обнови frontend/src/app/layout.tsx — оберни в AuthProvider:

import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <header>...</header>
          <main>{children}</main>
          <footer>...</footer>
        </AuthProvider>
      </body>
    </html>
  );
}

3. Создай компонент хедера с учётом авторизации:

// frontend/src/components/Header.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { agent, logout, isLoading } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          Housler
        </Link>
        <nav className="flex gap-4 items-center">
          <Link href="/offers" className="text-gray-600 hover:text-gray-900">
            Квартиры
          </Link>
          <Link href="/complexes" className="text-gray-600 hover:text-gray-900">
            ЖК
          </Link>
          {!isLoading && (
            agent ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Мои подборки
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Выход
                </button>
              </>
            ) : (
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Войти
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

ПРОВЕРКА:
□ После логина в хедере появляется "Мои подборки" и "Выход"
□ После клика "Выход" возвращается кнопка "Войти"
□ Обновление страницы сохраняет состояние авторизации

КОММИТ:
git add -A && git commit -m "feat(frontend): add auth context and header"

ПОСЛЕ:
□ Отметь F9.6 как completed
□ git push origin main
□ Переходи к F10
```

### Критерии завершения F9

- [ ] POST /api/auth/register — регистрация работает
- [ ] POST /api/auth/login — вход работает, возвращает токен
- [ ] GET /api/auth/me — возвращает данные агента по токену
- [ ] CRUD для подборок работает (требует авторизации)
- [ ] Публичная ссылка на подборку работает
- [ ] Страница входа работает
- [ ] AuthContext сохраняет состояние авторизации
- [ ] Header показывает разные элементы для гостя и агента

---

## F10: БРОНИРОВАНИЕ И ЛК АГЕНТА

### Цель

Создать личный кабинет агента с подборками и возможностью бронирования.

### Контекст для чтения ПЕРЕД началом

```
ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
├── /CLAUDE.md                              — Правила работы
├── /ТЗ_v2_расширенное.md                   — Секции 4.6-4.7 (ЛК, бронирование)
├── /database_schema.sql                    — Таблица bookings
├── /backend/src/api/selections.router.ts  — API подборок
└── /frontend/src/contexts/AuthContext.tsx — Контекст авторизации
```

### Саб-таски

#### F10.1 Страница дашборда агента

```
ЗАДАЧА: Создать главную страницу ЛК со списком подборок

ДО НАЧАЛА:
□ F9 полностью завершена
□ Авторизация работает

ДЕЙСТВИЯ:
1. Создай frontend/src/app/dashboard/page.tsx:

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Selection {
  id: number;
  title: string;
  client_name: string;
  public_link: string;
  status: string;
  offers_count: number;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { agent, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !agent) {
      router.push('/login');
    }
  }, [agent, authLoading, router]);

  useEffect(() => {
    if (token) {
      fetchSelections();
    }
  }, [token]);

  const fetchSelections = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/selections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelections(data.data);
      }
    } catch (error) {
      console.error('Error fetching selections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !agent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Мои подборки</h1>
          <p className="text-gray-500">Привет, {agent.name}!</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Новая подборка
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      ) : selections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">У вас пока нет подборок</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:underline"
          >
            Создать первую подборку
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {selections.map((selection) => (
            <SelectionCard key={selection.id} selection={selection} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateSelectionModal
          token={token!}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchSelections();
          }}
        />
      )}
    </div>
  );
}

function SelectionCard({ selection }: { selection: Selection }) {
  const publicUrl = `${window.location.origin}/s/${selection.public_link}`;

  return (
    <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
      <div>
        <Link
          href={`/dashboard/selections/${selection.id}`}
          className="text-lg font-medium hover:text-blue-600"
        >
          {selection.title}
        </Link>
        <p className="text-sm text-gray-500">
          Клиент: {selection.client_name} • {selection.offers_count} квартир
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Обновлено: {new Date(selection.updated_at).toLocaleDateString('ru-RU')}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(publicUrl)}
          className="text-sm text-blue-600 hover:underline"
        >
          Копировать ссылку
        </button>
        <Link
          href={`/dashboard/selections/${selection.id}`}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Редактировать
        </Link>
      </div>
    </div>
  );
}

function CreateSelectionModal({
  token,
  onClose,
  onCreated
}: {
  token: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/selections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, client_name: clientName })
      });

      const data = await response.json();
      if (data.success) {
        onCreated();
      }
    } catch (error) {
      console.error('Error creating selection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Новая подборка</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название подборки</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Например: Квартиры для семьи Ивановых"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Имя клиента</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Иван Иванов"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSubmitting ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ПРОВЕРКА:
□ http://localhost:3000/dashboard — редирект на /login если не авторизован
□ После логина показывает список подборок (или пустое состояние)
□ Кнопка "+ Новая подборка" открывает модалку
□ Создание подборки работает

КОММИТ:
git add -A && git commit -m "feat(frontend): add dashboard with selections list"

ПОСЛЕ:
□ Отметь F10.1 как completed
```

#### F10.2 Страница редактирования подборки

```
ЗАДАЧА: Создать страницу управления квартирами в подборке

ДО НАЧАЛА:
□ F10.1 завершена

ДЕЙСТВИЯ:
1. Создай frontend/src/app/dashboard/selections/[id]/page.tsx:

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { formatPrice, formatArea, formatRooms } from '@/utils/format';

interface SelectionOffer {
  id: number;
  rooms: number;
  is_euro_layout: boolean;
  floor: number;
  floors_total: number;
  area_total: number;
  price: number;
  address: string;
  complex_name: string | null;
  agent_comment: string | null;
  image_plan: string | null;
}

interface Selection {
  id: number;
  title: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  public_link: string;
  notes: string | null;
  offers: SelectionOffer[];
}

export default function SelectionPage({ params }: { params: { id: string } }) {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
    }
  }, [token, authLoading, router]);

  useEffect(() => {
    if (token) {
      fetchSelection();
    }
  }, [token, params.id]);

  const fetchSelection = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/selections/${params.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setSelection(data.data);
      }
    } catch (error) {
      console.error('Error fetching selection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeOffer = async (offerId: number) => {
    if (!confirm('Удалить квартиру из подборки?')) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/selections/${params.id}/offers/${offerId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      fetchSelection();
    } catch (error) {
      console.error('Error removing offer:', error);
    }
  };

  if (isLoading || !selection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/s/${selection.public_link}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Хлебные крошки */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-gray-700">Мои подборки</Link>
        <span className="mx-2">/</span>
        <span>{selection.title}</span>
      </nav>

      {/* Заголовок */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{selection.title}</h1>
          <p className="text-gray-500">Клиент: {selection.client_name}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(publicUrl)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            📋 Копировать ссылку
          </button>
          <Link
            href={`/s/${selection.public_link}`}
            target="_blank"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Открыть для клиента
          </Link>
        </div>
      </div>

      {/* Список квартир */}
      {selection.offers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">В подборке пока нет квартир</p>
          <Link href="/offers" className="text-blue-600 hover:underline">
            Найти и добавить квартиры
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {selection.offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-lg shadow p-4 flex gap-4">
              {/* Изображение */}
              <div className="w-32 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {offer.image_plan ? (
                  <img src={offer.image_plan} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Нет фото
                  </div>
                )}
              </div>

              {/* Информация */}
              <div className="flex-1">
                <Link
                  href={`/offers/${offer.id}`}
                  target="_blank"
                  className="font-medium hover:text-blue-600"
                >
                  {formatRooms(offer.rooms, offer.is_euro_layout)}, {formatArea(offer.area_total)}
                </Link>
                <p className="text-blue-600 font-semibold">{formatPrice(offer.price)}</p>
                <p className="text-sm text-gray-500">
                  {offer.complex_name} • {offer.floor}/{offer.floors_total} эт.
                </p>
                {offer.agent_comment && (
                  <p className="text-sm text-gray-600 mt-1 italic">
                    Комментарий: {offer.agent_comment}
                  </p>
                )}
              </div>

              {/* Действия */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => removeOffer(offer.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Подсказка */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
        💡 Чтобы добавить квартиры в подборку, откройте{' '}
        <Link href="/offers" className="underline">каталог</Link>{' '}
        и нажмите кнопку "В подборку" на карточке квартиры.
      </div>
    </div>
  );
}

ПРОВЕРКА:
□ http://localhost:3000/dashboard/selections/1 — открывается страница подборки
□ Отображаются квартиры в подборке
□ Кнопка "Удалить" работает
□ Ссылка "Открыть для клиента" открывает публичную страницу

КОММИТ:
git add -A && git commit -m "feat(frontend): add selection edit page"

ПОСЛЕ:
□ Отметь F10.2 как completed
```

#### F10.3 Кнопка добавления в подборку

```
ЗАДАЧА: Добавить кнопку "В подборку" на карточку квартиры

ДО НАЧАЛА:
□ F10.2 завершена

ДЕЙСТВИЯ:
1. Создай frontend/src/components/AddToSelectionButton.tsx:

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Selection {
  id: number;
  title: string;
  client_name: string;
}

interface Props {
  offerId: number;
}

export default function AddToSelectionButton({ offerId }: Props) {
  const { token, agent } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      fetchSelections();
    }
  }, [isOpen, token]);

  const fetchSelections = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/selections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelections(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToSelection = async (selectionId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/selections/${selectionId}/offers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ offer_id: offerId })
      });
      alert('Квартира добавлена в подборку!');
      setIsOpen(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при добавлении');
    }
  };

  if (!agent) {
    return null; // Не показываем кнопку для неавторизованных
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        + В подборку
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border z-50 p-2">
            <div className="text-sm font-medium text-gray-700 mb-2 px-2">
              Выберите подборку:
            </div>
            {isLoading ? (
              <div className="px-2 py-4 text-center text-gray-400">Загрузка...</div>
            ) : selections.length === 0 ? (
              <div className="px-2 py-4 text-center text-gray-400 text-sm">
                Нет подборок. <a href="/dashboard" className="text-blue-600">Создать</a>
              </div>
            ) : (
              selections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => addToSelection(s.id)}
                  className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded text-sm"
                >
                  {s.title}
                  <span className="text-gray-400 block text-xs">{s.client_name}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

2. Добавь кнопку в OfferCard.tsx:

import AddToSelectionButton from './AddToSelectionButton';

// В return, после district:
<div className="flex justify-between items-center mt-2 pt-2 border-t">
  <AddToSelectionButton offerId={offer.id} />
</div>

ПРОВЕРКА:
□ На карточках квартир появляется "+ В подборку" (только для авторизованных)
□ Клик открывает дропдаун с подборками
□ Выбор подборки добавляет квартиру
□ Квартира появляется в подборке

КОММИТ:
git add -A && git commit -m "feat(frontend): add 'add to selection' button"

ПОСЛЕ:
□ Отметь F10.3 как completed
```

#### F10.4 Публичная страница подборки

```
ЗАДАЧА: Создать страницу /s/[link] для клиента

ДО НАЧАЛА:
□ F10.3 завершена

ДЕЙСТВИЯ:
1. Создай frontend/src/app/s/[link]/page.tsx:

import { formatPrice, formatArea, formatRooms, formatFloor } from '@/utils/format';
import Link from 'next/link';

interface Props {
  params: { link: string };
}

async function getSelection(link: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/public/selections/${link}`,
    { cache: 'no-store' }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data.success ? data.data : null;
}

export default async function PublicSelectionPage({ params }: Props) {
  const selection = await getSelection(params.link);

  if (!selection) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Подборка не найдена</h1>
        <p className="text-gray-500">
          Возможно, она была удалена или ссылка неверная.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{selection.title}</h1>
        <p className="text-gray-500">
          Подготовлено для вас: {selection.client_name}
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg inline-block">
          <p className="text-sm text-blue-800">
            Ваш агент: <strong>{selection.agent_name}</strong>
            {selection.agent_phone && (
              <> • <a href={`tel:${selection.agent_phone}`} className="underline">{selection.agent_phone}</a></>
            )}
          </p>
          {selection.agent_company && (
            <p className="text-sm text-blue-600">{selection.agent_company}</p>
          )}
        </div>
      </div>

      {/* Заметка агента */}
      {selection.notes && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 italic">{selection.notes}</p>
        </div>
      )}

      {/* Список квартир */}
      <div className="space-y-6">
        {selection.offers.map((offer: any, index: number) => (
          <div key={offer.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="md:flex">
              {/* Изображения */}
              <div className="md:w-1/3">
                <div className="aspect-[4/3] bg-gray-100">
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
                </div>
              </div>

              {/* Информация */}
              <div className="md:w-2/3 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-sm text-gray-400">Вариант {index + 1}</span>
                    <h3 className="text-xl font-semibold">
                      {formatRooms(offer.rooms, offer.is_euro_layout)}, {formatArea(offer.area_total)}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      {formatPrice(offer.price)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatPrice(offer.price_per_meter)}/м²
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Этаж:</span>{' '}
                    {formatFloor(offer.floor, offer.floors_total)}
                  </div>
                  <div>
                    <span className="text-gray-500">Отделка:</span>{' '}
                    {offer.renovation || '—'}
                  </div>
                  {offer.complex_name && (
                    <div className="col-span-2">
                      <span className="text-gray-500">ЖК:</span>{' '}
                      {offer.complex_name}
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-gray-500">Адрес:</span>{' '}
                    {offer.address}
                  </div>
                </div>

                {/* Комментарий агента */}
                {offer.agent_comment && (
                  <div className="p-3 bg-yellow-50 rounded text-sm">
                    💬 <em>{offer.agent_comment}</em>
                  </div>
                )}

                <div className="mt-4">
                  <Link
                    href={`/offers/${offer.id}`}
                    target="_blank"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Подробнее о квартире →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Контакты */}
      <div className="mt-8 text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">
          Понравился вариант? Свяжитесь с вашим агентом:
        </p>
        {selection.agent_phone && (
          <a
            href={`tel:${selection.agent_phone}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Позвонить {selection.agent_name}
          </a>
        )}
      </div>
    </div>
  );
}

ПРОВЕРКА:
□ http://localhost:3000/s/YOUR_PUBLIC_LINK — открывается публичная страница
□ Отображается информация об агенте
□ Все квартиры показываются с ценами и характеристиками
□ Кнопка звонка работает

КОММИТ:
git add -A && git commit -m "feat(frontend): add public selection page"

ПОСЛЕ:
□ Отметь F10.4 как completed
```

#### F10.5 Заявка на бронирование

```
ЗАДАЧА: Добавить возможность оставить заявку на бронирование

ДО НАЧАЛА:
□ F10.4 завершена

ДЕЙСТВИЯ:
1. Создай backend/src/api/bookings.router.ts:

import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { z } from 'zod';

const router = Router();

const createBookingSchema = z.object({
  offer_id: z.number(),
  client_name: z.string().min(2),
  client_phone: z.string().min(10),
  client_email: z.string().email().optional(),
  selection_id: z.number().optional(),
  comment: z.string().optional(),
});

// POST /api/bookings — создать заявку
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createBookingSchema.parse(req.body);

    // Проверяем что квартира существует
    const offerCheck = await pool.query(
      'SELECT id, complex_id FROM offers WHERE id = $1 AND is_active = true',
      [data.offer_id]
    );

    if (offerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Квартира не найдена' });
    }

    // Определяем agent_id если есть selection_id
    let agentId = null;
    if (data.selection_id) {
      const selectionCheck = await pool.query(
        'SELECT agent_id FROM selections WHERE id = $1',
        [data.selection_id]
      );
      if (selectionCheck.rows.length > 0) {
        agentId = selectionCheck.rows[0].agent_id;
      }
    }

    // Создаём заявку
    const result = await pool.query(`
      INSERT INTO bookings (offer_id, agent_id, selection_id, client_name, client_phone, client_email, comment, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'new')
      RETURNING id, created_at
    `, [
      data.offer_id,
      agentId,
      data.selection_id || null,
      data.client_name,
      data.client_phone,
      data.client_email || null,
      data.comment || null
    ]);

    // TODO: Отправить уведомление агенту (email, telegram, etc.)

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        message: 'Заявка успешно создана. Агент свяжется с вами в ближайшее время.'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Ошибка валидации',
        details: error.errors
      });
    }
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, error: 'Ошибка создания заявки' });
  }
});

export default router;

2. Добавь в backend/src/api/index.ts:

import bookingsRouter from './bookings.router';
router.use('/bookings', bookingsRouter);

3. Добавь форму заявки на публичную страницу подборки (компонент BookingForm)

ПРОВЕРКА:
□ curl -X POST http://localhost:3001/api/bookings \
    -H "Content-Type: application/json" \
    -d '{"offer_id":1,"client_name":"Тест","client_phone":"+79001234567"}'
□ Заявка создаётся в БД
□ Возвращается success с сообщением

КОММИТ:
git add -A && git commit -m "feat(api): add booking request endpoint"

ПОСЛЕ:
□ Отметь F10.5 как completed
□ git push origin main
□ 🎉 ЭТАП 1 ЗАВЕРШЁН!
```

### Критерии завершения F10

- [ ] /dashboard — показывает список подборок агента
- [ ] Создание новой подборки работает
- [ ] Страница редактирования подборки работает
- [ ] Кнопка "В подборку" на карточках работает
- [ ] Публичная страница /s/:link работает
- [ ] Заявка на бронирование создаётся

---

## ЗАВЕРШЕНИЕ ЭТАПА 1

### Чек-лист готовности MVP

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ФИНАЛЬНАЯ ПРОВЕРКА                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ИНФРАСТРУКТУРА:                                                        │
│  □ docker-compose up запускает все сервисы                              │
│  □ PostgreSQL с PostGIS работает                                        │
│  □ Redis работает                                                       │
│  □ Backend отвечает на /health                                          │
│  □ Frontend открывается на :3000                                        │
│                                                                         │
│  ДАННЫЕ:                                                                │
│  □ XML-фид распарсен (12000+ квартир в БД)                              │
│  □ ЖК созданы и связаны с квартирами                                    │
│  □ Районы и метро заполнены                                             │
│                                                                         │
│  ФУНКЦИОНАЛ ДЛЯ ПОЛЬЗОВАТЕЛЯ:                                           │
│  □ Главная страница открывается                                         │
│  □ Список квартир с пагинацией                                          │
│  □ Фильтры работают (комнаты, цена, площадь, район, отделка)            │
│  □ Сортировка работает                                                  │
│  □ Карточка квартиры с галереей                                         │
│                                                                         │
│  ФУНКЦИОНАЛ ДЛЯ АГЕНТА:                                                 │
│  □ Регистрация и вход работают                                          │
│  □ ЛК с подборками                                                      │
│  □ Создание подборки                                                    │
│  □ Добавление квартир в подборку                                        │
│  □ Публичная ссылка для клиента                                         │
│  □ Заявка на бронирование                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Статистика

| Метрика          | Значение   |
| ---------------- | ---------- |
| Всего фич        | 10         |
| Всего саб-тасков | ~60        |
| Коммитов         | ~40-50     |
| Время разработки | 3-4 недели |

### Следующие шаги

После завершения Этапа 1 переходи к:

- **DECOMPOSITION.md** — секция "Этап 2: Интеграция Yandex GPT"
- Там будет создан PHASE_2_PLAN.md с детальными задачами

---

**Дата создания:** 2024-11-29
**Версия:** 1.0
