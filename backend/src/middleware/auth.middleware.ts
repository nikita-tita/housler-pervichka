import { Request, Response, NextFunction } from 'express';
import { AuthService, User, UserRole, JwtPayload } from '../services/auth.service';

const authService = new AuthService();

// Расширяем Request для добавления user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      jwtPayload?: JwtPayload;
    }
  }
}

/**
 * Middleware: требует авторизацию
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Требуется авторизация'
    });
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Недействительный токен'
    });
  }

  req.jwtPayload = payload;
  next();
}

/**
 * Middleware: загружает пользователя (если есть токен)
 */
export async function loadUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    if (payload) {
      const user = await authService.findUserById(payload.userId);
      if (user && user.is_active) {
        req.user = user;
        req.jwtPayload = payload;
      }
    }
  }

  next();
}

/**
 * Middleware: требует авторизацию + загружает полного пользователя
 */
export async function requireAuthWithUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Требуется авторизация'
    });
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Недействительный токен'
    });
  }

  const user = await authService.findUserById(payload.userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Пользователь не найден'
    });
  }

  if (!user.is_active) {
    return res.status(403).json({
      success: false,
      error: 'Аккаунт деактивирован'
    });
  }

  req.user = user;
  req.jwtPayload = payload;
  next();
}

/**
 * Middleware: требует определённую роль
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Требуется авторизация'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Недостаточно прав'
      });
    }

    next();
  };
}

/**
 * Middleware: только для агентов
 */
export const requireAgent = requireRole('agent', 'operator', 'admin');

/**
 * Middleware: только для операторов
 */
export const requireOperator = requireRole('operator', 'admin');

/**
 * Middleware: только для администраторов
 */
export const requireAdmin = requireRole('admin');
