# ЭТАП 1: Разработка MVP (Только XML-фид)

## КРИТИЧЕСКИ ВАЖНО — ПРОЧИТАЙ ПЕРЕД НАЧАЛОМ РАБОТЫ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ПРАВИЛА РАБОТЫ НАД ЭТАПОМ 1                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. ПЕРЕД КАЖДОЙ ЗАДАЧЕЙ:                                               │
│     □ Прочитай CLAUDE.md (правила работы с кодом)                      │
│     □ Прочитай указанные файлы контекста                               │
│     □ Обнови TodoWrite с текущей задачей                               │
│                                                                         │
│  2. ВО ВРЕМЯ РАБОТЫ:                                                    │
│     □ Используй Edit tool, НЕ Write tool                               │
│     □ Одна задача = одно изменение                                     │
│     □ git commit после каждой саб-таски                                │
│                                                                         │
│  3. ПОСЛЕ ЗАДАЧИ:                                                       │
│     □ Проверь что работает (тест/запуск)                               │
│     □ git push                                                         │
│     □ Отметь задачу как completed в TodoWrite                          │
│     □ Только потом переходи к следующей                                │
│                                                                         │
│  4. ЕСЛИ СЛОМАЛ:                                                        │
│     □ git stash && git checkout .                                      │
│     □ Попробуй снова (макс 3 попытки)                                  │
│     □ После 3 попыток — зови человека                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ОБЗОР ФИЧЕЙ ЭТАПА 1

| # | Фича | Саб-тасков | Зависит от | Результат |
|---|------|------------|------------|-----------|
| F1 | Инициализация проекта | 6 | - | Структура папок, package.json |
| F2 | Docker-окружение | 5 | F1 | docker-compose up работает |
| F3 | База данных | 7 | F2 | Схема создана, миграции работают |
| F4 | XML-парсер | 6 | F3 | Фид парсится, данные в БД |
| F5 | REST API (базовый) | 8 | F4 | /api/offers возвращает данные |
| F6 | Frontend (каркас) | 5 | F5 | Страница открывается |
| F7 | Поиск и фильтрация | 7 | F6 | Фильтры работают |
| F8 | Карточка объекта | 5 | F7 | Детали объекта показываются |
| F9 | Авторизация и подборки | 6 | F8 | Агент создаёт подборку |
| F10 | Бронирование и ЛК | 5 | F9 | Полный флоу работает |

**Общее количество саб-тасков: 60**
**Оценка времени: 3-4 недели**

---

## F1: ИНИЦИАЛИЗАЦИЯ ПРОЕКТА

### Цель
Создать структуру проекта, настроить TypeScript, линтеры, базовые конфиги.

### Контекст для чтения ПЕРЕД началом
```
ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
├── /CLAUDE.md                    — Правила работы
├── /DECOMPOSITION.md             — Общий план (секция "Этап 1")
├── /ТЗ_v2_расширенное.md         — Секции 6.2.1, 6.2.2 (структура проекта)
└── /database_schema.sql          — Понимание модели данных
```

### Саб-таски

#### F1.1 Создание корневой структуры
```
ЗАДАЧА: Создать папки и корневые файлы проекта

ДО НАЧАЛА:
□ Убедись что находишься в /Users/fatbookpro/Desktop/housler_pervichka
□ Прочитай секцию 6.2 в ТЗ_v2_расширенное.md

ДЕЙСТВИЯ:
1. Создай структуру:
   mkdir -p backend/src/{api,services,models,parsers,jobs,config,utils,types}
   mkdir -p frontend/src/{app,components,services,stores,hooks,types,utils}
   mkdir -p database/{migrations,seeds}
   mkdir -p nginx
   mkdir -p scripts
   mkdir -p feeds

2. Создай .gitignore в корне:
   node_modules/
   .env
   .env.local
   *.log
   dist/
   .next/
   coverage/
   .DS_Store

3. Создай .env.example:
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=housler
   DB_USER=housler
   DB_PASSWORD=changeme

   # Redis
   REDIS_URL=redis://localhost:6379

   # App
   NODE_ENV=development
   API_PORT=3001
   FRONTEND_URL=http://localhost:3000

ПРОВЕРКА:
□ ls -la показывает все папки
□ .gitignore существует
□ .env.example существует

КОММИТ:
git add -A && git commit -m "feat(init): create project structure"

ПОСЛЕ:
□ Отметь F1.1 как completed
□ Переходи к F1.2
```

#### F1.2 Инициализация Backend
```
ЗАДАЧА: Настроить Node.js backend с TypeScript

ДО НАЧАЛА:
□ F1.1 завершена
□ Прочитай секцию 6.2.2 в ТЗ

ДЕЙСТВИЯ:
1. cd backend

2. Создай package.json:
   {
     "name": "housler-backend",
     "version": "0.1.0",
     "scripts": {
       "dev": "ts-node-dev --respawn src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js",
       "lint": "eslint src --ext .ts",
       "test": "jest"
     },
     "dependencies": {
       "express": "^4.18.2",
       "pg": "^8.11.3",
       "redis": "^4.6.10",
       "zod": "^3.22.4",
       "sax": "^1.3.0",
       "cors": "^2.8.5",
       "helmet": "^7.1.0",
       "compression": "^1.7.4",
       "dotenv": "^16.3.1",
       "jsonwebtoken": "^9.0.2",
       "bcryptjs": "^2.4.3",
       "node-cron": "^3.0.3",
       "winston": "^3.11.0"
     },
     "devDependencies": {
       "@types/express": "^4.17.21",
       "@types/node": "^20.10.0",
       "@types/cors": "^2.8.17",
       "@types/compression": "^1.7.5",
       "@types/jsonwebtoken": "^9.0.5",
       "@types/bcryptjs": "^2.4.6",
       "@types/sax": "^1.2.7",
       "typescript": "^5.3.2",
       "ts-node-dev": "^2.0.0",
       "eslint": "^8.55.0",
       "@typescript-eslint/eslint-plugin": "^6.13.1",
       "@typescript-eslint/parser": "^6.13.1",
       "jest": "^29.7.0",
       "@types/jest": "^29.5.11",
       "ts-jest": "^29.1.1"
     }
   }

3. Создай tsconfig.json:
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "commonjs",
       "lib": ["ES2022"],
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "declaration": true,
       "declarationMap": true,
       "sourceMap": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }

4. Создай src/index.ts:
   import express from 'express';
   import cors from 'cors';
   import helmet from 'helmet';
   import compression from 'compression';
   import dotenv from 'dotenv';

   dotenv.config();

   const app = express();
   const PORT = process.env.API_PORT || 3001;

   app.use(cors());
   app.use(helmet());
   app.use(compression());
   app.use(express.json());

   app.get('/health', (req, res) => {
     res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });

   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });

5. npm install

ПРОВЕРКА:
□ npm run dev запускается без ошибок
□ curl http://localhost:3001/health возвращает {"status":"ok",...}

КОММИТ:
git add -A && git commit -m "feat(backend): initialize express with typescript"

ПОСЛЕ:
□ Останови сервер (Ctrl+C)
□ cd ..
□ Отметь F1.2 как completed
```

#### F1.3 Инициализация Frontend
```
ЗАДАЧА: Настроить Next.js frontend

ДО НАЧАЛА:
□ F1.2 завершена
□ Прочитай секцию 6.2.1 в ТЗ

ДЕЙСТВИЯ:
1. cd frontend

2. npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   (Если спросит — соглашайся на все по умолчанию)

3. Установи доп. зависимости:
   npm install zustand @tanstack/react-query axios
   npm install -D @types/node

4. Создай src/services/api.ts:
   import axios from 'axios';

   export const api = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
   });

5. Обнови src/app/page.tsx:
   export default function Home() {
     return (
       <main className="flex min-h-screen flex-col items-center justify-center p-24">
         <h1 className="text-4xl font-bold">Housler Pervichka</h1>
         <p className="mt-4 text-gray-600">Агрегатор первичной недвижимости СПб</p>
       </main>
     );
   }

ПРОВЕРКА:
□ npm run dev запускается
□ http://localhost:3000 показывает "Housler Pervichka"

КОММИТ:
git add -A && git commit -m "feat(frontend): initialize next.js with tailwind"

ПОСЛЕ:
□ Останови сервер
□ cd ..
□ Отметь F1.3 как completed
```

#### F1.4 Конфигурация ESLint и Prettier
```
ЗАДАЧА: Единые правила форматирования

ДО НАЧАЛА:
□ F1.3 завершена

ДЕЙСТВИЯ:
1. Создай .prettierrc в корне:
   {
     "semi": true,
     "singleQuote": true,
     "tabWidth": 2,
     "trailingComma": "es5",
     "printWidth": 100
   }

2. Создай .eslintrc.json в корне:
   {
     "root": true,
     "env": {
       "node": true,
       "browser": true,
       "es2022": true
     },
     "extends": [
       "eslint:recommended"
     ],
     "rules": {
       "no-console": "warn",
       "no-unused-vars": "warn"
     }
   }

3. Добавь в корневой package.json (создай если нет):
   {
     "name": "housler-pervichka",
     "private": true,
     "workspaces": ["backend", "frontend"],
     "scripts": {
       "dev": "concurrently \"npm run dev --workspace=backend\" \"npm run dev --workspace=frontend\"",
       "lint": "npm run lint --workspaces",
       "format": "prettier --write \"**/*.{ts,tsx,js,json,md}\""
     },
     "devDependencies": {
       "concurrently": "^8.2.2",
       "prettier": "^3.1.0"
     }
   }

4. npm install (в корне)

ПРОВЕРКА:
□ npm run format работает
□ npm run lint работает (могут быть warnings — это ок)

КОММИТ:
git add -A && git commit -m "chore: configure eslint and prettier"

ПОСЛЕ:
□ Отметь F1.4 как completed
```

