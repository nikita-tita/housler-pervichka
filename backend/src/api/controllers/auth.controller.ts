import { Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';

const authService = new AuthService();

/**
 * POST /api/auth/request-code - Запросить код авторизации
 */
export async function requestCode(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email обязателен'
      });
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный email'
      });
    }

    const result = await authService.requestCode(email);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Error in requestCode:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при отправке кода'
    });
  }
}

/**
 * POST /api/auth/verify-code - Проверить код и получить токен
 */
export async function verifyCode(req: Request, res: Response) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email и код обязательны'
      });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        error: 'Код должен содержать 6 цифр'
      });
    }

    const result = await authService.verifyCode(email, code);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      token: result.token,
      user: result.user
    });
  } catch (error) {
    console.error('Error in verifyCode:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при проверке кода'
    });
  }
}

/**
 * GET /api/auth/me - Получить текущего пользователя
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Не авторизован'
      });
    }

    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении пользователя'
    });
  }
}

/**
 * PATCH /api/auth/profile - Обновить профиль
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Не авторизован'
      });
    }

    const { name, phone } = req.body;

    const updatedUser = await authService.updateUser(req.user.id, { name, phone });

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении профиля'
    });
  }
}
