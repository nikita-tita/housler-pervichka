-- Migration 005: CRM-модуль клиентов
-- Добавляет поля для управления воронкой продаж

-- 1. Источник клиента
DO $$ BEGIN
    CREATE TYPE client_source AS ENUM ('manual', 'selection', 'booking', 'import', 'website');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Этап воронки
DO $$ BEGIN
    CREATE TYPE client_stage AS ENUM ('new', 'in_progress', 'fixation', 'booking', 'deal', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Приоритет клиента
DO $$ BEGIN
    CREATE TYPE client_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Создаём таблицу clients если не существует (упрощённая версия)
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Контакты
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    telegram VARCHAR(100),
    whatsapp VARCHAR(20),

    -- CRM поля
    source client_source DEFAULT 'manual',
    stage client_stage DEFAULT 'new',
    priority client_priority DEFAULT 'medium',
    comment TEXT,

    -- Пожелания клиента
    budget_min DECIMAL(15, 2),
    budget_max DECIMAL(15, 2),
    desired_rooms INTEGER[],
    desired_districts INTEGER[],
    desired_deadline DATE,

    -- Даты контактов
    next_contact_date DATE,
    last_contact_date DATE,

    -- Метаданные
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Добавляем поля если таблица уже существует
ALTER TABLE clients ADD COLUMN IF NOT EXISTS agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS telegram VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source client_source DEFAULT 'manual';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stage client_stage DEFAULT 'new';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS priority client_priority DEFAULT 'medium';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS budget_min DECIMAL(15, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS budget_max DECIMAL(15, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS desired_rooms INTEGER[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS desired_districts INTEGER[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS desired_deadline DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_contact_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contact_date DATE;

-- 6. Индексы
CREATE INDEX IF NOT EXISTS idx_clients_agent ON clients(agent_id);
CREATE INDEX IF NOT EXISTS idx_clients_stage ON clients(stage);
CREATE INDEX IF NOT EXISTS idx_clients_priority ON clients(priority);
CREATE INDEX IF NOT EXISTS idx_clients_next_contact ON clients(next_contact_date);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- 7. Триггер для updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Связь selections с clients
ALTER TABLE selections ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_selections_client ON selections(client_id);

-- 9. Связь bookings с clients
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);

-- 10. Лог активности клиента
CREATE TABLE IF NOT EXISTS client_activity_log (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'stage_changed', 'selection_added', 'booking_created', 'contact_made', 'comment_added'
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    metadata JSONB,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_activity_client ON client_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_created ON client_activity_log(created_at DESC);

-- Комментарии
COMMENT ON TABLE clients IS 'CRM-таблица клиентов агента';
COMMENT ON COLUMN clients.stage IS 'Этап воронки: new, in_progress, fixation, booking, deal, completed, failed';
COMMENT ON COLUMN clients.priority IS 'Приоритет: low, medium, high, urgent';
COMMENT ON COLUMN clients.source IS 'Источник: manual, selection, booking, import, website';
COMMENT ON TABLE client_activity_log IS 'Лог активности по клиенту';
