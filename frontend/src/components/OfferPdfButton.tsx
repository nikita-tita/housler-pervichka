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

  // Получаем URL главного изображения
  const mainImageUrl = offer.images?.find(img => img.tag === 'housemain')?.url
    || offer.images?.[0]?.url
    || null;

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

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Создаём PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Если контент не влезает на страницу, масштабируем
      const finalHeight = Math.min(imgHeight, pdfHeight - 20);
      const finalWidth = (canvas.width * finalHeight) / canvas.height;

      pdf.addImage(imgData, 'JPEG', 10, 10, Math.min(imgWidth, finalWidth), finalHeight);

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

  return (
    <>
      {/* Скрытый контент для рендеринга в PDF */}
      <div
        ref={contentRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '800px',
          padding: '40px',
          backgroundColor: '#fff',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', color: '#6B7280', fontSize: '14px' }}>
          <span>agent.housler.ru</span>
          <span>{new Date().toLocaleDateString('ru-RU')}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '32px', fontWeight: 600, margin: '0 0 8px 0', color: '#181A20' }}>
          {formatRooms(offer.rooms, offer.is_studio)}
        </h1>
        <p style={{ fontSize: '18px', color: '#4A4A4A', margin: '0 0 16px 0' }}>
          {formatArea(offer.area_total)} • {formatFloor(offer.floor, offer.floors_total)}
        </p>

        {/* Price */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#181A20' }}>
            {formatPrice(offer.price)}
          </div>
          <div style={{ fontSize: '16px', color: '#6B7280' }}>
            {formatPrice(offer.price_per_sqm)}/м²
          </div>
        </div>

        {/* Image */}
        {mainImageUrl && (
          <div style={{ marginBottom: '24px' }}>
            <img
              src={mainImageUrl}
              alt="Фото объекта"
              style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '12px' }}
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Characteristics */}
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 16px 0', color: '#181A20' }}>
          Характеристики
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div>
            <div style={{ color: '#6B7280', fontSize: '14px' }}>Общая площадь</div>
            <div style={{ color: '#181A20', fontSize: '16px' }}>{formatArea(offer.area_total)}</div>
          </div>
          {offer.area_living && (
            <div>
              <div style={{ color: '#6B7280', fontSize: '14px' }}>Жилая площадь</div>
              <div style={{ color: '#181A20', fontSize: '16px' }}>{formatArea(offer.area_living)}</div>
            </div>
          )}
          {offer.area_kitchen && (
            <div>
              <div style={{ color: '#6B7280', fontSize: '14px' }}>Кухня</div>
              <div style={{ color: '#181A20', fontSize: '16px' }}>{formatArea(offer.area_kitchen)}</div>
            </div>
          )}
          <div>
            <div style={{ color: '#6B7280', fontSize: '14px' }}>Этаж</div>
            <div style={{ color: '#181A20', fontSize: '16px' }}>{formatFloor(offer.floor, offer.floors_total)}</div>
          </div>
          {offer.ceiling_height && (
            <div>
              <div style={{ color: '#6B7280', fontSize: '14px' }}>Высота потолков</div>
              <div style={{ color: '#181A20', fontSize: '16px' }}>{offer.ceiling_height} м</div>
            </div>
          )}
          {offer.balcony && (
            <div>
              <div style={{ color: '#6B7280', fontSize: '14px' }}>Балкон/лоджия</div>
              <div style={{ color: '#181A20', fontSize: '16px' }}>{offer.balcony}</div>
            </div>
          )}
          {offer.bathroom && (
            <div>
              <div style={{ color: '#6B7280', fontSize: '14px' }}>Санузел</div>
              <div style={{ color: '#181A20', fontSize: '16px' }}>{offer.bathroom}</div>
            </div>
          )}
          <div>
            <div style={{ color: '#6B7280', fontSize: '14px' }}>Отделка</div>
            <div style={{ color: '#181A20', fontSize: '16px' }}>{offer.has_finishing ? 'С отделкой' : 'Без отделки'}</div>
          </div>
        </div>

        {/* Complex info */}
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 16px 0', color: '#181A20' }}>
          Жилой комплекс
        </h2>
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          <div>
            <div style={{ color: '#6B7280', fontSize: '14px' }}>Название</div>
            <div style={{ color: '#181A20', fontSize: '16px' }}>{offer.complex_name}</div>
          </div>
          {offer.developer_name && !offer.developer_name.includes('.') && (
            <div>
              <div style={{ color: '#6B7280', fontSize: '14px' }}>Застройщик</div>
              <div style={{ color: '#181A20', fontSize: '16px' }}>{offer.developer_name}</div>
            </div>
          )}
          <div>
            <div style={{ color: '#6B7280', fontSize: '14px' }}>Адрес</div>
            <div style={{ color: '#181A20', fontSize: '16px' }}>{offer.complex_address}</div>
          </div>
          <div>
            <div style={{ color: '#6B7280', fontSize: '14px' }}>Район</div>
            <div style={{ color: '#181A20', fontSize: '16px' }}>{offer.district_name}</div>
          </div>
          {offer.metro_station && (
            <div>
              <div style={{ color: '#6B7280', fontSize: '14px' }}>Метро</div>
              <div style={{ color: '#181A20', fontSize: '16px' }}>
                {offer.metro_station}{offer.metro_distance ? ` (${offer.metro_distance} мин)` : ''}
              </div>
            </div>
          )}
          {offer.completion_date && (
            <div>
              <div style={{ color: '#6B7280', fontSize: '14px' }}>Срок сдачи</div>
              <div style={{ color: '#181A20', fontSize: '16px' }}>{offer.completion_date}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', color: '#6B7280', fontSize: '12px', textAlign: 'center' }}>
          ID: {offer.id} • Сгенерировано на agent.housler.ru
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
