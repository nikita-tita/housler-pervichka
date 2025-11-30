import { feedParser } from './yandex-feed.parser';
import * as path from 'path';

async function testParser() {
  const feedPath = path.join(__dirname, '../../../feeds/spb.xml');

  console.log('Starting parser test...');
  console.log('Feed path:', feedPath);

  try {
    const result = await feedParser.parse(feedPath);

    console.log('\n=== PARSE RESULTS ===');
    console.log('Total offers parsed:', result.totalParsed);
    console.log('Errors:', result.errors.length);
    console.log('Duration:', result.durationMs, 'ms');

    if (result.offers.length > 0) {
      console.log('\n=== SAMPLE OFFER ===');
      const sample = result.offers[0];
      console.log('ID:', sample.externalId);
      console.log('Building:', sample.buildingName);
      console.log('Rooms:', sample.rooms, sample.isStudio ? '(studio)' : '');
      console.log('Area:', sample.areaTotal, 'm²');
      console.log('Living:', sample.areaLiving, 'm²');
      console.log('Kitchen:', sample.areaKitchen, 'm²');
      console.log('Floor:', sample.floor, '/', sample.floorsTotal);
      console.log('Price:', sample.price.toLocaleString(), 'RUB');
      console.log('Price/m²:', Math.round(sample.price / sample.areaTotal).toLocaleString());
      console.log('District:', sample.district);
      console.log(
        'Metro:',
        sample.metroName,
        sample.metroTimeOnFoot ? `(${sample.metroTimeOnFoot} min)` : ''
      );
      console.log('Images:', sample.images.length);
      console.log('Renovation:', sample.renovation);
    }

    if (result.errors.length > 0) {
      console.log('\n=== FIRST 10 ERRORS ===');
      result.errors.slice(0, 10).forEach((err) => {
        console.log(`- [${err.offerId || 'unknown'}] ${err.field}: ${err.message}`);
      });
    }

    // Статистика
    console.log('\n=== STATISTICS ===');
    const rooms = result.offers.reduce(
      (acc, o) => {
        acc[o.rooms] = (acc[o.rooms] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );
    console.log('By rooms:', rooms);

    const withPlan = result.offers.filter((o) => o.images.some((img) => img.tag === 'plan')).length;
    console.log(
      'With floor plan:',
      withPlan,
      `(${Math.round((withPlan / result.totalParsed) * 100)}%)`
    );
  } catch (error) {
    console.error('Parser error:', error);
  }
}

testParser();
