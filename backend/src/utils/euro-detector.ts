export type RoomType =
  | 'studio'
  | 'room_1'
  | 'euro_1'
  | 'room_2'
  | 'euro_2'
  | 'room_3'
  | 'euro_3'
  | 'room_4_plus';

export interface EuroDetectionResult {
  isEuro: boolean;
  roomType: RoomType;
  confidence: number; // 0-1
  reason: string;
}

interface EuroDetectionInput {
  rooms: number;
  areaTotal: number;
  areaLiving: number | null;
  areaKitchen: number | null;
  description: string | null;
}

// Ключевые слова для определения евро-планировки
const EURO_KEYWORDS = [
  'евро',
  'euro',
  'европланировка',
  'евро-планировка',
  'кухня-гостиная',
  'кухня гостиная',
  'объединённая кухня',
  'объединенная кухня',
  'кухня-столовая',
  'совмещённая кухня',
];

export function detectEuroLayout(input: EuroDetectionInput): EuroDetectionResult {
  const { rooms, areaTotal, areaLiving, areaKitchen, description } = input;

  // Студия — не евро по определению
  if (rooms === 0) {
    return {
      isEuro: false,
      roomType: 'studio',
      confidence: 1.0,
      reason: 'Студия',
    };
  }

  // 4+ комнат — не различаем евро
  if (rooms >= 4) {
    return {
      isEuro: false,
      roomType: 'room_4_plus',
      confidence: 1.0,
      reason: '4+ комнат',
    };
  }

  // Проверка 1: По описанию (высокая уверенность)
  if (description) {
    const descLower = description.toLowerCase();
    const hasEuroKeyword = EURO_KEYWORDS.some((kw) => descLower.includes(kw));

    if (hasEuroKeyword) {
      return {
        isEuro: true,
        roomType: getEuroRoomType(rooms),
        confidence: 0.95,
        reason: 'Ключевое слово в описании',
      };
    }
  }

  // Проверка 2: По площади кухни (кухня-гостиная > 12 м²)
  if (areaKitchen && areaKitchen > 12) {
    // Дополнительно проверяем соотношение
    if (areaLiving && areaKitchen / areaLiving > 0.5) {
      return {
        isEuro: true,
        roomType: getEuroRoomType(rooms),
        confidence: 0.85,
        reason: `Большая кухня (${areaKitchen} м²) + высокое соотношение к жилой`,
      };
    }

    // Просто большая кухня
    return {
      isEuro: true,
      roomType: getEuroRoomType(rooms),
      confidence: 0.7,
      reason: `Большая кухня (${areaKitchen} м²)`,
    };
  }

  // Проверка 3: По соотношению жилая/общая площадь
  // Евро обычно имеет меньше "жилой" площади (часть ушла в кухню-гостиную)
  if (areaLiving && areaTotal) {
    const livingRatio = areaLiving / areaTotal;

    // Для обычной квартиры: жилая ~55-65% от общей
    // Для евро: жилая ~40-50% от общей
    if (livingRatio < 0.45) {
      return {
        isEuro: true,
        roomType: getEuroRoomType(rooms),
        confidence: 0.6,
        reason: `Низкое соотношение жилой к общей (${Math.round(livingRatio * 100)}%)`,
      };
    }
  }

  // Не евро
  return {
    isEuro: false,
    roomType: getStandardRoomType(rooms),
    confidence: 0.7,
    reason: 'Не соответствует критериям евро-планировки',
  };
}

function getEuroRoomType(rooms: number): RoomType {
  switch (rooms) {
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

function getStandardRoomType(rooms: number): RoomType {
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

// Форматирование для отображения
export function formatRoomType(roomType: RoomType): string {
  const labels: Record<RoomType, string> = {
    studio: 'Студия',
    room_1: '1-комн.',
    euro_1: '1-комн. (евро)',
    room_2: '2-комн.',
    euro_2: '2-комн. (евро)',
    room_3: '3-комн.',
    euro_3: '3-комн. (евро)',
    room_4_plus: '4+ комн.',
  };
  return labels[roomType];
}
