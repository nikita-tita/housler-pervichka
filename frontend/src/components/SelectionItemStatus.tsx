'use client';

import { useState } from 'react';
import { api } from '@/services/api';

export type ItemStatus = 'pending' | 'shown' | 'interested' | 'rejected';

interface SelectionItemStatusProps {
  selectionId: number;
  offerId: number;
  currentStatus?: ItemStatus;
  onStatusChange?: (newStatus: ItemStatus) => void;
}

const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Ожидает', color: 'text-gray-600', bg: 'bg-gray-100' },
  shown: { label: 'Показан', color: 'text-blue-600', bg: 'bg-blue-100' },
  interested: { label: 'Интерес', color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: 'Отказ', color: 'text-red-600', bg: 'bg-red-100' },
};

export function SelectionItemStatus({
  selectionId,
  offerId,
  currentStatus = 'pending',
  onStatusChange,
}: SelectionItemStatusProps) {
  const [status, setStatus] = useState<ItemStatus>(currentStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const config = STATUS_CONFIG[status];

  const handleStatusChange = async (newStatus: ItemStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      await api.updateSelectionItemStatus(selectionId, offerId, newStatus);
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`
          px-3 py-1.5 rounded-full text-xs font-medium transition-colors
          ${config.bg} ${config.color}
          hover:opacity-80 disabled:opacity-50
        `}
      >
        {isUpdating ? (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        ) : (
          config.label
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-lg shadow-lg border border-[var(--color-border)] py-1 min-w-[140px]">
            {(Object.keys(STATUS_CONFIG) as ItemStatus[]).map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`
                    w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50
                    ${s === status ? 'bg-gray-50' : ''}
                  `}
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.bg}`} />
                  <span className={cfg.color}>{cfg.label}</span>
                  {s === status && (
                    <svg className="w-4 h-4 ml-auto text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
