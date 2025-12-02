'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { FilterOptions } from '@/types';

interface QuickFilter {
  label: string;
  href: string;
  count?: number;
}

export function QuickFilters() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getFilters()
      .then(res => {
        if (res.success && res.data) {
          setFilterOptions(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Генерируем быстрые фильтры на основе данных
  const getQuickFilters = (): QuickFilter[] => {
    const filters: QuickFilter[] = [];

    // По комнатам
    const rooms = filterOptions?.rooms || [];
    const studios = rooms.find(r => r.value === 0);
    const oneRoom = rooms.find(r => r.value === 1);
    const twoRoom = rooms.find(r => r.value === 2);

    if (studios) {
      filters.push({
        label: 'Студии',
        href: '/offers?is_studio=true',
        count: studios.count
      });
    }

    if (oneRoom) {
      filters.push({
        label: '1-комнатные',
        href: '/offers?rooms=1',
        count: oneRoom.count
      });
    }

    if (twoRoom) {
      filters.push({
        label: '2-комнатные',
        href: '/offers?rooms=2',
        count: twoRoom.count
      });
    }

    // По году сдачи
    const years = filterOptions?.completion_years || [];
    const currentYear = new Date().getFullYear();

    years.slice(0, 3).forEach(y => {
      if (y.year >= currentYear) {
        filters.push({
          label: `Сдача ${y.year}`,
          href: `/offers?completion_years=${y.year}`,
          count: y.count
        });
      }
    });

    // По цене (хардкод пресетов, без count)
    filters.push({
      label: 'До 10 млн',
      href: '/offers?price_max=10000000'
    });

    filters.push({
      label: 'До 15 млн',
      href: '/offers?price_max=15000000'
    });

    return filters;
  };

  if (isLoading) {
    return (
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-8 w-24 bg-[var(--color-bg-gray)] rounded-full animate-pulse" />
        ))}
      </div>
    );
  }

  const quickFilters = getQuickFilters();

  if (quickFilters.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="text-sm font-medium mb-3 text-[var(--color-text-light)]">
        Популярные запросы
      </div>
      <div className="flex gap-2 flex-wrap">
        {quickFilters.map((filter) => (
          <Link
            key={filter.href}
            href={filter.href}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-gray)] hover:bg-[var(--color-accent)] hover:text-white rounded-full text-sm transition-colors"
          >
            <span>{filter.label}</span>
            {filter.count !== undefined && (
              <span className="text-xs opacity-70">
                ({filter.count.toLocaleString('ru-RU')})
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
