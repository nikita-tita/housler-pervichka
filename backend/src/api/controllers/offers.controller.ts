import { Request, Response } from 'express';
import { OffersService, OfferFilters, PaginationParams } from '../../services/offers.service';

const offersService = new OffersService();

/**
 * GET /api/offers
 * Поиск объявлений с фильтрами
 */
export async function searchOffers(req: Request, res: Response): Promise<void> {
  try {
    // Парсинг фильтров из query параметров
    const filters: OfferFilters = {
      rooms: parseArrayParam(req.query.rooms),
      priceMin: parseNumberParam(req.query.price_min),
      priceMax: parseNumberParam(req.query.price_max),
      areaMin: parseNumberParam(req.query.area_min),
      areaMax: parseNumberParam(req.query.area_max),
      floorMin: parseNumberParam(req.query.floor_min),
      floorMax: parseNumberParam(req.query.floor_max),
      notFirstFloor: req.query.not_first_floor === 'true',
      notLastFloor: req.query.not_last_floor === 'true',
      districts: parseStringArrayParam(req.query.districts),
      metro: parseStringArrayParam(req.query.metro) || parseStringArrayParam(req.query.metro_stations),
      metroTimeMax: parseNumberParam(req.query.metro_time_max),
      complexId: parseNumberParam(req.query.complex_id),
      renovation: parseStringArrayParam(req.query.renovation),
      buildingState: parseStringArrayParam(req.query.building_state),
      search: req.query.search as string | undefined,
      isStudio: req.query.is_studio === 'true' ? true : (req.query.is_studio === 'false' ? false : undefined),
      hasFinishing: req.query.has_finishing === 'true' ? true : undefined,
      completionYears: parseArrayParam(req.query.completion_years),
      developers: parseStringArrayParam(req.query.developers),
      kitchenAreaMin: parseNumberParam(req.query.kitchen_area_min),
      kitchenAreaMax: parseNumberParam(req.query.kitchen_area_max),
      ceilingHeightMin: parseNumberParam(req.query.ceiling_height_min),
      bounds: parseBoundsParam(req.query)
    };

    // Пагинация (поддержка limit как альтернативы per_page)
    const pagination: PaginationParams = {
      page: Math.max(1, parseNumberParam(req.query.page) || 1),
      perPage: Math.min(100, Math.max(1, parseNumberParam(req.query.per_page) || parseNumberParam(req.query.limit) || 20)),
      sortBy: req.query.sort_by as string | undefined,
      sortOrder: (req.query.sort_order as 'asc' | 'desc') || 'desc'
    };

    const result = await offersService.searchOffers(filters, pagination);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error searching offers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/offers/:id
 * Детали объявления
 */
export async function getOfferById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid offer ID'
      });
      return;
    }

    const offer = await offersService.getOfferById(id);

    if (!offer) {
      res.status(404).json({
        success: false,
        error: 'Offer not found'
      });
      return;
    }

    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    console.error('Error getting offer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/offers/:id/price-history
 * История цен объявления
 */
export async function getPriceHistory(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid offer ID'
      });
      return;
    }

    const history = await offersService.getPriceHistory(id);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting price history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/offers/map/markers
 * Маркеры для карты
 */
export async function getMapMarkers(req: Request, res: Response): Promise<void> {
  try {
    const filters: OfferFilters = {
      rooms: parseArrayParam(req.query.rooms),
      priceMin: parseNumberParam(req.query.price_min),
      priceMax: parseNumberParam(req.query.price_max),
      areaMin: parseNumberParam(req.query.area_min),
      areaMax: parseNumberParam(req.query.area_max),
      districts: parseStringArrayParam(req.query.districts),
      metro: parseStringArrayParam(req.query.metro) || parseStringArrayParam(req.query.metro_stations),
      isStudio: req.query.is_studio === 'true' ? true : undefined,
      hasFinishing: req.query.has_finishing === 'true' ? true : undefined
    };

    const markers = await offersService.getMapMarkers(filters);

    res.json({
      success: true,
      data: markers
    });
  } catch (error) {
    console.error('Error getting map markers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/filters
 * Доступные значения фильтров
 */
export async function getFilters(req: Request, res: Response): Promise<void> {
  try {
    const filters = await offersService.getAvailableFilters();

    res.json({
      success: true,
      data: filters
    });
  } catch (error) {
    console.error('Error getting filters:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Хелперы для парсинга query параметров

function parseNumberParam(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

function parseArrayParam(value: any): number[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.map(Number).filter(n => !isNaN(n));
  }
  if (typeof value === 'string') {
    return value.split(',').map(Number).filter(n => !isNaN(n));
  }
  return undefined;
}

function parseStringArrayParam(value: any): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim());
  }
  return undefined;
}

function parseBoundsParam(query: any): { latMin: number; latMax: number; lngMin: number; lngMax: number } | undefined {
  const latMin = parseNumberParam(query.lat_min);
  const latMax = parseNumberParam(query.lat_max);
  const lngMin = parseNumberParam(query.lng_min);
  const lngMax = parseNumberParam(query.lng_max);

  if (latMin !== undefined && latMax !== undefined && lngMin !== undefined && lngMax !== undefined) {
    return { latMin, latMax, lngMin, lngMax };
  }
  return undefined;
}
