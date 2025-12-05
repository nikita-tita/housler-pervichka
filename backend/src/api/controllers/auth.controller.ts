import { Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';

const authService = new AuthService();

/**
 * POST /api/auth/request-code - Запросить код авторизации
 * Валидация email выполняется middleware validateBody(requestCodeSchema)
 */
export async function requestCode(req: Request, res: Response) {
  try {
    // email уже провалидирован через Zod в middleware
    const { email } = req.body;

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
 * Валидация выполняется middleware validateBody(verifyCodeSchema)
 */
export async function verifyCode(req: Request, res: Response) {
  try {
    // email и code уже провалидированы через Zod в middleware
    const { email, code } = req.body;

    const result = await authService.verifyCode(email, code);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      data: {
        token: result.token,
        user: result.user
      }
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
      data: req.user
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
      data: updatedUser
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении профиля'
    });
  }
}

// ============ SMS-авторизация ============

/**
 * POST /api/auth/request-sms - Запросить SMS-код
 */
export async function requestSmsCode(req: Request, res: Response) {
  try {
    const { phone } = req.body;
    const result = await authService.requestSmsCode(phone);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in requestSmsCode:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при отправке SMS-кода'
    });
  }
}

/**
 * POST /api/auth/verify-sms - Проверить SMS-код
 */
export async function verifySmsCode(req: Request, res: Response) {
  try {
    const { phone, code } = req.body;
    const result = await authService.verifySmsCode(phone, code);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      data: {
        isNewUser: result.isNewUser,
        user: result.user,
        token: result.token,
        message: result.message
      }
    });
  } catch (error) {
    console.error('Error in verifySmsCode:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при проверке SMS-кода'
    });
  }
}

// ============ Регистрация ============

/**
 * POST /api/auth/register-realtor - Регистрация частного риелтора
 */
export async function registerRealtor(req: Request, res: Response) {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.registerRealtor(req.body, ipAddress, userAgent);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
        message: result.message
      }
    });
  } catch (error) {
    console.error('Error in registerRealtor:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при регистрации'
    });
  }
}

/**
 * POST /api/auth/check-inn - Проверить ИНН на дубликат
 */
export async function checkInn(req: Request, res: Response) {
  try {
    const { inn } = req.body;
    const result = await authService.checkInn(inn);

    res.json({
      success: true,
      data: {
        exists: result.exists,
        agencyName: result.agencyName
      }
    });
  } catch (error) {
    console.error('Error in checkInn:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при проверке ИНН'
    });
  }
}

/**
 * POST /api/auth/register-agency - Регистрация агентства
 */
export async function registerAgency(req: Request, res: Response) {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.registerAgency(req.body, ipAddress, userAgent);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
        message: result.message
      }
    });
  } catch (error) {
    console.error('Error in registerAgency:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при регистрации агентства'
    });
  }
}

/**
 * POST /api/auth/login-agency - Вход для агентств (email + password)
 */
export async function loginAgency(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginWithPassword(email, password);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.token
      }
    });
  } catch (error) {
    console.error('Error in loginAgency:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при авторизации'
    });
  }
}
