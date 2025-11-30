# Примеры API запросов агрегатора недвижимости

## Базовый URL

```
https://api.housler.ru/v1
```

---

## 1. Поиск объявлений

### 1.1 Базовый поиск

**Запрос:**

```http
GET /api/offers?rooms[]=1&rooms[]=2&price_max=15000000&district=Василеостровский
```

**Параметры:**

- `rooms[]` - массив количества комнат
- `price_max` - максимальная цена в рублях
- `district` - название района

**Ответ:**

```json
{
  "success": true,
  "data": [
    {
      "id": "1458634",
      "rooms": 2,
      "area": {
        "total": 66.3,
        "living": 38.58,
        "kitchen": 12.33
      },
      "floor": 10,
      "floors_total": 11,
      "price": 20336957,
      "price_per_sqm": 306823,
      "renovation": "Отделка \"под ключ\"",
      "complex": {
        "id": 47106,
        "name": "NEXT"
      },
      "building": {
        "id": 47105,
        "name": "Корпус 1",
        "type": "монолитный",
        "state": "hand-over",
        "ready_year": 2020,
        "ready_quarter": 3
      },
      "location": {
        "address": "Средний В.О. пр., д. 87/3/1",
        "district": "Василеостровский",
        "coordinates": {
          "lat": 59.9382061026,
          "lng": 30.2486448592
        },
        "metro": {
          "name": "Горный Институт",
          "time_on_foot": 13
        }
      },
      "images": {
        "main": "http://img.nmarket.pro/photo/pid/BDBDC969-72CB-4F07-B5C1-BFDFBAB5E9F9/...",
        "plan": "http://img.nmarket.pro/photo/pid/9F0B108E-A72E-4529-81BE-323B37B589DB/...",
        "thumbnail": "http://img.nmarket.pro/photo/pid/BDBDC969-72CB-4F07-B5C1-BFDFBAB5E9F9/..."
      },
      "features": {
        "balcony": "нет",
        "bathroom": "совмещенный",
        "has_lift": true,
        "has_parking": true,
        "mortgage": true
      },
      "created_at": "2017-09-15T10:31:37+00:00",
      "updated_at": "2025-02-28T13:53:00+00:00"
    }
  ],
  "meta": {
    "total": 489,
    "page": 1,
    "per_page": 20,
    "total_pages": 25
  },
  "filters_summary": {
    "active_filters": {
      "rooms": [1, 2],
      "price_max": 15000000,
      "district": "Василеостровский"
    },
    "available_ranges": {
      "price": {
        "min": 5200000,
        "max": 45000000
      },
      "area": {
        "min": 28.5,
        "max": 95.3
      },
      "floor": {
        "min": 1,
        "max": 25
      }
    }
  }
}
```

### 1.2 Расширенный поиск с множественными фильтрами

**Запрос:**

```http
GET /api/offers?rooms[]=2&rooms[]=3
  &price_min=10000000&price_max=20000000
  &area_min=50&area_max=80
  &floor_min=3&floor_max=15
  &not_first_floor=true
  &not_last_floor=true
  &metro_stations[]=Горный+Институт&metro_stations[]=Василеостровская
  &metro_time_max=15
  &building_types[]=монолитный&building_types[]=кирпично-монолитный
  &building_states[]=hand-over
  &renovation[]=Чистовая+отделка&renovation[]=Отделка+"под+ключ"
  &has_lift=true
  &has_parking=true
  &mortgage=true
  &sort=price_per_sqm_asc
  &page=1&per_page=50
```

**Параметры:**

- `price_min`, `price_max` - диапазон цены
- `area_min`, `area_max` - диапазон площади
- `floor_min`, `floor_max` - диапазон этажей
- `not_first_floor`, `not_last_floor` - исключить крайние этажи
- `metro_stations[]` - массив станций метро
- `metro_time_max` - максимальное время до метро
- `building_types[]` - типы зданий
- `building_states[]` - состояние строительства
- `renovation[]` - типы отделки
- `has_lift`, `has_parking`, `mortgage` - наличие удобств
- `sort` - сортировка
- `page`, `per_page` - пагинация

### 1.3 Поиск только студий

**Запрос:**

```http
GET /api/offers?studio=true&price_max=10000000&sort=price_asc
```

