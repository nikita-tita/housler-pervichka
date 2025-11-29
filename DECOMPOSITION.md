# Декомпозиция разработки Housler Pervichka

## Принцип декомпозиции

Разработка разбита на этапы по **источникам данных**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ЭТАПЫ ПО ДОСТУПНОСТИ ДАННЫХ                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ЭТАП 0: Инфраструктура                                                │
│  ──────────────────────────────────────────────────────────────────    │
│  Источник: Ничего (настройка окружения)                                │
│  Ресурсы: Git, Docker, VPS                                             │
│                                                                         │
│  ЭТАП 1: Только XML-фид                                                │
│  ──────────────────────────────────────────────────────────────────    │
│  Источник: спб_.xml (12K объектов)                                     │
│  Ресурсы: + PostgreSQL, Redis, Node.js                                 │
│                                                                         │
│  ЭТАП 2: + Yandex GPT API                                              │
│  ──────────────────────────────────────────────────────────────────    │
│  Источник: Фид + AI для анализа/извлечения                             │
│  Ресурсы: + Yandex GPT API                                             │
│                                                                         │
│  ЭТАП 3: + Бесплатные публичные API                                    │
│  ──────────────────────────────────────────────────────────────────    │
│  Источник: Yandex Maps, OpenStreetMap, DaData (free tier)              │
│  Ресурсы: + Бесплатные API-ключи                                       │
│                                                                         │
│  ЭТАП 4: + Ручной сбор данных                                          │
│  ──────────────────────────────────────────────────────────────────    │
│  Источник: Парсинг сайтов, ручной ввод оператором                      │
│  Ресурсы: + Время оператора, простые скрипты                           │
│                                                                         │
│  ЭТАП 5: + Партнёрские API                                             │
│  ──────────────────────────────────────────────────────────────────    │
│  Источник: API банков, застройщиков                                    │
│  Ресурсы: + Договоры с партнёрами                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ЭТАП 0: Инфраструктура (1 неделя)

### Цель
Развернуть базовое окружение для разработки и деплоя.

### Доступные ресурсы
- Git (GitHub/GitLab)
- Docker + Docker Compose
- VPS (небольшой сервер)

### Задачи

#### 0.1 Репозиторий и структура проекта
```
housler-pervichka/
├── docker-compose.yml          # Оркестрация контейнеров
├── docker-compose.prod.yml     # Продакшн конфигурация
├── .env.example                # Пример переменных окружения
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts            # Entry point
│       ├── config/             # Конфигурация
│       ├── api/                # REST API
│       ├── services/           # Бизнес-логика
│       ├── models/             # TypeORM entities
│       ├── parsers/            # XML парсеры
│       ├── jobs/               # Фоновые задачи
│       └── utils/              # Утилиты
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app/                # Next.js App Router
│       ├── components/         # React компоненты
│       ├── services/           # API клиент
│       └── stores/             # Zustand stores
│
├── database/
│   ├── migrations/             # SQL миграции
│   ├── seeds/                  # Начальные данные
│   └── schema.sql              # Полная схема
│
├── nginx/
│   └── nginx.conf              # Конфиг reverse proxy
│
└── scripts/
    ├── deploy.sh               # Деплой скрипт
    ├── backup.sh               # Бэкап БД
    └── import-feed.sh          # Импорт фида
```

#### 0.2 Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: housler
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/housler
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
    volumes:
      - ./backend/src:/app/src
      - ./feeds:/app/feeds        # Папка с XML фидами
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    volumes:
      - ./frontend/src:/app/src
    ports:
      - "3000:3000"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

#### 0.3 CI/CD (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/housler
            git pull origin main
            docker-compose -f docker-compose.prod.yml up -d --build
```

### Результат этапа 0
- [ ] Репозиторий создан и настроен
- [ ] Docker Compose запускается локально
- [ ] База данных PostgreSQL + PostGIS работает
- [ ] Redis работает
- [ ] Базовый backend (Express + TypeScript) отвечает на `/health`
- [ ] Базовый frontend (Next.js) показывает заглушку
- [ ] CI/CD деплоит на VPS

---

## ЭТАП 1: Только XML-фид (3-4 недели)

### Цель
Создать рабочий MVP используя только данные из XML-фида.

### Источник данных
```
спб_.xml — 12,020 объектов, 67.8 МБ
├── Базовая информация: тип, категория, комнаты, площадь, цена
├── Местоположение: адрес, координаты, метро
├── Характеристики: этаж, отделка, балкон, санузел
├── Здание: название ЖК, тип дома, год сдачи
├── Изображения: план, фото дома, поэтажный план
└── Контакты: телефон, email, организация
```

### Что МОЖНО сделать с фидом

| Функция | Источник в фиде | Примечание |
|---------|-----------------|------------|
| Поиск по комнатам | `<rooms>` | Напрямую |
| Поиск по цене | `<price>` | Напрямую |
| Поиск по площади | `<area>`, `<living-space>`, `<kitchen-space>` | Напрямую |
| Поиск по этажу | `<floor>`, `<floors-total>` | Напрямую |
| Поиск по району | `<location><district>` | Напрямую |
| Поиск по метро | `<metro><name>` | Напрямую |
| Поиск по ЖК | `<building-name>` | Напрямую |
| Поиск по застройщику | `<sales-agent><organization>` | Приблизительно |
| Поиск по отделке | `<renovation>` | Напрямую |
| Поиск по сроку сдачи | `<built-year>`, `<ready-quarter>`, `<building-state>` | Напрямую |
| Планировки | `<image tag="plan">` | Напрямую |
| Фото ЖК | `<image tag="housemain">` | Напрямую |
| Поэтажные планы | `<image tag="floorplan">` | Напрямую |
| Координаты на карте | `<latitude>`, `<longitude>` | Напрямую |

### Что НЕЛЬЗЯ сделать только с фидом

| Функция | Почему нельзя | Когда добавим |
|---------|---------------|---------------|
| Евро-планировки (1Е, 2Е) | Нет явного поля, нужен анализ площадей | Этап 1 (эвристика) |
| Тип сделки (ДДУ/уступка) | Нет в фиде | Этап 2 (GPT из описания) |
| Эскроу | Нет в фиде | Этап 4 (ручной сбор) |
| Апартаменты/квартира | Нет явного поля | Этап 2 (GPT из описания) |
| Регион прописки | Нет в фиде | Этап 3 (геокодер) |
| Ипотечные программы | Нет в фиде | Этап 5 (API банков) |
| Рассрочка | Нет в фиде | Этап 4 (ручной сбор) |
| Акции застройщиков | Нет в фиде | Этап 4 (ручной сбор) |
| Динамика цен | Нужна история | Этап 1 (накопление) |

### Задачи этапа 1

#### 1.1 Парсер XML-фида (5 дней)

```typescript
// backend/src/parsers/yandex-feed.parser.ts

