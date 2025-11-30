import db from '../config/database';

export class BaseRepository<T> {
  constructor(protected tableName: string) {}

  async findById(id: number | string): Promise<T | null> {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll(limit = 100, offset = 0): Promise<T[]> {
    const result = await db.query(
      `SELECT * FROM ${this.tableName} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async count(where?: string, params?: unknown[]): Promise<number> {
    const whereClause = where ? `WHERE ${where}` : '';
    const result = await db.query(
      `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`,
      params
    );
    return parseInt(result.rows[0].count, 10);
  }
}
