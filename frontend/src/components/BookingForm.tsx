'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface BookingFormProps {
  offerId: number;
  complexName: string;
}

export function BookingForm({ offerId, complexName }: BookingFormProps) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Предзаполняем данные из профиля пользователя
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        clientName: user.name || prev.clientName,
        clientPhone: user.phone || prev.clientPhone,
        clientEmail: user.email || prev.clientEmail,
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.createBooking({
        offerId,
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientEmail: formData.clientEmail || undefined,
        comment: formData.comment || undefined,
      });

      if (response.success) {
        setIsSuccess(true);
        setFormData({ clientName: '', clientPhone: '', clientEmail: '', comment: '' });
      } else {
        setError(response.error || 'Ошибка отправки заявки');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-lg font-medium mb-2">Заявка отправлена!</div>
        <div className="text-sm text-green-700">
          Мы свяжемся с вами в ближайшее время
        </div>
        <button
          onClick={() => setIsSuccess(false)}
          className="mt-4 text-sm text-green-600 hover:text-green-700"
        >
          Отправить ещё одну заявку
        </button>
      </div>
    );
  }

  // Блок для неавторизованных — блюр с призывом войти
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="border border-[var(--color-border)] rounded-lg relative overflow-hidden">
        {/* Заблюренная форма */}
        <div className="blur-[4px] opacity-50 pointer-events-none select-none">
          <div className="w-full px-6 py-4 flex items-center justify-between">
            <span className="font-medium">Оставить заявку на просмотр</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="px-6 pb-6 space-y-4">
            <div className="h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Оверлей с призывом */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/40">
          <div className="bg-white p-5 rounded-xl shadow-lg text-center max-w-xs border border-[var(--color-border)]">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text)] mb-3">
              Войдите, чтобы оставить заявку на просмотр
            </p>
            <Link href="/login" className="btn btn-primary btn-sm">
              Войти
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--color-border)] rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium">Оставить заявку на просмотр</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="text-sm text-[var(--color-text-light)] mb-4">
            Объект: {complexName}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ваше имя *</label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Телефон *</label>
            <input
              type="tel"
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              placeholder="+7 (___) ___-__-__"
              required
              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Комментарий</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={3}
              placeholder="Удобное время для связи, вопросы..."
              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !formData.clientName || !formData.clientPhone}
            className="btn btn-primary btn-block"
          >
            {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
          </button>

          <div className="text-xs text-[var(--color-text-light)] text-center">
            Нажимая кнопку, вы соглашаетесь на обработку персональных данных
          </div>
        </form>
      )}
    </div>
  );
}
