'use client';

import { useState } from 'react';
import { api } from '@/services/api';
import type { Selection } from '@/types';

interface BulkActionsBarProps {
  selectedIds: Set<number>;
  onClearSelection: () => void;
  onAddedToSelection?: () => void;
}

export function BulkActionsBar({ selectedIds, onClearSelection, onAddedToSelection }: BulkActionsBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [newSelectionName, setNewSelectionName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const count = selectedIds.size;

  if (count === 0) return null;

  const loadSelections = async () => {
    try {
      const response = await api.getSelections();
      if (response.success && response.data) {
        setSelections(response.data);
      }
    } catch (error) {
      console.error('Failed to load selections:', error);
    }
  };

  const handleOpenModal = async () => {
    setShowSelectionModal(true);
    await loadSelections();
  };

  const handleAddToSelection = async (selectionId: number) => {
    setIsLoading(true);
    try {
      const offerIds = Array.from(selectedIds);
      let successCount = 0;

      for (const offerId of offerIds) {
        try {
          await api.addSelectionItem(selectionId, offerId);
          successCount++;
        } catch {
          // Игнорируем ошибки для отдельных квартир (возможно уже добавлены)
        }
      }

      alert(`Добавлено ${successCount} из ${offerIds.length} квартир в подборку`);
      setShowSelectionModal(false);
      onClearSelection();
      onAddedToSelection?.();
    } catch (error) {
      console.error('Failed to add to selection:', error);
      alert('Не удалось добавить в подборку');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newSelectionName.trim()) {
      alert('Введите название подборки');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.createSelection({ name: newSelectionName.trim() });
      if (response.success && response.data) {
        await handleAddToSelection(response.data.id);
        setNewSelectionName('');
        setIsCreatingNew(false);
      }
    } catch (error) {
      console.error('Failed to create selection:', error);
      alert('Не удалось создать подборку');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToFavorites = async () => {
    setIsLoading(true);
    try {
      const offerIds = Array.from(selectedIds);
      for (const offerId of offerIds) {
        try {
          await api.addFavorite(offerId);
        } catch {
          // Ignore errors for individual items
        }
      }
      alert(`Добавлено ${offerIds.length} квартир в избранное`);
      onClearSelection();
    } catch (error) {
      console.error('Failed to add to favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCompare = () => {
    const offerIds = Array.from(selectedIds);
    // Добавляем в localStorage для сравнения
    const existingCompare = JSON.parse(localStorage.getItem('compare_offers') || '[]');
    const newCompare = [...new Set([...existingCompare, ...offerIds])].slice(0, 10); // Max 10
    localStorage.setItem('compare_offers', JSON.stringify(newCompare));
    alert(`Добавлено ${offerIds.length} квартир к сравнению`);
    onClearSelection();
  };

  return (
    <>
      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--color-border)] shadow-lg">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                Выбрано: {count} {count === 1 ? 'квартира' : count < 5 ? 'квартиры' : 'квартир'}
              </span>
              <button
                onClick={onClearSelection}
                className="text-sm text-[var(--color-text-light)] hover:text-[var(--color-text)]"
              >
                Очистить
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToCompare}
                disabled={isLoading}
                className="px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Сравнить
              </button>

              <button
                onClick={handleAddToFavorites}
                disabled={isLoading}
                className="px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                В избранное
              </button>

              <button
                onClick={handleOpenModal}
                disabled={isLoading}
                className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                В подборку
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Modal */}
      {showSelectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSelectionModal(false)}
          />

          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-semibold">Добавить в подборку</h2>
              <button
                onClick={() => setShowSelectionModal(false)}
                className="text-[var(--color-text-light)] hover:text-[var(--color-text)]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {/* Existing selections */}
              {selections.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-[var(--color-text-light)] mb-2">
                    Выберите подборку
                  </div>
                  <div className="space-y-2">
                    {selections.map((selection) => (
                      <button
                        key={selection.id}
                        onClick={() => handleAddToSelection(selection.id)}
                        disabled={isLoading}
                        className="w-full text-left px-4 py-3 border border-[var(--color-border)] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <div className="font-medium">{selection.name}</div>
                        {selection.client_name && (
                          <div className="text-sm text-[var(--color-text-light)]">
                            Для: {selection.client_name}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create new */}
              <div className="border-t border-[var(--color-border)] pt-4">
                {isCreatingNew ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newSelectionName}
                      onChange={(e) => setNewSelectionName(e.target.value)}
                      placeholder="Название подборки"
                      className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateAndAdd}
                        disabled={isLoading || !newSelectionName.trim()}
                        className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isLoading ? 'Создание...' : 'Создать и добавить'}
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingNew(false);
                          setNewSelectionName('');
                        }}
                        className="px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingNew(true)}
                    className="w-full px-4 py-3 border border-dashed border-[var(--color-border)] rounded-lg hover:bg-gray-50 transition-colors text-[var(--color-text-light)] flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Создать новую подборку
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
