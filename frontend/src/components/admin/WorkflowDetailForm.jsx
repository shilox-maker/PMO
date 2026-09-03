import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import WorkflowStatesManager from './WorkflowStatesManager';

export default function WorkflowDetailForm({ initialWorkflow, onBack, onWorkflowSaved, getAuthHeaders }) {
  const { t } = useTranslation();
  const [ambitos, setAmbitos] = useState([]);
  const [loadingAmbitos, setLoadingAmbitos] = useState(false);

  const [form, setForm] = useState({
    id: initialWorkflow?.id || '',
    nombre: initialWorkflow?.nombre || '',
    code: initialWorkflow?.code || '',
    descripcion: initialWorkflow?.descripcion || '',
    id_ambito: initialWorkflow?.id_ambito !== undefined && initialWorkflow?.id_ambito !== null ? String(initialWorkflow.id_ambito) : '',
    activo: initialWorkflow?.activo !== undefined ? Boolean(initialWorkflow.activo) : true,
    is_default: Boolean(initialWorkflow?.is_default)
  });

  const [currentWorkflow, setCurrentWorkflow] = useState(initialWorkflow || null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAmbitos = () => {
    setLoadingAmbitos(true);
    fetch(`${import.meta.env.VITE_API_URL}/ambitos/admin`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Fallback to /ambitos');
        return res.json();
      })
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.ambitos || []);
        setAmbitos(list);
        setLoadingAmbitos(false);
      })
      .catch(() => {
        fetch(`${import.meta.env.VITE_API_URL}/ambitos`, {
          headers: getAuthHeaders()
        })
          .then(res => res.json())
          .then(data => {
            const list = Array.isArray(data) ? data : (data?.ambitos || []);
            setAmbitos(list);
            setLoadingAmbitos(false);
          })
          .catch(() => setLoadingAmbitos(false));
      });
  };

  useEffect(() => {
    fetchAmbitos();
  }, []);

  useEffect(() => {
    setCurrentWorkflow(initialWorkflow || null);
    setForm({
      id: initialWorkflow?.id || '',
      nombre: initialWorkflow?.nombre || '',
      code: initialWorkflow?.code || '',
      descripcion: initialWorkflow?.descripcion || '',
      id_ambito: initialWorkflow?.id_ambito !== undefined && initialWorkflow?.id_ambito !== null ? String(initialWorkflow.id_ambito) : '',
      activo: initialWorkflow?.activo !== undefined ? Boolean(initialWorkflow.activo) : true,
      is_default: Boolean(initialWorkflow?.is_default)
    });
  }, [initialWorkflow]);

  const refreshWorkflowDetail = () => {
    if (!currentWorkflow?.id) return;
    fetch(`${import.meta.env.VITE_API_URL}/admin/workflows`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const updated = data.find(w => w.id === currentWorkflow.id);
          if (updated) {
            setCurrentWorkflow(updated);
          }
        }
        if (onWorkflowSaved) onWorkflowSaved();
      })
      .catch(() => {});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.nombre || !form.nombre.trim()) {
      setError(t('workflowsAdmin.nameRequired', 'El nombre del flujo es obligatorio.'));
      return;
    }

    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      code: form.code ? form.code.trim() : null,
      descripcion: form.descripcion ? form.descripcion.trim() : null,
      id_ambito: form.id_ambito ? Number(form.id_ambito) : null,
      activo: Boolean(form.activo),
      is_default: Boolean(form.is_default)
    };

    const targetId = form.id;
    const url = targetId
      ? `${import.meta.env.VITE_API_URL}/admin/workflows/${targetId}`
      : `${import.meta.env.VITE_API_URL}/admin/workflows`;
    const method = targetId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar el flujo de trabajo.');
        return data;
      })
      .then((savedData) => {
        setSuccess(targetId ? t('workflowsAdmin.updatedSuccess', 'Flujo de trabajo actualizado correctamente.') : t('workflowsAdmin.createdSuccess', 'Flujo de trabajo creado correctamente.'));
        setSaving(false);
        if (savedData && savedData.id) {
          setCurrentWorkflow(savedData);
          setForm(prev => ({ ...prev, id: savedData.id }));
        }
        if (onWorkflowSaved) onWorkflowSaved();
      })
      .catch(err => {
        setError(err.message);
        setSaving(false);
      });
  };

  const isEditing = Boolean(currentWorkflow?.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <button
          type="button"
          className="m3-btn m3-btn-outline"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} /> {t('common.back', 'Volver')}
        </button>

        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.2rem' }}>
          {isEditing 
            ? `${t('workflowsAdmin.editWorkflow', 'Editar Flujo')}: ${currentWorkflow.nombre}` 
            : t('workflowsAdmin.newWorkflow', 'Nuevo Flujo de Trabajo')}
        </h3>
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

      {/* Formulario Principal de Configuración */}
      <div className="m3-card glass-panel" style={{ padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* Nombre */}
            <div className="form-group">
              <label className="form-label">{t('workflowsAdmin.name', 'Nombre del Flujo *')}</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Flujo Estándar, Flujo Rápido..."
                required
                className="m3-input"
              />
            </div>

            {/* Código */}
            <div className="form-group">
              <label className="form-label">{t('workflowsAdmin.code', 'Código Identificador')}</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Ej: STANDARD, FAST_TRACK..."
                className="m3-input"
              />
            </div>

            {/* Ámbito de Aplicación */}
            <div className="form-group">
              <label className="form-label">{t('ambitos.scopeLabel', 'Ámbito / Unidad de Negocio')}</label>
              <select
                value={form.id_ambito}
                onChange={(e) => setForm({ ...form, id_ambito: e.target.value })}
                className="user-select"
                style={{ height: '38px' }}
              >
                <option value="">{t('workflowsAdmin.globalScope', '🌐 Global (Disponible para todos los Ámbitos)')}</option>
                {ambitos.map(a => (
                  <option key={a.id_ambito} value={String(a.id_ambito)}>
                    {a.nombre} {a.code ? `(${a.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label className="form-label">{t('common.description', 'Descripción')}</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Explica para qué tipo de iniciativas o proyectos está diseñado este flujo..."
              rows={3}
              className="m3-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Checkboxes de Estado y Predeterminado */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              <span>{t('workflowsAdmin.isActive', 'Flujo Activo')}</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              />
              <span>⭐ {t('workflowsAdmin.isDefault', 'Flujo Predeterminado')} ({t('workflowsAdmin.isDefaultHint', 'se asignará automáticamente a proyectos nuevos')})</span>
            </label>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              className="m3-btn m3-btn-outline"
              onClick={onBack}
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="m3-btn m3-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? t('common.saving', 'Guardando...') : t('workflowsAdmin.saveWorkflow', 'Guardar Configuración')}
            </button>
          </div>
        </form>
      </div>

      {/* Gestor de Estados y Secuencia del Flujo */}
      <WorkflowStatesManager
        workflow={currentWorkflow}
        onWorkflowUpdated={refreshWorkflowDetail}
        getAuthHeaders={getAuthHeaders}
      />
    </div>
  );
}