### 1.4 Поиск в конкретном ЖК

**Запрос:**

```http
GET /api/offers?complex_id=47106&sort=floor_asc
```

### 1.5 Геопоиск (в радиусе от точки)

**Запрос:**

```http
GET /api/offers/nearby?lat=59.9382061026&lng=30.2486448592&radius=1000&limit=20
```

**Параметры:**

- `lat`, `lng` - координаты центра
- `radius` - радиус в метрах
- `limit` - максимальное количество результатов

**Ответ:**

```json
{
  "success": true,
  "data": [
    {
      "id": "1458634",
      "distance_meters": 150.5,
      "rooms": 2,
      "price": 20336957,
      "area": 66.3,
      "address": "Средний В.О. пр., д. 87/3/1",
      "...": "..."
    }
  ],
  "meta": {
    "center": {
      "lat": 59.9382061026,
      "lng": 30.2486448592
    },
    "radius_meters": 1000,
    "total_found": 18
  }
}
```

---

## 2. Детальная информация об объекте

### 2.1 Получить полную информацию

**Запрос:**

```http
GET /api/offers/1458634
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "id": "1458634",
    "type": "продажа",
    "category": "квартира",

    "characteristics": {
      "rooms": 2,
      "is_studio": false,
      "floor": 10,
      "floors_total": 11,
      "area": {
        "total": 66.3,
        "living": 38.58,
        "kitchen": 12.33,
        "living_percentage": 58.2,
        "kitchen_percentage": 18.6
      },
      "balcony": "нет",
      "bathroom": "совмещенный",
      "renovation": "Отделка \"под ключ\"",
      "ceiling_height": null
    },

    "price": {
      "value": 20336957,
      "currency": "RUR",
      "per_sqm": 306823,
      "per_living_sqm": 527156,
      "mortgage_available": true,
      "haggle": false
    },

    "price_history": [
      {
        "date": "2025-02-28",
        "price": 20336957,
        "change_percent": 0
      },
      {
        "date": "2024-12-15",
        "price": 19500000,
        "change_percent": 4.3
      }
    ],

    "building": {
      "id": 47105,
      "name": "Корпус 1",
      "type": "монолитный",
      "state": "hand-over",
      "phase": "Очередь 1",
      "section": "Корпус 1",
      "built_year": 2020,
      "ready_quarter": 3,
      "floors_total": 11,
      "has_lift": true,
      "has_parking": true,
      "parking_type": "подземная/наземная"
    },

    "complex": {
      "id": 47106,
      "name": "NEXT",
      "developer": "Еврострой",
      "total_buildings": 3,
      "total_apartments": 432,
      "statistics": {
        "min_price": 12195652,
        "max_price": 23586957,
        "avg_price_per_sqm": 324500
      }
    },

    "location": {
      "country": "Россия",
      "region": "Санкт-Петербург",
      "city": "Санкт-Петербург",
      "district": "Василеостровский",
      "address": "Средний В.О. пр., д. 87/3/1",
      "apartment": "413",
      "coordinates": {
        "lat": 59.9382061026,
        "lng": 30.2486448592
      },
      "metro": {
        "name": "Горный Институт",
        "line": "Фрунзенско-Приморская",
        "time_on_foot": 13,
        "time_on_transport": null
      }
    },

    "images": [
      {
        "type": "housemain",
        "url": "http://img.nmarket.pro/photo/pid/BDBDC969-72CB-4F07-B5C1-BFDFBAB5E9F9/...",
        "thumbnail": "http://img.nmarket.pro/photo/pid/BDBDC969-72CB-4F07-B5C1-BFDFBAB5E9F9/.../thumb",
        "order": 1
      },
      {
        "type": "plan",
        "url": "http://img.nmarket.pro/photo/pid/9F0B108E-A72E-4529-81BE-323B37B589DB/...",
        "order": 2
      },
      {
        "type": "floorplan",
        "url": "http://img.nmarket.pro/photo/pid/8155E281-2653-46C8-8280-6C5860F28412/...",
        "order": 3
      }
    ],

    "description": "Апартамент: 2 к 66,30 кв.м., 10 этаж в комплексе NEXT...",

    "sales_agent": {
      "phone": "+79817196494",
      "formatted_phone": "+7 (981) 719-64-94",
      "organization": "spb-invest-xml77.allrealty.pro",
      "email": "titworking@mail.ru",
      "category": "agency"
    },

    "dates": {
      "created": "2017-09-15T10:31:37+00:00",
      "updated": "2025-02-28T13:53:00+00:00"
    },

    "meta": {
      "views_count": 342,
      "favorites_count": 15,
      "source": "xml_feed_spb"
    }
  },

  "similar_offers": [
    {
      "id": "1458635",
      "similarity_score": 0.95,
      "reason": "Тот же ЖК, похожая площадь",
      "...": "..."
    }
  ],

  "recommendations": {
    "cheaper_alternatives": [...],
    "better_value": [...],
    "in_same_district": [...]
  }
}
```

