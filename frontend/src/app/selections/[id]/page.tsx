'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api, formatPrice, formatArea, formatRooms } from '@/services/api';
import { ShareSelectionModal } from '@/components/ShareSelectionModal';
import { SelectionItemStatus, type ItemStatus } from '@/components/SelectionItemStatus';
import { SelectionActivityLog } from '@/components/SelectionActivityLog';
import type { SelectionDetail } from '@/types';

export default function SelectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [selection, setSelection] = useState<SelectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  const id = Number(params.id);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || (user?.role !== 'agent' && user?.role !== 'admin')) {
      router.push('/login');
      return;
    }

    loadSelection();
  }, [isAuthenticated, authLoading, user, router, id]);

  const loadSelection = async () => {
    try {
      const response = await api.getSelection(id);
      if (response.success && response.data) {
        setSelection(response.data);
      }
    } catch (error) {
      console.error('Failed to load selection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (offerId: number) => {
    if (!selection) return;

    try {
      await api.removeSelectionItem(selection.id, offerId);
      setSelection({
        ...selection,
        items: selection.items.filter(item => item.offer_id !== offerId),
      });
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selection) {
    return (
      <div className="container py-12 text-center">
        <div className="text-xl mb-4">Подборка не найдена</div>
        <Link href="/selections" className="text-[var(--color-accent)]">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/selections" className="text-sm text-[var(--color-text-light)] hover:text-[var(--color-text)] mb-2 inline-block">
            &larr; К списку подборок
          </Link>
          <h1 className="text-2xl font-semibold">{selection.name}</h1>
          {selection.client_name && (
            <div className="text-[var(--color-text-light)] mt-1">
              Для: {selection.client_name}
              {selection.client_email && ` (${selection.client_email})`}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Поделиться
        </button>
      </div>

      {selection.items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-[var(--color-text-light)] mb-4">
            В подборке пока нет объектов
          </div>
          <Link
            href="/offers"
            className="inline-block px-6 py-3 bg-[var(--color-text)] text-white rounded-lg hover:bg-[var(--color-text-light)] transition-colors"
          >
            Добавить из каталога
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selection.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg overflow-hidden border border-[var(--color-border)] relative"
            >
              {/* Badge for client-added items */}
              {item.added_by === 'client' && (
                <div className="absolute top-3 left-3 z-10 bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
                  Добавлено клиентом
                </div>
              )}

              <Link href={`/offers/${item.offer_id}`}>
                <div className="aspect-[4/3] bg-gray-100">
                  {item.offer?.image_url ? (
                    <img
                      src={item.offer.image_url}
                      alt={item.offer.complex_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Нет фото
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4">
                {item.offer && (
                  <>
                    <Link href={`/offers/${item.offer_id}`}>
                      <div className="text-lg font-semibold mb-1 hover:text-[var(--color-accent)]">
                        {formatPrice(item.offer.price)}
                      </div>
                    </Link>
                    <div className="text-sm text-[var(--color-text-light)] mb-2">
                      {formatRooms(item.offer.rooms, item.offer.is_studio)} · {formatArea(item.offer.area_total)} · {item.offer.floor}/{item.offer.floors_total} эт.
                    </div>
                    <div className="text-sm font-medium">{item.offer.complex_name}</div>
                  </>
                )}
                {item.comment && (
                  <div className="mt-2 text-sm text-[var(--color-text-light)] italic">
                    {item.comment}
                  </div>
                )}

                {/* Status & Actions */}
                <div className="mt-3 flex items-center justify-between">
                  <SelectionItemStatus
                    selectionId={selection.id}
                    offerId={item.offer_id}
                    currentStatus={(item.status as ItemStatus) || 'pending'}
                  />
                  <button
                    onClick={() => handleRemoveItem(item.offer_id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Activity Log */}
      <div className="mt-12">
        <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
          <SelectionActivityLog selectionId={selection.id} />
        </div>
      </div>

      {/* Share Modal */}
      <ShareSelectionModal
        selection={selection}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