interface ParsedOffer {
  externalId: string;           // internal-id

  // Базовое
  type: string;                 // продажа
  propertyType: string;         // жилая
  category: string;             // квартира

  // Квартира
  rooms: number;
  isStudio: boolean;
  areaTotal: number;
  areaLiving: number | null;
  areaKitchen: number | null;
  floor: number;
  floorsTotal: number;
  renovation: string | null;
  balcony: string | null;
  bathroomUnit: string | null;

  // Цена
  price: number;
  currency: string;
  mortgage: boolean;

  // Здание
  buildingName: string;         // ЖК
  buildingType: string | null;
  buildingState: string;        // unfinished / hand-over
  builtYear: number | null;
  readyQuarter: number | null;

  // Местоположение
  address: string;
  district: string | null;
  latitude: number;
  longitude: number;
  metroName: string | null;
  metroTimeOnFoot: number | null;

  // Контакты
  salesAgentPhone: string | null;
  salesAgentEmail: string | null;
  salesAgentOrganization: string | null;

  // Описание
  description: string | null;

  // Изображения
  images: {
    tag: string | null;
    url: string;
  }[];

  // Мета
  creationDate: Date | null;
  lastUpdateDate: Date | null;
}

async function parseYandexFeed(filePath: string): Promise<ParsedOffer[]> {
  // Используем sax-js для потокового парсинга (экономия памяти)
  const parser = sax.createStream(true, { trim: true });
  const offers: ParsedOffer[] = [];

  // ... реализация

  return offers;
}
```

**Особенности парсинга:**
- Потоковый парсинг (sax-js) — файл 68 МБ не влезет в память целиком
- Валидация данных (zod)
- Нормализация (trim, lowercase где нужно)
- Обработка ошибок (некорректные данные пропускаем с логированием)

#### 1.2 Импорт в базу данных (3 дня)

```typescript
// backend/src/services/import.service.ts

class ImportService {
  async importFeed(filePath: string): Promise<ImportResult> {
    const startTime = Date.now();
    const parsedOffers = await parseYandexFeed(filePath);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Batch upsert для производительности
    for (const batch of chunk(parsedOffers, 100)) {
      const result = await this.upsertBatch(batch);
      created += result.created;
      updated += result.updated;
      errors += result.errors;
    }

    // Помечаем удалённые (те, что были в БД, но нет в фиде)
    const deletedCount = await this.markDeleted(parsedOffers.map(o => o.externalId));

    // Обновляем счётчики в complexes
    await this.updateComplexCounters();

    // Обновляем материализованное представление
    await this.refreshOfferCounts();

    return {
      totalInFeed: parsedOffers.length,
      created,
      updated,
      deleted: deletedCount,
      errors,
      durationMs: Date.now() - startTime,
    };
  }

  private async upsertBatch(offers: ParsedOffer[]): Promise<BatchResult> {
    // 1. Upsert districts
    // 2. Upsert metro_stations
    // 3. Upsert developers (из sales_agent.organization)
    // 4. Upsert complexes (из building_name)
    // 5. Upsert buildings
    // 6. Upsert offers
    // 7. Upsert images
  }
}
```

**Логика импорта:**
1. **Первый импорт** — создаём все записи
2. **Повторные импорты** — обновляем существующие, добавляем новые
3. **Удалённые объекты** — помечаем `is_active = false`, `deleted_at = NOW()`
4. **История цен** — автоматически через триггер при изменении price

#### 1.3 Определение евро-планировок (эвристика) (1 день)

```typescript
// backend/src/utils/euro-layout-detector.ts

interface EuroLayoutResult {
  isEuro: boolean;
  roomType: RoomType;
  confidence: number;  // 0-1
  reason: string;
}

function detectEuroLayout(offer: {
  rooms: number;
  areaTotal: number;
  areaLiving: number | null;
  areaKitchen: number | null;
  description: string | null;
}): EuroLayoutResult {

  // Эвристика 1: По площади кухни
  // Евро: кухня > 12 м² (кухня-гостиная)
  if (offer.areaKitchen && offer.areaKitchen > 12) {
    // Дополнительно проверяем соотношение
    if (offer.areaLiving && offer.areaKitchen / offer.areaLiving > 0.5) {
      return {
        isEuro: true,
        roomType: getRoomTypeEuro(offer.rooms),
        confidence: 0.8,
        reason: 'Большая кухня (>12 м²) + высокое соотношение кухня/жилая',
      };
    }
  }

  // Эвристика 2: По описанию (если есть)
  if (offer.description) {
    const euroKeywords = [
      'евро', 'euro', 'кухня-гостиная', 'кухня гостиная',
      'европланировка', 'евро-планировка', 'объединённая кухня',
    ];
    const descLower = offer.description.toLowerCase();
    if (euroKeywords.some(kw => descLower.includes(kw))) {
      return {
        isEuro: true,
        roomType: getRoomTypeEuro(offer.rooms),
        confidence: 0.9,
        reason: 'Ключевое слово в описании',
      };
    }
  }

  // Эвристика 3: По соотношению общая/жилая площадь
  // Евро обычно имеет меньше жилой площади (часть ушла в кухню-гостиную)
  if (offer.areaLiving && offer.areaTotal) {
    const livingRatio = offer.areaLiving / offer.areaTotal;
    // Для обычной квартиры: жилая ~55-65% от общей
    // Для евро: жилая ~40-50% от общей
    if (livingRatio < 0.5 && offer.rooms > 0) {
      return {
        isEuro: true,
        roomType: getRoomTypeEuro(offer.rooms),
        confidence: 0.6,
        reason: 'Низкое соотношение жилая/общая площадь',
      };
    }
  }

  return {
    isEuro: false,
    roomType: getRoomTypeStandard(offer.rooms),
    confidence: 0.7,
    reason: 'Не соответствует критериям евро-планировки',
  };
}