---

## 3. Жилые комплексы

### 3.1 Список ЖК

**Запрос:**

```http
GET /api/complexes?district=Василеостровский&building_state=hand-over&sort=offers_count_desc
```

**Ответ:**

```json
{
  "success": true,
  "data": [
    {
      "id": 47106,
      "name": "NEXT",
      "developer": {
        "id": 123,
        "name": "Еврострой"
      },
      "location": {
        "district": "Василеостровский",
        "address": "Средний В.О. пр., д. 87/3/1",
        "coordinates": {
          "lat": 59.9382061026,
          "lng": 30.2486448592
        },
        "metro": {
          "name": "Горный Институт",
          "time_on_foot": 13
        }
      },
      "statistics": {
        "total_offers": 432,
        "total_buildings": 3,
        "min_price": 12195652,
        "max_price": 23586957,
        "avg_price": 17500000,
        "avg_price_per_sqm": 324500,
        "available_rooms": [0, 1, 2],
        "building_states": ["hand-over"]
      },
      "images": {
        "main": "URL",
        "gallery": ["URL1", "URL2", "URL3"]
      },
      "features": {
        "has_parking": true,
        "has_playground": true,
        "security": true
      }
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "per_page": 20
  }
}
```

### 3.2 Детали ЖК

**Запрос:**

```http
GET /api/complexes/47106
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "id": 47106,
    "name": "NEXT",
    "developer": {
      "id": 123,
      "name": "Еврострой",
      "website": "https://evrostroi.ru",
      "description": "..."
    },
    "description": "Апарт-комплекс возводят в Василеостровском районе...",

    "location": {
      "district": "Василеостровский",
      "address": "Средний В.О. пр., д. 87, литера М",
      "coordinates": {
        "lat": 59.9382061026,
        "lng": 30.2486448592
      },
      "metro": [
        {
          "name": "Горный Институт",
          "time_on_foot": 13
        },
        {
          "name": "Василеостровская",
          "time_on_foot": 17
        }
      ]
    },

    "infrastructure": {
      "schools": [
        { "name": "Школа №4", "distance": 450 },
        { "name": "Гимназия №11", "distance": 650 }
      ],
      "kindergartens": [{ "name": "Детский сад №34", "distance": 320 }],
      "shops": [{ "name": "Перекресток", "distance": 200 }],
      "parks": [{ "name": "Сад Василеостровец", "distance": 350 }]
    },

    "buildings": [
      {
        "id": 47105,
        "name": "Корпус 1",
        "phase": "Очередь 1",
        "floors": 11,
        "type": "монолитный",
        "state": "hand-over",
        "built_year": 2020,
        "ready_quarter": 3,
        "available_apartments": 145
      },
      {
        "id": 47120,
        "name": "Корпус 2",
        "phase": "Очередь 1",
        "floors": 11,
        "type": "монолитный",
        "state": "hand-over",
        "built_year": 2020,
        "ready_quarter": 3,
        "available_apartments": 158
      }
    ],

    "statistics": {
      "total_offers": 432,
      "by_rooms": {
        "studios": {
          "count": 297,
          "min_price": 8000000,
          "max_price": 12500000,
          "avg_price_per_sqm": 320000
        },
        "1_room": {
          "count": 81,
          "min_price": 11000000,
          "max_price": 15000000,
          "avg_price_per_sqm": 330000
        },
        "2_rooms": {
          "count": 54,
          "min_price": 18000000,
          "max_price": 24000000,
          "avg_price_per_sqm": 340000
        }
      }
    },

    "features": {
      "building_class": "комфорт",
      "parking": {
        "underground": 80,
        "surface": 10
      },
      "security": true,
      "concierge": false,
      "playground": true,
      "sports_ground": true
    },

    "images": [
      {
        "type": "main",
        "url": "..."
      },
      {
        "type": "scheme",
        "url": "..."
      }
    ]
  }
}
```

