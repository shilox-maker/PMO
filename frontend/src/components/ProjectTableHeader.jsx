import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export default function ProjectTableHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
  colId,
  columnWidths = {},
  onMouseDown,
  extraStyle = {},
  children
}) {
  const isSorted = sortKey && sortConfig && sortConfig.key === sortKey;
  const isCentered = extraStyle.textAlign === 'center';
  const customWidth = columnWidths ? columnWidths[colId] : undefined;

  return (
    <th
      className="th-resizable"
      onClick={() => sortKey && onSort && onSort(sortKey)}
      style={{
        cursor: sortKey ? 'pointer' : 'default',
        userSelect: 'none',
        width: customWidth ? `${customWidth}px` : undefined,
        ...extraStyle
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: isCentered ? 'center' : (children ? 'space-between' : 'flex-start'), width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          {sortKey && (
            isSorted ? (
              sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
            )
          )}
        </div>
        {children}
      </div>
      {onMouseDown && colId && (
        <div
          className="table-resizer"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => onMouseDown(e, colId)}
        />
      )}
    </th>
  );
}