#### F1.5 Создание README
```
ЗАДАЧА: Документация для разработчика

ДО НАЧАЛА:
□ F1.4 завершена

ДЕЙСТВИЯ:
1. Создай README.md в корне:

# Housler Pervichka

Агрегатор первичной недвижимости Санкт-Петербурга.

## Быстрый старт

### Требования
- Node.js 20+
- Docker и Docker Compose
- Git

### Установка

```bash
# Клонирование
git clone <repo-url>
cd housler-pervichka

# Переменные окружения
cp .env.example .env

# Запуск через Docker
docker-compose up -d

# Или локально (для разработки)
npm install
npm run dev
```

### Структура проекта

```
housler-pervichka/
├── backend/          # Express.js API
├── frontend/         # Next.js приложение
├── database/         # Миграции и сиды
├── nginx/            # Конфиг reverse proxy
├── feeds/            # XML фиды (не в git)
└── scripts/          # Утилиты
```

### Документация

- [Техническое задание](./ТЗ_v2_расширенное.md)
- [Схема БД](./database_schema.sql)
- [План разработки](./DECOMPOSITION.md)
- [Правила для Claude](./CLAUDE.md)

## Команды

```bash
npm run dev           # Запуск в режиме разработки
npm run lint          # Проверка кода
npm run format        # Форматирование
docker-compose up -d  # Запуск контейнеров
```

ПРОВЕРКА:
□ README.md создан и читаем

КОММИТ:
git add -A && git commit -m "docs: add README"

ПОСЛЕ:
□ Отметь F1.5 как completed
```

#### F1.6 Перенос фида в проект
```
ЗАДАЧА: Скопировать XML-фид в папку feeds

ДО НАЧАЛА:
□ F1.5 завершена
□ Найди файл спб_.xml

ДЕЙСТВИЯ:
1. Скопируй фид:
   cp /путь/к/спб_.xml ./feeds/spb.xml

2. Добавь feeds/ в .gitignore (если ещё нет):
   feeds/*.xml

3. Создай feeds/.gitkeep:
   touch feeds/.gitkeep

ПРОВЕРКА:
□ ls feeds/ показывает spb.xml
□ Файл НЕ добавлен в git (git status не показывает spb.xml)

КОММИТ:
git add feeds/.gitkeep .gitignore && git commit -m "chore: add feeds directory"

ПОСЛЕ:
□ Отметь F1.6 как completed
□ git push origin main
□ Переходи к F2
```

### Критерии завершения F1
- [ ] Структура папок создана
- [ ] Backend запускается на порту 3001
- [ ] Frontend запускается на порту 3000
- [ ] ESLint и Prettier настроены
- [ ] README.md создан
- [ ] XML-фид в папке feeds/

---

## F2: DOCKER-ОКРУЖЕНИЕ

### Цель
Настроить Docker Compose для локальной разработки и продакшена.

### Контекст для чтения ПЕРЕД началом
```
ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
├── /CLAUDE.md                    — Правила работы
├── /DECOMPOSITION.md             — Секция "0.2 Docker Compose"
└── /ТЗ_v2_расширенное.md         — Секция 6.1 (архитектура)
```

### Саб-таски

#### F2.1 Dockerfile для Backend
```
ЗАДАЧА: Создать Dockerfile для backend

ДО НАЧАЛА:
□ F1 полностью завершена
□ Прочитай backend/package.json

ДЕЙСТВИЯ:
1. Создай backend/Dockerfile:

FROM node:20-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходники
COPY . .

# Собираем TypeScript
RUN npm run build

# Порт
EXPOSE 3001

# Запуск
CMD ["node", "dist/index.js"]

2. Создай backend/.dockerignore:
   node_modules
   dist
   .env
   *.log
   coverage

ПРОВЕРКА:
□ docker build -t housler-backend ./backend — без ошибок

КОММИТ:
git add -A && git commit -m "feat(docker): add backend Dockerfile"

ПОСЛЕ:
□ Отметь F2.1 как completed
```

#### F2.2 Dockerfile для Frontend
```
ЗАДАЧА: Создать Dockerfile для frontend

ДО НАЧАЛА:
□ F2.1 завершена
□ Прочитай frontend/package.json

ДЕЙСТВИЯ:
1. Создай frontend/Dockerfile:

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

2. Обнови frontend/next.config.js:
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'standalone',
   };
   module.exports = nextConfig;

3. Создай frontend/.dockerignore:
   node_modules
   .next
   .env*
   *.log

ПРОВЕРКА:
□ docker build -t housler-frontend ./frontend — без ошибок (может занять время)

КОММИТ:
git add -A && git commit -m "feat(docker): add frontend Dockerfile"

ПОСЛЕ:
□ Отметь F2.2 как completed
```

#### F2.3 Docker Compose для разработки
```
ЗАДАЧА: Создать docker-compose.yml

ДО НАЧАЛА:
□ F2.2 завершена
□ Прочитай /DECOMPOSITION.md секцию "0.2 Docker Compose"

ДЕЙСТВИЯ:
1. Создай docker-compose.yml в корне:

version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    container_name: housler-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-housler}
      POSTGRES_USER: ${DB_USER:-housler}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-housler123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-housler}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: housler-redis
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: housler-backend
    environment:
      DATABASE_URL: postgresql://${DB_USER:-housler}:${DB_PASSWORD:-housler123}@postgres:5432/${DB_NAME:-housler}
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
      API_PORT: 3001
    volumes:
      - ./feeds:/app/feeds:ro
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://localhost:3001
    container_name: housler-frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:

ПРОВЕРКА:
□ docker-compose config — без ошибок
□ Синтаксис валидный

КОММИТ:
git add -A && git commit -m "feat(docker): add docker-compose.yml"

ПОСЛЕ:
□ Отметь F2.3 как completed
```

#### F2.4 Docker Compose для разработки (dev режим)
```
ЗАДАЧА: Создать docker-compose.dev.yml с hot-reload

ДО НАЧАЛА:
□ F2.3 завершена

ДЕЙСТВИЯ:
1. Создай docker-compose.dev.yml:

version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    container_name: housler-postgres-dev
    environment:
      POSTGRES_DB: housler
      POSTGRES_USER: housler
      POSTGRES_PASSWORD: housler123
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    container_name: housler-redis-dev
    ports:
      - "6379:6379"

volumes:
  postgres_dev_data:

2. Обнови .env.example:
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=housler
   DB_USER=housler
   DB_PASSWORD=housler123
   DATABASE_URL=postgresql://housler:housler123@localhost:5432/housler

   # Redis
   REDIS_URL=redis://localhost:6379

   # App
   NODE_ENV=development
   API_PORT=3001

   # Frontend
   NEXT_PUBLIC_API_URL=http://localhost:3001

3. Скопируй .env:
   cp .env.example .env

ПРОВЕРКА:
□ docker-compose -f docker-compose.dev.yml up -d — запускается
□ docker-compose -f docker-compose.dev.yml ps — postgres и redis running

КОММИТ:
git add -A && git commit -m "feat(docker): add dev compose with hot-reload"

ПОСЛЕ:
□ Отметь F2.4 как completed
```

#### F2.5 Nginx конфигурация
```
ЗАДАЧА: Настроить reverse proxy

ДО НАЧАЛА:
□ F2.4 завершена

ДЕЙСТВИЯ:
1. Создай nginx/nginx.conf:

events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # API
        location /api/ {
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
        }

        # Frontend
        location / {
            proxy_pass http://frontend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}

2. Создай nginx/Dockerfile:

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

ПРОВЕРКА:
□ docker build -t housler-nginx ./nginx — без ошибок

КОММИТ:
git add -A && git commit -m "feat(nginx): add reverse proxy config"

ПОСЛЕ:
□ Отметь F2.5 как completed
□ git push origin main
□ Переходи к F3
```

### Критерии завершения F2
- [ ] docker-compose -f docker-compose.dev.yml up -d работает
- [ ] PostgreSQL доступен на localhost:5432
- [ ] Redis доступен на localhost:6379
- [ ] Nginx конфиг готов

---

## F3: БАЗА ДАННЫХ

### Цель
Применить схему БД, настроить подключение, создать базовые сиды.

### Контекст для чтения ПЕРЕД началом
```
ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
├── /CLAUDE.md                    — Правила работы
├── /database_schema.sql          — ПОЛНОСТЬЮ, это основа
├── /ТЗ_v2_расширенное.md         — Секция 7 (модель данных)
└── /DECOMPOSITION.md             — Секция "1.2 Импорт в базу данных"
```

### Саб-таски

#### F3.1 Подготовка схемы для Docker
```
ЗАДАЧА: Убедиться что schema.sql готов для автозапуска

ДО НАЧАЛА:
□ F2 полностью завершена
□ ПРОЧИТАЙ database_schema.sql ПОЛНОСТЬЮ

ДЕЙСТВИЯ:
1. Проверь что database_schema.sql начинается с:
   -- Расширения PostgreSQL
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS btree_gist;

2. Скопируй схему:
   cp database_schema.sql database/schema.sql

3. Перезапусти postgres чтобы применить схему:
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up -d postgres

4. Подожди 10 секунд и проверь:
   docker-compose -f docker-compose.dev.yml exec postgres psql -U housler -c "\dt"

ПРОВЕРКА:
□ Вывод показывает таблицы: districts, metro_stations, developers, complexes, offers, ...
□ Минимум 15+ таблиц

КОММИТ:
git add -A && git commit -m "feat(db): add schema.sql to database folder"

ПОСЛЕ:
□ Отметь F3.1 как completed
```

