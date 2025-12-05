# API Conventions — Housler

> Стандарт форматирования API ответов и запросов.
> Все новые endpoints должны следовать этим соглашениям.

**Последнее обновление:** 2024-12-05

---

## Содержание

1. [Формат ответов](#формат-ответов)
2. [HTTP статус коды](#http-статус-коды)
3. [Пагинация](#пагинация)
4. [Обработка ошибок](#обработка-ошибок)
5. [Валидация](#валидация)
6. [Именование](#именование)
7. [Текущие отклонения](#текущие-отклонения)

---

## Формат ответов

### Успешный ответ (одиночный объект)

```typescript
// ✅ ПРАВИЛЬНО
res.json({
  success: true,
  data: {
    id: 1,
    name: "Example",
    // ...остальные поля
  }
});

// ❌ НЕПРАВИЛЬНО — поля на корневом уровне
res.json({
  success: true,
  id: 1,
  name: "Example"
});

// ❌ НЕПРАВИЛЬНО — другое имя вместо data
res.json({
  success: true,
  user: { id: 1 }  // должно быть data: { id: 1 }
});
```

### Успешный ответ (список с пагинацией)

```typescript
// ✅ ПРАВИЛЬНО — pagination внутри data
res.json({
  success: true,
  data: {
    items: [...],
    pagination: {
      page: 1,
      perPage: 20,
      total: 100,
      totalPages: 5
    }
  }
});

// ⚠️ ДОПУСТИМО (legacy) — pagination на корневом уровне
// Используется в admin.controller.ts, complexes.controller.ts
res.json({
  success: true,
  data: [...],
  pagination: {
    total: 100,
    limit: 50,
    offset: 0
  }
});

// ❌ НЕПРАВИЛЬНО — spread вместо data
res.json({
  success: true,
  ...result  // items и pagination "размазаны" по корню
});
```

### Успешный ответ (простое сообщение)

```typescript
// ✅ ПРАВИЛЬНО
res.json({
  success: true,
  message: "Операция выполнена"
});
```

### Ответ с ошибкой

```typescript
// ✅ ПРАВИЛЬНО
res.status(400).json({
  success: false,
  error: "Описание ошибки на русском"
});

// ❌ НЕПРАВИЛЬНО — message вместо error
res.json({
  success: false,
  message: "Ошибка"  // должно быть error
});
```

---

## HTTP статус коды

| Код | Когда использовать |
|-----|-------------------|
| `200` | Успешный GET, PATCH, DELETE |
| `201` | Успешный POST (создание ресурса) |
| `400` | Ошибка валидации, неверные данные |
| `401` | Не авторизован |
| `403` | Нет прав доступа |
| `404` | Ресурс не найден |
| `409` | Конфликт (дубликат) |
| `429` | Too many requests (rate limit) |
| `500` | Внутренняя ошибка сервера |

### Примеры

```typescript
// 201 — создание
res.status(201).json({ success: true, data: newUser });

// 400 — валидация
res.status(400).json({ success: false, error: 'Email обязателен' });

// 401 — не авторизован
res.status(401).json({ success: false, error: 'Не авторизован' });

// 404 — не найдено
res.status(404).json({ success: false, error: 'Пользователь не найден' });
```

---

## Пагинация

### Стандартные параметры запроса

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `page` | number | 1 | Номер страницы (начиная с 1) |
| `per_page` | number | 20 | Элементов на странице (макс. 100) |
| `sort_by` | string | varies | Поле сортировки |
| `sort_order` | 'asc' \| 'desc' | 'desc' | Направление сортировки |

### Альтернативные параметры (legacy)

| Параметр | Эквивалент |
|----------|------------|
| `limit` | `per_page` |
| `offset` | `(page - 1) * per_page` |

### Формат ответа пагинации

```typescript
// Целевой формат (новые endpoints)
{
  success: true,
  data: {
    items: [...],
    pagination: {
      page: 1,
      perPage: 20,
      total: 156,
      totalPages: 8
    }
  }
}

// Legacy формат (существующие endpoints)
{
  success: true,
  data: [...],
  pagination: {
    total: 156,
    limit: 20,
    offset: 0
  }
}
```

---

## Обработка ошибок

### Структура try-catch в контроллере

```typescript
export async function getResource(req: Request, res: Response) {
  try {
    // Валидация входных данных
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный ID'
      });
    }

    // Бизнес-логика
    const resource = await service.getById(id);

    // Проверка результата
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Ресурс не найден'
      });
    }

    // Успешный ответ
    res.json({
      success: true,
      data: resource
    });

  } catch (error) {
    // Логирование (без деталей в ответ клиенту)
    console.error('Error in getResource:', error);

    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
}
```

### Сообщения об ошибках

- Пишем на **русском** для пользователя
- **Не раскрываем** детали реализации
- **Не включаем** stack trace в production

```typescript
// ✅ ПРАВИЛЬНО
{ error: 'Пользователь не найден' }
{ error: 'Неверный код авторизации' }
{ error: 'Email уже зарегистрирован' }

// ❌ НЕПРАВИЛЬНО
{ error: 'SELECT * FROM users WHERE id = 123 returned 0 rows' }
{ error: err.message }  // может содержать детали БД
```

---

## Валидация

### Использование Zod

```typescript
import { z } from 'zod';

// Схема валидации
const createUserSchema = z.object({
  email: z.string().email('Некорректный email'),
  name: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  role: z.enum(['client', 'agent', 'agency_admin', 'admin'])
});

// Middleware валидации
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.errors[0].message
      });
    }
    req.body = result.data;
    next();
  };
}
```

### Валидация параметров пути

```typescript
// Схема для ID
const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive())
});

// Использование в роутере
router.get('/:id', validateParams(idParamSchema), getById);
```

---

## Именование

### URL endpoints

```
# Коллекции — множественное число
GET    /api/users
GET    /api/offers
GET    /api/agencies

# Один ресурс — по ID
GET    /api/users/:id
GET    /api/offers/:id

# Вложенные ресурсы
GET    /api/users/:id/favorites
GET    /api/offers/:id/price-history

# Действия — глаголы в конце
POST   /api/auth/request-code
POST   /api/auth/verify-code
POST   /api/auth/login-agency
```

### Query параметры — snake_case

```
?per_page=20
?sort_by=created_at
?sort_order=desc
?price_min=1000000
?price_max=5000000
?is_active=true
```

### JSON поля — snake_case

```json
{
  "user_id": 1,
  "created_at": "2024-01-01",
  "is_active": true,
  "agency_id": null
}
```

---

## Текущие отклонения

> Эти endpoints не соответствуют стандарту и требуют исправления.
> См. [TECH_DEBT.md](./TECH_DEBT.md) для полного списка.

### API-001: Spread вместо data wrapper

**Файл:** `backend/src/api/controllers/offers.controller.ts:51-54`

```typescript
// Текущий код (НЕПРАВИЛЬНО)
res.json({
  success: true,
  ...result  // items, pagination на корневом уровне
});

// Целевой код
res.json({
  success: true,
  data: result
});
```

### API-002: user вместо data

**Файл:** `backend/src/api/controllers/auth.controller.ts:131-134`

```typescript
// Текущий код (НЕПРАВИЛЬНО)
res.json({
  success: true,
  user: updatedUser
});

// Целевой код
res.json({
  success: true,
  data: updatedUser
});
```

### API-003: Поля на корневом уровне

**Файл:** `backend/src/api/controllers/auth.controller.ts:251-255`

```typescript
// Текущий код (НЕПРАВИЛЬНО)
res.json({
  success: true,
  exists: result.exists,
  agencyName: result.agencyName
});

// Целевой код
res.json({
  success: true,
  data: {
    exists: result.exists,
    agencyName: result.agencyName
  }
});
```

---

## Чеклист для нового endpoint

```
□ Формат ответа соответствует стандарту
□ Используется правильный HTTP статус код
□ Ошибки возвращают { success: false, error: "..." }
□ Входные данные валидируются через Zod
□ Параметры пути преобразуются в числа (не as unknown as number)
□ Логирование ошибок без деталей в ответе
□ Сообщения об ошибках на русском
□ Query параметры в snake_case
□ URL следует REST конвенциям
```

---

## TypeScript типы

### Стандартные типы ответов

```typescript
// types/api.ts

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiSuccessMessage {
  success: true;
  message: string;
}

export interface ApiError {
  success: false;
  error: string;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
export type ApiPaginatedResponse<T> = ApiSuccess<PaginatedData<T>> | ApiError;
```

### Использование в контроллере

```typescript
import { ApiResponse, ApiPaginatedResponse } from '../types/api';

// Типизация возвращаемого значения (опционально, для документации)
export async function getUser(req: Request, res: Response) {
  // ...
  const response: ApiResponse<User> = {
    success: true,
    data: user
  };
  res.json(response);
}
```
