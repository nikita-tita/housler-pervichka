import { pool } from '../config/database';

export interface FavoriteOffer {
  id: number;
  offer_id: number;
  external_id: string;
  rooms: number;
  is_studio: boolean;
  floor: number;
  floors_total: number;
  area_total: number;
  price: number;
  price_per_sqm: number;
  address: string;
  district: string | null;
  metro_name: string | null;
  building_name: string | null;
  main_image: string | null;
  added_at: string;
}

export class FavoritesService {
  /**
   * Получить список избранного пользователя
   */
  async getUserFavorites(userId: number): Promise<FavoriteOffer[]> {
    const result = await pool.query(`
      SELECT
        f.id,
        f.offer_id,
        o.external_id,
        o.rooms,
        o.is_studio,
        o.floor,
        o.floors_total,
        o.area_total,
        o.price,
        o.price_per_sqm,
        o.address,
        d.name as district,
        o.metro_name,
        o.building_name,
        (
          SELECT url FROM images
          WHERE offer_id = o.id AND (tag = 'housemain' OR tag IS NULL)
          ORDER BY display_order LIMIT 1
        ) as main_image,
        f.created_at as added_at
      FROM favorites f
      JOIN offers o ON f.offer_id = o.id
      LEFT JOIN districts d ON o.district_id = d.id
      WHERE f.user_id = $1 AND o.is_active = true
      ORDER BY f.created_at DESC
    `, [userId]);

    return result.rows;
  }

  /**
   * Добавить в избранное
   */
  async addFavorite(userId: number, offerId: number): Promise<{ success: boolean; id?: number }> {
    // Проверяем существование объявления
    const offerExists = await pool.query(
      'SELECT id FROM offers WHERE id = $1 AND is_active = true',
      [offerId]
    );

    if (offerExists.rows.length === 0) {
      return { success: false };
    }

    try {
      const result = await pool.query(`
        INSERT INTO favorites (user_id, offer_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, offer_id) DO UPDATE SET created_at = favorites.created_at
        RETURNING id
      `, [userId, offerId]);

      return { success: true, id: result.rows[0].id };
    } catch (error) {
      console.error('Error adding favorite:', error);
      return { success: false };
    }
  }

  /**
   * Удалить из избранного
   */
  async removeFavorite(userId: number, offerId: number): Promise<boolean> {
    const result = await pool.query(`
      DELETE FROM favorites
      WHERE user_id = $1 AND offer_id = $2
    `, [userId, offerId]);

    return (result.rowCount || 0) > 0;
  }

  /**
   * Проверить, в избранном ли объявление
   */
  async isFavorite(userId: number, offerId: number): Promise<boolean> {
    const result = await pool.query(`
      SELECT id FROM favorites
      WHERE user_id = $1 AND offer_id = $2
    `, [userId, offerId]);

    return result.rows.length > 0;
  }

  /**
   * Получить ID избранных объявлений (для быстрой проверки на фронте)
   */
  async getFavoriteIds(userId: number): Promise<number[]> {
    const result = await pool.query(`
      SELECT offer_id FROM favorites WHERE user_id = $1
    `, [userId]);

    return result.rows.map(row => row.offer_id);
  }
}
