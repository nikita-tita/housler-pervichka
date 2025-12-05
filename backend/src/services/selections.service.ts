import { pool } from '../config/database';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import type { SelectionGuestContext } from '../types/models';

export interface Selection {
  id: number;
  name: string;
  agent_id: number;
  client_email: string | null;
  client_name: string | null;
  client_id: number | null;
  share_code: string | null;
  is_public: boolean;
  items_count: number;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SelectionItemOffer {
  id: number;
  rooms: number | null;
  is_studio: boolean;
  floor: number | null;
  floors_total: number | null;
  area_total: number | null;
  price: number | null;
  price_per_sqm: number | null;
  complex_name: string | null;
  district_name: string | null;
  metro_station: string | null;
  image_url: string | null;
  building_name: string | null;
  is_active: boolean;
}

export interface SelectionItem {
  id: number;
  offer_id: number;
  comment: string | null;
  added_by: string | null;
  status: string;
  added_at: string;
  // Плоские поля
  external_id: string | null;
  rooms: number | null;
  is_studio: boolean;
  floor: number | null;
  floors_total: number | null;
  area_total: number | null;
  price: number | null;
  price_per_sqm: number | null;
  address: string | null;
  district: string | null;
  metro_name: string | null;
  building_name: string | null;
  main_image: string | null;
  complex_name: string | null;
  // Вложенный объект offer
  offer: SelectionItemOffer | null;
}

export interface SelectionDetail extends Selection {
  items: SelectionItem[];
}

export class SelectionsService {
  /**
   * Генерация уникального кода для шаринга
   */
  private generateShareCode(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Получить подборки агента
   */
  async getAgentSelections(agentId: number): Promise<Selection[]> {
    const result = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.agent_id,
        s.client_email,
        s.client_name,
        s.share_code,
        s.is_public,
        s.view_count,
        s.last_viewed_at,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(*) FROM selection_items WHERE selection_id = s.id)::int as items_count
      FROM selections s
      WHERE s.agent_id = $1
      ORDER BY s.updated_at DESC
    `, [agentId]);

    return result.rows;
  }

  /**
   * Создать подборку
   */
  async createSelection(agentId: number, data: {
    name: string;
    clientEmail?: string;
    clientName?: string;
    clientId?: number;
    isPublic?: boolean;
  }): Promise<Selection> {
    const shareCode = this.generateShareCode();

    // Если передан clientId, проверяем что клиент принадлежит агенту
    if (data.clientId) {
      const clientCheck = await pool.query(
        'SELECT id, name, email FROM clients WHERE id = $1 AND agent_id = $2',
        [data.clientId, agentId]
      );
      if (clientCheck.rows.length === 0) {
        throw new Error('Клиент не найден');
      }
      // Если clientName/clientEmail не переданы, берём из клиента
      if (!data.clientName && clientCheck.rows[0].name) {
        data.clientName = clientCheck.rows[0].name;
      }
      if (!data.clientEmail && clientCheck.rows[0].email) {
        data.clientEmail = clientCheck.rows[0].email;
      }
    }

    const result = await pool.query(`
      INSERT INTO selections (name, agent_id, client_email, client_name, client_id, share_code, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, agent_id, client_email, client_name, client_id, share_code, is_public, created_at, updated_at
    `, [
      data.name,
      agentId,
      data.clientEmail || null,
      data.clientName || null,
      data.clientId || null,
      shareCode,
      data.isPublic ?? false
    ]);

    return { ...result.rows[0], items_count: 0 };
  }

  /**
   * Получить подборку по ID (для агента)
   */
  async getSelectionById(selectionId: number, agentId: number): Promise<SelectionDetail | null> {
    const selectionResult = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.agent_id,
        s.client_email,
        s.client_name,
        s.share_code,
        s.is_public,
        s.view_count,
        s.last_viewed_at,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(*) FROM selection_items WHERE selection_id = s.id)::int as items_count
      FROM selections s
      WHERE s.id = $1 AND s.agent_id = $2
    `, [selectionId, agentId]);

    if (selectionResult.rows.length === 0) {
      return null;
    }

    const selection = selectionResult.rows[0];
    const items = await this.getSelectionItems(selectionId);

    return { ...selection, items };
  }

