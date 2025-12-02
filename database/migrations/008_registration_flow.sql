-- Migration 008: Расширенная регистрация пользователей и агентств
-- Добавляет: согласия, расширение users, расширение agencies, SMS-коды

-- ============================================
-- 1. Таблица согласий пользователей
-- ============================================

CREATE TABLE IF NOT EXISTS user_consents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,  -- 'personal_data', 'terms', 'marketing', 'cookie'
    document_version VARCHAR(20) NOT NULL DEFAULT '1.0',  -- версия документа
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT,
    revoked_at TIMESTAMPTZ,  -- если согласие отозвано
    UNIQUE(user_id, consent_type, document_version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);

COMMENT ON TABLE user_consents IS 'Согласия пользователей на обработку ПД, оферты и т.д.';
COMMENT ON COLUMN user_consents.consent_type IS 'Тип согласия: personal_data, terms, marketing, cookie';
COMMENT ON COLUMN user_consents.document_version IS 'Версия документа на момент согласия';

-- ============================================
-- 2. Расширение таблицы users
-- ============================================

-- Телефон подтверждён
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Город работы (для риелторов)
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Самозанятый (для частных риелторов)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_self_employed BOOLEAN DEFAULT FALSE;

-- ИНН физлица (для самозанятых)
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_inn VARCHAR(12);

-- Хэш пароля (для агентств, где вход по email+password)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Статус регистрации
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT 'active';
-- 'pending' - ожидает подтверждения, 'active' - активен, 'blocked' - заблокирован

COMMENT ON COLUMN users.phone_verified IS 'Подтверждён ли телефон через SMS';
COMMENT ON COLUMN users.city IS 'Город работы риелтора';
COMMENT ON COLUMN users.is_self_employed IS 'Является ли самозанятым';
COMMENT ON COLUMN users.personal_inn IS 'ИНН физлица (для самозанятых)';
COMMENT ON COLUMN users.password_hash IS 'Хэш пароля (для входа по email+password)';
COMMENT ON COLUMN users.registration_status IS 'Статус регистрации: pending, active, blocked';

-- ============================================
-- 3. Расширение таблицы agencies
-- ============================================

-- ИНН компании
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS inn VARCHAR(12);

-- КПП
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS kpp VARCHAR(9);

-- ОГРН/ОГРНИП
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS ogrn VARCHAR(15);

-- Юридический адрес
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS legal_address TEXT;

-- Фактический адрес
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS actual_address TEXT;

-- ФИО директора
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS director_name VARCHAR(255);

-- Должность контактного лица
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS contact_position VARCHAR(100);

-- Статус регистрации
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT 'active';
-- 'pending' - на модерации, 'active' - активно, 'rejected' - отклонено

-- Причина отклонения
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Индекс по ИНН для проверки дубликатов
CREATE INDEX IF NOT EXISTS idx_agencies_inn ON agencies(inn) WHERE inn IS NOT NULL;

COMMENT ON COLUMN agencies.inn IS 'ИНН компании (10 для юрлиц, 12 для ИП)';
COMMENT ON COLUMN agencies.kpp IS 'КПП (только для юрлиц)';
COMMENT ON COLUMN agencies.ogrn IS 'ОГРН (13 цифр) или ОГРНИП (15 цифр)';
COMMENT ON COLUMN agencies.legal_address IS 'Юридический адрес';
COMMENT ON COLUMN agencies.actual_address IS 'Фактический адрес';
COMMENT ON COLUMN agencies.director_name IS 'ФИО руководителя';
COMMENT ON COLUMN agencies.contact_position IS 'Должность контактного лица';
COMMENT ON COLUMN agencies.registration_status IS 'Статус регистрации: pending, active, rejected';

-- ============================================
-- 4. SMS-коды (аналог auth_codes для телефона)
-- ============================================

CREATE TABLE IF NOT EXISTS sms_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) NOT NULL DEFAULT 'auth',  -- 'auth', 'verify', 'password_reset'
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone);
CREATE INDEX IF NOT EXISTS idx_sms_codes_expires ON sms_codes(expires_at);

COMMENT ON TABLE sms_codes IS 'SMS-коды для авторизации и подтверждения телефона';
COMMENT ON COLUMN sms_codes.purpose IS 'Цель кода: auth - авторизация, verify - подтверждение, password_reset - сброс пароля';

-- ============================================
-- 5. Типы документов (справочник)
-- ============================================

CREATE TABLE IF NOT EXISTS legal_documents (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,  -- 'privacy_policy', 'terms', 'realtor_offer', etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    url VARCHAR(500),  -- ссылка на полный текст
    target_roles TEXT[],  -- для каких ролей: {'client', 'agent', 'agency_admin'}
    is_required BOOLEAN DEFAULT TRUE,  -- обязательно ли принять
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Заполняем базовые документы
INSERT INTO legal_documents (code, name, description, target_roles, is_required) VALUES
    ('privacy_policy', 'Политика конфиденциальности', 'Политика обработки персональных данных ООО "Сектор ИТ"', ARRAY['client', 'agent', 'agency_admin'], true),
    ('personal_data_consent', 'Согласие на обработку ПД', 'Согласие на обработку персональных данных', ARRAY['client', 'agent', 'agency_admin'], true),
    ('terms_of_service', 'Пользовательское соглашение', 'Условия использования сервиса Housler', ARRAY['client', 'agent', 'agency_admin'], true),
    ('marketing_consent', 'Согласие на рассылку', 'Согласие на получение рекламных материалов', ARRAY['client', 'agent', 'agency_admin'], false),
    ('cookie_consent', 'Согласие на cookie', 'Согласие на использование cookie-файлов', ARRAY['client', 'agent', 'agency_admin'], false),
    ('realtor_offer', 'Оферта для риелторов', 'Договор-оферта для частных риелторов', ARRAY['agent'], true),
    ('agency_offer', 'Оферта для агентств', 'Договор-оферта для агентств недвижимости', ARRAY['agency_admin'], true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    target_roles = EXCLUDED.target_roles,
    is_required = EXCLUDED.is_required;

COMMENT ON TABLE legal_documents IS 'Справочник юридических документов';
COMMENT ON COLUMN legal_documents.code IS 'Уникальный код документа';
COMMENT ON COLUMN legal_documents.target_roles IS 'Для каких ролей требуется согласие';

-- ============================================
-- 6. Триггер для updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_legal_documents_updated_at ON legal_documents;
CREATE TRIGGER update_legal_documents_updated_at
    BEFORE UPDATE ON legal_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