#### F3.2 Подключение к БД из Backend
```
ЗАДАЧА: Настроить pg клиент в backend

ДО НАЧАЛА:
□ F3.1 завершена
□ Postgres работает (docker ps)

ДЕЙСТВИЯ:
1. Создай backend/src/config/database.ts:

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};

export default db;

2. Обнови backend/src/index.ts — добавь проверку БД:

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import db from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: (error as Error).message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

3. Создай .env в backend/ (скопируй из корня):
   cp .env backend/.env

ПРОВЕРКА:
□ cd backend && npm run dev
□ curl http://localhost:3001/health возвращает {"status":"ok","database":"connected",...}

КОММИТ:
git add -A && git commit -m "feat(backend): add database connection"

ПОСЛЕ:
□ Отметь F3.2 как completed
```

#### F3.3 Подключение к Redis
```
ЗАДАЧА: Настроить Redis клиент

ДО НАЧАЛА:
□ F3.2 завершена
□ Redis работает (docker ps)

ДЕЙСТВИЯ:
1. Создай backend/src/config/redis.ts:

import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis connected'));

export const redis = {
  client: redisClient,
  connect: () => redisClient.connect(),
  get: (key: string) => redisClient.get(key),
  set: (key: string, value: string, options?: { EX?: number }) =>
    redisClient.set(key, value, options),
  del: (key: string) => redisClient.del(key),
};

export default redis;

2. Обнови backend/src/index.ts — добавь инициализацию Redis:

// После импортов добавь:
import redis from './config/redis';

// После app.use(...) добавь:
// Initialize Redis
redis.connect().catch(console.error);

// Обнови /health:
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    await redis.client.ping();
    res.json({
      status: 'ok',
      database: 'connected',
      redis: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: (error as Error).message
    });
  }
});

ПРОВЕРКА:
□ npm run dev (в backend)
□ curl http://localhost:3001/health показывает redis: "connected"

КОММИТ:
git add -A && git commit -m "feat(backend): add redis connection"

ПОСЛЕ:
□ Отметь F3.3 как completed
```

#### F3.4 Seed данных — Районы
```
ЗАДАЧА: Заполнить справочник районов

ДО НАЧАЛА:
□ F3.3 завершена
□ Проверь что таблица districts пустая:
  docker-compose -f docker-compose.dev.yml exec postgres psql -U housler -c "SELECT COUNT(*) FROM districts"

ДЕЙСТВИЯ:
1. Создай database/seeds/01-districts.sql:

-- Районы Санкт-Петербурга
INSERT INTO districts (name, region) VALUES
  ('Адмиралтейский', 'Санкт-Петербург'),
  ('Василеостровский', 'Санкт-Петербург'),
  ('Выборгский', 'Санкт-Петербург'),
  ('Калининский', 'Санкт-Петербург'),
  ('Кировский', 'Санкт-Петербург'),
  ('Колпинский', 'Санкт-Петербург'),
  ('Красногвардейский', 'Санкт-Петербург'),
  ('Красносельский', 'Санкт-Петербург'),
  ('Кронштадтский', 'Санкт-Петербург'),
  ('Курортный', 'Санкт-Петербург'),
  ('Московский', 'Санкт-Петербург'),
  ('Невский', 'Санкт-Петербург'),
  ('Петроградский', 'Санкт-Петербург'),
  ('Петродворцовый', 'Санкт-Петербург'),
  ('Приморский', 'Санкт-Петербург'),
  ('Пушкинский', 'Санкт-Петербург'),
  ('Фрунзенский', 'Санкт-Петербург'),
  ('Центральный', 'Санкт-Петербург')
ON CONFLICT (name) DO NOTHING;

-- Районы Ленинградской области (основные)
INSERT INTO districts (name, region) VALUES
  ('Всеволожский', 'Ленинградская область'),
  ('Гатчинский', 'Ленинградская область'),
  ('Ломоносовский', 'Ленинградская область'),
  ('Тосненский', 'Ленинградская область')
ON CONFLICT (name) DO NOTHING;

2. Выполни seed:
   docker-compose -f docker-compose.dev.yml exec postgres psql -U housler -f /docker-entrypoint-initdb.d/01-districts.sql

   Или напрямую:
   docker-compose -f docker-compose.dev.yml exec postgres psql -U housler -c "$(cat database/seeds/01-districts.sql)"

ПРОВЕРКА:
□ docker-compose -f docker-compose.dev.yml exec postgres psql -U housler -c "SELECT * FROM districts"
□ Показывает 22 района

КОММИТ:
git add -A && git commit -m "feat(db): add districts seed"

ПОСЛЕ:
□ Отметь F3.4 как completed
```

#### F3.5 Seed данных — Метро
```
ЗАДАЧА: Заполнить справочник станций метро

ДО НАЧАЛА:
□ F3.4 завершена

ДЕЙСТВИЯ:
1. Создай database/seeds/02-metro.sql:

-- Линия 1 (Красная)
INSERT INTO metro_stations (name, line) VALUES
  ('Девяткино', 'Линия 1'),
  ('Гражданский проспект', 'Линия 1'),
  ('Академическая', 'Линия 1'),
  ('Политехническая', 'Линия 1'),
  ('Площадь Мужества', 'Линия 1'),
  ('Лесная', 'Линия 1'),
  ('Выборгская', 'Линия 1'),
  ('Площадь Ленина', 'Линия 1'),
  ('Чернышевская', 'Линия 1'),
  ('Площадь Восстания', 'Линия 1'),
  ('Владимирская', 'Линия 1'),
  ('Пушкинская', 'Линия 1'),
  ('Технологический институт', 'Линия 1'),
  ('Балтийская', 'Линия 1'),
  ('Нарвская', 'Линия 1'),
  ('Кировский завод', 'Линия 1'),
  ('Автово', 'Линия 1'),
  ('Ленинский проспект', 'Линия 1'),
  ('Проспект Ветеранов', 'Линия 1')
ON CONFLICT (name, line) DO NOTHING;

-- Линия 2 (Синяя)
INSERT INTO metro_stations (name, line) VALUES
  ('Парнас', 'Линия 2'),
  ('Проспект Просвещения', 'Линия 2'),
  ('Озерки', 'Линия 2'),
  ('Удельная', 'Линия 2'),
  ('Пионерская', 'Линия 2'),
  ('Чёрная речка', 'Линия 2'),
  ('Петроградская', 'Линия 2'),
  ('Горьковская', 'Линия 2'),
  ('Невский проспект', 'Линия 2'),
  ('Сенная площадь', 'Линия 2'),
  ('Технологический институт', 'Линия 2'),
  ('Фрунзенская', 'Линия 2'),
  ('Московские ворота', 'Линия 2'),
  ('Электросила', 'Линия 2'),
  ('Парк Победы', 'Линия 2'),
  ('Московская', 'Линия 2'),
  ('Звёздная', 'Линия 2'),
  ('Купчино', 'Линия 2')
ON CONFLICT (name, line) DO NOTHING;

-- Линия 3 (Зелёная)
INSERT INTO metro_stations (name, line) VALUES
  ('Беговая', 'Линия 3'),
  ('Зенит', 'Линия 3'),
  ('Приморская', 'Линия 3'),
  ('Василеостровская', 'Линия 3'),
  ('Гостиный двор', 'Линия 3'),
  ('Маяковская', 'Линия 3'),
  ('Площадь Александра Невского', 'Линия 3'),
  ('Елизаровская', 'Линия 3'),
  ('Ломоносовская', 'Линия 3'),
  ('Пролетарская', 'Линия 3'),
  ('Обухово', 'Линия 3'),
  ('Рыбацкое', 'Линия 3')
ON CONFLICT (name, line) DO NOTHING;

-- Линия 4 (Оранжевая)
INSERT INTO metro_stations (name, line) VALUES
  ('Спасская', 'Линия 4'),
  ('Достоевская', 'Линия 4'),
  ('Лиговский проспект', 'Линия 4'),
  ('Площадь Александра Невского', 'Линия 4'),
  ('Новочеркасская', 'Линия 4'),
  ('Ладожская', 'Линия 4'),
  ('Проспект Большевиков', 'Линия 4'),
  ('Улица Дыбенко', 'Линия 4')
ON CONFLICT (name, line) DO NOTHING;

-- Линия 5 (Фиолетовая)
INSERT INTO metro_stations (name, line) VALUES
  ('Комендантский проспект', 'Линия 5'),
  ('Старая Деревня', 'Линия 5'),
  ('Крестовский остров', 'Линия 5'),
  ('Чкаловская', 'Линия 5'),
  ('Спортивная', 'Линия 5'),
  ('Адмиралтейская', 'Линия 5'),
  ('Садовая', 'Линия 5'),
  ('Звенигородская', 'Линия 5'),
  ('Обводный канал', 'Линия 5'),
  ('Волковская', 'Линия 5'),
  ('Бухарестская', 'Линия 5'),
  ('Международная', 'Линия 5'),
  ('Проспект Славы', 'Линия 5'),
  ('Дунайская', 'Линия 5'),
  ('Шушары', 'Линия 5')
ON CONFLICT (name, line) DO NOTHING;

2. Выполни seed:
   docker-compose -f docker-compose.dev.yml exec postgres psql -U housler -c "$(cat database/seeds/02-metro.sql)"

ПРОВЕРКА:
□ docker-compose -f docker-compose.dev.yml exec postgres psql -U housler -c "SELECT COUNT(*) FROM metro_stations"
□ Показывает 69+ станций

КОММИТ:
git add -A && git commit -m "feat(db): add metro stations seed"

ПОСЛЕ:
□ Отметь F3.5 как completed
```

