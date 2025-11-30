import { BaseRepository } from './base.repository';
import { MetroStation } from '../types/models';
import db from '../config/database';

class MetroRepository extends BaseRepository<MetroStation> {
  constructor() {
    super('metro_stations');
  }

  async findByLine(line: string): Promise<MetroStation[]> {
    const result = await db.query('SELECT * FROM metro_stations WHERE line = $1 ORDER BY name', [
      line,
    ]);
    return result.rows;
  }

  async findByName(name: string): Promise<MetroStation | null> {
    const result = await db.query('SELECT * FROM metro_stations WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  async findAllGroupedByLine(): Promise<Record<string, MetroStation[]>> {
    const result = await db.query('SELECT * FROM metro_stations ORDER BY line, name');
    const grouped: Record<string, MetroStation[]> = {};
    for (const station of result.rows) {
      const line = station.line || 'Без линии';
      if (!grouped[line]) {
        grouped[line] = [];
      }
      grouped[line].push(station);
    }
    return grouped;
  }
}

export const metroRepository = new MetroRepository();
