'use client';

import { useState, useEffect, useRef } from 'react';

interface Suggestion {
  type: 'complex' | 'district' | 'metro';
  name: string;
  count: number;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: Suggestion) => void;
  suggestions: {
    complexes: { name: string; count: number }[];
    districts: { name: string; count: number }[];
    metro_stations: { name: string; count: number }[];
  } | null;
  placeholder?: string;
}

export function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = 'Поиск...'
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (!value.trim() || !suggestions) {
      setFilteredSuggestions([]);
      return;
    }

    const query = value.toLowerCase();
    const results: Suggestion[] = [];

    // Search in complexes
    suggestions.complexes
      .filter(c => c.name.toLowerCase().includes(query))
      .slice(0, 5)
      .forEach(c => results.push({ type: 'complex', name: c.name, count: c.count }));

    // Search in districts
    suggestions.districts
      .filter(d => d.name.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach(d => results.push({ type: 'district', name: d.name, count: d.count }));

    // Search in metro
    suggestions.metro_stations
      .filter(m => m.name.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach(m => results.push({ type: 'metro', name: m.name, count: m.count }));

    setFilteredSuggestions(results);
  }, [value, suggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeLabel = (type: Suggestion['type']) => {
    switch (type) {
      case 'complex': return 'ЖК';
      case 'district': return 'Район';
      case 'metro': return 'Метро';
    }
  };

  const getTypeColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'complex': return 'bg-blue-100 text-blue-700';
      case 'district': return 'bg-green-100 text-green-700';
      case 'metro': return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      />

      {/* Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.name}-${index}`}
              onClick={() => {
                onSelect(suggestion);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-[var(--color-bg-gray)] flex items-center justify-between gap-2 border-b border-[var(--color-border)] last:border-b-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(suggestion.type)}`}>
                  {getTypeLabel(suggestion.type)}
                </span>
                <span className="truncate">{suggestion.name}</span>
              </div>
              <span className="text-xs text-[var(--color-text-light)] whitespace-nowrap">
                {suggestion.count} шт.
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