#### F3.6 Создание базовых моделей TypeORM
```
ЗАДАЧА: Создать TypeScript интерфейсы для таблиц

ДО НАЧАЛА:
□ F3.5 завершена
□ Прочитай database_schema.sql — таблицы offers, complexes, buildings

ДЕЙСТВИЯ:
1. Создай backend/src/types/models.ts:

// Базовые типы из БД
export interface District {
  id: number;
  name: string;
  region: string;
  created_at: Date;
}

export interface MetroStation {
  id: number;
  name: string;
  line: string | null;
  district_id: number | null;
  created_at: Date;
}

export interface Developer {
  id: number;
  name: string;
  inn: string | null;
  website: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Complex {
  id: number;
  name: string;
  developer_id: number | null;
  district_id: number | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  nearest_metro_id: number | null;
  metro_time_on_foot: number | null;
  description: string | null;
  min_price: number | null;
  max_price: number | null;
  avg_price_per_sqm: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Building {
  id: number;
  complex_id: number;
  name: string | null;
  building_type: string | null;
  building_state: 'unfinished' | 'hand-over';
  floors_total: number | null;
  built_year: number | null;
  ready_quarter: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Offer {
  id: number;
  complex_id: number | null;
  building_id: number | null;
  district_id: number | null;
  metro_station_id: number | null;

  // Тип
  offer_type: string;
  property_type: string;
  category: string;

  // Квартира
  rooms: number;
  is_studio: boolean;
  area_total: number;
  area_living: number | null;
  area_kitchen: number | null;
  floor: number;
  floors_total: number;
  renovation: string | null;
  balcony: string | null;
  bathroom_unit: string | null;

  // Цена
  price: number;
  price_per_sqm: number;
  currency: string;

  // Юридическое (из Этапа 2)
  deal_type: string | null;
  has_escrow: boolean | null;
  is_apartment: boolean;
  room_type: string | null;
  is_euro_layout: boolean;

  // Местоположение
  address: string | null;
  latitude: number;
  longitude: number;
  metro_time_on_foot: number | null;

  // Описание
  description: string | null;

  // Статус
  is_active: boolean;

  // Даты
  created_at: Date;
  updated_at: Date;
}

export interface OfferImage {
  id: number;
  offer_id: number;
  tag: 'plan' | 'housemain' | 'floorplan' | 'complexscheme' | null;
  url: string;
  display_order: number;
}

// Для API ответов
export interface OfferListItem {
  id: number;
  complex_name: string | null;
  district_name: string | null;
  metro_name: string | null;
  metro_time_on_foot: number | null;
  rooms: number;
  room_type: string | null;
  is_euro_layout: boolean;
  area_total: number;
  floor: number;
  floors_total: number;
  renovation: string | null;
  price: number;
  price_per_sqm: number;
  building_state: string | null;
  built_year: number | null;
  ready_quarter: number | null;
  plan_image_url: string | null;
}

export interface OfferDetails extends Offer {
  complex: Complex | null;
  building: Building | null;
  district: District | null;
  metro: MetroStation | null;
  images: OfferImage[];
}

ПРОВЕРКА:
□ Файл создан без синтаксических ошибок
□ tsc --noEmit (в backend) — без ошибок типов

КОММИТ:
git add -A && git commit -m "feat(backend): add TypeScript models"

ПОСЛЕ:
□ Отметь F3.6 как completed
```

#### F3.7 Создание базового репозитория
```
ЗАДАЧА: Создать слой доступа к данным

ДО НАЧАЛА:
□ F3.6 завершена
□ Прочитай backend/src/types/models.ts

ДЕЙСТВИЯ:
1. Создай backend/src/repositories/base.repository.ts:

import db from '../config/database';

export class BaseRepository<T> {
  constructor(protected tableName: string) {}

  async findById(id: number | string): Promise<T | null> {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll(limit = 100, offset = 0): Promise<T[]> {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async count(where?: string, params?: any[]): Promise<number> {
    const whereClause = where ? `WHERE ${where}` : '';
    const result = await db.query(
      `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`,
      params
    );
    return parseInt(result.rows[0].count, 10);
  }
}

2. Создай backend/src/repositories/districts.repository.ts:

import { BaseRepository } from './base.repository';
import { District } from '../types/models';
import db from '../config/database';

class DistrictsRepository extends BaseRepository<District> {
  constructor() {
    super('districts');
  }

  async findByName(name: string): Promise<District | null> {
    const result = await db.query(
      'SELECT * FROM districts WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  async findByRegion(region: string): Promise<District[]> {
    const result = await db.query(
      'SELECT * FROM districts WHERE region = $1 ORDER BY name',
      [region]
    );
    return result.rows;
  }
}

export const districtsRepository = new DistrictsRepository();

3. Создай backend/src/repositories/index.ts:

export { districtsRepository } from './districts.repository';
// Остальные репозитории добавим позже

ПРОВЕРКА:
□ tsc --noEmit — без ошибок

КОММИТ:
git add -A && git commit -m "feat(backend): add base repository pattern"

ПОСЛЕ:
□ Отметь F3.7 как completed
□ git push origin main
□ Переходи к F4
```

### Критерии завершения F3
- [ ] Схема БД применена (15+ таблиц)
- [ ] Backend подключается к PostgreSQL
- [ ] Backend подключается к Redis
- [ ] Справочники заполнены (22 района, 69 станций метро)
- [ ] TypeScript модели созданы
- [ ] Базовый репозиторий работает

---

## F4: XML-ПАРСЕР

### Цель
Создать парсер XML-фида и импорт данных в БД.

### Контекст для чтения ПЕРЕД началом
```
ОБЯЗАТЕЛЬНО ПРОЧИТАЙ:
├── /CLAUDE.md                    — Правила работы
├── /SUMMARY.md                   — Структура XML-фида
├── /ТЗ_v2_расширенное.md         — Секция 4.13 (евро-форматы)
├── /database_schema.sql          — Таблицы offers, complexes, buildings, images
└── /DECOMPOSITION.md             — Секции "1.1 Парсер", "1.2 Импорт", "1.3 Евро-планировки"
```

### Саб-таски

#### F4.1 Создание типов для парсера
```
ЗАДАЧА: Определить интерфейсы для парсинга XML

ДО НАЧАЛА:
□ F3 полностью завершена
□ ПРОЧИТАЙ /SUMMARY.md полностью — там структура XML
□ Открой feeds/spb.xml и посмотри реальные данные (первые 500 строк)

ДЕЙСТВИЯ:
1. Создай backend/src/parsers/types.ts:

// Структура данных из XML-фида
export interface ParsedOffer {
  // Идентификаторы
  externalId: string;           // internal-id

  // Тип объявления
  type: string;                 // "продажа"
  propertyType: string;         // "жилая"
  category: string;             // "квартира"

  // Характеристики квартиры
  rooms: number;                // 0 = студия
  isStudio: boolean;
  areaTotal: number;
  areaLiving: number | null;
  areaKitchen: number | null;
  floor: number;
  floorsTotal: number;
  renovation: string | null;
  balcony: string | null;
  bathroomUnit: string | null;
  ceilingHeight: number | null;

  // Цена
  price: number;
  currency: string;
  mortgage: boolean;

  // Здание
  buildingName: string | null;  // <building-name>
  buildingType: string | null;  // <building-type>
  buildingState: string | null; // <building-state>
  builtYear: number | null;
  readyQuarter: number | null;

  // NMarket IDs (для связей)
  nmarketBuildingId: number | null;
  nmarketComplexId: number | null;

  // Местоположение
  address: string | null;
  district: string | null;
  latitude: number;
  longitude: number;

  // Метро
  metroName: string | null;
  metroTimeOnFoot: number | null;
  metroTimeOnTransport: number | null;

  // Контакты
  salesAgentPhone: string | null;
  salesAgentEmail: string | null;
  salesAgentOrganization: string | null;
  salesAgentCategory: string | null;

  // Описание
  description: string | null;

  // Изображения
  images: ParsedImage[];

  // Даты
  creationDate: Date | null;
  lastUpdateDate: Date | null;
}

export interface ParsedImage {
  tag: string | null;           // plan, housemain, floorplan, complexscheme
  url: string;
}

export interface ParseResult {
  offers: ParsedOffer[];
  totalParsed: number;
  errors: ParseError[];
  durationMs: number;
}

export interface ParseError {
  offerId: string | null;
  field: string;
  message: string;
  rawValue?: string;
}

ПРОВЕРКА:
□ tsc --noEmit — без ошибок

КОММИТ:
git add -A && git commit -m "feat(parser): add XML parser types"

ПОСЛЕ:
□ Отметь F4.1 как completed
```

