import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Palette, ChevronDown } from 'lucide-react';

// Sanitization function helper to clean clipboard HTML from Microsoft Outlook/Word
function sanitizeHtml(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.nodeValue);
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const tagName = node.tagName.toLowerCase();
    
    // Allowed tags list
    const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'span', 'p', 'br', 'ul', 'ol', 'li', 'img', 'font'];
    
    if (!allowedTags.includes(tagName)) {
      // If tag is not allowed, recursively keep children
      const fragment = document.createDocumentFragment();
      Array.from(node.childNodes).forEach(child => {
        const cleaned = cleanNode(child);
        if (cleaned) fragment.appendChild(cleaned);
      });
      return fragment;
    }

    const cleanEl = document.createElement(tagName);
    
    // Process styling (keep color and set proper lists margins/types)
    const style = node.getAttribute('style');
    let inlineStyle = '';
    if (style) {
      const colorMatch = style.match(/color\s*:\s*([^;]+)/i);
      if (colorMatch) {
        inlineStyle += `color: ${colorMatch[1]}; `;
      }
    }
    
    if (tagName === 'ul') {
      inlineStyle += 'list-style-type: disc; margin-left: 20px; padding-left: 0; ';
    } else if (tagName === 'ol') {
      inlineStyle += 'list-style-type: decimal; margin-left: 20px; padding-left: 0; ';
    }
    
    if (inlineStyle) {
      cleanEl.setAttribute('style', inlineStyle.trim());
    }

    // Specially handle img attributes (src, style)
    if (tagName === 'img') {
      const src = node.getAttribute('src');
      if (src) {
        cleanEl.setAttribute('src', src);
      }
      cleanEl.setAttribute('style', 'max-width: 100%; border-radius: 8px; margin: 8px 0;');
    }

    // Recursively clean children
    Array.from(node.childNodes).forEach(child => {
      const cleaned = cleanNode(child);
      if (cleaned) cleanEl.appendChild(cleaned);
    });

    return cleanEl;
  }

  const fragment = document.createDocumentFragment();
  Array.from(doc.body.childNodes).forEach(child => {
    const cleaned = cleanNode(child);
    if (cleaned) fragment.appendChild(cleaned);
  });

  const tempDiv = document.createElement('div');
  tempDiv.appendChild(fragment);
  return tempDiv.innerHTML;
}

export default function RichTextEditor({ value, onChange, placeholder = "Escribe un comentario..." }) {
  const editorRef = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const isInternalChange = useRef(false);

  // Load and sync value, preventing cursor jumping
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (isInternalChange.current) {
        isInternalChange.current = false;
      } else {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    handleInput();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    
    // Check for images
    const items = clipboardData.items;
    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          const imgHtml = `<img src="${event.target.result}" style="max-width: 100%; border-radius: 8px; margin: 8px 0;" />`;
          document.execCommand('insertHTML', false, imgHtml);
          handleInput();
        };
        reader.readAsDataURL(file);
        hasImage = true;
      }
    }

    if (hasImage) return;

    // Process text/html or text/plain
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');

    if (html) {
      const cleanHtml = sanitizeHtml(html);
      document.execCommand('insertHTML', false, cleanHtml);
    } else if (text) {
      const textHtml = text.replace(/\n/g, '<br>');
      document.execCommand('insertHTML', false, textHtml);
    }
    handleInput();
  };

  // Color picker colors
  const colors = [
    { name: 'Predeterminado', value: 'var(--md-sys-color-on-surface)' },
    { name: 'Rojo', value: '#ff453a' },
    { name: 'Naranja', value: '#ff9f0a' },
    { name: 'Amarillo', value: '#ffd60a' },
    { name: 'Verde', value: '#30d158' },
    { name: 'Azul', value: '#0a84ff' },
    { name: 'Morado', value: '#bf5af2' }
  ];

  return (
    <div style={{
      border: '1px solid var(--md-sys-color-outline-variant)',
      borderRadius: 'var(--md-shape-corner-large)',
      backgroundColor: 'var(--md-sys-color-surface-container)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '180px',
      position: 'relative'
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
        flexWrap: 'wrap',
        zIndex: 2
      }}>
        <button 
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('bold')}
          style={{
            padding: '6px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            color: 'var(--md-sys-color-on-surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Negrita"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-highest)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Bold size={16} />
        </button>

        <button 
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeCommand('italic')}
          style={{
            padding: '6px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            color: 'var(--md-sys-color-on-surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Cursiva"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-highest)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Italic size={16} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 4px' }} />

        <button 
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            executeCommand('insertUnorderedList');
            setTimeout(() => {
              if (editorRef.current) {
                const uls = editorRef.current.querySelectorAll('ul');
                uls.forEach(ul => {
                  ul.setAttribute('style', 'list-style-type: disc; margin-left: 20px; padding-left: 0;');
                });
                handleInput();
              }
            }, 10);
          }}
          style={{
            padding: '6px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            color: 'var(--md-sys-color-on-surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Lista desordenada"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-highest)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <List size={16} />
        </button>

        <button 
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            executeCommand('insertOrderedList');
            setTimeout(() => {
              if (editorRef.current) {
                const ols = editorRef.current.querySelectorAll('ol');
                ols.forEach(ol => {
                  ol.setAttribute('style', 'list-style-type: decimal; margin-left: 20px; padding-left: 0;');
                });
                handleInput();
              }
            }, 10);
          }}
          style={{
            padding: '6px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            color: 'var(--md-sys-color-on-surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Lista ordenada"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-highest)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ListOrdered size={16} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 4px' }} />

        {/* Color picker */}
        <div style={{ position: 'relative' }}>
          <button 
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowColorPicker(!showColorPicker)}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
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
                      executeCommand('foreColor', defaultColor);
                    } else {
                      executeCommand('foreColor', c.value);
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

      {/* Editor Content Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{
          flexGrow: 1,
          padding: '12px 16px',
          outline: 'none',
          fontSize: '0.95rem',
          color: 'var(--md-sys-color-on-surface)',
          minHeight: '120px',
          lineHeight: '1.6'
        }}
      />
      
      {/* Placeholder Style */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--md-sys-color-outline);
          cursor: text;
        }
      `}</style>
    </div>
  );
}
