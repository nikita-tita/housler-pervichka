// Основные модели данных

export interface Offer {
  id: number;
  external_id: string;
  complex_id: number | null;
  rooms: number;
  room_type: string | null;
  is_euro_layout: boolean;
  floor: number;
  floors_total: number;
  area_total: number;
  area_living: number | null;
  area_kitchen: number | null;
  ceiling_height: number | null;
  price: number;
  price_per_meter: number;
  renovation: string | null;
  balcony: string | null;
  bathroom_unit: string | null;
  building_type: string | null;
  building_state: string | null;
  built_year: number | null;
  ready_quarter: number | null;
  address: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Complex {
  id: number;
  external_id: string | null;
  developer_id: number | null;
  name: string;
  address: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  building_type: string | null;
  building_state: string | null;
  floors_min: number | null;
  floors_max: number | null;
  built_year: number | null;
  ready_quarter: number | null;
  description: string | null;
  website: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Developer {
  id: number;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  created_at: Date;
}

export interface District {
  id: number;
  name: string;
  name_en: string | null;
}

export interface MetroStation {
  id: number;
  name: string;
  line_name: string;
  line_color: string;
  latitude: number | null;
  longitude: number | null;
}

export interface OfferImage {
  id: number;
  offer_id: number;
  url: string;
  tag: string | null;
  sort_order: number;
}

export interface Agent {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  company: string | null;
  created_at: Date;
}

export interface Selection {
  id: number;
  agent_id: number;
  title: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  public_link: string;
  notes: string | null;
  status: 'active' | 'archived';
  created_at: Date;
  updated_at: Date;
}

export interface Booking {
  id: number;
  offer_id: number;
  agent_id: number | null;
  selection_id: number | null;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  comment: string | null;
  status: 'new' | 'contacted' | 'viewing' | 'reserved' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

// DTO для API ответов
export interface OfferListItem {
  id: number;
  rooms: number;
  room_type: string | null;
  is_euro_layout: boolean;
  floor: number;
  floors_total: number;
  area_total: number;
  area_living: number | null;
  area_kitchen: number | null;
  price: number;
  price_per_meter: number;
  renovation: string | null;
  building_state: string | null;
  address: string;
  district: string | null;
  complex_name: string | null;
  image_plan: string | null;
  image_main: string | null;
}

export interface OfferDetails extends Offer {
  complex_name: string | null;
  complex_address: string | null;
  developer_name: string | null;
  developer_logo: string | null;
  images: OfferImage[];
  metro: {
    name: string;
    line_name: string;
    line_color: string;
    time_minutes: number;
    transport_type: string;
  }[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================
// Guest Booking Types
// ============================================

export type BookingSourceType = 'organic' | 'guest_from_selection' | 'agent_direct';

export interface GuestBookingData {
  offerId: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  comment?: string;
  // Guest context
  guestClientId: string;          // UUID из localStorage гостя
  sourceSelectionCode?: string;   // Код подборки, через которую пришёл гость
}

export interface BookingWithSource extends Booking {
  source_type: BookingSourceType;
  source_selection_id: number | null;
  source_selection_code: string | null;
  guest_client_id: string | null;
  user_id: number | null;
}

// Контекст подборки для гостя (информация об агенте)
export interface SelectionGuestContext {
  selection: {
    id: number;
    name: string;
    share_code: string;
    items_count: number;
  };
  agent: {
    id: number;
    name: string | null;
    phone: string | null;
    email: string;
  };
  agency: {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}
