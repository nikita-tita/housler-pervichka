import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Форматирование ошибок Zod в читаемый формат
 */
function formatZodErrors(error: ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Middleware для валидации body запроса
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        logger.warn('Validation error (body)', { path: req.path, errors });
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: errors
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware для валидации query параметров
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        logger.warn('Validation error (query)', { path: req.path, errors });
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации параметров',
          details: errors
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware для валидации URL параметров
 */
export function validateParams(schema: ZodSchema<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        logger.warn('Validation error (params)', { path: req.path, errors });
        return res.status(400).json({
          success: false,
          error: 'Некорректные параметры URL',
          details: errors
        });
      }
      next(error);
    }
  };
}

/**
 * Комбинированная валидация (body + params)
 */
export function validate<B, P = unknown, Q = unknown>(options: {
  body?: ZodSchema<B>;
  params?: ZodSchema<P>;
  query?: ZodSchema<Q>;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (options.params) {
        req.params = await options.params.parseAsync(req.params) as any;
      }
      if (options.query) {
        req.query = await options.query.parseAsync(req.query) as any;
      }
      if (options.body) {
        req.body = await options.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        logger.warn('Validation error', { path: req.path, method: req.method, errors });
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: errors
        });
      }
      next(error);
    }
  };
}
