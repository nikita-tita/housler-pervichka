'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, formatPrice, formatArea, formatRooms } from '@/services/api';
import { useClientSelection } from '@/contexts/ClientSelectionContext';
import { AddToClientSelectionButton } from '@/components/AddToClientSelectionButton';
import type { SelectionDetail } from '@/types';

export default function SharedSelectionPage() {
  const params = useParams();
  const code = params.code as string;

  const { setActiveSelectionCode, activeSelectionCode } = useClientSelection();
  const [selection, setSelection] = useState<SelectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Активируем подборку при загрузке страницы
  useEffect(() => {
    if (code && code !== activeSelectionCode) {
      setActiveSelectionCode(code);
    }
  }, [code, activeSelectionCode, setActiveSelectionCode]);

  // Загружаем данные подборки
  useEffect(() => {
    if (!code) return;

    const loadSelection = async () => {
      setIsLoading(true);
      try {
        const response = await api.getSharedSelection(code);
        if (response.success && response.data) {
          setSelection(response.data);
        } else {
          setError(response.error || 'Подборка не найдена');
        }
      } catch {
        setError('Ошибка загрузки подборки');
      } finally {
        setIsLoading(false);
      }
    };

    loadSelection();
  }, [code]);

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !selection) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Подборка не найдена</h1>
        <p className="text-[var(--color-text-light)] mb-8">
          Возможно, ссылка устарела или подборка была удалена
        </p>
        <Link
          href="/"
          className="btn btn-primary"
        >
          На главную
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-3">{selection.name}</h1>
        {selection.client_name && (
          <p className="text-lg text-[var(--color-text-light)]">
            Специально для вас, {selection.client_name}
          </p>
        )}
        <p className="text-sm text-[var(--color-text-light)] mt-2">
          {selection.items.length} {selection.items.length === 1 ? 'объект' : selection.items.length < 5 ? 'объекта' : 'объектов'}
        </p>
      </div>

      {/* CTA: Search more */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
        <p className="text-sm text-blue-800 mb-3">
          Хотите найти ещё варианты? Ищите по всей базе и добавляйте в эту подборку!
        </p>
        <Link
          href="/offers"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Искать квартиры
        </Link>
      </div>

      {/* Items */}
      {selection.items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-[var(--color-text-light)] mb-4">
            В подборке пока нет объектов
          </div>
          <Link
            href="/offers"
            className="btn btn-primary btn-sm"
          >
            Найти квартиры
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selection.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg overflow-hidden border border-[var(--color-border)] hover:shadow-lg transition-shadow relative"
            >
              {/* Проверяем доступность объекта */}
              {item.price !== null && item.price !== undefined ? (
                <>
                  {/* Added by badge */}
                  {item.added_by === 'client' && (
                    <div className="absolute top-3 left-3 z-10 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Вы добавили
                    </div>
                  )}

                  {/* Selection button */}
                  <div className="absolute top-3 right-3 z-10">
                    <AddToClientSelectionButton offerId={item.offer_id} size="sm" />
                  </div>

                  <Link href={`/offers/${item.offer_id}`}>
                    <div className="aspect-[4/3] bg-gray-100">
                      {item.main_image ? (
                        <img
                          src={item.main_image}
                          alt={item.building_name || item.complex_name || 'Квартира'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-light)]">
                          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="text-lg font-semibold mb-1">
                        {formatPrice(item.price)}
                      </div>
                      <div className="text-sm text-[var(--color-text-light)] mb-2">
                        {formatRooms(item.rooms, item.is_studio)} · {formatArea(item.area_total ?? 0)} · {item.floor}/{item.floors_total} эт.
                      </div>
                      <div className="text-sm font-medium">{item.complex_name || item.building_name}</div>
                      {item.district && (
                        <div className="text-sm text-[var(--color-text-light)]">
                          {item.district}
                          {item.metro_name && ` · м. ${item.metro_name}`}
                        </div>
                      )}

                      {item.comment && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-[var(--color-text-light)] italic">
                          Комментарий: {item.comment}
                        </div>
                      )}
                    </div>
                  </Link>
                </>
              ) : (
                /* Объект недоступен */
                <div className="p-4">
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center mb-4 rounded">
                    <div className="text-center text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <span className="text-sm">Объект недоступен</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Этот объект был снят с продажи
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-[var(--color-text-light)] mb-4">
          Понравился объект? Свяжитесь с агентом для получения дополнительной информации
        </p>
        <Link
          href="/offers"
          className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Искать ещё квартиры
        </Link>
      </div>
    </div>
  );
}
