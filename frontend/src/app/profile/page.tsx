'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api, formatPrice, formatArea, formatRooms } from '@/services/api';
import type { Selection, Agency } from '@/types';

interface ClientSelection extends Selection {
  agent_name?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading, logout } = useAuth();
  const [selections, setSelections] = useState<ClientSelection[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, authLoading, router]);

  const loadData = async () => {
    try {
      // Загружаем подборки
      const selectionsRes = await api.getMySelections();
      if (selectionsRes.success && selectionsRes.data) {
        setSelections(selectionsRes.data);
      }
    } catch (error) {
      console.warn('Failed to load selections:', error);
    }

    try {
      // Загружаем агентства (может быть недоступно)
      const agenciesRes = await api.getMyAgencies();
      if (agenciesRes.success && agenciesRes.data) {
        setAgencies(agenciesRes.data);
      }
    } catch (error) {
      console.warn('Agencies API not available:', error);
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading || isLoading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-12">
      {/* Шапка профиля */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            {user.name || 'Мой профиль'}
          </h1>
          <div className="text-[var(--color-text-light)]">
            {user.email}
            {user.phone && <span className="ml-3">{user.phone}</span>}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Выйти
        </button>
      </div>

      {/* Быстрые ссылки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Link
          href="/favorites"
          className="p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div>
              <div className="font-medium">Избранное</div>
              <div className="text-sm text-[var(--color-text-light)]">Сохранённые объекты</div>
            </div>
          </div>
        </Link>

        <Link
          href="/offers"
          className="p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <div className="font-medium">Поиск</div>
              <div className="text-sm text-[var(--color-text-light)]">Найти квартиру</div>
            </div>
          </div>
        </Link>

        <Link
          href="/compare"
          className="p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="font-medium">Сравнение</div>
              <div className="text-sm text-[var(--color-text-light)]">Сравнить объекты</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Мои подборки от агентов */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Подборки от агентов</h2>
        {selections.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-[var(--color-text-light)] mb-2">
              Пока нет подборок
            </div>
            <div className="text-sm text-[var(--color-text-light)]">
              Агенты смогут отправить вам персональные подборки квартир
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {selections.map((selection) => (
              <Link
                key={selection.id}
                href={`/s/${selection.share_code}`}
                className="block p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selection.name}</div>
                    <div className="text-sm text-[var(--color-text-light)] mt-1">
                      {selection.items_count} объектов
                      {selection.agent_name && (
                        <span className="ml-2">
                          от {selection.agent_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-[var(--color-text-light)]">
                    {new Date(selection.updated_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Мои агентства */}
      {agencies.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Мои агентства</h2>
          <div className="space-y-3">
            {agencies.map((agency) => (
              <div
                key={agency.id}
                className="p-5 bg-white border border-[var(--color-border)] rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {agency.logo_url ? (
                    <img
                      src={agency.logo_url}
                      alt={agency.name}
                      className="w-12 h-12 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-400">
                        {agency.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{agency.name}</div>
                    {agency.phone && (
                      <a
                        href={`tel:${agency.phone}`}
                        className="text-sm text-[var(--color-accent)]"
                      >
                        {agency.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
