# План миграции на Design System

Детальный план исправления существующих компонентов для соответствия DESIGN-SYSTEM.md.

---

## Сводка нарушений

| Категория | Количество файлов | Приоритет |
|-----------|------------------|-----------|
| Цветные классы (не grayscale) | ~45 файлов | Высокий |
| Inline стили кнопок (вместо .btn) | ~15 файлов | Средний |
| Inline стили инпутов (вместо .input) | ~20 файлов | Средний |
| Цветные badges | ~10 компонентов | Высокий |
| Несогласованные табы | ~3 компонента | Низкий |

---

## Фаза 1: Критические нарушения цвета

### 1.1 Компоненты с цветными статусами/badges

**Файл:** `components/clients/StageBadge.tsx`
**Строки:** 10-17
**Проблема:** Цветные bg для статусов (yellow, purple, orange, emerald, green, red)
**Исправление:**
```tsx
// БЫЛО:
const STAGE_CONFIG = {
  new: { label: 'Новый', color: 'text-[var(--color-text)]', bg: 'bg-gray-200' },
  in_progress: { label: 'В работе', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  // ...
};

// СТАЛО:
const STAGE_CONFIG = {
  new: { label: 'Новый', filled: false },
  in_progress: { label: 'В работе', filled: false },
  fixation: { label: 'Фиксация', filled: false },
  booking: { label: 'Бронь', filled: false },
  deal: { label: 'Сделка', filled: true },
  completed: { label: 'Завершено', filled: true },
  failed: { label: 'Сорвано', filled: false },
};

// Использовать .badge / .badge-filled вместо цветов
<span className={`badge ${config.filled ? 'badge-filled' : ''}`}>
  {config.label}
</span>
```

---

**Файл:** `components/clients/PriorityBadge.tsx`
**Строки:** 10-14
**Проблема:** Цветной текст + символы Unicode
**Исправление:**
```tsx
// БЫЛО:
const PRIORITY_CONFIG = {
  low: { label: 'Низкий', color: 'text-gray-500', icon: '○' },
  medium: { label: 'Средний', color: 'text-yellow-600', icon: '◐' },
  high: { label: 'Высокий', color: 'text-orange-600', icon: '●' },
  urgent: { label: 'Срочный', color: 'text-red-600', icon: '⬤' },
};

// СТАЛО: Текстовые метки без цвета и символов
const PRIORITY_CONFIG = {
  low: { label: 'Низкий', filled: false },
  medium: { label: 'Средний', filled: false },
  high: { label: 'Высокий', filled: true },
  urgent: { label: 'Срочный!', filled: true },
};
```

---

**Файл:** `components/StatusBadge.tsx`
**Строки:** 14, 25, 35
**Проблема:** green-100/green-700, gray-100, orange-100/orange-700
**Исправление:**
```tsx
// Сдан -> badge-filled
// Дата -> badge
// Строится -> badge
```

---

**Файл:** `components/SelectionItemStatus.tsx`
**Строки:** 18-19
**Проблема:** green-100/green-600, red-100/red-600
**Исправление:** Использовать badge/badge-filled

---

**Файл:** `components/SelectionActivityLog.tsx`
**Строки:** 96-97
**Проблема:** green-100/green-600, red-100/red-600
**Исправление:** badge/badge-filled или просто текст

---

### 1.2 Компоненты Compare (фиолетовая тема)

**Файл:** `components/CompareButton.tsx`
**Строки:** 39-40
**Проблема:** purple-500, purple-600
**Исправление:**
```tsx
// БЫЛО:
${inCompare
  ? 'bg-purple-500 text-white hover:bg-purple-600'
  : ...}

// СТАЛО:
${inCompare
  ? 'bg-gray-900 text-white hover:bg-black'
  : ...}
```

---

**Файл:** `components/CompareFloatingBar.tsx`
**Строки:** 18, 30, 37
**Проблема:** purple-600, purple-200, purple-50
**Исправление:**
```tsx
// БЫЛО:
<div className="bg-purple-600 text-white ...">

// СТАЛО:
<div className="bg-gray-900 text-white ...">

// Кнопка внутри:
// БЫЛО: bg-white text-purple-600
// СТАЛО: bg-white text-gray-900
```

---

