import { AuthService } from '../services/auth.service';
import { pool } from '../config/database';
import jwt from 'jsonwebtoken';

// Типизация для мока
const mockPool = pool as jest.Mocked<typeof pool>;

// Мокаем jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked-jwt-token'),
  verify: jest.fn(() => ({ userId: 1, email: 'test@test.ru', role: 'client' }))
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
  });

  describe('requestCode', () => {
    it('should generate and save auth code', async () => {
      // Нет существующего кода
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // проверка существующего
        .mockResolvedValueOnce({ rows: [] }); // insert

      const result = await service.requestCode('test@test.ru');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Код отправлен на email');
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should normalize email to lowercase', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await service.requestCode('TEST@TEST.RU');

      // Проверяем что email нормализован
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['test@test.ru']
      );
    });

    it('should reject if code already sent recently', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1 }] // существующий код
      });

      const result = await service.requestCode('test@test.ru');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Подождите минуту');
    });
  });

  describe('verifyCode', () => {
    it('should verify valid code and return JWT', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.ru',
        phone: '+79111234567',
        name: 'Тест',
        role: 'client',
        agency_id: null,
        is_active: true,
        last_login_at: null,
        created_at: '2024-01-01T00:00:00Z'
      };

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1, attempts: 0 }] }) // valid code
        .mockResolvedValueOnce({ rows: [] }) // mark as used
        .mockResolvedValueOnce({ rows: [mockUser] }) // find user
        .mockResolvedValueOnce({ rows: [] }); // update last_login

      const result = await service.verifyCode('test@test.ru', '123456');

      expect(result.success).toBe(true);
      expect(result.token).toBe('mocked-jwt-token');
      expect(result.user?.email).toBe('test@test.ru');
    });

    it('should create new user if not exists', async () => {
      const newUser = {
        id: 2,
        email: 'new@test.ru',
        phone: null,
        name: null,
        role: 'client',
        agency_id: null,
        is_active: true,
        last_login_at: null,
        created_at: '2024-12-02T00:00:00Z'
      };

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1, attempts: 0 }] }) // valid code
        .mockResolvedValueOnce({ rows: [] }) // mark as used
        .mockResolvedValueOnce({ rows: [] }) // user not found
        .mockResolvedValueOnce({ rows: [newUser] }) // create user
        .mockResolvedValueOnce({ rows: [] }); // update last_login

      const result = await service.verifyCode('new@test.ru', '123456');

      expect(result.success).toBe(true);
      expect(result.user?.id).toBe(2);
    });

    it('should reject invalid code', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // no valid code

      const result = await service.verifyCode('test@test.ru', '000000');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Неверный или истёкший код');
    });

    it('should increment attempts on wrong code', async () => {
      // Первый запрос - код не найден (неверный)
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // wrong code
        .mockResolvedValueOnce({ rows: [] }); // increment attempts

      const result = await service.verifyCode('test@test.ru', 'wrong');

      expect(result.success).toBe(false);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', async () => {
      const mockPayload = {
        userId: 1,
        email: 'test@test.ru',
        role: 'client',
        agencyId: null
      };

      (jwt.verify as jest.Mock).mockReturnValueOnce(mockPayload);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
    });

    it('should return null for invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('invalid token');
      });

      const result = await service.verifyToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.ru',
        phone: '+79111234567',
        name: 'Тест',
        role: 'agent',
        agency_id: 1,
        is_active: true,
        last_login_at: '2024-12-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z'
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

      const result = await service.findUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        [1]
      );
    });

    it('should return null if user not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.findUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user profile', async () => {
      const updatedUser = {
        id: 1,
        email: 'test@test.ru',
        phone: '+79999999999',
        name: 'Новое имя',
        role: 'client',
        agency_id: null,
        is_active: true
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [updatedUser] });

      const result = await service.updateUser(1, {
        name: 'Новое имя',
        phone: '+79999999999'
      });

      expect(result?.name).toBe('Новое имя');
      expect(result?.phone).toBe('+79999999999');
    });

    it('should return null if user not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.updateUser(999, { name: 'Test' });

      expect(result).toBeNull();
    });
  });
});
