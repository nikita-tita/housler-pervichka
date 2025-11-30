import { pool } from '../config/database';
import crypto from 'crypto';

export interface Selection {
  id: number;
  name: string;
  agent_id: number;
  client_email: string | null;
  client_name: string | null;
  share_code: string | null;
  is_public: boolean;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface SelectionItem {
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
  comment: string | null;
  added_at: string;
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
    isPublic?: boolean;
  }): Promise<Selection> {
    const shareCode = this.generateShareCode();

    const result = await pool.query(`
      INSERT INTO selections (name, agent_id, client_email, client_name, share_code, is_public)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, agent_id, client_email, client_name, share_code, is_public, created_at, updated_at
    `, [
      data.name,
      agentId,
      data.clientEmail || null,
      data.clientName || null,
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
        si.comment,
        si.created_at as added_at
      FROM selection_items si
      JOIN offers o ON si.offer_id = o.id
      LEFT JOIN districts d ON o.district_id = d.id
      WHERE si.selection_id = $1 AND o.is_active = true
      ORDER BY si.display_order, si.created_at
    `, [selectionId]);

    return result.rows;
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
      console.error('Error adding selection item:', error);
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
}
