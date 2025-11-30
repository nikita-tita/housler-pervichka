// Структура данных из XML-фида
export interface ParsedOffer {
  // Идентификаторы
  externalId: string; // internal-id

  // Тип объявления
  type: string; // "продажа"
  propertyType: string; // "жилая"
  category: string; // "квартира"

  // Характеристики квартиры
  rooms: number; // 0 = студия
  isStudio: boolean;
  areaTotal: number;
  areaLiving: number | null;
  areaKitchen: number | null;
  floor: number;
  floorsTotal: number;
  renovation: string | null;
  balcony: string | null;
  bathroomUnit: string | null;

  // Цена
  price: number;
  currency: string;
  mortgage: boolean;

  // Здание
  buildingName: string; // ЖК
  buildingType: string | null;
  buildingState: 'unfinished' | 'hand-over' | null;
  builtYear: number | null;
  readyQuarter: number | null;

  // Идентификаторы nmarket (если есть)
  nmarketBuildingId: string | null;
  nmarketComplexId: string | null;

  // Местоположение
  address: string;
  district: string | null;
  latitude: number;
  longitude: number;
  metroName: string | null;
  metroTimeOnFoot: number | null;

  // Контакты
  salesAgentPhone: string | null;
  salesAgentEmail: string | null;
  salesAgentOrganization: string | null;

  // Описание
  description: string | null;

  // Изображения
  images: ParsedImage[];

  // Мета
  creationDate: Date | null;
  lastUpdateDate: Date | null;
}

export interface ParsedImage {
  tag: 'plan' | 'housemain' | 'floorplan' | 'complexscheme' | null;
  url: string;
}

// Результат импорта
export interface ImportResult {
  totalInFeed: number;
  created: number;
  updated: number;
  deleted: number;
  errors: number;
  durationMs: number;
}

// Типы комнат
export type RoomType =
  | 'studio'
  | 'room_1'
  | 'room_2'
  | 'room_3'
  | 'room_4_plus'
  | 'euro_1'
  | 'euro_2'
  | 'euro_3';

// Результат определения евро-планировки
export interface EuroLayoutResult {
  isEuro: boolean;
  roomType: RoomType;
  confidence: number; // 0-1
  reason: string;
}
