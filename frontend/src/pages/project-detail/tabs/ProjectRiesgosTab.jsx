import React from 'react';
import { Plus, Edit2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSortedData } from '../../../utils/sorting';

export default function ProjectRiesgosTab({
  project, openAddRisk, openEditRisk, handleToggleRiskState,
  openAddIssue, openEditIssue, setShowRiskModal, setEditingRisk,
  setShowIssueModal, setEditingIssue, fetchProjectData, getAuthHeaders,
  risksSort, setRisksSort, issuesSort, setIssuesSort, renderSortHeader
}) {
  const { t } = useTranslation();
  const sortedRisks = getSortedData(project.Riesgos || [], risksSort);
  const sortedIssues = getSortedData(project.Incidencias || [], issuesSort);

  const handleOpenAddRisk = openAddRisk || (() => {
    if (setEditingRisk) setEditingRisk(null);
    if (setShowRiskModal) setShowRiskModal(true);
  });

  const handleOpenEditRisk = openEditRisk || ((r) => {
    if (setEditingRisk) setEditingRisk(r);
    if (setShowRiskModal) setShowRiskModal(true);
  });

  const handleToggleRisk = handleToggleRiskState || (async (id_riesgo, estado_actual) => {
    const nuevoEstado = estado_actual === 'ACTIVO' ? 'CERRADO' : 'ACTIVO';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/risks/${id_riesgo}`, {
        method: 'PUT',
        headers: getAuthHeaders ? getAuthHeaders() : {},
        body: JSON.stringify({ estado_riesgo: nuevoEstado })
      });
      if (!res.ok) throw new Error('Error al cambiar el estado del riesgo');
      if (fetchProjectData) fetchProjectData();
    } catch (err) {
      alert(err.message);
    }
  });

  const handleOpenAddIssue = openAddIssue || (() => {
    if (setEditingIssue) setEditingIssue(null);
    if (setShowIssueModal) setShowIssueModal(true);
  });

  const handleOpenEditIssue = openEditIssue || ((i) => {
    if (setEditingIssue) setEditingIssue(i);
    if (setShowIssueModal) setShowIssueModal(true);
  });

  const getPriorityColor = (level) => {
    if (level === 'ALTA' || level === 'BLOQUEANTE') return 'var(--color-rag-red)';
    if (level === 'MEDIA') return 'var(--color-rag-yellow)';
    return 'var(--md-sys-color-primary)';
  };

  const getLinkedTask = (item) => {
    if (item.tarea) return item.tarea;
    if (item.id_tarea && project.Tareas) {
      return project.Tareas.find(taskItem => Number(taskItem.id_tarea) === Number(item.id_tarea));
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* RIESGOS PREVENTIVOS */}
      <div className="m3-card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={20} /> {t('risksTab.risksTitle', 'Riesgos del Proyecto')}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{t('risksTab.risksSubtitle', 'Identificación y planificación de planes de contingencia para mitigar desviaciones')}</p>
          </div>
          <button className="m3-btn m3-btn-primary" onClick={handleOpenAddRisk}>
            <Plus size={16} /> {t('risksTab.newRisk', 'Nuevo Riesgo')}
          </button>
        </div>

        {(!project.Riesgos || project.Riesgos.length === 0) ? (
          <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
            {t('risksTab.noRisks', 'No hay riesgos preventivos identificados en este proyecto.')}
          </p>
        ) : (
          <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
            <table className="m3-table">
              <thead>
                <tr>
                  {renderSortHeader(t('risksTab.code', 'Código'), 'id_riesgo', risksSort, setRisksSort)}
                  {renderSortHeader(t('risksTab.identifiedRisk', 'Riesgo Identificado'), 'titulo_riesgo', risksSort, setRisksSort)}
                  {renderSortHeader(t('risksTab.probability', 'Probabilidad'), 'probabilidad', risksSort, setRisksSort)}
                  {renderSortHeader(t('risksTab.impact', 'Impacto'), 'impacto', risksSort, setRisksSort)}
                  {renderSortHeader(t('risksTab.mitigation', 'Plan de Mitigación'), 'plan_mitigacion', risksSort, setRisksSort)}
                  {renderSortHeader(t('risksTab.nextReview', 'Próxima Revisión'), 'fecha_proxima_revision', risksSort, setRisksSort)}
                  {renderSortHeader(t('risksTab.linkedTask', 'Tarea Relacionada'), 'id_tarea', risksSort, setRisksSort)}
                  {renderSortHeader(t('risksTab.status', 'Estado'), 'estado_riesgo', risksSort, setRisksSort)}
                  <th>{t('risksTab.actions', 'Acciones')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedRisks.map((r) => {
                  const linkedTask = getLinkedTask(r);
                  const probKey = r.probabilidad ? r.probabilidad.toLowerCase() : '';
                  const probLabel = t(`risksTab.${probKey}`, r.probabilidad);
                  const impactKey = r.impacto ? r.impacto.toLowerCase() : '';
                  const impactLabel = t(`risksTab.${impactKey}`, r.impacto);
                  const statusKey = r.estado_riesgo ? r.estado_riesgo.toLowerCase() : '';
                  const statusLabel = t(`risksTab.${statusKey}`, r.estado_riesgo);

                  return (
                    <tr key={r.id_riesgo}>
                      <td style={{ fontWeight: 700 }}>{r.id_riesgo}</td>
                      <td style={{ fontWeight: 600 }}>{r.titulo_riesgo}</td>
                      <td style={{ color: getPriorityColor(r.probabilidad), fontWeight: 700 }}>{probLabel}</td>
                      <td style={{ color: getPriorityColor(r.impacto), fontWeight: 700 }}>{impactLabel}</td>
                      <td style={{ fontSize: '0.8rem', maxWidth: '260px' }}>{r.plan_mitigacion}</td>
                      <td>{r.fecha_proxima_revision}</td>
                      <td>
                        {linkedTask ? (
                          <span style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: 4 }}>
                            {linkedTask.es_hito ? '🎯' : '📌'} {linkedTask.titulo_tarea}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--md-sys-color-outline)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className={`badge ${r.estado_riesgo === 'ACTIVO' ? 'badge-red' : 'badge-green'}`}
                          onClick={() => handleToggleRisk(r.id_riesgo, r.estado_riesgo)}
                          title={t('risksTab.toggleStatusTooltip', 'Haga clic para cambiar estado del riesgo')}
                          style={{ border: 'none', cursor: 'pointer' }}
                        >
                          {statusLabel}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="icon-btn" onClick={() => handleOpenEditRisk(r)} title={t('risksTab.editRiskTooltip', 'Editar riesgo')}>
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              <AlertTriangle size={20} /> {t('risksTab.issuesTitle', 'Incidencias Técnicas o de Plazos')}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{t('risksTab.issuesSubtitle', 'Registro de problemas bloqueantes actuales y sus planes de acción/soluciones aplicadas')}</p>
          </div>
          <button className="m3-btn m3-btn-primary" onClick={handleOpenAddIssue}>
            <Plus size={16} /> {t('risksTab.newIssue', 'Registrar Incidencia')}
          </button>
        </div>

        {(!project.Incidencias || project.Incidencias.length === 0) ? (
          <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
            {t('risksTab.noIssues', 'No hay incidencias registradas en este proyecto.')}
          </p>
        ) : (
          <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
            <table className="m3-table">
              <thead>
                <tr>
                  {renderSortHeader(t('risksTab.code', 'Código'), 'id_incidencia', issuesSort, setIssuesSort)}
                  {renderSortHeader(t('risksTab.issue', 'Incidencia'), 'titulo', issuesSort, setIssuesSort)}
                  {renderSortHeader(t('risksTab.type', 'Tipo'), 'tipo_incidencias', issuesSort, setIssuesSort)}
                  {renderSortHeader(t('risksTab.criticality', 'Criticidad'), 'criticidad', issuesSort, setIssuesSort)}
                  {renderSortHeader(t('risksTab.openDate', 'Apertura'), 'fecha_apertura', issuesSort, setIssuesSort)}
                  {renderSortHeader(t('risksTab.closeDate', 'Cierre'), 'fecha_cierre', issuesSort, setIssuesSort)}
                  {renderSortHeader(t('risksTab.linkedTask', 'Tarea Relacionada'), 'id_tarea', issuesSort, setIssuesSort)}
                  {renderSortHeader(t('risksTab.status', 'Estado'), 'estado', issuesSort, setIssuesSort)}
                  <th>{t('risksTab.actions', 'Acciones')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedIssues.map((i) => {
                  const linkedTask = getLinkedTask(i);
                  const critKey = i.criticidad ? i.criticidad.toLowerCase() : '';
                  const critLabel = t(`risksTab.${critKey}`, i.criticidad);
                  const statusLabel = i.estado === 'RESUELTA' ? t('risksTab.statusResolved', 'RESUELTA') : (i.estado === 'ABIERTA' ? t('risksTab.statusOpen', 'ABIERTA') : i.estado);

                  return (
                    <tr key={i.id_incidencia}>
                      <td style={{ fontWeight: 700 }}>{i.id_incidencia}</td>
                      <td style={{ fontWeight: 600 }}>
                        {i.titulo}
                        {i.solucion_aplicada && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-rag-green)', marginTop: 4 }}>
                            <strong>{t('risksTab.solutionPrefix', 'Solución:')}</strong> {i.solucion_aplicada}
                          </div>
                        )}
                      </td>
                      <td>{i.tipo_incidencias ? i.tipo_incidencias.replace(/_/g, ' ') : '—'}</td>
                      <td style={{ color: getPriorityColor(i.criticidad), fontWeight: 700 }}>{critLabel}</td>
                      <td>{i.fecha_apertura}</td>
                      <td>{i.fecha_cierre || '—'}</td>
                      <td>
                        {linkedTask ? (
                          <span style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: 4 }}>
                            {linkedTask.es_hito ? '🎯' : '📌'} {linkedTask.titulo_tarea}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--md-sys-color-outline)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          i.estado === 'RESUELTA' ? 'badge-green' : 
                          i.estado === 'ABIERTA' ? 'badge-red' : 'badge-orange'
                        }`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="icon-btn" onClick={() => handleOpenEditIssue(i)} title={t('risksTab.editIssueTooltip', 'Editar incidencia')}>
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
