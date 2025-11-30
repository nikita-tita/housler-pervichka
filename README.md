# Housler Pervichka

Агрегатор первичной недвижимости Санкт-Петербурга.

## Возможности

- Поиск квартир в новостройках СПб с 10+ фильтрами
- Карточки объектов с планировками
- Определение евро-планировок
- Ипотечный калькулятор
- Подборки для клиентов
- Бронирование объектов

## Быстрый старт

### Требования

- Node.js 18+
- Docker и Docker Compose (для БД)
- Git

### Установка

```bash
# Клонирование
git clone <repo-url>
cd housler-pervichka

# Переменные окружения
cp .env.example .env

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

### Запуск через Docker

```bash
docker-compose up -d
```

## Структура проекта

```
housler-pervichka/
├── backend/              # Node.js + Express + TypeScript
│   └── src/
│       ├── api/          # REST API routes и controllers
│       ├── services/     # Бизнес-логика
│       ├── models/       # TypeORM entities
│       ├── parsers/      # XML парсеры
│       └── jobs/         # Cron задачи
├── frontend/             # Next.js + React + TypeScript
│   └── src/
│       ├── app/          # Next.js App Router
│       ├── components/   # React компоненты
│       └── services/     # API клиент
├── database/             # Миграции и сиды
└── feeds/                # XML-фиды
```

## Команды

```bash
# Разработка
npm run dev              # Запуск backend + frontend
npm run dev:backend      # Только backend
npm run dev:frontend     # Только frontend

# Сборка
npm run build            # Сборка всех пакетов

# Линтинг
npm run lint             # Проверка кода
npm run format           # Форматирование кода
```

## API

Backend работает на порту 3001.

- `GET /health` - Health check
- `GET /api/v1` - API info
- `GET /api/v1/offers` - Список объектов
- `GET /api/v1/offers/:id` - Детали объекта
- `GET /api/v1/complexes` - Список ЖК

## Технологии

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL + PostGIS
- Redis

**Frontend:**
- Next.js 14
- React 18
- Tailwind CSS
- Zustand
- React Query

## Лицензия

Proprietary
