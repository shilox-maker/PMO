import React, { useState, useEffect } from 'react';
import { AlignJustify, AlignCenter, Menu } from 'lucide-react';

const DENSITY_OPTIONS = [
  { id: 'comfortable', label: 'Cómoda', icon: AlignJustify },
  { id: 'standard', label: 'Normal', icon: AlignCenter },
  { id: 'compact', label: 'Compacta', icon: Menu }
];

export default function DensitySelector({ density, onChange }) {
  const [selectedDensity, setSelectedDensity] = useState(() => {
    return density || localStorage.getItem('pmo_table_density') || 'standard';
  });

  const handleSelect = (newDensity) => {
    setSelectedDensity(newDensity);
    localStorage.setItem('pmo_table_density', newDensity);
    if (onChange) {
      onChange(newDensity);
    }
  };

  useEffect(() => {
    if (density && density !== selectedDensity) {
      setSelectedDensity(density);
    }
  }, [density]);

  return (
    <div 
      className="m3-card" 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        padding: '3px', 
        borderRadius: '10px', 
        gap: '2px',
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
        border: '1px solid var(--md-sys-color-outline-variant)'
      }}
      title="Densidad de vista en tabla"
    >
      {DENSITY_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = selectedDensity === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleSelect(opt.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '7px',
              fontSize: '0.76rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-outline)',
              backgroundColor: isActive ? 'var(--md-sys-color-primary-container)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon size={14} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
