// Базовые типы из БД
export interface District {
  id: number;
  name: string;
  region: string;
  created_at: Date;
}

export interface MetroStation {
  id: number;
  name: string;
  line: string | null;
  district_id: number | null;
  created_at: Date;
}

export interface Developer {
  id: number;
  name: string;
  inn: string | null;
  website: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Complex {
  id: number;
  name: string;
  developer_id: number | null;
  district_id: number | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  nearest_metro_id: number | null;
  metro_time_on_foot: number | null;
  description: string | null;
  min_price: number | null;
  max_price: number | null;
  avg_price_per_sqm: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Building {
  id: number;
  complex_id: number;
  name: string | null;
  building_type: string | null;
  building_state: 'unfinished' | 'hand-over';
  floors_total: number | null;
  built_year: number | null;
  ready_quarter: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Offer {
  id: number;
  external_id: string;
  complex_id: number | null;
  building_id: number | null;
  district_id: number | null;
  metro_station_id: number | null;

  // Тип
  offer_type: string;
  property_type: string;
  category: string;

  // Квартира
  rooms: number;
  is_studio: boolean;
  area_total: number;
  area_living: number | null;
  area_kitchen: number | null;
  floor: number;
  floors_total: number;
  renovation: string | null;
  balcony: string | null;
  bathroom_unit: string | null;

  // Цена
  price: number;
  price_per_sqm: number;
  currency: string;

  // Юридическое
  deal_type: string | null;
  has_escrow: boolean | null;
  is_apartment: boolean;
  room_type: string | null;
  is_euro_layout: boolean;

  // Местоположение
  address: string | null;
  latitude: number;
  longitude: number;
  metro_time_on_foot: number | null;

  // Описание
  description: string | null;

  // Статус
  is_active: boolean;

  // Даты
  created_at: Date;
  updated_at: Date;
}

export interface OfferImage {
  id: number;
  offer_id: number;
  tag: 'plan' | 'housemain' | 'floorplan' | 'complexscheme' | null;
  url: string;
  display_order: number;
}

// Для API ответов
export interface OfferListItem {
  id: number;
  complex_name: string | null;
  district_name: string | null;
  metro_name: string | null;
  metro_time_on_foot: number | null;
  rooms: number;
  room_type: string | null;
  is_euro_layout: boolean;
  area_total: number;
  floor: number;
  floors_total: number;
  renovation: string | null;
  price: number;
  price_per_sqm: number;
  building_state: string | null;
  built_year: number | null;
  ready_quarter: number | null;
  plan_image_url: string | null;
}

export interface OfferDetails extends Offer {
  complex: Complex | null;
  building: Building | null;
  district: District | null;
  metro: MetroStation | null;
  images: OfferImage[];
}

// Фильтры поиска
export interface OfferFilters {
  rooms?: number[];
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  district_id?: number[];
  metro_id?: number[];
  metro_time_max?: number;
  floor_min?: number;
  floor_max?: number;
  floor_not_first?: boolean;
  floor_not_last?: boolean;
  renovation?: string[];
  building_state?: string[];
  complex_id?: number;
  is_euro_layout?: boolean;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
