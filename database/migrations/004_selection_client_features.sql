-- Migration 004: Selection client features
-- Добавляет возможность клиенту добавлять объекты в подборку и логирование действий

-- 1. Добавляем поле added_by к selection_items (кто добавил: agent или client)
ALTER TABLE selection_items
ADD COLUMN IF NOT EXISTS added_by VARCHAR(10) DEFAULT 'agent' CHECK (added_by IN ('agent', 'client'));

-- 2. Добавляем client_name для идентификации клиента (анонимного)
ALTER TABLE selection_items
ADD COLUMN IF NOT EXISTS client_identifier VARCHAR(255);

-- 3. Таблица лога действий в подборке
CREATE TABLE IF NOT EXISTS selection_activity_log (
    id SERIAL PRIMARY KEY,
    selection_id INTEGER NOT NULL REFERENCES selections(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'item_added', 'item_removed', 'viewed', 'comment_added'
    offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
    actor_type VARCHAR(10) NOT NULL CHECK (actor_type IN ('agent', 'client')),
    actor_identifier VARCHAR(255), -- user_id for agent, session_id for client
    metadata JSONB, -- дополнительные данные (comment, etc)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_selection_activity_selection_id ON selection_activity_log(selection_id);
CREATE INDEX IF NOT EXISTS idx_selection_activity_created_at ON selection_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_selection_items_added_by ON selection_items(added_by);

-- 4. Счётчик просмотров подборки
ALTER TABLE selections
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

ALTER TABLE selections
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Комментарий
COMMENT ON TABLE selection_activity_log IS 'Лог действий в подборке (добавление, удаление, просмотры)';
COMMENT ON COLUMN selection_items.added_by IS 'Кто добавил объект: agent или client';
COMMENT ON COLUMN selection_items.client_identifier IS 'Идентификатор клиента (session_id) если added_by=client';
