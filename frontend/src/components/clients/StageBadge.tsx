'use client';

import type { ClientStage } from '@/types';

interface StageBadgeProps {
  stage: ClientStage;
  size?: 'sm' | 'md';
}

const STAGE_CONFIG: Record<ClientStage, { label: string; color: string; bg: string }> = {
  new: { label: 'Новый', color: 'text-[var(--color-text)]', bg: 'bg-gray-200' },
  in_progress: { label: 'В работе', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  fixation: { label: 'Фиксация', color: 'text-purple-700', bg: 'bg-purple-100' },
  booking: { label: 'Бронь', color: 'text-orange-700', bg: 'bg-orange-100' },
  deal: { label: 'Сделка', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  completed: { label: 'Завершено', color: 'text-green-700', bg: 'bg-green-100' },
  failed: { label: 'Сорвано', color: 'text-red-700', bg: 'bg-red-100' },
};

export function StageBadge({ stage, size = 'sm' }: StageBadgeProps) {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.new;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded ${config.bg} ${config.color} ${sizeClasses}`}>
      {config.label}
    </span>
  );
}

export function getStageLabel(stage: ClientStage): string {
  return STAGE_CONFIG[stage]?.label || stage;
}
