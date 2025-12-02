'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, formatPrice } from '@/services/api';
import type { Complex } from '@/types';

export default function ComplexesPage() {
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadComplexes();
  }, [page, search]);

  const loadComplexes = async () => {
    setIsLoading(true);
    try {
      const response = await api.getComplexes({ page, limit: 24, search: search || undefined }) as unknown as {
        success: boolean;
        data: Complex[];
        pagination: { total_pages: number };
      };
      if (response.success && response.data) {
        setComplexes(response.data);
        setTotalPages(response.pagination.total_pages);
      }
    } catch (error) {
      console.error('Failed to load complexes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadComplexes();
  };

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-semibold mb-8">Жилые комплексы</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3 max-w-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию ЖК..."
            className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <button
            type="submit"
            className="btn btn-primary"
          >
            Найти
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
          ))}
        </div>
      ) : complexes.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-[var(--color-text-light)]">
            {search ? 'Ничего не найдено' : 'Нет жилых комплексов'}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complexes.map((complex) => (
              <Link
                key={complex.id}
                href={`/complexes/${complex.id}`}
                className="bg-white border border-[var(--color-border)] rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-lg font-semibold mb-2">{complex.name}</h2>
                {complex.district && (
                  <div className="text-sm text-[var(--color-text-light)] mb-3">
                    {complex.district}
                  </div>
                )}
                <div className="text-sm text-[var(--color-text-light)] mb-4">
                  {complex.address}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[var(--color-text-light)]">Квартиры</div>
                    <div className="font-medium">{complex.offers_count}</div>
                  </div>
                  <div>
                    <div className="text-[var(--color-text-light)]">Цены</div>
                    <div className="font-medium">
                      от {formatPrice(Number(complex.min_price))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--color-text-light)]">Площадь</div>
                    <div className="font-medium">
                      {Number(complex.min_area).toFixed(0)}–{Number(complex.max_area).toFixed(0)} м²
                    </div>
                  </div>
                  {complex.building_state && (
                    <div>
                      <div className="text-[var(--color-text-light)]">Статус</div>
                      <div className="font-medium">
                        {complex.building_state === 'hand-over' ? 'Сдан' : 'Строится'}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-[var(--color-border)] rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Назад
              </button>
              <span className="px-4 py-2 text-[var(--color-text-light)]">
                {page} из {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-[var(--color-border)] rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
