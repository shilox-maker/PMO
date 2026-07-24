import React from 'react';

export default function RecurringInvoicePreview({
  items,
  setItems,
  onBack,
  onConfirm,
  isSubmitting
}) {
  const totalAmount = items.reduce((acc, curr) => acc + (parseFloat(curr.importe) || 0), 0);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: field === 'importe' ? parseFloat(value) || 0 : value
    };
    setItems(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 12, 
        backgroundColor: 'rgba(255, 255, 255, 0.05)', 
        padding: 12, 
        borderRadius: 8 
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Nº de Cuotas</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{items.length}</div>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Total Acumulado</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-primary, #3b82f6)' }}>
            {totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Importe por Cuota</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
            {items.length > 0 ? (totalAmount / items.length).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 0} €
          </div>
        </div>
      </div>

      <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <th style={{ padding: '8px 12px' }}>#</th>
              <th style={{ padding: '8px 12px' }}>Fecha Emisión</th>
              <th style={{ padding: '8px 12px' }}>Concepto</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Importe (€)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id_temp} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '6px 12px', fontWeight: 600 }}>{idx + 1}</td>
                <td style={{ padding: '6px 12px' }}>
                  <input 
                    type="date" 
                    value={item.fecha_factura}
                    onChange={(e) => handleItemChange(idx, 'fecha_factura', e.target.value)}
                    className="m3-input"
                    style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                  />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <input 
                    type="text" 
                    value={item.concepto}
                    onChange={(e) => handleItemChange(idx, 'concepto', e.target.value)}
                    className="m3-input"
                    style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                  />
                </td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                  <input 
                    type="number" 
                    step="0.01"
                    value={item.importe}
                    onChange={(e) => handleItemChange(idx, 'importe', e.target.value)}
                    className="m3-input"
                    style={{ padding: '4px 8px', fontSize: '0.85rem', textAlign: 'right', width: '100px' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', marginTop: 12 }}>
        <button type="button" className="m3-btn m3-btn-outline" onClick={onBack} disabled={isSubmitting}>
          ← Atrás (Ajustar Parámetros)
        </button>
        <button type="button" className="m3-btn m3-btn-primary" onClick={onConfirm} disabled={isSubmitting || items.length === 0}>
          {isSubmitting ? 'Guardando...' : `Confirmar y Generar ${items.length} Cobros`}
        </button>
      </div>
    </div>
  );
}
