-- ============================================
-- История изменения цен
-- ============================================

-- Таблица истории цен
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    price DECIMAL(15, 2) NOT NULL,
    price_per_sqm DECIMAL(10, 2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_history_offer_id ON price_history(offer_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at DESC);

-- Триггер для записи изменений цены
CREATE OR REPLACE FUNCTION record_price_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Записываем только если цена изменилась или это новая запись
    IF (TG_OP = 'INSERT') OR (OLD.price IS DISTINCT FROM NEW.price) THEN
        INSERT INTO price_history (offer_id, price, price_per_sqm, recorded_at)
        VALUES (
            NEW.id,
            NEW.price,
            CASE WHEN NEW.area_total > 0 THEN NEW.price / NEW.area_total ELSE NULL END,
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS trigger_record_price_change ON offers;

-- Создаем триггер
CREATE TRIGGER trigger_record_price_change
    AFTER INSERT OR UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION record_price_change();

-- Заполняем историю текущими ценами для существующих объявлений
INSERT INTO price_history (offer_id, price, price_per_sqm, recorded_at)
SELECT
    id,
    price,
    price_per_sqm,
    COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
FROM offers
WHERE is_active = true
ON CONFLICT DO NOTHING;
