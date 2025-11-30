import { api, formatPrice, formatArea, formatRooms } from '@/services/api';
import Link from 'next/link';
import type { SelectionDetail } from '@/types';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function SharedSelectionPage({ params }: Props) {
  const { code } = await params;

  let selection: SelectionDetail | null = null;
  let error: string | null = null;

  try {
    const response = await api.getSharedSelection(code);
    if (response.success && response.data) {
      selection = response.data;
    } else {
      error = response.error || 'Подборка не найдена';
    }
  } catch (e) {
    error = 'Ошибка загрузки подборки';
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
          className="inline-block px-6 py-3 bg-[var(--color-text)] text-white rounded-lg hover:bg-[var(--color-text-light)] transition-colors"
        >
          На главную
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="text-center mb-12">
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

      {selection.items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-[var(--color-text-light)]">
            В подборке пока нет объектов
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selection.items.map((item) => (
            <Link
              key={item.id}
              href={`/offers/${item.offer_id}`}
              className="bg-white rounded-lg overflow-hidden border border-[var(--color-border)] hover:shadow-lg transition-shadow"
            >
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

              <div className="p-4">
                {item.offer && (
                  <>
                    <div className="text-lg font-semibold mb-1">
                      {formatPrice(item.offer.price)}
                    </div>
                    <div className="text-sm text-[var(--color-text-light)] mb-2">
                      {formatRooms(item.offer.rooms, item.offer.is_studio)} · {formatArea(item.offer.area_total)} · {item.offer.floor}/{item.offer.floors_total} эт.
                    </div>
                    <div className="text-sm font-medium">{item.offer.complex_name}</div>
                    {item.offer.district_name && (
                      <div className="text-sm text-[var(--color-text-light)]">
                        {item.offer.district_name}
                      </div>
                    )}
                  </>
                )}
                {item.comment && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-[var(--color-text-light)] italic">
                    Комментарий агента: {item.comment}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-sm text-[var(--color-text-light)] mb-4">
          Понравился объект? Свяжитесь с агентом для получения дополнительной информации
        </p>
      </div>
    </div>
  );
}
