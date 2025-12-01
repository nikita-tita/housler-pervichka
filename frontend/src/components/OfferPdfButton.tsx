'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import type { OfferDetail } from '@/types';
import { formatPrice, formatArea, formatRooms, formatFloor } from '@/services/api';

interface OfferPdfButtonProps {
  offer: OfferDetail;
  className?: string;
}

export function OfferPdfButton({ offer, className = '' }: OfferPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      // Header
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text('housler.ru', margin, yPos);
      doc.text(new Date().toLocaleDateString('ru-RU'), pageWidth - margin, yPos, { align: 'right' });
      yPos += 15;

      // Title
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0);
      doc.text(formatRooms(offer.rooms, offer.is_studio), margin, yPos);
      yPos += 8;

      doc.setFontSize(14);
      doc.setTextColor(64, 64, 64);
      doc.text(`${formatArea(offer.area_total)} • ${formatFloor(offer.floor, offer.floors_total)}`, margin, yPos);
      yPos += 12;

      // Price
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text(formatPrice(offer.price), margin, yPos);
      yPos += 7;

      doc.setFontSize(12);
      doc.setTextColor(128, 128, 128);
      doc.text(`${formatPrice(offer.price_per_sqm)}/м²`, margin, yPos);
      yPos += 15;

      // Image placeholder or actual image
      const imageHeight = 80;
      if (offer.image_url) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = offer.image_url!;
          });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          const imgWidth = contentWidth;
          const imgHeight = (img.height / img.width) * imgWidth;

          doc.addImage(imgData, 'JPEG', margin, yPos, imgWidth, Math.min(imgHeight, imageHeight));
          yPos += Math.min(imgHeight, imageHeight) + 10;
        } catch {
          // Draw placeholder rectangle
          doc.setDrawColor(200, 200, 200);
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, yPos, contentWidth, imageHeight, 'FD');
          doc.setTextColor(128, 128, 128);
          doc.setFontSize(12);
          doc.text('Фото недоступно', pageWidth / 2, yPos + imageHeight / 2, { align: 'center' });
          yPos += imageHeight + 10;
        }
      } else {
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPos, contentWidth, imageHeight, 'FD');
        yPos += imageHeight + 10;
      }

      // Characteristics section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Характеристики', margin, yPos);
      yPos += 8;

      doc.setFontSize(11);
      const characteristics = [
        { label: 'Общая площадь', value: formatArea(offer.area_total) },
        offer.area_living ? { label: 'Жилая площадь', value: formatArea(offer.area_living) } : null,
        offer.area_kitchen ? { label: 'Кухня', value: formatArea(offer.area_kitchen) } : null,
        { label: 'Этаж', value: formatFloor(offer.floor, offer.floors_total) },
        offer.ceiling_height ? { label: 'Высота потолков', value: `${offer.ceiling_height} м` } : null,
        offer.balcony ? { label: 'Балкон/лоджия', value: offer.balcony } : null,
        offer.bathroom ? { label: 'Санузел', value: offer.bathroom } : null,
        { label: 'Отделка', value: offer.has_finishing ? 'Да' : 'Без отделки' },
      ].filter(Boolean) as { label: string; value: string }[];

      // Draw characteristics in 2 columns
      const colWidth = contentWidth / 2;
      characteristics.forEach((char, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const xPos = margin + col * colWidth;
        const charYPos = yPos + row * 12;

        doc.setTextColor(128, 128, 128);
        doc.text(char.label, xPos, charYPos);
        doc.setTextColor(0, 0, 0);
        doc.text(char.value, xPos, charYPos + 5);
      });

      yPos += Math.ceil(characteristics.length / 2) * 12 + 10;

      // Complex info section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Жилой комплекс', margin, yPos);
      yPos += 8;

      doc.setFontSize(11);
      const complexInfo = [
        { label: 'Название', value: offer.complex_name },
        offer.developer_name ? { label: 'Застройщик', value: offer.developer_name } : null,
        { label: 'Адрес', value: offer.complex_address },
        { label: 'Район', value: offer.district_name },
        offer.metro_station ? {
          label: 'Метро',
          value: offer.metro_station + (offer.metro_distance ? ` (${offer.metro_distance} мин)` : '')
        } : null,
        offer.completion_date ? { label: 'Срок сдачи', value: offer.completion_date } : null,
      ].filter(Boolean) as { label: string; value: string }[];

      complexInfo.forEach((info) => {
        doc.setTextColor(128, 128, 128);
        doc.text(info.label, margin, yPos);
        yPos += 5;
        doc.setTextColor(0, 0, 0);

        // Wrap long text
        const lines = doc.splitTextToSize(info.value, contentWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 5 + 5;
      });

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `ID: ${offer.id} • Сгенерировано на housler.ru`,
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );

      // Save
      const fileName = `${offer.complex_name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${formatRooms(offer.rooms, offer.is_studio).replace(/[^a-zA-Zа-яА-Я0-9]/g, '')}_${offer.id}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Не удалось сгенерировать PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
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
  );
}
