-- Migration 006: Агентства и мультитенантность
-- Добавляет систему агентств, привязку клиентов к агентствам, роутинг заявок

-- ============================================
-- 1. Таблица агентств
-- ============================================

CREATE TABLE IF NOT EXISTS agencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,  -- для URL: housler, realty-pro
    is_default BOOLEAN DEFAULT FALSE,    -- Housler = true, заявки без привязки идут сюда
    logo_url VARCHAR(500),
    phone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаём дефолтное агентство Housler
INSERT INTO agencies (name, slug, is_default, description)
VALUES ('Housler', 'housler', true, 'Платформа недвижимости Housler')
ON CONFLICT (slug) DO NOTHING;

-- Индекс для поиска по slug
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_is_default ON agencies(is_default) WHERE is_default = true;

-- Триггер для updated_at
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
CREATE TRIGGER update_agencies_updated_at
    BEFORE UPDATE ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Роль agency_admin
-- ============================================

-- Добавляем новую роль agency_admin
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agency_admin';

-- ============================================
-- 3. Привязка агентов к агентствам
-- ============================================

-- Добавляем agency_id к users (для агентов и agency_admin)
ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL;

-- Привязываем существующих агентов к дефолтному агентству
UPDATE users
SET agency_id = (SELECT id FROM agencies WHERE is_default = true LIMIT 1)
WHERE role IN ('agent', 'operator', 'admin') AND agency_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_agency ON users(agency_id);

-- ============================================
-- 4. Привязка клиентов к агентствам (многие-ко-многим)
-- ============================================

CREATE TABLE IF NOT EXISTS client_agency_links (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL DEFAULT 'direct', -- selection, booking, direct, referral
    referral_code VARCHAR(50),                     -- код из ссылки (?ref=XXX)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, agency_id)
);

CREATE INDEX IF NOT EXISTS idx_client_agency_user ON client_agency_links(user_id);
CREATE INDEX IF NOT EXISTS idx_client_agency_agency ON client_agency_links(agency_id);

-- ============================================
-- 5. Добавляем agency_id к selections
-- ============================================

ALTER TABLE selections ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL;

-- Привязываем существующие подборки к агентству агента
UPDATE selections s
SET agency_id = u.agency_id
FROM users u
WHERE s.agent_id = u.id AND s.agency_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_selections_agency ON selections(agency_id);

-- ============================================
-- 6. Добавляем agency_id к bookings
-- ============================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL;

-- Привязываем существующие заявки к дефолтному агентству
UPDATE bookings
SET agency_id = (SELECT id FROM agencies WHERE is_default = true LIMIT 1)
WHERE agency_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_agency ON bookings(agency_id);

-- ============================================
-- 7. Связь clients (CRM) с users через контакты
-- ============================================

-- Добавляем user_id к clients для явной связи
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);

-- Функция для автоматической связи clients и users по email/phone
CREATE OR REPLACE FUNCTION link_client_to_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Если user_id ещё не установлен, ищем по email или phone
    IF NEW.user_id IS NULL THEN
        SELECT id INTO NEW.user_id
        FROM users
        WHERE role = 'client'
          AND is_active = true
          AND (
              (NEW.email IS NOT NULL AND email = NEW.email)
              OR (NEW.phone IS NOT NULL AND phone = NEW.phone)
          )
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер на INSERT/UPDATE clients
DROP TRIGGER IF EXISTS trigger_link_client_to_user ON clients;
CREATE TRIGGER trigger_link_client_to_user
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION link_client_to_user();

-- Функция для обратной связи: при регистрации юзера связываем с clients
CREATE OR REPLACE FUNCTION link_user_to_clients()
RETURNS TRIGGER AS $$
BEGIN
    -- Если это клиент, ищем записи в CRM с таким же email/phone
    IF NEW.role = 'client' THEN
        UPDATE clients
        SET user_id = NEW.id
        WHERE user_id IS NULL
          AND (
              (NEW.email IS NOT NULL AND email = NEW.email)
              OR (NEW.phone IS NOT NULL AND phone = NEW.phone)
          );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер на INSERT/UPDATE users
DROP TRIGGER IF EXISTS trigger_link_user_to_clients ON users;
CREATE TRIGGER trigger_link_user_to_clients
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION link_user_to_clients();

-- ============================================
-- 8. Связываем существующие данные
-- ============================================

-- Связываем существующих clients с users по email/phone
UPDATE clients c
SET user_id = u.id
FROM users u
WHERE c.user_id IS NULL
  AND u.role = 'client'
  AND u.is_active = true
  AND (
      (c.email IS NOT NULL AND c.email = u.email)
      OR (c.phone IS NOT NULL AND c.phone = u.phone)
  );

-- ============================================
-- Комментарии
-- ============================================

COMMENT ON TABLE agencies IS 'Агентства недвижимости на платформе';
COMMENT ON COLUMN agencies.slug IS 'URL-идентификатор агентства (housler, realty-pro)';
COMMENT ON COLUMN agencies.is_default IS 'Дефолтное агентство для заявок без привязки (Housler)';

COMMENT ON TABLE client_agency_links IS 'Связь клиентов с агентствами (многие-ко-многим)';
COMMENT ON COLUMN client_agency_links.source IS 'Источник привязки: selection, booking, direct, referral';
COMMENT ON COLUMN client_agency_links.referral_code IS 'Код из реферальной ссылки';

COMMENT ON COLUMN users.agency_id IS 'Агентство для агентов/операторов';
COMMENT ON COLUMN selections.agency_id IS 'Агентство, которому принадлежит подборка';
COMMENT ON COLUMN bookings.agency_id IS 'Агентство, куда направлена заявка';
COMMENT ON COLUMN clients.user_id IS 'Связанный пользователь (если зарегистрировался)';
