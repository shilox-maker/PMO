import React, { useState, useEffect } from 'react';

export default function IssueModal({ 
  isOpen, onClose, projectId, tasks = [], editingIssue, issue, getAuthHeaders, onSuccess 
}) {
  const targetIssue = editingIssue || issue;
  const [form, setForm] = useState({
    id_incidencia: '',
    titulo: '',
    descripcion: '',
    tipo_incidencias: 'TECNICA',
    criticidad: 'MEDIA',
    estado: 'ABIERTA',
    fecha_apertura: '',
    fecha_cierre: '',
    solucion_aplicada: '',
    id_tarea: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (targetIssue) {
      setForm({
        id_incidencia: targetIssue.id_incidencia,
        titulo: targetIssue.titulo || '',
        descripcion: targetIssue.descripcion || '',
        tipo_incidencias: targetIssue.tipo_incidencias || 'TECNICA',
        criticidad: targetIssue.criticidad || 'MEDIA',
        estado: targetIssue.estado || 'ABIERTA',
        fecha_apertura: targetIssue.fecha_apertura || '',
        fecha_cierre: targetIssue.fecha_cierre || '',
        solucion_aplicada: targetIssue.solucion_aplicada || '',
        id_tarea: targetIssue.id_tarea || ''
      });
    } else {
      setForm({
        id_incidencia: '',
        titulo: '',
        descripcion: '',
        tipo_incidencias: 'TECNICA',
        criticidad: 'MEDIA',
        estado: 'ABIERTA',
        fecha_apertura: new Date().toISOString().split('T')[0],
        fecha_cierre: '',
        solucion_aplicada: '',
        id_tarea: ''
      });
    }
    setError('');
  }, [targetIssue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.titulo || !form.descripcion || !form.fecha_apertura) {
      setError('Por favor, rellene todos los campos obligatorios.');
      return;
    }

    if (form.estado === 'RESUELTA' && (!form.solucion_aplicada || form.solucion_aplicada.trim() === '')) {
      setError('La solución aplicada es obligatoria cuando la incidencia está RESUELTA.');
      return;
    }

    const payload = { ...form, id_proyecto: projectId };
    if (!payload.fecha_cierre || payload.fecha_cierre.trim() === '') {
      payload.fecha_cierre = null;
    }
    const isEdit = !!targetIssue;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/issues/${targetIssue.id_incidencia}` 
      : `${import.meta.env.VITE_API_URL}/issues`;
    const method = isEdit ? 'PUT' : 'POST';

    if (!isEdit && (!payload.id_incidencia || payload.id_incidencia.trim() === '')) {
      delete payload.id_incidencia;
    }

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al guardar la incidencia');
        return d;
      })
      .then(() => {
        onSuccess();
        onClose();
      })
      .catch(err => setError(err.message));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{editingIssue ? 'Editar Incidencia' : 'Registrar Incidencia'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ID Incidencia (Format: INC-YYYY-XXX o dejar vacío)</label>
            <input 
              type="text" 
              value={form.id_incidencia}
              onChange={(e) => setForm({ ...form, id_incidencia: e.target.value })}
              placeholder="Auto-generado (Ej. INC-2026-004)"
              disabled={!!editingIssue}
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Título de Incidencia *</label>
            <input 
              type="text" 
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Bloqueo de base de datos"
              required
              className="m3-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Tipo de Incidencia *</label>
              <select 
                value={form.tipo_incidencias}
                onChange={(e) => setForm({ ...form, tipo_incidencias: e.target.value })}
                className="user-select"
              >
                <option value="TECNICA">TECNICA</option>
                <option value="RETRASO_PLAZOS">RETRASO PLAZOS</option>
                <option value="PROVEEDOR_DESAPARECIDO">PROVEEDOR DESAPARECIDO</option>
                <option value="PRESUPUESTARIA">PRESUPUESTARIA</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Criticidad *</label>
              <select 
                value={form.criticidad}
                onChange={(e) => setForm({ ...form, criticidad: e.target.value })}
                className="user-select"
              >
                <option value="BAJA">BAJA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="ALTA">ALTA</option>
                <option value="BLOQUEANTE">BLOQUEANTE</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Apertura *</label>
              <input 
                type="date" 
                value={form.fecha_apertura}
                onChange={(e) => setForm({ ...form, fecha_apertura: e.target.value })}
                required
                className="m3-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Cierre (Manual)</label>
              <input 
                type="date" 
                value={form.fecha_cierre}
                onChange={(e) => setForm({ ...form, fecha_cierre: e.target.value })}
                className="m3-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estado de la Incidencia *</label>
              <select 
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="user-select"
              >
                <option value="ABIERTA">ABIERTA</option>
                <option value="EN_PROCESO">EN PROCESO</option>
                <option value="RESUELTA">RESUELTA 🟢</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tarea / Hito Asociado (Opcional)</label>
            <select 
              value={form.id_tarea}
              onChange={(e) => setForm({ ...form, id_tarea: e.target.value })}
              className="user-select"
            >
              <option value="">-- Ninguna --</option>
              {tasks.map(t => (
                <option key={t.id_tarea} value={t.id_tarea}>
                  {t.es_hito ? '🎯 ' : '📌 '}{t.titulo_tarea}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción detallada *</label>
            <textarea 
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Detalles sobre qué está bloqueando el desarrollo..."
              required
              rows={3}
              className="m3-input"
            />
          </div>

          {form.estado === 'RESUELTA' && (
            <div className="form-group">
              <label className="form-label">Solución Aplicada (Obligatorio) *</label>
              <textarea 
                value={form.solucion_aplicada}
                onChange={(e) => setForm({ ...form, solucion_aplicada: e.target.value })}
                placeholder="Describa la solución técnica para resolver esta incidencia..."
                required={form.estado === 'RESUELTA'}
                rows={2}
                className="m3-input"
                style={{ borderColor: 'var(--color-rag-green)' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary">
              {editingIssue ? 'Guardar Cambios' : 'Registrar Incidencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
