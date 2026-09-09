import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to manage and persist filter state in localStorage,
 * isolated per user and per active scope (ámbito).
 *
 * @param {string} pageKey - Identifier for the page/view (e.g. 'projects', 'timeline', 'dashboard_portfolio')
 * @param {Object} defaultFilters - Default filter values
 * @returns {Object} { filters, setFilters, updateFilter, resetFilters, activeFiltersCount, isRestored }
 */
export function usePersistentFilters(pageKey, defaultFilters) {
  const { currentPm, selectedAmbito } = useAuth();

  const userId = currentPm?.id_usuario || 'anon';
  const ambitoId = selectedAmbito || 'global';
  const storageKey = `pmo_filters_u${userId}_amb${ambitoId}_${pageKey}`;

  // Helper to read initial or current state from localStorage safely
  const readStoredFilters = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultFilters, ...parsed };
      }
    } catch (e) {
      console.warn(`Error reading ${storageKey} from localStorage`, e);
    }
    return defaultFilters;
  }, [storageKey, defaultFilters]);

  const [filters, setFiltersState] = useState(readStoredFilters);
  const [isRestored, setIsRestored] = useState(false);
  const isFirstMount = useRef(true);

  // Sync state when storageKey changes (e.g. user or ámbito switches)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      setIsRestored(true);
      return;
    }
    const freshFilters = readStoredFilters();
    setFiltersState(freshFilters);
    setIsRestored(true);
  }, [readStoredFilters]);

  // Persist to localStorage whenever filters or storageKey changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch (e) {
      console.warn(`Error saving ${storageKey} to localStorage`, e);
    }
  }, [filters, storageKey]);

  // Updater for a single filter key
  const updateFilter = useCallback((key, value) => {
    setFiltersState(prev => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  // Functional or object updater for multiple filters
  const setFilters = useCallback((updater) => {
    setFiltersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return next;
    });
  }, []);

  // Reset all filters to default values and clean storage
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn(`Error clearing ${storageKey} from localStorage`, e);
    }
  }, [defaultFilters, storageKey]);

  // Calculate the number of actively applied filters (excluding defaults, sorting, or pagination)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    const ignoredKeys = new Set(['sortConfig', 'zoomIndex', 'timeframe', 'customDate']);

    for (const [key, value] of Object.entries(filters)) {
      if (ignoredKeys.has(key)) continue;
      const defaultVal = defaultFilters[key];

      if (Array.isArray(value)) {
        if (value.length > 0 && (!Array.isArray(defaultVal) || JSON.stringify(value) !== JSON.stringify(defaultVal))) {
          count += 1;
        }
      } else if (typeof value === 'boolean') {
        if (value !== defaultVal && value !== false) {
          count += 1;
        }
      } else if (value !== undefined && value !== null && value !== '' && value !== defaultVal) {
        count += 1;
      }
    }
    return count;
  }, [filters, defaultFilters]);

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    activeFiltersCount,
    isRestored
  };
}
export default usePersistentFilters;
