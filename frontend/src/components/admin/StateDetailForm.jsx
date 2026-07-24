import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import StateTasksManager from './StateTasksManager';

export default function StateDetailForm({ initialState, onBack, onStateSaved, getAuthHeaders }) {
  const [stateForm, setStateForm] = useState({
    id_estado: initialState?.id_estado || '',
    nombre_estado: initialState?.nombre_estado || '',
    icono: initialState?.icono || '',
    orden: initialState?.orden !== undefined ? initialState.orden.toString() : '',
    proyecto_cerrado: Boolean(initialState?.proyecto_cerrado),
    pasos: initialState?.pasos || '',
    descripcion: initialState?.descripcion || ''
  });

  const [currentState, setCurrentState] = useState(initialState || null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCurrentState(initialState || null);
    setStateForm({
      id_estado: initialState?.id_estado || '',
      nombre_estado: initialState?.nombre_estado || '',
      icono: initialState?.icono || '',
      orden: initialState?.orden !== undefined ? initialState.orden.toString() : '',
      proyecto_cerrado: Boolean(initialState?.proyecto_cerrado),
      pasos: initialState?.pasos || '',
      descripcion: initialState?.descripcion || ''
    });
  }, [initialState]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!stateForm.nombre_estado || stateForm.orden === '') {
      setError('El nombre del estado y el orden son obligatorios.');
      return;
    }

    setSaving(true);
    const payload = {
      nombre_estado: stateForm.nombre_estado,
      icono: stateForm.icono || null,
      orden: parseInt(stateForm.orden, 10),
      proyecto_cerrado: Boolean(stateForm.proyecto_cerrado),
      pasos: stateForm.pasos || '',
      descripcion: stateForm.descripcion || ''
    };

    const targetId = stateForm.id_estado;
    const url = targetId 
      ? `${import.meta.env.VITE_API_URL}/admin/states/${targetId}` 
      : `${import.meta.env.VITE_API_URL}/admin/states`;
    const method = targetId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
        } catch (err) {
          data = { error: `Respuesta del servidor no válida (HTTP ${res.status}: ${res.statusText || 'Error de red'})` };
        }
        if (!res.ok) throw new Error(data.error || 'Error al guardar el estado.');
        return data;
      })
      .then((savedData) => {
        setSuccess(targetId ? 'Estado actualizado correctamente.' : 'Estado creado correctamente.');
        setSaving(false);
        const updatedStateObj = savedData.state || savedData;
        if (updatedStateObj && updatedStateObj.id_estado) {
          setCurrentState(updatedStateObj);
          setStateForm(prev => ({ ...prev, id_estado: updatedStateObj.id_estado }));
        }
        onStateSaved();
      })
      .catch(err => {
        setError(err.message);
        setSaving(false);
      });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header con botón Volver */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button 
          type="button" 
          className="m3-btn m3-btn-outline" 
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <ArrowLeft size={18} /> Volver a Estados
        </button>
        <h2 style={{ fontWeight: 600, fontSize: '1.25rem' }}>
          {stateForm.id_estado ? `Detalle de Estado: ${stateForm.nombre_estado}` : 'Alta de Nuevo Estado'}
        </h2>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 12, fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--color-rag-green)', padding: 12, borderRadius: 12, fontSize: '0.85rem' }}>
          {success}
        </div>
      )}

      {/* Formulario Principal de Campos del Estado */}
      <div className="m3-card glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 16 }}>
          Campos del Estado
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Nombre del Estado *</label>
              <input 
                type="text" 
                value={stateForm.nombre_estado}
                onChange={(e) => setStateForm(prev => ({ ...prev, nombre_estado: e.target.value }))}
                required
                placeholder="Ej: Validación Técnica"
                className="m3-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emoji / Icono (Opcional)</label>
              <input 
                type="text" 
                maxLength={5}
                value={stateForm.icono}
                onChange={(e) => setStateForm(prev => ({ ...prev, icono: e.target.value }))}
                placeholder="Ej: 🔍, ⚙️, 📦"
                className="m3-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Número de Orden Semántico *</label>
              <input 
                type="number" 
                required
                value={stateForm.orden}
                onChange={(e) => setStateForm(prev => ({ ...prev, orden: e.target.value }))}
                placeholder="Ej: 6"
                className="m3-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={stateForm.proyecto_cerrado}
                onChange={(e) => setStateForm(prev => ({ ...prev, proyecto_cerrado: e.target.checked }))}
                className="m3-checkbox"
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Marcar proyecto como cerrado en este estado</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea 
              value={stateForm.descripcion || ''}
              onChange={(e) => setStateForm(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describe brevemente este estado del proyecto..."
              className="m3-input"
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '40px' }}>
            <label className="form-label">Pasos a seguir en esta fase (Guía para el usuario)</label>
            <div style={{ background: 'var(--md-sys-color-surface)' }}>
              <ReactQuill 
                theme="snow"
                value={stateForm.pasos || ''}
                onChange={(val) => setStateForm(prev => ({ ...prev, pasos: val }))}
                placeholder="Describe las acciones, entregables o checklist para esta fase..."
                style={{ height: '150px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="submit" disabled={saving} className="m3-btn m3-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Estado'}
            </button>
          </div>
        </form>
      </div>

      {/* Sección de Gestión de Tareas */}
      {currentState && currentState.id_estado ? (
        <StateTasksManager 
          state={currentState}
          onStateUpdated={onStateSaved}
          getAuthHeaders={getAuthHeaders}
        />
      ) : (
        <div className="m3-card glass-panel" style={{ padding: 20, color: 'var(--md-sys-color-outline)', fontSize: '0.85rem', textAlign: 'center' }}>
          Guarda los datos del estado para habilitar la gestión de tareas preconfiguradas asociadas.
        </div>
      )}
    </div>
  );
}
