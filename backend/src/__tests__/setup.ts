import dotenv from 'dotenv';

// Загружаем переменные окружения для тестов
dotenv.config({ path: '.env.test' });

// Устанавливаем обязательные переменные для тестов
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests';

// Мокаем pool для тестов без реальной БД
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  }
}));

// Мокаем logger чтобы не спамить в консоль
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Очистка моков после каждого теста
afterEach(() => {
  jest.clearAllMocks();
});