#### F4.2 Потоковый XML-парсер
```
ЗАДАЧА: Создать парсер с использованием sax-js

ДО НАЧАЛА:
□ F4.1 завершена
□ Убедись что sax установлен: npm list sax (в backend)

ДЕЙСТВИЯ:
1. Создай backend/src/parsers/yandex-feed.parser.ts:

import * as fs from 'fs';
import * as sax from 'sax';
import { ParsedOffer, ParsedImage, ParseResult, ParseError } from './types';

export class YandexFeedParser {
  private currentOffer: Partial<ParsedOffer> | null = null;
  private currentElement: string = '';
  private currentText: string = '';
  private currentImageTag: string | null = null;
  private offers: ParsedOffer[] = [];
  private errors: ParseError[] = [];

  async parse(filePath: string): Promise<ParseResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      const parser = sax.createStream(true, { trim: true });

      parser.on('opentag', (node) => this.onOpenTag(node));
      parser.on('closetag', (tagName) => this.onCloseTag(tagName));
      parser.on('text', (text) => this.onText(text));
      parser.on('error', (err) => {
        this.errors.push({
          offerId: this.currentOffer?.externalId || null,
          field: 'xml',
          message: err.message,
        });
        // Продолжаем парсинг
        parser.resume();
      });

      parser.on('end', () => {
        resolve({
          offers: this.offers,
          totalParsed: this.offers.length,
          errors: this.errors,
          durationMs: Date.now() - startTime,
        });
      });

      stream.pipe(parser);
      stream.on('error', reject);
    });
  }

  private onOpenTag(node: sax.Tag): void {
    this.currentElement = node.name;
    this.currentText = '';

    if (node.name === 'offer') {
      this.currentOffer = {
        externalId: node.attributes['internal-id'] as string,
        images: [],
        type: 'продажа',
        propertyType: 'жилая',
        category: 'квартира',
        currency: 'RUR',
        isStudio: false,
        mortgage: false,
      };
    }

    if (node.name === 'image' && this.currentOffer) {
      this.currentImageTag = (node.attributes['tag'] as string) || null;
    }
  }

  private onCloseTag(tagName: string): void {
    if (!this.currentOffer) return;

    const text = this.currentText.trim();

    switch (tagName) {
      // Основные поля
      case 'type':
        this.currentOffer.type = text;
        break;
      case 'property-type':
        this.currentOffer.propertyType = text;
        break;
      case 'category':
        this.currentOffer.category = text;
        break;

      // Характеристики
      case 'rooms':
        this.currentOffer.rooms = parseInt(text, 10) || 0;
        this.currentOffer.isStudio = this.currentOffer.rooms === 0;
        break;
      case 'studio':
        if (text === 'true' || text === '1') {
          this.currentOffer.isStudio = true;
          this.currentOffer.rooms = 0;
        }
        break;
      case 'floor':
        this.currentOffer.floor = parseInt(text, 10) || 1;
        break;
      case 'floors-total':
        this.currentOffer.floorsTotal = parseInt(text, 10) || 1;
        break;
      case 'renovation':
        this.currentOffer.renovation = text || null;
        break;
      case 'balcony':
        this.currentOffer.balcony = text || null;
        break;
      case 'bathroom-unit':
        this.currentOffer.bathroomUnit = text || null;
        break;
      case 'ceiling-height':
        this.currentOffer.ceilingHeight = parseFloat(text) || null;
        break;

      // Площади (внутри <area>, <living-space>, <kitchen-space>)
      case 'value':
        if (this.currentElement === 'value') {
          // Определяем родительский элемент по контексту
          // Это упрощение — в реальности нужен стек элементов
        }
        break;
      case 'area':
        // Площадь приходит как вложенный <value>
        break;

      // Цена
      case 'price':
        // Цена тоже как вложенный <value>
        break;
      case 'mortgage':
        this.currentOffer.mortgage = text === 'true' || text === '1';
        break;

      // Здание
      case 'building-name':
        this.currentOffer.buildingName = text || null;
        break;
      case 'building-type':
        this.currentOffer.buildingType = text || null;
        break;
      case 'building-state':
        this.currentOffer.buildingState = text || null;
        break;
      case 'built-year':
        this.currentOffer.builtYear = parseInt(text, 10) || null;
        break;
      case 'ready-quarter':
        this.currentOffer.readyQuarter = parseInt(text, 10) || null;
        break;
      case 'nmarket-building-id':
        this.currentOffer.nmarketBuildingId = parseInt(text, 10) || null;
        break;
      case 'nmarket-complex-id':
        this.currentOffer.nmarketComplexId = parseInt(text, 10) || null;
        break;

      // Локация
      case 'address':
        this.currentOffer.address = text || null;
        break;
      case 'district':
        this.currentOffer.district = text || null;
        break;
      case 'latitude':
        this.currentOffer.latitude = parseFloat(text) || 0;
        break;
      case 'longitude':
        this.currentOffer.longitude = parseFloat(text) || 0;
        break;

      // Метро
      case 'name':
        // Может быть имя метро или имя агента
        // Нужен стек для правильного определения
        break;
      case 'time-on-foot':
        this.currentOffer.metroTimeOnFoot = parseInt(text, 10) || null;
        break;
      case 'time-on-transport':
        this.currentOffer.metroTimeOnTransport = parseInt(text, 10) || null;
        break;

      // Контакты
      case 'phone':
        this.currentOffer.salesAgentPhone = text || null;
        break;
      case 'email':
        this.currentOffer.salesAgentEmail = text?.trim() || null;
        break;
      case 'organization':
        this.currentOffer.salesAgentOrganization = text || null;
        break;

      // Описание
      case 'description':
        this.currentOffer.description = text || null;
        break;

      // Изображение
      case 'image':
        if (text && this.currentOffer.images) {
          this.currentOffer.images.push({
            tag: this.currentImageTag,
            url: text,
          });
        }
        this.currentImageTag = null;
        break;

      // Даты
      case 'creation-date':
        this.currentOffer.creationDate = text ? new Date(text) : null;
        break;
      case 'last-update-date':
        this.currentOffer.lastUpdateDate = text ? new Date(text) : null;
        break;

      // Конец offer
      case 'offer':
        if (this.currentOffer && this.validateOffer(this.currentOffer)) {
          this.offers.push(this.currentOffer as ParsedOffer);
        }
        this.currentOffer = null;
        break;
    }
  }

  private onText(text: string): void {
    this.currentText += text;
  }

  private validateOffer(offer: Partial<ParsedOffer>): boolean {
    // Минимальная валидация
    if (!offer.externalId) {
      this.errors.push({
        offerId: null,
        field: 'externalId',
        message: 'Missing internal-id',
      });
      return false;
    }

    if (!offer.price || offer.price <= 0) {
      // Попробуем извлечь цену из других полей
      this.errors.push({
        offerId: offer.externalId,
        field: 'price',
        message: 'Invalid or missing price',
      });
      return false;
    }

    if (!offer.areaTotal || offer.areaTotal <= 0) {
      this.errors.push({
        offerId: offer.externalId,
        field: 'areaTotal',
        message: 'Invalid or missing area',
      });
      return false;
    }

    return true;
  }
}

export const feedParser = new YandexFeedParser();

ПРОВЕРКА:
□ tsc --noEmit — без ошибок

КОММИТ:
git add -A && git commit -m "feat(parser): add basic XML parser structure"

ПОСЛЕ:
□ Отметь F4.2 как completed

ПРИМЕЧАНИЕ:
Это базовая версия парсера. В F4.3 мы его доработаем для корректной обработки
вложенных элементов (area/value, price/value, metro/name).
```

