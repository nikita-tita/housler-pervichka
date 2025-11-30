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