function getRoomTypeEuro(rooms: number): RoomType {
  switch (rooms) {
    case 0: return 'studio';
    case 1: return 'euro_1';
    case 2: return 'euro_2';
    case 3: return 'euro_3';
    default: return 'room_4_plus';
  }
}

function getRoomTypeStandard(rooms: number): RoomType {
  switch (rooms) {
    case 0: return 'studio';
    case 1: return 'room_1';
    case 2: return 'room_2';
    case 3: return 'room_3';
    default: return 'room_4_plus';
  }
}
```

#### 1.4 REST API (5 дней)

```typescript
// Основные эндпоинты

// Поиск объектов
GET /api/v1/offers
  ?rooms=1,2,1E,2E           // Комнатность (включая евро)
  &price_min=5000000
  &price_max=10000000
  &area_min=30
  &area_max=60
  &district_id=1,2,3
  &metro_id=5,6
  &metro_time_max=15
  &floor_min=2
  &floor_not_last=true
  &renovation=чистовая,под ключ
  &building_state=hand-over
  &complex_id=123
  &sort=price_asc
  &page=1
  &per_page=20

// Детали объекта
GET /api/v1/offers/:id

// Подсчёт результатов (быстрый)
GET /api/v1/offers/count
  ?rooms=1,2
  &price_max=10000000

// Поисковые подсказки
GET /api/v1/search/suggestions?q=нев

// Список ЖК
GET /api/v1/complexes
  ?district_id=1
  &building_state=hand-over

// Детали ЖК
GET /api/v1/complexes/:id

// Справочники
GET /api/v1/dictionaries/districts
GET /api/v1/dictionaries/metro
GET /api/v1/dictionaries/renovations
GET /api/v1/dictionaries/building-types
```

#### 1.5 Frontend — базовый поиск (5 дней)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HOUSLER                                     [Войти] [Регистрация]      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔍 [___Район, метро, ЖК, застройщик..._____________] [Искать]         │
│                                                                         │
│  ┌─ Комнатность ─┐  ┌─ Цена, ₽ ───────┐  ┌─ Площадь, м² ─┐            │
│  │ [С][1][1Е][2] │  │ [от___] [до___] │  │ [от__] [до__] │            │
│  │ [2Е][3][3Е][4+]│  └─────────────────┘  └───────────────┘            │
│  └───────────────┘                                                      │
│                                                                         │
│  ┌─ Срок сдачи ──────────┐  ┌─ Район ──────┐  ┌─ Метро ──────┐        │
│  │ [Сдан][2025][2026][>] │  │ [Выбрать ▼]  │  │ [Выбрать ▼]  │        │
│  └───────────────────────┘  └──────────────┘  └──────────────┘        │
│                                                                         │
│  [Все фильтры ▼]                                                       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🔍 12 458 квартир в 287 ЖК                              [▶]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Сортировка: [По цене ▼]              Вид: [≡ Список] [⊞ Плитка]      │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ┌──────────┐                                                      │  │
│  │ │ [План]   │  ЖК "Новатория" · Невский район                     │  │
│  │ │          │  2-комн. евро · 52.3 м² · этаж 12/25                │  │
│  │ │          │  Отделка: под ключ · Сдача: Q2 2026                 │  │
│  │ │          │  м. Пр. Большевиков · 10 мин пешком                  │  │
│  │ └──────────┘  ───────────────────────────────────────────────────│  │
│  │               💰 9 200 000 ₽   (175 910 ₽/м²)                    │  │
│  │               [❤️ В избранное] [📋 В подборку] [Подробнее →]     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [... ещё карточки ...]                                                │
│                                                                         │
│  [← Назад] [1] [2] [3] ... [50] [Далее →]                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 1.6 Frontend — карточка объекта (3 дня)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Назад к результатам                                    [❤️] [📤]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ЖК "Новатория"                                          ID: #12345   │
│  2-комнатная квартира (евро)                                           │
│                                                                         │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────┐ │
│  │                                 │  │                              │ │
│  │        ПЛАНИРОВКА               │  │  💰 9 200 000 ₽              │ │
│  │        (изображение)            │  │     175 910 ₽/м²             │ │
│  │                                 │  │                              │ │
│  │   [◀] 1/3 [▶]                  │  │  ────────────────────────    │ │
│  │   [План] [Дом] [Этаж]          │  │                              │ │
│  │                                 │  │  Ипотека от ~46 500 ₽/мес   │ │
│  │                                 │  │  (расчёт при 20%, 30 лет)   │ │
│  └─────────────────────────────────┘  │                              │ │
│                                       │  [🧮 Ипотечный калькулятор]  │ │
│  ХАРАКТЕРИСТИКИ                       │                              │ │
│  ─────────────────────────────────    │  ────────────────────────    │ │
│  Комнат:        2 (евро)              │                              │ │
│  Площадь:       52.3 м²               │  [📞 Забронировать]          │ │
│  Жилая:         28.7 м²               │  [📋 Добавить в подборку]    │ │
│  Кухня-гост.:   18.2 м²               │                              │ │
│  Этаж:          12 из 25              └──────────────────────────────┘ │
│  Отделка:       Под ключ                                               │
│  Балкон:        Лоджия                                                 │
│  Санузел:       Раздельный                                             │
│                                                                         │
│  РАСПОЛОЖЕНИЕ                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│  Адрес:         Невский р-н, ул. Коллонтай, д.6                       │
│  Метро:         Проспект Большевиков (10 мин пешком)                   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         КАРТА                                    │   │
│  │                    (Yandex Maps embed)                           │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  О ЖИЛОМ КОМПЛЕКСЕ                                                     │
│  ─────────────────────────────────────────────────────────────────────  │
│  Застройщик:    [организация из фида]                                 │
│  Тип дома:      Кирпично-монолитный                                   │
│  Этажность:     25 этажей                                             │
│  Срок сдачи:    Q2 2026 (строится)                                    │
│                                                                         │
│  ОПИСАНИЕ                                                              │
│  ─────────────────────────────────────────────────────────────────────  │
│  [Текст описания из фида...]                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 1.7 Ипотечный калькулятор (простой) (1 день)

```typescript
// frontend/src/utils/mortgage-calculator.ts

