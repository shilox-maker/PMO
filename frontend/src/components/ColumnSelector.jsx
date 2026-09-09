import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Columns, Check, X, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ColumnSelector({ columns = [], tableCols, toggleColumn, resetColumns }) {
  const cols = columns.length > 0 ? columns : (tableCols || []);
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  // Update fixed position when opened
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 6,
          right: Math.max(12, window.innerWidth - rect.right),
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!cols || cols.length === 0) return null;

  return (
    <>
      <button 
        ref={buttonRef}
        type="button"
        className="column-selector-btn" 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: isOpen ? 'var(--md-sys-color-secondary-container)' : undefined,
          color: isOpen ? 'var(--md-sys-color-on-secondary-container)' : undefined,
          borderColor: isOpen ? 'var(--md-sys-color-primary)' : undefined
        }}
        title={t('projectsTable.columnVisibility', 'Personalizar columnas')}
        aria-label={t('projectsTable.columnVisibility', 'Personalizar columnas')}
      >
        <Columns size={15} />
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="m3-card glass-panel"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ 
            position: 'fixed', 
            top: `${menuPos.top}px`, 
            right: `${menuPos.right}px`, 
            width: '270px',
            padding: '14px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            boxShadow: '0 10px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: 'var(--md-sys-color-surface-container-highest)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Columns size={15} color="var(--md-sys-color-primary)" />
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
                {t('projectsTable.columnVisibility', 'Visibilidad de Columnas')}
              </h4>
            </div>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-sys-color-outline)', padding: 2, display: 'flex', alignItems: 'center' }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '280px', overflowY: 'auto', paddingRight: 4 }}>
            {cols.map(col => (
              <label 
                key={col.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  cursor: col.fixed ? 'not-allowed' : 'pointer',
                  opacity: col.fixed ? 0.6 : 1,
                  padding: '5px 8px',
                  borderRadius: '6px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!col.fixed) e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div 
                  style={{
                    width: 16, 
                    height: 16, 
                    borderRadius: 4, 
                    border: `2px solid ${col.visible ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'}`,
                    backgroundColor: col.visible ? 'var(--md-sys-color-primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                  {col.visible && <Check size={11} color="#fff" strokeWidth={3} />}
                </div>
                <input 
                  type="checkbox" 
                  checked={col.visible}
                  onChange={() => toggleColumn && toggleColumn(col.id)}
                  disabled={col.fixed}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface)', userSelect: 'none', flexGrow: 1 }}>
                  {col.label} {col.fixed && <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-outline)', marginLeft: 4 }}>({t('projectsTable.fixed', 'Fija')})</span>}
                </span>
              </label>
            ))}
          </div>

          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetColumns && resetColumns();
            }}
            style={{ 
              marginTop: 4,
              padding: '6px 10px', 
              background: 'transparent', 
              border: '1px dashed var(--md-sys-color-outline)', 
              borderRadius: '8px',
              color: 'var(--md-sys-color-outline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: '0.78rem',
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
            <RotateCcw size={13} />
            {t('projectsTable.resetDefault', 'Restablecer por defecto')}
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
