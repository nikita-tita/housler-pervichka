import type {
  OfferListItem,
  OfferDetail,
  OfferFilters,
  PaginationParams,
  PaginatedResponse,
  FilterOptions,
  ApiResponse,
  User,
  FavoriteOffer,
  Selection,
  SelectionDetail,
  SelectionActivity,
  Booking,
  Complex,
  ComplexDetail,
  Client,
  ClientListItem,
  ClientDetail,
  ClientFilters,
  ClientStage,
  FunnelStats,
  CreateClientDto,
  UpdateClientDto,
  ClientActivity,
  Agency,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Token storage helpers
const TOKEN_KEY = 'housler_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
    });

    const data = await response.json().catch(() => ({ success: false, error: 'Invalid JSON response' }));

    if (!response.ok) {
      // Возвращаем объект с ошибкой вместо throw
      return { success: false, error: data.error || `API Error: ${response.status}` } as T;
    }

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
      if (filters.complex_id) {
        params.set('complex_id', filters.complex_id.toString());
      }
      if (filters.search) {
        params.set('search', filters.search);
      }
      if (filters.completion_years?.length) {
        filters.completion_years.forEach(y => params.append('completion_years', y.toString()));
      }
      if (filters.developers?.length) {
        filters.developers.forEach(d => params.append('developers', d));
      }
      if (filters.floor_min) params.set('floor_min', filters.floor_min.toString());
      if (filters.floor_max) params.set('floor_max', filters.floor_max.toString());
      if (filters.not_first_floor) params.set('not_first_floor', 'true');
      if (filters.not_last_floor) params.set('not_last_floor', 'true');
      if (filters.kitchen_area_min) params.set('kitchen_area_min', filters.kitchen_area_min.toString());
      if (filters.kitchen_area_max) params.set('kitchen_area_max', filters.kitchen_area_max.toString());
      if (filters.ceiling_height_min) params.set('ceiling_height_min', filters.ceiling_height_min.toString());
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

  async getPriceHistory(offerId: number): Promise<ApiResponse<{ price: number; price_per_sqm: number | null; recorded_at: string }[]>> {
    return this.fetch(`/api/offers/${offerId}/price-history`);
  }

  async getMapMarkers(filters?: OfferFilters): Promise<ApiResponse<{ id: number; lat: number; lng: number; price: number; rooms: number; is_studio: boolean }[]>> {
    const query = this.buildQuery(filters);
    return this.fetch(`/api/offers/map/markers${query}`);
  }

  // Filters
  async getFilters(): Promise<ApiResponse<FilterOptions>> {
    return this.fetch('/api/filters');
  }

  // ============ AUTH ============
  async requestCode(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetch('/api/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyCode(email: string, code: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.fetch('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.fetch('/api/auth/me');
  }

  // ============ FAVORITES ============
  async getFavorites(): Promise<ApiResponse<FavoriteOffer[]>> {
    return this.fetch('/api/favorites');
  }

  async getFavoriteIds(): Promise<ApiResponse<number[]>> {
    return this.fetch('/api/favorites/ids');
  }

  async addFavorite(offerId: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetch('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ offerId }),
    });
  }

  async removeFavorite(offerId: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetch(`/api/favorites/${offerId}`, {
      method: 'DELETE',
    });
  }

  // ============ SELECTIONS ============
  async getSelections(): Promise<ApiResponse<Selection[]>> {
    return this.fetch('/api/selections');
  }

  // Подборки для клиента (где он указан по email)
  async getMySelections(): Promise<ApiResponse<(Selection & { agent_name?: string })[]>> {
    return this.fetch('/api/selections/my');
  }

  async createSelection(data: {
    name: string;
    clientName?: string;
    clientEmail?: string;
  }): Promise<ApiResponse<Selection>> {
    return this.fetch('/api/selections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSelection(id: number): Promise<ApiResponse<SelectionDetail>> {
    return this.fetch(`/api/selections/${id}`);
  }

  async getSharedSelection(code: string): Promise<ApiResponse<SelectionDetail>> {
    return this.fetch(`/api/selections/shared/${code}`);
  }

  // Клиент добавляет объект в подборку по share_code
  async addToSharedSelection(code: string, offerId: number, clientId: string, comment?: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetch(`/api/selections/shared/${code}/items`, {
      method: 'POST',
      body: JSON.stringify({ offerId, clientId, comment }),
    });
  }

  // Клиент удаляет объект из подборки
  async removeFromSharedSelection(code: string, offerId: number, clientId: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetch(`/api/selections/shared/${code}/items/${offerId}`, {
      method: 'DELETE',
      body: JSON.stringify({ clientId }),
    });
  }

  // Записать просмотр подборки
  async recordSelectionView(code: string, clientId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.fetch(`/api/selections/shared/${code}/view`, {
      method: 'POST',
      body: JSON.stringify({ clientId }),
    });
  }

  async addSelectionItem(selectionId: number, offerId: number, comment?: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetch(`/api/selections/${selectionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ offerId, comment }),
    });
  }

  async removeSelectionItem(selectionId: number, offerId: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetch(`/api/selections/${selectionId}/items/${offerId}`, {
      method: 'DELETE',
    });
  }

  async updateSelectionItemStatus(selectionId: number, offerId: number, status: string): Promise<ApiResponse<{ message: string }>> {
    return this.fetch(`/api/selections/${selectionId}/items/${offerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteSelection(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetch(`/api/selections/${id}`, {
      method: 'DELETE',
    });
  }

  async getSelectionActivity(id: number): Promise<ApiResponse<SelectionActivity[]>> {
    return this.fetch(`/api/selections/${id}/activity`);
  }

  // ============ BOOKINGS ============
  async createBooking(data: {
    offerId: number;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    comment?: string;
  }): Promise<ApiResponse<Booking>> {
    return this.fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyBookings(): Promise<ApiResponse<Booking[]>> {
    return this.fetch('/api/bookings');
  }

  // ============ CLIENTS CRM ============
  async getClients(filters?: ClientFilters): Promise<ApiResponse<ClientListItem[]>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.stage) params.set('stage', filters.stage);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.hasNextContact) params.set('hasNextContact', 'true');
    const query = params.toString();
    return this.fetch(`/api/clients${query ? `?${query}` : ''}`);
  }

  async createClient(data: CreateClientDto): Promise<ApiResponse<Client>> {
    return this.fetch('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClient(id: number): Promise<ApiResponse<ClientDetail>> {
    return this.fetch(`/api/clients/${id}`);
  }

  async updateClient(id: number, data: UpdateClientDto): Promise<ApiResponse<Client>> {
    return this.fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetch(`/api/clients/${id}`, {
      method: 'DELETE',
    });
  }

  async updateClientStage(id: number, stage: ClientStage): Promise<ApiResponse<Client>> {
    return this.fetch(`/api/clients/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    });
  }

  async getClientActivity(id: number): Promise<ApiResponse<ClientActivity[]>> {
    return this.fetch(`/api/clients/${id}/activity`);
  }

  async getClientsStats(): Promise<ApiResponse<FunnelStats>> {
    return this.fetch('/api/clients/stats');
  }

  async linkSelectionToClient(clientId: number, selectionId: number): Promise<ApiResponse<{ message: string }>> {
    return this.fetch(`/api/clients/${clientId}/link-selection`, {
      method: 'POST',
      body: JSON.stringify({ selectionId }),
    });
  }

  async recordClientContact(clientId: number, comment?: string): Promise<ApiResponse<Client>> {
    return this.fetch(`/api/clients/${clientId}/contact`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  // ============ COMPLEXES ============
  async getComplexes(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<PaginatedResponse<Complex>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return this.fetch(`/api/complexes${query ? `?${query}` : ''}`);
  }

  async getComplexById(id: number): Promise<ApiResponse<ComplexDetail>> {
    return this.fetch(`/api/complexes/${id}`);
  }

  // ============ AGENCIES ============
  async getAgencies(): Promise<ApiResponse<Agency[]>> {
    return this.fetch('/api/agencies');
  }

  async getAgencyBySlug(slug: string): Promise<ApiResponse<Agency>> {
    return this.fetch(`/api/agencies/${slug}`);
  }

  async getDefaultAgency(): Promise<ApiResponse<Agency>> {
    return this.fetch('/api/agencies/default');
  }

  async getMyAgencies(): Promise<ApiResponse<Agency[]>> {
    return this.fetch('/api/agencies/my');
  }

  async linkToAgency(slug: string, source: string = 'direct'): Promise<ApiResponse<{ id: number }>> {
    return this.fetch(`/api/agencies/${slug}/link`, {
      method: 'POST',
      body: JSON.stringify({ source }),
    });
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