### 3.3 Доступные квартиры в ЖК

**Запрос:**

```http
GET /api/complexes/47106/offers?rooms=2&building_id=47105&sort=price_asc
```

---

## 4. Аналитика и статистика

### 4.1 Обзор рынка

**Запрос:**

```http
GET /api/analytics/market-overview
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "total_offers": 12020,
    "avg_price": 15500000,
    "avg_price_per_sqm": 185000,
    "median_price": 14200000,

    "by_rooms": {
      "studios": {
        "count": 1332,
        "percentage": 11.1,
        "avg_price": 8500000,
        "avg_price_per_sqm": 225000
      },
      "1_room": {
        "count": 6512,
        "percentage": 54.2,
        "avg_price": 12000000,
        "avg_price_per_sqm": 200000
      },
      "2_rooms": {
        "count": 3040,
        "percentage": 25.3,
        "avg_price": 18000000,
        "avg_price_per_sqm": 180000
      },
      "3_rooms": {
        "count": 1036,
        "percentage": 8.6,
        "avg_price": 25000000,
        "avg_price_per_sqm": 170000
      }
    },

    "by_district": [
      {
        "name": "Невский",
        "count": 940,
        "avg_price": 14500000,
        "avg_price_per_sqm": 175000
      },
      {
        "name": "Приморский",
        "count": 710,
        "avg_price": 16200000,
        "avg_price_per_sqm": 190000
      }
    ],

    "by_building_state": {
      "unfinished": {
        "count": 9291,
        "percentage": 77.3,
        "avg_price": 14000000,
        "avg_price_per_sqm": 180000
      },
      "hand_over": {
        "count": 2729,
        "percentage": 22.7,
        "avg_price": 19000000,
        "avg_price_per_sqm": 200000
      }
    },

    "top_complexes": [
      {
        "id": 47106,
        "name": "Новатория",
        "offers_count": 669,
        "avg_price_per_sqm": 165000
      }
    ]
  }
}
```

### 4.2 Статистика по району

**Запрос:**

```http
GET /api/analytics/districts/Василеостровский
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "district": "Василеостровский",
    "total_offers": 489,
    "price_range": {
      "min": 5200000,
      "max": 45000000,
      "avg": 18500000,
      "median": 17200000
    },
    "price_per_sqm": {
      "min": 180000,
      "max": 400000,
      "avg": 265000
    },
    "by_rooms": {...},
    "top_complexes": [...],
    "metro_stations": [
      {
        "name": "Горный Институт",
        "nearby_offers": 125
      }
    ]
  }
}
```

### 4.3 Динамика цен

**Запрос:**

```http
GET /api/analytics/price-trends?district=Василеостровский&rooms=2&period=year
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "period": "2024-01 to 2025-01",
    "filters": {
      "district": "Василеостровский",
      "rooms": 2
    },
    "trends": [
      {
        "month": "2024-01",
        "avg_price": 17500000,
        "avg_price_per_sqm": 255000,
        "offers_count": 145,
        "change_percent": 0
      },
      {
        "month": "2024-02",
        "avg_price": 17800000,
        "avg_price_per_sqm": 258000,
        "offers_count": 152,
        "change_percent": 1.7
      }
    ],
    "summary": {
      "total_change_percent": 8.5,
      "avg_monthly_change": 0.7
    }
  }
}
```

---

## 5. Пользовательские функции

### 5.1 Добавить в избранное

**Запрос:**

```http
POST /api/favorites
Content-Type: application/json
Authorization: Bearer {token}

{
  "offer_id": "1458634",
  "notes": "Хороший вариант, понравилась планировка",
  "tags": ["первая линия", "приоритет"]
}
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "offer_id": "1458634",
    "notes": "Хороший вариант, понравилась планировка",
    "tags": ["первая линия", "приоритет"],
    "initial_price": 20336957,
    "created_at": "2025-11-29T10:00:00Z"
  }
}
```

### 5.2 Список избранного

