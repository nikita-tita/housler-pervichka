'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { api, formatPrice, formatArea, formatRooms, formatFloor } from '@/services/api';
import { FavoriteButton } from '@/components/FavoriteButton';
import { BookingForm } from '@/components/BookingForm';
import { AddToSelectionButton } from '@/components/AddToSelectionButton';
import { MortgageCalculator } from '@/components/MortgageCalculator';
import { YandexMap } from '@/components/YandexMap';
import { PriceHistoryChart } from '@/components/PriceHistoryChart';
import type { OfferDetail } from '@/types';

export default function OfferDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;

    api.getOfferById(id)
      .then(res => {
        if (res.success && res.data) {
          setOffer(res.data);
        } else {
          setError(res.error || 'Объявление не найдено');
        }
      })
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="section">
        <div className="container">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--color-bg-gray)] rounded w-1/4 mb-8"></div>
            <div className="grid lg:grid-cols-[1fr_400px] gap-8">
              <div className="aspect-[4/3] bg-[var(--color-bg-gray)] rounded-lg"></div>
              <div>
                <div className="h-10 bg-[var(--color-bg-gray)] rounded mb-4"></div>
                <div className="h-6 bg-[var(--color-bg-gray)] rounded w-2/3 mb-8"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-5 bg-[var(--color-bg-gray)] rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="section">
        <div className="container text-center">
          <div className="text-xl font-medium mb-4">
            {error || 'Объявление не найдено'}
          </div>
          <Link href="/offers" className="btn btn-primary">
            Вернуться к поиску
          </Link>
        </div>
      </div>
    );
  }

  const images = offer.images?.length ? offer.images : (offer.image_url ? [offer.image_url] : []);

  return (
    <div className="section">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link href="/offers" className="text-[var(--color-text-light)] hover:text-[var(--color-text)]">
            Квартиры
          </Link>
          <span className="mx-2 text-[var(--color-text-light)]">/</span>
          <span>{offer.complex_name}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
          {/* Gallery */}
          <div>
            <div className="aspect-[4/3] bg-[var(--color-bg-gray)] rounded-lg overflow-hidden mb-4">
              {images.length > 0 ? (
                <img
                  src={images[activeImage]}
                  alt={`${formatRooms(offer.rooms, offer.is_studio)} в ЖК ${offer.complex_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--color-text-light)]">
                  <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === activeImage ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {/* Price */}
            <div className="mb-6">
              <div className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
                {formatPrice(offer.price)}
              </div>
              <div className="text-[var(--color-text-light)]">
                {formatPrice(offer.price_per_sqm)}/м²
              </div>
            </div>

            {/* Price History */}
            <div className="mb-6">
              <PriceHistoryChart offerId={offer.id} />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold mb-2">
              {formatRooms(offer.rooms, offer.is_studio)}, {formatArea(offer.area_total)}
            </h1>
            <p className="text-[var(--color-text-light)] mb-8">
              {formatFloor(offer.floor, offer.floors_total)}
            </p>

            {/* Details Grid */}
            <div className="card p-6 mb-6">
              <h2 className="font-semibold mb-4">Характеристики</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <span className="text-[var(--color-text-light)]">Общая площадь</span>
                  <div className="font-medium">{formatArea(offer.area_total)}</div>
                </div>
                {offer.area_living && (
                  <div>
                    <span className="text-[var(--color-text-light)]">Жилая площадь</span>
                    <div className="font-medium">{formatArea(offer.area_living)}</div>
                  </div>
                )}
                {offer.area_kitchen && (
                  <div>
                    <span className="text-[var(--color-text-light)]">Кухня</span>
                    <div className="font-medium">{formatArea(offer.area_kitchen)}</div>
                  </div>
                )}
                <div>
                  <span className="text-[var(--color-text-light)]">Этаж</span>
                  <div className="font-medium">{formatFloor(offer.floor, offer.floors_total)}</div>
                </div>
                {offer.ceiling_height && (
                  <div>
                    <span className="text-[var(--color-text-light)]">Высота потолков</span>
                    <div className="font-medium">{offer.ceiling_height} м</div>
                  </div>
                )}
                {offer.balcony && (
                  <div>
                    <span className="text-[var(--color-text-light)]">Балкон/лоджия</span>
                    <div className="font-medium">{offer.balcony}</div>
                  </div>
                )}
                {offer.bathroom && (
                  <div>
                    <span className="text-[var(--color-text-light)]">Санузел</span>
                    <div className="font-medium">{offer.bathroom}</div>
                  </div>
                )}
                <div>
                  <span className="text-[var(--color-text-light)]">Отделка</span>
                  <div className="font-medium">{offer.has_finishing ? 'Да' : 'Без отделки'}</div>
                </div>
              </div>
            </div>

            {/* Complex Info */}
            <div className="card p-6 mb-6">
              <h2 className="font-semibold mb-4">Жилой комплекс</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-[var(--color-text-light)]">Название</span>
                  <div className="font-medium">{offer.complex_name}</div>
                </div>
                {offer.developer_name && (
                  <div>
                    <span className="text-[var(--color-text-light)]">Застройщик</span>
                    <div className="font-medium">{offer.developer_name}</div>
                  </div>
                )}
                <div>
                  <span className="text-[var(--color-text-light)]">Адрес</span>
                  <div className="font-medium">{offer.complex_address}</div>
                </div>
                <div>
                  <span className="text-[var(--color-text-light)]">Район</span>
                  <div className="font-medium">{offer.district_name}</div>
                </div>
                {offer.metro_station && (
                  <div>
                    <span className="text-[var(--color-text-light)]">Метро</span>
                    <div className="font-medium">
                      {offer.metro_station}
                      {offer.metro_distance && ` (${offer.metro_distance} мин пешком)`}
                    </div>
                  </div>
                )}
                {offer.completion_date && (
                  <div>
                    <span className="text-[var(--color-text-light)]">Срок сдачи</span>
                    <div className="font-medium">{offer.completion_date}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-6">
              <FavoriteButton offerId={offer.id} size="lg" />
              <AddToSelectionButton offerId={offer.id} />
            </div>

            {/* CTA */}
            <BookingForm offerId={offer.id} complexName={offer.complex_name} />

            {/* Mortgage Calculator */}
            <MortgageCalculator price={offer.price} className="mt-6" />
          </div>
        </div>

        {/* Description */}
        {offer.description && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Описание</h2>
            <div className="prose max-w-none text-[var(--color-text-light)]">
              {offer.description}
            </div>
          </div>
        )}

        {/* Map */}
        {offer.latitude && offer.longitude && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Расположение</h2>
            <YandexMap
              latitude={offer.latitude}
              longitude={offer.longitude}
              address={offer.complex_address}
            />
          </div>
        )}
      </div>
    </div>
  );
}
