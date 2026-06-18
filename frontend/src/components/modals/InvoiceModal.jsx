import React, { useState, useEffect } from 'react';

export default function InvoiceModal({ 
  isOpen, onClose, projectId, editingInvoice, getAuthHeaders, onSuccess, vendors 
}) {
  const [form, setForm] = useState({
    id_interno_factura: '',
    id_proveedor: '',
    numero_factura: '',
    concepto: '',
    fecha_factura: '',
    importe: '',
    estado: 'PENDIENTE_DE_RECIBIR',
    PO: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingInvoice) {
      setForm({
        id_interno_factura: editingInvoice.id_interno_factura,
        id_proveedor: editingInvoice.id_proveedor || '',
        numero_factura: editingInvoice.numero_factura || '',
        concepto: editingInvoice.concepto || '',
        fecha_factura: editingInvoice.fecha_factura || '',
        importe: editingInvoice.importe || '',
        estado: editingInvoice.estado || 'PENDIENTE_DE_RECIBIR',
        PO: editingInvoice.PO || ''
      });
    } else {
      setForm({
        id_interno_factura: '',
        id_proveedor: '',
        numero_factura: '',
        concepto: '',
        fecha_factura: '',
        importe: '',
        estado: 'PENDIENTE_DE_RECIBIR',
        PO: ''
      });
    }
    setError('');
  }, [editingInvoice, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.concepto || !form.fecha_factura || !form.importe) {
      setError('Por favor, rellene todos los campos obligatorios.');
      return;
    }

    const payload = { 
      ...form, 
      id_proyecto: projectId,
      importe: parseFloat(form.importe)
    };
    if (form.id_proveedor) payload.id_proveedor = parseInt(form.id_proveedor, 10);

    const isEdit = !!editingInvoice;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/invoices/${editingInvoice.id_interno_factura}` 
      : `${import.meta.env.VITE_API_URL}/invoices`;
    const method = isEdit ? 'PUT' : 'POST';

    if (!isEdit && (!payload.id_interno_factura || payload.id_interno_factura.trim() === '')) {
      delete payload.id_interno_factura;
    }

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al guardar la factura');
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
          <h3 className="modal-title">{editingInvoice ? 'Editar Cobro Realizado / PO' : 'Registrar Cobro Realizado / PO'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ID Interno Factura (Format: FAC-YYYY-XXX o dejar vacío)</label>
            <input 
              type="text" 
              value={form.id_interno_factura}
              onChange={(e) => setForm({ ...form, id_interno_factura: e.target.value })}
              placeholder="Auto-generado (Ej. FAC-2026-004)"
              disabled={!!editingInvoice}
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Socio Tecnológico Emisor</label>
            <select 
              value={form.id_proveedor}
              onChange={(e) => setForm({ ...form, id_proveedor: e.target.value })}
              className="user-select"
            >
              <option value="">Seleccione Socio</option>
              {vendors.map(v => (
                <option key={v.id_proveedor} value={v.id_proveedor}>{v.nombre_razon_social}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nº Factura Oficial del Socio</label>
            <input 
              type="text" 
              value={form.numero_factura}
              onChange={(e) => setForm({ ...form, numero_factura: e.target.value })}
              placeholder="FAC-SOP-2026-022"
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">PO (Purchase Order) ERP</label>
            <input 
              type="text" 
              value={form.PO}
              onChange={(e) => setForm({ ...form, PO: e.target.value })}
              placeholder="Ej. PO-2026-00145"
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Concepto de Cobro *</label>
            <input 
              type="text" 
              value={form.concepto}
              onChange={(e) => setForm({ ...form, concepto: e.target.value })}
              placeholder="Entregable del Core Contable"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fecha de Emisión *</label>
            <input 
              type="date" 
              value={form.fecha_factura}
              onChange={(e) => setForm({ ...form, fecha_factura: e.target.value })}
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Importe Facturado (€) *</label>
            <input 
              type="number" 
              step="0.01"
              value={form.importe}
              onChange={(e) => setForm({ ...form, importe: e.target.value })}
              placeholder="15000.00"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estado de Cobro *</label>
            <select 
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="user-select"
            >
              <option value="PENDIENTE_DE_RECIBIR">PENDIENTE DE RECIBIR</option>
              <option value="RECIBIDA">RECIBIDA</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary">
              {editingInvoice ? 'Guardar Cambios' : 'Registrar Cobro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
