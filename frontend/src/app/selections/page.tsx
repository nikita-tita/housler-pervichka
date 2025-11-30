'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Selection } from '@/types';

export default function SelectionsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSelection, setNewSelection] = useState({
    name: '',
    clientName: '',
    clientEmail: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || (user?.role !== 'agent' && user?.role !== 'admin')) {
      router.push('/login');
      return;
    }

    loadSelections();
  }, [isAuthenticated, authLoading, user, router]);

  const loadSelections = async () => {
    try {
      const response = await api.getSelections();
      if (response.success && response.data) {
        setSelections(response.data);
      }
    } catch (error) {
      console.error('Failed to load selections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSelection.name.trim()) return;

    setCreating(true);
    try {
      const response = await api.createSelection({
        name: newSelection.name,
        clientName: newSelection.clientName || undefined,
        clientEmail: newSelection.clientEmail || undefined,
      });
      if (response.success && response.data) {
        setSelections([response.data, ...selections]);
        setShowCreateModal(false);
        setNewSelection({ name: '', clientName: '', clientEmail: '' });
      }
    } catch (error) {
      console.error('Failed to create selection:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить подборку?')) return;

    try {
      await api.deleteSelection(id);
      setSelections(selections.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete selection:', error);
    }
  };

  const copyShareLink = (code: string) => {
    const url = `${window.location.origin}/s/${code}`;
    navigator.clipboard.writeText(url);
    alert('Ссылка скопирована!');
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

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Мои подборки</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-[var(--color-text)] text-white rounded-lg hover:bg-[var(--color-text-light)] transition-colors"
        >
          Создать подборку
        </button>
      </div>

      {selections.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-[var(--color-text-light)] mb-4">
            У вас пока нет подборок
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-block px-6 py-3 bg-[var(--color-text)] text-white rounded-lg hover:bg-[var(--color-text-light)] transition-colors"
          >
            Создать первую подборку
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {selections.map((selection) => (
            <div
              key={selection.id}
              className="bg-white border border-[var(--color-border)] rounded-lg p-5 flex items-center justify-between"
            >
              <div>
                <Link
                  href={`/selections/${selection.id}`}
                  className="font-medium text-lg hover:text-[var(--color-accent)]"
                >
                  {selection.name}
                </Link>
                <div className="text-sm text-[var(--color-text-light)] mt-1">
                  {selection.items_count} объектов
                  {selection.client_name && ` • Для: ${selection.client_name}`}
                </div>
                <div className="text-xs text-[var(--color-text-light)] mt-1">
                  Создана: {new Date(selection.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => copyShareLink(selection.share_code)}
                  className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Копировать ссылку
                </button>
                <Link
                  href={`/selections/${selection.id}`}
                  className="px-4 py-2 text-sm bg-[var(--color-text)] text-white rounded-lg hover:bg-[var(--color-text-light)] transition-colors"
                >
                  Открыть
                </Link>
                <button
                  onClick={() => handleDelete(selection.id)}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Новая подборка</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input
                  type="text"
                  value={newSelection.name}
                  onChange={(e) => setNewSelection({ ...newSelection, name: e.target.value })}
                  placeholder="Например: Квартиры для Ивановых"
                  required
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Имя клиента</label>
                <input
                  type="text"
                  value={newSelection.clientName}
                  onChange={(e) => setNewSelection({ ...newSelection, clientName: e.target.value })}
                  placeholder="Иван Иванов"
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email клиента</label>
                <input
                  type="email"
                  value={newSelection.clientEmail}
                  onChange={(e) => setNewSelection({ ...newSelection, clientEmail: e.target.value })}
                  placeholder="client@example.com"
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={creating || !newSelection.name.trim()}
                  className="flex-1 px-4 py-2.5 bg-[var(--color-text)] text-white rounded-lg hover:bg-[var(--color-text-light)] transition-colors disabled:opacity-50"
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
