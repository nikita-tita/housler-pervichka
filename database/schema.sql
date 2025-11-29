-- ============================================
-- СХЕМА БАЗЫ ДАННЫХ: Агрегатор недвижимости
-- ============================================

-- Расширения PostgreSQL
CREATE EXTENSION IF NOT EXISTS postgis;        -- для работы с геоданными
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- для полнотекстового поиска
CREATE EXTENSION IF NOT EXISTS btree_gist;     -- для составных индексов

-- ============================================
-- СПРАВОЧНИКИ
-- ============================================

-- Районы города
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    region VARCHAR(100) NOT NULL DEFAULT 'Санкт-Петербург',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Станции метро
CREATE TABLE metro_stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    line VARCHAR(100),
    coordinates GEOGRAPHY(POINT, 4326),
    district_id INTEGER REFERENCES districts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, line)
);

-- Застройщики
CREATE TABLE developers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    inn VARCHAR(12),
    website VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);

-- ============================================
-- ЖИЛЫЕ КОМПЛЕКСЫ И ЗДАНИЯ
-- ============================================

-- Жилые комплексы
CREATE TABLE complexes (
    id BIGINT PRIMARY KEY,  -- nmarket-complex-id из XML
    name VARCHAR(255) NOT NULL,
    developer_id INTEGER REFERENCES developers(id),
    district_id INTEGER REFERENCES districts(id),

    -- Адрес
    address VARCHAR(500),
    coordinates GEOGRAPHY(POINT, 4326),

    -- Ближайшее метро
    nearest_metro_id INTEGER REFERENCES metro_stations(id),
    metro_time_on_foot INTEGER,  -- минуты

    -- Общая информация
    description TEXT,
    total_buildings INTEGER DEFAULT 0,
    total_apartments INTEGER DEFAULT 0,

    -- Инфраструктура (JSON)
    infrastructure JSONB,  -- {schools: [], kindergartens: [], shops: [], parks: []}

    -- Статистика (обновляется триггерами)
    min_price DECIMAL(15, 2),
    max_price DECIMAL(15, 2),
    avg_price_per_sqm DECIMAL(10, 2),
    available_rooms INTEGER[],  -- массив доступных вариантов комнат

    -- Метаданные
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Индексы
    CONSTRAINT coordinates_check CHECK (coordinates IS NOT NULL)
);

CREATE INDEX idx_complexes_coordinates ON complexes USING GIST(coordinates);
CREATE INDEX idx_complexes_district ON complexes(district_id);
CREATE INDEX idx_complexes_name_trgm ON complexes USING gin(name gin_trgm_ops);
CREATE INDEX idx_complexes_price_range ON complexes(min_price, max_price);