#### F4.3 Улучшенный парсер с контекстом
```
ЗАДАЧА: Доработать парсер для обработки вложенных элементов

ДО НАЧАЛА:
□ F4.2 завершена
□ Открой feeds/spb.xml и найди примеры:
  - <area><value>52.3</value><unit>кв. м</unit></area>
  - <price><value>9200000</value><currency>RUR</currency></price>
  - <metro><name>Невский проспект</name><time-on-foot>10</time-on-foot></metro>

ДЕЙСТВИЯ:
1. Замени backend/src/parsers/yandex-feed.parser.ts на улучшенную версию:

import * as fs from 'fs';
import * as sax from 'sax';
import { ParsedOffer, ParsedImage, ParseResult, ParseError } from './types';

export class YandexFeedParser {
  private currentOffer: Partial<ParsedOffer> | null = null;
  private elementStack: string[] = [];  // Стек элементов для контекста
  private currentText: string = '';
  private currentImageTag: string | null = null;
  private offers: ParsedOffer[] = [];
  private errors: ParseError[] = [];

  async parse(filePath: string): Promise<ParseResult> {
    // Сбрасываем состояние
    this.offers = [];
    this.errors = [];
    this.elementStack = [];

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      const parser = sax.createStream(true, { trim: true });

      parser.on('opentag', (node) => this.onOpenTag(node));
      parser.on('closetag', (tagName) => this.onCloseTag(tagName));
      parser.on('text', (text) => this.onText(text));
      parser.on('error', (err) => {
        this.errors.push({
          offerId: this.currentOffer?.externalId || null,
          field: 'xml',
          message: err.message,
        });
        parser.resume();
      });

      parser.on('end', () => {
        resolve({
          offers: this.offers,
          totalParsed: this.offers.length,
          errors: this.errors,
          durationMs: Date.now() - startTime,
        });
      });

      stream.pipe(parser);
      stream.on('error', reject);
    });
  }

  private getParentElement(): string | null {
    return this.elementStack.length > 1
      ? this.elementStack[this.elementStack.length - 2]
      : null;
  }

  private onOpenTag(node: sax.Tag): void {
    this.elementStack.push(node.name);
    this.currentText = '';

    if (node.name === 'offer') {
      this.currentOffer = {
        externalId: node.attributes['internal-id'] as string,
        images: [],
        type: 'продажа',
        propertyType: 'жилая',
        category: 'квартира',
        currency: 'RUR',
        isStudio: false,
        mortgage: false,
        rooms: 0,
        areaTotal: 0,
        floor: 1,
        floorsTotal: 1,
        price: 0,
        latitude: 0,
        longitude: 0,
      };
    }

    if (node.name === 'image' && this.currentOffer) {
      this.currentImageTag = (node.attributes['tag'] as string) || null;
    }
  }

  private onCloseTag(tagName: string): void {
    const text = this.currentText.trim();
    const parent = this.getParentElement();

    this.elementStack.pop();

    if (!this.currentOffer) return;

    // Обрабатываем с учётом родительского элемента
    switch (tagName) {
      // Значения с родителем
      case 'value':
        if (parent === 'area') {
          this.currentOffer.areaTotal = parseFloat(text) || 0;
        } else if (parent === 'living-space') {
          this.currentOffer.areaLiving = parseFloat(text) || null;
        } else if (parent === 'kitchen-space') {
          this.currentOffer.areaKitchen = parseFloat(text) || null;
        } else if (parent === 'price') {
          this.currentOffer.price = parseFloat(text) || 0;
        }
        break;

      case 'name':
        if (parent === 'metro') {
          this.currentOffer.metroName = text || null;
        }
        // sales-agent/name игнорируем
        break;

      // Прямые поля (без вложенности)
      case 'type':
        this.currentOffer.type = text;
        break;
      case 'property-type':
        this.currentOffer.propertyType = text;
        break;
      case 'category':
        this.currentOffer.category = text;
        break;
      case 'rooms':
        this.currentOffer.rooms = parseInt(text, 10) || 0;
        this.currentOffer.isStudio = this.currentOffer.rooms === 0;
        break;
      case 'studio':
        if (text === 'true' || text === '1') {
          this.currentOffer.isStudio = true;
          this.currentOffer.rooms = 0;
        }
        break;
      case 'floor':
        this.currentOffer.floor = parseInt(text, 10) || 1;
        break;
      case 'floors-total':
        this.currentOffer.floorsTotal = parseInt(text, 10) || 1;
        break;
      case 'renovation':
        this.currentOffer.renovation = text || null;
        break;
      case 'balcony':
        this.currentOffer.balcony = text || null;
        break;
      case 'bathroom-unit':
        this.currentOffer.bathroomUnit = text || null;
        break;
      case 'ceiling-height':
        this.currentOffer.ceilingHeight = parseFloat(text) || null;
        break;
      case 'mortgage':
        this.currentOffer.mortgage = text === 'true' || text === '1';
        break;

      // Здание
      case 'building-name':
        this.currentOffer.buildingName = text || null;
        break;
      case 'building-type':
        this.currentOffer.buildingType = text || null;
        break;
      case 'building-state':
        this.currentOffer.buildingState = text || null;
        break;
      case 'built-year':
        this.currentOffer.builtYear = parseInt(text, 10) || null;
        break;
      case 'ready-quarter':
        this.currentOffer.readyQuarter = parseInt(text, 10) || null;
        break;
      case 'nmarket-building-id':
        this.currentOffer.nmarketBuildingId = parseInt(text, 10) || null;
        break;
      case 'nmarket-complex-id':
        this.currentOffer.nmarketComplexId = parseInt(text, 10) || null;
        break;

      // Локация
      case 'address':
        this.currentOffer.address = text || null;
        break;
      case 'district':
        this.currentOffer.district = text || null;
        break;
      case 'latitude':
        this.currentOffer.latitude = parseFloat(text) || 0;
        break;
      case 'longitude':
        this.currentOffer.longitude = parseFloat(text) || 0;
        break;

      // Метро (вложенные в metro)
      case 'time-on-foot':
        if (parent === 'metro') {
          this.currentOffer.metroTimeOnFoot = parseInt(text, 10) || null;
        }
        break;
      case 'time-on-transport':
        if (parent === 'metro') {
          this.currentOffer.metroTimeOnTransport = parseInt(text, 10) || null;
        }
        break;

      // Контакты (вложенные в sales-agent)
      case 'phone':
        if (parent === 'sales-agent') {
          this.currentOffer.salesAgentPhone = text || null;
        }
        break;
      case 'email':
        if (parent === 'sales-agent') {
          this.currentOffer.salesAgentEmail = text?.trim() || null;
        }
        break;
      case 'organization':
        if (parent === 'sales-agent') {
          this.currentOffer.salesAgentOrganization = text || null;
        }
        break;
      case 'sales-agent-category':
        this.currentOffer.salesAgentCategory = text || null;
        break;

      // Описание
      case 'description':
        this.currentOffer.description = text || null;
        break;

      // Изображение
      case 'image':
        if (text && this.currentOffer.images) {
          this.currentOffer.images.push({
            tag: this.currentImageTag,
            url: text,
          });
        }
        this.currentImageTag = null;
        break;

      // Даты
      case 'creation-date':
        this.currentOffer.creationDate = text ? new Date(text) : null;
        break;
      case 'last-update-date':
        this.currentOffer.lastUpdateDate = text ? new Date(text) : null;
        break;

      // Конец offer
      case 'offer':
        if (this.currentOffer && this.validateOffer(this.currentOffer)) {
          this.offers.push(this.currentOffer as ParsedOffer);
        }
        this.currentOffer = null;
        break;
    }
  }

  private onText(text: string): void {
    this.currentText += text;
  }

  private validateOffer(offer: Partial<ParsedOffer>): boolean {
    const errors: ParseError[] = [];

    if (!offer.externalId) {
      errors.push({ offerId: null, field: 'externalId', message: 'Missing internal-id' });
    }
    if (!offer.price || offer.price <= 0) {
      errors.push({ offerId: offer.externalId || null, field: 'price', message: 'Invalid price' });
    }
    if (!offer.areaTotal || offer.areaTotal <= 0) {
      errors.push({ offerId: offer.externalId || null, field: 'areaTotal', message: 'Invalid area' });
    }
    if (!offer.latitude || !offer.longitude) {
      errors.push({ offerId: offer.externalId || null, field: 'coordinates', message: 'Missing coordinates' });
    }

    if (errors.length > 0) {
      this.errors.push(...errors);
      return false;
    }

    return true;
  }
}

export const feedParser = new YandexFeedParser();

ПРОВЕРКА:
□ tsc --noEmit — без ошибок

КОММИТ:
git add -A && git commit -m "feat(parser): improve XML parser with element context"

ПОСЛЕ:
□ Отметь F4.3 как completed
```

#### F4.4 Тестирование парсера
```
ЗАДАЧА: Проверить парсер на реальном фиде

ДО НАЧАЛА:
□ F4.3 завершена
□ Файл feeds/spb.xml существует

ДЕЙСТВИЯ:
1. Создай backend/src/parsers/test-parser.ts:

import { feedParser } from './yandex-feed.parser';
import * as path from 'path';

async function testParser() {
  const feedPath = path.join(__dirname, '../../../feeds/spb.xml');

  console.log('Starting parser test...');
  console.log('Feed path:', feedPath);

  try {
    const result = await feedParser.parse(feedPath);

    console.log('\n=== PARSE RESULTS ===');
    console.log('Total offers parsed:', result.totalParsed);
    console.log('Errors:', result.errors.length);
    console.log('Duration:', result.durationMs, 'ms');

    if (result.offers.length > 0) {
      console.log('\n=== SAMPLE OFFER ===');
      const sample = result.offers[0];
      console.log('ID:', sample.externalId);
      console.log('Building:', sample.buildingName);
      console.log('Rooms:', sample.rooms, sample.isStudio ? '(studio)' : '');
      console.log('Area:', sample.areaTotal, 'm²');
      console.log('Living:', sample.areaLiving, 'm²');
      console.log('Kitchen:', sample.areaKitchen, 'm²');
      console.log('Floor:', sample.floor, '/', sample.floorsTotal);
      console.log('Price:', sample.price.toLocaleString(), 'RUB');
      console.log('Price/m²:', Math.round(sample.price / sample.areaTotal).toLocaleString());
      console.log('District:', sample.district);
      console.log('Metro:', sample.metroName, sample.metroTimeOnFoot ? `(${sample.metroTimeOnFoot} min)` : '');
      console.log('Images:', sample.images.length);
      console.log('Renovation:', sample.renovation);
    }

    if (result.errors.length > 0) {
      console.log('\n=== FIRST 10 ERRORS ===');
      result.errors.slice(0, 10).forEach(err => {
        console.log(`- [${err.offerId || 'unknown'}] ${err.field}: ${err.message}`);
      });
    }

    // Статистика
    console.log('\n=== STATISTICS ===');
    const rooms = result.offers.reduce((acc, o) => {
      acc[o.rooms] = (acc[o.rooms] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    console.log('By rooms:', rooms);

    const withPlan = result.offers.filter(o =>
      o.images.some(img => img.tag === 'plan')
    ).length;
    console.log('With floor plan:', withPlan, `(${Math.round(withPlan / result.totalParsed * 100)}%)`);

  } catch (error) {
    console.error('Parser error:', error);
  }
}

testParser();

2. Запусти тест:
   cd backend
   npx ts-node src/parsers/test-parser.ts

ПРОВЕРКА:
□ Парсер завершается без краша
□ Показывает "Total offers parsed: 12000+" (примерно)
□ Sample offer показывает корректные данные
□ Ошибок меньше 5% от общего числа

КОММИТ:
git add -A && git commit -m "test(parser): add parser test script"

ПОСЛЕ:
□ Если много ошибок — исправь парсер и повтори
□ Отметь F4.4 как completed
```

