import React from 'react';
import { Bold, Italic, List, ListOrdered, Palette, ChevronDown } from 'lucide-react';
import AutoSaveStatus from './AutoSaveStatus';

export default function RichTextToolbar({
  onExecuteCommand,
  showColorPicker,
  setShowColorPicker,
  colors,
  saveStatus,
  lastSavedTime
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      padding: '6px 10px',
      borderBottom: '1px solid var(--md-sys-color-outline-variant)',
      backgroundColor: 'var(--md-sys-color-surface-container-high)',
      flexWrap: 'wrap',
      zIndex: 2,
      borderTopLeftRadius: 'var(--md-shape-corner-large)',
      borderTopRightRadius: 'var(--md-shape-corner-large)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <button 
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExecuteCommand('bold')}
          style={btnStyle}
          title="Negrita"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-highest)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Bold size={16} />
        </button>

        <button 
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExecuteCommand('italic')}
          style={btnStyle}
          title="Cursiva"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-highest)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Italic size={16} />
        </button>

        <div style={dividerStyle} />

        <button 
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExecuteCommand('insertUnorderedList')}
          style={btnStyle}
          title="Lista desordenada"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-highest)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <List size={16} />
        </button>

        <button 
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExecuteCommand('insertOrderedList')}
          style={btnStyle}
          title="Lista ordenada"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-highest)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ListOrdered size={16} />
        </button>

        <div style={dividerStyle} />

        {/* Color picker */}
        <div style={{ position: 'relative' }}>
          <button 
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowColorPicker(!showColorPicker)}
            style={{ ...btnStyle, gap: '4px' }}
            title="Color de texto"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-highest)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Palette size={16} />
            <ChevronDown size={12} />
          </button>

          {showColorPicker && (
            <div 
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: '8px',
                padding: '8px',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                boxShadow: 'var(--md-elevation-2)',
                minWidth: '130px'
              }}
            >
              {colors.map(c => (
                <div 
                  key={c.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (c.value.startsWith('var(')) {
                      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
                      const defaultColor = isLight ? '#1f1f1f' : '#e2e2e6';
                      onExecuteCommand('foreColor', defaultColor);
                    } else {
                      onExecuteCommand('foreColor', c.value);
                    }
                    setShowColorPicker(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: 'var(--md-sys-color-on-surface)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.value, border: '1px solid var(--md-sys-color-outline)' }} />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Auto Save Micro-feedback */}
      <AutoSaveStatus status={saveStatus} lastSavedTime={lastSavedTime} />
    </div>
  );
}

const btnStyle = {
  padding: '6px',
  borderRadius: '6px',
  border: 'none',
  background: 'transparent',
  color: 'var(--md-sys-color-on-surface)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center'
};

const dividerStyle = {
  width: '1px',
  height: '18px',
  backgroundColor: 'var(--md-sys-color-outline-variant)',
  margin: '0 4px'
};