**Файл:** `app/compare/page.tsx`
**Строки:** 179, 231, 282
**Проблема:** purple-100/purple-600, red-500/red-600, green-50/green-700
**Исправление:**
- Иконка сравнения: `bg-gray-100 text-gray-900`
- Кнопка удаления: `bg-gray-900 text-white` (не красная)
- Лучшее значение: `font-medium` без цветного фона

---

### 1.3 Компонент AddToClientSelectionButton

**Файл:** `components/AddToClientSelectionButton.tsx`
**Строка:** 53
**Проблема:** green-500, green-600
**Исправление:** `bg-gray-900 text-white hover:bg-black`

---

### 1.4 Избранное (красное сердечко)

**Файл:** `components/FavoriteButton.tsx`
**Строка:** 57
**Проблема:** `text-red-500`
**Исправление:**
```tsx
// Вариант 1: Оставить как исключение (сердечко традиционно красное)
// Вариант 2: Черное заполненное сердечко
className={`... ${isFav ? 'text-gray-900 fill-current' : 'text-gray-400'}`}
```
**Решение:** Обсудить с дизайнером. Возможно исключение.

---

**Файл:** `components/guest/FavoriteButtonGuest.tsx`
**Строка:** 45
**Аналогично FavoriteButton**

---

**Файл:** `components/guest/HeaderGuest.tsx`
**Строки:** 47, 61
**Проблема:** `text-red-500`, `bg-red-500`
**Исправление:** Аналогично FavoriteButton

---

### 1.5 Toast уведомления

**Файл:** `contexts/ToastContext.tsx`
**Строки:** 46-48
**Проблема:** green-600, red-600
**Исправление:**
```tsx
// БЫЛО:
type === 'success' ? 'bg-green-600 text-white'
type === 'error' ? 'bg-red-600 text-white'

// СТАЛО:
// Все тосты одинаковые: черный фон, белый текст
// Различие через иконку и текст, не цвет
'bg-gray-900 text-white'
```

---

### 1.6 Формы - сообщения об ошибках

**Файлы:**
- `components/ui/FormField.tsx:14,30,59,77,104,116`
- `components/BookingForm.tsx:67-74,189`
- `app/login/client/page.tsx:96,151`
- `app/login/agency/page.tsx:119`
- `app/login/realtor/page.tsx:188,236,384`
- `app/registration/agency/page.tsx:270,275,333,407,465,547`
- `app/clients/new/page.tsx:92`
- `app/favorites/page.tsx:68`
- `app/error.tsx:20-21,37`

**Проблема:** red-500, red-600, red-300, green-50, green-600, green-700

**Исправление:**
```tsx
// Ошибки - обычный текст без цвета
// БЫЛО:
<p className="text-red-600">Ошибка</p>

// СТАЛО:
<p className="text-sm text-[var(--color-text)]">Ошибка</p>

// Успех - обычный текст или badge-filled
// БЫЛО:
<div className="bg-green-50 text-green-700">Успешно</div>

// СТАЛО:
<div className="p-3 bg-gray-100 text-[var(--color-text)]">Успешно</div>
```

---

### 1.7 Шахматка (ChessBoard)

**Файл:** `components/complex/ChessBoard.tsx`
**Строки:** 76-82, 121-137
**Проблема:** Цветовое кодирование комнат (purple, blue, green, yellow, orange)
**Исправление:**
```tsx
// Вместо цветов использовать:
// 1. Плотность заливки (от светлого к темному)
// 2. Или числовые/текстовые метки

const getRoomStyle = (rooms: number, isStudio: boolean) => {
  if (isStudio) return 'bg-gray-100 hover:bg-gray-200';
  // Градация серого по количеству комнат
  const intensity = Math.min(rooms * 50, 200);
  return `bg-gray-${intensity} hover:bg-gray-${intensity + 50}`;
};

// Легенда: просто текст
<span className="w-4 h-4 rounded bg-gray-100" /> <span>Ст</span>
<span className="w-4 h-4 rounded bg-gray-150" /> <span>1к</span>
// ...
```

---

### 1.8 Страницы CRM (clients, deals, fixations, failures)

**Файлы:**
- `app/clients/page.tsx:190-195` - цветные статусы
- `app/clients/funnel/page.tsx:11-15` - цветные колонки воронки
- `app/clients/fixations/page.tsx:20-24,202,239` - статусы фиксаций
- `app/clients/deals/page.tsx:20-24,140,144,196,261` - статусы сделок
- `app/clients/failures/page.tsx:16-18,94,98,102,187` - статусы срывов
- `app/clients/[id]/page.tsx:200` - кнопка удаления

