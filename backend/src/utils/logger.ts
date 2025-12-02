import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Формат для development (цветной, читаемый)
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Формат для production (JSON для парсинга)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

const isDev = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  format: isDev ? devFormat : prodFormat,
  defaultMeta: { service: 'housler-api' },
  transports: [
    new winston.transports.Console()
  ]
});

// Типизированные методы для удобства
export const log = {
  info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
  error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),

  // Специальный метод для логирования ошибок с stack trace
  exception: (message: string, error: Error, meta?: Record<string, unknown>) => {
    logger.error(message, {
      ...meta,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  }
};

export default logger;