  /**
   * Получить подборку по share_code (публичный доступ)
   */
  async getSelectionByShareCode(shareCode: string): Promise<SelectionDetail | null> {
    const selectionResult = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.agent_id,
        s.client_email,
        s.client_name,
        s.share_code,
        s.is_public,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(*) FROM selection_items WHERE selection_id = s.id)::int as items_count
      FROM selections s
      WHERE s.share_code = $1
    `, [shareCode]);

    if (selectionResult.rows.length === 0) {
      return null;
    }

    const selection = selectionResult.rows[0];
    const items = await this.getSelectionItems(selection.id);

    return { ...selection, items };
  }

  /**
   * Получить элементы подборки
   */
  private async getSelectionItems(selectionId: number): Promise<SelectionItem[]> {
    const result = await pool.query(`
      SELECT
        si.id,
        si.offer_id,
        si.comment,
        si.added_by,
        COALESCE(si.status, 'pending') as status,
        si.created_at as added_at,
        o.external_id,
        o.rooms,
        o.is_studio,
        o.floor,
        o.floors_total,
        o.area_total::float as area_total,
        o.price::float as price,
        o.price_per_sqm::float as price_per_sqm,
        o.address,
        o.metro_name,
        o.building_name,
        o.is_active as offer_is_active,
        d.name as district,
        c.name as complex_name,
        (
          SELECT url FROM images
          WHERE offer_id = o.id AND (tag = 'housemain' OR tag IS NULL)
          ORDER BY display_order LIMIT 1
        ) as main_image
      FROM selection_items si
      LEFT JOIN offers o ON si.offer_id = o.id
      LEFT JOIN districts d ON o.district_id = d.id
      LEFT JOIN complexes c ON o.complex_id = c.id
      WHERE si.selection_id = $1
      ORDER BY si.display_order, si.created_at
    `, [selectionId]);

    // Возвращаем как плоскую структуру, так и вложенный offer для совместимости с фронтендом
    return result.rows.map(row => ({
      id: row.id,
      offer_id: row.offer_id,
      comment: row.comment,
      added_by: row.added_by,
      status: row.status,
      added_at: row.added_at,
      // Плоские поля (для публичной страницы /s/[code])
      external_id: row.external_id,
      rooms: row.rooms,
      is_studio: row.is_studio,
      floor: row.floor,
      floors_total: row.floors_total,
      area_total: row.area_total,
      price: row.price,
      price_per_sqm: row.price_per_sqm,
      address: row.address,
      district: row.district,
      metro_name: row.metro_name,
      building_name: row.building_name,
      main_image: row.main_image,
      complex_name: row.complex_name,
      // Вложенный offer объект (для страницы агента /selections/[id])
      offer: row.offer_id && row.price !== null ? {
        id: row.offer_id,
        rooms: row.rooms,
        is_studio: row.is_studio,
        floor: row.floor,
        floors_total: row.floors_total,
        area_total: row.area_total,
        price: row.price,
        price_per_sqm: row.price_per_sqm,
        complex_name: row.complex_name || row.building_name,
        district_name: row.district,
        metro_station: row.metro_name,
        image_url: row.main_image,
        building_name: row.building_name,
        is_active: row.offer_is_active
      } : null
    }));
  }

  /**
   * Добавить объект в подборку
   */
  async addItem(selectionId: number, agentId: number, offerId: number, comment?: string): Promise<boolean> {
    // Проверяем, что подборка принадлежит агенту
    const ownerCheck = await pool.query(
      'SELECT id FROM selections WHERE id = $1 AND agent_id = $2',
      [selectionId, agentId]
    );

    if (ownerCheck.rows.length === 0) {
      return false;
    }

    // Проверяем существование объявления
    const offerExists = await pool.query(
      'SELECT id FROM offers WHERE id = $1 AND is_active = true',
      [offerId]
    );

    if (offerExists.rows.length === 0) {
      return false;
    }

    try {
      // Получаем максимальный order
      const maxOrder = await pool.query(
        'SELECT COALESCE(MAX(display_order), 0) as max_order FROM selection_items WHERE selection_id = $1',
        [selectionId]
      );

      await pool.query(`
        INSERT INTO selection_items (selection_id, offer_id, comment, display_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (selection_id, offer_id) DO UPDATE SET comment = $3
      `, [selectionId, offerId, comment || null, maxOrder.rows[0].max_order + 1]);

      // Обновляем updated_at подборки
      await pool.query(
        'UPDATE selections SET updated_at = NOW() WHERE id = $1',
        [selectionId]
      );

      return true;
    } catch (error) {
      logger.error('Error adding selection item', { error: (error as Error).message, selectionId, offerId });
      return false;
    }
  }

  /**
   * Удалить объект из подборки
   */
  async removeItem(selectionId: number, agentId: number, offerId: number): Promise<boolean> {
    // Проверяем владельца
    const ownerCheck = await pool.query(
      'SELECT id FROM selections WHERE id = $1 AND agent_id = $2',
      [selectionId, agentId]
    );

    if (ownerCheck.rows.length === 0) {
      return false;
    }

    const result = await pool.query(`
      DELETE FROM selection_items
      WHERE selection_id = $1 AND offer_id = $2
    `, [selectionId, offerId]);

    if ((result.rowCount || 0) > 0) {
      // Обновляем updated_at подборки
      await pool.query(
        'UPDATE selections SET updated_at = NOW() WHERE id = $1',
        [selectionId]
      );
    }

    return (result.rowCount || 0) > 0;
  }

  /**
   * Обновить подборку
   */
  async updateSelection(selectionId: number, agentId: number, data: {
    name?: string;
    clientEmail?: string;
    clientName?: string;
    isPublic?: boolean;
  }): Promise<Selection | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(data.name);
      paramIndex++;
    }

    if (data.clientEmail !== undefined) {
      updates.push(`client_email = $${paramIndex}`);
      params.push(data.clientEmail || null);
      paramIndex++;
    }

    if (data.clientName !== undefined) {
      updates.push(`client_name = $${paramIndex}`);
      params.push(data.clientName || null);
      paramIndex++;
    }

    if (data.isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex}`);
      params.push(data.isPublic);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.getSelectionById(selectionId, agentId);
    }

