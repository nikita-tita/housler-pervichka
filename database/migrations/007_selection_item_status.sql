-- Migration 007: Add status column to selection_items
-- Статус элемента подборки: pending, shown, interested, rejected

-- Добавляем колонку status
ALTER TABLE selection_items
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'
CHECK (status IN ('pending', 'shown', 'interested', 'rejected'));

-- Индекс для фильтрации по статусу
CREATE INDEX IF NOT EXISTS idx_selection_items_status ON selection_items(status);

-- Комментарий
COMMENT ON COLUMN selection_items.status IS 'Статус элемента: pending (ожидает), shown (показан), interested (заинтересован), rejected (отклонён)';
