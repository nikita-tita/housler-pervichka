'use client';

import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { OfferDetail } from '@/types';
import { formatPrice, formatArea, formatRooms, formatFloor } from '@/services/api';

interface OfferPdfButtonProps {
  offer: OfferDetail;
  className?: string;
}

export function OfferPdfButton({ offer, className = '' }: OfferPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Группируем изображения по типу
  const planImage = offer.images?.find(img => img.tag === 'plan')?.url || null;
  const floorplanImage = offer.images?.find(img => img.tag === 'floorplan')?.url || null;
  const mainImage = offer.images?.find(img => img.tag === 'housemain')?.url || offer.images?.[0]?.url || null;
  const complexScheme = offer.images?.find(img => img.tag === 'complexscheme')?.url || null;

  // URL для статической карты Yandex
  const mapImageUrl = offer.latitude && offer.longitude
    ? `https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=${offer.longitude},${offer.latitude}&z=15&l=map&size=650,300&pt=${offer.longitude},${offer.latitude},pm2rdm`
    : null;

  // Фильтруем URL-подобные названия застройщиков
  const isValidDeveloper = offer.developer_name &&
    !offer.developer_name.includes('.') &&
    !offer.developer_name.includes('http') &&
    offer.developer_name.length > 2;

  const generatePdf = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);

    try {
      // Рендерим HTML в canvas
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      // Создаём PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;

      // Рассчитываем высоту изображения пропорционально
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      // Разбиваем на страницы если контент не влезает
      let heightLeft = imgHeight;
      let position = margin;
      let page = 0;

      // Первая страница
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);

      // Добавляем страницы если нужно
      while (heightLeft > 0) {
        page++;
        position = margin - (pdfHeight - margin * 2) * page;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }

      // Сохраняем
      const fileName = `${offer.complex_name?.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_') || 'offer'}_${offer.id}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Не удалось сгенерировать PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Стили для контента
  const styles = {
    container: {
      position: 'absolute' as const,
      left: '-9999px',
      top: 0,
      width: '800px',
      padding: '40px',
      backgroundColor: '#fff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '24px',
      color: '#6B7280',
      fontSize: '14px',
    },
    title: {
      fontSize: '32px',
      fontWeight: 600,
      margin: '0 0 8px 0',
      color: '#181A20',
    },
    subtitle: {
      fontSize: '18px',
      color: '#4A4A4A',
      margin: '0 0 16px 0',
    },
    price: {
      fontSize: '28px',
      fontWeight: 600,
      color: '#181A20',
    },
    pricePerSqm: {
      fontSize: '16px',
      color: '#6B7280',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 600,
      margin: '32px 0 16px 0',
      color: '#181A20',
      borderBottom: '2px solid #E5E7EB',
      paddingBottom: '8px',
    },
    image: {
      width: '100%',
      height: '280px',
      objectFit: 'cover' as const,
      borderRadius: '12px',
    },
    smallImage: {
      width: '100%',
      height: '220px',
      objectFit: 'contain' as const,
      borderRadius: '8px',
      backgroundColor: '#F9FAFB',
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '16px',
    },
    gridItem: {
      padding: '12px',
      backgroundColor: '#F9FAFB',
      borderRadius: '8px',
    },
    label: {
      color: '#6B7280',
      fontSize: '13px',
      marginBottom: '4px',
    },
    value: {
      color: '#181A20',
      fontSize: '15px',
      fontWeight: 500,
    },
    description: {
      fontSize: '14px',
      lineHeight: '1.7',
      color: '#374151',
      whiteSpace: 'pre-wrap' as const,
    },
    footer: {
      borderTop: '1px solid #E5E7EB',
      paddingTop: '16px',
      marginTop: '32px',
      color: '#6B7280',
      fontSize: '12px',
      textAlign: 'center' as const,
    },
    imageRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '16px',
    },
    mapImage: {
      width: '100%',
      height: '200px',
      objectFit: 'cover' as const,
      borderRadius: '8px',
    },
  };

  return (
    <>
      {/* Скрытый контент для рендеринга в PDF */}
      <div ref={contentRef} style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <span>agent.housler.ru</span>
          <span>{new Date().toLocaleDateString('ru-RU')}</span>
        </div>

        {/* Title */}
        <h1 style={styles.title}>
          {formatRooms(offer.rooms, offer.is_studio)}, {formatArea(offer.area_total)}
        </h1>
        <p style={styles.subtitle}>
          {offer.complex_name} • {formatFloor(offer.floor, offer.floors_total)}
        </p>

        {/* Price */}
        <div style={{ marginBottom: '24px' }}>
          <div style={styles.price}>{formatPrice(offer.price)}</div>
          <div style={styles.pricePerSqm}>{formatPrice(offer.price_per_sqm)}/м²</div>
        </div>

        {/* Main Image */}
        {mainImage && (
          <div style={{ marginBottom: '24px' }}>
            <img
              src={mainImage}
              alt="Фото объекта"
              style={styles.image}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Планировка и План этажа */}
        {(planImage || floorplanImage) && (
          <>
            <h2 style={styles.sectionTitle}>Планировка</h2>
            <div style={styles.imageRow}>
              {planImage && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Планировка квартиры</div>
                  <img
                    src={planImage}
                    alt="Планировка"
                    style={styles.smallImage}
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              {floorplanImage && (
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>План этажа</div>
                  <img
                    src={floorplanImage}
                    alt="План этажа"
                    style={styles.smallImage}
                    crossOrigin="anonymous"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Характеристики */}
        <h2 style={styles.sectionTitle}>Характеристики</h2>
        <div style={styles.grid2}>
          <div style={styles.gridItem}>
            <div style={styles.label}>Общая площадь</div>
            <div style={styles.value}>{formatArea(offer.area_total)}</div>
          </div>
          {offer.area_living && (
            <div style={styles.gridItem}>
              <div style={styles.label}>Жилая площадь</div>
              <div style={styles.value}>{formatArea(offer.area_living)}</div>
            </div>
          )}
          {offer.area_kitchen && (
            <div style={styles.gridItem}>
              <div style={styles.label}>Кухня</div>
              <div style={styles.value}>{formatArea(offer.area_kitchen)}</div>
            </div>
          )}
          <div style={styles.gridItem}>
            <div style={styles.label}>Этаж</div>
            <div style={styles.value}>{formatFloor(offer.floor, offer.floors_total)}</div>
          </div>
          {offer.ceiling_height && (
            <div style={styles.gridItem}>
              <div style={styles.label}>Высота потолков</div>
              <div style={styles.value}>{offer.ceiling_height} м</div>
            </div>
          )}
          {offer.balcony && (
            <div style={styles.gridItem}>
              <div style={styles.label}>Балкон/лоджия</div>
              <div style={styles.value}>{offer.balcony}</div>
            </div>
          )}
          {offer.bathroom && (
            <div style={styles.gridItem}>
              <div style={styles.label}>Санузел</div>
              <div style={styles.value}>{offer.bathroom}</div>
            </div>
          )}
          <div style={styles.gridItem}>
            <div style={styles.label}>Отделка</div>
            <div style={styles.value}>{offer.has_finishing ? 'С отделкой' : 'Без отделки'}</div>
          </div>
        </div>

        {/* Описание */}
        {offer.description && (
          <>
            <h2 style={styles.sectionTitle}>Описание</h2>
            <div style={styles.description}>{offer.description}</div>
          </>
        )}

        {/* ЖК */}
        <h2 style={styles.sectionTitle}>Жилой комплекс</h2>

        {/* Фото ЖК и схема */}
        {(complexScheme || (mainImage && !planImage && !floorplanImage)) && (
          <div style={{ marginBottom: '16px' }}>
            {complexScheme && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Генплан комплекса</div>
                <img
                  src={complexScheme}
                  alt="Схема ЖК"
                  style={{ ...styles.smallImage, height: '180px' }}
                  crossOrigin="anonymous"
                />
              </div>
            )}
          </div>
        )}

        <div style={styles.grid2}>
          <div style={styles.gridItem}>
            <div style={styles.label}>Название</div>
            <div style={styles.value}>{offer.complex_name}</div>
          </div>
          {isValidDeveloper && (
            <div style={styles.gridItem}>
              <div style={styles.label}>Застройщик</div>
              <div style={styles.value}>{offer.developer_name}</div>
            </div>
          )}
          <div style={styles.gridItem}>
            <div style={styles.label}>Адрес</div>
            <div style={styles.value}>{offer.complex_address}</div>
          </div>
          <div style={styles.gridItem}>
            <div style={styles.label}>Район</div>
            <div style={styles.value}>{offer.district_name}</div>
          </div>
          {offer.metro_station && (
            <div style={styles.gridItem}>
              <div style={styles.label}>Метро</div>
              <div style={styles.value}>
                {offer.metro_station}{offer.metro_distance ? ` (${offer.metro_distance} мин)` : ''}
              </div>
            </div>
          )}
          {offer.completion_date && (
            <div style={styles.gridItem}>
              <div style={styles.label}>Срок сдачи</div>
              <div style={styles.value}>{offer.completion_date}</div>
            </div>
          )}
        </div>

        {/* Карта */}
        {mapImageUrl && (
          <>
            <h2 style={styles.sectionTitle}>Расположение</h2>
            <div style={{ marginBottom: '16px' }}>
              <img
                src={mapImageUrl}
                alt="Карта"
                style={styles.mapImage}
                crossOrigin="anonymous"
              />
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px' }}>
                {offer.complex_address}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          ID объявления: {offer.id} • Сгенерировано на agent.housler.ru
        </div>
      </div>

      {/* Кнопка */}
      <button
        onClick={generatePdf}
        disabled={isGenerating}
        className={`btn btn-secondary inline-flex items-center gap-2 ${className}`}
      >
        {isGenerating ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Генерация...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Скачать PDF
          </>
        )}
      </button>
    </>
  );
}
