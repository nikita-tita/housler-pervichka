import { Request, Response } from 'express';
import { BookingsService, BookingStatus } from '../../services/bookings.service';

const bookingsService = new BookingsService();

/**
 * POST /api/bookings - Создать заявку на бронирование
 */
export async function createBooking(req: Request, res: Response) {
  try {
    const { offerId, clientName, clientPhone, clientEmail, comment } = req.body;

    if (!offerId || !clientName || !clientPhone) {
      return res.status(400).json({
        success: false,
        error: 'offerId, clientName и clientPhone обязательны'
      });
    }

    // Простая валидация телефона
    const phoneRegex = /^[\d\s\+\-\(\)]{10,20}$/;
    if (!phoneRegex.test(clientPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный номер телефона'
      });
    }

    const booking = await bookingsService.createBooking({
      offerId,
      agentId: req.user?.id, // может быть undefined если не авторизован
      clientName,
      clientPhone,
      clientEmail,
      comment
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Объявление не найдено'
      });
    }

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error in createBooking:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании заявки'
    });
  }
}

/**
 * GET /api/bookings - Получить заявки агента
 */
export async function getAgentBookings(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const bookings = await bookingsService.getAgentBookings(req.user.id);

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error in getAgentBookings:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении заявок'
    });
  }
}

/**
 * GET /api/operator/bookings - Получить все заявки (для оператора)
 */
export async function getAllBookings(req: Request, res: Response) {
  try {
    const { status, dateFrom, dateTo } = req.query;

    const filters: any = {};

    if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status as string)) {
      filters.status = status as BookingStatus;
    }

    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom as string);
    }

    if (dateTo) {
      filters.dateTo = new Date(dateTo as string);
    }

    const bookings = await bookingsService.getAllBookings(filters);

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error in getAllBookings:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении заявок'
    });
  }
}

/**
 * GET /api/operator/bookings/stats - Статистика заявок
 */
export async function getBookingsStats(req: Request, res: Response) {
  try {
    const stats = await bookingsService.getBookingsStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getBookingsStats:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики'
    });
  }
}

/**
 * PATCH /api/operator/bookings/:id - Обновить статус заявки
 */
export async function updateBookingStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    const id = parseInt(req.params.id);
    const { status, comment } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Некорректный ID' });
    }

    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный статус'
      });
    }

    const booking = await bookingsService.updateBookingStatus(
      id,
      req.user.id,
      status as BookingStatus,
      comment
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Заявка не найдена'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error in updateBookingStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении заявки'
    });
  }
}
