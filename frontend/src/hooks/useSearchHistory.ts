'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SearchHistoryItem {
  type: 'complex' | 'district' | 'metro' | 'text';
  value: string;
  timestamp: number;
}

const STORAGE_KEY = 'housler_search_history';
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[];
        setHistory(parsed);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage
  const saveHistory = useCallback((items: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }, []);

  // Add item to history
  const addToHistory = useCallback((type: SearchHistoryItem['type'], value: string) => {
    if (!value.trim()) return;

    setHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(
        item => !(item.type === type && item.value.toLowerCase() === value.toLowerCase())
      );

      // Add new item at the beginning
      const newItem: SearchHistoryItem = {
        type,
        value: value.trim(),
        timestamp: Date.now()
      };

      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory]);

  // Remove item from history
  const removeFromHistory = useCallback((type: SearchHistoryItem['type'], value: string) => {
    setHistory(prev => {
      const updated = prev.filter(
        item => !(item.type === type && item.value === value)
      );
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
}