    params.push(selectionId, agentId);

    const result = await pool.query(`
      UPDATE selections
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND agent_id = $${paramIndex + 1}
      RETURNING id, name, agent_id, client_email, client_name, share_code, is_public, created_at, updated_at
    `, params);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      items_count: 0 // будет загружено отдельно при необходимости
    };
  }

  /**
   * Удалить подборку
   */
  async deleteSelection(selectionId: number, agentId: number): Promise<boolean> {
    const result = await pool.query(`
      DELETE FROM selections
      WHERE id = $1 AND agent_id = $2
    `, [selectionId, agentId]);

    return (result.rowCount || 0) > 0;
  }

  /**
   * Добавить объект в подборку КЛИЕНТОМ (по share_code)
   */
  async addItemByClient(shareCode: string, offerId: number, clientIdentifier: string, comment?: string): Promise<{ success: boolean; error?: string }> {
    // Лимит объектов добавленных клиентом в одну подборку
    const MAX_CLIENT_ITEMS = 50;

    // Находим подборку по share_code
    const selectionResult = await pool.query(
      'SELECT id FROM selections WHERE share_code = $1',
      [shareCode]
    );

    if (selectionResult.rows.length === 0) {
      return { success: false, error: 'Подборка не найдена' };
    }

    const selectionId = selectionResult.rows[0].id;

    // Проверяем существование объявления
    const offerExists = await pool.query(
      'SELECT id FROM offers WHERE id = $1 AND is_active = true',
      [offerId]
    );

    if (offerExists.rows.length === 0) {
      return { success: false, error: 'Объявление не найдено' };
    }

    // Проверяем лимит объектов добавленных клиентами
    const clientItemsCount = await pool.query(
      `SELECT COUNT(*) as count FROM selection_items WHERE selection_id = $1 AND added_by = 'client'`,
      [selectionId]
    );

    if (Number(clientItemsCount.rows[0].count) >= MAX_CLIENT_ITEMS) {
      return { success: false, error: `Достигнут лимит ${MAX_CLIENT_ITEMS} объектов в подборке` };
    }

    try {
      // Получаем максимальный order
      const maxOrder = await pool.query(
        'SELECT COALESCE(MAX(display_order), 0) as max_order FROM selection_items WHERE selection_id = $1',
        [selectionId]
      );

      // Добавляем объект с пометкой что добавил клиент
      await pool.query(`
        INSERT INTO selection_items (selection_id, offer_id, comment, display_order, added_by, client_identifier)
        VALUES ($1, $2, $3, $4, 'client', $5)
        ON CONFLICT (selection_id, offer_id) DO UPDATE SET
          comment = COALESCE(EXCLUDED.comment, selection_items.comment)
      `, [selectionId, offerId, comment || null, maxOrder.rows[0].max_order + 1, clientIdentifier]);

      // Логируем действие
      await this.logActivity(selectionId, 'item_added', offerId, 'client', clientIdentifier, { comment });

      // Обновляем updated_at подборки
      await pool.query(
        'UPDATE selections SET updated_at = NOW() WHERE id = $1',
        [selectionId]
      );

      return { success: true };
    } catch (error) {
      logger.error('Error adding selection item by client', { error: (error as Error).message, shareCode, offerId });
      return { success: false, error: 'Ошибка при добавлении объекта' };
    }
  }

  /**
   * Удалить объект из подборки КЛИЕНТОМ (только то что сам добавил)
   */
  async removeItemByClient(shareCode: string, offerId: number, clientIdentifier: string): Promise<{ success: boolean; error?: string }> {
    const selectionResult = await pool.query(
      'SELECT id FROM selections WHERE share_code = $1',
      [shareCode]
    );

    if (selectionResult.rows.length === 0) {
      return { success: false, error: 'Подборка не найдена' };
    }

    const selectionId = selectionResult.rows[0].id;

    // Удаляем только если клиент сам добавил
    const result = await pool.query(`
      DELETE FROM selection_items
      WHERE selection_id = $1 AND offer_id = $2 AND added_by = 'client' AND client_identifier = $3
    `, [selectionId, offerId, clientIdentifier]);

    if ((result.rowCount || 0) > 0) {
      await this.logActivity(selectionId, 'item_removed', offerId, 'client', clientIdentifier);
      await pool.query('UPDATE selections SET updated_at = NOW() WHERE id = $1', [selectionId]);
      return { success: true };
    }

    return { success: false, error: 'Объект не найден или вы не можете его удалить' };
  }

  /**
   * Логирование действия в подборке
   */
  private async logActivity(
    selectionId: number,
    action: string,
    offerId: number | null,
    actorType: 'agent' | 'client',
    actorIdentifier: string,
    metadata?: object
  ): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO selection_activity_log (selection_id, action, offer_id, actor_type, actor_identifier, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [selectionId, action, offerId, actorType, actorIdentifier, metadata ? JSON.stringify(metadata) : null]);
    } catch (error) {
      logger.error('Error logging selection activity', { error: (error as Error).message, selectionId });
      // Не бросаем ошибку, логирование не должно ломать основной функционал
    }
  }

  /**
   * Записать просмотр подборки
   */
  async recordView(shareCode: string, clientIdentifier: string): Promise<void> {
    try {
      const result = await pool.query(`
        UPDATE selections
        SET view_count = view_count + 1, last_viewed_at = NOW()
        WHERE share_code = $1
        RETURNING id
      `, [shareCode]);

      if (result.rows.length > 0) {
        await this.logActivity(result.rows[0].id, 'viewed', null, 'client', clientIdentifier);
      }
    } catch (error) {
      logger.error('Error recording view', { error: (error as Error).message, shareCode });
    }
  }

  /**
   * Получить лог действий подборки (для агента)
   */
  async getActivityLog(selectionId: number, agentId: number, limit = 50): Promise<any[]> {
    // Проверяем владельца
    const ownerCheck = await pool.query(
      'SELECT id FROM selections WHERE id = $1 AND agent_id = $2',
      [selectionId, agentId]
    );

    if (ownerCheck.rows.length === 0) {
      return [];
    }

    const result = await pool.query(`
      SELECT
        sal.id,
        sal.action,
        sal.offer_id,
        sal.actor_type,
        sal.metadata,
        sal.created_at,
        o.building_name as offer_name,
        o.rooms,
        o.price
      FROM selection_activity_log sal
      LEFT JOIN offers o ON sal.offer_id = o.id
      WHERE sal.selection_id = $1
      ORDER BY sal.created_at DESC
      LIMIT $2
    `, [selectionId, limit]);

    return result.rows;
  }

  /**
   * Получить подборки для клиента по его email
   * (подборки, где client_email совпадает с email пользователя)
   */
  async getClientSelections(clientEmail: string): Promise<Selection[]> {
    const result = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.agent_id,
        s.client_email,
        s.client_name,
        s.share_code,
        s.is_public,
        s.view_count,
        s.last_viewed_at,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(*) FROM selection_items WHERE selection_id = s.id)::int as items_count,
        u.name as agent_name
      FROM selections s
      LEFT JOIN users u ON s.agent_id = u.id
      WHERE LOWER(s.client_email) = LOWER($1)
      ORDER BY s.updated_at DESC
    `, [clientEmail]);

    return result.rows;
  }

  /**
   * Получить контекст подборки для гостя (информация об агенте и агентстве)
   * Используется для отображения брендинга в гостевом режиме
   */
  async getSelectionGuestContext(shareCode: string): Promise<SelectionGuestContext | null> {
    const result = await pool.query(`
      SELECT
        s.id as selection_id,
        s.name as selection_name,
        s.share_code,
        (SELECT COUNT(*) FROM selection_items WHERE selection_id = s.id)::int as items_count,
        u.id as agent_id,
        u.name as agent_name,
        u.phone as agent_phone,
        u.email as agent_email,
        a.id as agency_id,
        a.name as agency_name,
        a.slug as agency_slug,
        a.logo_url as agency_logo,
        a.phone as agency_phone,
        a.email as agency_email
      FROM selections s
      JOIN users u ON s.agent_id = u.id
      LEFT JOIN agencies a ON u.agency_id = a.id
      WHERE s.share_code = $1
    `, [shareCode]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      selection: {
        id: row.selection_id,
        name: row.selection_name,
        share_code: row.share_code,
        items_count: row.items_count
      },
      agent: {
        id: row.agent_id,
        name: row.agent_name,
        phone: row.agent_phone,
        email: row.agent_email
      },
      agency: row.agency_id ? {
        id: row.agency_id,
        name: row.agency_name,
        slug: row.agency_slug,
        logo_url: row.agency_logo,
        phone: row.agency_phone,
        email: row.agency_email
      } : null
    };
  }
}