**Исправление:** Все статусы через badge/badge-filled

---

### 1.9 Admin панель

**Файл:** `app/admin/page.tsx`
**Строки:** 22-25, 109, 288-300
**Проблема:** Цветные метрики (green, yellow, red, purple)
**Исправление:** Числа без цветового выделения, различие через иконки или лейблы

---

**Файл:** `app/admin/agencies/page.tsx`
**Строки:** 8-10, 201-224
**Проблема:** Цветные статусы модерации
**Исправление:** badge/badge-filled

---

### 1.10 LocationSection (карта)

**Файл:** `components/complex/LocationSection.tsx`
**Строки:** 23, 31, 40, 48, 56, 64
**Проблема:** Цветные иконки инфраструктуры (red, blue, yellow, green)
**Исправление:** Все иконки `text-[var(--color-text)]` или `text-[var(--color-text-secondary)]`

---

### 1.11 SearchAutocomplete

**Файл:** `components/SearchAutocomplete.tsx`
**Строки:** 94-95
**Проблема:** Цветные теги типов (green-100/green-700, red-100/red-700)
**Исправление:** badge/badge-filled

---

### 1.12 ShareSelectionModal

**Файл:** `components/ShareSelectionModal.tsx`
**Строки:** 122-133, 166, 172
**Проблема:** Цветные кнопки WhatsApp/Telegram (green, blue), сообщения (red, green)
**Исправление:**
```tsx
// Кнопки соцсетей: btn btn-secondary с иконкой
// Сообщения: обычный текст
```

---

### 1.13 PriceHistoryChart

**Файл:** `components/PriceHistoryChart.tsx`
**Строка:** 81
**Проблема:** red-500 (рост), green-500 (падение)
**Исправление:** Стрелки + текст без цвета, или оставить как исключение для финансовых данных

---

### 1.14 Profile

**Файл:** `app/profile/page.tsx`
**Строки:** 102, 115-116, 149-150
**Проблема:** red-50/red-500/red-600, green-50/green-500
**Исправление:** Иконки без цветного фона

---

### 1.15 OfferCard / OfferCardGuest / ComplexHero / ComplexSidebar

**Файлы:**
- `components/OfferCard.tsx:104`
- `components/guest/OfferCardGuest.tsx:102`
- `components/complex/ComplexHero.tsx:51-52,110`
- `components/complex/ComplexSidebar.tsx:71`
- `app/(guest)/s/[code]/page.tsx:139`
- `app/selections/[id]/page.tsx:161`

**Проблема:** green-500 (Сдан), orange-500 (Строится), red-500 (метро)
**Исправление:** badge-filled для "Сдан", badge для остальных

---

## Фаза 2: Inline стили кнопок -> .btn классы

### 2.1 CookieBanner

**Файл:** `components/CookieBanner.tsx`
**Строки:** 70, 76, 122, 128
**Исправление:**
```tsx
// БЫЛО:
className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"

// СТАЛО:
className="btn btn-secondary btn-sm"

// БЫЛО:
className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:opacity-90 transition-opacity"

// СТАЛО:
className="btn btn-primary btn-sm"
```

---

### 2.2 BulkActionsBar

**Файл:** `components/BulkActionsBar.tsx`
**Строки:** 142, 153
**Исправление:** `btn btn-secondary btn-sm`

---

### 2.3 AddToSelectionButton

**Файл:** `components/AddToSelectionButton.tsx`
**Строка:** 70
**Исправление:** `btn btn-secondary`

---

### 2.4 MortgageCalculator

**Файл:** `components/MortgageCalculator.tsx`
**Строка:** 35
**Исправление:** `btn btn-secondary`

---

### 2.5 Selections page

**Файл:** `app/selections/page.tsx`
**Строка:** 219
**Исправление:** `btn btn-secondary btn-sm`

---

## Фаза 3: Inline стили инпутов -> .input класс

### 3.1 Все формы авторизации

**Файлы:**
- `app/login/client/page.tsx:91,146`
- `app/login/agency/page.tsx:99,114`
- `app/login/realtor/page.tsx:274,289,303,331`
- `app/registration/agency/page.tsx:261,289,303,328,360,374,399,443,460`

