import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Check } from 'lucide-react';
import RichTextEditor from '../../../components/RichTextEditor';

export default function ProjectAlcanceTab({
  project, editingBlock, setEditingBlock, blockValue, setBlockValue, handleSaveBlock
}) {
  const { t } = useTranslation();

  const blocks = [
    { key: 'alcance_por_que', label: t('projectDetail.scopeTab.why', '¿Por qué se realiza este proyecto? (Justificación / Drivers de negocio)') },
    { key: 'alcance_objetivo', label: t('projectDetail.scopeTab.objective', 'Objetivo principal (Resultados esperados a nivel general)') },
    { key: 'alcance_resultados', label: t('projectDetail.scopeTab.results', 'Resultados específicos del proyecto (Entregables tangibles)') },
    { key: 'alcance_limitaciones', label: t('projectDetail.scopeTab.limitations', 'Limitaciones, exclusiones e hipótesis (Fuera de alcance)') },
    { key: 'alcance_integraciones', label: t('projectDetail.scopeTab.integrations', 'Integraciones con otros sistemas o dependencias') },
    { key: 'alcance_desarrollo', label: t('projectDetail.scopeTab.development', 'Cómo se desarrollará (Fases y metodología del socio)') },
    { key: 'cierre_aceptacion', label: t('projectDetail.scopeTab.closureAcceptance', 'Criterios de Aceptación (Condiciones necesarias para validar la entrega)') },
    { key: 'cierre_exito', label: t('projectDetail.scopeTab.closureSuccess', 'Criterios de Éxito (Métricas, KPIs y objetivos logrados)') }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>{t('projectDetail.scopeTab.title', 'Alcance y Criterios de Cierre')}</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>
          {t('projectDetail.scopeTab.subtitle', 'Haga doble clic en cualquier bloque o use el botón editar para redactar las especificaciones de alcance y de aceptación/cierre.')}
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
                    title={t('projectDetail.scopeTab.doneBtn', 'Listo')}
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '4px 10px',
                      color: 'var(--md-sys-color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={14} /> {t('projectDetail.scopeTab.doneBtn', 'Listo')}
                  </button>
                ) : (
                  <button 
                    className="icon-btn" 
                    onClick={() => {
                      setEditingBlock(b.key);
                      setBlockValue(value);
                    }}
                    title={t('common.edit', 'Editar')}
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
                  dangerouslySetInnerHTML={{ __html: value || `<p style="font-style: italic; opacity: 0.6;">${t('projectDetail.scopeTab.doubleClickPlaceholder', 'Doble clic para definir este bloque de alcance...')}</p>` }}
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
