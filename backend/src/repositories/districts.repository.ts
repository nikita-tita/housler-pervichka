import { BaseRepository } from './base.repository';
import { District } from '../types/models';
import db from '../config/database';

class DistrictsRepository extends BaseRepository<District> {
  constructor() {
    super('districts');
  }

  async findByRegion(region: string): Promise<District[]> {
    const result = await db.query('SELECT * FROM districts WHERE region = $1 ORDER BY name', [
      region,
    ]);
    return result.rows;
  }

  async findByName(name: string): Promise<District | null> {
    const result = await db.query('SELECT * FROM districts WHERE name = $1', [name]);
    return result.rows[0] || null;
  }
}

export const districtsRepository = new DistrictsRepository();
