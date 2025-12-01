import { Request, Response } from 'express';
import { AgenciesService } from '../../services/agencies.service';

const agenciesService = new AgenciesService();

/**
 * GET /api/agencies
 * Получить список агентств
 */
export async function getAgencies(req: Request, res: Response) {
  try {
    const agencies = await agenciesService.getAll();
    res.json({
      success: true,
      data: agencies
    });
  } catch (error) {
    console.error('Error getting agencies:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении списка агентств'
    });
  }
}

/**
 * GET /api/agencies/:slug
 * Получить агентство по slug
 */
export async function getAgencyBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const agency = await agenciesService.getBySlug(slug);

    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Агентство не найдено'
      });
    }

    res.json({
      success: true,
      data: agency
    });
  } catch (error) {
    console.error('Error getting agency:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении агентства'
    });
  }
}

/**
 * GET /api/agencies/default
 * Получить дефолтное агентство (Housler)
 */
export async function getDefaultAgency(req: Request, res: Response) {
  try {
    const agency = await agenciesService.getDefault();

    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Дефолтное агентство не настроено'
      });
    }

    res.json({
      success: true,
      data: agency
    });
  } catch (error) {
    console.error('Error getting default agency:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении дефолтного агентства'
    });
  }
}

/**
 * GET /api/me/agencies
 * Получить агентства текущего клиента
 */
export async function getMyAgencies(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Требуется авторизация'
      });
    }

    const agencies = await agenciesService.getClientAgencies(req.user.id);
    res.json({
      success: true,
      data: agencies
    });
  } catch (error) {
    console.error('Error getting user agencies:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении агентств'
    });
  }
}

/**
 * POST /api/agencies/:slug/link
 * Привязать текущего клиента к агентству
 */
export async function linkToAgency(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Требуется авторизация'
      });
    }

    const { slug } = req.params;
    const { source, referralCode } = req.body;

    const agency = await agenciesService.getBySlug(slug);
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Агентство не найдено'
      });
    }

    const link = await agenciesService.linkClientToAgency(
      req.user.id,
      agency.id,
      source || 'direct',
      referralCode
    );

    res.json({
      success: true,
      data: link
    });
  } catch (error) {
    console.error('Error linking to agency:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при привязке к агентству'
    });
  }
}