interface MortgageInput {
  price: number;              // Стоимость квартиры
  downPaymentPercent: number; // Первый взнос (%)
  termYears: number;          // Срок (лет)
  annualRate: number;         // Годовая ставка (%)
}

interface MortgageResult {
  loanAmount: number;         // Сумма кредита
  monthlyPayment: number;     // Ежемесячный платёж
  totalPayment: number;       // Общая сумма выплат
  overpayment: number;        // Переплата
  overpaymentPercent: number; // Переплата в %
}

function calculateMortgage(input: MortgageInput): MortgageResult {
  const downPayment = input.price * (input.downPaymentPercent / 100);
  const loanAmount = input.price - downPayment;
  const monthlyRate = input.annualRate / 100 / 12;
  const termMonths = input.termYears * 12;

  // Формула аннуитетного платежа
  const monthlyPayment = loanAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  const totalPayment = monthlyPayment * termMonths;
  const overpayment = totalPayment - loanAmount;

  return {
    loanAmount,
    monthlyPayment: Math.round(monthlyPayment),
    totalPayment: Math.round(totalPayment),
    overpayment: Math.round(overpayment),
    overpaymentPercent: Math.round((overpayment / loanAmount) * 100),
  };
}
```

**На этапе 1 — фиксированные ставки:**
- Базовая: 18% (рыночная)
- Семейная: 6% (льготная, для информации)
- IT: 5% (льготная, для информации)

#### 1.8 Авторизация и личный кабинет (3 дня)

```typescript
// Простая авторизация по email + код

POST /api/v1/auth/request-code
  { email: "agent@mail.ru" }
  → Отправляем 6-значный код на email

POST /api/v1/auth/verify-code
  { email: "agent@mail.ru", code: "123456" }
  → { token: "jwt...", user: {...} }

// Роли
- agent: Агент (риэлтор)
- client: Клиент (по ссылке от агента)
- operator: Оператор платформы
```

#### 1.9 Подборки (базовые) (3 дня)

```typescript
// Агент создаёт подборку
POST /api/v1/selections
  { name: "Для Петрова", clientEmail: "petrov@mail.ru" }
  → { id: "sel_123", shareLink: "https://housler.ru/s/abc123" }

// Агент добавляет объекты
POST /api/v1/selections/:id/items
  { offerId: 12345, comment: "Отличный вид из окна" }

// Клиент открывает по ссылке (без регистрации)
GET /api/v1/selections/shared/:shareCode
  → { selection: {...}, items: [...] }

// Клиент добавляет свою находку
POST /api/v1/selections/shared/:shareCode/finds
  { offerId: 67890, comment: "Нашёл сам, посмотрите" }
```

#### 1.10 Избранное (1 день)

```typescript
// Добавить в избранное
POST /api/v1/favorites
  { offerId: 12345 }

// Список избранного
GET /api/v1/favorites

// Удалить из избранного
DELETE /api/v1/favorites/:offerId
```

#### 1.11 Бронирование (базовое) (2 дня)

```typescript
// Агент создаёт заявку на бронь
POST /api/v1/bookings
  {
    offerId: 12345,
    selectionId: "sel_123",  // Опционально
    clientName: "Петров Иван",
    clientPhone: "+79991234567",
    clientEmail: "petrov@mail.ru",
    comment: "Клиент готов выйти на сделку"
  }
  → { id: "book_456", status: "pending" }

// Оператор видит заявки
GET /api/v1/operator/bookings
  ?status=pending

// Оператор обрабатывает
PATCH /api/v1/operator/bookings/:id
  { status: "confirmed", operatorComment: "Бронь подтверждена застройщиком" }
```

#### 1.12 Cron-задачи (1 день)

```typescript
// backend/src/jobs/cron.ts

// Импорт фида каждые 4 часа
cron.schedule('0 */4 * * *', async () => {
  await importService.importFeed('/app/feeds/spb_.xml');
});

// Обновление материализованного представления каждые 5 минут
cron.schedule('*/5 * * * *', async () => {
  await db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY offer_counts');
});

// Обновление поисковых подсказок каждый час
cron.schedule('0 * * * *', async () => {
  await searchService.updateSuggestions();
});
```

### Результат этапа 1

**Готовый MVP с функциями:**
- [ ] Поиск квартир по 10+ фильтрам
- [ ] Комнатность с евро-форматами (эвристика)
- [ ] Умная строка поиска с подсказками
- [ ] Счётчик результатов
- [ ] Карточка объекта с планировкой
- [ ] Простой ипотечный калькулятор
- [ ] Карта (embed Yandex Maps)
- [ ] Авторизация агентов
- [ ] Подборки для клиентов
- [ ] Избранное
- [ ] Базовое бронирование
- [ ] Автоимпорт фида каждые 4 часа
- [ ] Накопление истории цен

**Чего НЕТ на этапе 1:**
- Юридические фильтры (ДДУ, эскроу, апартаменты)
- Банки-партнёры
- Рассрочка, акции
- PDF-экспорт
- Динамика цен (пока только накапливаем)
- Точное определение евро-планировок

---

## ЭТАП 2: + Yandex GPT API (2 недели)

### Цель
Использовать AI для извлечения информации из описаний и улучшения данных.

### Доступные ресурсы
- Yandex GPT API (платный, но недорогой)
- ~10₽ за 1000 токенов (примерно)

### Что можно извлечь из описания с помощью GPT

```
Пример описания из фида:
─────────────────────────────────────────────────────────────────────────
"Продаётся 2-комнатная квартира в строящемся ЖК «Новатория» от застройщика
Setl City по договору долевого участия (ДДУ). Эскроу-счёт. Квартира с
европланировкой: просторная кухня-гостиная 18 м² и отдельная спальня.
Чистовая отделка «под ключ». Возможна ипотека от Сбербанка по ставке 6%,
рассрочка до конца строительства. Скидка 3% при 100% оплате."
─────────────────────────────────────────────────────────────────────────