#### F4.5 Детектор евро-планировок
```
ЗАДАЧА: Создать функцию определения евро-планировки

ДО НАЧАЛА:
□ F4.4 завершена
□ ПРОЧИТАЙ /ТЗ_v2_расширенное.md секцию 4.13 (Евро-форматы)
□ ПРОЧИТАЙ /DECOMPOSITION.md секцию "1.3 Определение евро-планировок"

ДЕЙСТВИЯ:
1. Создай backend/src/utils/euro-detector.ts:

export type RoomType =
  | 'studio'
  | 'room_1' | 'euro_1'
  | 'room_2' | 'euro_2'
  | 'room_3' | 'euro_3'
  | 'room_4_plus';

export interface EuroDetectionResult {
  isEuro: boolean;
  roomType: RoomType;
  confidence: number;  // 0-1
  reason: string;
}

interface EuroDetectionInput {
  rooms: number;
  areaTotal: number;
  areaLiving: number | null;
  areaKitchen: number | null;
  description: string | null;
}

// Ключевые слова для определения евро-планировки
const EURO_KEYWORDS = [
  'евро', 'euro', 'европланировка', 'евро-планировка',
  'кухня-гостиная', 'кухня гостиная', 'объединённая кухня',
  'объединенная кухня', 'кухня-столовая', 'совмещённая кухня',
];

export function detectEuroLayout(input: EuroDetectionInput): EuroDetectionResult {
  const { rooms, areaTotal, areaLiving, areaKitchen, description } = input;

  // Студия — не евро по определению
  if (rooms === 0) {
    return {
      isEuro: false,
      roomType: 'studio',
      confidence: 1.0,
      reason: 'Студия',
    };
  }

  // 4+ комнат — не различаем евро
  if (rooms >= 4) {
    return {
      isEuro: false,
      roomType: 'room_4_plus',
      confidence: 1.0,
      reason: '4+ комнат',
    };
  }

  // Проверка 1: По описанию (высокая уверенность)
  if (description) {
    const descLower = description.toLowerCase();
    const hasEuroKeyword = EURO_KEYWORDS.some(kw => descLower.includes(kw));

    if (hasEuroKeyword) {
      return {
        isEuro: true,
        roomType: getEuroRoomType(rooms),
        confidence: 0.95,
        reason: 'Ключевое слово в описании',
      };
    }
  }

  // Проверка 2: По площади кухни (кухня-гостиная > 12 м²)
  if (areaKitchen && areaKitchen > 12) {
    // Дополнительно проверяем соотношение
    if (areaLiving && areaKitchen / areaLiving > 0.5) {
      return {
        isEuro: true,
        roomType: getEuroRoomType(rooms),
        confidence: 0.85,
        reason: `Большая кухня (${areaKitchen} м²) + высокое соотношение к жилой`,
      };
    }

    // Просто большая кухня
    return {
      isEuro: true,
      roomType: getEuroRoomType(rooms),
      confidence: 0.7,
      reason: `Большая кухня (${areaKitchen} м²)`,
    };
  }

  // Проверка 3: По соотношению жилая/общая площадь
  // Евро обычно имеет меньше "жилой" площади (часть ушла в кухню-гостиную)
  if (areaLiving && areaTotal) {
    const livingRatio = areaLiving / areaTotal;

    // Для обычной квартиры: жилая ~55-65% от общей
    // Для евро: жилая ~40-50% от общей
    if (livingRatio < 0.45) {
      return {
        isEuro: true,
        roomType: getEuroRoomType(rooms),
        confidence: 0.6,
        reason: `Низкое соотношение жилой к общей (${Math.round(livingRatio * 100)}%)`,
      };
    }
  }

  // Не евро
  return {
    isEuro: false,
    roomType: getStandardRoomType(rooms),
    confidence: 0.7,
    reason: 'Не соответствует критериям евро-планировки',
  };
}

function getEuroRoomType(rooms: number): RoomType {
  switch (rooms) {
    case 1: return 'euro_1';
    case 2: return 'euro_2';
    case 3: return 'euro_3';
    default: return 'room_4_plus';
  }
}

function getStandardRoomType(rooms: number): RoomType {
  switch (rooms) {
    case 0: return 'studio';
    case 1: return 'room_1';
    case 2: return 'room_2';
    case 3: return 'room_3';
    default: return 'room_4_plus';
  }
}

// Форматирование для отображения
export function formatRoomType(roomType: RoomType): string {
  const labels: Record<RoomType, string> = {
    'studio': 'Студия',
    'room_1': '1-комн.',
    'euro_1': '1-комн. (евро)',
    'room_2': '2-комн.',
    'euro_2': '2-комн. (евро)',
    'room_3': '3-комн.',
    'euro_3': '3-комн. (евро)',
    'room_4_plus': '4+ комн.',
  };
  return labels[roomType];
}

ПРОВЕРКА:
□ tsc --noEmit — без ошибок

КОММИТ:
git add -A && git commit -m "feat(utils): add euro layout detector"

ПОСЛЕ:
□ Отметь F4.5 как completed
```