-- Корпуса/здания
CREATE TABLE buildings (
    id BIGINT PRIMARY KEY,  -- nmarket-building-id из XML
    complex_id BIGINT REFERENCES complexes(id) ON DELETE CASCADE,

    -- Идентификация
    name VARCHAR(255),  -- например "Корпус 1", "Секция А"
    phase VARCHAR(100),  -- Очередь строительства
    section VARCHAR(100),

    -- Координаты (могут отличаться от комплекса)
    coordinates GEOGRAPHY(POINT, 4326),
    address VARCHAR(500),

    -- Характеристики здания
    building_type VARCHAR(50),  -- тип здания (монолитный, панельный и т.д.)
    building_state VARCHAR(20),  -- unfinished/hand-over
    floors_total INTEGER,

    -- Срок сдачи
    built_year INTEGER,
    ready_quarter INTEGER CHECK (ready_quarter BETWEEN 1 AND 4),

    -- Удобства
    has_lift BOOLEAN DEFAULT false,
    has_parking BOOLEAN DEFAULT false,
    parking_spaces INTEGER,
    ceiling_height DECIMAL(3, 2),  -- в метрах

    -- Метаданные
    total_apartments INTEGER DEFAULT 0,
    available_apartments INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buildings_complex ON buildings(complex_id);
CREATE INDEX idx_buildings_state ON buildings(building_state);
CREATE INDEX idx_buildings_ready_date ON buildings(built_year, ready_quarter);
CREATE INDEX idx_buildings_coordinates ON buildings USING GIST(coordinates);

-- ============================================
-- ОБЪЯВЛЕНИЯ
-- ============================================

-- Агенты по продажам
CREATE TABLE sales_agents (
    id SERIAL PRIMARY KEY,
    organization VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    category VARCHAR(50) DEFAULT 'agency',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(organization, phone)
);

CREATE INDEX idx_sales_agents_phone ON sales_agents(phone);

-- Основная таблица объявлений
CREATE TABLE offers (
    id BIGINT PRIMARY KEY,  -- internal-id из XML

    -- Связи
    complex_id BIGINT REFERENCES complexes(id) ON DELETE SET NULL,
    building_id BIGINT REFERENCES buildings(id) ON DELETE SET NULL,
    sales_agent_id INTEGER REFERENCES sales_agents(id) ON DELETE SET NULL,
    district_id INTEGER REFERENCES districts(id),
    metro_station_id INTEGER REFERENCES metro_stations(id),

    -- Тип объявления
    offer_type VARCHAR(20) DEFAULT 'продажа',  -- продажа/аренда
    property_type VARCHAR(20) DEFAULT 'жилая',
    category VARCHAR(50) DEFAULT 'квартира',

    -- Характеристики квартиры
    rooms INTEGER CHECK (rooms >= 0 AND rooms <= 10),
    is_studio BOOLEAN DEFAULT false,
    is_new_flat BOOLEAN DEFAULT true,

    -- Площади (кв.м)
    area_total DECIMAL(6, 2) NOT NULL,
    area_living DECIMAL(6, 2),
    area_kitchen DECIMAL(6, 2),

    -- Этаж
    floor INTEGER CHECK (floor > 0),
    floors_total INTEGER CHECK (floors_total > 0),

    -- Характеристики
    renovation VARCHAR(100),  -- тип отделки
    balcony VARCHAR(20),  -- есть/нет/лоджия
    bathroom_unit VARCHAR(50),  -- совмещенный/раздельный/2 и более

    -- Цена
    price DECIMAL(15, 2) NOT NULL,
    price_per_sqm DECIMAL(10, 2) GENERATED ALWAYS AS (price / area_total) STORED,
    currency VARCHAR(3) DEFAULT 'RUR',

    -- Условия
    mortgage BOOLEAN DEFAULT false,
    haggle BOOLEAN DEFAULT false,

    -- Местоположение
    address VARCHAR(500),
    apartment VARCHAR(20),  -- номер квартиры
    coordinates GEOGRAPHY(POINT, 4326),
    metro_time_on_foot INTEGER,  -- минуты до метро

    -- Описание
    description TEXT,

    -- Даты
    creation_date TIMESTAMP,
    last_update_date TIMESTAMP,
    manually_added BOOLEAN DEFAULT false,

    -- Статус объявления
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,

    -- Метаданные
    source_feed VARCHAR(255),  -- источник фида
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Проверки
    CONSTRAINT price_positive CHECK (price > 0),
    CONSTRAINT area_positive CHECK (area_total > 0),
    CONSTRAINT floor_logic CHECK (floor <= floors_total),
    CONSTRAINT coordinates_required CHECK (coordinates IS NOT NULL)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_offers_complex ON offers(complex_id) WHERE is_active = true;
CREATE INDEX idx_offers_building ON offers(building_id) WHERE is_active = true;
CREATE INDEX idx_offers_district ON offers(district_id) WHERE is_active = true;
CREATE INDEX idx_offers_metro ON offers(metro_station_id) WHERE is_active = true;
CREATE INDEX idx_offers_rooms ON offers(rooms) WHERE is_active = true;
CREATE INDEX idx_offers_studio ON offers(is_studio) WHERE is_active = true AND is_studio = true;

-- Составные индексы для фильтрации
CREATE INDEX idx_offers_price_range ON offers(price) WHERE is_active = true;
CREATE INDEX idx_offers_area_range ON offers(area_total) WHERE is_active = true;
CREATE INDEX idx_offers_price_per_sqm ON offers(price_per_sqm) WHERE is_active = true;
CREATE INDEX idx_offers_floor_range ON offers(floor, floors_total) WHERE is_active = true;

-- Индексы для геопоиска
CREATE INDEX idx_offers_coordinates ON offers USING GIST(coordinates) WHERE is_active = true;

-- Полнотекстовый поиск
CREATE INDEX idx_offers_description_fts ON offers USING gin(to_tsvector('russian', description));

-- Индексы для дат
CREATE INDEX idx_offers_updated ON offers(last_update_date DESC);
CREATE INDEX idx_offers_created ON offers(creation_date DESC);

-- Индекс для признака активности
CREATE INDEX idx_offers_active ON offers(is_active) WHERE is_active = true;

-- ============================================
-- ИЗОБРАЖЕНИЯ
-- ============================================

CREATE TABLE images (
    id BIGSERIAL PRIMARY KEY,
    offer_id BIGINT REFERENCES offers(id) ON DELETE CASCADE,

    -- Тип изображения
    tag VARCHAR(50),  -- plan, housemain, floorplan, complexscheme, null
    url VARCHAR(1000) NOT NULL,

    -- Метаданные
    width INTEGER,
    height INTEGER,
    file_size INTEGER,  -- в байтах

    -- Локальная копия (опционально)
    local_path VARCHAR(500),
    is_cached BOOLEAN DEFAULT false,

    -- Порядок отображения
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(offer_id, url)
);

CREATE INDEX idx_images_offer ON images(offer_id);
CREATE INDEX idx_images_tag ON images(tag);
CREATE INDEX idx_images_order ON images(offer_id, display_order);

-- ============================================
-- ПОЛЬЗОВАТЕЛИ И РОЛИ
-- ============================================

-- Роли: operator (платформа), agent (риэлтор), client (покупатель)
CREATE TYPE user_role AS ENUM ('operator', 'agent', 'client');

-- Агенты (риэлторы)
CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,

    -- Компания/агентство
    company_name VARCHAR(255),
    company_inn VARCHAR(12),

    -- Аутентификация
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,

    -- Статус и подписка
    status VARCHAR(20) DEFAULT 'pending',  -- pending, active, blocked
    subscription_tier VARCHAR(20) DEFAULT 'basic',  -- basic, pro, enterprise
    subscription_expires_at TIMESTAMP,

    -- Контакты для клиентов
    telegram_username VARCHAR(100),
    whatsapp_phone VARCHAR(20),

    -- Настройки уведомлений
    notification_settings JSONB DEFAULT '{"email": true, "telegram": false, "new_client_activity": true}',

    -- Статистика
    total_selections INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    successful_bookings INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX idx_agents_email ON agents(email);
CREATE INDEX idx_agents_phone ON agents(phone);
CREATE INDEX idx_agents_status ON agents(status);

-- Клиенты (покупатели, опциональная регистрация)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    phone VARCHAR(20),
    name VARCHAR(255),

    -- Аутентификация (опционально — клиент может быть без регистрации)
    password_hash VARCHAR(255),
    is_registered BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP,

    -- Хотя бы email или phone обязателен
    CONSTRAINT client_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE UNIQUE INDEX idx_clients_email_unique ON clients(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_clients_phone_unique ON clients(phone) WHERE phone IS NOT NULL;

-- Операторы платформы (админы)
CREATE TABLE operators (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    permissions JSONB DEFAULT '{"bookings": true, "agents": true, "feeds": true, "settings": false}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- ============================================
-- ПОДБОРКИ
-- ============================================

-- Подборки объектов (агент создаёт для клиента)
CREATE TABLE selections (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,  -- короткий код для ссылки: /s/abc123

    agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,

    -- Данные клиента (если не зарегистрирован)
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    client_name VARCHAR(255),

    title VARCHAR(255),  -- "Подборка для Марии"
    description TEXT,

    status VARCHAR(20) DEFAULT 'active',  -- active, archived, booked

    -- Статистика
    views_count INTEGER DEFAULT 0,
    last_client_activity_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_selections_code ON selections(code);
CREATE INDEX idx_selections_agent ON selections(agent_id);
CREATE INDEX idx_selections_client ON selections(client_id);
CREATE INDEX idx_selections_client_email ON selections(client_email);
CREATE INDEX idx_selections_client_phone ON selections(client_phone);
CREATE INDEX idx_selections_status ON selections(status);

-- Объекты в подборке
CREATE TABLE selection_items (
    id BIGSERIAL PRIMARY KEY,
    selection_id INTEGER REFERENCES selections(id) ON DELETE CASCADE,
    offer_id BIGINT REFERENCES offers(id) ON DELETE CASCADE,

    -- Кто добавил: agent или client
    added_by VARCHAR(10) DEFAULT 'agent',

    -- Реакция клиента
    client_reaction VARCHAR(10),  -- like, dislike, null

    -- Комментарии
    agent_comment TEXT,
    client_comment TEXT,

    -- Отслеживание изменений цены
    initial_price DECIMAL(15, 2),
    price_changed BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(selection_id, offer_id)
);

CREATE INDEX idx_selection_items_selection ON selection_items(selection_id);
CREATE INDEX idx_selection_items_offer ON selection_items(offer_id);
CREATE INDEX idx_selection_items_reaction ON selection_items(selection_id, client_reaction);

-- Находки клиента (объекты, которые клиент нашёл сам)
CREATE TABLE client_finds (
    id BIGSERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    offer_id BIGINT REFERENCES offers(id) ON DELETE CASCADE,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(client_id, offer_id)
);

CREATE INDEX idx_client_finds_client ON client_finds(client_id);

-- ============================================
-- БРОНИРОВАНИЯ
-- ============================================

-- Статусы бронирования
CREATE TYPE booking_status AS ENUM (
    'draft',           -- черновик, не отправлен
    'submitted',       -- отправлен оператору
    'in_progress',     -- оператор взял в работу
    'sent_to_developer', -- отправлено застройщику
    'confirmed',       -- застройщик подтвердил
    'rejected',        -- отклонено
    'completed',       -- сделка завершена
    'cancelled'        -- отменено
);

-- Бронирования
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(20) UNIQUE NOT NULL,  -- B-2024-0001

    -- Связи
    agent_id INTEGER REFERENCES agents(id) ON DELETE RESTRICT,
    selection_id INTEGER REFERENCES selections(id) ON DELETE SET NULL,
    offer_id BIGINT REFERENCES offers(id) ON DELETE RESTRICT,
    operator_id INTEGER REFERENCES operators(id),  -- кто обрабатывает

    -- Данные клиента
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    client_email VARCHAR(255),
    client_passport_series VARCHAR(10),
    client_passport_number VARCHAR(10),
    client_birth_date DATE,

    -- Оплата
    payment_method VARCHAR(20) NOT NULL,  -- mortgage, full_payment, installment
    mortgage_approved BOOLEAN DEFAULT false,
    mortgage_bank VARCHAR(100),

    -- Статус
    status booking_status DEFAULT 'draft',

    -- Комментарии
    agent_comment TEXT,
    operator_comment TEXT,
    developer_response TEXT,

    -- Важные даты
    submitted_at TIMESTAMP,
    taken_at TIMESTAMP,  -- когда оператор взял в работу
    sent_to_developer_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Комиссия (заполняется после успешной сделки)
    commission_amount DECIMAL(15, 2),
    commission_paid BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_number ON bookings(booking_number);
CREATE INDEX idx_bookings_agent ON bookings(agent_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_operator ON bookings(operator_id);
CREATE INDEX idx_bookings_offer ON bookings(offer_id);
CREATE INDEX idx_bookings_submitted ON bookings(submitted_at DESC) WHERE status != 'draft';

-- История изменений статуса бронирования
CREATE TABLE booking_history (
    id BIGSERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,

    status_from booking_status,
    status_to booking_status NOT NULL,

    changed_by_type VARCHAR(10) NOT NULL,  -- agent, operator
    changed_by_id INTEGER NOT NULL,

    comment TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_booking_history_booking ON booking_history(booking_id, created_at DESC);

-- ============================================
-- CRM-ВОРОНКА: ФИКСАЦИИ ЦЕН
-- ============================================

-- Статусы фиксации цены
CREATE TYPE price_lock_status AS ENUM (
    'pending',        -- ожидает подтверждения застройщика
    'approved',       -- застройщик подтвердил
    'rejected',       -- застройщик отклонил
    'expired',        -- истёк срок фиксации
    'converted'       -- клиент перешёл к бронированию
);

-- Фиксации цен (агент запрашивает у застройщика "заморозить" цену)
CREATE TABLE price_locks (
    id SERIAL PRIMARY KEY,
    lock_number VARCHAR(20) UNIQUE NOT NULL,  -- PL-2024-0001

    -- Связи
    agent_id INTEGER REFERENCES agents(id) ON DELETE RESTRICT,
    selection_id INTEGER REFERENCES selections(id) ON DELETE SET NULL,
    offer_id BIGINT REFERENCES offers(id) ON DELETE RESTRICT,
    operator_id INTEGER REFERENCES operators(id),  -- кто обрабатывает

    -- Данные клиента
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    client_email VARCHAR(255),

    -- Цена на момент фиксации
    locked_price DECIMAL(15, 2) NOT NULL,

    -- Срок фиксации
    requested_days INTEGER DEFAULT 7,  -- запрошенный срок (дней)
    approved_days INTEGER,  -- одобренный срок
    expires_at TIMESTAMP,  -- когда истекает

    -- Статус
    status price_lock_status DEFAULT 'pending',

    -- Комментарии
    agent_comment TEXT,
    operator_comment TEXT,
    developer_response TEXT,

    -- Важные даты
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    expired_at TIMESTAMP,
    converted_at TIMESTAMP,  -- когда перешёл в бронь

    -- Результат конвертации
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_locks_number ON price_locks(lock_number);
CREATE INDEX idx_price_locks_agent ON price_locks(agent_id);
CREATE INDEX idx_price_locks_status ON price_locks(status);
CREATE INDEX idx_price_locks_expires ON price_locks(expires_at) WHERE status = 'approved';
CREATE INDEX idx_price_locks_offer ON price_locks(offer_id);

CREATE TRIGGER update_price_locks_updated_at BEFORE UPDATE ON price_locks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CRM-ВОРОНКА: СДЕЛКИ
-- ============================================

-- Статусы сделки
CREATE TYPE deal_status AS ENUM (
    'pending',        -- ожидает подписания ДДУ
    'signed',         -- ДДУ подписан
    'registered',     -- зарегистрирован в Росреестре
    'completed',      -- акт приёма передан
    'cancelled'       -- отменена
);

-- Сделки (финальный этап воронки после бронирования)
CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    deal_number VARCHAR(20) UNIQUE NOT NULL,  -- D-2024-0001

    -- Связь с бронированием
    booking_id INTEGER REFERENCES bookings(id) ON DELETE RESTRICT,
    agent_id INTEGER REFERENCES agents(id) ON DELETE RESTRICT,
    offer_id BIGINT REFERENCES offers(id) ON DELETE RESTRICT,

    -- Данные ДДУ
    contract_number VARCHAR(100),
    contract_date DATE,

    -- Финансы
    final_price DECIMAL(15, 2) NOT NULL,  -- итоговая цена (может отличаться от брони)
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    discount_reason VARCHAR(255),

    -- Комиссия агенту
    commission_percent DECIMAL(5, 2),
    commission_amount DECIMAL(15, 2),
    commission_paid_at TIMESTAMP,
    commission_payment_status VARCHAR(20) DEFAULT 'pending',  -- pending, invoiced, paid

    -- Статус
    status deal_status DEFAULT 'pending',

    -- Важные даты
    signed_at TIMESTAMP,
    registered_at TIMESTAMP,
    registration_number VARCHAR(100),  -- номер регистрации в Росреестре
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,

    -- Комментарии
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deals_number ON deals(deal_number);
CREATE INDEX idx_deals_booking ON deals(booking_id);
CREATE INDEX idx_deals_agent ON deals(agent_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_commission_status ON deals(commission_payment_status) WHERE commission_payment_status != 'paid';

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CRM-ВОРОНКА: СРЫВЫ
-- ============================================

-- На каком этапе сорвалась сделка
CREATE TYPE cancellation_stage AS ENUM (
    'at_fixation',    -- на этапе фиксации цены
    'at_booking',     -- на этапе бронирования
    'at_deal'         -- на этапе сделки (после подписания ДДУ)
);

-- Срывы сделок (для аналитики и улучшения процессов)
CREATE TABLE deal_cancellations (
    id SERIAL PRIMARY KEY,

    -- Связи (один из трёх в зависимости от этапа)
    price_lock_id INTEGER REFERENCES price_locks(id) ON DELETE SET NULL,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,

    agent_id INTEGER REFERENCES agents(id) ON DELETE RESTRICT,
    offer_id BIGINT REFERENCES offers(id) ON DELETE SET NULL,

    -- Этап срыва
    stage cancellation_stage NOT NULL,

    -- Причина срыва
    reason VARCHAR(100) NOT NULL,  -- одна из предустановленных причин
    reason_details TEXT,  -- подробное описание

    -- Инициатор срыва
    initiated_by VARCHAR(20) NOT NULL,  -- client, developer, agent, bank

    -- Финансовые потери (если есть)
    penalty_amount DECIMAL(15, 2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cancellations_agent ON deal_cancellations(agent_id);
CREATE INDEX idx_cancellations_stage ON deal_cancellations(stage);
CREATE INDEX idx_cancellations_reason ON deal_cancellations(reason);
CREATE INDEX idx_cancellations_date ON deal_cancellations(created_at DESC);

-- Справочник причин срыва
CREATE TABLE cancellation_reasons (
    id SERIAL PRIMARY KEY,
    stage cancellation_stage NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO cancellation_reasons (stage, code, name) VALUES
    ('at_fixation', 'client_changed_mind', 'Клиент передумал'),
    ('at_fixation', 'found_better_option', 'Нашли лучший вариант'),
    ('at_fixation', 'price_increased', 'Застройщик поднял цену'),
    ('at_fixation', 'no_developer_response', 'Застройщик не ответил'),
    ('at_booking', 'mortgage_denied', 'Отказ в ипотеке'),
    ('at_booking', 'insufficient_funds', 'Недостаточно средств'),
    ('at_booking', 'apartment_sold', 'Квартира продана'),
    ('at_booking', 'client_changed_mind', 'Клиент передумал'),
    ('at_booking', 'documents_issue', 'Проблемы с документами'),
    ('at_deal', 'registration_issue', 'Проблемы при регистрации'),
    ('at_deal', 'developer_bankruptcy', 'Проблемы у застройщика'),
    ('at_deal', 'client_requested_refund', 'Клиент запросил возврат'),
    ('at_deal', 'court_dispute', 'Судебный спор');

-- ============================================
-- ФАЙЛЫ ЗАСТРОЙЩИКОВ И БАНКОВ
-- ============================================

-- Категории файлов
CREATE TYPE file_category AS ENUM (
    'regulations',      -- регламенты работы с застройщиком
    'presentations',    -- презентации ЖК
    'permits',          -- разрешительная документация
    'contracts',        -- шаблоны ДДУ
    'price_lists',      -- прайс-листы (если есть)
    'mortgage_docs',    -- документы по ипотеке
    'other'             -- прочее
);

-- Файлы застройщиков
CREATE TABLE developer_files (
    id SERIAL PRIMARY KEY,

    -- Связь (застройщик обязательно, ЖК опционально)
    developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,
    complex_id BIGINT REFERENCES complexes(id) ON DELETE SET NULL,

    -- Информация о файле
    category file_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,  -- оригинальное имя файла
    file_path VARCHAR(500) NOT NULL,  -- путь к файлу в хранилище
    file_size INTEGER,  -- в байтах
    mime_type VARCHAR(100),

    -- Версионирование
    version INTEGER DEFAULT 1,
    replaces_id INTEGER REFERENCES developer_files(id) ON DELETE SET NULL,

    -- Загрузка
    uploaded_by INTEGER REFERENCES operators(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Актуальность
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,  -- если документ временный

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dev_files_developer ON developer_files(developer_id);
CREATE INDEX idx_dev_files_complex ON developer_files(complex_id) WHERE complex_id IS NOT NULL;
CREATE INDEX idx_dev_files_category ON developer_files(category);
CREATE INDEX idx_dev_files_active ON developer_files(is_active) WHERE is_active = true;

CREATE TRIGGER update_developer_files_updated_at BEFORE UPDATE ON developer_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ИПОТЕЧНЫЕ ПРОГРАММЫ
-- ============================================

-- Банки
CREATE TABLE banks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ипотечные программы банков
CREATE TABLE mortgage_programs (
    id SERIAL PRIMARY KEY,
    bank_id INTEGER REFERENCES banks(id) ON DELETE CASCADE,

    -- Название программы
    name VARCHAR(255) NOT NULL,
    program_type VARCHAR(50) NOT NULL,  -- standard, family, it, military, subsidized

    -- Ставки
    rate_min DECIMAL(5, 2) NOT NULL,  -- минимальная ставка
    rate_max DECIMAL(5, 2),           -- максимальная (может быть NULL)
    is_floating_rate BOOLEAN DEFAULT false,  -- плавающая ставка

    -- Первоначальный взнос
    down_payment_min DECIMAL(5, 2) NOT NULL,  -- минимальный % первоначального взноса
    down_payment_max DECIMAL(5, 2),

    -- Срок кредита
    term_min INTEGER NOT NULL,  -- минимальный срок (месяцев)
    term_max INTEGER NOT NULL,  -- максимальный срок (месяцев)

    -- Сумма кредита
    amount_min DECIMAL(15, 2),  -- минимальная сумма
    amount_max DECIMAL(15, 2),  -- максимальная сумма (лимит программы)

    -- Условия
    conditions JSONB,  -- {age_min: 21, age_max: 65, documents: [...], requirements: [...]}
    description TEXT,

    -- Для каких застройщиков действует (NULL = для всех)
    applicable_developers INTEGER[],  -- массив ID застройщиков

    -- Актуальность
    is_active BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_until DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mortgage_bank ON mortgage_programs(bank_id);
CREATE INDEX idx_mortgage_type ON mortgage_programs(program_type);
CREATE INDEX idx_mortgage_rate ON mortgage_programs(rate_min) WHERE is_active = true;
CREATE INDEX idx_mortgage_active ON mortgage_programs(is_active) WHERE is_active = true;

CREATE TRIGGER update_mortgage_programs_updated_at BEFORE UPDATE ON mortgage_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- СТАТИСТИКА ПРОСМОТРОВ ПОДБОРОК
-- ============================================

-- Детальная статистика просмотров подборок клиентами
CREATE TABLE selection_views (
    id BIGSERIAL PRIMARY KEY,
    selection_id INTEGER REFERENCES selections(id) ON DELETE CASCADE,

    -- Сессия (для анонимных клиентов)
    session_id VARCHAR(100),
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,

    -- Устройство и IP
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20),  -- desktop, mobile, tablet

    -- Время просмотра
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,  -- сколько провёл на странице подборки
    left_at TIMESTAMP,

    -- Какие объекты просматривал
    viewed_offers BIGINT[],  -- массив ID просмотренных объектов
    clicked_offers BIGINT[], -- на какие кликнул для детального просмотра

    -- Реакции за сессию
    liked_offers BIGINT[],
    disliked_offers BIGINT[],
    added_comments INTEGER DEFAULT 0
);

CREATE INDEX idx_sel_views_selection ON selection_views(selection_id, viewed_at DESC);
CREATE INDEX idx_sel_views_date ON selection_views(viewed_at DESC);
CREATE INDEX idx_sel_views_session ON selection_views(session_id);

-- Статистика просмотра конкретного объекта в подборке
CREATE TABLE selection_item_views (
    id BIGSERIAL PRIMARY KEY,
    selection_id INTEGER REFERENCES selections(id) ON DELETE CASCADE,
    offer_id BIGINT REFERENCES offers(id) ON DELETE CASCADE,

    session_id VARCHAR(100),
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,

    -- Время просмотра
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,  -- сколько времени смотрел именно этот объект

    -- Действия
    scrolled_photos BOOLEAN DEFAULT false,
    opened_floor_plan BOOLEAN DEFAULT false,
    clicked_phone BOOLEAN DEFAULT false,
    added_to_comparison BOOLEAN DEFAULT false,

    -- Источник (откуда пришёл)
    source VARCHAR(50)  -- selection_list, map, search, recommendation
);

CREATE INDEX idx_item_views_selection ON selection_item_views(selection_id);
CREATE INDEX idx_item_views_offer ON selection_item_views(offer_id);
CREATE INDEX idx_item_views_date ON selection_item_views(viewed_at DESC);

-- ============================================
-- ИСТОРИЯ И АНАЛИТИКА
-- ============================================

-- История изменения цен
CREATE TABLE price_history (
    id BIGSERIAL PRIMARY KEY,
    offer_id BIGINT REFERENCES offers(id) ON DELETE CASCADE,

    price_old DECIMAL(15, 2),
    price_new DECIMAL(15, 2) NOT NULL,
    change_percent DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN price_old IS NOT NULL AND price_old > 0
        THEN ((price_new - price_old) / price_old * 100)
        ELSE NULL END
    ) STORED,

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_history_offer ON price_history(offer_id, changed_at DESC);
CREATE INDEX idx_price_history_date ON price_history(changed_at);

-- Агрегированная статистика по районам (материализованное представление)
CREATE MATERIALIZED VIEW district_statistics AS
SELECT
    d.id as district_id,
    d.name as district_name,
    COUNT(o.id) as total_offers,
    MIN(o.price) as min_price,
    MAX(o.price) as max_price,
    AVG(o.price) as avg_price,
    AVG(o.price_per_sqm) as avg_price_per_sqm,
    MIN(o.area_total) as min_area,
    MAX(o.area_total) as max_area,
    AVG(o.area_total) as avg_area,

    -- Разбивка по комнатам
    COUNT(*) FILTER (WHERE o.rooms = 0 OR o.is_studio) as studios,
    COUNT(*) FILTER (WHERE o.rooms = 1) as one_room,
    COUNT(*) FILTER (WHERE o.rooms = 2) as two_rooms,
    COUNT(*) FILTER (WHERE o.rooms = 3) as three_rooms,
    COUNT(*) FILTER (WHERE o.rooms >= 4) as four_plus_rooms,

    -- Средняя цена по комнатам
    AVG(o.price) FILTER (WHERE o.rooms = 0 OR o.is_studio) as avg_price_studio,
    AVG(o.price) FILTER (WHERE o.rooms = 1) as avg_price_1room,
    AVG(o.price) FILTER (WHERE o.rooms = 2) as avg_price_2rooms,
    AVG(o.price) FILTER (WHERE o.rooms = 3) as avg_price_3rooms,

    -- Состояние строительства
    COUNT(*) FILTER (WHERE b.building_state = 'unfinished') as unfinished,
    COUNT(*) FILTER (WHERE b.building_state = 'hand-over') as hand_over,

    CURRENT_TIMESTAMP as updated_at
FROM districts d
LEFT JOIN offers o ON o.district_id = d.id AND o.is_active = true
LEFT JOIN buildings b ON o.building_id = b.id
GROUP BY d.id, d.name;

CREATE UNIQUE INDEX idx_district_stats_id ON district_statistics(district_id);

-- Агрегированная статистика по ЖК
CREATE MATERIALIZED VIEW complex_statistics AS
SELECT
    c.id as complex_id,
    c.name as complex_name,
    c.district_id,
    COUNT(o.id) as total_offers,
    MIN(o.price) as min_price,
    MAX(o.price) as max_price,
    AVG(o.price) as avg_price,
    AVG(o.price_per_sqm) as avg_price_per_sqm,
    array_agg(DISTINCT o.rooms ORDER BY o.rooms) as available_rooms,
    COUNT(DISTINCT b.id) as buildings_count,

    CURRENT_TIMESTAMP as updated_at
FROM complexes c
LEFT JOIN offers o ON o.complex_id = c.id AND o.is_active = true
LEFT JOIN buildings b ON o.building_id = b.id
GROUP BY c.id, c.name, c.district_id;

CREATE UNIQUE INDEX idx_complex_stats_id ON complex_statistics(complex_id);

-- ============================================
-- ЛОГИ И АУДИТ
-- ============================================

-- Лог импорта фидов
CREATE TABLE feed_import_logs (
    id BIGSERIAL PRIMARY KEY,

    feed_source VARCHAR(255) NOT NULL,
    feed_url VARCHAR(500),

    status VARCHAR(20) NOT NULL,  -- success, partial, failed

    -- Статистика
    total_offers INTEGER DEFAULT 0,
    imported_offers INTEGER DEFAULT 0,
    updated_offers INTEGER DEFAULT 0,
    failed_offers INTEGER DEFAULT 0,

    -- Время выполнения
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_seconds INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER
    ) STORED,

    -- Детали ошибок
    error_details JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feed_logs_date ON feed_import_logs(started_at DESC);
CREATE INDEX idx_feed_logs_source ON feed_import_logs(feed_source, started_at DESC);

-- Лог действий пользователей
CREATE TABLE user_activity_log (
    id BIGSERIAL PRIMARY KEY,

    -- Кто выполнил действие (один из трёх типов)
    actor_type VARCHAR(10),  -- agent, client, guest
    agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,

    action VARCHAR(50) NOT NULL,  -- search, view, add_to_selection, compare, booking
    entity_type VARCHAR(50),  -- offer, complex, selection, booking
    entity_id BIGINT,

    -- Детали
    details JSONB,

    -- Метаданные
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),  -- для анонимных пользователей

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_agent ON user_activity_log(agent_id, created_at DESC) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_activity_client ON user_activity_log(client_id, created_at DESC) WHERE client_id IS NOT NULL;
CREATE INDEX idx_activity_action ON user_activity_log(action, created_at DESC);
CREATE INDEX idx_activity_date ON user_activity_log(created_at DESC);

-- ============================================
-- ТРИГГЕРЫ
-- ============================================

-- Автоматическое обновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complexes_updated_at BEFORE UPDATE ON complexes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_selections_updated_at BEFORE UPDATE ON selections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_selection_items_updated_at BEFORE UPDATE ON selection_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Логирование изменения цены
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO price_history (offer_id, price_old, price_new)
        VALUES (NEW.id, OLD.price, NEW.price);

        -- Уведомление об изменении цены в подборках
        UPDATE selection_items
        SET price_changed = true, updated_at = CURRENT_TIMESTAMP
        WHERE offer_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_price_change AFTER UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION log_price_change();

-- Автоматическое определение студий
CREATE OR REPLACE FUNCTION set_studio_flag()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rooms = 0 THEN
        NEW.is_studio = true;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_set_studio BEFORE INSERT OR UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION set_studio_flag();

-- Обновление счетчиков в комплексах
CREATE OR REPLACE FUNCTION update_complex_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE complexes
        SET total_apartments = total_apartments + 1
        WHERE id = NEW.complex_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE complexes
        SET total_apartments = total_apartments - 1
        WHERE id = OLD.complex_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_complex_counters
AFTER INSERT OR DELETE ON offers
FOR EACH ROW EXECUTE FUNCTION update_complex_counters();

-- ============================================
-- ФУНКЦИИ ДЛЯ ПОИСКА
-- ============================================

-- Функция поиска объявлений в радиусе от точки
CREATE OR REPLACE FUNCTION find_offers_nearby(
    lat DECIMAL,
    lng DECIMAL,
    radius_meters INTEGER DEFAULT 1000,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    offer_id BIGINT,
    distance_meters DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        ST_Distance(
            o.coordinates::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        )::DECIMAL as distance
    FROM offers o
    WHERE o.is_active = true
    AND ST_DWithin(
        o.coordinates::geography,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
    )
    ORDER BY distance
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Функция полнотекстового поиска
CREATE OR REPLACE FUNCTION search_offers_by_text(
    search_query TEXT,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    offer_id BIGINT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        ts_rank(to_tsvector('russian', o.description), plainto_tsquery('russian', search_query)) as rank
    FROM offers o
    WHERE o.is_active = true
    AND to_tsvector('russian', o.description) @@ plainto_tsquery('russian', search_query)
    ORDER BY rank DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ПРЕДСТАВЛЕНИЯ ДЛЯ УДОБНОГО ДОСТУПА
-- ============================================

-- Полная информация об объявлении
CREATE VIEW offers_full AS
SELECT
    o.*,
    c.name as complex_name,
    b.name as building_name,
    b.building_type,
    b.building_state,
    b.built_year,
    b.ready_quarter,
    d.name as district_name,
    m.name as metro_name,
    sa.phone as agent_phone,
    sa.email as agent_email,
    sa.organization as agent_organization,

    -- Агрегация изображений
    json_agg(json_build_object(
        'tag', img.tag,
        'url', img.url
    ) ORDER BY img.display_order) FILTER (WHERE img.id IS NOT NULL) as images

FROM offers o
LEFT JOIN complexes c ON o.complex_id = c.id
LEFT JOIN buildings b ON o.building_id = b.id
LEFT JOIN districts d ON o.district_id = d.id
LEFT JOIN metro_stations m ON o.metro_station_id = m.id
LEFT JOIN sales_agents sa ON o.sales_agent_id = sa.id
LEFT JOIN images img ON o.id = img.offer_id
GROUP BY o.id, c.id, b.id, d.id, m.id, sa.id;

-- ============================================
-- РАСШИРЕНИЕ: ЮРИДИЧЕСКИЕ ТИПЫ И ФИНАНСИРОВАНИЕ
-- ============================================
-- Добавлено после анализа конкурентов (TrendAgent)

-- Типы сделок
CREATE TYPE deal_type AS ENUM (
    'ddu',           -- ДДУ (договор долевого участия)
    'assignment_legal', -- Уступка от юр. лица
    'assignment_individual', -- Уступка от физ. лица
    'reassignment'   -- Переуступка (вторичная)
);

-- Типы продавцов
CREATE TYPE seller_type AS ENUM (
    'developer',     -- Застройщик
    'legal_entity',  -- Юр. лицо (инвестор)
    'individual'     -- Физ. лицо
);

-- Тип планировки (евро-формат)
CREATE TYPE room_type AS ENUM (
    'studio',        -- Студия (С)
    'room_1',        -- 1-комнатная
    'euro_1',        -- Евро-1 (1Е) - 1 спальня + кухня-гостиная
    'room_2',        -- 2-комнатная
    'euro_2',        -- Евро-2 (2Е) - 2 спальни + кухня-гостиная
    'room_3',        -- 3-комнатная
    'euro_3',        -- Евро-3 (3Е) - 3 спальни + кухня-гостиная
    'room_4_plus'    -- 4+ комнат
);

-- Тренд цены
CREATE TYPE price_trend AS ENUM (
    'up',            -- Цена выросла
    'down',          -- Цена снизилась
    'stable'         -- Цена стабильна
);

-- Регион регистрации (прописки)
CREATE TYPE registration_region AS ENUM (
    'spb',           -- Санкт-Петербург
    'leningrad_oblast' -- Ленинградская область
);

-- Добавляем новые поля в таблицу offers
ALTER TABLE offers ADD COLUMN IF NOT EXISTS deal_type deal_type;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS seller_type seller_type;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS has_escrow BOOLEAN DEFAULT true;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_apartment BOOLEAN DEFAULT false; -- Апартаменты (не квартира)
ALTER TABLE offers ADD COLUMN IF NOT EXISTS registration_region registration_region;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS room_type room_type;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_euro_layout BOOLEAN DEFAULT false;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS kitchen_living_combined BOOLEAN DEFAULT false; -- Кухня-гостиная

-- Поля для динамики цен
ALTER TABLE offers ADD COLUMN IF NOT EXISTS initial_price DECIMAL(15, 2); -- Цена при первом появлении
ALTER TABLE offers ADD COLUMN IF NOT EXISTS current_price_trend price_trend DEFAULT 'stable';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS last_price_change_date TIMESTAMP;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS last_price_change_percent DECIMAL(5, 2); -- Последнее изменение в %

-- Индексы для новых полей
CREATE INDEX IF NOT EXISTS idx_offers_deal_type ON offers(deal_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_escrow ON offers(has_escrow) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_apartment ON offers(is_apartment) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_registration ON offers(registration_region) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_room_type ON offers(room_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_euro ON offers(is_euro_layout) WHERE is_active = true AND is_euro_layout = true;
CREATE INDEX IF NOT EXISTS idx_offers_price_trend ON offers(current_price_trend) WHERE is_active = true;

-- ============================================
-- БАНКОВСКИЕ АККРЕДИТАЦИИ
-- ============================================

-- Аккредитация ЖК/застройщика банком
CREATE TABLE IF NOT EXISTS developer_bank_accreditation (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,
    complex_id BIGINT REFERENCES complexes(id) ON DELETE CASCADE,
    bank_id INTEGER REFERENCES banks(id) ON DELETE CASCADE,

    -- Детали аккредитации
    accreditation_date DATE,
    expiration_date DATE,
    accreditation_number VARCHAR(100),

    -- Статус
    is_active BOOLEAN DEFAULT true,
    verified_at TIMESTAMP,
    verified_by INTEGER, -- ID оператора

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Уникальность: один банк - один ЖК
    UNIQUE(complex_id, bank_id)
);

CREATE INDEX idx_accreditation_complex ON developer_bank_accreditation(complex_id) WHERE is_active = true;
CREATE INDEX idx_accreditation_bank ON developer_bank_accreditation(bank_id) WHERE is_active = true;
CREATE INDEX idx_accreditation_developer ON developer_bank_accreditation(developer_id) WHERE is_active = true;

-- ============================================
-- РАССРОЧКА ОТ ЗАСТРОЙЩИКА
-- ============================================

CREATE TYPE installment_type AS ENUM (
    'interest_free',   -- Беспроцентная (до сдачи)
    'subsidized',      -- Субсидированная (сниженный %)
    'standard',        -- Стандартная (рыночный %)
    'trade_in'         -- Trade-in (зачёт старой квартиры)
);

CREATE TABLE IF NOT EXISTS developer_installments (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,
    complex_id BIGINT REFERENCES complexes(id) ON DELETE CASCADE, -- NULL = для всех ЖК застройщика

    -- Тип и название
    installment_type installment_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Условия
    min_down_payment DECIMAL(5, 2) NOT NULL, -- Мин. первый взнос (%)
    interest_rate DECIMAL(5, 2) DEFAULT 0, -- Процент (0 для беспроцентной)
    max_duration_months INTEGER, -- Макс. срок в месяцах
    duration_until_completion BOOLEAN DEFAULT false, -- До сдачи дома

    -- Ограничения
    min_property_price DECIMAL(15, 2),
    max_property_price DECIMAL(15, 2),
    applicable_rooms INTEGER[], -- Для каких комнатностей

    -- Переход на ипотеку
    mortgage_transition_allowed BOOLEAN DEFAULT true,
    mortgage_transition_terms TEXT,

    -- После сдачи (если рассрочка продолжается)
    post_completion_rate DECIMAL(5, 2), -- % после сдачи
    post_completion_max_months INTEGER,

    -- Сроки действия
    start_date DATE,
    end_date DATE,

    -- Документация
    document_url VARCHAR(500),

    -- Статус
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Порядок отображения

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_installments_developer ON developer_installments(developer_id) WHERE is_active = true;
CREATE INDEX idx_installments_complex ON developer_installments(complex_id) WHERE is_active = true;
CREATE INDEX idx_installments_type ON developer_installments(installment_type) WHERE is_active = true;

-- ============================================
-- АКЦИИ И СПЕЦИАЛЬНЫЕ ПРЕДЛОЖЕНИЯ
-- ============================================

CREATE TYPE promotion_type AS ENUM (
    'discount',           -- Скидка
    'gift',               -- Подарок
    'mortgage_subsidy',   -- Субсидия на ипотеку
    'installment',        -- Спец. рассрочка
    'cashback'            -- Кэшбэк
);

CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,

    -- Тип и название
    promotion_type promotion_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Размер выгоды
    discount_percent DECIMAL(5, 2),
    discount_amount DECIMAL(15, 2),
    gift_description VARCHAR(500),
    gift_value DECIMAL(15, 2),

    -- Условия применения (JSON)
    conditions JSONB DEFAULT '{}',
    -- Пример: {"payment_types": ["full", "mortgage"], "min_rooms": 2, "renovation_types": ["под ключ"]}

    -- К каким ЖК применяется
    complex_ids BIGINT[], -- NULL = ко всем ЖК застройщика

    -- Сроки
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Отображение
    priority INTEGER DEFAULT 0,
    badge_color VARCHAR(7), -- HEX цвет бейджа
    icon_type VARCHAR(50),

    -- Документация
    document_url VARCHAR(500),

    -- Статус
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promotions_developer ON promotions(developer_id) WHERE is_active = true;
CREATE INDEX idx_promotions_type ON promotions(promotion_type) WHERE is_active = true;
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date) WHERE is_active = true;
CREATE INDEX idx_promotions_complexes ON promotions USING gin(complex_ids) WHERE is_active = true;

-- ============================================
-- ПОИСКОВЫЕ ПОДСКАЗКИ (КЭШ)
-- ============================================

CREATE TYPE suggestion_category AS ENUM (
    'metro',
    'district',
    'complex',
    'street',
    'developer',
    'bank'
);

CREATE TABLE IF NOT EXISTS search_suggestions (
    id SERIAL PRIMARY KEY,
    category suggestion_category NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255), -- С доп. инфо
    subtitle VARCHAR(255),
    object_count INTEGER DEFAULT 0, -- Кол-во объектов
    reference_id VARCHAR(50), -- ID в справочнике

    -- Для поиска
    search_vector TSVECTOR,

    -- Приоритет
    priority INTEGER DEFAULT 0,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(category, reference_id)
);

CREATE INDEX idx_suggestions_category ON search_suggestions(category);
CREATE INDEX idx_suggestions_name_trgm ON search_suggestions USING gin(name gin_trgm_ops);
CREATE INDEX idx_suggestions_search ON search_suggestions USING gin(search_vector);

-- ============================================
-- МАТЕРИАЛИЗОВАННОЕ ПРЕДСТАВЛЕНИЕ: ПОДСЧЁТЫ
-- ============================================

-- Для быстрого подсчёта результатов поиска
CREATE MATERIALIZED VIEW IF NOT EXISTS offer_counts AS
SELECT
    district_id,
    rooms,
    room_type,
    renovation,
    deal_type,
    has_escrow,
    is_apartment,
    registration_region,
    CASE
        WHEN price < 5000000 THEN 'budget'
        WHEN price < 10000000 THEN 'comfort'
        WHEN price < 20000000 THEN 'business'
        ELSE 'premium'
    END AS price_segment,
    COUNT(*) as offer_count,
    COUNT(DISTINCT complex_id) as complex_count
FROM offers
WHERE is_active = true
GROUP BY
    district_id, rooms, room_type, renovation, deal_type,
    has_escrow, is_apartment, registration_region, price_segment;

CREATE UNIQUE INDEX idx_offer_counts_unique ON offer_counts (
    COALESCE(district_id, -1),
    COALESCE(rooms, -1),
    COALESCE(room_type::text, ''),
    COALESCE(renovation, ''),
    COALESCE(deal_type::text, ''),
    COALESCE(has_escrow, false),
    COALESCE(is_apartment, false),
    COALESCE(registration_region::text, ''),
    COALESCE(price_segment, '')
);

-- Обновление представления (вызывать по cron каждые 5 минут)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY offer_counts;

-- ============================================
-- ТРИГГЕР: ОПРЕДЕЛЕНИЕ ЕВРО-ПЛАНИРОВКИ
-- ============================================

CREATE OR REPLACE FUNCTION detect_euro_layout()
RETURNS TRIGGER AS $$
BEGIN
    -- Определяем евро-планировку по соотношению площадей
    -- Евро: кухня > 12 м² И (кухня / жилая) > 0.5
    IF NEW.area_kitchen IS NOT NULL AND NEW.area_living IS NOT NULL THEN
        IF NEW.area_kitchen > 12 AND (NEW.area_kitchen / NULLIF(NEW.area_living, 0)) > 0.5 THEN
            NEW.is_euro_layout = true;
            NEW.kitchen_living_combined = true;

            -- Определяем room_type
            CASE NEW.rooms
                WHEN 0 THEN NEW.room_type = 'studio';
                WHEN 1 THEN NEW.room_type = 'euro_1';
                WHEN 2 THEN NEW.room_type = 'euro_2';
                WHEN 3 THEN NEW.room_type = 'euro_3';
                ELSE NEW.room_type = 'room_4_plus';
            END CASE;
        ELSE
            NEW.is_euro_layout = false;
            NEW.kitchen_living_combined = false;

            -- Обычная планировка
            CASE NEW.rooms
                WHEN 0 THEN NEW.room_type = 'studio';
                WHEN 1 THEN NEW.room_type = 'room_1';
                WHEN 2 THEN NEW.room_type = 'room_2';
                WHEN 3 THEN NEW.room_type = 'room_3';
                ELSE NEW.room_type = 'room_4_plus';
            END CASE;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_detect_euro_layout
    BEFORE INSERT OR UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION detect_euro_layout();

-- ============================================
-- ТРИГГЕР: ОТСЛЕЖИВАНИЕ НАЧАЛЬНОЙ ЦЕНЫ И ТРЕНДА
-- ============================================

CREATE OR REPLACE FUNCTION track_price_trend()
RETURNS TRIGGER AS $$
DECLARE
    price_change_percent DECIMAL(5, 2);
BEGIN
    -- Устанавливаем начальную цену при первом добавлении
    IF TG_OP = 'INSERT' THEN
        NEW.initial_price = NEW.price;
        NEW.current_price_trend = 'stable';
    ELSIF TG_OP = 'UPDATE' AND OLD.price IS DISTINCT FROM NEW.price THEN
        -- Рассчитываем процент изменения
        IF OLD.price > 0 THEN
            price_change_percent = ((NEW.price - OLD.price) / OLD.price) * 100;
            NEW.last_price_change_percent = price_change_percent;
            NEW.last_price_change_date = CURRENT_TIMESTAMP;

            -- Определяем тренд
            IF price_change_percent > 0 THEN
                NEW.current_price_trend = 'up';
            ELSIF price_change_percent < 0 THEN
                NEW.current_price_trend = 'down';
            ELSE
                NEW.current_price_trend = 'stable';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_price_trend
    BEFORE INSERT OR UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION track_price_trend();

-- ============================================
-- ФУНКЦИЯ: ПОИСК ЖК ПО НАЗВАНИЮ
-- ============================================

CREATE OR REPLACE FUNCTION search_complexes_by_name(search_query TEXT)
RETURNS TABLE (
    id BIGINT,
    name VARCHAR,
    district_name VARCHAR,
    developer_name VARCHAR,
    offer_count BIGINT,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        d.name AS district_name,
        dev.name AS developer_name,
        COUNT(o.id) AS offer_count,
        similarity(c.name, search_query) AS similarity_score
    FROM complexes c
    LEFT JOIN districts d ON c.district_id = d.id
    LEFT JOIN developers dev ON c.developer_id = dev.id
    LEFT JOIN offers o ON o.complex_id = c.id AND o.is_active = true
    WHERE
        c.name % search_query
        OR c.name ILIKE search_query || '%'
    GROUP BY c.id, c.name, d.name, dev.name
    ORDER BY
        c.name ILIKE search_query || '%' DESC,
        similarity(c.name, search_query) DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- КОММЕНТАРИИ К НОВЫМ ТАБЛИЦАМ
-- ============================================

COMMENT ON TABLE developer_bank_accreditation IS 'Аккредитации ЖК/застройщиков банками';
COMMENT ON TABLE developer_installments IS 'Программы рассрочки от застройщиков';
COMMENT ON TABLE promotions IS 'Акции и специальные предложения застройщиков';
COMMENT ON TABLE search_suggestions IS 'Кэш поисковых подсказок для автодополнения';
COMMENT ON MATERIALIZED VIEW offer_counts IS 'Предварительно рассчитанные подсчёты для быстрого поиска';

COMMENT ON COLUMN offers.deal_type IS 'Тип сделки: ДДУ, уступка от юр.лица, уступка от физ.лица, переуступка';
COMMENT ON COLUMN offers.seller_type IS 'Тип продавца: застройщик, юр.лицо, физ.лицо';
COMMENT ON COLUMN offers.has_escrow IS 'Эскроу-счёт (обязательно для ДДУ после 01.07.2019)';
COMMENT ON COLUMN offers.is_apartment IS 'Апартаменты (не квартира, нет постоянной прописки)';
COMMENT ON COLUMN offers.registration_region IS 'Регион регистрации (прописки): СПб или Ленобласть';
COMMENT ON COLUMN offers.room_type IS 'Тип комнатности с учётом евро-форматов';
COMMENT ON COLUMN offers.is_euro_layout IS 'Евро-планировка (кухня-гостиная объединены)';
COMMENT ON COLUMN offers.initial_price IS 'Начальная цена при первом появлении в базе';
COMMENT ON COLUMN offers.current_price_trend IS 'Текущий тренд цены: вверх, вниз, стабильно';

-- ============================================
-- КОММЕНТАРИИ
-- ============================================

COMMENT ON TABLE offers IS 'Объявления о продаже недвижимости';
COMMENT ON TABLE complexes IS 'Жилые комплексы';
COMMENT ON TABLE buildings IS 'Корпуса и здания';
COMMENT ON TABLE districts IS 'Районы города';
COMMENT ON TABLE metro_stations IS 'Станции метро';
COMMENT ON TABLE images IS 'Изображения объектов';
COMMENT ON TABLE price_history IS 'История изменения цен';
COMMENT ON TABLE agents IS 'Агенты (риэлторы)';
COMMENT ON TABLE clients IS 'Клиенты (покупатели)';
COMMENT ON TABLE operators IS 'Операторы платформы';
COMMENT ON TABLE selections IS 'Подборки объектов для клиентов';
COMMENT ON TABLE selection_items IS 'Объекты в подборках';
COMMENT ON TABLE client_finds IS 'Находки клиентов (самостоятельный поиск)';
COMMENT ON TABLE bookings IS 'Бронирования квартир';
COMMENT ON TABLE booking_history IS 'История изменений статуса бронирований';
COMMENT ON TABLE price_locks IS 'Фиксации цен (CRM-воронка)';
COMMENT ON TABLE deals IS 'Сделки (CRM-воронка)';
COMMENT ON TABLE deal_cancellations IS 'Срывы сделок (CRM-воронка)';
COMMENT ON TABLE cancellation_reasons IS 'Справочник причин срыва сделок';
COMMENT ON TABLE developer_files IS 'Файлы застройщиков (регламенты, ДДУ, презентации)';
COMMENT ON TABLE banks IS 'Банки (для ипотечных программ)';
COMMENT ON TABLE mortgage_programs IS 'Ипотечные программы банков';
COMMENT ON TABLE selection_views IS 'Статистика просмотров подборок';
COMMENT ON TABLE selection_item_views IS 'Статистика просмотров объектов в подборках';

-- ============================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- ============================================

-- Добавление районов Санкт-Петербурга
INSERT INTO districts (name, region) VALUES
    ('Адмиралтейский', 'Санкт-Петербург'),
    ('Василеостровский', 'Санкт-Петербург'),
    ('Выборгский', 'Санкт-Петербург'),
    ('Калининский', 'Санкт-Петербург'),
    ('Кировский', 'Санкт-Петербург'),
    ('Колпинский', 'Санкт-Петербург'),
    ('Красногвардейский', 'Санкт-Петербург'),
    ('Красносельский', 'Санкт-Петербург'),
    ('Кронштадтский', 'Санкт-Петербург'),
    ('Курортный', 'Санкт-Петербург'),
    ('Московский', 'Санкт-Петербург'),
    ('Невский', 'Санкт-Петербург'),
    ('Петроградский', 'Санкт-Петербург'),
    ('Петродворцовый', 'Санкт-Петербург'),
    ('Приморский', 'Санкт-Петербург'),
    ('Пушкинский', 'Санкт-Петербург'),
    ('Фрунзенский', 'Санкт-Петербург'),
    ('Центральный', 'Санкт-Петербург')
ON CONFLICT (name) DO NOTHING;

-- Добавление основных банков
INSERT INTO banks (name, website) VALUES
    ('Сбербанк', 'https://www.sberbank.ru'),
    ('ВТБ', 'https://www.vtb.ru'),
    ('Газпромбанк', 'https://www.gazprombank.ru'),
    ('Альфа-Банк', 'https://alfabank.ru'),
    ('Россельхозбанк', 'https://www.rshb.ru'),
    ('Банк ДОМ.РФ', 'https://domrfbank.ru'),
    ('Росбанк', 'https://www.rosbank.ru'),
    ('Райффайзенбанк', 'https://www.raiffeisen.ru'),
    ('Уралсиб', 'https://www.uralsib.ru'),
    ('Открытие', 'https://www.open.ru'),
    ('Совкомбанк', 'https://sovcombank.ru'),
    ('ПСБ', 'https://www.psbank.ru'),
    ('АК Барс', 'https://www.akbars.ru'),
    ('Абсолют Банк', 'https://absolutbank.ru')
ON CONFLICT (name) DO NOTHING;