GPT может извлечь:
✅ Тип сделки: ДДУ
✅ Эскроу: Да
✅ Евро-планировка: Да (подтверждение)
✅ Застройщик: Setl City
✅ Банк-партнёр: Сбербанк
✅ Ипотечная ставка: 6%
✅ Рассрочка: Да, до конца строительства
✅ Скидка: 3% при 100% оплате
```

### Задачи этапа 2

#### 2.1 Интеграция с Yandex GPT API (2 дня)

```typescript
// backend/src/services/yandex-gpt.service.ts

interface YandexGPTConfig {
  folderId: string;
  apiKey: string;
  model: 'yandexgpt-lite' | 'yandexgpt'; // lite дешевле
}

class YandexGPTService {
  private config: YandexGPTConfig;

  async extractOfferInfo(description: string): Promise<ExtractedInfo> {
    const prompt = `
Проанализируй описание квартиры и извлеки информацию в JSON формате.
Если информация отсутствует, укажи null.

Описание:
"""
${description}
"""

Верни JSON:
{
  "deal_type": "ddu" | "assignment_legal" | "assignment_individual" | null,
  "has_escrow": true | false | null,
  "is_apartment": true | false | null,
  "is_euro_layout": true | false | null,
  "developer_name": "string" | null,
  "bank_partners": ["string"] | null,
  "mortgage_rate": number | null,
  "has_installment": true | false | null,
  "installment_terms": "string" | null,
  "discount_percent": number | null,
  "discount_conditions": "string" | null
}
`;

    const response = await this.callAPI(prompt);
    return this.parseResponse(response);
  }

  private async callAPI(prompt: string): Promise<string> {
    const response = await fetch(
      'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
      {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelUri: `gpt://${this.config.folderId}/yandexgpt-lite`,
          completionOptions: {
            temperature: 0.1,  // Низкая для точности
            maxTokens: 500,
          },
          messages: [
            { role: 'user', text: prompt },
          ],
        }),
      }
    );

    const data = await response.json();
    return data.result.alternatives[0].message.text;
  }
}
```

#### 2.2 Batch-обработка описаний (3 дня)

```typescript
// backend/src/jobs/enrich-offers.job.ts

class EnrichOffersJob {
  // Обрабатываем по 100 объектов за раз (экономия API)
  async run() {
    const offers = await db.query(`
      SELECT id, description
      FROM offers
      WHERE description IS NOT NULL
        AND gpt_processed_at IS NULL
        AND is_active = true
      LIMIT 100
    `);

    for (const offer of offers) {
      try {
        const extracted = await gptService.extractOfferInfo(offer.description);

        await db.query(`
          UPDATE offers SET
            deal_type = COALESCE($1, deal_type),
            has_escrow = COALESCE($2, has_escrow),
            is_apartment = COALESCE($3, is_apartment),
            is_euro_layout = COALESCE($4, is_euro_layout),
            gpt_extracted_data = $5,
            gpt_processed_at = NOW()
          WHERE id = $6
        `, [
          extracted.deal_type,
          extracted.has_escrow,
          extracted.is_apartment,
          extracted.is_euro_layout,
          JSON.stringify(extracted),
          offer.id,
        ]);

        // Rate limiting
        await sleep(200);

      } catch (error) {
        logger.error(`GPT extraction failed for offer ${offer.id}`, error);
      }
    }
  }
}

// Запускаем каждый час (обрабатываем ~2400 объектов в день)
cron.schedule('0 * * * *', () => enrichOffersJob.run());
```

**Оценка затрат:**
- 12,000 объектов × ~500 токенов = 6M токенов
- 6M / 1000 × 10₽ = ~60,000₽ на первичную обработку
- Дальше только новые объекты (~100-500/день) = ~500-2500₽/месяц

#### 2.3 Юридические фильтры (на основе GPT) (2 дня)

```typescript
// Добавляем фильтры в API

GET /api/v1/offers
  &deal_type=ddu,assignment_legal   // Тип сделки
  &has_escrow=true                  // Только с эскроу
  &is_apartment=false               // Исключить апартаменты

// UI: добавляем чекбоксы в "Все фильтры"
```

#### 2.4 Улучшенное определение евро-планировок (1 день)

```typescript
// Комбинируем эвристику + GPT

function detectEuroLayoutCombined(offer: Offer): EuroLayoutResult {
  const heuristicResult = detectEuroLayoutHeuristic(offer);

  // Если GPT уже обработал — используем его данные
  if (offer.gptExtractedData?.is_euro_layout !== null) {
    return {
      isEuro: offer.gptExtractedData.is_euro_layout,
      roomType: offer.gptExtractedData.is_euro_layout
        ? getRoomTypeEuro(offer.rooms)
        : getRoomTypeStandard(offer.rooms),
      confidence: 0.95,
      reason: 'GPT extraction',
    };
  }

  return heuristicResult;
}
```

#### 2.5 AI-ассистент поиска (NLP) (3 дня)

```typescript
// Пользователь вводит текстовый запрос

GET /api/v1/search/nlp?q=двушка+до+10+миллионов+рядом+с+метро+сданная

// Backend отправляет в GPT
const prompt = `
Преобразуй запрос пользователя в параметры поиска квартиры.

Запрос: "${query}"

Возможные параметры:
- rooms: массив [0,1,2,3,4] где 0=студия
- price_min, price_max: число в рублях
- area_min, area_max: число в м²
- metro_time_max: минуты пешком до метро
- building_state: "hand-over" (сдан) или "unfinished" (строится)
- district: название района
- renovation: тип отделки

Верни JSON с параметрами.
`;

