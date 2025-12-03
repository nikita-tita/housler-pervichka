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
  completion_date?: string | null; // "Сдан", "2025", "2 кв. 2026"
}

export interface OfferImage {
  url: string;
  tag: 'plan' | 'floorplan' | 'housemain' | 'complexscheme' | null;
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
  images: OfferImage[];
  latitude: number | null;
  longitude: number | null;
}

export interface MapBounds {
  lat_min: number;
  lat_max: number;
  lng_min: number;
  lng_max: number;
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
  metro_time_max?: number; // Максимальное время до метро пешком (минуты)
  building_type?: string[]; // Тип дома (монолит, панель, кирпич)
  has_finishing?: boolean;
  complexes?: string[];
  complex_id?: number;
  search?: string;
  completion_years?: number[];
  developers?: string[];
  bounds?: MapBounds;
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
  building_types: { name: string; count: number }[];
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
  view_count: number;
  last_viewed_at: string | null;
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
  floor: number | null;
  floors_total: number | null;
  area_total: number | null;
  price: number | null;
  price_per_sqm: number | null;
  building_name: string | null;
  complex_name: string | null;
  district: string | null;
  metro_name: string | null;
  main_image: string | null;
  // Nested offer object for compatibility
  offer?: OfferListItem | null;
}

export interface SelectionDetail extends Selection {
  items: SelectionItem[];
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

export type UpdateClientDto = Partial<CreateClientDto>;

// ============ FIXATIONS (Фиксации цен) ============

export type FixationStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'converted';

export interface Fixation {
  id: number;
  lock_number: string;
  agent_id: number;
  client_id: number | null;
  selection_id: number | null;
  offer_id: number;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  locked_price: number;
  requested_days: number;
  approved_days: number | null;
  expires_at: string | null;
  status: FixationStatus;
  agent_comment: string | null;
  operator_comment: string | null;
  developer_response: string | null;
  booking_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FixationWithOffer extends Fixation {
  offer_address: string | null;
  offer_rooms: number | null;
  offer_area: number | null;
  complex_name: string | null;
  building_name: string | null;
  client_stage?: string;
}

export interface FixationDetail extends FixationWithOffer {
  offer_floor: number | null;
  offer_floors_total: number | null;
  offer_price_current: number | null;
  offer_image: string | null;
}

export interface CreateFixationDto {
  clientId?: number;
  offerId: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  requestedDays?: number;
  comment?: string;
}

export interface FixationFilters {
  status?: FixationStatus;
  clientId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface FixationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  converted: number;
  expiringToday: number;
}

// ============ DEALS (Сделки) ============

export type DealStatus = 'pending' | 'signed' | 'registered' | 'completed' | 'cancelled';
export type CommissionStatus = 'pending' | 'invoiced' | 'paid';

export interface Deal {
  id: number;
  deal_number: string;
  booking_id: number | null;
  client_id: number | null;
  agent_id: number;
  offer_id: number;
  contract_number: string | null;
  contract_date: string | null;
  final_price: number;
  discount_amount: number;
  discount_reason: string | null;
  commission_percent: number | null;
  commission_amount: number | null;
  commission_payment_status: CommissionStatus;
  status: DealStatus;
  signed_at: string | null;
  registered_at: string | null;
  registration_number: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealWithOffer extends Deal {
  offer_address: string | null;
  offer_rooms: number | null;
  offer_area: number | null;
  complex_name: string | null;
  building_name: string | null;
  client_name: string | null;
  client_phone: string | null;
}

export interface DealDetail extends DealWithOffer {
  offer_floor: number | null;
  offer_floors_total: number | null;
  offer_image: string | null;
  booking_status: string | null;
}

export interface CreateDealDto {
  bookingId: number;
  finalPrice?: number;
  discountAmount?: number;
  discountReason?: string;
  commissionPercent?: number;
  notes?: string;
}

export interface UpdateDealDto {
  contractNumber?: string;
  contractDate?: string;
  finalPrice?: number;
  discountAmount?: number;
  discountReason?: string;
  commissionPercent?: number;
  registrationNumber?: string;
  notes?: string;
}

export interface DealFilters {
  status?: DealStatus;
  clientId?: number;
  commissionStatus?: CommissionStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface DealStats {
  total: number;
  pending: number;
  signed: number;
  registered: number;
  completed: number;
  cancelled: number;
  totalValue: number;
  totalCommission: number;
  pendingCommission: number;
}

// ============ FAILURES (Срывы) ============

export type CancellationStage = 'at_fixation' | 'at_booking' | 'at_deal';
export type InitiatedBy = 'client' | 'developer' | 'agent' | 'bank';

export interface Failure {
  id: number;
  price_lock_id: number | null;
  booking_id: number | null;
  deal_id: number | null;
  client_id: number | null;
  agent_id: number;
  offer_id: number | null;
  stage: CancellationStage;
  reason: string;
  reason_details: string | null;
  initiated_by: InitiatedBy;
  penalty_amount: number;
  created_at: string;
}

export interface FailureWithDetails extends Failure {
  offer_address: string | null;
  offer_rooms: number | null;
  complex_name: string | null;
  client_name: string | null;
  client_phone: string | null;
  reason_name: string | null;
}

export interface CancellationReason {
  id: number;
  stage: CancellationStage;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface CreateFailureDto {
  stage: CancellationStage;
  priceLockId?: number;
  bookingId?: number;
  dealId?: number;
  clientId?: number;
  offerId?: number;
  reason: string;
  reasonDetails?: string;
  initiatedBy: InitiatedBy;
  penaltyAmount?: number;
}

export interface FailureFilters {
  stage?: CancellationStage;
  reason?: string;
  initiatedBy?: InitiatedBy;
  dateFrom?: string;
  dateTo?: string;
}

export interface FailureStats {
  total: number;
  atFixation: number;
  atBooking: number;
  atDeal: number;
  byClient: number;
  byDeveloper: number;
  byAgent: number;
  byBank: number;
  totalPenalty: number;
  topReasons: { reason: string; count: number }[];
}

// ============ ADMIN ============

export interface AdminUser {
  id: number;
  email: string;
  phone: string | null;
  name: string | null;
  role: UserRole;
  agency_id: number | null;
  agency_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface AdminAgency {
  id: number;
  name: string;
  slug: string;
  inn: string | null;
  phone: string | null;
  email: string | null;
  is_default: boolean;
  registration_status: string;
  agents_count: number;
  created_at: string;
}

export interface PlatformStats {
  users: {
    total: number;
    clients: number;
    agents: number;
    agency_admins: number;
    operators: number;
    admins: number;
    active_today: number;
    active_week: number;
  };
  agencies: {
    total: number;
    pending: number;
    active: number;
    rejected: number;
  };
  offers: {
    total: number;
    active: number;
  };
  bookings: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  selections: {
    total: number;
    public: number;
  };
}

// ============ GUEST MODE ============

export type BookingSourceType = 'organic' | 'guest_from_selection' | 'agent_direct';

// Информация об агенте для гостевого режима
export interface GuestAgentInfo {
  id: number;
  name: string | null;
  phone: string | null;
  email: string;
}

// Информация об агентстве для гостевого режима
export interface GuestAgencyInfo {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
}

// Контекст подборки для гостя
export interface SelectionGuestContext {
  selection: {
    id: number;
    name: string;
    share_code: string;
    items_count: number;
  };
  agent: GuestAgentInfo;
  agency: GuestAgencyInfo | null;
}

// Состояние гостевого режима
export interface GuestState {
  isGuest: boolean;
  guestClientId: string | null;
  selectionCode: string | null;
  context: SelectionGuestContext | null;
  expiresAt: number | null; // timestamp
}

// Данные для гостевого бронирования
export interface GuestBookingData {
  offerId: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  comment?: string;
  guestClientId: string;
  sourceSelectionCode?: string;
}
