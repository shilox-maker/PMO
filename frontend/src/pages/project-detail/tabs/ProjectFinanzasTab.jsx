import React from 'react';
import { Euro, Plus, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSortedData } from '../../../utils/sorting';

export default function ProjectFinanzasTab({
  project, openAddInvoice, openEditInvoice, handleDeleteInvoice,
  setShowInvoiceModal, setEditingInvoice, fetchProjectData, getAuthHeaders,
  invoicesSort, setInvoicesSort, renderSortHeader
}) {
  const { t } = useTranslation();
  const calc = project.calculations || {};
  const sortedInvoices = getSortedData(project.Facturas || [], invoicesSort);

  const handleOpenAdd = openAddInvoice || (() => {
    if (setEditingInvoice) setEditingInvoice(null);
    if (setShowInvoiceModal) setShowInvoiceModal(true);
  });

  const handleOpenEdit = openEditInvoice || ((fac) => {
    if (setEditingInvoice) setEditingInvoice(fac);
    if (setShowInvoiceModal) setShowInvoiceModal(true);
  });

  const handleDelete = handleDeleteInvoice || ((id) => {
    if (!window.confirm(t('financeTab.deleteConfirm', '¿Seguro que desea eliminar esta factura?'))) return;
    fetch(`${import.meta.env.VITE_API_URL}/invoices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders ? getAuthHeaders() : {}
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al eliminar la factura');
        if (fetchProjectData) fetchProjectData();
      })
      .catch(err => alert(err.message));
  });

  const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
        <div className="m3-card metric-card glass-panel" style={{ borderLeft: '4px solid var(--md-sys-color-primary)' }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(168, 199, 250, 0.15)', color: 'var(--md-sys-color-primary)' }}>
            <Euro size={24} />
          </div>
          <div className="metric-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="metric-value">{formatCurrency(parseFloat(project.budget_inicial))}</span>
            <span className="metric-label">{t('financeTab.initialBudget', 'Presupuesto Inicial')}</span>
            {project.budget_notas && (
              <span
                style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-outline)', marginTop: 4, fontStyle: 'italic', maxWidth: '200px', whiteSpace: 'normal', lineHeight: 1.2 }}
                title={project.budget_notas}
              >
                {project.budget_notas}
              </span>
            )}
          </div>
        </div>

        <div className="m3-card metric-card glass-panel" style={{ borderLeft: '4px solid var(--md-sys-color-primary)' }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(168, 199, 250, 0.15)', color: 'var(--md-sys-color-primary)' }}>
            <Euro size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value" style={{ color: calc.budget_actualizado > project.budget_inicial ? 'var(--color-rag-yellow)' : 'inherit' }}>
              {formatCurrency(calc.budget_actualizado)}
            </span>
            <span className="metric-label">{t('financeTab.updatedBudget', 'Budget Actualizado')}</span>
          </div>
        </div>

        <div className="m3-card metric-card glass-panel" style={{ borderLeft: '4px solid var(--color-rag-green)' }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(52, 199, 89, 0.15)', color: 'var(--color-rag-green)' }}>
            <Euro size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value" style={{ color: 'var(--color-rag-green)' }}>{formatCurrency(calc.consumo_real)}</span>
            <span className="metric-label">{t('financeTab.executedBudget', 'Gasto Ejecutado')}</span>
          </div>
        </div>

        <div className="m3-card metric-card glass-panel" style={{ borderLeft: calc.presupuesto_disponible < 0 ? '4px solid var(--color-rag-red)' : '4px solid var(--color-rag-green)' }}>
          <div className="metric-icon-wrapper" style={{
            backgroundColor: calc.presupuesto_disponible < 0 ? 'rgba(255, 69, 58, 0.15)' : 'rgba(52, 199, 89, 0.15)',
            color: calc.presupuesto_disponible < 0 ? 'var(--color-rag-red)' : 'var(--color-rag-green)'
          }}>
            <Euro size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value" style={{ color: calc.presupuesto_disponible < 0 ? 'var(--color-rag-red)' : 'var(--color-rag-green)' }}>
              {formatCurrency(calc.presupuesto_disponible)}
            </span>
            <span className="metric-label">{t('financeTab.availableBudget', 'Presupuesto Disponible')}</span>
          </div>
        </div>
      </div>

      {/* Facturas Section */}
      <div className="m3-card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>{t('financeTab.invoicesTitle', 'Facturas y Cobros')}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{t('financeTab.invoicesSubtitle', 'Seguimiento contable de hitos de cobro y órdenes de compra')}</p>
          </div>
          <button className="m3-btn m3-btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> {t('financeTab.newInvoice', 'Nueva Factura')}
          </button>
        </div>

        {(!project.Facturas || project.Facturas.length === 0) ? (
          <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
            {t('financeTab.noInvoices', 'No hay facturas registradas en este proyecto.')}
          </p>
        ) : (
          <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
            <table className="m3-table">
              <thead>
                <tr>
                  {renderSortHeader(t('financeTab.code', 'Código Interno'), 'id_interno_factura', invoicesSort, setInvoicesSort)}
                  {renderSortHeader(t('financeTab.vendorInvoice', 'Factura Socio'), 'numero_factura', invoicesSort, setInvoicesSort)}
                  {renderSortHeader(t('financeTab.po', 'Orden Compra PO'), 'PO', invoicesSort, setInvoicesSort)}
                  {renderSortHeader(t('financeTab.type', 'Tipo'), 'TipoFactura.nombre', invoicesSort, setInvoicesSort)}
                  {renderSortHeader(t('financeTab.concept', 'Concepto'), 'concepto', invoicesSort, setInvoicesSort)}
                  {renderSortHeader(t('financeTab.issueDate', 'Fecha Emisión'), 'fecha_factura', invoicesSort, setInvoicesSort)}
                  {renderSortHeader(t('financeTab.amount', 'Importe'), 'importe', invoicesSort, setInvoicesSort)}
                  {renderSortHeader(t('financeTab.status', 'Estado'), 'estado', invoicesSort, setInvoicesSort)}
                  <th>{t('financeTab.actions', 'Acciones')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((fac) => (
                  <tr key={fac.id_interno_factura}>
                    <td style={{ fontWeight: 700 }}>{fac.id_interno_factura}</td>
                    <td>{fac.numero_factura || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--md-sys-color-primary)' }}>{fac.PO || '—'}</td>
                    <td>
                      {fac.TipoFactura?.nombre ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(187, 134, 252, 0.15)', color: '#d0bcff', border: '1px solid rgba(187, 134, 252, 0.3)', fontSize: '0.75rem' }}>
                          {fac.TipoFactura.nombre}
                        </span>
                      ) : '—'}
                    </td>
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
                        <button className="icon-btn" onClick={() => handleOpenEdit(fac)} title={t('financeTab.editTooltip', 'Editar factura')}>
                          <Edit2 size={14} />
                        </button>
                        <button className="icon-btn" onClick={() => handleDelete(fac.id_interno_factura)} title={t('financeTab.deleteTooltip', 'Eliminar factura')} style={{ color: 'var(--color-rag-red)' }}>
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
