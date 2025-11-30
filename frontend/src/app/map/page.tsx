'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { api, formatPrice, formatRooms } from '@/services/api';

interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  price: number;
  rooms: number;
  is_studio: boolean;
}

// Declare ymaps global
declare global {
  interface Window {
    ymaps: any;
  }
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);

  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<MapMarker | null>(null);

  // Load markers
  useEffect(() => {
    api.getMapMarkers()
      .then(res => {
        if (res.success && res.data) {
          setMarkers(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Initialize map when script loads
  const initMap = useCallback(() => {
    if (!window.ymaps || !mapContainerRef.current || mapRef.current) return;

    window.ymaps.ready(() => {
      // Create map centered on SPb
      const map = new window.ymaps.Map(mapContainerRef.current, {
        center: [59.93, 30.31],
        zoom: 11,
        controls: ['zoomControl', 'geolocationControl']
      });

      mapRef.current = map;

      // Create clusterer
      const clusterer = new window.ymaps.Clusterer({
        preset: 'islands#invertedDarkBlueClusterIcons',
        groupByCoordinates: false,
        clusterDisableClickZoom: false,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false,
        clusterBalloonContentLayout: 'cluster#balloonCarousel'
      });

      clustererRef.current = clusterer;
      map.geoObjects.add(clusterer);

      setIsMapReady(true);
    });
  }, []);

  // Add markers to map when data is ready
  useEffect(() => {
    if (!isMapReady || !clustererRef.current || markers.length === 0) return;

    const placemarks = markers.map(marker => {
      const placemark = new window.ymaps.Placemark(
        [marker.lat, marker.lng],
        {
          balloonContentHeader: formatRooms(marker.rooms, marker.is_studio),
          balloonContentBody: `<strong>${formatPrice(marker.price)}</strong>`,
          balloonContentFooter: `<a href="/offers/${marker.id}" target="_blank">Подробнее</a>`,
          hintContent: formatPrice(marker.price)
        },
        {
          preset: 'islands#darkBlueCircleDotIcon'
        }
      );

      placemark.events.add('click', () => {
        setSelectedOffer(marker);
      });

      return placemark;
    });

    clustererRef.current.removeAll();
    clustererRef.current.add(placemarks);

    // Fit bounds to show all markers
    if (placemarks.length > 0) {
      mapRef.current.setBounds(clustererRef.current.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 40
      });
    }
  }, [isMapReady, markers]);

  return (
    <>
      <Script
        src="https://api-maps.yandex.ru/2.1/?apikey=&lang=ru_RU"
        strategy="afterInteractive"
        onLoad={initMap}
      />

      <div className="h-[calc(100vh-80px)] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/offers" className="text-[var(--color-text-light)] hover:text-[var(--color-text)]">
              ← К списку
            </Link>
            <h1 className="text-lg font-semibold">
              Карта объявлений
            </h1>
          </div>
          <div className="text-sm text-[var(--color-text-light)]">
            {isLoading ? 'Загрузка...' : `${markers.length.toLocaleString('ru-RU')} объектов`}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="absolute inset-0" />

          {/* Loading overlay */}
          {(isLoading || !isMapReady) && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full mx-auto mb-3"></div>
                <div className="text-[var(--color-text-light)]">
                  {isLoading ? 'Загрузка объявлений...' : 'Инициализация карты...'}
                </div>
              </div>
            </div>
          )}

          {/* Selected offer card */}
          {selectedOffer && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-lg shadow-lg p-4 z-20">
              <button
                onClick={() => setSelectedOffer(null)}
                className="absolute top-2 right-2 text-[var(--color-text-light)] hover:text-[var(--color-text)]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-lg font-semibold mb-1">
                {formatPrice(selectedOffer.price)}
              </div>
              <div className="text-[var(--color-text-light)] mb-3">
                {formatRooms(selectedOffer.rooms, selectedOffer.is_studio)}
              </div>
              <Link
                href={`/offers/${selectedOffer.id}`}
                className="btn btn-primary btn-sm w-full text-center"
              >
                Подробнее
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
