'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const GUEST_FAVORITES_KEY = 'housler_guest_favorites';

interface GuestFavoritesContextType {
  favoriteIds: Set<number>;
  toggleFavorite: (offerId: number) => void;
  isFavorite: (offerId: number) => boolean;
  favoritesCount: number;
  clearFavorites: () => void;
}

const GuestFavoritesContext = createContext<GuestFavoritesContextType | null>(null);

export function GuestFavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  // Загрузка из localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(GUEST_FAVORITES_KEY);
      if (stored) {
        const ids = JSON.parse(stored) as number[];
        setFavoriteIds(new Set(ids));
      }
    } catch (e) {
      console.error('Failed to parse guest favorites:', e);
      localStorage.removeItem(GUEST_FAVORITES_KEY);
    }
  }, []);

  // Сохранение в localStorage
  const saveToStorage = useCallback((ids: Set<number>) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify([...ids]));
  }, []);

  const toggleFavorite = useCallback((offerId: number) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(offerId)) {
        next.delete(offerId);
      } else {
        next.add(offerId);
      }
      saveToStorage(next);
      return next;
    });
  }, [saveToStorage]);

  const isFavorite = useCallback((offerId: number): boolean => {
    return favoriteIds.has(offerId);
  }, [favoriteIds]);

  const clearFavorites = useCallback(() => {
    setFavoriteIds(new Set());
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_FAVORITES_KEY);
    }
  }, []);

  return (
    <GuestFavoritesContext.Provider
      value={{
        favoriteIds,
        toggleFavorite,
        isFavorite,
        favoritesCount: favoriteIds.size,
        clearFavorites,
      }}
    >
      {children}
    </GuestFavoritesContext.Provider>
  );
}

export function useGuestFavorites(): GuestFavoritesContextType {
  const context = useContext(GuestFavoritesContext);
  if (!context) {
    throw new Error('useGuestFavorites must be used within a GuestFavoritesProvider');
  }
  return context;
}
