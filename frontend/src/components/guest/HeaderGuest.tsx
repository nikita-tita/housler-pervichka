'use client';

import Link from 'next/link';
import { useGuest } from '@/contexts/GuestContext';

export function HeaderGuest() {
  const { context, selectionCode } = useGuest();

  const agencyName = context?.agency?.name || 'Агентство недвижимости';
  const agentName = context?.agent?.name;
  const agentPhone = context?.agent?.phone;
  const logoUrl = context?.agency?.logo_url;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)]">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Agency branding */}
          <Link
            href={selectionCode ? `/s/${selectionCode}` : '#'}
            className="flex items-center gap-3"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={agencyName}
                className="h-8 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <span className="text-lg font-semibold tracking-tight">
                {agencyName}
              </span>
            )}
          </Link>

          {/* Agent info */}
          <div className="flex items-center gap-4">
            {agentName && (
              <div className="hidden sm:block text-right">
                <div className="text-sm text-[var(--color-text-light)]">Ваш агент</div>
                <div className="text-sm font-medium">{agentName}</div>
              </div>
            )}

            {agentPhone && (
              <a
                href={`tel:${agentPhone}`}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="hidden sm:inline">Позвонить</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
