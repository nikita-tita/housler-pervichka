import { YandexFeedParser } from '../parsers/yandex-feed.parser';
import { ParsedOffer, ImportResult } from '../parsers/types';
import { detectEuroLayout } from '../utils/euro-layout-detector';
import db from '../config/database';

export class ImportService {
  private parser = new YandexFeedParser();

  async importFeed(filePath: string): Promise<ImportResult> {
    const startTime = Date.now();

    console.log(`Starting import from ${filePath}...`);

    // Парсим XML
    const parseResult = await this.parser.parse(filePath);
    console.log(`Parsed ${parseResult.totalParsed} offers in ${parseResult.durationMs}ms`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Обрабатываем батчами по 100
    const batchSize = 100;
    for (let i = 0; i < parseResult.offers.length; i += batchSize) {
      const batch = parseResult.offers.slice(i, i + batchSize);

      try {
        const result = await this.upsertBatch(batch);
        created += result.created;
        updated += result.updated;
        errors += result.errors;
      } catch (error) {
        console.error(`Error processing batch ${i / batchSize}:`, error);
        errors += batch.length;
      }

      // Прогресс
      if ((i + batchSize) % 1000 === 0) {
        console.log(`Processed ${Math.min(i + batchSize, parseResult.offers.length)} / ${parseResult.offers.length}`);
      }
    }

    // Помечаем удалённые
    const externalIds = parseResult.offers.map((o) => o.externalId);
    const deletedCount = await this.markDeleted(externalIds);

    const result: ImportResult = {
      totalInFeed: parseResult.totalParsed,
      created,
      updated,
      deleted: deletedCount,
      errors: errors + parseResult.errors.length,
      durationMs: Date.now() - startTime,
    };

    console.log('Import completed:', result);
    return result;
  }

  private async upsertBatch(
    offers: ParsedOffer[]
  ): Promise<{ created: number; updated: number; errors: number }> {
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const offer of offers) {
      try {
        // 1. Upsert district
        const districtId = await this.upsertDistrict(offer.district);

        // 2. Upsert metro
        const metroId = await this.upsertMetro(offer.metroName);

        // 3. Upsert developer
        const developerId = await this.upsertDeveloper(offer.salesAgentOrganization);

        // 4. Upsert complex
        const complexId = await this.upsertComplex(offer, districtId, developerId, metroId);

        // 5. Upsert building
        const buildingId = await this.upsertBuilding(offer, complexId);

        // 6. Определяем евро-планировку
        const euroResult = detectEuroLayout({
          rooms: offer.rooms,
          areaTotal: offer.areaTotal,
          areaLiving: offer.areaLiving,
          areaKitchen: offer.areaKitchen,
          description: offer.description,
        });

        // 7. Upsert offer
        const isNew = await this.upsertOffer(
          offer,
          complexId,
          buildingId,
          districtId,
          metroId,
          euroResult.isEuro,
          euroResult.roomType
        );

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        // 8. Upsert images
        await this.upsertImages(offer.externalId, offer.images);
      } catch (error) {
        console.error(`Error processing offer ${offer.externalId}:`, error);
        errors++;
      }
    }

    return { created, updated, errors };
  }

