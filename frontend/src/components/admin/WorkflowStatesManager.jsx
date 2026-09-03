import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp, ArrowDown, Trash2, Plus, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WorkflowStatesManager({ workflow, onWorkflowUpdated, getAuthHeaders }) {
  const { t } = useTranslation();
  const [allStates, setAllStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [selectedStateToAdd, setSelectedStateToAdd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentStates = (workflow?.Estados || []).slice().sort((a, b) => {
    const ordA = a.Workflow_Estados?.orden ?? a.orden ?? 0;
    const ordB = b.Workflow_Estados?.orden ?? b.orden ?? 0;
    return ordA - ordB;
  });

  const fetchAllMasterStates = () => {
    setLoadingStates(true);
    fetch(`${import.meta.env.VITE_API_URL}/admin/states`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar catálogo de estados.');
        return res.json();
      })
      .then(data => {
        setAllStates(Array.isArray(data) ? data : []);
        setLoadingStates(false);
      })
      .catch(err => {
        setError(err.message);
        setLoadingStates(false);
      });
  };

  useEffect(() => {
    fetchAllMasterStates();
  }, []);

  const availableStatesToAdd = allStates.filter(
    st => !currentStates.some(cs => cs.id_estado === st.id_estado)
  );

  const handleSaveStateList = (newStatesList) => {
    if (!workflow?.id) return;
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      states: newStatesList.map((st, idx) => ({
        id_estado: st.id_estado,
        orden: idx + 1
      }))
    };

    fetch(`${import.meta.env.VITE_API_URL}/admin/workflows/${workflow.id}/states`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar estados del flujo.');
        return data;
      })
      .then(() => {
        setSuccess(t('workflowsAdmin.statesSaved', 'Estados y orden del flujo actualizados correctamente.'));
        setSaving(false);
        if (onWorkflowUpdated) onWorkflowUpdated();
      })
      .catch(err => {
        setError(err.message);
        setSaving(false);
      });
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...currentStates];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    handleSaveStateList(updated);
  };

  const handleMoveDown = (index) => {
    if (index === currentStates.length - 1) return;
    const updated = [...currentStates];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    handleSaveStateList(updated);
  };

  const handleRemoveState = (id_estado) => {
    const updated = currentStates.filter(st => st.id_estado !== id_estado);
    handleSaveStateList(updated);
  };

  const handleAddState = (e) => {
    e.preventDefault();
    if (!selectedStateToAdd) return;
    const stateObj = allStates.find(st => Number(st.id_estado) === Number(selectedStateToAdd));
    if (!stateObj) return;

    const updated = [...currentStates, stateObj];
    setSelectedStateToAdd('');
    handleSaveStateList(updated);
  };

  if (!workflow?.id) {
    return (
      <div className="m3-card glass-panel" style={{ padding: 20, textAlign: 'center', color: 'var(--md-sys-color-outline)' }}>
        {t('workflowsAdmin.saveFirstToManageStates', 'Guarda el flujo de trabajo primero para poder configurar sus estados y secuencia.')}
      </div>
    );
  }

  return (
    <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h4 style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>
            {t('workflowsAdmin.statesInWorkflow', 'Estados del Flujo de Trabajo')} ({currentStates.length})
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', margin: '4px 0 0 0' }}>
            {t('workflowsAdmin.statesInWorkflowDesc', 'Configura los estados válidos para los proyectos de este flujo y define su secuencia cronológica.')}
          </p>
        </div>

        {saving && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--md-sys-color-primary)' }}>
            <RefreshCw className="animate-spin" size={16} /> {t('common.saving', 'Guardando cambios...')}
          </div>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 12, fontSize: '0.85rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--color-rag-green)', padding: 12, borderRadius: 12, fontSize: '0.85rem' }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Agregar estado desde catálogo */}
      <form onSubmit={handleAddState} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', backgroundColor: 'var(--md-sys-color-surface-container-low, rgba(255,255,255,0.03))', padding: 12, borderRadius: 12 }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <select
            value={selectedStateToAdd}
            onChange={(e) => setSelectedStateToAdd(e.target.value)}
            disabled={saving || loadingStates || availableStatesToAdd.length === 0}
            className="user-select"
            style={{ width: '100%', height: '38px' }}
          >
            <option value="">
              {availableStatesToAdd.length === 0 
                ? t('workflowsAdmin.allStatesAdded', 'Todos los estados maestros ya están añadidos') 
                : t('workflowsAdmin.selectStateToAdd', 'Seleccionar estado para añadir al flujo...')}
            </option>
            {availableStatesToAdd.map(st => (
              <option key={st.id_estado} value={st.id_estado}>
                {st.icono || '❓'} {st.nombre_estado} {st.proyecto_cerrado ? `(${t('statesAdmin.closed', 'Cerrado')})` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!selectedStateToAdd || saving}
          className="m3-btn m3-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: '38px' }}
        >
          <Plus size={16} /> {t('workflowsAdmin.addState', 'Añadir Estado')}
        </button>
      </form>

      {/* Tabla de estados actuales del flujo */}
      {currentStates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--md-sys-color-outline)', border: '1px dashed var(--md-sys-color-outline-variant, rgba(255,255,255,0.1))', borderRadius: 12 }}>
          {t('workflowsAdmin.emptyWorkflowStates', 'Este flujo aún no tiene estados asignados. Selecciona estados del desplegable superior para agregarlos.')}
        </div>
      ) : (
        <div className="m3-table-wrapper">
          <table className="m3-table">
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>{t('statesAdmin.order', 'Paso')}</th>
                <th style={{ width: '60px', textAlign: 'center' }}>{t('statesAdmin.icon', 'Icono')}</th>
                <th>{t('statesAdmin.state', 'Estado')}</th>
                <th style={{ width: '110px', textAlign: 'center' }}>{t('generalLessons.type', 'Tipo')}</th>
                <th style={{ width: '120px', textAlign: 'center' }}>{t('statesAdmin.templateTasks', 'Plantilla')}</th>
                <th style={{ width: '150px', textAlign: 'center' }}>{t('common.actions', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody>
              {currentStates.map((st, idx) => (
                <tr key={st.id_estado}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', backgroundColor: 'var(--md-sys-color-primary-container, rgba(0,122,255,0.15))', color: 'var(--md-sys-color-primary, #007aff)', fontSize: '0.85rem' }}>
                      {idx + 1}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '1.25rem' }}>
                    {st.icono || '❓'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{st.nombre_estado}</div>
                    {st.descripcion && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                        {st.descripcion}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {st.proyecto_cerrado ? (
                      <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>{t('statesAdmin.closed', 'Cerrado')}</span>
                    ) : (
                      <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>{t('statesAdmin.open', 'Abierto')}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span 
                      style={{ 
                        padding: '3px 8px', 
                        borderRadius: 12, 
                        fontSize: '0.75rem',
                        backgroundColor: st.TareasPlantilla?.length ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        color: st.TareasPlantilla?.length ? '#f59e0b' : 'var(--md-sys-color-outline)'
                      }}
                    >
                      {st.TareasPlantilla?.length || 0} {t('statesAdmin.tasksCount', 'tareas')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0 || saving}
                        title={t('workflowsAdmin.moveUp', 'Subir orden')}
                        className="m3-btn-icon"
                        style={{ padding: 6, opacity: idx === 0 ? 0.3 : 1 }}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === currentStates.length - 1 || saving}
                        title={t('workflowsAdmin.moveDown', 'Bajar orden')}
                        className="m3-btn-icon"
                        style={{ padding: 6, opacity: idx === currentStates.length - 1 ? 0.3 : 1 }}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveState(st.id_estado)}
                        disabled={saving}
                        title={t('workflowsAdmin.removeState', 'Quitar del flujo')}
                        className="m3-btn-icon"
                        style={{ padding: 6, color: 'var(--color-rag-red)' }}
                      >
                        <Trash2 size={15} />
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
