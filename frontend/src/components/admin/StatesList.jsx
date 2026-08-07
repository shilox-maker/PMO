import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown, ListChecks } from 'lucide-react';
import { getSortedData } from '../../utils/sorting';

export default function StatesList({ 
  states, 
  loading, 
  onNewStateClick, 
  onEditStateClick, 
  onDeleteStateClick,
  renderSortHeader 
}) {
  const { t } = useTranslation();
  const [statesSort, setStatesSort] = useState({ key: 'orden', direction: 'asc' });

  const handleStatesSort = (key) => {
    setStatesSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const defaultRenderSortHeader = (label, key, extraStyle = {}) => {
    const isSorted = statesSort.key === key;
    return (
      <th 
        onClick={() => handleStatesSort(key)} 
        style={{ cursor: 'pointer', userSelect: 'none', ...extraStyle }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: extraStyle.textAlign === 'center' ? 'center' : 'flex-start' }}>
          {label}
          {isSorted ? (
            statesSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
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
          <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>{t('statesAdmin.workflowTitle', { count: states.length })}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)' }}>
            {t('statesAdmin.workflowDesc')}
          </p>
        </div>
        <button 
          type="button"
          className="m3-btn m3-btn-primary" 
          onClick={onNewStateClick}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={18} /> {t('statesAdmin.newState')}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <RefreshCw className="animate-spin" size={28} style={{ color: 'var(--md-sys-color-primary)' }} />
        </div>
      ) : states.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--md-sys-color-outline)' }}>
          {t('statesAdmin.noStates')}
        </div>
      ) : (
        <div className="m3-table-wrapper">
          <table className="m3-table">
            <thead>
              <tr>
                {defaultRenderSortHeader(t('statesAdmin.order'), 'orden', { width: '80px', textAlign: 'center' })}
                {defaultRenderSortHeader(t('statesAdmin.state'), 'nombre_estado', { width: '200px' })}
                <th>{t('statesAdmin.description')}</th>
                {defaultRenderSortHeader(t('statesAdmin.icon'), 'icono', { width: '80px', textAlign: 'center' })}
                {defaultRenderSortHeader(t('generalLessons.type'), 'proyecto_cerrado', { width: '110px', textAlign: 'center' })}
                <th style={{ width: '130px', textAlign: 'center' }}>{t('statesAdmin.templateTasks')}</th>
                <th style={{ width: '100px', textAlign: 'center' }}>{t('statesAdmin.action')}</th>
              </tr>
            </thead>
            <tbody>
              {getSortedData(states, statesSort).map(st => (
                <tr key={st.id_estado}>
                  <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{st.orden}</td>
                  <td style={{ fontWeight: 600 }}>{st.nombre_estado}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)' }}>
                    {st.descripcion || <em style={{ opacity: 0.5 }}>{t('statesAdmin.noDesc')}</em>}
                  </td>
                  <td style={{ fontSize: '1.2rem', textAlign: 'center' }}>{st.icono || '❓'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {st.proyecto_cerrado ? (
                      <span className="badge badge-red" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{t('statesAdmin.closed')}</span>
                    ) : (
                      <span className="badge badge-blue" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{t('statesAdmin.open')}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 4, 
                        padding: '2px 8px', 
                        borderRadius: 12, 
                        backgroundColor: st.TareasPlantilla?.length ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        color: st.TareasPlantilla?.length ? '#f59e0b' : 'var(--md-sys-color-outline)',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      <ListChecks size={15} />
                      {st.TareasPlantilla?.length || 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                      <button 
                        className="icon-btn" 
                        onClick={() => onEditStateClick(st)} 
                        style={{ color: 'var(--md-sys-color-primary)' }} 
                        title={t('common.edit')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="icon-btn" 
                        onClick={() => onDeleteStateClick(st.id_estado)} 
                        style={{ color: 'var(--color-rag-red)' }} 
                        title={t('common.delete')}
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
