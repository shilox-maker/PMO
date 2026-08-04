import React, { useState, useEffect, useRef } from 'react';
import sanitizeHtml from '../utils/sanitizeHtml';
import RichTextToolbar from './editor/RichTextToolbar';

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Escribe un comentario...", 
  onAutoSave, 
  autoSaveDelay = 1500 
}) {
  const editorRef = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const isInternalChange = useRef(false);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const saveTimerRef = useRef(null);
  const latestContentRef = useRef(value || '');

  useEffect(() => {
    latestContentRef.current = value || '';
  }, [value]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

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

  const triggerAutoSave = (content) => {
    setSaveStatus('unsaved');
    if (!onAutoSave) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await onAutoSave(content);
        setSaveStatus('saved');
        setLastSavedTime(new Date());
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('error');
      }
    }, autoSaveDelay);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      isInternalChange.current = true;
      latestContentRef.current = html;
      onChange(html);
      triggerAutoSave(html);
    }
  };

  const executeCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
      setTimeout(() => {
        if (editorRef.current) {
          const listType = command === 'insertUnorderedList' ? 'ul' : 'ol';
          const styleStr = command === 'insertUnorderedList' 
            ? 'list-style-type: disc; margin-left: 20px; padding-left: 0;'
            : 'list-style-type: decimal; margin-left: 20px; padding-left: 0;';
          const lists = editorRef.current.querySelectorAll(listType);
          lists.forEach(l => l.setAttribute('style', styleStr));
          handleInput();
        }
      }, 10);
    } else {
      handleInput();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
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
      display: 'flex',
      flexDirection: 'column',
      minHeight: '180px',
      position: 'relative'
    }}>
      <RichTextToolbar 
        onExecuteCommand={executeCommand}
        showColorPicker={showColorPicker}
        setShowColorPicker={setShowColorPicker}
        colors={colors}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
      />

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
