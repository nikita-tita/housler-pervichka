'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface RestrictedContentProps {
  children: ReactNode;
  // Режим отображения для неавторизованных
  fallback?: 'blur' | 'hide' | 'placeholder';
  // Степень блюра (default: 30%)
  blurIntensity?: 'light' | 'medium' | 'heavy';
  // Сообщение для отображения
  message?: string;
  // Показывать кнопку входа
  showLoginButton?: boolean;
  // Кастомный placeholder
  placeholder?: ReactNode;
  // Классы для контейнера
  className?: string;
}

export function RestrictedContent({
  children,
  fallback = 'blur',
  blurIntensity = 'medium',
  message = 'Вся информация доступна после авторизации',
  showLoginButton = true,
  placeholder,
  className = '',
}: RestrictedContentProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Пока загружается — показываем контент (чтобы не было мерцания)
  if (isLoading) {
    return <>{children}</>;
  }

  // Авторизован — показываем контент
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Режим: скрыть полностью
  if (fallback === 'hide') {
    return null;
  }

  // Режим: кастомный placeholder
  if (fallback === 'placeholder' && placeholder) {
    return <>{placeholder}</>;
  }

  // Интенсивность блюра
  const blurClasses = {
    light: 'blur-[2px] opacity-70',
    medium: 'blur-[4px] opacity-50',
    heavy: 'blur-[8px] opacity-30',
  };

  // Режим: блюр (по умолчанию)
  return (
    <div className={`relative ${className}`}>
      {/* Заблюренный контент */}
      <div className={`${blurClasses[blurIntensity]} pointer-events-none select-none`}>
        {children}
      </div>

      {/* Оверлей с сообщением */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm text-center border border-[var(--color-border)]">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-[var(--color-text)] mb-4">{message}</p>
          {showLoginButton && (
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Войти
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Компонент для скрытия отдельных элементов (например, кнопки заявки)
 */
export function AuthRequired({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Кнопка, которая требует авторизации
 * Если не авторизован — редиректит на логин
 */
export function AuthRequiredButton({
  children,
  onClick,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isAuthenticated) {
      e.preventDefault();
      // Сохраняем текущий URL для возврата
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('returnUrl', window.location.pathname);
      }
      window.location.href = '/login';
      return;
    }
    onClick?.(e);
  };

  return (
    <button onClick={handleClick} className={className} {...props}>
      {children}
    </button>
  );
}