  private async upsertDistrict(name: string | null): Promise<number | null> {
    if (!name) return null;

    const result = await db.query(
      `INSERT INTO districts (name, region)
       VALUES ($1, 'Санкт-Петербург')
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name]
    );
    return result.rows[0]?.id || null;
  }

  private async upsertMetro(name: string | null): Promise<number | null> {
    if (!name) return null;

    const result = await db.query(
      `INSERT INTO metro_stations (name, line)
       VALUES ($1, NULL)
       ON CONFLICT (name, line) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name]
    );
    return result.rows[0]?.id || null;
  }

  private async upsertDeveloper(name: string | null): Promise<number | null> {
    if (!name) return null;

    const result = await db.query(
      `INSERT INTO developers (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [name]
    );
    return result.rows[0]?.id || null;
  }

  private async upsertComplex(
    offer: ParsedOffer,
    districtId: number | null,
    developerId: number | null,
    metroId: number | null
  ): Promise<number | null> {
    if (!offer.buildingName) return null;

    const complexId = offer.nmarketComplexId ? parseInt(offer.nmarketComplexId, 10) : null;

    const result = await db.query(
      `INSERT INTO complexes (
        id, name, developer_id, district_id, address,
        coordinates, nearest_metro_id, metro_time_on_foot
      )
      VALUES (
        COALESCE($1, nextval('complexes_id_seq')), $2, $3, $4, $5,
        ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, $9
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [
        complexId,
        offer.buildingName,
        developerId,
        districtId,
        offer.address,
        offer.longitude,
        offer.latitude,
        metroId,
        offer.metroTimeOnFoot,
      ]
    );
    return result.rows[0]?.id || null;
  }

  private async upsertBuilding(offer: ParsedOffer, complexId: number | null): Promise<number | null> {
    if (!complexId) return null;

    const buildingId = offer.nmarketBuildingId ? parseInt(offer.nmarketBuildingId, 10) : null;

    const result = await db.query(
      `INSERT INTO buildings (
        id, complex_id, building_type, building_state,
        floors_total, built_year, ready_quarter
      )
      VALUES (
        COALESCE($1, nextval('buildings_id_seq')), $2, $3, $4, $5, $6, $7
      )
      ON CONFLICT (id) DO UPDATE SET
        building_state = EXCLUDED.building_state,
        floors_total = EXCLUDED.floors_total,
        built_year = EXCLUDED.built_year,
        ready_quarter = EXCLUDED.ready_quarter,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [
        buildingId,
        complexId,
        offer.buildingType,
        offer.buildingState,
        offer.floorsTotal,
        offer.builtYear,
        offer.readyQuarter,
      ]
    );
    return result.rows[0]?.id || null;
  }

  private async upsertOffer(
    offer: ParsedOffer,
    complexId: number | null,
    buildingId: number | null,
    districtId: number | null,
    metroId: number | null,
    isEuro: boolean,
    roomType: string
  ): Promise<boolean> {
    const pricePerSqm = offer.areaTotal > 0 ? Math.round(offer.price / offer.areaTotal) : 0;

    const result = await db.query(
      `INSERT INTO offers (
        external_id, complex_id, building_id, district_id, metro_station_id,
        offer_type, property_type, category,
        rooms, is_studio, area_total, area_living, area_kitchen,
        floor, floors_total, renovation, balcony, bathroom_unit,
        price, price_per_sqm, currency, mortgage,
        room_type, is_euro_layout,
        address, coordinates, metro_time_on_foot,
        description, is_active
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20, $21, $22,
        $23, $24,
        $25, ST_SetSRID(ST_MakePoint($26, $27), 4326), $28,
        $29, true
      )
      ON CONFLICT (external_id) DO UPDATE SET
        complex_id = EXCLUDED.complex_id,
        building_id = EXCLUDED.building_id,
        district_id = EXCLUDED.district_id,
        metro_station_id = EXCLUDED.metro_station_id,
        price = EXCLUDED.price,
        price_per_sqm = EXCLUDED.price_per_sqm,
        room_type = EXCLUDED.room_type,
        is_euro_layout = EXCLUDED.is_euro_layout,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP
      RETURNING (xmax = 0) AS is_new`,
      [
        offer.externalId,
        complexId,
        buildingId,
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
        offer.mortgage,
        roomType,
        isEuro,
        offer.address,
        offer.longitude,
        offer.latitude,
        offer.metroTimeOnFoot,
        offer.description,
      ]
    );

    return result.rows[0]?.is_new || false;
  }

  private async upsertImages(
    externalId: string,
    images: Array<{ tag: string | null; url: string }>
  ): Promise<void> {
    // Удаляем старые изображения
    await db.query('DELETE FROM offer_images WHERE offer_id = (SELECT id FROM offers WHERE external_id = $1)', [
      externalId,
    ]);

    // Добавляем новые
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      await db.query(
        `INSERT INTO offer_images (offer_id, tag, url, display_order)
         SELECT id, $2, $3, $4 FROM offers WHERE external_id = $1`,
        [externalId, img.tag, img.url, i]
      );
    }
  }

  private async markDeleted(activeExternalIds: string[]): Promise<number> {
    if (activeExternalIds.length === 0) return 0;

    const result = await db.query(
      `UPDATE offers
       SET is_active = false, deleted_at = CURRENT_TIMESTAMP
       WHERE external_id NOT IN (${activeExternalIds.map((_, i) => `$${i + 1}`).join(',')})
         AND is_active = true`,
      activeExternalIds
    );

    return result.rowCount || 0;
  }
}

export const importService = new ImportService();
