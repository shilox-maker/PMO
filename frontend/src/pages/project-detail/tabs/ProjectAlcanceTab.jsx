import React from 'react';
import { Edit2, Check, X } from 'lucide-react';
import RichTextEditor from '../../../components/RichTextEditor';

export default function ProjectAlcanceTab({
  project, editingBlock, setEditingBlock, blockValue, setBlockValue, handleSaveBlock
}) {
  const blocks = [
    { key: 'alcance_por_que', label: '¿Por qué se realiza este proyecto? (Justificación / Drivers de negocio)' },
    { key: 'alcance_objetivo', label: 'Objetivo principal (Resultados esperados a nivel general)' },
    { key: 'alcance_resultados', label: 'Resultados específicos del proyecto (Entregables tangibles)' },
    { key: 'alcance_limitaciones', label: 'Limitaciones, exclusiones e hipótesis (Fuera de alcance)' },
    { key: 'alcance_integraciones', label: 'Integraciones con otros sistemas o dependencias' },
    { key: 'alcance_desarrollo', label: 'Cómo se desarrollará (Fases y metodología del socio)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Definición del Alcance</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>
          Haga doble clic en cualquier bloque o use el botón editar para redactar las especificaciones del alcance del proyecto.
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
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="icon-btn" 
                      onClick={() => setEditingBlock(null)} 
                      title="Cancelar"
                      style={{ color: 'var(--color-rag-red)' }}
                    >
                      <X size={16} />
                    </button>
                    <button 
                      className="icon-btn" 
                      onClick={() => handleSaveBlock(b.key)} 
                      title="Guardar"
                      style={{ color: 'var(--color-rag-green)' }}
                    >
                      <Check size={16} />
                    </button>
                  </div>
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
                  <RichTextEditor value={blockValue} onChange={setBlockValue} />
                </div>
              ) : (
                <div 
                  className="wysiwyg-content" 
                  dangerouslySetInnerHTML={{ __html: value || '<p style="font-style: italic; opacity: 0.6;">Doble clic para definir este bloque de alcance...</p>' }}
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
