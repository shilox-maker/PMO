import React from 'react';

export default function InvoiceFormFields({
  form,
  setForm,
  editingInvoice,
  vendors,
  invoiceTypes,
  isRecurring,
  setIsRecurring,
  frecuencia,
  setFrecuencia,
  modoTermino,
  setModoTermino,
  fechaFin,
  setFechaFin,
  numCuotas,
  setNumCuotas
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
      <div className="form-group">
        <label className="form-label">ID Interno Factura</label>
        <input 
          type="text" 
          value={form.id_interno_factura}
          onChange={(e) => setForm({ ...form, id_interno_factura: e.target.value })}
          placeholder={isRecurring ? "Auto-generado en lote" : "Auto-generado (Ej. FAC-2026-004)"}
          disabled={!!editingInvoice || isRecurring}
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
        <label className="form-label">Tipo de Factura</label>
        <select 
          value={form.id_tipo_factura}
          onChange={(e) => setForm({ ...form, id_tipo_factura: e.target.value })}
          className="user-select"
        >
          <option value="">Seleccione Tipo</option>
          {invoiceTypes.map(t => (
            <option key={t.id_tipo_factura} value={t.id_tipo_factura}>{t.nombre}</option>
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

      <div className="form-group">
        <label className="form-label">{isRecurring ? 'Fecha Primera Cuota *' : 'Fecha de Emisión *'}</label>
        <input 
          type="date" 
          value={form.fecha_factura}
          onChange={(e) => setForm({ ...form, fecha_factura: e.target.value })}
          required
          className="m3-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">{isRecurring ? 'Importe por Cuota (€) *' : 'Importe Facturado (€) *'}</label>
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

      <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
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

      {!editingInvoice && (
        <div className="form-group" style={{ gridColumn: '1 / span 2', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
            <input 
              type="checkbox" 
              checked={isRecurring} 
              onChange={(e) => setIsRecurring(e.target.checked)} 
            />
            ¿Es un cobro recurrente / periódico?
          </label>
        </div>
      )}

      {!editingInvoice && isRecurring && (
        <>
          <div className="form-group">
            <label className="form-label">Periodicidad</label>
            <select 
              value={frecuencia} 
              onChange={(e) => setFrecuencia(e.target.value)} 
              className="user-select"
            >
              <option value="MENSUAL">Mensual</option>
              <option value="TRIMESTRAL">Trimestral</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Terminación por</label>
            <select 
              value={modoTermino} 
              onChange={(e) => setModoTermino(e.target.value)} 
              className="user-select"
            >
              <option value="CUOTAS">Número de Cuotas</option>
              <option value="FECHA">Fecha Fin</option>
            </select>
          </div>

          {modoTermino === 'CUOTAS' ? (
            <div className="form-group">
              <label className="form-label">Nº de Cuotas *</label>
              <input 
                type="number" 
                min="1" 
                max="60"
                value={numCuotas} 
                onChange={(e) => setNumCuotas(e.target.value)} 
                className="m3-input" 
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Fecha Fin *</label>
              <input 
                type="date" 
                value={fechaFin} 
                onChange={(e) => setFechaFin(e.target.value)} 
                className="m3-input" 
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
