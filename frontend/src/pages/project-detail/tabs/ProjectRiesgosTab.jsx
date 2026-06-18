import React from 'react';
import { Plus, Edit2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getSortedData } from '../../../utils/sorting';

export default function ProjectRiesgosTab({
  project, openAddRisk, openEditRisk, handleToggleRiskState,
  openAddIssue, openEditIssue, risksSort, setRisksSort, issuesSort, setIssuesSort,
  renderSortHeader
}) {
  const sortedRisks = getSortedData(project.Riesgos || [], risksSort);
  const sortedIssues = getSortedData(project.Incidencias || [], issuesSort);

  const getPriorityColor = (level) => {
    if (level === 'ALTA' || level === 'BLOQUEANTE') return 'var(--color-rag-red)';
    if (level === 'MEDIA') return 'var(--color-rag-yellow)';
    return 'var(--md-sys-color-primary)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* RIESGOS PREVENTIVOS */}
      <div className="m3-card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={20} /> Matriz de Riesgos Preventivos
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Identificación y planificación de planes de contingencia para mitigar desviaciones</p>
          </div>
          <button className="m3-btn m3-btn-primary" onClick={openAddRisk}>
            <Plus size={16} /> Identificar Riesgo
          </button>
        </div>

        {(!project.Riesgos || project.Riesgos.length === 0) ? (
          <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
            No hay riesgos preventivos identificados en este proyecto.
          </p>
        ) : (
          <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
            <table className="m3-table">
              <thead>
                <tr>
                  {renderSortHeader('Código', 'id_riesgo', risksSort, setRisksSort)}
                  {renderSortHeader('Riesgo Identificado', 'titulo_riesgo', risksSort, setRisksSort)}
                  {renderSortHeader('Probabilidad', 'probabilidad', risksSort, setRisksSort)}
                  {renderSortHeader('Impacto', 'impacto', risksSort, setRisksSort)}
                  {renderSortHeader('Mitigación / Contingencia', 'plan_mitigacion', risksSort, setRisksSort)}
                  {renderSortHeader('Próxima Revisión', 'fecha_proxima_revision', risksSort, setRisksSort)}
                  {renderSortHeader('Estado', 'estado_riesgo', risksSort, setRisksSort)}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedRisks.map((r) => (
                  <tr key={r.id_riesgo}>
                    <td style={{ fontWeight: 700 }}>{r.id_riesgo}</td>
                    <td style={{ fontWeight: 600 }}>{r.titulo_riesgo}</td>
                    <td style={{ color: getPriorityColor(r.probabilidad), fontWeight: 700 }}>{r.probabilidad}</td>
                    <td style={{ color: getPriorityColor(r.impacto), fontWeight: 700 }}>{r.impacto}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '300px' }}>{r.plan_mitigacion}</td>
                    <td>{r.fecha_proxima_revision}</td>
                    <td>
                      <button 
                        className={`badge ${r.estado_riesgo === 'ACTIVO' ? 'badge-red' : 'badge-green'}`}
                        onClick={() => handleToggleRiskState(r.id_riesgo, r.estado_riesgo)}
                        title="Haga clic para cambiar estado del riesgo"
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        {r.estado_riesgo}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn" onClick={() => openEditRisk(r)} title="Editar riesgo">
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

      {/* INCIDENCIAS ACTIVAS / CERRADAS */}
      <div className="m3-card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={20} /> Incidencias Técnicas o de Plazos
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Registro de problemas bloqueantes actuales y sus planes de acción/soluciones aplicadas</p>
          </div>
          <button className="m3-btn m3-btn-primary" onClick={openAddIssue}>
            <Plus size={16} /> Registrar Incidencia
          </button>
        </div>

        {(!project.Incidencias || project.Incidencias.length === 0) ? (
          <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
            No hay incidencias registradas en este proyecto.
          </p>
        ) : (
          <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
            <table className="m3-table">
              <thead>
                <tr>
                  {renderSortHeader('Código', 'id_incidencia', issuesSort, setIssuesSort)}
                  {renderSortHeader('Incidencia', 'titulo', issuesSort, setIssuesSort)}
                  {renderSortHeader('Tipo', 'tipo_incidencias', issuesSort, setIssuesSort)}
                  {renderSortHeader('Criticidad', 'criticidad', issuesSort, setIssuesSort)}
                  {renderSortHeader('Apertura', 'fecha_apertura', issuesSort, setIssuesSort)}
                  {renderSortHeader('Cierre', 'fecha_cierre', issuesSort, setIssuesSort)}
                  {renderSortHeader('Estado', 'estado', issuesSort, setIssuesSort)}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedIssues.map((i) => (
                  <tr key={i.id_incidencia}>
                    <td style={{ fontWeight: 700 }}>{i.id_incidencia}</td>
                    <td style={{ fontWeight: 600 }}>
                      {i.titulo}
                      {i.solucion_aplicada && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-rag-green)', marginTop: 4 }}>
                          <strong>Solución:</strong> {i.solucion_aplicada}
                        </div>
                      )}
                    </td>
                    <td>{i.tipo_incidencias.replace(/_/g, ' ')}</td>
                    <td style={{ color: getPriorityColor(i.criticidad), fontWeight: 700 }}>{i.criticidad}</td>
                    <td>{i.fecha_apertura}</td>
                    <td>{i.fecha_cierre || '—'}</td>
                    <td>
                      <span className={`badge ${
                        i.estado === 'RESUELTA' ? 'badge-green' : 
                        i.estado === 'ABIERTA' ? 'badge-red' : 'badge-orange'
                      }`}>
                        {i.estado}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn" onClick={() => openEditIssue(i)} title="Editar incidencia">
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

    </div>
  );
}
