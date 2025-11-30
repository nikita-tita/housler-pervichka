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
