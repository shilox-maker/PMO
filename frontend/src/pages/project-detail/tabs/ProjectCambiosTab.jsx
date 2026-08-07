import React from 'react';
import { Plus, Edit2, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSortedData } from '../../../utils/sorting';

export default function ProjectCambiosTab({
  project, openAddCr, openEditCr, setShowCrModal, setEditingCr, crSort, setCrSort, renderSortHeader
}) {
  const { t } = useTranslation();
  const sortedCrs = getSortedData(project.CambiosAlcance || [], crSort);

  const handleOpenAdd = openAddCr || (() => {
    if (setEditingCr) setEditingCr(null);
    if (setShowCrModal) setShowCrModal(true);
  });

  const handleOpenEdit = openEditCr || ((cr) => {
    if (setEditingCr) setEditingCr(cr);
    if (setShowCrModal) setShowCrModal(true);
  });

  const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div className="m3-card glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} /> {t('changesTab.title')}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Control de ampliaciones de plazos, presupuestos y justificaciones técnicas</p>
        </div>
        <button className="m3-btn m3-btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> {t('changesTab.newChange')}
        </button>
      </div>

      {sortedCrs.length === 0 ? (
        <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
          {t('changesTab.noChanges')}
        </p>
      ) : (
        <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
          <table className="m3-table">
            <thead>
              <tr>
                {renderSortHeader(t('changesTab.code'), 'id_cambio', crSort, setCrSort)}
                {renderSortHeader('Fecha Solicitud', 'fecha_solicitud', crSort, setCrSort)}
                {renderSortHeader(t('changesTab.requestedBy'), 'id_solicitante_contacto', crSort, setCrSort)}
                {renderSortHeader('Aprobador', 'id_aprobador_contacto', crSort, setCrSort)}
                {renderSortHeader(t('changesTab.costImpact'), 'impacta_importe', crSort, setCrSort)}
                {renderSortHeader(t('changesTab.timeImpact'), 'impacta_tiempo', crSort, setCrSort)}
                {renderSortHeader(t('changesTab.status'), 'estado_cambio', crSort, setCrSort)}
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedCrs.map((cr) => (
                <tr key={cr.id_cambio}>
                  <td style={{ fontWeight: 700 }}>{cr.id_cambio}</td>
                  <td>{cr.fecha_solicitud}</td>
                  <td>{cr.Solicitante ? `${cr.Solicitante.nombre} ${cr.Solicitante.apellidos}` : `ID: ${cr.id_solicitante_contacto}`}</td>
                  <td>{cr.Aprobador ? `${cr.Aprobador.nombre} ${cr.Aprobador.apellidos}` : `ID: ${cr.id_aprobador_contacto}`}</td>
                  <td style={{ fontWeight: cr.impacta_importe ? 600 : 'normal' }}>
                    {cr.impacta_importe ? formatCurrency(parseFloat(cr.importe_impacto)) : '—'}
                  </td>
                  <td style={{ fontWeight: cr.impacta_tiempo ? 600 : 'normal' }}>
                    {cr.impacta_tiempo ? `+${cr.dias_impacto} días` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${
                      cr.estado_cambio === 'APROBADO' ? 'badge-green' : 
                      cr.estado_cambio === 'RECHAZADO' ? 'badge-red' : 'badge-orange'
                    }`}>
                      {cr.estado_cambio}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="icon-btn" onClick={() => handleOpenEdit(cr)} title="Editar solicitud">
                        <Edit2 size={14} />
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
  );
}
