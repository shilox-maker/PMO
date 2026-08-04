import React from 'react';

export default function SkeletonLoader({ variant = 'table', rows = 5, columns = 6, count = 4, height }) {
  if (variant === 'kpi') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="skeleton-card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: height || '120px' }}>
            <div className="skeleton-glass" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
            <div className="skeleton-glass" style={{ width: '65%', height: '32px', borderRadius: '6px' }} />
            <div className="skeleton-glass" style={{ width: '80%', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="skeleton-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: height || '140px' }}>
            <div className="skeleton-glass" style={{ width: '30%', height: '20px', borderRadius: '4px' }} />
            <div className="skeleton-glass" style={{ width: '90%', height: '14px', borderRadius: '4px' }} />
            <div className="skeleton-glass" style={{ width: '75%', height: '14px', borderRadius: '4px' }} />
            <div className="skeleton-glass" style={{ width: '50%', height: '14px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="skeleton-glass" style={{ width: idx % 2 === 0 ? '100%' : '80%', height: height || '16px', borderRadius: '4px' }} />
        ))}
      </div>
    );
  }

  // Default: 'table'
  return (
    <div className="m3-table-wrapper glass-panel" style={{ overflow: 'hidden', padding: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div key={colIdx} className="skeleton-glass" style={{ flex: 1, height: '18px', borderRadius: '4px' }} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '10px 0' }}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div key={colIdx} className="skeleton-glass" style={{ flex: 1, height: '22px', borderRadius: '6px', opacity: 0.9 - rowIdx * 0.12 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
