import { pool } from '../config/database';
import { ParsedOffer } from '../parsers/yandex-feed.parser';

export interface ImportResult {
  imported: number;
  updated: number;
  failed: number;
  errors: string[];
}

export class ImportService {
  /**
   * Импортирует один offer в БД (upsert)
   */
  async importOffer(offer: ParsedOffer): Promise<{ success: boolean; error?: string }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Получить или создать район
      let districtId: number | null = null;
      if (offer.district) {
        districtId = await this.getOrCreateDistrict(client, offer.district);
      }

      // 2. Получить или создать ЖК
      let complexId: number | null = null;
      if (offer.building_name) {
        complexId = await this.getOrCreateComplex(client, offer.building_name, offer.address, districtId);
      }

      // 3. Upsert offer
      const offerId = await this.upsertOffer(client, offer, districtId, complexId);

      // 4. Импортировать изображения
      if (offer.images && offer.images.length > 0) {
        await this.importImages(client, offerId, offer.images);
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMsg };
    } finally {
      client.release();
    }
  }

  /**
   * Импортирует массив offers
   */
  async importOffers(offers: ParsedOffer[], onProgress?: (current: number, total: number) => void): Promise<ImportResult> {
    const result: ImportResult = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    const total = offers.length;

    for (let i = 0; i < offers.length; i++) {
      const offer = offers[i];

      try {
        const { success, error } = await this.importOffer(offer);

        if (success) {
          result.imported++;
        } else {
          result.failed++;
          if (error) {
            result.errors.push(`Offer ${offer.external_id}: ${error}`);
          }
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Offer ${offer.external_id}: ${error}`);
      }

      // Callback прогресса каждые 100 записей
      if (onProgress && (i + 1) % 100 === 0) {
        onProgress(i + 1, total);
      }
    }

    // Финальный callback
    if (onProgress) {
      onProgress(total, total);
    }

    return result;
  }

  /**
   * Получить или создать район
   */
  private async getOrCreateDistrict(client: any, name: string): Promise<number> {
    // Попробовать найти
    const findResult = await client.query(
      'SELECT id FROM districts WHERE name = $1',
      [name]
    );

    if (findResult.rows.length > 0) {
      return findResult.rows[0].id;
    }

    // Создать новый
    const insertResult = await client.query(
      'INSERT INTO districts (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id',
      [name]
    );

    return insertResult.rows[0].id;
  }

  /**
   * Получить или создать ЖК
   */
  private async getOrCreateComplex(
    client: any,
    name: string,
    address: string,
    districtId: number | null
  ): Promise<number> {
    // Попробовать найти
    const findResult = await client.query(
      'SELECT id FROM complexes WHERE name = $1 AND address = $2',
      [name, address]
    );

    if (findResult.rows.length > 0) {
      return findResult.rows[0].id;
    }

    // Создать новый
    const insertResult = await client.query(
      `INSERT INTO complexes (name, address, district_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (name, address) DO UPDATE SET name = $1
       RETURNING id`,
      [name, address, districtId]
    );

    return insertResult.rows[0].id;
  }

  /**
   * Upsert offer
   */
  private async upsertOffer(
    client: any,
    offer: ParsedOffer,
    districtId: number | null,
    complexId: number | null
  ): Promise<number> {
    const metroName = offer.metro && offer.metro.length > 0 ? offer.metro[0].name : null;
    const metroTime = offer.metro && offer.metro.length > 0 ? offer.metro[0].time_on_foot : null;

    const result = await client.query(
      `INSERT INTO offers (
        external_id,
        complex_id,
        district_id,
        offer_type,
        property_type,
        category,
        rooms,
        is_studio,
        floor,
        floors_total,
        area_total,
        area_living,
        area_kitchen,
        ceiling_height,
        price,
        renovation,
        balcony,
        bathroom_unit,
        building_name,
        building_type,
        building_state,
        built_year,
        ready_quarter,
        address,
        latitude,
        longitude,
        metro_name,
        metro_time_on_foot,
        agent_phone,
        agent_email,
        agent_organization,
        description,
        is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33
      )
      ON CONFLICT (external_id) DO UPDATE SET
        complex_id = EXCLUDED.complex_id,
        district_id = EXCLUDED.district_id,
        offer_type = EXCLUDED.offer_type,
        property_type = EXCLUDED.property_type,
        category = EXCLUDED.category,
        rooms = EXCLUDED.rooms,
        is_studio = EXCLUDED.is_studio,
        floor = EXCLUDED.floor,
        floors_total = EXCLUDED.floors_total,
        area_total = EXCLUDED.area_total,
        area_living = EXCLUDED.area_living,
        area_kitchen = EXCLUDED.area_kitchen,
        ceiling_height = EXCLUDED.ceiling_height,
        price = EXCLUDED.price,
        renovation = EXCLUDED.renovation,
        balcony = EXCLUDED.balcony,
        bathroom_unit = EXCLUDED.bathroom_unit,
        building_name = EXCLUDED.building_name,
        building_type = EXCLUDED.building_type,
        building_state = EXCLUDED.building_state,
        built_year = EXCLUDED.built_year,
        ready_quarter = EXCLUDED.ready_quarter,
        address = EXCLUDED.address,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        metro_name = EXCLUDED.metro_name,
        metro_time_on_foot = EXCLUDED.metro_time_on_foot,
        agent_phone = EXCLUDED.agent_phone,
        agent_email = EXCLUDED.agent_email,
        agent_organization = EXCLUDED.agent_organization,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [
        offer.external_id,
        complexId,
        districtId,
        offer.type,
        offer.property_type,
        offer.category,
        offer.rooms,
        offer.studio,
        offer.floor,
        offer.floors_total,
        offer.area_total,
        offer.area_living,
        offer.area_kitchen,
        offer.ceiling_height,
        offer.price,
        offer.renovation,
        offer.balcony,
        offer.bathroom_unit,
        offer.building_name,
        offer.building_type,
        offer.building_state,
        offer.built_year,
        offer.ready_quarter,
        offer.address,
        offer.latitude,
        offer.longitude,
        metroName,
        metroTime,
        offer.sales_agent?.phone,
        offer.sales_agent?.email,
        offer.sales_agent?.organization,
        offer.description,
        true
      ]
    );

    return result.rows[0].id;
  }

  /**
   * Импортировать изображения
   */
  private async importImages(
    client: any,
    offerId: number,
    images: { url: string; tag: string | null }[]
  ): Promise<void> {
    // Удалить старые изображения
    await client.query('DELETE FROM images WHERE offer_id = $1', [offerId]);

    // Вставить новые
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      await client.query(
        `INSERT INTO images (offer_id, tag, url, display_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (offer_id, url) DO NOTHING`,
        [offerId, image.tag, image.url, i]
      );
    }
  }

  /**
   * Запустить миграцию БД
   */
  async runMigration(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    const migrationPath = path.join(__dirname, '../../../database/migrations/001_init.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    await pool.query(sql);
    console.log('✅ Migration completed');
  }
}
