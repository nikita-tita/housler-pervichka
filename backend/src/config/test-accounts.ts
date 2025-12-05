/**
 * Конфигурация тестовых аккаунтов
 *
 * Используются для:
 * - E2E тестов
 * - Демонстрации функционала
 * - Обхода rate-limiting в development
 *
 * ВАЖНО: Эти коды работают только для @test.housler.ru email
 * и телефонов 79999*
 */

// Тестовые email-домены
export const TEST_EMAIL_DOMAINS = ['@test.housler.ru'];

// Тестовые телефонные префиксы
export const TEST_PHONE_PREFIXES = ['79999'];

// Постоянные тестовые коды (не истекают, не расходуются)
export const TEST_CODES = ['111111', '222222', '333333', '444444', '555555', '666666'];

/**
 * Проверить, является ли email тестовым
 */
export function isTestEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  return TEST_EMAIL_DOMAINS.some(domain => normalized.endsWith(domain));
}

/**
 * Проверить, является ли телефон тестовым
 */
export function isTestPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return TEST_PHONE_PREFIXES.some(prefix => digits.startsWith(prefix));
}

/**
 * Проверить, является ли код тестовым
 */
export function isTestCode(code: string): boolean {
  return TEST_CODES.includes(code);
}

/**
 * Проверить, можно ли пропустить валидацию кода
 * (тестовый аккаунт + тестовый код)
 */
export function canSkipCodeValidation(identifier: string, code: string): boolean {
  const isTest = isTestEmail(identifier) || isTestPhone(identifier);
  return isTest && isTestCode(code);
}
