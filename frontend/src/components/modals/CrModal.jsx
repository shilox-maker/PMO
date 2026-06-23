import React, { useState, useEffect } from 'react';

export default function CrModal({ 
  isOpen, onClose, projectId, editingCr, getAuthHeaders, onSuccess, contactosList 
}) {
  const [form, setForm] = useState({
    id_cambio: '',
    fecha_solicitud: '',
    id_solicitante_contacto: '',
    id_aprobador_contacto: '',
    descripcion_motivo: '',
    impacta_importe: false,
    importe_impacto: '0',
    impacta_tiempo: false,
    dias_impacto: '0',
    estado_cambio: 'SOLICITADO'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingCr) {
      setForm({
        id_cambio: editingCr.id_cambio,
        fecha_solicitud: editingCr.fecha_solicitud || '',
        id_solicitante_contacto: editingCr.id_solicitante_contacto || '',
        id_aprobador_contacto: editingCr.id_aprobador_contacto || '',
        descripcion_motivo: editingCr.descripcion_motivo || '',
        impacta_importe: !!editingCr.impacta_importe,
        importe_impacto: editingCr.importe_impacto || '0',
        impacta_tiempo: !!editingCr.impacta_tiempo,
        dias_impacto: editingCr.dias_impacto || '0',
        estado_cambio: editingCr.estado_cambio || 'SOLICITADO'
      });
    } else {
      setForm({
        id_cambio: '',
        fecha_solicitud: '',
        id_solicitante_contacto: '',
        id_aprobador_contacto: '',
        descripcion_motivo: '',
        impacta_importe: false,
        importe_impacto: '0',
        impacta_tiempo: false,
        dias_impacto: '0',
        estado_cambio: 'SOLICITADO'
      });
    }
    setError('');
  }, [editingCr, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.id_solicitante_contacto || !form.id_aprobador_contacto || !form.fecha_solicitud || !form.descripcion_motivo) {
      setError('Por favor, rellene todos los campos obligatorios.');
      return;
    }

    const payload = { 
      ...form, 
      id_proyecto: projectId,
      id_solicitante_contacto: parseInt(form.id_solicitante_contacto, 10),
      id_aprobador_contacto: parseInt(form.id_aprobador_contacto, 10),
      importe_impacto: parseFloat(form.importe_impacto),
      dias_impacto: parseInt(form.dias_impacto, 10)
    };

    const isEdit = !!editingCr;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/scope-changes/${editingCr.id_cambio}` 
      : `${import.meta.env.VITE_API_URL}/scope-changes`;
    const method = isEdit ? 'PUT' : 'POST';

    if (!isEdit && (!payload.id_cambio || payload.id_cambio.trim() === '')) {
      delete payload.id_cambio;
    }

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al guardar el cambio de alcance');
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
      <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{editingCr ? 'Editar Solicitud de Cambio (CR)' : 'Registrar Solicitud de Cambio (CR)'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ID Cambio de Alcance (Format: CR-YYYY-XXX o dejar vacío)</label>
            <input 
              type="text" 
              value={form.id_cambio}
              onChange={(e) => setForm({ ...form, id_cambio: e.target.value })}
              placeholder="Auto-generado (Ej. CR-2026-005)"
              disabled={!!editingCr}
              className="m3-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Key User Solicitante *</label>
              <select 
                value={form.id_solicitante_contacto}
                onChange={(e) => setForm({ ...form, id_solicitante_contacto: e.target.value })}
                required
                className="user-select"
              >
                <option value="">Seleccione Solicitante</option>
                {contactosList.map(ku => (
                  <option key={ku.id_contacto} value={ku.id_contacto}>{ku.nombre} {ku.apellidos}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Key User Aprobador *</label>
              <select 
                value={form.id_aprobador_contacto}
                onChange={(e) => setForm({ ...form, id_aprobador_contacto: e.target.value })}
                required
                className="user-select"
              >
                <option value="">Seleccione Aprobador</option>
                {contactosList.map(ku => (
                  <option key={ku.id_contacto} value={ku.id_contacto}>{ku.nombre} {ku.apellidos}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Solicitud *</label>
              <input 
                type="date" 
                value={form.fecha_solicitud}
                onChange={(e) => setForm({ ...form, fecha_solicitud: e.target.value })}
                required
                className="m3-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estado de Solicitud *</label>
              <select 
                value={form.estado_cambio}
                onChange={(e) => setForm({ ...form, estado_cambio: e.target.value })}
                className="user-select"
              >
                <option value="SOLICITADO">SOLICITADO</option>
                <option value="APROBADO">APROBADO</option>
                <option value="RECHAZADO">RECHAZADO</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '16px 0' }}>
            <div className="form-group">
              <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={form.impacta_importe}
                  onChange={(e) => setForm({ ...form, impacta_importe: e.target.checked })}
                  className="m3-checkbox"
                />
                <span>¿Impacta Importe?</span>
              </label>
              {form.impacta_importe && (
                <input 
                  type="number" 
                  step="0.01"
                  value={form.importe_impacto}
                  onChange={(e) => setForm({ ...form, importe_impacto: e.target.value })}
                  placeholder="Importe +/- (€)"
                  required={form.impacta_importe}
                  className="m3-input"
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            <div className="form-group">
              <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={form.impacta_tiempo}
                  onChange={(e) => setForm({ ...form, impacta_tiempo: e.target.checked })}
                  className="m3-checkbox"
                />
                <span>¿Impacta Plazos?</span>
              </label>
              {form.impacta_tiempo && (
                <input 
                  type="number" 
                  value={form.dias_impacto}
                  onChange={(e) => setForm({ ...form, dias_impacto: e.target.value })}
                  placeholder="Días +/-"
                  required={form.impacta_tiempo}
                  className="m3-input"
                  style={{ marginTop: 8 }}
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción Detallada / Justificación *</label>
            <textarea 
              value={form.descripcion_motivo}
              onChange={(e) => setForm({ ...form, descripcion_motivo: e.target.value })}
              placeholder="Detalles sobre por qué se solicita esta ampliación del alcance y sus impactos técnicos..."
              required
              rows={3}
              className="m3-input"
            />
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary">
              {editingCr ? 'Guardar Cambios' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
