import { Request, Response, NextFunction } from 'express';
import { AgenciesService, Agency } from '../services/agencies.service';

const agenciesService = new AgenciesService();

// Расширяем Request для добавления agency
declare global {
  namespace Express {
    interface Request {
      agency?: Agency;
      agencySlug?: string;
    }
  }
}

/**
 * Middleware: извлекает agency из URL параметра :agencySlug
 * Используется для роутов типа /api/:agencySlug/offers
 */
export async function loadAgencyFromParam(req: Request, res: Response, next: NextFunction) {
  const { agencySlug } = req.params;

  if (!agencySlug) {
    return next();
  }

  const agency = await agenciesService.getBySlug(agencySlug);
  if (agency) {
    req.agency = agency;
    req.agencySlug = agencySlug;
  }

  next();
}

/**
 * Middleware: требует наличие агентства в запросе
 */
export function requireAgency(req: Request, res: Response, next: NextFunction) {
  if (!req.agency) {
    return res.status(404).json({
      success: false,
      error: 'Агентство не найдено'
    });
  }
  next();
}

/**
 * Middleware: извлекает agencySlug из заголовка X-Agency-Slug
 * Используется когда agency передаётся в header (для SPA)
 */
export async function loadAgencyFromHeader(req: Request, res: Response, next: NextFunction) {
  const agencySlug = req.headers['x-agency-slug'] as string;

  if (agencySlug) {
    const agency = await agenciesService.getBySlug(agencySlug);
    if (agency) {
      req.agency = agency;
      req.agencySlug = agencySlug;
    }
  }

  next();
}

/**
 * Middleware: требует принадлежность пользователя к агентству
 * Используется для защиты роутов agency_admin
 */
export function requireAgencyMembership(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Требуется авторизация'
    });
  }

  if (!req.agency) {
    return res.status(400).json({
      success: false,
      error: 'Агентство не указано'
    });
  }

  // Проверяем, что пользователь принадлежит этому агентству
  if (req.user.agency_id !== req.agency.id) {
    return res.status(403).json({
      success: false,
      error: 'Нет доступа к этому агентству'
    });
  }

  next();
}

/**
 * Middleware: только для agency_admin данного агентства
 */
export function requireAgencyAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Требуется авторизация'
    });
  }

  const allowedRoles = ['agency_admin', 'operator', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Требуются права администратора агентства'
    });
  }

  // Для agency_admin проверяем принадлежность к агентству
  if (req.user.role === 'agency_admin' && req.agency && req.user.agency_id !== req.agency.id) {
    return res.status(403).json({
      success: false,
      error: 'Нет доступа к этому агентству'
    });
  }

  next();
}