#### F4.6 Сервис импорта в БД
```
ЗАДАЧА: Создать сервис для сохранения данных в БД

ДО НАЧАЛА:
□ F4.5 завершена
□ Прочитай /DECOMPOSITION.md секцию "1.2 Импорт в базу данных"

ДЕЙСТВИЯ:
1. Создай backend/src/services/import.service.ts:

import db from '../config/database';
import { feedParser } from '../parsers/yandex-feed.parser';
import { ParsedOffer } from '../parsers/types';
import { detectEuroLayout, RoomType } from '../utils/euro-detector';

export interface ImportResult {
  totalInFeed: number;
  created: number;
  updated: number;
  deleted: number;
  errors: number;
  durationMs: number;
}

class ImportService {
  async importFeed(filePath: string): Promise<ImportResult> {
    const startTime = Date.now();

    console.log('Parsing feed...');
    const parseResult = await feedParser.parse(filePath);
    console.log(`Parsed ${parseResult.totalParsed} offers in ${parseResult.durationMs}ms`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Получаем текущие ID для определения удалённых
    const existingIds = await this.getExistingOfferIds();
    const processedIds = new Set<string>();

    // Обрабатываем пачками по 100
    const batchSize = 100;
    for (let i = 0; i < parseResult.offers.length; i += batchSize) {
      const batch = parseResult.offers.slice(i, i + batchSize);

      for (const offer of batch) {
        try {
          const result = await this.upsertOffer(offer);
          if (result === 'created') created++;
          else if (result === 'updated') updated++;
          processedIds.add(offer.externalId);
        } catch (error) {
          console.error(`Error importing offer ${offer.externalId}:`, error);
          errors++;
        }
      }

      // Логируем прогресс
      if ((i + batchSize) % 1000 === 0) {
        console.log(`Processed ${i + batchSize} / ${parseResult.offers.length}`);
      }
    }

    // Помечаем удалённые
    const deletedCount = await this.markDeleted(existingIds, processedIds);

    // Обновляем счётчики комплексов
    await this.updateComplexStats();

    return {
      totalInFeed: parseResult.totalParsed,
      created,
      updated,
      deleted: deletedCount,
      errors: errors + parseResult.errors.length,
      durationMs: Date.now() - startTime,
    };
  }

  private async getExistingOfferIds(): Promise<Set<string>> {
    const result = await db.query('SELECT id::text FROM offers WHERE is_active = true');
    return new Set(result.rows.map(r => r.id));
  }

  private async upsertOffer(parsed: ParsedOffer): Promise<'created' | 'updated'> {
    // 1. Upsert district
    const districtId = await this.upsertDistrict(parsed.district);

    // 2. Upsert metro
    const metroId = await this.upsertMetro(parsed.metroName);

    // 3. Upsert developer (из organization)
    const developerId = await this.upsertDeveloper(parsed.salesAgentOrganization);

    // 4. Upsert complex
    const complexId = await this.upsertComplex(parsed, developerId, districtId);

    // 5. Upsert building
    const buildingId = await this.upsertBuilding(parsed, complexId);

    // 6. Определяем евро-планировку
    const euroResult = detectEuroLayout({
      rooms: parsed.rooms,
      areaTotal: parsed.areaTotal,
      areaLiving: parsed.areaLiving,
      areaKitchen: parsed.areaKitchen,
      description: parsed.description,
    });

    // 7. Upsert offer
    const isNew = await this.upsertOfferRecord(
      parsed,
      complexId,
      buildingId,
      districtId,
      metroId,
      euroResult.roomType,
      euroResult.isEuro
    );

    // 8. Upsert images
    await this.upsertImages(parsed.externalId, parsed.images);

    return isNew ? 'created' : 'updated';
  }

  private async upsertDistrict(name: string | null): Promise<number | null> {
    if (!name) return null;

    const result = await db.query(`
      INSERT INTO districts (name, region)
      VALUES ($1, 'Санкт-Петербург')
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [name]);

    return result.rows[0]?.id || null;
  }

  private async upsertMetro(name: string | null): Promise<number | null> {
    if (!name) return null;

    // Ищем существующую станцию
    const existing = await db.query(
      'SELECT id FROM metro_stations WHERE name = $1 LIMIT 1',
      [name]
    );

    if (existing.rows[0]) {
      return existing.rows[0].id;
    }

    // Создаём новую
    const result = await db.query(`
      INSERT INTO metro_stations (name, line)
      VALUES ($1, NULL)
      ON CONFLICT (name, line) DO NOTHING
      RETURNING id
    `, [name]);

    return result.rows[0]?.id || null;
  }

  private async upsertDeveloper(organization: string | null): Promise<number | null> {
    if (!organization) return null;

    const result = await db.query(`
      INSERT INTO developers (name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `, [organization]);

    return result.rows[0]?.id || null;
  }

  private async upsertComplex(
    parsed: ParsedOffer,
    developerId: number | null,
    districtId: number | null
  ): Promise<number | null> {
    if (!parsed.buildingName) return null;

    // Используем nmarket-complex-id если есть, иначе генерируем из имени
    const complexId = parsed.nmarketComplexId ||
      Math.abs(this.hashCode(parsed.buildingName));

    const result = await db.query(`
      INSERT INTO complexes (id, name, developer_id, district_id, address)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        developer_id = COALESCE(EXCLUDED.developer_id, complexes.developer_id),
        district_id = COALESCE(EXCLUDED.district_id, complexes.district_id),
        updated_at = NOW()
      RETURNING id
    `, [complexId, parsed.buildingName, developerId, districtId, parsed.address]);

    return result.rows[0]?.id || null;
  }

  private async upsertBuilding(
    parsed: ParsedOffer,
    complexId: number | null
  ): Promise<number | null> {
    if (!complexId) return null;

    const buildingId = parsed.nmarketBuildingId ||
      Math.abs(this.hashCode(`${complexId}-${parsed.address}`));

    const result = await db.query(`
      INSERT INTO buildings (id, complex_id, building_type, building_state, floors_total, built_year, ready_quarter)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        building_type = COALESCE(EXCLUDED.building_type, buildings.building_type),
        building_state = COALESCE(EXCLUDED.building_state, buildings.building_state),
        floors_total = COALESCE(EXCLUDED.floors_total, buildings.floors_total),
        built_year = COALESCE(EXCLUDED.built_year, buildings.built_year),
        ready_quarter = COALESCE(EXCLUDED.ready_quarter, buildings.ready_quarter),
        updated_at = NOW()
      RETURNING id
    `, [
      buildingId,
      complexId,
      parsed.buildingType,
      parsed.buildingState,
      parsed.floorsTotal,
      parsed.builtYear,
      parsed.readyQuarter,
    ]);

    return result.rows[0]?.id || null;
  }

  private async upsertOfferRecord(
    parsed: ParsedOffer,
    complexId: number | null,
    buildingId: number | null,
    districtId: number | null,
    metroId: number | null,
    roomType: RoomType,
    isEuro: boolean
  ): Promise<boolean> {
    const offerId = parseInt(parsed.externalId, 10);

    const result = await db.query(`
      INSERT INTO offers (
        id, complex_id, building_id, district_id, metro_station_id,
        offer_type, property_type, category,
        rooms, is_studio, room_type, is_euro_layout,
        area_total, area_living, area_kitchen,
        floor, floors_total,
        renovation, balcony, bathroom_unit,
        price, currency, mortgage,
        address, coordinates, metro_time_on_foot,
        description,
        creation_date, last_update_date,
        is_active
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17,
        $18, $19, $20,
        $21, $22, $23,
        $24, ST_SetSRID(ST_MakePoint($25, $26), 4326), $27,
        $28,
        $29, $30,
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        complex_id = EXCLUDED.complex_id,
        building_id = EXCLUDED.building_id,
        district_id = EXCLUDED.district_id,
        metro_station_id = EXCLUDED.metro_station_id,
        rooms = EXCLUDED.rooms,
        is_studio = EXCLUDED.is_studio,
        room_type = EXCLUDED.room_type,
        is_euro_layout = EXCLUDED.is_euro_layout,
        area_total = EXCLUDED.area_total,
        area_living = EXCLUDED.area_living,
        area_kitchen = EXCLUDED.area_kitchen,
        floor = EXCLUDED.floor,
        floors_total = EXCLUDED.floors_total,
        renovation = EXCLUDED.renovation,
        balcony = EXCLUDED.balcony,
        bathroom_unit = EXCLUDED.bathroom_unit,
        price = EXCLUDED.price,
        mortgage = EXCLUDED.mortgage,
        address = EXCLUDED.address,
        coordinates = EXCLUDED.coordinates,
        metro_time_on_foot = EXCLUDED.metro_time_on_foot,
        description = EXCLUDED.description,
        last_update_date = EXCLUDED.last_update_date,
        is_active = true,
        updated_at = NOW()
      RETURNING (xmax = 0) AS is_new
    `, [
      offerId, complexId, buildingId, districtId, metroId,
      parsed.type, parsed.propertyType, parsed.category,
      parsed.rooms, parsed.isStudio, roomType, isEuro,
      parsed.areaTotal, parsed.areaLiving, parsed.areaKitchen,
      parsed.floor, parsed.floorsTotal,
      parsed.renovation, parsed.balcony, parsed.bathroomUnit,
      parsed.price, parsed.currency, parsed.mortgage,
      parsed.address, parsed.longitude, parsed.latitude, parsed.metroTimeOnFoot,
      parsed.description,
      parsed.creationDate, parsed.lastUpdateDate,
    ]);

    return result.rows[0]?.is_new || false;
  }

  private async upsertImages(offerId: string, images: { tag: string | null; url: string }[]): Promise<void> {
    const id = parseInt(offerId, 10);

    // Удаляем старые
    await db.query('DELETE FROM images WHERE offer_id = $1', [id]);

    // Вставляем новые
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await db.query(`
        INSERT INTO images (offer_id, tag, url, display_order)
        VALUES ($1, $2, $3, $4)
      `, [id, img.tag, img.url, i]);
    }
  }

  private async markDeleted(existingIds: Set<string>, processedIds: Set<string>): Promise<number> {
    const toDelete = [...existingIds].filter(id => !processedIds.has(id));

    if (toDelete.length === 0) return 0;

    await db.query(`
      UPDATE offers
      SET is_active = false, deleted_at = NOW()
      WHERE id = ANY($1::bigint[])
    `, [toDelete.map(id => parseInt(id, 10))]);

    return toDelete.length;
  }

  private async updateComplexStats(): Promise<void> {
    await db.query(`
      UPDATE complexes c SET
        min_price = sub.min_price,
        max_price = sub.max_price,
        avg_price_per_sqm = sub.avg_price_per_sqm,
        total_apartments = sub.total
      FROM (
        SELECT
          complex_id,
          MIN(price) as min_price,
          MAX(price) as max_price,
          AVG(price / area_total) as avg_price_per_sqm,
          COUNT(*) as total
        FROM offers
        WHERE is_active = true AND complex_id IS NOT NULL
        GROUP BY complex_id
      ) sub
      WHERE c.id = sub.complex_id
    `);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

export const importService = new ImportService();

2. Создай backend/src/services/index.ts:
   export { importService } from './import.service';

3. Создай тестовый скрипт backend/src/scripts/run-import.ts:

import * as path from 'path';
import { importService } from '../services/import.service';

async function runImport() {
  const feedPath = path.join(__dirname, '../../../feeds/spb.xml');

  console.log('Starting import...');
  console.log('Feed path:', feedPath);

  try {
    const result = await importService.importFeed(feedPath);

    console.log('\n=== IMPORT RESULTS ===');
    console.log('Total in feed:', result.totalInFeed);
    console.log('Created:', result.created);
    console.log('Updated:', result.updated);
    console.log('Deleted:', result.deleted);
    console.log('Errors:', result.errors);
    console.log('Duration:', result.durationMs, 'ms');
    console.log('Rate:', Math.round(result.totalInFeed / (result.durationMs / 1000)), 'offers/sec');

  } catch (error) {
    console.error('Import error:', error);
    process.exit(1);
  }

  process.exit(0);
}

runImport();

4. Запусти импорт:
   cd backend
   npx ts-node src/scripts/run-import.ts

ПРОВЕРКА:
□ Импорт завершается без критических ошибок
□ Created показывает ~12000
□ Проверь данные:
  docker-compose -f docker-compose.dev.yml exec postgres psql -U housler -c "SELECT COUNT(*) FROM offers WHERE is_active = true"

КОММИТ:
git add -A && git commit -m "feat(import): add import service with euro detection"

ПОСЛЕ:
□ Отметь F4.6 как completed
□ git push origin main
□ Переходи к F5
```

### Критерии завершения F4
- [ ] XML-парсер работает корректно
- [ ] Все 12000+ объектов импортируются
- [ ] Евро-планировки определяются
- [ ] Данные в БД корректны (проверь несколько записей)
- [ ] Изображения сохранены

---

## ПРОДОЛЖЕНИЕ В ЧАСТИ 2

Документ разбит на части из-за размера. См.:
- PHASE_1_PLAN_PART2.md — Фичи F5-F7 (API, Frontend, Поиск)
- PHASE_1_PLAN_PART3.md — Фичи F8-F10 (Карточка, Авторизация, Бронирование)

---

## QUICK REFERENCE

### Порядок запуска
```bash
# 1. БД и Redis
docker-compose -f docker-compose.dev.yml up -d

# 2. Backend (в отдельном терминале)
cd backend && npm run dev

# 3. Frontend (в отдельном терминале)
cd frontend && npm run dev

# 4. Импорт фида (один раз)
cd backend && npx ts-node src/scripts/run-import.ts
```

### Проверка состояния
```bash
# Статус контейнеров
docker-compose -f docker-compose.dev.yml ps

# Количество объектов в БД
docker-compose -f docker-compose.dev.yml exec postgres psql -U housler -c "SELECT COUNT(*) FROM offers WHERE is_active = true"

# Логи
docker-compose -f docker-compose.dev.yml logs -f postgres
```

### Откат при проблемах
```bash
# Сбросить изменения в коде
git stash && git checkout .

# Пересоздать БД
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```
