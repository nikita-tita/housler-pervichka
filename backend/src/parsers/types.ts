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
  ceilingHeight: number | null;

  // Цена
  price: number;
  currency: string;
  mortgage: boolean;

  // Здание
  buildingName: string | null; // <building-name>
  buildingType: string | null; // <building-type>
  buildingState: string | null; // <building-state>
  builtYear: number | null;
  readyQuarter: number | null;

  // NMarket IDs (для связей)
  nmarketBuildingId: number | null;
  nmarketComplexId: number | null;

  // Местоположение
  address: string | null;
  district: string | null;
  latitude: number;
  longitude: number;

  // Метро
  metroName: string | null;
  metroTimeOnFoot: number | null;
  metroTimeOnTransport: number | null;

  // Контакты
  salesAgentPhone: string | null;
  salesAgentEmail: string | null;
  salesAgentOrganization: string | null;
  salesAgentCategory: string | null;

  // Описание
  description: string | null;

  // Изображения
  images: ParsedImage[];

  // Даты
  creationDate: Date | null;
  lastUpdateDate: Date | null;
}

export interface ParsedImage {
  tag: string | null; // plan, housemain, floorplan, complexscheme
  url: string;
}

export interface ParseResult {
  offers: ParsedOffer[];
  totalParsed: number;
  errors: ParseError[];
  durationMs: number;
}

export interface ParseError {
  offerId: string | null;
  field: string;
  message: string;
  rawValue?: string;
}
