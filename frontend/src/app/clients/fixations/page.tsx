'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, formatPrice } from '@/services/api';
import type { FixationWithOffer, FixationStatus } from '@/types';

const STATUSES: { value: FixationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'Ожидают' },
  { value: 'approved', label: 'Одобрены' },
  { value: 'rejected', label: 'Отклонены' },
  { value: 'expired', label: 'Истекли' },
  { value: 'converted', label: 'В бронь' },
];

const STATUS_COLORS: Record<FixationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
  converted: 'bg-blue-100 text-blue-800',
};

const STATUS_LABELS: Record<FixationStatus, string> = {
  pending: 'Ожидает',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  expired: 'Истекло',
  converted: 'В бронь',
};

export default function FixationsPage() {
  const [fixations, setFixations] = useState<FixationWithOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FixationStatus | 'all'>('all');

  const loadFixations = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const response = await api.getFixations(filters);
      if (response.success && response.data) {
        setFixations(response.data);
      }
    } catch (error) {
      console.error('Failed to load fixations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadFixations();
  }, [loadFixations]);

  const handleConvert = async (id: number) => {
    if (!confirm('Конвертировать фиксацию в бронь?')) return;

    try {
      const response = await api.convertFixationToBooking(id);
      if (response.success) {
        loadFixations();
      }
    } catch (error) {
      console.error('Failed to convert:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить фиксацию?')) return;

    try {
      const response = await api.deleteFixation(id);
      if (response.success) {
        loadFixations();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysLeft = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === s.value
                ? 'bg-[var(--color-text)] text-white'
                : 'bg-[var(--color-bg-gray)] hover:bg-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* List */}
      {fixations.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-light)]">
          <p className="mb-4">Нет фиксаций</p>
          <Link href="/offers" className="text-[var(--color-accent)]">
            Перейти к объектам
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {fixations.map(f => {
            const daysLeft = getDaysLeft(f.expires_at);

            return (
              <div key={f.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="font-medium text-lg">{f.lock_number}</div>
                    <div className="text-sm text-[var(--color-text-light)]">
                      {f.client_name} • {f.client_phone}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[f.status]}`}>
                    {STATUS_LABELS[f.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <div className="text-[var(--color-text-light)]">Объект</div>
                    <div className="font-medium">{f.complex_name || 'Не указан'}</div>
                    <div className="text-[var(--color-text-light)]">
                      {f.offer_rooms ? `${f.offer_rooms} комн` : '—'}, {f.offer_area ? `${f.offer_area} м²` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--color-text-light)]">Зафиксированная цена</div>
                    <div className="font-medium">{formatPrice(f.locked_price)}</div>
                  </div>
                  <div>
                    <div className="text-[var(--color-text-light)]">Срок</div>
                    <div className="font-medium">{f.requested_days} дней</div>
                    {f.status === 'approved' && f.expires_at && (
                      <div className={`text-sm ${daysLeft && daysLeft <= 2 ? 'text-red-600' : 'text-[var(--color-text-light)]'}`}>
                        {daysLeft !== null ? (daysLeft > 0 ? `Осталось ${daysLeft} дн.` : 'Истекает сегодня') : ''}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[var(--color-text-light)]">Создана</div>
                    <div className="font-medium">{formatDate(f.created_at)}</div>
                  </div>
                </div>

                {f.agent_comment && (
                  <div className="text-sm text-[var(--color-text-light)] mb-4 p-3 bg-[var(--color-bg-gray)] rounded">
                    {f.agent_comment}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/offers/${f.offer_id}`}
                    className="btn btn-sm btn-secondary"
                  >
                    Объект
                  </Link>

                  {f.status === 'approved' && (
                    <button
                      onClick={() => handleConvert(f.id)}
                      className="btn btn-sm btn-primary"
                    >
                      Конвертировать в бронь
                    </button>
                  )}

                  {f.status === 'pending' && (
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="btn btn-sm text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Удалить
                    </button>
                  )}

                  {f.booking_id && (
                    <span className="text-sm text-[var(--color-text-light)] self-center">
                      Бронь #{f.booking_id}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
