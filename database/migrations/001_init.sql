-- ============================================
-- MVP: Инициализация базы данных
-- ============================================

-- Расширения PostgreSQL
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- СПРАВОЧНИКИ
-- ============================================

-- Районы города
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    region VARCHAR(100) NOT NULL DEFAULT 'Санкт-Петербург',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Станции метро
CREATE TABLE IF NOT EXISTS metro_stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    line VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, line)
);

-- ============================================
-- ЖИЛЫЕ КОМПЛЕКСЫ
-- ============================================

CREATE TABLE IF NOT EXISTS complexes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district_id INTEGER REFERENCES districts(id),
    address VARCHAR(500),
    coordinates GEOGRAPHY(POINT, 4326),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, address)
);

CREATE INDEX IF NOT EXISTS idx_complexes_name_trgm ON complexes USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_complexes_district ON complexes(district_id);

-- ============================================
-- ОБЪЯВЛЕНИЯ
-- ============================================

CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(100) UNIQUE NOT NULL,

    -- Связи
    complex_id INTEGER REFERENCES complexes(id) ON DELETE SET NULL,
    district_id INTEGER REFERENCES districts(id),

    -- Тип
    offer_type VARCHAR(20) DEFAULT 'продажа',
    property_type VARCHAR(20) DEFAULT 'жилая',
    category VARCHAR(50) DEFAULT 'квартира',

    -- Характеристики
    rooms INTEGER CHECK (rooms >= 0 AND rooms <= 10),
    is_studio BOOLEAN DEFAULT false,
    floor INTEGER CHECK (floor > 0),
    floors_total INTEGER CHECK (floors_total > 0),

    -- Площади
    area_total DECIMAL(6, 2) NOT NULL,
    area_living DECIMAL(6, 2),
    area_kitchen DECIMAL(6, 2),
    ceiling_height DECIMAL(3, 2),

    -- Цена
    price DECIMAL(15, 2) NOT NULL,
    price_per_sqm DECIMAL(10, 2) GENERATED ALWAYS AS (
        CASE WHEN area_total > 0 THEN price / area_total ELSE NULL END
    ) STORED,

    -- Характеристики
    renovation VARCHAR(100),
    balcony VARCHAR(50),
    bathroom_unit VARCHAR(50),

    -- Здание
    building_name VARCHAR(255),
    building_type VARCHAR(100),
    building_state VARCHAR(50),
    built_year INTEGER,
    ready_quarter INTEGER CHECK (ready_quarter BETWEEN 1 AND 4),

    -- Адрес и координаты
    address VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Метро
    metro_name VARCHAR(100),
    metro_time_on_foot INTEGER,

    -- Контакты
    agent_phone VARCHAR(50),
    agent_email VARCHAR(255),
    agent_organization VARCHAR(255),

    -- Описание
    description TEXT,

    -- Статус
    is_active BOOLEAN DEFAULT true,

    -- Метаданные
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Проверки
    CONSTRAINT price_positive CHECK (price > 0),
    CONSTRAINT area_positive CHECK (area_total > 0)
);

-- Индексы для поиска
CREATE INDEX IF NOT EXISTS idx_offers_external ON offers(external_id);
CREATE INDEX IF NOT EXISTS idx_offers_complex ON offers(complex_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_district ON offers(district_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_rooms ON offers(rooms) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_price ON offers(price) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_area ON offers(area_total) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_floor ON offers(floor) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_updated ON offers(updated_at DESC);

-- ============================================
-- ИЗОБРАЖЕНИЯ
-- ============================================

CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    tag VARCHAR(50),
    url VARCHAR(1000) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(offer_id, url)
);

CREATE INDEX IF NOT EXISTS idx_images_offer ON images(offer_id);
CREATE INDEX IF NOT EXISTS idx_images_tag ON images(tag);

-- ============================================
-- ТРИГГЕРЫ
-- ============================================

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для offers
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;
CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Триггер для complexes
DROP TRIGGER IF EXISTS update_complexes_updated_at ON complexes;
CREATE TRIGGER update_complexes_updated_at
    BEFORE UPDATE ON complexes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
