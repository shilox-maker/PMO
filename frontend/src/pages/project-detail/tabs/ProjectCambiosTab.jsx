import React from 'react';
import { Plus, Edit2, TrendingUp } from 'lucide-react';
import { getSortedData } from '../../../utils/sorting';

export default function ProjectCambiosTab({
  project, openAddCr, openEditCr, crSort, setCrSort, renderSortHeader
}) {
  const sortedCrs = getSortedData(project.Cambios_Alcances || [], crSort);

  const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div className="m3-card glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} /> Historial de Cambios de Alcance (CR)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Control de ampliaciones de plazos, presupuestos y justificaciones técnicas</p>
        </div>
        <button className="m3-btn m3-btn-primary" onClick={openAddCr}>
          <Plus size={16} /> Solicitar Cambio (CR)
        </button>
      </div>

      {(!project.Cambios_Alcances || project.Cambios_Alcances.length === 0) ? (
        <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
          No hay solicitudes de cambio de alcance (CR) en este proyecto.
        </p>
      ) : (
        <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
          <table className="m3-table">
            <thead>
              <tr>
                {renderSortHeader('Código', 'id_cambio', crSort, setCrSort)}
                {renderSortHeader('Fecha Solicitud', 'fecha_solicitud', crSort, setCrSort)}
                {renderSortHeader('Solicitante', 'id_solicitante_ku', crSort, setCrSort)}
                {renderSortHeader('Aprobador', 'id_aprobador_ku', crSort, setCrSort)}
                {renderSortHeader('Impacto Importe', 'impacta_importe', crSort, setCrSort)}
                {renderSortHeader('Impacto Tiempo', 'impacta_tiempo', crSort, setCrSort)}
                {renderSortHeader('Estado', 'estado_cambio', crSort, setCrSort)}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedCrs.map((cr) => (
                <tr key={cr.id_cambio}>
                  <td style={{ fontWeight: 700 }}>{cr.id_cambio}</td>
                  <td>{cr.fecha_solicitud}</td>
                  <td>{cr.Solicitante ? `${cr.Solicitante.nombre} ${cr.Solicitante.apellidos}` : `ID: ${cr.id_solicitante_ku}`}</td>
                  <td>{cr.Aprobador ? `${cr.Aprobador.nombre} ${cr.Aprobador.apellidos}` : `ID: ${cr.id_aprobador_ku}`}</td>
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
                      <button className="icon-btn" onClick={() => openEditCr(cr)} title="Editar solicitud">
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
