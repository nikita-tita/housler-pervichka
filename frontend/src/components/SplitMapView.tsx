'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import type { OfferListItem } from '@/types';
import { formatPrice, formatRooms } from '@/services/api';
import { OfferCard } from './OfferCard';

declare global {
  interface Window {
    ymaps: any;
  }
}

interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  price: number;
  rooms: number;
  is_studio: boolean;
}

interface SplitMapViewProps {
  offers: OfferListItem[];
  markers: MapMarker[];
  showMap: boolean;
  onToggleMap: () => void;
}

export function SplitMapView({ offers, markers, showMap, onToggleMap }: SplitMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const placemarkRefs = useRef<Map<number, any>>(new Map());

  const [isMapReady, setIsMapReady] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // Initialize map
  const initMap = useCallback(() => {
    if (!window.ymaps || !mapContainerRef.current || mapRef.current) return;

    window.ymaps.ready(() => {
      const map = new window.ymaps.Map(mapContainerRef.current, {
        center: [59.93, 30.31],
        zoom: 11,
        controls: ['zoomControl'],
      });

      mapRef.current = map;

      const clusterer = new window.ymaps.Clusterer({
        preset: 'islands#invertedDarkBlueClusterIcons',
        groupByCoordinates: false,
        clusterDisableClickZoom: false,
      });

      clustererRef.current = clusterer;
      map.geoObjects.add(clusterer);

      setIsMapReady(true);
    });
  }, []);

  // Add markers to map
  useEffect(() => {
    if (!isMapReady || !clustererRef.current || markers.length === 0) return;

    placemarkRefs.current.clear();

    const placemarks = markers.map((marker) => {
      const placemark = new window.ymaps.Placemark(
        [marker.lat, marker.lng],
        {
          hintContent: formatPrice(marker.price),
        },
        {
          preset: 'islands#darkBlueCircleDotIcon',
        }
      );

      placemark.events.add('click', () => {
        setSelectedMarker(marker);
      });

      placemarkRefs.current.set(marker.id, placemark);
      return placemark;
    });

    clustererRef.current.removeAll();
    clustererRef.current.add(placemarks);

    if (placemarks.length > 0 && mapRef.current) {
      mapRef.current.setBounds(clustererRef.current.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 40,
      });
    }
  }, [isMapReady, markers]);

  // Highlight marker on hover
  useEffect(() => {
    if (!isMapReady) return;

    placemarkRefs.current.forEach((placemark, id) => {
      if (id === hoveredId) {
        placemark.options.set('preset', 'islands#redCircleDotIcon');
      } else {
        placemark.options.set('preset', 'islands#darkBlueCircleDotIcon');
      }
    });
  }, [hoveredId, isMapReady]);

  return (
    <>
      <Script
        src="https://api-maps.yandex.ru/2.1/?apikey=&lang=ru_RU"
        strategy="afterInteractive"
        onLoad={initMap}
      />

      <div className={`grid gap-6 ${showMap ? 'lg:grid-cols-2' : ''}`}>
        {/* Cards List */}
        <div>
          <div className="grid md:grid-cols-2 gap-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                onMouseEnter={() => setHoveredId(offer.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <OfferCard
                  offer={offer}
                  highlighted={hoveredId === offer.id}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        {showMap && (
          <div className="hidden lg:block sticky top-24 h-[calc(100vh-120px)]">
            <div className="relative h-full rounded-lg overflow-hidden border border-[var(--color-border)]">
              <div ref={mapContainerRef} className="absolute inset-0" />

              {/* Map toggle button */}
              <button
                onClick={onToggleMap}
                className="absolute top-3 right-3 z-10 bg-white px-3 py-2 rounded-lg shadow text-sm hover:bg-gray-50"
              >
                Скрыть карту
              </button>

              {/* Loading overlay */}
              {!isMapReady && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full mx-auto mb-3" />
                    <div className="text-[var(--color-text-light)]">
                      Загрузка карты...
                    </div>
                  </div>
                </div>
              )}

              {/* Selected marker popup */}
              {selectedMarker && (
                <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-20">
                  <button
                    onClick={() => setSelectedMarker(null)}
                    className="absolute top-2 right-2 text-[var(--color-text-light)] hover:text-[var(--color-text)]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="text-lg font-semibold mb-1">
                    {formatPrice(selectedMarker.price)}
                  </div>
                  <div className="text-[var(--color-text-light)] mb-3">
                    {formatRooms(selectedMarker.rooms, selectedMarker.is_studio)}
                  </div>
                  <Link
                    href={`/offers/${selectedMarker.id}`}
                    className="btn btn-primary btn-sm w-full text-center"
                  >
                    Подробнее
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Show map button (mobile or when hidden) */}
      {!showMap && (
        <button
          onClick={onToggleMap}
          className="fixed bottom-6 right-6 lg:bottom-auto lg:right-auto lg:relative btn btn-primary shadow-lg z-30"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Показать карту
        </button>
      )}
    </>
  );
}
