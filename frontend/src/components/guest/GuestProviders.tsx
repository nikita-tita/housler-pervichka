'use client';

import { ReactNode } from 'react';
import { GuestProvider } from '@/contexts/GuestContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ClientSelectionProvider } from '@/contexts/ClientSelectionContext';

export function GuestProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <GuestProvider>
        <ClientSelectionProvider>
          {children}
        </ClientSelectionProvider>
      </GuestProvider>
    </ToastProvider>
  );
}
