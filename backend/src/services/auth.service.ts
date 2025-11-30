import { pool } from '../config/database';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export type UserRole = 'client' | 'agent' | 'operator' | 'admin';

export interface User {
  id: number;
  email: string;
  phone: string | null;
  name: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const CODE_EXPIRES_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 3;

export class AuthService {
  /**
   * Генерация 6-значного кода
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Запрос кода авторизации
   */
  async requestCode(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Проверяем, нет ли слишком свежего кода
    const existingCode = await pool.query(`
      SELECT id FROM auth_codes
      WHERE email = $1
        AND expires_at > NOW()
        AND used_at IS NULL
        AND created_at > NOW() - INTERVAL '1 minute'
    `, [normalizedEmail]);

    if (existingCode.rows.length > 0) {
      return {
        success: false,
        message: 'Код уже отправлен. Подождите минуту перед повторной отправкой.'
      };
    }

    // Генерируем код
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRES_MINUTES * 60 * 1000);

    // Сохраняем в БД
    await pool.query(`
      INSERT INTO auth_codes (email, code, expires_at)
      VALUES ($1, $2, $3)
    `, [normalizedEmail, code, expiresAt]);

    // TODO: Отправить email с кодом
    // В продакшене интегрировать с SMTP или email-сервисом
    console.log(`📧 Auth code for ${normalizedEmail}: ${code}`);

    return {
      success: true,
      message: 'Код отправлен на email'
    };
  }

  /**
   * Проверка кода и выдача JWT
   */
  async verifyCode(email: string, code: string): Promise<{
    success: boolean;
    token?: string;
    user?: User;
    message: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Ищем валидный код
    const codeResult = await pool.query(`
      SELECT id, attempts
      FROM auth_codes
      WHERE email = $1
        AND code = $2
        AND expires_at > NOW()
        AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `, [normalizedEmail, code]);

    if (codeResult.rows.length === 0) {
      // Увеличиваем счётчик попыток для последнего кода
      await pool.query(`
        UPDATE auth_codes
        SET attempts = attempts + 1
        WHERE email = $1
          AND expires_at > NOW()
          AND used_at IS NULL
      `, [normalizedEmail]);

      return {
        success: false,
        message: 'Неверный или истёкший код'
      };
    }

    const authCode = codeResult.rows[0];

    if (authCode.attempts >= MAX_CODE_ATTEMPTS) {
      return {
        success: false,
        message: 'Превышено количество попыток. Запросите новый код.'
      };
    }

    // Отмечаем код как использованный
    await pool.query(`
      UPDATE auth_codes SET used_at = NOW() WHERE id = $1
    `, [authCode.id]);

    // Находим или создаём пользователя
    let user = await this.findUserByEmail(normalizedEmail);

    if (!user) {
      user = await this.createUser(normalizedEmail);
    }

    // Обновляем last_login_at
    await pool.query(`
      UPDATE users SET last_login_at = NOW() WHERE id = $1
    `, [user.id]);

    // Генерируем JWT
    const token = this.generateToken(user);

    return {
      success: true,
      token,
      user,
      message: 'Авторизация успешна'
    };
  }

  /**
   * Поиск пользователя по email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query(`
      SELECT id, email, phone, name, role, is_active, last_login_at, created_at
      FROM users
      WHERE email = $1
    `, [email.toLowerCase().trim()]);

    return result.rows[0] || null;
  }

  /**
   * Поиск пользователя по ID
   */
  async findUserById(id: number): Promise<User | null> {
    const result = await pool.query(`
      SELECT id, email, phone, name, role, is_active, last_login_at, created_at
      FROM users
      WHERE id = $1
    `, [id]);

    return result.rows[0] || null;
  }

  /**
   * Создание нового пользователя
   */
  async createUser(email: string, role: UserRole = 'client'): Promise<User> {
    const result = await pool.query(`
      INSERT INTO users (email, role)
      VALUES ($1, $2)
      RETURNING id, email, phone, name, role, is_active, last_login_at, created_at
    `, [email.toLowerCase().trim(), role]);

    return result.rows[0];
  }

  /**
   * Обновление профиля пользователя
   */
  async updateUser(id: number, data: { name?: string; phone?: string }): Promise<User | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(data.name);
      paramIndex++;
    }

    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(data.phone);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findUserById(id);
    }

    params.push(id);

    const result = await pool.query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, phone, name, role, is_active, last_login_at, created_at
    `, params);

    return result.rows[0] || null;
  }

  /**
   * Генерация JWT токена
   */
  generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Проверка JWT токена
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Очистка истёкших кодов (для cron)
   */
  async cleanupExpiredCodes(): Promise<number> {
    const result = await pool.query(`
      DELETE FROM auth_codes
      WHERE expires_at < NOW() - INTERVAL '1 hour'
    `);

    return result.rowCount || 0;
  }
}
