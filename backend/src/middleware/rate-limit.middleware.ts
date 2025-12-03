import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Нормализация IP для IPv6 (маскирование подсети /64)
 * Предотвращает обход лимитов через ротацию IPv6 адресов
 */
function normalizeIp(ip: string | undefined): string {
  if (!ip) return 'unknown';

  // Убираем IPv6-mapped IPv4 prefix
  const cleanIp = ip.replace(/^::ffff:/, '');

  // Если это IPv6, маскируем до /64 подсети
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    // Берём первые 4 группы (64 бита) для идентификации подсети
    return parts.slice(0, 4).join(':') + '::';
  }

  return cleanIp;
}

/**
 * Получить IP из запроса с нормализацией
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim())
    : req.ip;
  return normalizeIp(ip);
}

/**
 * Rate limiter для auth endpoints
 * Защита от брутфорса
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // максимум 10 запросов с одного IP
  message: {
    success: false,
    error: 'Слишком много попыток. Попробуйте через 15 минут.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Ключ по IP с нормализацией IPv6
  keyGenerator: (req) => getClientIp(req),
  // Пропускаем тестовые аккаунты в dev режиме
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      const email = req.body?.email;
      if (email && email.endsWith('@test.housler.ru')) {
        return true;
      }
    }
    return false;
  }
});

/**
 * Rate limiter для verify-code (более строгий)
 * Защита от подбора кода
 */
export const verifyCodeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 минут
  max: 5, // максимум 5 попыток ввода кода
  message: {
    success: false,
    error: 'Слишком много неудачных попыток. Попробуйте через 5 минут.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Ключ по IP + email для более точного ограничения (с нормализацией IPv6)
  keyGenerator: (req) => {
    const email = req.body?.email || '';
    return `${getClientIp(req)}:${email}`;
  },
  skip: (req) => {
    // Пропускаем тестовые аккаунты
    const email = req.body?.email;
    if (email && email.endsWith('@test.housler.ru')) {
      return true;
    }
    return false;
  }
});

/**
 * Общий rate limiter для API
 * Защита от DDoS
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 100, // 100 запросов в минуту
  message: {
    success: false,
    error: 'Превышен лимит запросов. Попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter для гостевых заявок на бронирование
 * Защита от спама заявками
 */
export const guestBookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 3, // максимум 3 заявки с одного IP
  message: {
    success: false,
    error: 'Слишком много заявок. Попробуйте через 15 минут.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const guestId = req.body?.guestClientId || '';
    return `guest_booking:${ip}:${guestId}`;
  }
});

/**
 * Rate limiter для гостевых действий с подборками
 * Защита от спама добавлением/удалением объектов
 */
export const guestActionsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 20, // 20 действий в минуту
  message: {
    success: false,
    error: 'Слишком много действий. Подождите минуту.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `guest_actions:${getClientIp(req)}`
});

/**
 * Rate limiter для просмотра подборок (защита от брутфорса share_code)
 */
export const sharedSelectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 30, // 30 запросов в минуту
  message: {
    success: false,
    error: 'Слишком много запросов. Подождите минуту.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `shared_view:${getClientIp(req)}`
});

// Экспортируем getClientIp для использования в контроллерах
export { getClientIp };
