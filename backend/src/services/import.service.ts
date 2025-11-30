import db from '../config/database';
import { feedParser } from '../parsers/yandex-feed.parser';
import { ParsedOffer } from '../parsers/types';
import { detectEuroLayout, RoomType } from '../utils/euro-detector';

export interface ImportResult {
  totalInFeed: number;
  created: number;
  updated: number;
  deleted: number;
  errors: number;
  durationMs: number;
}

class ImportService {
  async importFeed(filePath: string): Promise<ImportResult> {
    const startTime = Date.now();

    console.log('Parsing feed...');
    const parseResult = await feedParser.parse(filePath);
    console.log(`Parsed ${parseResult.totalParsed} offers in ${parseResult.durationMs}ms`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Получаем текущие ID для определения удалённых
    const existingIds = await this.getExistingOfferIds();
    const processedIds = new Set<string>();

    // Обрабатываем пачками по 100
    const batchSize = 100;
    for (let i = 0; i < parseResult.offers.length; i += batchSize) {
      const batch = parseResult.offers.slice(i, i + batchSize);

      for (const offer of batch) {
        try {
          const result = await this.upsertOffer(offer);
          if (result === 'created') created++;
          else if (result === 'updated') updated++;
          processedIds.add(offer.externalId);
        } catch (error) {
          console.error(`Error importing offer ${offer.externalId}:`, error);
          errors++;
        }
      }

      // Логируем прогресс
      if ((i + batchSize) % 1000 === 0) {
        console.log(`Processed ${i + batchSize} / ${parseResult.offers.length}`);
      }
    }

    // Помечаем удалённые
    const deletedCount = await this.markDeleted(existingIds, processedIds);

    // Обновляем счётчики комплексов
    await this.updateComplexStats();

    return {
      totalInFeed: parseResult.totalParsed,
      created,
      updated,
      deleted: deletedCount,
      errors: errors + parseResult.errors.length,
      durationMs: Date.now() - startTime,
    };
  }

  private async getExistingOfferIds(): Promise<Set<string>> {
    const result = await db.query('SELECT id::text FROM offers WHERE is_active = true');
    return new Set(result.rows.map((r) => r.id));
  }

  private async upsertOffer(parsed: ParsedOffer): Promise<'created' | 'updated'> {
    // 1. Upsert district
    const districtId = await this.upsertDistrict(parsed.district);

    // 2. Upsert metro
    const metroId = await this.upsertMetro(parsed.metroName);

    // 3. Upsert developer (из organization)
    const developerId = await this.upsertDeveloper(parsed.salesAgentOrganization);

    // 4. Upsert complex
    const complexId = await this.upsertComplex(parsed, developerId, districtId);

    // 5. Upsert building
    const buildingId = await this.upsertBuilding(parsed, complexId);

    // 6. Определяем евро-планировку
    const euroResult = detectEuroLayout({
      rooms: parsed.rooms,
      areaTotal: parsed.areaTotal,
      areaLiving: parsed.areaLiving,
      areaKitchen: parsed.areaKitchen,
      description: parsed.description,
    });

    // 7. Upsert offer
    const isNew = await this.upsertOfferRecord(
      parsed,
      complexId,
      buildingId,
      districtId,
      metroId,
      euroResult.roomType,
      euroResult.isEuro
    );

    // 8. Upsert images
    await this.upsertImages(parsed.externalId, parsed.images);

    return isNew ? 'created' : 'updated';
  }

  private async upsertDistrict(name: string | null): Promise<number | null> {
    if (!name) return null;

    const result = await db.query(
      `
      INSERT INTO districts (name, region)
      VALUES ($1, 'Санкт-Петербург')
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `,
      [name]
    );

    return result.rows[0]?.id || null;
  }

  private async upsertMetro(name: string | null): Promise<number | null> {
    if (!name) return null;

    // Ищем существующую станцию
    const existing = await db.query('SELECT id FROM metro_stations WHERE name = $1 LIMIT 1', [
      name,
    ]);

    if (existing.rows[0]) {
      return existing.rows[0].id;
    }

    // Создаём новую
    const result = await db.query(
      `
      INSERT INTO metro_stations (name, line)
      VALUES ($1, NULL)
      ON CONFLICT (name, line) DO NOTHING
      RETURNING id
    `,
      [name]
    );

    return result.rows[0]?.id || null;
  }

  private async upsertDeveloper(organization: string | null): Promise<number | null> {
    if (!organization) return null;

    const result = await db.query(
      `
      INSERT INTO developers (name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `,
      [organization]
    );

    return result.rows[0]?.id || null;
  }

  private async upsertComplex(
    parsed: ParsedOffer,
    developerId: number | null,
    districtId: number | null
  ): Promise<number | null> {
    if (!parsed.buildingName) return null;

    // Используем nmarket-complex-id если есть, иначе генерируем из имени
    const complexId = parsed.nmarketComplexId || Math.abs(this.hashCode(parsed.buildingName));

    const result = await db.query(
      `
      INSERT INTO complexes (id, name, developer_id, district_id, address)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        developer_id = COALESCE(EXCLUDED.developer_id, complexes.developer_id),
        district_id = COALESCE(EXCLUDED.district_id, complexes.district_id),
        updated_at = NOW()
      RETURNING id
    `,
      [complexId, parsed.buildingName, developerId, districtId, parsed.address]
    );

    return result.rows[0]?.id || null;
  }

  private async upsertBuilding(
    parsed: ParsedOffer,
    complexId: number | null
  ): Promise<number | null> {
    if (!complexId) return null;

    const buildingId =
      parsed.nmarketBuildingId || Math.abs(this.hashCode(`${complexId}-${parsed.address}`));

    const result = await db.query(
      `
      INSERT INTO buildings (id, complex_id, building_type, building_state, floors_total, built_year, ready_quarter)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        building_type = COALESCE(EXCLUDED.building_type, buildings.building_type),
        building_state = COALESCE(EXCLUDED.building_state, buildings.building_state),
        floors_total = COALESCE(EXCLUDED.floors_total, buildings.floors_total),
        built_year = COALESCE(EXCLUDED.built_year, buildings.built_year),
        ready_quarter = COALESCE(EXCLUDED.ready_quarter, buildings.ready_quarter),
        updated_at = NOW()
      RETURNING id
    `,
      [
        buildingId,
        complexId,
        parsed.buildingType,
        parsed.buildingState,
        parsed.floorsTotal,
        parsed.builtYear,
        parsed.readyQuarter,
      ]
    );

    return result.rows[0]?.id || null;
  }

  private async upsertOfferRecord(
    parsed: ParsedOffer,
    complexId: number | null,
    buildingId: number | null,
    districtId: number | null,
    metroId: number | null,
    roomType: RoomType,
    isEuro: boolean
  ): Promise<boolean> {
    const offerId = parseInt(parsed.externalId, 10);

    const result = await db.query(
      `
      INSERT INTO offers (
        id, complex_id, building_id, district_id, metro_station_id,
        offer_type, property_type, category,
        rooms, is_studio, room_type, is_euro_layout,
        area_total, area_living, area_kitchen,
        floor, floors_total,
        renovation, balcony, bathroom_unit,
        price, currency, mortgage,
        address, coordinates, metro_time_on_foot,
        description,
        creation_date, last_update_date,
        is_active
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17,
        $18, $19, $20,
        $21, $22, $23,
        $24, ST_SetSRID(ST_MakePoint($25, $26), 4326), $27,
        $28,
        $29, $30,
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        complex_id = EXCLUDED.complex_id,
        building_id = EXCLUDED.building_id,
        district_id = EXCLUDED.district_id,
        metro_station_id = EXCLUDED.metro_station_id,
        rooms = EXCLUDED.rooms,
        is_studio = EXCLUDED.is_studio,
        room_type = EXCLUDED.room_type,
        is_euro_layout = EXCLUDED.is_euro_layout,
        area_total = EXCLUDED.area_total,
        area_living = EXCLUDED.area_living,
        area_kitchen = EXCLUDED.area_kitchen,
        floor = EXCLUDED.floor,
        floors_total = EXCLUDED.floors_total,
        renovation = EXCLUDED.renovation,
        balcony = EXCLUDED.balcony,
        bathroom_unit = EXCLUDED.bathroom_unit,
        price = EXCLUDED.price,
        mortgage = EXCLUDED.mortgage,
        address = EXCLUDED.address,
        coordinates = EXCLUDED.coordinates,
        metro_time_on_foot = EXCLUDED.metro_time_on_foot,
        description = EXCLUDED.description,
        last_update_date = EXCLUDED.last_update_date,
        is_active = true,
        updated_at = NOW()
      RETURNING (xmax = 0) AS is_new
    `,
      [
        offerId,
        complexId,
        buildingId,
        districtId,
        metroId,
        parsed.type,
        parsed.propertyType,
        parsed.category,
        parsed.rooms,
        parsed.isStudio,
        roomType,
        isEuro,
        parsed.areaTotal,
        parsed.areaLiving,
        parsed.areaKitchen,
        parsed.floor,
        parsed.floorsTotal,
        parsed.renovation,
        parsed.balcony,
        parsed.bathroomUnit,
        parsed.price,
        parsed.currency,
        parsed.mortgage,
        parsed.address,
        parsed.longitude,
        parsed.latitude,
        parsed.metroTimeOnFoot,
        parsed.description,
        parsed.creationDate,
        parsed.lastUpdateDate,
      ]
    );

    return result.rows[0]?.is_new || false;
  }

  private async upsertImages(
    offerId: string,
    images: { tag: string | null; url: string }[]
  ): Promise<void> {
    const id = parseInt(offerId, 10);

    // Удаляем старые
    await db.query('DELETE FROM images WHERE offer_id = $1', [id]);

    // Вставляем новые
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await db.query(
        `
        INSERT INTO images (offer_id, tag, url, display_order)
        VALUES ($1, $2, $3, $4)
      `,
        [id, img.tag, img.url, i]
      );
    }
  }

  private async markDeleted(
    existingIds: Set<string>,
    processedIds: Set<string>
  ): Promise<number> {
    const toDelete = [...existingIds].filter((id) => !processedIds.has(id));

    if (toDelete.length === 0) return 0;

    await db.query(
      `
      UPDATE offers
      SET is_active = false, deleted_at = NOW()
      WHERE id = ANY($1::bigint[])
    `,
      [toDelete.map((id) => parseInt(id, 10))]
    );

    return toDelete.length;
  }

  private async updateComplexStats(): Promise<void> {
    await db.query(`
      UPDATE complexes c SET
        min_price = sub.min_price,
        max_price = sub.max_price,
        avg_price_per_sqm = sub.avg_price_per_sqm,
        total_apartments = sub.total
      FROM (
        SELECT
          complex_id,
          MIN(price) as min_price,
          MAX(price) as max_price,
          AVG(price / area_total) as avg_price_per_sqm,
          COUNT(*) as total
        FROM offers
        WHERE is_active = true AND complex_id IS NOT NULL
        GROUP BY complex_id
      ) sub
      WHERE c.id = sub.complex_id
    `);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  }
}

export const importService = new ImportService();
