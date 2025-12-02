import rateLimit from 'express-rate-limit';

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
  // Ключ по IP
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
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
  keyGenerator: (req) => {
    // Ключ по IP + email для более точного ограничения
    const email = req.body?.email || '';
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    return `${ip}:${email}`;
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
