#!/usr/bin/env ts-node
/**
 * CLI для импорта XML фида в базу данных
 *
 * Использование:
 *   npx ts-node src/cli/import-feed.ts --file=./data/spb.xml
 *   npx ts-node src/cli/import-feed.ts --file=./data/spb.xml --migrate
 *   npx ts-node src/cli/import-feed.ts --migrate-only
 */

import { YandexFeedParser } from '../parsers/yandex-feed.parser';
import { ImportService } from '../services/import.service';
import { testConnection, pool } from '../config/database';

interface CliArgs {
  file?: string;
  migrate?: boolean;
  migrateOnly?: boolean;
  limit?: number;
  help?: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {};

  for (const arg of process.argv.slice(2)) {
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--migrate') {
      args.migrate = true;
    } else if (arg === '--migrate-only') {
      args.migrateOnly = true;
    } else if (arg.startsWith('--file=')) {
      args.file = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      args.limit = parseInt(arg.split('=')[1]);
    }
  }

  return args;
}

function printHelp(): void {
  console.log(`
📦 Import Feed CLI

Использование:
  npx ts-node src/cli/import-feed.ts [опции]

Опции:
  --file=<path>     Путь к XML файлу фида
  --migrate         Запустить миграции перед импортом
  --migrate-only    Только запустить миграции (без импорта)
  --limit=<n>       Импортировать только первые N записей
  --help, -h        Показать эту справку

Примеры:
  npx ts-node src/cli/import-feed.ts --migrate-only
  npx ts-node src/cli/import-feed.ts --file=./feeds/spb.xml --migrate
  npx ts-node src/cli/import-feed.ts --file=./feeds/spb.xml --limit=100
`);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU');
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  console.log('🚀 Import Feed CLI\n');

  // Проверка подключения к БД
  console.log('📡 Проверка подключения к БД...');
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Не удалось подключиться к базе данных');
    process.exit(1);
  }
  console.log('✅ Подключение к БД успешно\n');

  const importService = new ImportService();

  // Миграции
  if (args.migrate || args.migrateOnly) {
    console.log('🔧 Запуск миграций...');
    try {
      await importService.runMigration();
      console.log('✅ Миграции выполнены\n');
    } catch (error) {
      console.error('❌ Ошибка миграции:', error);
      process.exit(1);
    }

    if (args.migrateOnly) {
      await pool.end();
      process.exit(0);
    }
  }

  // Импорт
  if (!args.file) {
    console.error('❌ Укажите путь к файлу: --file=<path>');
    printHelp();
    process.exit(1);
  }

  // Проверка существования файла
  const fs = await import('fs');
  if (!fs.existsSync(args.file)) {
    console.error(`❌ Файл не найден: ${args.file}`);
    process.exit(1);
  }

  const stats = fs.statSync(args.file);
  console.log(`📄 Файл: ${args.file}`);
  console.log(`📏 Размер: ${(stats.size / 1024 / 1024).toFixed(1)} MB\n`);

  // Парсинг XML
  console.log('🔍 Парсинг XML...');
  const parser = new YandexFeedParser();
  const startParse = Date.now();

  let parseResult;
  try {
    parseResult = await parser.parse(args.file);
  } catch (error) {
    console.error('❌ Ошибка парсинга:', error);
    process.exit(1);
  }

  console.log(`✅ Парсинг завершён за ${formatDuration(Date.now() - startParse)}`);
  console.log(`   📊 Найдено объявлений: ${formatNumber(parseResult.offers.length)}`);
  if (parseResult.errors.length > 0) {
    console.log(`   ⚠️  Ошибок парсинга: ${parseResult.errors.length}`);
  }
  console.log('');

  // Ограничение количества
  let offersToImport = parseResult.offers;
  if (args.limit && args.limit < offersToImport.length) {
    offersToImport = offersToImport.slice(0, args.limit);
    console.log(`🔢 Ограничено до ${formatNumber(args.limit)} записей\n`);
  }

  // Импорт в БД
  console.log('💾 Импорт в базу данных...');
  const startImport = Date.now();
  let lastProgress = 0;

  const importResult = await importService.importOffers(offersToImport, (current, total) => {
    const percent = Math.floor((current / total) * 100);
    if (percent >= lastProgress + 10) {
      const elapsed = Date.now() - startImport;
      const eta = (elapsed / current) * (total - current);
      process.stdout.write(`\r   📦 Прогресс: ${percent}% (${formatNumber(current)}/${formatNumber(total)}) | ETA: ${formatDuration(eta)}   `);
      lastProgress = percent;
    }
  });

  console.log('\n');
  console.log(`✅ Импорт завершён за ${formatDuration(Date.now() - startImport)}`);
  console.log('');
  console.log('📊 Результаты:');
  console.log(`   ✅ Импортировано: ${formatNumber(importResult.imported)}`);
  console.log(`   🔄 Обновлено: ${formatNumber(importResult.updated)}`);
  console.log(`   ❌ Ошибок: ${formatNumber(importResult.failed)}`);

  if (importResult.errors.length > 0 && importResult.errors.length <= 10) {
    console.log('\n⚠️  Ошибки:');
    importResult.errors.forEach(err => console.log(`   - ${err}`));
  } else if (importResult.errors.length > 10) {
    console.log(`\n⚠️  Показаны первые 10 из ${importResult.errors.length} ошибок:`);
    importResult.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
  }

  // Статистика из БД
  console.log('\n📈 Статистика БД:');
  try {
    const offersCount = await pool.query('SELECT COUNT(*) FROM offers WHERE is_active = true');
    const complexesCount = await pool.query('SELECT COUNT(*) FROM complexes');
    const districtsCount = await pool.query('SELECT COUNT(*) FROM districts');
    const imagesCount = await pool.query('SELECT COUNT(*) FROM images');

    console.log(`   🏠 Активных объявлений: ${formatNumber(parseInt(offersCount.rows[0].count))}`);
    console.log(`   🏢 Жилых комплексов: ${formatNumber(parseInt(complexesCount.rows[0].count))}`);
    console.log(`   📍 Районов: ${formatNumber(parseInt(districtsCount.rows[0].count))}`);
    console.log(`   🖼️  Изображений: ${formatNumber(parseInt(imagesCount.rows[0].count))}`);
  } catch (error) {
    console.log('   ⚠️  Не удалось получить статистику');
  }

  await pool.end();
  console.log('\n✨ Готово!\n');
}

main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
