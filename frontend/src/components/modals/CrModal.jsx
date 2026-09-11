import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import SearchableContactSelect from '../SearchableContactSelect';

export default function CrModal({ 
  isOpen, onClose, projectId, editingCr, cr, getAuthHeaders, onSuccess, raciContacts = [], contactosList = [] 
}) {
  const { t } = useTranslation();
  const targetCr = editingCr || cr;
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

  // Mantener los contactos existentes en la lista incluso si no están en RACI (retrocompatibilidad al editar registros previos)
  const availableRaciContacts = useMemo(() => {
    const list = [...(raciContacts || [])];
    if (targetCr?.id_solicitante_contacto && !list.some(c => Number(c.id_contacto) === Number(targetCr.id_solicitante_contacto))) {
      const existing = (contactosList || []).find(c => Number(c.id_contacto) === Number(targetCr.id_solicitante_contacto));
      list.push(existing || {
        id_contacto: targetCr.id_solicitante_contacto,
        nombre: targetCr.Solicitante?.nombre || `ID: ${targetCr.id_solicitante_contacto}`,
        apellidos: targetCr.Solicitante?.apellidos || '',
        Proveedor: targetCr.Solicitante?.Proveedor || null
      });
    }
    if (targetCr?.id_aprobador_contacto && !list.some(c => Number(c.id_contacto) === Number(targetCr.id_aprobador_contacto))) {
      const existing = (contactosList || []).find(c => Number(c.id_contacto) === Number(targetCr.id_aprobador_contacto));
      list.push(existing || {
        id_contacto: targetCr.id_aprobador_contacto,
        nombre: targetCr.Aprobador?.nombre || `ID: ${targetCr.id_aprobador_contacto}`,
        apellidos: targetCr.Aprobador?.apellidos || '',
        Proveedor: targetCr.Aprobador?.Proveedor || null
      });
    }
    return list;
  }, [raciContacts, contactosList, targetCr]);

  const hasNoRaciContacts = !raciContacts || raciContacts.length === 0;

  useEffect(() => {
    if (targetCr) {
      setForm({
        id_cambio: targetCr.id_cambio,
        fecha_solicitud: targetCr.fecha_solicitud || '',
        id_solicitante_contacto: targetCr.id_solicitante_contacto ? Number(targetCr.id_solicitante_contacto) : '',
        id_aprobador_contacto: targetCr.id_aprobador_contacto ? Number(targetCr.id_aprobador_contacto) : '',
        descripcion_motivo: targetCr.descripcion_motivo || '',
        impacta_importe: !!targetCr.impacta_importe,
        importe_impacto: targetCr.importe_impacto || '0',
        impacta_tiempo: !!targetCr.impacta_tiempo,
        dias_impacto: targetCr.dias_impacto || '0',
        estado_cambio: targetCr.estado_cambio || 'SOLICITADO'
      });
    } else {
      setForm({
        id_cambio: '',
        fecha_solicitud: new Date().toISOString().split('T')[0],
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
  }, [targetCr, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.id_solicitante_contacto || !form.id_aprobador_contacto || !form.fecha_solicitud || !form.descripcion_motivo) {
      setError(t('crModal.fillRequired', 'Por favor, rellene todos los campos obligatorios.'));
      return;
    }

    const payload = { 
      ...form, 
      id_proyecto: projectId,
      id_solicitante_contacto: parseInt(form.id_solicitante_contacto, 10),
      id_aprobador_contacto: parseInt(form.id_aprobador_contacto, 10),
      importe_impacto: parseFloat(form.importe_impacto) || 0,
      dias_impacto: parseInt(form.dias_impacto, 10) || 0
    };

    const isEdit = !!targetCr;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/scope-changes/${targetCr.id_cambio}` 
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
        if (!res.ok) throw new Error(d.error || t('crModal.saveError', 'Error al guardar el cambio de alcance'));
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
      <div className="modal-content glass-panel" style={{ maxWidth: '640px', overflow: 'visible' }}>
        <div className="modal-header">
          <h3 className="modal-title">{editingCr ? t('crModal.editTitle', 'Editar Solicitud de Cambio (CR)') : t('crModal.addTitle', 'Registrar Solicitud de Cambio (CR)')}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {hasNoRaciContacts && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'rgba(255, 149, 0, 0.12)',
            border: '1px solid rgba(255, 149, 0, 0.3)',
            color: '#ff9500',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{t('crModal.noRaciNotice', 'Este proyecto no tiene participantes asignados en la Matriz RACI. Debe añadir participantes a la Matriz RACI para seleccionarlos como solicitante o aprobador.')}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ overflow: 'visible' }}>
          <div className="form-group">
            <label className="form-label">{t('crModal.idLabel', 'ID Cambio de Alcance (Format: CR-YYYY-XXX o dejar vacío)')}</label>
            <input 
              type="text" 
              value={form.id_cambio}
              onChange={(e) => setForm({ ...form, id_cambio: e.target.value })}
              placeholder={t('crModal.idPlaceholder', 'Auto-generado (Ej. CR-2026-005)')}
              disabled={!!editingCr}
              className="m3-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">{t('crModal.requester', 'Solicitante (Matriz RACI)')} *</label>
              <SearchableContactSelect 
                contacts={availableRaciContacts}
                selected={form.id_solicitante_contacto}
                onChange={(val) => setForm({ ...form, id_solicitante_contacto: val })}
                multiple={false}
                placeholder={t('crModal.selectRequester', 'Seleccione Solicitante...')}
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">{t('crModal.approver', 'Aprobador (Matriz RACI)')} *</label>
              <SearchableContactSelect 
                contacts={availableRaciContacts}
                selected={form.id_aprobador_contacto}
                onChange={(val) => setForm({ ...form, id_aprobador_contacto: val })}
                multiple={false}
                placeholder={t('crModal.selectApprover', 'Seleccione Aprobador...')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('crModal.requestDate', 'Fecha de Solicitud')} *</label>
              <input 
                type="date" 
                value={form.fecha_solicitud}
                onChange={(e) => setForm({ ...form, fecha_solicitud: e.target.value })}
                required
                className="m3-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('crModal.status', 'Estado de Solicitud')} *</label>
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
                <span>{t('crModal.impactsCost', '¿Impacta Importe?')}</span>
              </label>
              {form.impacta_importe && (
                <input 
                  type="number" 
                  step="0.01"
                  value={form.importe_impacto}
                  onChange={(e) => setForm({ ...form, importe_impacto: e.target.value })}
                  placeholder={t('crModal.costPlaceholder', 'Importe +/- (€)')}
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
                <span>{t('crModal.impactsTime', '¿Impacta Plazos?')}</span>
              </label>
              {form.impacta_tiempo && (
                <input 
                  type="number" 
                  value={form.dias_impacto}
                  onChange={(e) => setForm({ ...form, dias_impacto: e.target.value })}
                  placeholder={t('crModal.timePlaceholder', 'Días +/-')}
                  required={form.impacta_tiempo}
                  className="m3-input"
                  style={{ marginTop: 8 }}
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('crModal.description', 'Descripción Detallada / Justificación')} *</label>
            <textarea 
              value={form.descripcion_motivo}
              onChange={(e) => setForm({ ...form, descripcion_motivo: e.target.value })}
              placeholder={t('crModal.descPlaceholder', 'Detalles sobre por qué se solicita esta ampliación del alcance y sus impactos técnicos...')}
              required
              rows={3}
              className="m3-input"
            />
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              {t('common.cancel', 'Cancelar')}
            </button>
            <button type="submit" className="m3-btn m3-btn-primary" disabled={hasNoRaciContacts && !targetCr}>
              {editingCr ? t('common.saveChanges', 'Guardar Cambios') : t('crModal.submit', 'Enviar Solicitud')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
