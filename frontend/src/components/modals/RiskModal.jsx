import React, { useState, useEffect } from 'react';

export default function RiskModal({ 
  isOpen, onClose, projectId, tasks = [], editingRisk, risk, getAuthHeaders, onSuccess 
}) {
  const targetRisk = editingRisk || risk;
  const [form, setForm] = useState({
    id_riesgo: '',
    titulo_riesgo: '',
    descripcion: '',
    probabilidad: 'MEDIA',
    impacto: 'MEDIA',
    plan_mitigacion: '',
    estado_riesgo: 'ACTIVO',
    fecha_proxima_revision: '',
    id_tarea: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (targetRisk) {
      setForm({
        id_riesgo: targetRisk.id_riesgo,
        titulo_riesgo: targetRisk.titulo_riesgo || '',
        descripcion: targetRisk.descripcion || '',
        probabilidad: targetRisk.probabilidad || 'MEDIA',
        impacto: targetRisk.impacto || 'MEDIA',
        plan_mitigacion: targetRisk.plan_mitigacion || '',
        estado_riesgo: targetRisk.estado_riesgo || 'ACTIVO',
        fecha_proxima_revision: targetRisk.fecha_proxima_revision || '',
        id_tarea: targetRisk.id_tarea || ''
      });
    } else {
      setForm({
        id_riesgo: '',
        titulo_riesgo: '',
        descripcion: '',
        probabilidad: 'MEDIA',
        impacto: 'MEDIA',
        plan_mitigacion: '',
        estado_riesgo: 'ACTIVO',
        fecha_proxima_revision: new Date().toISOString().split('T')[0],
        id_tarea: ''
      });
    }
    setError('');
  }, [targetRisk, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.titulo_riesgo || !form.plan_mitigacion || !form.fecha_proxima_revision) {
      setError('Por favor, rellene todos los campos obligatorios.');
      return;
    }

    const payload = { ...form, id_proyecto: projectId };
    const isEdit = !!targetRisk;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/risks/${targetRisk.id_riesgo}` 
      : `${import.meta.env.VITE_API_URL}/risks`;
    const method = isEdit ? 'PUT' : 'POST';

    if (!isEdit && (!payload.id_riesgo || payload.id_riesgo.trim() === '')) {
      delete payload.id_riesgo;
    }

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al guardar el riesgo');
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
          <h3 className="modal-title">{editingRisk ? 'Editar Riesgo Preventivo' : 'Identificar Riesgo Preventivo'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ID Riesgo (Format: RSG-YYYY-XXX o dejar vacío)</label>
            <input 
              type="text" 
              value={form.id_riesgo}
              onChange={(e) => setForm({ ...form, id_riesgo: e.target.value })}
              placeholder="Auto-generado (Ej. RSG-2026-004)"
              disabled={!!editingRisk}
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Título del Riesgo *</label>
            <input 
              type="text" 
              value={form.titulo_riesgo}
              onChange={(e) => setForm({ ...form, titulo_riesgo: e.target.value })}
              placeholder="Fuga de perfiles clave"
              required
              className="m3-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Probabilidad *</label>
              <select 
                value={form.probabilidad}
                onChange={(e) => setForm({ ...form, probabilidad: e.target.value })}
                className="user-select"
              >
                <option value="BAJA">BAJA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="ALTA">ALTA</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Impacto *</label>
              <select 
                value={form.impacto}
                onChange={(e) => setForm({ ...form, impacto: e.target.value })}
                className="user-select"
              >
                <option value="BAJA">BAJA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="ALTA">ALTA</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estado *</label>
              <select 
                value={form.estado_riesgo}
                onChange={(e) => setForm({ ...form, estado_riesgo: e.target.value })}
                className="user-select"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="CERRADO">CERRADO</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción del Evento de Riesgo</label>
            <textarea 
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Detalles sobre qué podría pasar..."
              rows={2}
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Plan de Mitigación / Contingencia *</label>
            <textarea 
              value={form.plan_mitigacion}
              onChange={(e) => setForm({ ...form, plan_mitigacion: e.target.value })}
              placeholder="Qué se hará..."
              required
              rows={2}
              className="m3-input"
            />
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
            <label className="form-label">Fecha de Próxima Revisión *</label>
            <input 
              type="date" 
              value={form.fecha_proxima_revision}
              onChange={(e) => setForm({ ...form, fecha_proxima_revision: e.target.value })}
              required
              className="m3-input"
            />
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary">
              {editingRisk ? 'Guardar Cambios' : 'Registrar Riesgo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
