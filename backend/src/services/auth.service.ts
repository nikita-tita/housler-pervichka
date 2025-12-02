import { pool } from '../config/database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { RegisterRealtorInput, RegisterAgencyInput } from '../validation/schemas';

export type UserRole = 'client' | 'agent' | 'agency_admin' | 'operator' | 'admin';

export interface User {
  id: number;
  email: string;
  phone: string | null;
  name: string | null;
  role: UserRole;
  agency_id: number | null;  // Для агентов — их агентство
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  agencyId: number | null;
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

    // Отмечаем код как использованный (кроме тестовых аккаунтов с постоянными кодами)
    const isTestAccount = normalizedEmail.endsWith('@test.housler.ru');
    const isTestCode = ['111111', '222222', '333333', '444444', '555555', '666666'].includes(code);

    if (!(isTestAccount && isTestCode)) {
      await pool.query(`
        UPDATE auth_codes SET used_at = NOW() WHERE id = $1
      `, [authCode.id]);
    }

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
      SELECT id, email, phone, name, role, agency_id, is_active, last_login_at, created_at
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
      SELECT id, email, phone, name, role, agency_id, is_active, last_login_at, created_at
      FROM users
      WHERE id = $1
    `, [id]);

    return result.rows[0] || null;
  }

  /**
   * Создание нового пользователя
   */
  async createUser(email: string, role: UserRole = 'client', agencyId?: number): Promise<User> {
    const result = await pool.query(`
      INSERT INTO users (email, role, agency_id)
      VALUES ($1, $2, $3)
      RETURNING id, email, phone, name, role, agency_id, is_active, last_login_at, created_at
    `, [email.toLowerCase().trim(), role, agencyId || null]);

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
      RETURNING id, email, phone, name, role, agency_id, is_active, last_login_at, created_at
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
      role: user.role,
      agencyId: user.agency_id
    };

    // 7 дней в секундах
    const expiresInSeconds = 7 * 24 * 60 * 60;
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresInSeconds });
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

  // ============ SMS-авторизация ============

  /**
   * Запрос SMS-кода (заглушка без реальной отправки)
   */
  async requestSmsCode(phone: string): Promise<{ success: boolean; message: string }> {
    // Проверяем, нет ли слишком свежего кода
    const existingCode = await pool.query(`
      SELECT id FROM sms_codes
      WHERE phone = $1
        AND expires_at > NOW()
        AND used_at IS NULL
        AND created_at > NOW() - INTERVAL '1 minute'
    `, [phone]);

    if (existingCode.rows.length > 0) {
      return {
        success: false,
        message: 'Код уже отправлен. Подождите минуту перед повторной отправкой.'
      };
    }

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRES_MINUTES * 60 * 1000);

    await pool.query(`
      INSERT INTO sms_codes (phone, code, purpose, expires_at)
      VALUES ($1, $2, 'auth', $3)
    `, [phone, code, expiresAt]);

    // TODO: Интегрировать с SMS-провайдером
    console.log(`📱 SMS code for ${phone}: ${code}`);

    return {
      success: true,
      message: 'Код отправлен на телефон'
    };
  }

  /**
   * Проверка SMS-кода
   */
  async verifySmsCode(phone: string, code: string): Promise<{
    success: boolean;
    isNewUser: boolean;
    user?: User;
    token?: string;
    message: string;
  }> {
    // Тестовые аккаунты
    const isTestPhone = phone.startsWith('79999');
    const isTestCode = ['111111', '222222', '333333'].includes(code);

    if (!(isTestPhone && isTestCode)) {
      const codeResult = await pool.query(`
        SELECT id, attempts
        FROM sms_codes
        WHERE phone = $1
          AND code = $2
          AND expires_at > NOW()
          AND used_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `, [phone, code]);

      if (codeResult.rows.length === 0) {
        await pool.query(`
          UPDATE sms_codes
          SET attempts = attempts + 1
          WHERE phone = $1
            AND expires_at > NOW()
            AND used_at IS NULL
        `, [phone]);

        return {
          success: false,
          isNewUser: false,
          message: 'Неверный или истёкший код'
        };
      }

      const smsCode = codeResult.rows[0];

      if (smsCode.attempts >= MAX_CODE_ATTEMPTS) {
        return {
          success: false,
          isNewUser: false,
          message: 'Превышено количество попыток. Запросите новый код.'
        };
      }

      // Отмечаем код как использованный
      await pool.query(`
        UPDATE sms_codes SET used_at = NOW() WHERE id = $1
      `, [smsCode.id]);
    }

    // Ищем пользователя по телефону
    const user = await this.findUserByPhone(phone);

    if (user) {
      // Обновляем last_login и phone_verified
      await pool.query(`
        UPDATE users SET last_login_at = NOW(), phone_verified = TRUE WHERE id = $1
      `, [user.id]);

      const token = this.generateToken(user);

      return {
        success: true,
        isNewUser: false,
        user,
        token,
        message: 'Авторизация успешна'
      };
    }

    // Новый пользователь — нужна регистрация
    return {
      success: true,
      isNewUser: true,
      message: 'Телефон подтверждён. Заполните профиль для завершения регистрации.'
    };
  }

  /**
   * Поиск пользователя по телефону
   */
  async findUserByPhone(phone: string): Promise<User | null> {
    const result = await pool.query(`
      SELECT id, email, phone, name, role, agency_id, is_active, last_login_at, created_at
      FROM users
      WHERE phone = $1
    `, [phone]);

    return result.rows[0] || null;
  }

  // ============ Регистрация риелтора ============

  /**
   * Регистрация частного риелтора
   */
  async registerRealtor(data: RegisterRealtorInput, ipAddress?: string, userAgent?: string): Promise<{
    success: boolean;
    user?: User;
    token?: string;
    message: string;
  }> {
    // Проверяем, что email не занят
    const existingEmail = await this.findUserByEmail(data.email);
    if (existingEmail) {
      return {
        success: false,
        message: 'Пользователь с таким email уже существует'
      };
    }

    // Проверяем, что телефон не занят
    const existingPhone = await this.findUserByPhone(data.phone);
    if (existingPhone) {
      return {
        success: false,
        message: 'Пользователь с таким телефоном уже существует'
      };
    }

    // Получаем дефолтное агентство (Housler)
    const defaultAgency = await pool.query(`
      SELECT id FROM agencies WHERE is_default = TRUE LIMIT 1
    `);
    const agencyId = defaultAgency.rows[0]?.id || null;

    // Создаём пользователя
    const result = await pool.query(`
      INSERT INTO users (email, phone, name, role, agency_id, city, is_self_employed, personal_inn, phone_verified)
      VALUES ($1, $2, $3, 'agent', $4, $5, $6, $7, TRUE)
      RETURNING id, email, phone, name, role, agency_id, is_active, last_login_at, created_at
    `, [
      data.email.toLowerCase().trim(),
      data.phone,
      data.name,
      agencyId,
      data.city || null,
      data.isSelfEmployed || false,
      data.personalInn || null
    ]);

    const user = result.rows[0];

    // Сохраняем согласия
    await this.saveConsents(user.id, data.consents, ipAddress, userAgent);

    // Генерируем токен
    const token = this.generateToken(user);

    return {
      success: true,
      user,
      token,
      message: 'Регистрация успешна'
    };
  }

  // ============ Регистрация агентства ============

  /**
   * Проверка ИНН на дубликат
   */
  async checkInn(inn: string): Promise<{
    exists: boolean;
    agencyName?: string;
  }> {
    const result = await pool.query(`
      SELECT name FROM agencies WHERE inn = $1
    `, [inn]);

    if (result.rows.length > 0) {
      return {
        exists: true,
        agencyName: result.rows[0].name
      };
    }

    return { exists: false };
  }

  /**
   * Регистрация агентства и администратора
   */
  async registerAgency(data: RegisterAgencyInput, ipAddress?: string, userAgent?: string): Promise<{
    success: boolean;
    user?: User;
    token?: string;
    message: string;
  }> {
    // Проверяем ИНН
    const innCheck = await this.checkInn(data.inn);
    if (innCheck.exists) {
      return {
        success: false,
        message: `Компания с таким ИНН уже зарегистрирована: ${innCheck.agencyName}`
      };
    }

    // Проверяем email
    const existingEmail = await this.findUserByEmail(data.contactEmail);
    if (existingEmail) {
      return {
        success: false,
        message: 'Пользователь с таким email уже существует'
      };
    }

    // Создаём агентство
    const slug = data.name.toLowerCase()
      .replace(/[^a-zа-яё0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    const agencyResult = await pool.query(`
      INSERT INTO agencies (name, slug, inn, legal_address, phone, email, contact_position, registration_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING id
    `, [
      data.name,
      slug + '-' + Date.now().toString(36),
      data.inn,
      data.legalAddress,
      data.phone || null,
      data.companyEmail || null,
      data.contactPosition || null
    ]);

    const agencyId = agencyResult.rows[0].id;

    // Хэшируем пароль
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Создаём администратора агентства
    const userResult = await pool.query(`
      INSERT INTO users (email, phone, name, role, agency_id, password_hash, phone_verified, registration_status)
      VALUES ($1, $2, $3, 'agency_admin', $4, $5, FALSE, 'active')
      RETURNING id, email, phone, name, role, agency_id, is_active, last_login_at, created_at
    `, [
      data.contactEmail.toLowerCase().trim(),
      data.contactPhone,
      data.contactName,
      agencyId,
      passwordHash
    ]);

    const user = userResult.rows[0];

    // Сохраняем согласия
    await this.saveConsents(user.id, data.consents, ipAddress, userAgent);

    // Генерируем токен
    const token = this.generateToken(user);

    return {
      success: true,
      user,
      token,
      message: 'Агентство зарегистрировано. Ожидайте подтверждения модератором.'
    };
  }

  /**
   * Вход по email и паролю (для агентств)
   */
  async loginWithPassword(email: string, password: string): Promise<{
    success: boolean;
    user?: User;
    token?: string;
    message: string;
  }> {
    const result = await pool.query(`
      SELECT id, email, phone, name, role, agency_id, is_active, last_login_at, created_at, password_hash
      FROM users
      WHERE email = $1
    `, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Неверный email или пароль'
      };
    }

    const row = result.rows[0];

    if (!row.password_hash) {
      return {
        success: false,
        message: 'Для этого аккаунта вход по паролю не настроен'
      };
    }

    const isValid = await bcrypt.compare(password, row.password_hash);
    if (!isValid) {
      return {
        success: false,
        message: 'Неверный email или пароль'
      };
    }

    if (!row.is_active) {
      return {
        success: false,
        message: 'Аккаунт деактивирован'
      };
    }

    // Обновляем last_login_at
    await pool.query(`
      UPDATE users SET last_login_at = NOW() WHERE id = $1
    `, [row.id]);

    const user: User = {
      id: row.id,
      email: row.email,
      phone: row.phone,
      name: row.name,
      role: row.role,
      agency_id: row.agency_id,
      is_active: row.is_active,
      last_login_at: row.last_login_at,
      created_at: row.created_at
    };

    const token = this.generateToken(user);

    return {
      success: true,
      user,
      token,
      message: 'Авторизация успешна'
    };
  }

  // ============ Согласия ============

  /**
   * Сохранение согласий пользователя
   */
  private async saveConsents(
    userId: number,
    consents: Record<string, boolean>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const consentTypes = {
      personalData: 'personal_data',
      terms: 'terms',
      marketing: 'marketing',
      realtorOffer: 'realtor_offer',
      agencyOffer: 'agency_offer'
    };

    for (const [key, value] of Object.entries(consents)) {
      if (value && consentTypes[key as keyof typeof consentTypes]) {
        await pool.query(`
          INSERT INTO user_consents (user_id, consent_type, document_version, ip_address, user_agent)
          VALUES ($1, $2, '1.0', $3, $4)
          ON CONFLICT (user_id, consent_type, document_version) DO NOTHING
        `, [userId, consentTypes[key as keyof typeof consentTypes], ipAddress || null, userAgent || null]);
      }
    }
  }
}
