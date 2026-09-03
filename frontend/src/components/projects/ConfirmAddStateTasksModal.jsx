import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckSquare, Square, Flag, CheckCircle2, ListPlus } from 'lucide-react';

export default function ConfirmAddStateTasksModal({ 
  targetState, 
  isCreationMode = false,
  onConfirm, 
  onSkip, 
  onCancel, 
  loading 
}) {
  const { t } = useTranslation();
  const tasks = targetState?.TareasPlantilla || [];
  
  // Por defecto todas las tareas seleccionadas
  const [selectedTaskIds, setSelectedTaskIds] = useState(
    () => new Set(tasks.map(t => t.id))
  );

  const allSelected = tasks.length > 0 && selectedTaskIds.size === tasks.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map(t => t.id)));
    }
  };

  const toggleTask = (id) => {
    const next = new Set(selectedTaskIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTaskIds(next);
  };

  const handleConfirmAdd = () => {
    const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
    onConfirm(selectedTasks);
  };

  const stateName = targetState?.nombre_estado || '';
  const stateIcon = targetState?.icono || '';
  const fullStateLabel = `${stateIcon} ${stateName}`.trim();

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.65)', 
        backdropFilter: 'blur(6px)', 
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 10000, 
        padding: '24px' 
      }}
    >
      <div 
        className="m3-card glass-panel" 
        style={{ 
          maxWidth: '650px', 
          width: '92%', 
          padding: '24px', 
          maxHeight: '90vh', 
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 600, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-sys-color-primary)' }}>
            <ListPlus size={22} />
            <span>
              {isCreationMode
                ? t('stateTasksModal.titleCreateProject', { state: fullStateLabel, defaultValue: `Añadir Tareas de Estado Inicial (${fullStateLabel})` })
                : t('stateTasksModal.titleChangeState', { state: fullStateLabel, defaultValue: `Añadir Tareas de Estado (${fullStateLabel})` })
              }
            </span>
          </h3>
          <button className="icon-btn" onClick={onCancel} title={t('common.cancel', 'Cancelar')}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)', marginBottom: 16, lineHeight: '1.5' }}>
          {isCreationMode
            ? t('stateTasksModal.descCreateProject', { state: stateName, defaultValue: `El estado inicial (${stateName}) cuenta con tareas preconfiguradas en administración. Selecciona las que deseas añadir a la lista de tareas del nuevo proyecto:` })
            : t('stateTasksModal.descChangeState', { state: stateName, defaultValue: `El nuevo estado (${stateName}) cuenta con tareas preconfiguradas en administración. Selecciona las que deseas añadir a la lista de tareas del proyecto:` })
          }
        </p>

        {/* Tabla de tareas preconfiguradas */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '12px', marginBottom: 24 }}>
          <table className="m3-table" style={{ width: '100%', margin: 0 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <button 
                    type="button" 
                    onClick={toggleSelectAll} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-sys-color-primary)' }}
                    title={allSelected ? t('stateTasksModal.unselectAll', 'Desmarcar todas') : t('stateTasksModal.selectAll', 'Marcar todas')}
                  >
                    {allSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th style={{ width: '35px' }}>{t('stateTasksModal.type', 'Tipo')}</th>
                <th>{t('stateTasksModal.taskOrMilestone', 'Tarea / Hito')}</th>
                <th>{t('stateTasksModal.description', 'Descripción')}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t_item => {
                const isChecked = selectedTaskIds.has(t_item.id);
                return (
                  <tr 
                    key={t_item.id} 
                    onClick={() => toggleTask(t_item.id)} 
                    style={{ cursor: 'pointer', backgroundColor: isChecked ? 'rgba(56, 189, 248, 0.08)' : 'transparent' }}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => {}} 
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      {t_item.es_hito ? (
                        <Flag size={16} style={{ color: '#f59e0b' }} title={t('stateTasksModal.milestone', 'Hito')} />
                      ) : (
                        <CheckCircle2 size={16} style={{ color: 'var(--md-sys-color-primary)' }} title={t('stateTasksModal.task', 'Tarea')} />
                      )}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t_item.nombre_tarea}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{t_item.descripcion || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="m3-btn m3-btn-outline" 
            onClick={onSkip}
            disabled={loading}
            style={{ fontSize: '0.85rem' }}
          >
            {isCreationMode
              ? t('stateTasksModal.skipCreateProject', 'Crear proyecto sin añadir tareas')
              : t('stateTasksModal.skipChangeState', 'Cambiar estado sin añadir tareas')
            }
          </button>

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              type="button" 
              className="m3-btn m3-btn-outline" 
              onClick={onCancel}
              disabled={loading}
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button 
              type="button" 
              className="m3-btn m3-btn-primary" 
              onClick={handleConfirmAdd}
              disabled={loading || selectedTaskIds.size === 0}
            >
              {loading 
                ? (isCreationMode ? t('stateTasksModal.creatingAndAdding', 'Creando y añadiendo...') : t('stateTasksModal.addingTasks', 'Añadiendo...'))
                : t('stateTasksModal.addTasksBtn', { count: selectedTaskIds.size, defaultValue: `Añadir Tareas (${selectedTaskIds.size})` })
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
