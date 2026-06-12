import React, { useState, useRef, useEffect } from 'react';
import { Columns, Check, X, RotateCcw } from 'lucide-react';

export default function ColumnSelector({ columns, toggleColumn, resetColumns }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        className="m3-btn m3-btn-tonal" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          backgroundColor: isOpen ? 'var(--md-sys-color-secondary-container)' : undefined
        }}
        title="Configurar Columnas"
      >
        <Columns size={18} />
        <span style={{ display: 'none', '@media(min-width: 768px)': { display: 'inline' }}}>Columnas</span>
      </button>

      {isOpen && (
        <div 
          className="m3-card glass-panel"
          style={{ 
            position: 'absolute', 
            top: 'calc(100% + 8px)', 
            right: 0, 
            width: '280px',
            padding: '16px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
              Visibilidad de Columnas
            </h4>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-sys-color-outline)', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '300px', overflowY: 'auto', paddingRight: 4 }}>
            {columns.map(col => (
              <label 
                key={col.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  cursor: col.fixed ? 'not-allowed' : 'pointer',
                  opacity: col.fixed ? 0.6 : 1,
                  padding: '4px 0'
                }}
              >
                <div 
                  style={{
                    width: 20, 
                    height: 20, 
                    borderRadius: 4, 
                    border: `2px solid ${col.visible ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'}`,
                    backgroundColor: col.visible ? 'var(--md-sys-color-primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {col.visible && <Check size={14} color="#fff" strokeWidth={3} />}
                </div>
                <input 
                  type="checkbox" 
                  checked={col.visible}
                  onChange={() => toggleColumn(col.id)}
                  disabled={col.fixed}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface)', userSelect: 'none' }}>
                  {col.label} {col.fixed && <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-outline)', marginLeft: 4 }}>(Fija)</span>}
                </span>
              </label>
            ))}
          </div>

          <button 
            onClick={resetColumns}
            style={{ 
              marginTop: 8,
              padding: '8px', 
              background: 'transparent', 
              border: '1px dashed var(--md-sys-color-outline)', 
              borderRadius: '8px',
              color: 'var(--md-sys-color-outline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--md-sys-color-primary)';
              e.currentTarget.style.borderColor = 'var(--md-sys-color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--md-sys-color-outline)';
              e.currentTarget.style.borderColor = 'var(--md-sys-color-outline)';
            }}
          >
            <RotateCcw size={14} />
            Restablecer por defecto
          </button>
        </div>
      )}
    </div>
  );
}
