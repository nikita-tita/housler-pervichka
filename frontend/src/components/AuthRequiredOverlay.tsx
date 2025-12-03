'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface AuthRequiredOverlayProps {
  children: ReactNode;
  message?: string;
}

/**
 * Обёртка для элементов, требующих авторизации.
 * Для неавторизованных: показывает детей с пониженной непрозрачностью,
 * блокирует клики и показывает tooltip при наведении.
 */
export function AuthRequiredOverlay({
  children,
  message = 'Для использования этого фильтра необходимо войти в систему'
}: AuthRequiredOverlayProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);

  // Пока загружается или пользователь авторизован — показываем как есть
  if (isLoading || isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Заблокированный контент */}
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>

      {/* Невидимый оверлей для перехвата кликов */}
      <div
        className="absolute inset-0 cursor-not-allowed"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowTooltip(true);
        }}
      />

      {/* Tooltip при наведении */}
      {showTooltip && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2">
          <div className="bg-white rounded-lg shadow-lg border border-[var(--color-border)] p-4 min-w-[240px] text-center">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text)] mb-3">
              {message}
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/login" className="btn btn-primary btn-sm">
                Войти
              </Link>
              <Link href="/login" className="btn btn-secondary btn-sm">
                Регистрация
              </Link>
            </div>
          </div>
          {/* Стрелка */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white" />
        </div>
      )}
    </div>
  );
}
