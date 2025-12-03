-- Migration 009: Guest booking and selection context
-- Добавляет возможность гостевого бронирования через подборки агентов
-- Все бронирования атрибутируются к агенту, который поделился ссылкой

-- ============================================
-- 1. Источник бронирования (откуда пришла заявка)
-- ============================================

-- Тип источника бронирования
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_source_type') THEN
        CREATE TYPE booking_source_type AS ENUM (
            'organic',              -- Обычное бронирование через сайт
            'guest_from_selection', -- Гость перешёл по ссылке подборки
            'agent_direct'          -- Агент создал бронь напрямую
        );
    END IF;
END$$;

-- Добавляем колонки для отслеживания источника бронирования
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS source_type booking_source_type DEFAULT 'organic';

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS source_selection_id INTEGER REFERENCES selections(id) ON DELETE SET NULL;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS source_selection_code VARCHAR(32);

-- Идентификатор гостя (UUID из localStorage)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS guest_client_id VARCHAR(64);

-- User ID клиента (если авторизован)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Комментарий клиента при бронировании
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS comment TEXT;

-- ============================================
-- 2. Статистика подборок по бронированиям
-- ============================================

ALTER TABLE selections
ADD COLUMN IF NOT EXISTS bookings_count INTEGER DEFAULT 0;

ALTER TABLE selections
ADD COLUMN IF NOT EXISTS last_booking_at TIMESTAMP;

-- ============================================
-- 3. Индексы для быстрого поиска
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bookings_source_type ON bookings(source_type);
CREATE INDEX IF NOT EXISTS idx_bookings_source_selection ON bookings(source_selection_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_client ON bookings(guest_client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);

-- ============================================
-- 4. Комментарии к полям
-- ============================================

COMMENT ON COLUMN bookings.source_type IS 'Источник бронирования: organic/guest_from_selection/agent_direct';
COMMENT ON COLUMN bookings.source_selection_id IS 'ID подборки, через которую пришёл гость';
COMMENT ON COLUMN bookings.source_selection_code IS 'Код подборки для отображения (денормализация)';
COMMENT ON COLUMN bookings.guest_client_id IS 'UUID гостя из localStorage (для неавторизованных)';
COMMENT ON COLUMN bookings.user_id IS 'ID пользователя если авторизован';
COMMENT ON COLUMN selections.bookings_count IS 'Количество бронирований через эту подборку';
COMMENT ON COLUMN selections.last_booking_at IS 'Дата последнего бронирования через подборку';
