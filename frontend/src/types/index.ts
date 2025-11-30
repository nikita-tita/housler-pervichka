// Offer types matching backend API
export interface OfferListItem {
  id: number;
  rooms: number | null;
  is_studio: boolean;
  floor: number;
  floors_total: number;
  area_total: number;
  price: number;
  price_per_sqm: number;
  complex_name: string;
  district_name: string;
  metro_station: string | null;
  metro_distance: number | null;
  has_finishing: boolean;
  image_url: string | null;
}

export interface OfferDetail extends OfferListItem {
  area_living: number | null;
  area_kitchen: number | null;
  balcony: string | null;
  bathroom: string | null;
  ceiling_height: number | null;
  description: string | null;
  complex_address: string;
  developer_name: string | null;
  completion_date: string | null;
  images: string[];
}

export interface OfferFilters {
  rooms?: number[];
  is_studio?: boolean;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  floor_min?: number;
  floor_max?: number;
  districts?: string[];
  metro_stations?: string[];
  has_finishing?: boolean;
  complexes?: string[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface FilterOptions {
  districts: { name: string; count: number }[];
  metro_stations: { name: string; count: number }[];
  complexes: { name: string; count: number }[];
  rooms: { value: number; count: number }[];
  price_range: { min: number; max: number };
  area_range: { min: number; max: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// User & Auth types
export type UserRole = 'client' | 'agent' | 'operator' | 'admin';

export interface User {
  id: number;
  email: string;
  phone: string | null;
  name: string | null;
  role: UserRole;
  is_active: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Favorites
export interface FavoriteOffer extends OfferListItem {
  added_at: string;
}

// Selections
export interface Selection {
  id: number;
  name: string;
  client_name: string | null;
  client_email: string | null;
  share_code: string;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface SelectionItem {
  id: number;
  offer_id: number;
  comment: string | null;
  added_at: string;
  offer?: OfferListItem;
}

export interface SelectionDetail extends Selection {
  items: SelectionItem[];
}

// Bookings
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: number;
  offer_id: number;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  comment: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  offer?: OfferListItem;
}

// Complex
export interface Complex {
  id: number;
  name: string;
  district: string | null;
  address: string;
  offers_count: number;
  min_price: string;
  max_price: string;
  min_area: string;
  max_area: string;
  building_state: string | null;
}

export interface ComplexDetail extends Complex {
  metro_station: string | null;
  metro_distance: number | null;
  developer_name: string | null;
  description: string | null;
  image_url: string | null;
}
