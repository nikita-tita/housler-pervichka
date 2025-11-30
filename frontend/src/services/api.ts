import type {
  OfferListItem,
  OfferDetail,
  OfferFilters,
  PaginationParams,
  PaginatedResponse,
  FilterOptions,
  ApiResponse,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiService {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  // Build query string from filters and pagination
  private buildQuery(filters?: OfferFilters, pagination?: PaginationParams): string {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.rooms?.length) {
        filters.rooms.forEach(r => params.append('rooms', r.toString()));
      }
      if (filters.is_studio !== undefined) {
        params.set('is_studio', filters.is_studio.toString());
      }
      if (filters.price_min) params.set('price_min', filters.price_min.toString());
      if (filters.price_max) params.set('price_max', filters.price_max.toString());
      if (filters.area_min) params.set('area_min', filters.area_min.toString());
      if (filters.area_max) params.set('area_max', filters.area_max.toString());
      if (filters.floor_min) params.set('floor_min', filters.floor_min.toString());
      if (filters.floor_max) params.set('floor_max', filters.floor_max.toString());
      if (filters.districts?.length) {
        filters.districts.forEach(d => params.append('districts', d));
      }
      if (filters.metro_stations?.length) {
        filters.metro_stations.forEach(m => params.append('metro_stations', m));
      }
      if (filters.has_finishing !== undefined) {
        params.set('has_finishing', filters.has_finishing.toString());
      }
      if (filters.complexes?.length) {
        filters.complexes.forEach(c => params.append('complexes', c));
      }
    }

    if (pagination) {
      if (pagination.page) params.set('page', pagination.page.toString());
      if (pagination.limit) params.set('limit', pagination.limit.toString());
      if (pagination.sort_by) params.set('sort_by', pagination.sort_by);
      if (pagination.sort_order) params.set('sort_order', pagination.sort_order);
    }

    const query = params.toString();
    return query ? `?${query}` : '';
  }

  // Offers
  async getOffers(
    filters?: OfferFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<OfferListItem>>> {
    const query = this.buildQuery(filters, pagination);
    return this.fetch(`/api/offers${query}`);
  }

  async getOfferById(id: number): Promise<ApiResponse<OfferDetail>> {
    return this.fetch(`/api/offers/${id}`);
  }

  // Filters
  async getFilters(): Promise<ApiResponse<FilterOptions>> {
    return this.fetch('/api/filters');
  }
}

export const api = new ApiService();

// Helper for formatting price
export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)} млн ₽`;
  }
  return `${price.toLocaleString('ru-RU')} ₽`;
}

// Helper for formatting area
export function formatArea(area: number): string {
  return `${area.toFixed(1)} м²`;
}

// Helper for room count display
export function formatRooms(rooms: number | null, isStudio: boolean): string {
  if (isStudio) return 'Студия';
  if (!rooms) return '—';
  if (rooms === 1) return '1 комната';
  if (rooms >= 2 && rooms <= 4) return `${rooms} комнаты`;
  return `${rooms} комнат`;
}

// Helper for floor display
export function formatFloor(floor: number, floorsTotal: number): string {
  return `${floor}/${floorsTotal} этаж`;
}
