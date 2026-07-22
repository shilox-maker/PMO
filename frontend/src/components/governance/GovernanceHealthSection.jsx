import React from 'react';
import { Eye } from 'lucide-react';
import { getSortedData } from '../../utils/sorting';

export default function GovernanceHealthSection({
  filteredGridData,
  visibleColumnsMap,
  sortConfig,
  renderSortHeader,
  onViewProject,
  onViewVendor,
  handleExportExcel,
  generatePortfolioReport,
  exportingExcel,
  generatingReport
}) {
  const getProgressColor = (percent) => {
    if (percent > 90) return 'var(--color-rag-red)';
    if (percent > 75) return 'var(--color-rag-yellow)';
    return 'var(--md-sys-color-primary)';
  };

  return (
    <div className="m3-card glass-panel" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
          Listado de Salud del Portfolio ({filteredGridData.length})
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className="m3-btn m3-btn-outline" 
            onClick={handleExportExcel}
            disabled={exportingExcel}
            style={{ height: '36px', fontSize: '0.8rem' }}
          >
            {exportingExcel ? 'Exportando...' : '📊 Exportar Excel'}
          </button>
          <button 
            className="m3-btn m3-btn-primary" 
            onClick={generatePortfolioReport}
            disabled={generatingReport}
            style={{ height: '36px', fontSize: '0.8rem' }}
          >
            {generatingReport ? 'Generando PDF...' : '📄 Generar Informe Portfolio'}
          </button>
        </div>
      </div>

      {filteredGridData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--md-sys-color-outline)' }}>
          No hay proyectos registrados con los filtros aplicados.
        </div>
      ) : (
        <div className="m3-table-wrapper glass-panel">
          <table className="m3-table">
            <thead>
              <tr>
                {visibleColumnsMap.id_proyecto && renderSortHeader('Código', 'id_proyecto')}
                {visibleColumnsMap.nombre_proyecto && renderSortHeader('Proyecto', 'nombre_proyecto')}
                {visibleColumnsMap.pm_nombre && renderSortHeader('PM', 'pm_nombre')}
                {visibleColumnsMap.indicador_rag && renderSortHeader('RAG', 'indicador_rag')}
                {visibleColumnsMap.fecha_inicio && renderSortHeader('Fecha Inicio', 'fecha_inicio')}
                {visibleColumnsMap.fecha_fin_inicial && renderSortHeader('Fecha Fin Base', 'fecha_fin_inicial')}
                {visibleColumnsMap.fecha_fin_estimada && renderSortHeader('Fecha Fin Est.', 'calculations.fecha_fin_estimada')}
                {visibleColumnsMap.gasto_total_facturas && renderSortHeader('Facturado', 'gasto_total_facturas')}
                {visibleColumnsMap.alerta_tiempo && <th>Alerta Tiempo</th>}
                {visibleColumnsMap.alerta_dinero && <th>Alerta Dinero</th>}
                {visibleColumnsMap.proximo_hito && renderSortHeader('Próximo Hito', 'nextMilestone.fecha_limite')}
                {visibleColumnsMap.ultimo_comentario && renderSortHeader('Último Comentario', 'ultimo_comentario')}
                {visibleColumnsMap.accion && <th>Ficha</th>}
              </tr>
            </thead>
            <tbody>
              {getSortedData(filteredGridData, sortConfig).map(p => {
                const calc = p.calculations;
                const consumptionPercent = calc ? Math.min((calc.consumo_real / calc.budget_actualizado) * 100, 100) : 0;

                const todayStr = new Date().toISOString().split('T')[0];
                const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes(p.estado_proyecto?.toUpperCase());
                const isProjectOverdue = !isClosed && calc?.fecha_fin_estimada && calc.fecha_fin_estimada < todayStr;
                const isMoneyOver = calc && calc.presupuesto_disponible < 0;

                return (
                  <tr key={p.id_proyecto} style={isProjectOverdue ? { backgroundColor: 'rgba(255, 69, 58, 0.08)' } : {}}>
                    {visibleColumnsMap.id_proyecto && <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.id_proyecto}</td>}
                    {visibleColumnsMap.nombre_proyecto && <td style={{ fontWeight: 600 }}>{p.nombre_proyecto}</td>}
                    {visibleColumnsMap.pm_nombre && <td>{p.pm_nombre}</td>}
                    {visibleColumnsMap.indicador_rag && <td style={{ textAlign: 'center' }}><div className={`project-rag-dot ${p.indicador_rag}`} style={{ width: 16, height: 16, margin: '0 auto' }}></div></td>}
                    {visibleColumnsMap.fecha_inicio && <td>{p.fecha_inicio ? new Date(p.fecha_inicio).toLocaleDateString('es-ES') : '—'}</td>}
                    {visibleColumnsMap.fecha_fin_inicial && <td>{p.fecha_fin_inicial ? new Date(p.fecha_fin_inicial).toLocaleDateString('es-ES') : '—'}</td>}
                    {visibleColumnsMap.fecha_fin_estimada && <td>{calc?.fecha_fin_estimada ? new Date(calc.fecha_fin_estimada).toLocaleDateString('es-ES') : '—'}</td>}
                    {visibleColumnsMap.gasto_total_facturas && <td>{p.gasto_total_facturas?.toLocaleString('es-ES')} €</td>}
                    
                    {visibleColumnsMap.alerta_tiempo && <td>
                      {isProjectOverdue ? (
                        <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>Retrasado</span>
                      ) : (
                        <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>En plazo</span>
                      )}
                    </td>}

                    {visibleColumnsMap.alerta_dinero && <td>
                      {isMoneyOver ? (
                        <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>Excedido</span>
                      ) : (
                        <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>OK</span>
                      )}
                    </td>}

                    {visibleColumnsMap.proximo_hito && <td style={{ fontSize: '0.8rem', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.nextMilestone ? (
                        <span title={`${p.nextMilestone.titulo_tarea} (${p.nextMilestone.fecha_limite})`}>
                          <strong>{p.nextMilestone.titulo_tarea}</strong>
                        </span>
                      ) : '—'}
                    </td>}

                    {visibleColumnsMap.ultimo_comentario && (
                      <td style={{ fontSize: '0.8rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--md-sys-color-outline)' }}>
                        {p.ultimo_comentario || '—'}
                      </td>
                    )}

                    {visibleColumnsMap.accion && <td>
                      <button className="icon-btn" onClick={() => onViewProject(p.id_proyecto)}>
                        <Eye size={16} />
                      </button>
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