// GPT возвращает:
{
  "rooms": [2],
  "price_max": 10000000,
  "metro_time_max": 15,
  "building_state": "hand-over"
}
```

**UI:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  🤖 [Найти двушку до 10 млн рядом с метро в сданном доме___] [Искать]  │
│                                                                         │
│  Распознано:                                                            │
│  • Комнат: 2                                                           │
│  • Цена: до 10 000 000 ₽                                               │
│  • До метро: ≤15 мин                                                   │
│  • Сдан: Да                                                            │
│                                                                         │
│  [Применить фильтры] [Изменить]                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Результат этапа 2

**Добавлено:**
- [ ] Юридические данные из описаний (тип сделки, эскроу, апартаменты)
- [ ] Фильтры по юридическим параметрам
- [ ] Улучшенное определение евро-планировок
- [ ] AI-ассистент поиска (NLP)
- [ ] Извлечение информации о банках, рассрочке, скидках (пока для будущего)

---

## ЭТАП 3: + Бесплатные публичные API (2 недели)

### Цель
Обогатить данные бесплатными внешними источниками.

### Доступные бесплатные API

| API | Лимит | Что даёт |
|-----|-------|----------|
| **Yandex Maps JavaScript API** | Бесплатно до 25K показов/день | Карты, маршруты |
| **Yandex Geocoder** | 25K запросов/день | Координаты → адрес, район |
| **OpenStreetMap / Nominatim** | 1 запрос/сек | Альтернативный геокодер |
| **DaData (free tier)** | 10K запросов/день | Подсказки по адресам, стандартизация |
| **ЦБ РФ API** | Без лимита | Ключевая ставка (для калькулятора) |

### Задачи этапа 3

#### 3.1 Yandex Maps — интерактивная карта (3 дня)

```typescript
// frontend/src/components/map/OffersMap.tsx

import { YMaps, Map, Clusterer, Placemark } from '@pbe/react-yandex-maps';

function OffersMap({ offers, onOfferClick }) {
  return (
    <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY }}>
      <Map
        defaultState={{ center: [59.9343, 30.3351], zoom: 11 }}
        width="100%"
        height="600px"
      >
        <Clusterer
          options={{
            preset: 'islands#invertedVioletClusterIcons',
            groupByCoordinates: false,
          }}
        >
          {offers.map(offer => (
            <Placemark
              key={offer.id}
              geometry={[offer.latitude, offer.longitude]}
              properties={{
                balloonContent: `
                  <div>
                    <strong>${offer.rooms}-комн. ${offer.areaTotal} м²</strong><br/>
                    ${formatPrice(offer.price)}<br/>
                    ${offer.complexName}
                  </div>
                `,
              }}
              onClick={() => onOfferClick(offer)}
            />
          ))}
        </Clusterer>
      </Map>
    </YMaps>
  );
}
```

#### 3.2 Определение региона прописки (2 дня)

```typescript
// backend/src/services/geocoder.service.ts

