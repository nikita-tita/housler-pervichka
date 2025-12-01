'use client';

import type { ClientPriority } from '@/types';

interface PriorityBadgeProps {
  priority: ClientPriority;
  size?: 'sm' | 'md';
}

const PRIORITY_CONFIG: Record<ClientPriority, { label: string; color: string; icon: string }> = {
  low: { label: 'Низкий', color: 'text-gray-500', icon: '○' },
  medium: { label: 'Средний', color: 'text-yellow-600', icon: '◐' },
  high: { label: 'Высокий', color: 'text-orange-600', icon: '●' },
  urgent: { label: 'Срочный', color: 'text-red-600', icon: '⬤' },
};

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-1 font-medium ${config.color} ${sizeClasses}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

export function getPriorityLabel(priority: ClientPriority): string {
  return PRIORITY_CONFIG[priority]?.label || priority;
}
