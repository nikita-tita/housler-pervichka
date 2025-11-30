import { Request, Response } from 'express';
import { ComplexesService } from '../../services/complexes.service';

const complexesService = new ComplexesService();

/**
 * GET /api/complexes - Список ЖК
 */
export async function getComplexes(req: Request, res: Response) {
  try {
    const {
      page = '1',
      perPage = '20',
      sortBy = 'offers',
      sortOrder = 'desc',
      search,
      district,
      priceMin,
      priceMax
    } = req.query;

    const filters = {
      search: search as string | undefined,
      district: district as string | undefined,
      priceMin: priceMin ? parseInt(priceMin as string) : undefined,
      priceMax: priceMax ? parseInt(priceMax as string) : undefined
    };

    const pagination = {
      page: Math.max(1, parseInt(page as string) || 1),
      perPage: Math.min(100, Math.max(1, parseInt(perPage as string) || 20)),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await complexesService.searchComplexes(filters, pagination);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getComplexes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch complexes'
    });
  }
}

/**
 * GET /api/complexes/search - Поиск ЖК по названию (автокомплит)
 */
export async function searchComplexes(req: Request, res: Response) {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || (q as string).length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const results = await complexesService.searchByName(
      q as string,
      Math.min(20, parseInt(limit as string) || 10)
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in searchComplexes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search complexes'
    });
  }
}

/**
 * GET /api/complexes/:id - Детали ЖК
 */
export async function getComplexById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid complex ID'
      });
    }

    const complex = await complexesService.getComplexById(id);

    if (!complex) {
      return res.status(404).json({
        success: false,
        error: 'Complex not found'
      });
    }

    res.json({
      success: true,
      data: complex
    });
  } catch (error) {
    console.error('Error in getComplexById:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch complex'
    });
  }
}
