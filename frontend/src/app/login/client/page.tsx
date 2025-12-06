'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'email' | 'code';

// Тестовые аккаунты: emails @test.housler.ru принимают коды 111111-666666
const TEST_EMAIL_DOMAIN = '@test.housler.ru';
const SHOW_DEV_LOGIN = process.env.NEXT_PUBLIC_SHOW_DEV_LOGIN === 'true';

export default function ClientLoginPage() {
  const router = useRouter();
  const { requestCode, login, isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/profile');
    return null;
  }

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await requestCode(email);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки кода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, code);
      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md px-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-light)] hover:text-[var(--color-accent)] mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Выбрать другую роль
        </Link>

        <h1 className="text-2xl font-semibold text-center mb-2">Вход для клиентов</h1>
        <p className="text-[var(--color-text-light)] text-center mb-8">
          Для поиска и подбора недвижимости
        </p>

        {step === 'email' ? (
          <form onSubmit={handleRequestCode} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="text-[var(--color-text)] text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn btn-primary btn-block"
            >
              {isLoading ? 'Отправка...' : 'Получить код'}
            </button>

            {SHOW_DEV_LOGIN && email.endsWith(TEST_EMAIL_DOMAIN) && (
              <button
                type="button"
                onClick={() => setStep('code')}
                className="w-full py-2 text-sm text-[var(--color-accent)] hover:underline"
              >
                У меня есть постоянный код
              </button>
            )}

            <p className="text-xs text-[var(--color-text-light)] text-center">
              Продолжая, вы соглашаетесь с{' '}
              <Link href="/doc/clients/soglasiya/terms" className="text-[var(--color-accent)] hover:underline">
                Пользовательским соглашением
              </Link>{' '}
              и{' '}
              <Link href="/doc/clients/politiki/privacy" className="text-[var(--color-accent)] hover:underline">
                Политикой конфиденциальности
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="text-center text-sm text-[var(--color-text-light)] mb-4">
              Код отправлен на <strong>{email}</strong>
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                Код из письма
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent text-center text-2xl tracking-widest"
              />
            </div>

            {error && (
              <div className="text-[var(--color-text)] text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="btn btn-primary btn-block"
            >
              {isLoading ? 'Проверка...' : 'Войти'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
              className="w-full py-2 text-sm text-[var(--color-text-light)] hover:text-[var(--color-text)]"
            >
              Изменить email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