**Исправление:**
```tsx
// БЫЛО:
className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"

// СТАЛО:
className="input"
```

---

### 3.2 BookingForm / BookingFormGuest

**Файлы:**
- `components/BookingForm.tsx:151,163,173,184`
- `components/guest/BookingFormGuest.tsx:111,123,133,144`

**Исправление:** Использовать `className="input"`

---

### 3.3 SearchAutocomplete

**Файл:** `components/SearchAutocomplete.tsx`
**Строка:** 131
**Исправление:** `className="input"`

---

### 3.4 Фильтры и другие формы

**Файлы:**
- `app/developers/page.tsx:71`
- `app/complexes/page.tsx:60`
- `app/offers/page.tsx:147`
- `app/(guest)/s/[code]/offers/page.tsx:151`
- `components/filters/MultiSelect.tsx:167`
- `components/AddToSelectionButton.tsx:107,125`
- `components/BulkActionsBar.tsx:217`
- `components/ShareSelectionModal.tsx:105,150,161`

**Исправление:** `className="input"` или `className="input text-sm"` для маленьких

---

## Фаза 4: Обновить globals.css

### 4.1 Добавить недостающие классы

```css
/* Добавить в globals.css */

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.badge-filled {
  background: var(--gray-900);
  color: var(--white);
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--white);
  border: 1px solid var(--color-border);
  transition: all 150ms ease;
}

.icon-btn:hover {
  background: var(--color-bg-secondary);
  border-color: var(--gray-400);
}

.icon-btn-active {
  background: var(--gray-900);
  border-color: var(--gray-900);
  color: var(--white);
}

.icon-btn-sm { width: 32px; height: 32px; }
.icon-btn-md { width: 40px; height: 40px; }
.icon-btn-lg { width: 48px; height: 48px; }

.skeleton {
  background: var(--color-bg-secondary);
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

### 4.2 Обновить семантические переменные

```css
/* Заменить в :root */
--color-text-light: var(--gray-600);  /* -> --color-text-secondary */

/* Добавить алиасы */
--color-text-secondary: var(--gray-600);
--color-bg-hover: var(--gray-200);
```

---

## Фаза 5: Дополнительные исправления

### 5.1 Удалить неиспользуемые цветные классы из Tailwind config

После миграции проверить и очистить конфиг.

### 5.2 Обновить ui/FormField.tsx

Убрать цветные классы для error состояний:
```tsx
// border-red-300 -> border-gray-900
// focus:ring-red-500 -> focus:ring-gray-900
// text-red-600 -> text-[var(--color-text)]
```

### 5.3 Обновить ui/ConfirmModal.tsx

```tsx
// БЫЛО:
const confirmButtonClass = variant === 'danger'
  ? 'bg-red-600 hover:bg-red-700 text-white'
  : 'btn-primary';

// СТАЛО:
// Убрать variant='danger', использовать текст кнопки для понимания
const confirmButtonClass = 'btn-primary';
```

---

## Порядок выполнения

1. **globals.css** - добавить новые классы (.badge, .icon-btn, .skeleton)
2. **StageBadge, PriorityBadge, StatusBadge** - критичные компоненты статусов
3. **CompareButton, CompareFloatingBar** - фиолетовая тема
4. **ToastContext** - уведомления
5. **FormField** - базовый UI компонент форм
6. **Все формы авторизации** - inline стили инпутов
7. **CookieBanner, BulkActionsBar** - inline стили кнопок
8. **CRM страницы** - clients, deals, fixations, failures
9. **Admin** - admin панель
10. **Остальные компоненты** - по приоритету

---

## Исключения (требуют обсуждения)

1. **FavoriteButton** - красное сердечко (традиционный паттерн)
2. **PriceHistoryChart** - цветовое кодирование финансовых данных
3. **ChessBoard** - визуальное различие типов квартир

---

## Оценка трудозатрат

| Фаза | Файлов | Оценка |
|------|--------|--------|
| Фаза 1 (цвета) | ~45 | 3-4 часа |
| Фаза 2 (кнопки) | ~10 | 1 час |
| Фаза 3 (инпуты) | ~15 | 1-2 часа |
| Фаза 4 (CSS) | 1 | 30 мин |
| Фаза 5 (доп.) | ~5 | 1 час |
| **Итого** | ~75 правок | **6-8 часов** |
