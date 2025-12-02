import { SelectionsService } from '../services/selections.service';
import { pool } from '../config/database';

// Типизация для мока
const mockPool = pool as jest.Mocked<typeof pool>;

describe('SelectionsService', () => {
  let service: SelectionsService;

  beforeEach(() => {
    service = new SelectionsService();
    jest.clearAllMocks();
  });

  describe('getAgentSelections', () => {
    it('should return selections for agent', async () => {
      const mockSelections = [
        {
          id: 1,
          name: 'Тестовая подборка',
          agent_id: 1,
          client_email: 'client@test.ru',
          client_name: 'Иван Петров',
          share_code: 'abc123',
          is_public: true,
          view_count: 5,
          last_viewed_at: '2024-12-01T10:00:00Z',
          created_at: '2024-11-01T10:00:00Z',
          updated_at: '2024-12-01T10:00:00Z',
          items_count: 3
        }
      ];

      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockSelections });

      const result = await service.getAgentSelections(1);

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSelections);
      expect(result[0].items_count).toBe(3);
    });

    it('should return empty array when no selections', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.getAgentSelections(999);

      expect(result).toEqual([]);
    });
  });

  describe('createSelection', () => {
    it('should create selection with share code', async () => {
      const mockCreated = {
        id: 1,
        name: 'Новая подборка',
        agent_id: 1,
        client_email: null,
        client_name: null,
        share_code: expect.any(String),
        is_public: false,
        view_count: 0,
        last_viewed_at: null,
        created_at: '2024-12-02T10:00:00Z',
        updated_at: '2024-12-02T10:00:00Z'
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockCreated] });

      const result = await service.createSelection(1, {
        name: 'Новая подборка',
        isPublic: false
      });

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
      expect(result?.name).toBe('Новая подборка');
    });

    it('should create public selection with client info', async () => {
      const mockCreated = {
        id: 2,
        name: 'Подборка для клиента',
        agent_id: 1,
        client_email: 'client@test.ru',
        client_name: 'Клиент',
        share_code: 'xyz789',
        is_public: true,
        view_count: 0,
        last_viewed_at: null,
        created_at: '2024-12-02T10:00:00Z',
        updated_at: '2024-12-02T10:00:00Z'
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockCreated] });

      const result = await service.createSelection(1, {
        name: 'Подборка для клиента',
        clientEmail: 'client@test.ru',
        clientName: 'Клиент',
        isPublic: true
      });

      expect(result?.client_email).toBe('client@test.ru');
      expect(result?.is_public).toBe(true);
    });
  });

  describe('getSelectionById', () => {
    it('should return selection with items', async () => {
      const mockSelection = {
        id: 1,
        name: 'Подборка',
        agent_id: 1,
        client_email: null,
        client_name: null,
        share_code: 'abc123',
        is_public: true,
        view_count: 10,
        last_viewed_at: '2024-12-01T10:00:00Z',
        created_at: '2024-11-01T10:00:00Z',
        updated_at: '2024-12-01T10:00:00Z'
      };

      const mockItems = [
        {
          id: 1,
          offer_id: 100,
          comment: 'Хороший вариант',
          added_by: 'agent',
          status: 'pending',
          added_at: '2024-11-15T10:00:00Z',
          rooms: 2,
          is_studio: false,
          floor: 5,
          floors_total: 25,
          area_total: 65.5,
          price: 15000000,
          price_per_sqm: 229008,
          complex_name: 'ЖК Тест'
        }
      ];

      // Первый вызов - получение подборки
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockSelection] });
      // Второй вызов - получение элементов
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockItems });

      const result = await service.getSelectionById(1, 1);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].price).toBe(15000000);
    });

    it('should return null for non-existent selection', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.getSelectionById(999, 1);

      expect(result).toBeNull();
    });

    it('should return null if agent does not own selection', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.getSelectionById(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('getSelectionByShareCode', () => {
    it('should return public selection by share code', async () => {
      const mockSelection = {
        id: 1,
        name: 'Публичная подборка',
        agent_id: 1,
        share_code: 'public-share-code',
        is_public: true
      };

      const mockItems = [
        {
          id: 1,
          offer_id: 100,
          rooms: 3,
          price: 20000000,
          complex_name: 'ЖК Публичный'
        }
      ];

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockSelection] })
        .mockResolvedValueOnce({ rows: mockItems });

      const result = await service.getSelectionByShareCode('public-share-code');

      expect(result).toBeDefined();
      expect(result?.share_code).toBe('public-share-code');
    });

    it('should return null for non-existent share code', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.getSelectionByShareCode('invalid-code');

      expect(result).toBeNull();
    });
  });

  describe('addItem', () => {
    it('should add offer to selection', async () => {
      // addItem(selectionId, agentId, offerId, comment?)
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // selection exists (owner check)
        .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // offer exists
        .mockResolvedValueOnce({ rows: [{ max_order: 0 }] }) // max order
        .mockResolvedValueOnce({ rows: [] }) // insert
        .mockResolvedValueOnce({ rows: [] }); // log activity

      const result = await service.addItem(1, 1, 100, 'Хороший вариант');

      expect(result).toBe(true);
    });

    it('should return false if offer not found', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // selection exists
        .mockResolvedValueOnce({ rows: [] }); // offer not found

      const result = await service.addItem(1, 1, 100);

      expect(result).toBe(false);
    });

    it('should return false if selection not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.addItem(999, 1, 100);

      expect(result).toBe(false);
    });
  });

  describe('removeItem', () => {
    it('should remove item from selection', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // selection exists
        .mockResolvedValueOnce({ rowCount: 1 }); // delete successful

      const result = await service.removeItem(1, 100, 1);

      expect(result).toBe(true);
    });

    it('should return false if selection not owned by agent', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.removeItem(1, 100, 999);

      expect(result).toBe(false);
    });
  });

  describe('deleteSelection', () => {
    it('should delete selection and its items', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rowCount: 1 }); // delete successful

      const result = await service.deleteSelection(1, 1);

      expect(result).toBe(true);
    });

    it('should return false if selection not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });

      const result = await service.deleteSelection(999, 1);

      expect(result).toBe(false);
    });
  });

  describe('updateSelection', () => {
    it('should update selection name', async () => {
      const mockUpdated = {
        id: 1,
        name: 'Обновлённое название',
        agent_id: 1,
        is_public: true
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUpdated] });

      const result = await service.updateSelection(1, 1, { name: 'Обновлённое название' });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Обновлённое название');
    });

    it('should return null if selection not found', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await service.updateSelection(999, 1, { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('recordView', () => {
    it('should increment view count', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // update successful

      await service.recordView('share-code-123', 'client-fingerprint');

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      (mockPool.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      // Не должен бросать ошибку
      await expect(service.recordView('invalid', 'client')).resolves.toBeUndefined();
    });
  });
});
