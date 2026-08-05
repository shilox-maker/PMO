import { useState, useEffect } from 'react';

export function useTableColumns(storageKey, defaultColumns) {
  // Inicializamos el estado leyendo de localStorage o usando el default
  const [columns, setColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Hacemos un merge para asegurar que si añadimos nuevas columnas en el código,
        // no se pierdan por culpa del caché antiguo del localStorage.
        return defaultColumns.map(defCol => {
          const savedCol = parsed.find(c => c.id === defCol.id);
          // Las columnas fijas SIEMPRE son visibles
          if (defCol.fixed) return { ...defCol, visible: true };
          if (savedCol !== undefined) return { ...defCol, visible: savedCol.visible };
          return defCol;
        });
      }
    } catch (e) {
      console.warn(`Error reading ${storageKey} from localStorage`, e);
    }
    return defaultColumns;
  });

  // Guardar en localStorage cada vez que las columnas cambien
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(columns));
    } catch (e) {
      console.warn(`Error saving ${storageKey} to localStorage`, e);
    }
  }, [columns, storageKey]);

  const toggleColumn = (id) => {
    setColumns(prev => prev.map(col => {
      if (col.id === id && !col.fixed) {
        return { ...col, visible: !col.visible };
      }
      return col;
    }));
  };

  // Estado para los anchos de columna en px
  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const savedWidths = localStorage.getItem(`${storageKey}_widths`);
      if (savedWidths) return JSON.parse(savedWidths);
    } catch (e) {
      console.warn(`Error reading ${storageKey}_widths from localStorage`, e);
    }
    return {};
  });

  // Guardar anchos en localStorage cuando cambien
  useEffect(() => {
    try {
      if (Object.keys(columnWidths).length > 0) {
        localStorage.setItem(`${storageKey}_widths`, JSON.stringify(columnWidths));
      }
    } catch (e) {
      console.warn(`Error saving ${storageKey}_widths to localStorage`, e);
    }
  }, [columnWidths, storageKey]);

  const updateColumnWidth = (colId, width) => {
    setColumnWidths(prev => ({
      ...prev,
      [colId]: Math.max(60, width) // Límite mínimo de 60px
    }));
  };

  const resetColumns = () => {
    setColumns(defaultColumns);
    setColumnWidths({});
    localStorage.removeItem(`${storageKey}_widths`);
  };

  // Helper para facilitar condicionales: visibleColumns.id_proyecto === true
  const visibleColumnsMap = columns.reduce((acc, col) => {
    acc[col.id] = col.visible;
    return acc;
  }, {});

  return {
    columns,
    visibleColumnsMap,
    columnWidths,
    updateColumnWidth,
    toggleColumn,
    resetColumns
  };
}