**Запрос:**

```http
GET /api/favorites
Authorization: Bearer {token}
```

### 5.3 Сохранить поиск

**Запрос:**

```http
POST /api/saved-searches
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "2-комн на Васильевском до 20 млн",
  "filters": {
    "rooms": [2],
    "district": "Василеостровский",
    "price_max": 20000000,
    "building_state": "hand-over"
  },
  "notifications_enabled": true,
  "notification_frequency": "daily"
}
```

### 5.4 Создать сравнение

**Запрос:**

```http
POST /api/comparisons
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Варианты в NEXT",
  "offer_ids": ["1458634", "1458635", "1461081"]
}
```

**Ответ с детальным сравнением:**

```json
{
  "success": true,
  "data": {
    "id": 456,
    "name": "Варианты в NEXT",
    "offers": [
      {
        "id": "1458634",
        "rooms": 2,
        "area": 66.3,
        "floor": 10,
        "price": 20336957,
        "price_per_sqm": 306823,
        "...": "..."
      },
      {
        "id": "1458635",
        "rooms": 2,
        "area": 66.1,
        "floor": 11,
        "price": 21339130,
        "price_per_sqm": 322861,
        "...": "..."
      }
    ],
    "comparison": {
      "price_diff": {
        "min": 20336957,
        "max": 21339130,
        "diff": 1002173,
        "diff_percent": 4.9
      },
      "area_diff": {
        "min": 66.1,
        "max": 66.3,
        "diff": 0.2
      },
      "differences": [
        {
          "field": "floor",
          "values": [10, 11],
          "note": "1458635 на последнем этаже"
        }
      ]
    }
  }
}
```

---

## 6. Калькуляторы

### 6.1 Ипотечный калькулятор

**Запрос:**

```http
POST /api/calculators/mortgage
Content-Type: application/json

{
  "price": 20336957,
  "initial_payment": 5000000,
  "rate": 8.5,
  "term_years": 20
}
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "loan_amount": 15336957,
    "monthly_payment": 132450,
    "total_payment": 31788000,
    "overpayment": 16451043,
    "overpayment_percent": 107.3,
    "schedule": [
      {
        "month": 1,
        "payment": 132450,
        "principal": 23757,
        "interest": 108693,
        "balance": 15313200
      }
    ]
  }
}
```

---

## 7. Фильтры и справочники

### 7.1 Доступные значения фильтров

**Запрос:**

```http
GET /api/filters
```

**Ответ:**

```json
{
  "success": true,
  "data": {
    "districts": [
      { "value": "Василеостровский", "count": 489 },
      { "value": "Невский", "count": 940 },
      { "value": "Приморский", "count": 710 }
    ],
    "metro_stations": [
      { "value": "Горный Институт", "line": "Фрунзенско-Приморская", "count": 125 }
    ],
    "building_types": [
      { "value": "кирпично-монолитный", "count": 7051 },
      { "value": "монолитный", "count": 2040 }
    ],
    "renovation_types": [
      { "value": "Подготовка под чистовую отделку", "count": 3637 },
      { "value": "Отделка \"под ключ\"", "count": 3307 }
    ],
    "price_range": {
      "min": 3000000,
      "max": 150000000
    },
    "area_range": {
      "min": 20,
      "max": 150
    }
  }
}
```

---

## 8. Подписки и уведомления

### 8.1 Подписаться на новые объявления

**Запрос:**

```http
POST /api/subscriptions
Content-Type: application/json
Authorization: Bearer {token}

{
  "saved_search_id": 123,
  "channel": "email",
  "frequency": "daily"
}
```

### 8.2 Уведомления об изменении цены

**Webhook callback:**

```json
{
  "type": "price_change",
  "offer_id": "1458634",
  "old_price": 19500000,
  "new_price": 20336957,
  "change_percent": 4.3,
  "timestamp": "2025-11-29T10:00:00Z"
}
```

---

## Коды ошибок

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные параметры запроса",
    "details": {
      "price_max": "Должно быть положительным числом",
      "rooms": "Допустимые значения: 0-7"
    }
  }
}
```

**Коды ошибок:**

- `400` - Некорректный запрос
- `401` - Требуется авторизация
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `429` - Превышен лимит запросов
- `500` - Внутренняя ошибка сервера
