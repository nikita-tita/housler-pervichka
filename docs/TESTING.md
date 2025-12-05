# Руководство по тестированию — Housler

> Стратегия, инструменты и процессы тестирования проекта.

**Последнее обновление:** 2024-12-05

---

## Содержание

1. [Обзор](#обзор)
2. [Unit тесты (Backend)](#unit-тесты-backend)
3. [E2E тесты (Frontend)](#e2e-тесты-frontend)
4. [Тестовые данные](#тестовые-данные)
5. [Написание новых тестов](#написание-новых-тестов)
6. [CI/CD интеграция](#cicd-интеграция)
7. [Чеклисты](#чеклисты)

---

## Обзор

### Структура тестирования

```
├── backend/
│   ├── src/__tests__/           # Unit тесты
│   │   ├── setup.ts             # Настройка Jest (моки БД)
│   │   ├── auth.service.test.ts # Тесты AuthService
│   │   └── selections.service.test.ts
│   ├── jest.config.ts           # Конфигурация Jest
│   └── .env.test                # Переменные для тестов
│
├── frontend/
│   ├── e2e/                     # E2E тесты Playwright
│   │   ├── auth.spec.ts         # Авторизация
│   │   ├── catalog.spec.ts      # Каталог
│   │   ├── favorites.spec.ts    # Избранное
│   │   ├── navigation.spec.ts   # Навигация
│   │   └── selection.spec.ts    # Подборки
│   └── playwright.config.ts     # Конфигурация Playwright
│
└── database/migrations/
    └── 010_test_data.sql        # Тестовые данные
```

### Инструменты

| Тип | Инструмент | Версия |
|-----|------------|--------|
| Unit тесты | Jest + ts-jest | ^29.7.0 |
| E2E тесты | Playwright | ^1.57.0 |
| Мокирование | Jest mocks | встроен |
| Покрытие | Jest coverage | встроен |

---

## Unit тесты (Backend)

### Запуск

```bash
cd backend

# Все тесты
npm test

# С покрытием
npm test -- --coverage

# Конкретный файл
npm test -- auth.service.test.ts

# Watch режим
npm test -- --watch
```

### Конфигурация (jest.config.ts)

```typescript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  clearMocks: true,
  maxWorkers: 1  // Последовательно из-за моков БД
}
```

### Setup файл (setup.ts)

Автоматически мокает:
- `pool` (database) — избегаем реальных запросов к БД
- `logger` — не спамим в консоль

```typescript
// src/__tests__/setup.ts
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  }
}));
```

### Структура теста (AAA паттерн)

```typescript
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
  });

  describe('requestCode', () => {
    it('should generate and save auth code', async () => {
      // Arrange — подготовка моков
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })  // проверка существующего
        .mockResolvedValueOnce({ rows: [] }); // insert

      // Act — выполнение
      const result = await service.requestCode('test@test.ru');

      // Assert — проверка
      expect(result.success).toBe(true);
      expect(result.message).toBe('Код отправлен на email');
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });
});
```

### Мокирование JWT

```typescript
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked-jwt-token'),
  verify: jest.fn(() => ({ userId: 1, email: 'test@test.ru', role: 'client' }))
}));
```

---

## E2E тесты (Frontend)

### Запуск

```bash
cd frontend

# Все тесты (headless)
npm run test:e2e

# С UI браузера
npm run test:e2e:ui

# Отчёт после выполнения
npm run test:e2e:report

# Конкретный файл
npx playwright test auth.spec.ts

# Конкретный тест
npx playwright test -g "TC-AUTH-001"
```

### Конфигурация (playwright.config.ts)

```typescript
{
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,

  use: {
    baseURL: 'https://agent.housler.ru',  // Тестирование на проде
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],

  timeout: 60000,
}
```

### Структура E2E теста

```typescript
import { test, expect } from '@playwright/test';

test.describe('Авторизация', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('TC-AUTH-001: Вход клиента', async ({ page }) => {
    // Navigate
    await page.goto('/login');

    // Fill form
    await page.fill('input[type="email"]', 'client@test.housler.ru');
    await page.click('button:has-text("Получить код")');

    // Handle permanent code button
    const permanentCodeBtn = page.locator('text=постоянный код');
    if (await permanentCodeBtn.isVisible()) {
      await permanentCodeBtn.click();
    }

    // Enter code
    await page.fill('input[type="text"]', '111111');
    await page.click('button:has-text("Войти")');

    // Assert redirect
    await page.waitForURL((url) => !url.pathname.includes('/login'));
    expect(page.url()).not.toContain('/login');
  });
});
```

### Селекторы (приоритет)

```typescript
// ✅ Лучше — по тексту
await page.click('button:has-text("Войти")');
await page.locator('text=Подборки');

// ✅ Хорошо — по data-testid (когда добавлены)
await page.locator('[data-testid="login-button"]');

// ⚠️ Допустимо — по типу/placeholder
await page.fill('input[type="email"]', 'test@test.ru');

// ❌ Избегать — по классам
await page.click('.btn-primary');  // Хрупко
```

---

## Тестовые данные

### Тестовые аккаунты

Все тестовые аккаунты определены в `database/migrations/010_test_data.sql`.

| Роль | Email / Телефон | Пароль/Код | Страница входа |
|------|-----------------|------------|----------------|
| Клиент | client@test.housler.ru | 111111 | /login/client |
| Частный риелтор | +7 (999) 911-11-11 | 111111-333333 | /login/realtor |
| Агент агентства | agent2@test.housler.ru | test123 | /login/agency |
| Админ агентства | admin@test.housler.ru | test123 | /login/agency |

### Правила тестовых аккаунтов

```
Email @test.housler.ru → коды 111111-666666 (не истекают)
Телефоны 79999* → коды 111111-333333 (без проверки в БД)
```

### Добавление тестовых данных

```sql
-- database/migrations/010_test_data.sql

INSERT INTO users (email, role, is_active)
VALUES ('newtest@test.housler.ru', 'client', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

INSERT INTO auth_codes (email, code, expires_at)
VALUES ('newtest@test.housler.ru', '111111', '2099-12-31 23:59:59')
ON CONFLICT DO NOTHING;
```

---

## Написание новых тестов

### Когда писать тесты

| Обязательно | Опционально |
|-------------|-------------|
| Новая бизнес-логика | Простые геттеры |
| Исправление бага | Обёртки над библиотеками |
| Критичные пути (auth, payment) | Конфигурация |
| Сложные алгоритмы | UI компоненты без логики |

### Именование тестов

```typescript
// Формат: что_когда_ожидаемый_результат
'should generate auth code when email is valid'
'should reject if code already sent recently'
'should create new user if not exists'

// E2E: TC-MODULE-XXX: Описание
'TC-AUTH-001: Вход клиента'
'TC-FAV-002: Удаление из избранного'
```

### Шаблон Unit теста

```typescript
// src/__tests__/myservice.test.ts
import { MyService } from '../services/my.service';
import { pool } from '../config/database';

const mockPool = pool as jest.Mocked<typeof pool>;

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something when condition', async () => {
      // Arrange
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [...] });

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(result).toEqual(expected);
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [input]);
    });

    it('should handle error case', async () => {
      // Arrange
      (mockPool.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      // Act & Assert
      await expect(service.methodName(input)).rejects.toThrow('DB error');
    });
  });
});
```

### Шаблон E2E теста

```typescript
// frontend/e2e/myfeature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Setup...
  });

  test('TC-FEAT-001: Should do something', async ({ page }) => {
    // Navigate
    await page.goto('/feature');

    // Interact
    await page.fill('input[name="field"]', 'value');
    await page.click('button:has-text("Submit")');

    // Assert
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

---

## CI/CD интеграция

### GitHub Actions (пример)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install backend deps
        run: cd backend && npm ci

      - name: Run unit tests
        run: cd backend && npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install frontend deps
        run: cd frontend && npm ci

      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: cd frontend && npm run test:e2e

      - name: Upload report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## Чеклисты

### Перед коммитом

```
□ npm test проходит без ошибок
□ Новый код покрыт тестами (если применимо)
□ E2E тесты не сломаны
□ Нет console.log в тестах
□ Тесты не зависят от порядка выполнения
```

### Новая фича

```
□ Unit тесты для сервисов
□ E2E тест для основного сценария
□ Тестовые данные добавлены (если нужны)
□ Документация обновлена
```

### Исправление бага

```
□ Написан тест воспроизводящий баг (RED)
□ Баг исправлен (GREEN)
□ Тест проходит
□ Регрессионный тест добавлен
```

---

## Частые проблемы

### Jest: "Cannot find module"

```bash
# Убедиться что setup.ts загружается
# jest.config.ts
setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
```

### Playwright: Timeout

```typescript
// Увеличить таймаут для медленных операций
await page.waitForSelector('.element', { timeout: 30000 });

// Или в конфиге
use: {
  actionTimeout: 15000,
}
```

### Playwright: Element not visible

```typescript
// Дождаться появления
await expect(page.locator('.element')).toBeVisible({ timeout: 10000 });

// Или прокрутить к элементу
await page.locator('.element').scrollIntoViewIfNeeded();
```

### Mock не работает

```typescript
// Убедиться что мок объявлен ДО импорта модуля
jest.mock('../config/database', () => ({ ... }));

// И что jest.clearAllMocks() вызывается в beforeEach/afterEach
```

---

## Покрытие кода

### Минимальные пороги (рекомендуемые)

| Метрика | Порог |
|---------|-------|
| Statements | 60% |
| Branches | 50% |
| Functions | 60% |
| Lines | 60% |

### Просмотр отчёта

```bash
cd backend
npm test -- --coverage

# Отчёт в coverage/lcov-report/index.html
open coverage/lcov-report/index.html
```

### Исключения из покрытия

```typescript
// jest.config.ts
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/**/*.d.ts',    // Типы
  '!src/cli/**',        // CLI скрипты
  '!src/index.ts'       // Точка входа
]
```
