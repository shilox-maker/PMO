import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, X } from 'lucide-react';

export default function ProjectTagsSelect({ 
  projectId, 
  projectTags = [], 
  getAuthHeaders, 
  onUpdateProject 
}) {
  const [allTags, setAllTags] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const fetchTags = () => {
    fetch(`${import.meta.env.VITE_API_URL}/tags`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllTags(data);
      })
      .catch(err => console.error('Error fetching tags:', err));
  };

  useEffect(() => {
    fetchTags();
    
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTags = useMemo(() => {
    const query = inputValue.toLowerCase().trim();
    if (!query) return allTags;
    return allTags.filter(t => t.nombre.toLowerCase().includes(query));
  }, [allTags, inputValue]);

  const exactMatchExists = useMemo(() => {
    const query = inputValue.toLowerCase().trim();
    return allTags.some(t => t.nombre.toLowerCase() === query);
  }, [allTags, inputValue]);

  const handleSelectTag = (tag) => {
    const alreadySelected = projectTags.some(t => t.id === tag.id);
    if (!alreadySelected) {
      const newTagIds = [...projectTags.map(t => t.id), tag.id];
      onUpdateProject({ tagIds: newTagIds });
    }
    setInputValue('');
    setIsOpen(false);
  };

  const handleRemoveTag = (tagId) => {
    const newTagIds = projectTags.filter(t => t.id !== tagId).map(t => t.id);
    onUpdateProject({ tagIds: newTagIds });
  };

  const handleCreateTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    fetch(`${import.meta.env.VITE_API_URL}/tags`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ nombre: trimmed })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear tag');
        return data;
      })
      .then((newTag) => {
        // Add to global tags list
        setAllTags(prev => [...prev, newTag].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        // Add to project tags
        const newTagIds = [...projectTags.map(t => t.id), newTag.id];
        onUpdateProject({ tagIds: newTagIds });
        setInputValue('');
        setIsOpen(false);
      })
      .catch(err => alert(err.message));
  };

  return (
    <div className="tags-select-container" ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Categorización (Etiquetas / Tags)</label>
      
      {/* Combobox container */}
      <div style={{ position: 'relative', width: '100%' }}>
        <div 
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 10px',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: 'var(--md-shape-corner-medium)',
            cursor: 'text',
            minHeight: '40px',
            transition: 'var(--transition-smooth)'
          }}
        >
          <input 
            type="text"
            placeholder={projectTags.length === 0 ? "Buscar o crear etiquetas..." : ""}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              color: 'var(--md-sys-color-on-surface)',
              fontSize: '0.85rem',
              width: '100%',
              padding: '6px 0'
            }}
          />
        </div>

        {/* Dropdown panel */}
        {isOpen && (
          <div 
            className="glass-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: 'var(--md-sys-color-surface-container-highest)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              borderRadius: 'var(--md-shape-corner-medium)',
              boxShadow: 'var(--md-elevation-3)',
              padding: '6px',
              maxHeight: '220px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {filteredTags.map(tag => {
              const isSelected = projectTags.some(t => t.id === tag.id);
              return (
                <div 
                  key={tag.id}
                  onClick={() => handleSelectTag(tag)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    backgroundColor: isSelected ? 'rgba(168, 199, 250, 0.15)' : 'transparent',
                    color: isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface)',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? 'rgba(168, 199, 250, 0.15)' : 'transparent'}
                >
                  {tag.nombre}
                </div>
              );
            })}

            {filteredTags.length === 0 && !inputValue.trim() && (
              <div style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', textAlign: 'center' }}>
                No hay etiquetas creadas en el sistema. Escribe para crear una.
              </div>
            )}

            {inputValue.trim() && !exactMatchExists && (
              <div 
                onClick={handleCreateTag}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--md-sys-color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Plus size={14} />
                <span>Crear etiqueta: "{inputValue.trim()}"</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Badges area */}
      {projectTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {projectTags.map(tag => (
            <span 
              key={tag.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                borderRadius: '100px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              {tag.nombre}
              <X 
                size={12} 
                style={{ cursor: 'pointer', opacity: 0.8 }} 
                onClick={() => handleRemoveTag(tag.id)} 
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
