'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, formatPrice, formatArea, formatRooms } from '@/services/api';
import { OfferCard } from '@/components/OfferCard';
import type { ComplexDetail, OfferListItem } from '@/types';

export default function ComplexDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [complex, setComplex] = useState<ComplexDetail | null>(null);
  const [offers, setOffers] = useState<OfferListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!id) return;

    api.getComplexById(id)
      .then(res => {
        if (res.success && res.data) {
          setComplex(res.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!complex) return;

    setOffersLoading(true);
    api.getOffers({ complex_id: complex.id }, { page, limit: 12 })
      .then(res => {
        if (res.success && res.data) {
          setOffers(res.data.data);
          setTotalPages(res.data.pagination.total_pages);
        }
      })
      .finally(() => setOffersLoading(false));
  }, [complex, page]);

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!complex) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">ЖК не найден</h1>
        <Link href="/complexes" className="text-[var(--color-accent)]">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <Link href="/complexes" className="text-[var(--color-text-light)] hover:text-[var(--color-text)]">
          Жилые комплексы
        </Link>
        <span className="mx-2 text-[var(--color-text-light)]">/</span>
        <span>{complex.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-semibold mb-4">{complex.name}</h1>
        <div className="flex flex-wrap gap-6 text-sm">
          {complex.district && (
            <div>
              <span className="text-[var(--color-text-light)]">Район: </span>
              <span className="font-medium">{complex.district}</span>
            </div>
          )}
          <div>
            <span className="text-[var(--color-text-light)]">Адрес: </span>
            <span className="font-medium">{complex.address}</span>
          </div>
          {complex.metro_station && (
            <div>
              <span className="text-[var(--color-text-light)]">Метро: </span>
              <span className="font-medium">
                {complex.metro_station}
                {complex.metro_distance && ` (${complex.metro_distance} мин)`}
              </span>
            </div>
          )}
          {complex.developer_name && (
            <div>
              <span className="text-[var(--color-text-light)]">Застройщик: </span>
              <span className="font-medium">{complex.developer_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-5">
          <div className="text-[var(--color-text-light)] text-sm mb-1">Квартир</div>
          <div className="text-2xl font-semibold">{complex.offers_count}</div>
        </div>
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-5">
          <div className="text-[var(--color-text-light)] text-sm mb-1">Цены от</div>
          <div className="text-2xl font-semibold">{formatPrice(Number(complex.min_price))}</div>
        </div>
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-5">
          <div className="text-[var(--color-text-light)] text-sm mb-1">Площадь</div>
          <div className="text-2xl font-semibold">
            {Number(complex.min_area).toFixed(0)}–{Number(complex.max_area).toFixed(0)} м²
          </div>
        </div>
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-5">
          <div className="text-[var(--color-text-light)] text-sm mb-1">Статус</div>
          <div className="text-2xl font-semibold">
            {complex.building_state === 'hand-over' ? 'Сдан' : 'Строится'}
          </div>
        </div>
      </div>

      {/* Description */}
      {complex.description && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">О комплексе</h2>
          <div className="text-[var(--color-text-light)] whitespace-pre-line">
            {complex.description}
          </div>
        </div>
      )}

      {/* Offers */}
      <div>
        <h2 className="text-xl font-semibold mb-6">
          Квартиры в продаже ({complex.offers_count})
        </h2>

        {offersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-light)]">
            Нет доступных квартир
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
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
    </div>
  );
}
