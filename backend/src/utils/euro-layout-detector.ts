import { EuroLayoutResult, RoomType } from '../parsers/types';

interface OfferForEuroDetection {
  rooms: number;
  areaTotal: number;
  areaLiving: number | null;
  areaKitchen: number | null;
  description: string | null;
}

/**
 * Определяет евро-планировку на основе эвристик
 */
export function detectEuroLayout(offer: OfferForEuroDetection): EuroLayoutResult {
  // Эвристика 1: По площади кухни
  // Евро: кухня > 12 м² (кухня-гостиная)
  if (offer.areaKitchen && offer.areaKitchen > 12) {
    // Дополнительно проверяем соотношение
    if (offer.areaLiving && offer.areaKitchen / offer.areaLiving > 0.5) {
      return {
        isEuro: true,
        roomType: getRoomTypeEuro(offer.rooms),
        confidence: 0.8,
        reason: 'Большая кухня (>12 м²) + высокое соотношение кухня/жилая',
      };
    }
  }

  // Эвристика 2: По описанию (если есть)
  if (offer.description) {
    const euroKeywords = [
      'евро',
      'euro',
      'кухня-гостиная',
      'кухня гостиная',
      'европланировка',
      'евро-планировка',
      'объединённая кухня',
      'объединенная кухня',
    ];
    const descLower = offer.description.toLowerCase();
    if (euroKeywords.some((kw) => descLower.includes(kw))) {
      return {
        isEuro: true,
        roomType: getRoomTypeEuro(offer.rooms),
        confidence: 0.9,
        reason: 'Ключевое слово в описании',
      };
    }
  }

  // Эвристика 3: По соотношению общая/жилая площадь
  // Евро обычно имеет меньше жилой площади (часть ушла в кухню-гостиную)
  if (offer.areaLiving && offer.areaTotal) {
    const livingRatio = offer.areaLiving / offer.areaTotal;
    // Для обычной квартиры: жилая ~55-65% от общей
    // Для евро: жилая ~40-50% от общей
    if (livingRatio < 0.5 && offer.rooms > 0) {
      return {
        isEuro: true,
        roomType: getRoomTypeEuro(offer.rooms),
        confidence: 0.6,
        reason: 'Низкое соотношение жилая/общая площадь',
      };
    }
  }

  return {
    isEuro: false,
    roomType: getRoomTypeStandard(offer.rooms),
    confidence: 0.7,
    reason: 'Не соответствует критериям евро-планировки',
  };
}

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
