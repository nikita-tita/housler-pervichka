-- Migration 010: Тестовые данные для разработки
-- Добавляет: тестового агента, тестовое агентство и его админа
--
-- ВАЖНО: Этот файл содержит тестовые данные.
-- НЕ ЗАПУСКАТЬ на production!

-- ============================================
-- 1. Тестовое агентство
-- ============================================

INSERT INTO agencies (
    name,
    slug,
    is_default,
    inn,
    legal_address,
    phone,
    email,
    contact_position,
    registration_status,
    description
) VALUES (
    'Тестовое Агентство',
    'test-agency',
    false,
    '7801234567',  -- тестовый ИНН (10 цифр для юрлица)
    'г. Санкт-Петербург, ул. Тестовая, д. 1',
    '+79999888888',
    'agency@test.housler.ru',
    'Директор',
    'active',
    'Тестовое агентство недвижимости для разработки'
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    inn = EXCLUDED.inn,
    registration_status = EXCLUDED.registration_status;

-- ============================================
-- 2. Админ тестового агентства (вход по email + пароль)
-- ============================================
-- Email: admin@test.housler.ru
-- Пароль: test123
-- Вход через: /login/agency

INSERT INTO users (
    email,
    phone,
    name,
    role,
    agency_id,
    password_hash,
    phone_verified,
    registration_status,
    is_active
) VALUES (
    'admin@test.housler.ru',
    NULL,
    'Админ Агентства',
    'agency_admin',
    (SELECT id FROM agencies WHERE slug = 'test-agency'),
    -- bcrypt hash для 'test123' (сгенерирован на сервере)
    '$2a$10$q7uMIg2KJyjZythHrrr4teUatHDaLrOYo6ohxrVyH/ayWb4MQ7YWa',
    false,
    'active',
    true
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    agency_id = EXCLUDED.agency_id,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- ============================================
-- 3. Тестовый агент (частный риелтор) - привязан к Housler
-- ============================================
-- Телефон: +7 (999) 911-11-11
-- Код: 111111 (или 222222, 333333)
-- Вход через: /login/realtor

INSERT INTO users (
    email,
    phone,
    name,
    role,
    agency_id,
    city,
    is_self_employed,
    personal_inn,
    phone_verified,
    registration_status,
    is_active
) VALUES (
    'agent@test.housler.ru',
    '79999111111',
    'Тестовый Агент',
    'agent',
    (SELECT id FROM agencies WHERE is_default = true LIMIT 1),
    'Санкт-Петербург',
    true,
    '780123456789',
    true,
    'active',
    true
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- ============================================
-- 4. Агент тестового агентства
-- ============================================
-- Телефон: +7 (999) 922-22-22
-- Код: 111111 (или 222222, 333333)
-- Вход через: /login/realtor

INSERT INTO users (
    email,
    phone,
    name,
    role,
    agency_id,
    city,
    phone_verified,
    registration_status,
    is_active
) VALUES (
    'agent2@test.housler.ru',
    '79999222222',
    'Агент Тестового Агентства',
    'agent',
    (SELECT id FROM agencies WHERE slug = 'test-agency'),
    'Санкт-Петербург',
    true,
    'active',
    true
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    agency_id = (SELECT id FROM agencies WHERE slug = 'test-agency'),
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- ============================================
-- 5. Обновляем телефон тестового клиента
-- ============================================
UPDATE users
SET phone = '79999333333'
WHERE email = 'client@test.housler.ru' AND (phone IS NULL OR phone = '');

-- ============================================
-- 6. Постоянные коды авторизации для email
-- ============================================

INSERT INTO auth_codes (email, code, expires_at)
VALUES ('admin@test.housler.ru', '111111', '2099-12-31 23:59:59')
ON CONFLICT DO NOTHING;

INSERT INTO auth_codes (email, code, expires_at)
VALUES ('agent@test.housler.ru', '111111', '2099-12-31 23:59:59')
ON CONFLICT DO NOTHING;

INSERT INTO auth_codes (email, code, expires_at)
VALUES ('agent2@test.housler.ru', '111111', '2099-12-31 23:59:59')
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. Согласия для тестовых пользователей
-- ============================================

INSERT INTO user_consents (user_id, consent_type, document_version)
SELECT id, 'personal_data', '1.0'
FROM users WHERE email = 'admin@test.housler.ru'
ON CONFLICT DO NOTHING;

INSERT INTO user_consents (user_id, consent_type, document_version)
SELECT id, 'terms', '1.0'
FROM users WHERE email = 'admin@test.housler.ru'
ON CONFLICT DO NOTHING;

INSERT INTO user_consents (user_id, consent_type, document_version)
SELECT id, 'agency_offer', '1.0'
FROM users WHERE email = 'admin@test.housler.ru'
ON CONFLICT DO NOTHING;

INSERT INTO user_consents (user_id, consent_type, document_version)
SELECT id, 'personal_data', '1.0'
FROM users WHERE email = 'agent@test.housler.ru'
ON CONFLICT DO NOTHING;

INSERT INTO user_consents (user_id, consent_type, document_version)
SELECT id, 'terms', '1.0'
FROM users WHERE email = 'agent@test.housler.ru'
ON CONFLICT DO NOTHING;

INSERT INTO user_consents (user_id, consent_type, document_version)
SELECT id, 'realtor_offer', '1.0'
FROM users WHERE email = 'agent@test.housler.ru'
ON CONFLICT DO NOTHING;

-- ============================================
-- СПРАВКА ПО ТЕСТОВЫМ АККАУНТАМ
-- ============================================
/*
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         ТЕСТОВЫЕ АККАУНТЫ                                   │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │                                                                             │
 │  1. КЛИЕНТ (client)                                                         │
 │     Страница входа: /login/client                                           │
 │     Email: client@test.housler.ru                                           │
 │     Код: 111111                                                             │
 │                                                                             │
 │  2. ЧАСТНЫЙ РИЕЛТОР (agent) - привязан к Housler                           │
 │     Страница входа: /login/realtor                                          │
 │     Телефон: +7 (999) 911-11-11                                            │
 │     Код: 111111 (или 222222, 333333)                                       │
 │                                                                             │
 │  3. АГЕНТ ТЕСТОВОГО АГЕНТСТВА (agent) - привязан к "Тестовое Агентство"    │
 │     Страница входа: /login/realtor                                          │
 │     Телефон: +7 (999) 922-22-22                                            │
 │     Код: 111111 (или 222222, 333333)                                       │
 │                                                                             │
 │  4. АДМИН АГЕНТСТВА (agency_admin) - "Тестовое Агентство"                  │
 │     Страница входа: /login/agency                                           │
 │     Email: admin@test.housler.ru                                            │
 │     Пароль: test123                                                         │
 │                                                                             │
 │  5. АДМИН АГЕНТСТВА Housler (agency_admin)                                 │
 │     Страница входа: /login/agency                                           │
 │     Email: agency_admin@test.housler.ru                                     │
 │     Пароль: test123                                                         │
 │                                                                             │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │  ПРАВИЛА ТЕСТОВЫХ АККАУНТОВ:                                               │
 │  - Email @test.housler.ru → коды 111111-666666 (не истекают)               │
 │  - Телефоны 79999xxxxxx → коды 111111-333333 (без проверки в БД)           │
 └─────────────────────────────────────────────────────────────────────────────┘
*/
