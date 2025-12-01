'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { ClientSelectionProvider } from '@/contexts/ClientSelectionContext';
import { CompareProvider } from '@/contexts/CompareContext';
import { AgencyProvider } from '@/contexts/AgencyContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AgencyProvider>
      <AuthProvider>
        <FavoritesProvider>
          <ClientSelectionProvider>
            <CompareProvider>
              {children}
            </CompareProvider>
          </ClientSelectionProvider>
        </FavoritesProvider>
      </AuthProvider>
    </AgencyProvider>
  );
}
