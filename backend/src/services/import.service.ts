import { feedParser, ParsedOffer, ParseResult } from '../parsers';
import { detectEuroLayout } from '../utils/euro-layout-detector';
import db from '../config/database';

export interface ImportResult {
  totalInFeed: number;
  created: number;
  updated: number;
  errors: number;
  durationMs: number;
}

class ImportService {
  async importFeed(filePath: string): Promise<ImportResult> {
    const startTime = Date.now();

    // Парсим XML
    const parseResult: ParseResult = await feedParser.parse(filePath);

    let created = 0;
    let updated = 0;
    let errors = parseResult.errors.length;

    // Импортируем батчами по 100
    const batchSize = 100;
    for (let i = 0; i < parseResult.offers.length; i += batchSize) {
      const batch = parseResult.offers.slice(i, i + batchSize);
      const result = await this.processBatch(batch);
      created += result.created;
      updated += result.updated;
      errors += result.errors;
    }

    return {
      totalInFeed: parseResult.totalParsed,
      created,
      updated,
      errors,
      durationMs: Date.now() - startTime,
    };
  }

  private async processBatch(
    offers: ParsedOffer[]
  ): Promise<{ created: number; updated: number; errors: number }> {
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const offer of offers) {
      try {
        const result = await this.upsertOffer(offer);
        if (result === 'created') created++;
        else if (result === 'updated') updated++;
      } catch (error) {
        console.error(`Error importing offer ${offer.externalId}:`, error);
        errors++;
      }
    }

    return { created, updated, errors };
  }

  private async upsertOffer(offer: ParsedOffer): Promise<'created' | 'updated'> {
    // Определяем евро-планировку
    const euroResult = detectEuroLayout({
      rooms: offer.rooms,
      areaTotal: offer.areaTotal,
      areaLiving: offer.areaLiving,
      areaKitchen: offer.areaKitchen,
      description: offer.description,
    });

    // Вычисляем цену за м²
    const pricePerSqm = offer.areaTotal > 0 ? Math.round(offer.price / offer.areaTotal) : 0;

    // Получаем или создаём district
    const districtId = offer.district ? await this.getOrCreateDistrict(offer.district) : null;

    // Получаем или создаём metro
    const metroId = offer.metroName ? await this.getOrCreateMetro(offer.metroName) : null;

    // Получаем или создаём complex
    const complexId = offer.nmarketComplexId
      ? await this.getOrCreateComplex(offer)
      : null;

    // Проверяем существует ли offer
    const existingOffer = await db.query('SELECT id FROM offers WHERE external_id = $1', [
      offer.externalId,
    ]);

    if (existingOffer.rows.length > 0) {
      // Update
      await db.query(
        `UPDATE offers SET
          complex_id = $2,
          district_id = $3,
          metro_station_id = $4,
          offer_type = $5,
          property_type = $6,
          category = $7,
          rooms = $8,
          is_studio = $9,
          area_total = $10,
          area_living = $11,
          area_kitchen = $12,
          floor = $13,
          floors_total = $14,
          renovation = $15,
          balcony = $16,
          bathroom_unit = $17,
          price = $18,
          price_per_sqm = $19,
          currency = $20,
          room_type = $21,
          is_euro_layout = $22,
          address = $23,
          latitude = $24,
          longitude = $25,
          metro_time_on_foot = $26,
          description = $27,
          building_name = $28,
          building_type = $29,
          building_state = $30,
          built_year = $31,
          ready_quarter = $32,
          updated_at = NOW()
        WHERE external_id = $1`,
        [
          offer.externalId,
          complexId,
          districtId,
          metroId,
          offer.type,
          offer.propertyType,
          offer.category,
          offer.rooms,
          offer.isStudio,
          offer.areaTotal,
          offer.areaLiving,
          offer.areaKitchen,
          offer.floor,
          offer.floorsTotal,
          offer.renovation,
          offer.balcony,
          offer.bathroomUnit,
          offer.price,
          pricePerSqm,
          offer.currency,
          euroResult.roomType,
          euroResult.isEuro,
          offer.address,
          offer.latitude,
          offer.longitude,
          offer.metroTimeOnFoot,
          offer.description,
          offer.buildingName,
          offer.buildingType,
          offer.buildingState,
          offer.builtYear,
          offer.readyQuarter,
        ]
      );
      return 'updated';
    } else {
      // Insert
      const result = await db.query(
        `INSERT INTO offers (
          external_id, complex_id, district_id, metro_station_id,
          offer_type, property_type, category,
          rooms, is_studio, area_total, area_living, area_kitchen,
          floor, floors_total, renovation, balcony, bathroom_unit,
          price, price_per_sqm, currency,
          room_type, is_euro_layout,
          address, latitude, longitude, metro_time_on_foot,
          description, building_name, building_type, building_state,
          built_year, ready_quarter, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, true
        ) RETURNING id`,
        [
          offer.externalId,
          complexId,
          districtId,
          metroId,
          offer.type,
          offer.propertyType,
          offer.category,
          offer.rooms,
          offer.isStudio,
          offer.areaTotal,
          offer.areaLiving,
          offer.areaKitchen,
          offer.floor,
          offer.floorsTotal,
          offer.renovation,
          offer.balcony,
          offer.bathroomUnit,
          offer.price,
          pricePerSqm,
          offer.currency,
          euroResult.roomType,
          euroResult.isEuro,
          offer.address,
          offer.latitude,
          offer.longitude,
          offer.metroTimeOnFoot,
          offer.description,
          offer.buildingName,
          offer.buildingType,
          offer.buildingState,
          offer.builtYear,
          offer.readyQuarter,
        ]
      );

      // Добавляем изображения
      const offerId = result.rows[0].id;
      await this.insertImages(offerId, offer.images);

      return 'created';
    }
  }

  private async getOrCreateDistrict(name: string): Promise<number> {
    // Пробуем найти
    const existing = await db.query('SELECT id FROM districts WHERE LOWER(name) = LOWER($1)', [
      name,
    ]);
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }

    // Создаём
    const result = await db.query(
      "INSERT INTO districts (name, region) VALUES ($1, 'Санкт-Петербург') RETURNING id",
      [name]
    );
    return result.rows[0].id;
  }

  private async getOrCreateMetro(name: string): Promise<number> {
    const existing = await db.query('SELECT id FROM metro_stations WHERE LOWER(name) = LOWER($1)', [
      name,
    ]);
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }

    const result = await db.query('INSERT INTO metro_stations (name) VALUES ($1) RETURNING id', [
      name,
    ]);
    return result.rows[0].id;
  }

  private async getOrCreateComplex(offer: ParsedOffer): Promise<number> {
    const complexId = offer.nmarketComplexId!;

    const existing = await db.query('SELECT id FROM complexes WHERE id = $1', [complexId]);
    if (existing.rows.length > 0) {
      return complexId;
    }

    // Создаём комплекс
    await db.query(
      `INSERT INTO complexes (id, name, address, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        complexId,
        offer.buildingName || `Complex ${complexId}`,
        offer.address,
        offer.latitude,
        offer.longitude,
      ]
    );

    return complexId;
  }

  private async insertImages(
    offerId: number,
    images: { tag: string | null; url: string }[]
  ): Promise<void> {
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await db.query(
        'INSERT INTO offer_images (offer_id, tag, url, display_order) VALUES ($1, $2, $3, $4)',
        [offerId, img.tag, img.url, i]
      );
    }
  }
}

export const importService = new ImportService();
