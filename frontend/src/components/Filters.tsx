'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FilterOptions, OfferFilters } from '@/types';
import { api } from '@/services/api';

interface FiltersProps {
  onFiltersChange?: (filters: OfferFilters) => void;
}

export function Filters({ onFiltersChange }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Current filter state from URL
  const [filters, setFilters] = useState<OfferFilters>({});

  // Load filter options
  useEffect(() => {
    api.getFilters()
      .then(res => {
        if (res.success && res.data) {
          setFilterOptions(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Parse URL params to filters
  useEffect(() => {
    const newFilters: OfferFilters = {};

    const rooms = searchParams.getAll('rooms');
    if (rooms.length) newFilters.rooms = rooms.map(Number);

    const isStudio = searchParams.get('is_studio');
    if (isStudio) newFilters.is_studio = isStudio === 'true';

    const priceMin = searchParams.get('price_min');
    if (priceMin) newFilters.price_min = Number(priceMin);

    const priceMax = searchParams.get('price_max');
    if (priceMax) newFilters.price_max = Number(priceMax);

    const areaMin = searchParams.get('area_min');
    if (areaMin) newFilters.area_min = Number(areaMin);

    const areaMax = searchParams.get('area_max');
    if (areaMax) newFilters.area_max = Number(areaMax);

    const districts = searchParams.getAll('districts');
    if (districts.length) newFilters.districts = districts;

    const metros = searchParams.getAll('metro_stations');
    if (metros.length) newFilters.metro_stations = metros;

    const hasFinishing = searchParams.get('has_finishing');
    if (hasFinishing) newFilters.has_finishing = hasFinishing === 'true';

    const search = searchParams.get('search');
    if (search) newFilters.search = search;

    setFilters(newFilters);
    onFiltersChange?.(newFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL with new filters (preserving sort)
  const applyFilters = (newFilters: OfferFilters) => {
    const params = new URLSearchParams();

    // Preserve sort param
    const currentSort = searchParams.get('sort');
    if (currentSort) params.set('sort', currentSort);

    if (newFilters.rooms?.length) {
      newFilters.rooms.forEach(r => params.append('rooms', r.toString()));
    }
    if (newFilters.is_studio !== undefined) {
      params.set('is_studio', newFilters.is_studio.toString());
    }
    if (newFilters.price_min) params.set('price_min', newFilters.price_min.toString());
    if (newFilters.price_max) params.set('price_max', newFilters.price_max.toString());
    if (newFilters.area_min) params.set('area_min', newFilters.area_min.toString());
    if (newFilters.area_max) params.set('area_max', newFilters.area_max.toString());
    if (newFilters.districts?.length) {
      newFilters.districts.forEach(d => params.append('districts', d));
    }
    if (newFilters.metro_stations?.length) {
      newFilters.metro_stations.forEach(m => params.append('metro_stations', m));
    }
    if (newFilters.has_finishing !== undefined) {
      params.set('has_finishing', newFilters.has_finishing.toString());
    }
    if (newFilters.search) {
      params.set('search', newFilters.search);
    }

    // Reset page to 1 when filters change
    const query = params.toString();
    router.push(`/offers${query ? `?${query}` : ''}`);
  };

  const toggleRoom = (room: number) => {
    const currentRooms = filters.rooms || [];
    const newRooms = currentRooms.includes(room)
      ? currentRooms.filter(r => r !== room)
      : [...currentRooms, room];
    applyFilters({ ...filters, rooms: newRooms.length ? newRooms : undefined });
  };

  const toggleStudio = () => {
    applyFilters({
      ...filters,
      is_studio: filters.is_studio ? undefined : true,
    });
  };

  const clearFilters = () => {
    router.push('/offers');
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-4 bg-[var(--color-bg-gray)] rounded w-1/4 mb-4"></div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 w-16 bg-[var(--color-bg-gray)] rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Search input with debounce
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        applyFilters({ ...filters, search: searchInput || undefined });
      }
    }, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="card p-6">
      {/* Search */}
      <div className="mb-6">
        <div className="text-sm font-medium mb-3">Поиск по ЖК или адресу</div>
        <input
          type="text"
          placeholder="Название ЖК или адрес..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>

      {/* Rooms Filter */}
      <div className="mb-6">
        <div className="text-sm font-medium mb-3">Комнатность</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleStudio}
            className={`btn btn-sm ${filters.is_studio ? 'btn-primary' : 'btn-secondary'}`}
          >
            Студия
          </button>
          {[1, 2, 3, 4].map(room => (
            <button
              key={room}
              onClick={() => toggleRoom(room)}
              className={`btn btn-sm ${filters.rooms?.includes(room) ? 'btn-primary' : 'btn-secondary'}`}
            >
              {room}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <>
          {/* Price Range */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-3">Цена</div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="от"
                value={filters.price_min || ''}
                onChange={e => applyFilters({
                  ...filters,
                  price_min: e.target.value ? Number(e.target.value) : undefined,
                })}
                className="input"
              />
              <input
                type="number"
                placeholder="до"
                value={filters.price_max || ''}
                onChange={e => applyFilters({
                  ...filters,
                  price_max: e.target.value ? Number(e.target.value) : undefined,
                })}
                className="input"
              />
            </div>
          </div>

          {/* Area Range */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-3">Площадь, м²</div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="от"
                value={filters.area_min || ''}
                onChange={e => applyFilters({
                  ...filters,
                  area_min: e.target.value ? Number(e.target.value) : undefined,
                })}
                className="input"
              />
              <input
                type="number"
                placeholder="до"
                value={filters.area_max || ''}
                onChange={e => applyFilters({
                  ...filters,
                  area_max: e.target.value ? Number(e.target.value) : undefined,
                })}
                className="input"
              />
            </div>
          </div>

          {/* District Select */}
          {filterOptions?.districts && filterOptions.districts.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-medium mb-3">Район</div>
              <select
                value={filters.districts?.[0] || ''}
                onChange={e => applyFilters({
                  ...filters,
                  districts: e.target.value ? [e.target.value] : undefined,
                })}
                className="select"
              >
                <option value="">Любой район</option>
                {filterOptions.districts.map(d => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Metro Select */}
          {filterOptions?.metro_stations && filterOptions.metro_stations.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-medium mb-3">Метро</div>
              <select
                value={filters.metro_stations?.[0] || ''}
                onChange={e => applyFilters({
                  ...filters,
                  metro_stations: e.target.value ? [e.target.value] : undefined,
                })}
                className="select"
              >
                <option value="">Любое метро</option>
                {filterOptions.metro_stations.map(m => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Finishing Checkbox */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.has_finishing || false}
                onChange={e => applyFilters({
                  ...filters,
                  has_finishing: e.target.checked ? true : undefined,
                })}
                className="w-5 h-5 rounded border-[var(--color-border)]"
              />
              <span className="text-sm">Только с отделкой</span>
            </label>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn btn-secondary flex-1"
        >
          {isExpanded ? 'Свернуть' : 'Все фильтры'}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-secondary"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
