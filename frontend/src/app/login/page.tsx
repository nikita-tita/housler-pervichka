'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'email' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const { requestCode, login, isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/');
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
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md px-8">
        <h1 className="text-2xl font-semibold text-center mb-2">Вход</h1>
        <p className="text-[var(--color-text-light)] text-center mb-8">
          Для агентов и операторов
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
                placeholder="agent@example.com"
                required
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn btn-primary btn-block"
            >
              {isLoading ? 'Отправка...' : 'Получить код'}
            </button>

            {email.endsWith('@test.housler.ru') && (
              <button
                type="button"
                onClick={() => setStep('code')}
                className="w-full py-2 text-sm text-[var(--color-accent)] hover:underline"
              >
                У меня есть постоянный код
              </button>
            )}
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
              <div className="text-red-600 text-sm text-center">{error}</div>
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
