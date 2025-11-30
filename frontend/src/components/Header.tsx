'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';

export function Header() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const { favoriteIds } = useFavorites();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="py-8 border-b border-[var(--color-border)] bg-white">
      <div className="container">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            HOUSLER
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            <Link
              href="/offers"
              className="text-[15px] font-medium transition-colors hover:text-[var(--color-text-light)]"
            >
              Квартиры
            </Link>
            <Link
              href="/complexes"
              className="text-[15px] font-medium transition-colors hover:text-[var(--color-text-light)]"
            >
              Жилые комплексы
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href="/favorites"
                  className="text-[15px] font-medium transition-colors hover:text-[var(--color-text-light)] flex items-center gap-1"
                >
                  <span>Избранное</span>
                  {favoriteIds.size > 0 && (
                    <span className="bg-[var(--color-accent)] text-white text-xs px-1.5 py-0.5 rounded-full">
                      {favoriteIds.size}
                    </span>
                  )}
                </Link>
                {(user?.role === 'agent' || user?.role === 'admin') && (
                  <Link
                    href="/selections"
                    className="text-[15px] font-medium transition-colors hover:text-[var(--color-text-light)]"
                  >
                    Подборки
                  </Link>
                )}
              </>
            )}

            {/* Auth button */}
            {isLoading ? (
              <span className="text-[15px] text-[var(--color-text-light)]">...</span>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-[13px] text-[var(--color-text-light)]">
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  className="text-[15px] font-medium text-[var(--color-text-light)] hover:text-[var(--color-text)]"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-[15px] font-medium transition-colors hover:text-[var(--color-text-light)]"
              >
                Войти
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`w-6 h-0.5 bg-[var(--color-text)] transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-[var(--color-text)] ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-[var(--color-text)] transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-6 pb-2 space-y-4">
            <Link
              href="/offers"
              className="block text-[15px] font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Квартиры
            </Link>
            <Link
              href="/complexes"
              className="block text-[15px] font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Жилые комплексы
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href="/favorites"
                  className="block text-[15px] font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Избранное {favoriteIds.size > 0 && `(${favoriteIds.size})`}
                </Link>
                {(user?.role === 'agent' || user?.role === 'admin') && (
                  <Link
                    href="/selections"
                    className="block text-[15px] font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Подборки
                  </Link>
                )}
              </>
            )}

            <div className="pt-4 border-t border-[var(--color-border)]">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="text-[13px] text-[var(--color-text-light)]">
                    {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-[15px] font-medium text-[var(--color-text-light)]"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block text-[15px] font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Войти
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
