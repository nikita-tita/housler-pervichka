'use client';

import Link from 'next/link';
import { useFilterOptions } from '@/hooks/useFilterOptions';

interface QuickFilter {
  label: string;
  href: string;
  count?: number;
}

interface FilterSection {
  title: string;
  filters: QuickFilter[];
}

export function QuickFilters() {
  const { filterOptions, isLoading } = useFilterOptions();

  // Генерируем секции фильтров
  const getSections = (): FilterSection[] => {
    const sections: FilterSection[] = [];

    // По комнатам
    const rooms = filterOptions?.rooms || [];
    const roomFilters: QuickFilter[] = [];

    const studios = rooms.find(r => r.value === 0);
    if (studios) {
      roomFilters.push({ label: 'Студии', href: '/offers?is_studio=true', count: studios.count });
    }

    [1, 2, 3].forEach(num => {
      const room = rooms.find(r => r.value === num);
      if (room) {
        roomFilters.push({ label: `${num}-комн.`, href: `/offers?rooms=${num}`, count: room.count });
      }
    });

    if (roomFilters.length > 0) {
      sections.push({ title: 'По комнатам', filters: roomFilters });
    }

    // По году сдачи
    const years = filterOptions?.completion_years || [];
    const currentYear = new Date().getFullYear();
    const yearFilters: QuickFilter[] = [];

    years.forEach(y => {
      if (y.year >= currentYear && y.year <= currentYear + 4) {
        yearFilters.push({
          label: y.year.toString(),
          href: `/offers?completion_years=${y.year}`,
          count: y.count
        });
      }
    });

    // Добавляем «Сдан»
    yearFilters.unshift({
      label: 'Сдан',
      href: '/offers?completion_years=' + (currentYear - 1), // Все до текущего года
    });

    if (yearFilters.length > 1) {
      sections.push({ title: 'По сроку сдачи', filters: yearFilters });
    }

    // По цене
    const priceFilters: QuickFilter[] = [
      { label: 'До 8 млн', href: '/offers?price_max=8000000' },
      { label: 'До 12 млн', href: '/offers?price_max=12000000' },
      { label: 'До 20 млн', href: '/offers?price_max=20000000' },
      { label: 'От 20 млн', href: '/offers?price_min=20000000' },
    ];

    sections.push({ title: 'По цене', filters: priceFilters });

    return sections;
  };

  if (isLoading) {
    return (
      <div className="mb-6 space-y-4">
        {[1, 2].map(i => (
          <div key={i}>
            <div className="h-4 w-24 bg-[var(--color-bg-gray)] rounded mb-2 animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-8 w-20 bg-[var(--color-bg-gray)] rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sections = getSections();

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="text-sm font-medium mb-2 text-[var(--color-text-light)]">
            {section.title}
          </div>
          <div className="flex gap-2 flex-wrap">
            {section.filters.map((filter) => (
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
      ))}
    </div>
  );
}
