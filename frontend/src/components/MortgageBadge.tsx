'use client';

import { useMemo, useState } from 'react';

interface MortgageBadgeProps {
  price: number;
  className?: string;
}

/**
 * Компактный бейдж с ипотечным платежом для карточки объекта.
 * Показывает примерный ежемесячный платёж при стандартных условиях.
 */
export function MortgageBadge({ price, className = '' }: MortgageBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Стандартные условия: 20% первоначальный, 20 лет, 28% ставка
  const downPaymentPercent = 20;
  const term = 20;
  const rate = 28;

  const monthlyPayment = useMemo(() => {
    const downPayment = price * downPaymentPercent / 100;
    const loanAmount = price - downPayment;
    if (loanAmount <= 0) return 0;

    const monthlyRate = rate / 100 / 12;
    const months = term * 12;
    const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment);
  }, [price]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${Math.round(num / 1000)} тыс.`;
    }
    return num.toLocaleString('ru-RU');
  };

  if (monthlyPayment <= 0) return null;

  return (
    <div
      className={`relative inline-flex items-center gap-1 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-xs text-[var(--color-text-light)]">
        ≈ {formatNumber(monthlyPayment)} ₽/мес
      </span>

      {/* Иконка информации */}
      <svg
        className="w-3.5 h-3.5 text-[var(--color-text-light)] cursor-help"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Тултип */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-[var(--color-text)] text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
          <div>При {downPaymentPercent}% взносе, {term} лет, {rate}%</div>
          <div className="absolute bottom-0 left-4 translate-y-1/2 rotate-45 w-2 h-2 bg-[var(--color-text)]"></div>
        </div>
      )}
    </div>
  );
}
