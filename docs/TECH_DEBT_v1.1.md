# Технический долг и план улучшений

**Версия:** 1.2
**Дата:** 03.12.2025
**Проект:** Housler Новостройки (agent.housler.ru)

---

## Changelog

### v1.2 (03.12.2025)
- [x] Гостевой интерфейс для клиентов (Guest Mode)
- [x] Миграция 009_guest_booking применена
- [x] Деплой на production

### v1.1 (03.12.2025)
- [x] Добавлен фикс IPv6 rate limiter (ERR_ERL_KEY_GEN_IPV6)
- [x] Унифицированы поля API /favorites
- [x] Исправлен SQL-запрос favorites (удалены несуществующие колонки)

### v1.0 (02.12.2025)
- Первоначальная версия документа

---

## 1. Критичный техдолг

### 1.1 Несоответствие типов API — ЧАСТИЧНО РЕШЕНО

**Проблема:**
Backend возвращает числовые поля как строки из PostgreSQL:
```json
{
  "price": "20336957.00",    // string, ожидается number
  "area_total": "66.30"      // string, ожидается number
}
```

**Статус:**
- [x] selections.service.ts — исправлено (приведение типов)
- [x] favorites.service.ts — исправлено (унификация полей)
- [ ] offers.service.ts — требует проверки

**Приоритет:** Medium (большая часть исправлена)

---

### 1.2 Колонка status в selection_items — ГОТОВО

**Проблема:** ~~Статус элемента подборки захардкожен как `'pending'`~~

**Статус:** ✅ Исправлено в миграции 007

---

## 2. Выполненные улучшения (Спринт 1-3)

### 2.1 Rate Limiting — ГОТОВО ✅

**Файл:** `backend/src/middleware/rate-limit.middleware.ts`

**Реализовано:**
- `authLimiter` — 10 запросов / 15 минут на auth endpoints
- `verifyCodeLimiter` — 5 попыток / 5 минут на ввод кода
- `apiLimiter` — 100 запросов / минута общий лимит
- IPv6 нормализация (маскирование /64 подсети)

**Исправлено в v1.1:**
- Warning `ERR_ERL_KEY_GEN_IPV6` — добавлены функции `normalizeIp()` и `getClientIp()`

---

### 2.2 Структурированное логирование — ГОТОВО ✅

**Файл:** `backend/src/utils/logger.ts`

Используется Winston с форматом JSON для production.

---

### 2.3 Sentry интеграция — ГОТОВО ✅

**Файлы:**
- `backend/src/index.ts` — Sentry.init()
- `frontend/src/app/error.tsx` — Sentry error boundary

---

### 2.4 Zod валидация — ГОТОВО ✅

**Файлы:**
- `backend/src/validation/schemas.ts`
- `backend/src/validation/middleware.ts`

---

### 2.5 Unit тесты — ГОТОВО ✅

**Покрытие:** 33 теста
- `backend/src/__tests__/selections.service.test.ts`
- `backend/src/__tests__/auth.service.test.ts`

---

### 2.6 E2E тесты — ГОТОВО ✅

**Покрытие:** 22 теста (Playwright)
- `frontend/e2e/catalog.spec.ts`
- `frontend/e2e/auth.spec.ts`

---

## 3. Оставшийся техдолг

### 3.1 Устаревшие зависимости

**Проблема:**
```
npm warn deprecated rimraf@3.0.2
npm warn deprecated glob@7.2.3
npm warn deprecated eslint@8.57.1
```

**Решение:** Обновить зависимости в следующем спринте

**Приоритет:** Low

---

### 3.2 Docker Compose version warning

**Проблема:**
```
level=warning msg="docker-compose.prod.yml: the attribute `version` is obsolete"
```

**Файл:** `docker-compose.prod.yml`

**Решение:** Удалить атрибут `version` из docker-compose файлов

**Приоритет:** Low

---

### 3.3 Типизация offers.service.ts

**Проблема:**
Некоторые числовые поля могут возвращаться как строки.

**Решение:**
Проверить и добавить `::float` / `::int` cast в SQL запросах.

**Приоритет:** Medium

---

## 4. Правила деплоя

**ВАЖНО: Не трогать `/root/ai-calendar-assistant/`**

```bash
# Безопасный деплой agent.housler.ru:
ssh housler-server "cd /var/www/agent.housler.ru && git pull && docker compose -f docker-compose.prod.yml up -d --build"

# Принудительная пересборка backend (после изменения middleware):
ssh housler-server "cd /var/www/agent.housler.ru && docker compose -f docker-compose.prod.yml build --no-cache backend && docker compose -f docker-compose.prod.yml up -d backend"

# Если нужен restart nginx:
ssh housler-server "cd /var/www/agent.housler.ru && docker compose -f docker-compose.prod.yml restart nginx"

# ЗАПРЕЩЕНО:
# docker system prune -a
# docker stop $(docker ps -q)
# docker volume prune
```

---

## 5. Мониторинг

### Логи backend:
```bash
ssh housler-server "docker logs agent-backend --tail 50"
```

### Проверка health:
```bash
curl https://agent.housler.ru/health
```

### Проверка API:
```bash
curl -s "https://agent.housler.ru/api/offers?limit=1" | jq '.success'
```

---

*Документ обновлён: 03.12.2025*
