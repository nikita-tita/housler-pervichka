export type RoomType =
  | 'studio'
  | 'room_1'
  | 'room_2'
  | 'room_3'
  | 'room_4_plus'
  | 'euro_1'
  | 'euro_2'
  | 'euro_3';

export interface EuroLayoutResult {
  isEuro: boolean;
  roomType: RoomType;
  confidence: number; // 0-1
  reason: string;
}

interface OfferForDetection {
  rooms: number;
  areaTotal: number;
  areaLiving: number | null;
  areaKitchen: number | null;
  description: string | null;
}

const EURO_KEYWORDS = [
  'евро',
  'euro',
  'кухня-гостиная',
  'кухня гостиная',
  'европланировка',
  'евро-планировка',
  'объединённая кухня',
  'объединенная кухня',
  'еврооднушка',
  'евродвушка',
  'евротрёшка',
  'евротрешка',
];

function getRoomTypeEuro(rooms: number): RoomType {
  switch (rooms) {
    case 0:
      return 'studio';
    case 1:
      return 'euro_1';
    case 2:
      return 'euro_2';
    case 3:
      return 'euro_3';
    default:
      return 'room_4_plus';
  }
}

function getRoomTypeStandard(rooms: number): RoomType {
  switch (rooms) {
    case 0:
      return 'studio';
    case 1:
      return 'room_1';
    case 2:
      return 'room_2';
    case 3:
      return 'room_3';
    default:
      return 'room_4_plus';
  }
}

export function detectEuroLayout(offer: OfferForDetection): EuroLayoutResult {
  // Эвристика 1: По ключевым словам в описании
  if (offer.description) {
    const descLower = offer.description.toLowerCase();
    if (EURO_KEYWORDS.some((kw) => descLower.includes(kw))) {
      return {
        isEuro: true,
        roomType: getRoomTypeEuro(offer.rooms),
        confidence: 0.9,
        reason: 'Ключевое слово в описании',
      };
    }
  }

  // Эвристика 2: По площади кухни
  // Евро-планировка: кухня > 12 м² (кухня-гостиная)
  if (offer.areaKitchen && offer.areaKitchen > 12) {
    // Дополнительно проверяем соотношение кухня/жилая
    if (offer.areaLiving && offer.areaKitchen / offer.areaLiving > 0.5) {
      return {
        isEuro: true,
        roomType: getRoomTypeEuro(offer.rooms),
        confidence: 0.8,
        reason: 'Большая кухня (>12 м²) + высокое соотношение кухня/жилая',
      };
    }

    // Кухня > 15 м² почти наверняка евро
    if (offer.areaKitchen > 15) {
      return {
        isEuro: true,
        roomType: getRoomTypeEuro(offer.rooms),
        confidence: 0.75,
        reason: 'Очень большая кухня (>15 м²)',
      };
    }
  }

  // Эвристика 3: По соотношению общая/жилая площадь
  // Для обычной квартиры: жилая ~55-65% от общей
  // Для евро: жилая ~40-50% от общей (часть ушла в кухню-гостиную)
  if (offer.areaLiving && offer.areaTotal && offer.rooms > 0) {
    const livingRatio = offer.areaLiving / offer.areaTotal;
    if (livingRatio < 0.5) {
      return {
        isEuro: true,
        roomType: getRoomTypeEuro(offer.rooms),
        confidence: 0.6,
        reason: 'Низкое соотношение жилая/общая площадь (<50%)',
      };
    }
  }

  // Не евро
  return {
    isEuro: false,
    roomType: getRoomTypeStandard(offer.rooms),
    confidence: 0.7,
    reason: 'Не соответствует критериям евро-планировки',
  };
}
