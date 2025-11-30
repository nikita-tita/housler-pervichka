/**
 * Детектор евро-планировок
 *
 * Евро-планировка — квартира с объединённой кухней-гостиной.
 * Признаки:
 * 1. Большая кухня (> 12 м²) при небольшой жилой площади
 * 2. Соотношение жилой/общей площади ниже стандартного
 * 3. Специфические типы комнат в описании
 */

export interface EuroDetectionInput {
  rooms: number;
  area_total: number;
  area_living: number | null;
  area_kitchen: number | null;
  description: string | null;
  room_type: string | null;
}

export interface EuroDetectionResult {
  is_euro: boolean;
  confidence: number; // 0-1
  reason: string;
}

// Ключевые слова для определения евро-планировки
const EURO_KEYWORDS = [
  'евро',
  'euro',
  'кухня-гостиная',
  'кухня гостиная',
  'объединенн',
  'объединённ',
  'студийн',
  'open space',
  'кухня-столовая'
];

export function detectEuroLayout(input: EuroDetectionInput): EuroDetectionResult {
  const { rooms, area_total, area_living, area_kitchen, description, room_type } = input;

  // Студии — не евро-планировка (это отдельная категория)
  if (rooms === 0) {
    return { is_euro: false, confidence: 1, reason: 'Студия' };
  }

  // Проверка по типу комнаты
  if (room_type) {
    const roomTypeLower = room_type.toLowerCase();
    if (EURO_KEYWORDS.some(kw => roomTypeLower.includes(kw))) {
      return { is_euro: true, confidence: 0.95, reason: 'Указан тип комнаты евро' };
    }
  }

  // Проверка по описанию
  if (description) {
    const descLower = description.toLowerCase();
    if (EURO_KEYWORDS.some(kw => descLower.includes(kw))) {
      return { is_euro: true, confidence: 0.85, reason: 'Ключевые слова в описании' };
    }
  }

  // Эвристики по площадям
  if (area_kitchen && area_kitchen > 12) {
    // Большая кухня — признак кухни-гостиной

    if (area_living && area_total > 0) {
      const livingRatio = area_living / area_total;

      // Для обычной квартиры жилая площадь обычно > 50% от общей
      // Для евро — меньше, т.к. кухня-гостиная не считается жилой
      if (livingRatio < 0.45) {
        return {
          is_euro: true,
          confidence: 0.75,
          reason: `Большая кухня (${area_kitchen}м²) + низкое соотношение жилой площади (${Math.round(livingRatio * 100)}%)`
        };
      }
    }

    // Очень большая кухня для количества комнат
    const expectedKitchenMax = rooms <= 1 ? 10 : rooms <= 2 ? 12 : 15;
    if (area_kitchen > expectedKitchenMax + 5) {
      return {
        is_euro: true,
        confidence: 0.6,
        reason: `Кухня ${area_kitchen}м² больше ожидаемой для ${rooms}-комн.`
      };
    }
  }

  return { is_euro: false, confidence: 0.7, reason: 'Стандартная планировка' };
}

/**
 * Определяет тип комнаты для отображения
 */
export function getRoomType(rooms: number, isEuro: boolean): string {
  if (rooms === 0) return 'Студия';
  if (isEuro) return `Евро-${rooms}`;
  return `${rooms}-комн.`;
}
