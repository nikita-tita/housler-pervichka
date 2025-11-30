import * as path from 'path';
import { importService } from '../services/import.service';

async function runImport() {
  const feedPath = path.join(__dirname, '../../../feeds/spb.xml');

  console.log('Starting import...');
  console.log('Feed path:', feedPath);

  try {
    const result = await importService.importFeed(feedPath);

    console.log('\n=== IMPORT RESULTS ===');
    console.log('Total in feed:', result.totalInFeed);
    console.log('Created:', result.created);
    console.log('Updated:', result.updated);
    console.log('Deleted:', result.deleted);
    console.log('Errors:', result.errors);
    console.log('Duration:', result.durationMs, 'ms');
    console.log(
      'Rate:',
      Math.round(result.totalInFeed / (result.durationMs / 1000)),
      'offers/sec'
    );
  } catch (error) {
    console.error('Import error:', error);
    process.exit(1);
  }

  process.exit(0);
}

runImport();
