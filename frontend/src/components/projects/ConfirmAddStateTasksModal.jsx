import React, { useState } from 'react';
import { X, CheckSquare, Square, Flag, CheckCircle2, ListPlus } from 'lucide-react';

export default function ConfirmAddStateTasksModal({ 
  targetState, 
  onConfirm, 
  onSkip, 
  onCancel,
  loading 
}) {
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
            <span>Añadir Tareas de Estado ({targetState?.icono || ''} {targetState?.nombre_estado})</span>
          </h3>
          <button className="icon-btn" onClick={onCancel} title="Cancelar">
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)', marginBottom: 16, lineHeight: '1.5' }}>
          El nuevo estado <strong>{targetState?.nombre_estado}</strong> cuenta con tareas preconfiguradas en administración. Selecciona las que deseas añadir a la lista de tareas del proyecto:
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
                    title={allSelected ? 'Desmarcar todas' : 'Marcar todas'}
                  >
                    {allSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th style={{ width: '35px' }}>Tipo</th>
                <th>Tarea / Hito</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const isChecked = selectedTaskIds.has(t.id);
                return (
                  <tr 
                    key={t.id} 
                    onClick={() => toggleTask(t.id)} 
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
                      {t.es_hito ? (
                        <Flag size={16} style={{ color: '#f59e0b' }} title="Hito" />
                      ) : (
                        <CheckCircle2 size={16} style={{ color: 'var(--md-sys-color-primary)' }} title="Tarea" />
                      )}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.nombre_tarea}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{t.descripcion || '—'}</td>
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
            Cambiar estado sin añadir tareas
          </button>

          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              type="button" 
              className="m3-btn m3-btn-outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="m3-btn m3-btn-primary" 
              onClick={handleConfirmAdd}
              disabled={loading || selectedTaskIds.size === 0}
            >
              {loading ? 'Añadiendo...' : `Añadir Tareas (${selectedTaskIds.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