class GeocoderService {
  // Определяем регион по координатам
  async getRegion(lat: number, lng: number): Promise<'spb' | 'leningrad_oblast'> {
    // Границы Санкт-Петербурга (упрощённые)
    const spbBounds = {
      north: 60.1,
      south: 59.7,
      west: 29.4,
      east: 30.8,
    };

    // Простая проверка по границам
    if (
      lat >= spbBounds.south && lat <= spbBounds.north &&
      lng >= spbBounds.west && lng <= spbBounds.east
    ) {
      // Дополнительно проверяем через Yandex Geocoder
      const address = await this.reverseGeocode(lat, lng);
      if (address.includes('Санкт-Петербург')) {
        return 'spb';
      }
    }

    return 'leningrad_oblast';
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${API_KEY}&geocode=${lng},${lat}&format=json`
    );
    const data = await response.json();
    return data.response.GeoObjectCollection.featureMember[0]
      ?.GeoObject.metaDataProperty.GeocoderMetaData.text || '';
  }
}

// Job для обновления региона
cron.schedule('0 3 * * *', async () => {
  const offers = await db.query(`
    SELECT id, latitude, longitude
    FROM offers
    WHERE registration_region IS NULL AND is_active = true
    LIMIT 1000
  `);

  for (const offer of offers) {
    const region = await geocoderService.getRegion(offer.latitude, offer.longitude);
    await db.query(
      'UPDATE offers SET registration_region = $1 WHERE id = $2',
      [region, offer.id]
    );
    await sleep(50); // Rate limiting
  }
});
```

#### 3.3 DaData — улучшение адресов (2 дня)

```typescript
// backend/src/services/dadata.service.ts

class DaDataService {
  // Стандартизация адреса
  async standardizeAddress(address: string): Promise<StandardizedAddress> {
    const response = await fetch(
      'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: address,
          count: 1,
        }),
      }
    );

    const data = await response.json();
    const suggestion = data.suggestions[0];

    return {
      fullAddress: suggestion.value,
      region: suggestion.data.region,
      city: suggestion.data.city,
      district: suggestion.data.city_district,
      street: suggestion.data.street,
      house: suggestion.data.house,
      flat: suggestion.data.flat,
      postalCode: suggestion.data.postal_code,
      fiasId: suggestion.data.fias_id,
    };
  }

  // Подсказки для поиска по адресу
  async getSuggestions(query: string): Promise<AddressSuggestion[]> {
    // Используем для автодополнения в строке поиска
  }
}
```

#### 3.4 ЦБ РФ — актуальная ключевая ставка (1 день)

```typescript
// backend/src/services/cbr.service.ts

class CBRService {
  private cachedRate: { value: number; date: Date } | null = null;

  async getKeyRate(): Promise<number> {
    // Кэшируем на 24 часа
    if (this.cachedRate && Date.now() - this.cachedRate.date.getTime() < 86400000) {
      return this.cachedRate.value;
    }

    const response = await fetch(
      'https://www.cbr.ru/scripts/XML_daily.asp'
    );
    const xml = await response.text();
    // Парсим XML и извлекаем ключевую ставку
    // На самом деле ключевая ставка на другом endpoint:
    // https://www.cbr.ru/hd_base/KeyRate/

    const rate = 16; // Заглушка, нужен реальный парсинг
    this.cachedRate = { value: rate, date: new Date() };
    return rate;
  }
}

// Используем для калькулятора
const baseRate = await cbrService.getKeyRate();
const mortgageRate = baseRate + 2; // Банки обычно +2-4%
```

#### 3.5 Фильтр по региону прописки (1 день)

```typescript
GET /api/v1/offers
  &registration_region=spb        // Только СПб прописка

// UI
┌─ Прописка ───────────────┐
│ ○ Любая                  │
│ ○ Санкт-Петербург        │
│ ○ Ленинградская область  │
└──────────────────────────┘
```

#### 3.6 Улучшенная карта с маршрутами (2 дня)

```typescript
// Показываем время до метро на карте
// Используем Yandex Maps Router API

function showRouteToMetro(offerCoords, metroCoords) {
  ymaps.route([offerCoords, metroCoords], {
    routingMode: 'pedestrian',
  }).then(route => {
    const time = route.getTime() / 60; // минуты
    // Показываем на карте
  });
}
```

### Результат этапа 3

**Добавлено:**
- [ ] Интерактивная карта с кластеризацией
- [ ] Маршруты до метро на карте
- [ ] Определение региона прописки (СПб/ЛО)
- [ ] Фильтр по региону прописки
- [ ] Стандартизация адресов (DaData)
- [ ] Улучшенные подсказки по адресам
- [ ] Актуальная ключевая ставка ЦБ для калькулятора

---

## ЭТАП 4: + Ручной сбор данных (2-3 недели)

### Цель
Добавить данные, которые нельзя получить автоматически.

### Источники
- Парсинг сайтов застройщиков
- Ручной ввод оператором
- Справочники (Excel → БД)

### Задачи этапа 4

#### 4.1 Справочник банков (2 дня)

```typescript
// database/seeds/banks.sql

INSERT INTO banks (name, logo_url, website) VALUES
  ('Сбербанк', '/logos/sber.svg', 'https://sberbank.ru'),
  ('ВТБ', '/logos/vtb.svg', 'https://vtb.ru'),
  ('Альфа-Банк', '/logos/alfa.svg', 'https://alfabank.ru'),
  ('Газпромбанк', '/logos/gpb.svg', 'https://gazprombank.ru'),
  ('Россельхозбанк', '/logos/rshb.svg', 'https://rshb.ru'),
  ('ДОМ.РФ', '/logos/domrf.svg', 'https://domrf.ru'),
  -- ... ещё ~20 банков
;
```

#### 4.2 Справочник ипотечных программ (3 дня)

```typescript
// Оператор заполняет через админку

// POST /api/v1/operator/mortgage-programs
{
  bankId: 1,
  programName: "Семейная ипотека",
  interestRate: 6.0,
  minDownPayment: 20,
  maxLoanTerm: 360,
  requirements: {
    familyMortgage: true,
    minChildren: 1,
  },
  // ...
}

// UI для оператора
┌─────────────────────────────────────────────────────────────────────────┐
│  ДОБАВЛЕНИЕ ИПОТЕЧНОЙ ПРОГРАММЫ                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Банк:              [Сбербанк ▼]                                       │
│  Название:          [Семейная ипотека____________]                     │
│  Ставка (%):        [6.0___]                                           │
│  Мин. взнос (%):    [20____]                                           │
│  Макс. срок (лет):  [30____]                                           │
│                                                                         │
│  Требования:                                                            │
│  ☑ Семейная ипотека (есть дети)                                        │
│  ☐ IT-ипотека                                                          │
│  ☐ Военная ипотека                                                     │
│                                                                         │
│  [Сохранить]                                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.3 Аккредитации ЖК банками (3 дня)

```typescript
// Источники:
// 1. Парсинг сайтов застройщиков (раздел "Банки-партнёры")
// 2. Парсинг сайтов банков (раздел "Аккредитованные новостройки")
// 3. Ручной ввод

// Парсер сайта застройщика (пример)
async function parseSetlCityBanks(): Promise<BankAccreditation[]> {
  const response = await fetch('https://setlcity.ru/mortgage');
  const html = await response.text();
  const $ = cheerio.load(html);

  const banks: BankAccreditation[] = [];

  $('.bank-partner').each((i, el) => {
    banks.push({
      developerName: 'Setl City',
      bankName: $(el).find('.bank-name').text(),
      // ...
    });
  });

  return banks;
}

// После этого появляется фильтр
GET /api/v1/offers
  &bank_id=1    // Показать только ЖК, аккредитованные в Сбербанке
```

#### 4.4 Рассрочка от застройщиков (3 дня)

```typescript
// Оператор заполняет вручную или парсим сайты

// POST /api/v1/operator/installments
{
  developerId: 1,
  complexId: null,  // null = для всех ЖК застройщика
  installmentType: "interest_free",
  name: "Беспроцентная рассрочка до сдачи",
  minDownPayment: 30,
  interestRate: 0,
  durationUntilCompletion: true,
  // ...
}

// Появляется фильтр
GET /api/v1/offers
  &has_installment=true

// На карточке объекта
┌─── Рассрочка от застройщика ────────────────────────────────────┐
│  ✅ Доступна рассрочка                                          │
│  Первый взнос: от 30%                                           │
│  Срок: до сдачи дома (Q2 2026)                                  │
│  Условия: беспроцентная                                         │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.5 Акции застройщиков (3 дня)

```typescript
// POST /api/v1/operator/promotions
{
  developerId: 1,
  promotionType: "discount",
  title: "Скидка 5% при 100% оплате",
  discountPercent: 5,
  conditions: { paymentTypes: ["full"] },
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  complexIds: [123, 456],  // К каким ЖК применяется
}

// Появляется фильтр
GET /api/v1/offers
  &has_promotion=true

// На карточке объекта
┌─── 🎁 Акция ────────────────────────────────────────────────────┐
│  Скидка 5% при 100% оплате                                      │
│  Действует до: 31.12.2024                                       │
│  Экономия: ~460 000 ₽                                           │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.6 Документы застройщиков (2 дня)

```typescript
// Оператор загружает файлы
// POST /api/v1/operator/developer-files
// (multipart/form-data)

{
  developerId: 1,
  complexId: 123,
  fileType: "project_declaration",
  title: "Проектная декларация",
  file: <File>
}

// На карточке объекта
┌─── Документы ───────────────────────────────────────────────────┐
│  📄 Проектная декларация      [Скачать PDF]                    │
│  📄 Разрешение на строительство [Скачать PDF]                  │
│  📄 Шаблон ДДУ                [Скачать PDF]                    │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.7 Админка для оператора (5 дней)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HOUSLER ADMIN                              Оператор: Иванов И.И.      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [📋 Заявки]  [🏦 Банки]  [💰 Ипотека]  [📊 Рассрочка]  [🎁 Акции]     │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ИПОТЕЧНЫЕ ПРОГРАММЫ                                    [+ Добавить]   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Банк       │ Программа           │ Ставка │ Взнос │ Статус      │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Сбербанк   │ Базовая             │ 18%    │ 15%   │ ✅ Активна  │  │
│  │ Сбербанк   │ Семейная            │ 6%     │ 20%   │ ✅ Активна  │  │
│  │ ВТБ        │ Базовая             │ 17.5%  │ 15%   │ ✅ Активна  │  │
│  │ Альфа      │ IT-ипотека          │ 5%     │ 20%   │ ⚠️ Истекает │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [← Назад] [1] [2] [3] [Далее →]                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Результат этапа 4

**Добавлено:**
- [ ] Справочник банков с ипотечными программами
- [ ] Фильтр по банку-партнёру
- [ ] Все ипотечные программы на карточке объекта
- [ ] Информация о рассрочке
- [ ] Фильтр "Есть рассрочка"
- [ ] Акции застройщиков
- [ ] Фильтр "Есть акции"
- [ ] Документы застройщиков
- [ ] Админка для оператора

---

## ЭТАП 5: + Партнёрские API (2-4 недели)

### Цель
Интегрироваться с банками и застройщиками для получения актуальных данных.

### Потенциальные партнёры

| Партнёр | API | Что даёт | Сложность |
|---------|-----|----------|-----------|
| **Сбербанк** | DomClick API | Ипотечные программы, расчёт | Средняя |
| **ВТБ** | API ипотеки | Программы, онлайн-заявка | Средняя |
| **ДОМ.РФ** | API | Все ипотечные программы | Низкая |
| **Застройщики** | Их API/фиды | Актуальные цены, наличие | Разная |
| **ЦИАН/Яндекс** | API | Дополнительные данные | Сложная |

### Задачи этапа 5

#### 5.1 Интеграция с ДОМ.РФ (если есть API)

```typescript
// ДОМ.РФ агрегирует данные по всем ипотечным программам
// Если есть открытый API — используем его

class DomRFService {
  async getMortgagePrograms(): Promise<MortgageProgram[]> {
    // Получаем актуальные программы
  }

  async calculateMortgage(params: MortgageParams): Promise<MortgageResult> {
    // Официальный расчёт
  }
}
```

#### 5.2 Интеграция с DomClick (Сбербанк)

```typescript
// Если получим партнёрский доступ
class DomClickService {
  async getAccreditedComplexes(): Promise<Complex[]> {
    // Список аккредитованных ЖК
  }

  async submitMortgageApplication(data: ApplicationData): Promise<ApplicationResult> {
    // Онлайн-заявка на ипотеку
  }
}
```

#### 5.3 Прямые фиды от застройщиков

```typescript
// Если застройщик даст прямой фид — парсим его
// Преимущества:
// - Актуальные цены (обновление каждый час)
// - Наличие квартир в реальном времени
// - Акции и спецпредложения

async function importDeveloperFeed(developerSlug: string) {
  const config = developerFeedConfigs[developerSlug];
  const response = await fetch(config.feedUrl);
  // Парсим и импортируем
}
```

### Результат этапа 5

**Добавлено:**
- [ ] Актуальные ипотечные программы из официальных источников
- [ ] Онлайн-заявка на ипотеку (если партнёрство)
- [ ] Актуальные данные от застройщиков
- [ ] Автоматическое обновление акций

---

## Сводная таблица функций по этапам

| Функция | Этап 0 | Этап 1 | Этап 2 | Этап 3 | Этап 4 | Этап 5 |
|---------|--------|--------|--------|--------|--------|--------|
| **Инфраструктура** |
| Docker + PostgreSQL | ✅ | | | | | |
| CI/CD | ✅ | | | | | |
| **Поиск** |
| Базовые фильтры (10) | | ✅ | | | | |
| Счётчик результатов | | ✅ | | | | |
| Евро-планировки (эвристика) | | ✅ | | | | |
| Евро-планировки (GPT) | | | ✅ | | | |
| Юридические фильтры | | | ✅ | | | |
| Регион прописки | | | | ✅ | | |
| Банк-партнёр | | | | | ✅ | |
| Рассрочка/Акции | | | | | ✅ | |
| AI-ассистент (NLP) | | | ✅ | | | |
| **Карточка** |
| Базовая информация | | ✅ | | | | |
| Планировки | | ✅ | | | | |
| Карта (embed) | | ✅ | | | | |
| Карта (интерактивная) | | | | ✅ | | |
| Калькулятор (простой) | | ✅ | | | | |
| Калькулятор (с ЦБ) | | | | ✅ | | |
| Ипотечные программы | | | | | ✅ | ✅ |
| Рассрочка | | | | | ✅ | |
| Акции | | | | | ✅ | |
| Документы | | | | | ✅ | |
| **Подборки** |
| Создание/Просмотр | | ✅ | | | | |
| Бронирование | | ✅ | | | | |
| PDF-экспорт | | | | | | ✅ |
| **Админка** |
| ЛК оператора | | ✅ | | | ✅ | |
| Управление данными | | | | | ✅ | |

---

## Оценка сроков

| Этап | Длительность | Накопительно |
|------|--------------|--------------|
| Этап 0: Инфраструктура | 1 неделя | 1 неделя |
| Этап 1: XML-фид (MVP) | 3-4 недели | 4-5 недель |
| Этап 2: Yandex GPT | 2 недели | 6-7 недель |
| Этап 3: Бесплатные API | 2 недели | 8-9 недель |
| Этап 4: Ручной сбор | 2-3 недели | 10-12 недель |
| Этап 5: Партнёрские API | 2-4 недели | 12-16 недель |

**Итого до полнофункциональной версии: 3-4 месяца**

---

## Приоритеты для MVP (Этапы 0-1)

```
КРИТИЧНО (без этого не запускаемся):
├── Парсер XML-фида
├── Поиск по базовым фильтрам
├── Карточка объекта с планировкой
├── Авторизация агентов
├── Подборки
└── Базовое бронирование

ВАЖНО (нужно для продаж):
├── Евро-планировки (хотя бы эвристика)
├── Умная строка поиска
├── Счётчик результатов
└── Ипотечный калькулятор

МОЖНО ОТЛОЖИТЬ:
├── Юридические фильтры (Этап 2)
├── Интерактивная карта (Этап 3)
├── Банки-партнёры (Этап 4)
└── PDF-экспорт (Этап 5)
```
