# Технический долг и план улучшений

**Версия:** 1.0
**Дата:** 02.12.2025
**Проект:** Housler Первичка (agent.housler.ru)

---

## 1. Критичный техдолг

### 1.1 Несоответствие типов API

**Проблема:**
Backend возвращает числовые поля как строки из PostgreSQL:
```json
{
  "price": "20336957.00",    // string, ожидается number
  "area_total": "66.30"      // string, ожидается number
}
```

**Файлы:**
- `backend/src/services/selections.service.ts:192-268`
- `backend/src/services/offers.service.ts`

**Решение:**
```sql
SELECT
  o.price::float as price,
  o.area_total::float as area_total
```

**Приоритет:** High
**Оценка:** 2-3 часа

---

### 1.2 Отсутствует колонка status в selection_items

**Проблема:**
Статус элемента подборки захардкожен как `'pending'`:
```typescript
// backend/src/services/selections.service.ts:233
status: 'pending', // TODO: добавить колонку status в миграцию
```

**Решение:**
1. Миграция:
```sql
ALTER TABLE selection_items
ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
```
2. Обновить SQL запрос в `getSelectionItems()`

**Приоритет:** Medium
**Оценка:** 1 час

---

## 2. Важные улучшения

### 2.1 Структурированное логирование

**Проблема:**
Используется `console.error()` вместо структурированного логгера.

**Файлы:**
- `backend/src/services/selections.service.ts:315,475,527`
- Все сервисы

**Решение:**
Внедрить `pino` или `winston`:
```typescript
import { logger } from '../utils/logger';
logger.error({ err, selectionId }, 'Failed to add selection item');
```

**Приоритет:** Medium
**Оценка:** 4-6 часов

---

### 2.2 Обработка ошибок на frontend

**Проблема:**
Пользователь видит "Что-то пошло не так" без деталей.

**Файлы:**
- `frontend/src/app/error.tsx`
- `frontend/src/app/s/[code]/page.tsx:40`

**Решение:**
Toast уведомления с понятными сообщениями + Sentry интеграция.

**Приоритет:** Medium
**Оценка:** 4 часа

---

## 3. Безопасность

### 3.1 Rate Limiting

**Проблема:**
Нет защиты от брутфорса на `/api/auth/*`.

**Файл:** `backend/src/index.ts`

**Решение:**
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток
  message: { error: 'Слишком много попыток. Попробуйте позже.' }
});

app.use('/api/auth', authLimiter);
```

**Приоритет:** High
**Оценка:** 1-2 часа

---

### 3.2 Валидация входных данных

**Проблема:**
Нет строгой валидации body/params в контроллерах.

**Решение:**
Zod схемы:
```typescript
import { z } from 'zod';

const createSelectionSchema = z.object({
  name: z.string().min(1).max(255),
  clientEmail: z.string().email().optional(),
  clientName: z.string().max(255).optional(),
});
```

**Приоритет:** Medium
**Оценка:** 6-8 часов

---

## 4. Тестирование

### 4.1 Unit тесты

**Проблема:**
Нет тестов. Любой рефакторинг может сломать функционал.

**Покрытие (приоритет):**
1. `selections.service.ts` — критический (подборки)
2. `auth.service.ts` — критический (авторизация)
3. `offers.service.ts` — high (поиск)

**Решение:**
Jest + supertest:
```typescript
describe('SelectionsService', () => {
  it('should return selection items with correct structure', async () => {
    const result = await service.getSelectionByShareCode('test-demo-2024');
    expect(result.items[0]).toHaveProperty('price');
    expect(typeof result.items[0].price).toBe('number');
  });
});
```

**Приоритет:** High
**Оценка:** 16-24 часа

---

### 4.2 E2E тесты

**Проблема:**
Нет автоматической проверки критических путей.

**Сценарии:**
1. Авторизация клиента/агента
2. Просмотр публичной подборки
3. Создание подборки агентом
4. Добавление в избранное

**Решение:**
Playwright:
```typescript
test('public selection page loads', async ({ page }) => {
  await page.goto('/s/test-demo-2024');
  await expect(page.locator('h1')).toContainText('Тестовая подборка');
  await expect(page.locator('.card')).toHaveCount(5);
});
```

**Приоритет:** Medium
**Оценка:** 8-12 часов

---

## 5. Мониторинг

### 5.1 Error Tracking (Sentry)

**Проблема:**
Нет алертов о 5xx ошибках на проде.

**Решение:**
```typescript
// backend/src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

**Приоритет:** High
**Оценка:** 2-3 часа

---

### 5.2 Uptime Monitoring

**Проблема:**
Нет оповещений о падении сервиса.

**Решение:**
- UptimeRobot (бесплатно) или Better Uptime
- Health check endpoint: `GET /health`

**Приоритет:** Medium
**Оценка:** 1 час

---

## 6. Roadmap по приоритетам

### Спринт 1 (срочно) — ВЫПОЛНЕНО:
1. [x] Исправить BUG-001, BUG-002 — готово
2. [x] Rate limiting на auth — готово (rate-limit.middleware.ts)
3. [x] Sentry интеграция — готово (backend + frontend)

### Спринт 2 (важно) — ВЫПОЛНЕНО:
4. [x] Приведение типов в API (string → number) — готово (selections.service.ts)
5. [x] Структурированное логирование — готово (winston logger)
6. [ ] Unit тесты для selections.service

### Спринт 3 (улучшения):
7. [ ] Zod валидация
8. [ ] E2E тесты
9. [x] Колонка status в selection_items — готово (миграция 007)

---

## 7. Правила деплоя

⚠️ **ВАЖНО: Не трогать `/root/ai-calendar-assistant/`**

```bash
# Безопасный деплой agent.housler.ru:
ssh housler-server "cd /var/www/agent.housler.ru && git pull && docker compose -f docker-compose.prod.yml up -d --build"

# Если нужен restart nginx (после изменения IP контейнера):
ssh housler-server "cd /var/www/agent.housler.ru && docker compose -f docker-compose.prod.yml restart nginx"

# ЗАПРЕЩЕНО:
# docker system prune -a
# docker stop $(docker ps -q)
# docker volume prune
```

---

*Документ обновлён: 02.12.2025*
