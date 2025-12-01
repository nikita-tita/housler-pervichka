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
  building_name?: string | null;
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
  latitude: number | null;
  longitude: number | null;
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
  not_first_floor?: boolean;
  not_last_floor?: boolean;
  kitchen_area_min?: number;
  kitchen_area_max?: number;
  ceiling_height_min?: number;
  districts?: string[];
  metro_stations?: string[];
  has_finishing?: boolean;
  complexes?: string[];
  complex_id?: number;
  search?: string;
  completion_years?: number[];
  developers?: string[];
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
  completion_years: { year: number; count: number }[];
  developers: { name: string; count: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// User & Auth types
export type UserRole = 'client' | 'agent' | 'agency_admin' | 'operator' | 'admin';

export interface User {
  id: number;
  email: string;
  phone: string | null;
  name: string | null;
  role: UserRole;
  agency_id: number | null;
  is_active: boolean;
}

// Agency types
export interface Agency {
  id: number;
  name: string;
  slug: string;
  is_default: boolean;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
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

export type SelectionItemStatus = 'pending' | 'shown' | 'interested' | 'rejected';

export interface SelectionItem {
  id: number;
  offer_id: number;
  comment: string | null;
  added_at: string;
  added_by?: 'agent' | 'client';
  status?: SelectionItemStatus;
  // Inline offer data from backend
  rooms: number | null;
  is_studio: boolean;
  floor: number;
  floors_total: number;
  area_total: number;
  price: number;
  price_per_sqm: number;
  building_name: string | null;
  district: string | null;
  metro_name: string | null;
  main_image: string | null;
  offer?: OfferListItem;
}

export interface SelectionDetail extends Selection {
  items: SelectionItem[];
  view_count?: number;
  last_viewed_at?: string;
}

// Selection Activity Log
export interface SelectionActivity {
  id: number;
  action: 'viewed' | 'item_added' | 'item_removed';
  offer_id: number | null;
  actor_type: 'agent' | 'client';
  metadata: Record<string, unknown> | null;
  created_at: string;
  offer_name?: string | null;
  rooms?: number | null;
  price?: number | null;
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
  developer_id?: number | null;
  description: string | null;
  image_url: string | null;
  main_image?: string | null;
  images?: string[];
  latitude?: number | null;
  longitude?: number | null;
  floors_total?: number | null;
  completion_date?: string | null;
  class?: string | null;
  parking?: string | null;
}

// ============ CLIENTS CRM ============

export type ClientSource = 'manual' | 'selection' | 'booking' | 'import' | 'website';
export type ClientStage = 'new' | 'in_progress' | 'fixation' | 'booking' | 'deal' | 'completed' | 'failed';
export type ClientPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Client {
  id: number;
  agent_id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  telegram: string | null;
  whatsapp: string | null;
  source: ClientSource;
  stage: ClientStage;
  priority: ClientPriority;
  comment: string | null;
  budget_min: number | null;
  budget_max: number | null;
  desired_rooms: number[] | null;
  desired_districts: number[] | null;
  desired_deadline: string | null;
  next_contact_date: string | null;
  last_contact_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientListItem extends Client {
  selections_count: number;
  bookings_count: number;
}

export interface ClientActivity {
  id: number;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface ClientDetail extends Client {
  selections: {
    id: number;
    name: string;
    items_count: number;
    created_at: string;
  }[];
  bookings: {
    id: number;
    offer_id: number;
    status: string;
    created_at: string;
    complex_name: string | null;
  }[];
  activity: ClientActivity[];
}

export interface ClientFilters {
  search?: string;
  stage?: ClientStage;
  priority?: ClientPriority;
  hasNextContact?: boolean;
}

export interface FunnelStats {
  new: number;
  in_progress: number;
  fixation: number;
  booking: number;
  deal: number;
  completed: number;
  failed: number;
  total: number;
}

export interface CreateClientDto {
  name?: string;
  phone?: string;
  email?: string;
  telegram?: string;
  whatsapp?: string;
  source?: ClientSource;
  stage?: ClientStage;
  priority?: ClientPriority;
  comment?: string;
  budget_min?: number;
  budget_max?: number;
  desired_rooms?: number[];
  desired_districts?: number[];
  desired_deadline?: string;
  next_contact_date?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}
