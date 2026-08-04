import React from 'react';
import { Edit2, Check, X } from 'lucide-react';
import RichTextEditor from '../../../components/RichTextEditor';

export default function ProjectCierreTab({
  project, editingBlock, setEditingBlock, blockValue, setBlockValue, handleSaveBlock
}) {
  const blocks = [
    { key: 'cierre_aceptacion', label: 'Criterios de Aceptación (Condiciones necesarias para validar la entrega)' },
    { key: 'cierre_exito', label: 'Criterios de Éxito (Métricas, KPIs y objetivos logrados)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Criterios de Cierre de Proyecto</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>
          Haga doble clic en cualquier bloque o use el botón editar para redactar las especificaciones y métricas de validación del proyecto.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
        {blocks.map((b) => {
          const isEditing = editingBlock === b.key;
          const value = project[b.key] || '';

          return (
            <div 
              key={b.key} 
              className="m3-card glass-panel" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 12,
                border: isEditing ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)'
              }}
              onDoubleClick={() => {
                if (!isEditing) {
                  setEditingBlock(b.key);
                  setBlockValue(value);
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {b.label}
                </h4>
                {isEditing ? (
                  <button 
                    type="button"
                    className="m3-btn m3-btn-text" 
                    onClick={() => setEditingBlock(null)} 
                    title="Cerrar modo edición (auto-guardado activo)"
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '4px 10px',
                      color: 'var(--md-sys-color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={14} /> Listo
                  </button>
                ) : (
                  <button 
                    className="icon-btn" 
                    onClick={() => {
                      setEditingBlock(b.key);
                      setBlockValue(value);
                    }}
                    title="Editar bloque"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div style={{ minHeight: 200 }}>
                  <RichTextEditor 
                    value={blockValue} 
                    onChange={setBlockValue}
                    onAutoSave={(newContent) => handleSaveBlock(b.key, newContent)}
                  />
                </div>
              ) : (
                <div 
                  className="wysiwyg-content" 
                  dangerouslySetInnerHTML={{ __html: value || '<p style="font-style: italic; opacity: 0.6;">Doble clic para definir este bloque de cierre...</p>' }}
                  style={{ 
                    fontSize: '0.85rem', 
                    lineHeight: '1.6', 
                    color: 'var(--md-sys-color-on-surface)',
                    minHeight: 100,
                    padding: 8,
                    backgroundColor: 'rgba(0,0,0,0.01)',
                    borderRadius: 8
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
