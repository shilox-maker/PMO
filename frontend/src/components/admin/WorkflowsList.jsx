import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown, GitBranch, Star } from 'lucide-react';
import { getSortedData } from '../../utils/sorting';

export default function WorkflowsList({
  workflows,
  loading,
  onNewWorkflowClick,
  onEditWorkflowClick,
  onDeleteWorkflowClick
}) {
  const { t } = useTranslation();
  const [workflowsSort, setWorkflowsSort] = useState({ key: 'is_default', direction: 'desc' });

  const handleSort = (key) => {
    setWorkflowsSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortHeader = (label, key, extraStyle = {}) => {
    const isSorted = workflowsSort.key === key;
    return (
      <th
        onClick={() => handleSort(key)}
        style={{ cursor: 'pointer', userSelect: 'none', ...extraStyle }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: extraStyle.textAlign === 'center' ? 'center' : 'flex-start' }}>
          {label}
          {isSorted ? (
            workflowsSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          ) : (
            <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.25rem', margin: 0 }}>
            {t('workflowsAdmin.title', 'Flujos de Trabajo')} ({workflows.length})
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', margin: '4px 0 0 0' }}>
            {t('workflowsAdmin.subtitle', 'Define los flujos de ciclo de vida disponibles para proyectos y los estados válidos en cada flujo.')}
          </p>
        </div>
        <button
          type="button"
          className="m3-btn m3-btn-primary"
          onClick={onNewWorkflowClick}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={18} /> {t('workflowsAdmin.newWorkflow', 'Nuevo Flujo de Trabajo')}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <RefreshCw className="animate-spin" size={28} style={{ color: 'var(--md-sys-color-primary)' }} />
        </div>
      ) : workflows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--md-sys-color-outline)' }}>
          {t('workflowsAdmin.noWorkflows', 'No hay flujos de trabajo configurados.')}
        </div>
      ) : (
        <div className="m3-table-wrapper">
          <table className="m3-table">
            <thead>
              <tr>
                {renderSortHeader(t('workflowsAdmin.name', 'Nombre'), 'nombre', { width: '250px' })}
                <th>{t('common.description', 'Descripción')}</th>
                {renderSortHeader(t('ambitos.scopeLabel', 'Ámbito'), 'id_ambito', { width: '180px' })}
                <th style={{ width: '120px', textAlign: 'center' }}>{t('workflowsAdmin.projectCount', 'Proyectos')}</th>
                {renderSortHeader(t('common.status', 'Estado'), 'activo', { width: '120px', textAlign: 'center' })}
                <th style={{ width: '120px', textAlign: 'center' }}>{t('common.actions', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody>
              {getSortedData(workflows, workflowsSort).map(wf => (
                <tr key={wf.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {wf.is_default && (
                        <span title={t('workflowsAdmin.isDefault', 'Flujo Predeterminado')} style={{ color: '#f59e0b', fontSize: '1rem' }}>
                          ⭐
                        </span>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>{wf.nombre}</div>
                        {wf.code && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', fontFamily: 'monospace' }}>
                            {wf.code}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)' }}>
                    {wf.descripcion || <em style={{ opacity: 0.5 }}>{t('common.noDescription', 'Sin descripción')}</em>}
                  </td>
                  <td>
                    {wf.Ambito ? (
                      <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                        {wf.Ambito.nombre}
                      </span>
                    ) : (
                      <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
                        🌐 {t('workflowsAdmin.globalScope', 'Global')}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    <span style={{ fontSize: '0.85rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface-container-high, rgba(255,255,255,0.06))' }}>
                      {wf.projectCount || 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {wf.activo ? (
                      <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>{t('common.active', 'Activo')}</span>
                    ) : (
                      <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>{t('common.inactive', 'Inactivo')}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => onEditWorkflowClick(wf)}
                        className="m3-btn-icon"
                        title={t('common.edit', 'Editar')}
                        style={{ padding: 6 }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteWorkflowClick(wf.id)}
                        className="m3-btn-icon"
                        title={t('common.delete', 'Eliminar')}
                        style={{ padding: 6, color: 'var(--color-rag-red)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
