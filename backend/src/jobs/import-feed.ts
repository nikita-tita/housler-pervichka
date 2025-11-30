/**
 * CLI скрипт для импорта XML-фида
 * Запуск: npx ts-node src/jobs/import-feed.ts [путь_к_файлу]
 */

import dotenv from 'dotenv';
dotenv.config();

import { importService } from '../services/import.service';

async function main() {
  const filePath = process.argv[2] || '/app/feeds/spb.xml';

  console.log('='.repeat(50));
  console.log('ИМПОРТ XML-ФИДА');
  console.log('='.repeat(50));
  console.log(`Файл: ${filePath}`);
  console.log('');

  try {
    const result = await importService.importFeed(filePath);

    console.log('');
    console.log('='.repeat(50));
    console.log('РЕЗУЛЬТАТ ИМПОРТА');
    console.log('='.repeat(50));
    console.log(`Всего в фиде: ${result.totalInFeed}`);
    console.log(`Создано: ${result.created}`);
    console.log(`Обновлено: ${result.updated}`);
    console.log(`Удалено: ${result.deleted}`);
    console.log(`Ошибок: ${result.errors}`);
    console.log(`Время: ${(result.durationMs / 1000).toFixed(2)} сек`);
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('Ошибка импорта:', error);
    process.exit(1);
  }
}

main();
