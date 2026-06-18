import React from 'react';
import { DollarSign, Plus, Edit2, Trash2 } from 'lucide-react';
import { getSortedData } from '../../../utils/sorting';

export default function ProjectFinanzasTab({
  project, openAddInvoice, openEditInvoice, handleDeleteInvoice,
  invoicesSort, setInvoicesSort, renderSortHeader
}) {
  const calc = project.calculations || {};
  const sortedInvoices = getSortedData(project.Facturas || [], invoicesSort);

  const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
        <div className="m3-card metric-card glass-panel" style={{ borderLeft: '4px solid var(--md-sys-color-primary)' }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(168, 199, 250, 0.15)', color: 'var(--md-sys-color-primary)' }}>
            <DollarSign size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{formatCurrency(parseFloat(project.budget_inicial))}</span>
            <span className="metric-label">Presupuesto Inicial</span>
          </div>
        </div>

        <div className="m3-card metric-card glass-panel" style={{ borderLeft: '4px solid var(--md-sys-color-primary)' }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(168, 199, 250, 0.15)', color: 'var(--md-sys-color-primary)' }}>
            <DollarSign size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value" style={{ color: calc.budget_actualizado > project.budget_inicial ? 'var(--color-rag-yellow)' : 'inherit' }}>
              {formatCurrency(calc.budget_actualizado)}
            </span>
            <span className="metric-label">Budget Actualizado</span>
          </div>
        </div>

        <div className="m3-card metric-card glass-panel" style={{ borderLeft: '4px solid var(--color-rag-green)' }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(52, 199, 89, 0.15)', color: 'var(--color-rag-green)' }}>
            <DollarSign size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value" style={{ color: 'var(--color-rag-green)' }}>{formatCurrency(calc.consumo_real)}</span>
            <span className="metric-label">Gasto Comprometido / Facturado</span>
          </div>
        </div>

        <div className="m3-card metric-card glass-panel" style={{ borderLeft: calc.presupuesto_disponible < 0 ? '4px solid var(--color-rag-red)' : '4px solid var(--color-rag-green)' }}>
          <div className="metric-icon-wrapper" style={{ 
            backgroundColor: calc.presupuesto_disponible < 0 ? 'rgba(255, 69, 58, 0.15)' : 'rgba(52, 199, 89, 0.15)', 
            color: calc.presupuesto_disponible < 0 ? 'var(--color-rag-red)' : 'var(--color-rag-green)' 
          }}>
            <DollarSign size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value" style={{ color: calc.presupuesto_disponible < 0 ? 'var(--color-rag-red)' : 'var(--color-rag-green)' }}>
              {formatCurrency(calc.presupuesto_disponible)}
            </span>
            <span className="metric-label">Presupuesto Disponible</span>
          </div>
        </div>
      </div>

      {/* Facturas Section */}
      <div className="m3-card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Registro de Cobros Realizados / PO</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Seguimiento contable de hitos de cobro y órdenes de compra</p>
          </div>
          <button className="m3-btn m3-btn-primary" onClick={openAddInvoice}>
            <Plus size={16} /> Registrar Cobro / PO
          </button>
        </div>

        {(!project.Facturas || project.Facturas.length === 0) ? (
          <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
            No hay cobros ni facturas registradas en este proyecto.
          </p>
        ) : (
          <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
            <table className="m3-table">
              <thead>
                <tr>
                  {renderSortHeader('Código Interno', 'id_interno_factura', invoicesSort, setInvoicesSort)}
                  {renderSortHeader('Factura Socio', 'numero_factura', invoicesSort, setInvoicesSort)}
                  {renderSortHeader('Orden Compra PO', 'PO', invoicesSort, setInvoicesSort)}
                  {renderSortHeader('Concepto', 'concepto', invoicesSort, setInvoicesSort)}
                  {renderSortHeader('Fecha Emisión', 'fecha_factura', invoicesSort, setInvoicesSort)}
                  {renderSortHeader('Importe', 'importe', invoicesSort, setInvoicesSort)}
                  {renderSortHeader('Estado', 'estado', invoicesSort, setInvoicesSort)}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((fac) => (
                  <tr key={fac.id_interno_factura}>
                    <td style={{ fontWeight: 700 }}>{fac.id_interno_factura}</td>
                    <td>{fac.numero_factura || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--md-sys-color-primary)' }}>{fac.PO || '—'}</td>
                    <td>{fac.concepto}</td>
                    <td>{fac.fecha_factura}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(parseFloat(fac.importe))}</td>
                    <td>
                      <span className={`badge ${fac.estado === 'RECIBIDA' ? 'badge-green' : 'badge-orange'}`}>
                        {fac.estado.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn" onClick={() => openEditInvoice(fac)} title="Editar factura">
                          <Edit2 size={14} />
                        </button>
                        <button className="icon-btn" onClick={() => handleDeleteInvoice(fac.id_interno_factura)} title="Eliminar factura" style={{ color: 'var(--color-rag-red)' }}>
                          <Trash2 size={14} />
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
    </div>
  );
}
