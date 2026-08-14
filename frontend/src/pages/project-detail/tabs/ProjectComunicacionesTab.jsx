import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Users, Edit2, Mail, Plus, Trash2, Calendar, Clock, CheckCircle } from 'lucide-react';
import EmailReportModal from '../../../components/modals/EmailReportModal';
import CommunicationPlanModal from './CommunicationPlanModal';
import CommunicationAuditHistory from './CommunicationAuditHistory';

export default function ProjectComunicacionesTab({ project, getAuthHeaders, handleUpdateProject }) {
  const { t, i18n } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState(null);
  const [emailModalData, setEmailModalData] = useState({ isOpen: false, committeeTitle: '', contacts: [], planId: null });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const fetchCommunicationData = useCallback(async () => {
    if (!project?.id_proyecto) return;
    setLoading(true);
    try {
      const authHeaders = getAuthHeaders ? getAuthHeaders() : {};
      const [plansRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/projects/${project.id_proyecto}/planes-comunicacion`, { headers: authHeaders }),
        fetch(`${API_URL}/projects/${project.id_proyecto}/planes-comunicacion/log`, { headers: authHeaders })
      ]);
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData);
      } else if (project.PlanesComunicacion) {
        setPlans(project.PlanesComunicacion);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (err) {
      console.error('Error cargando planes de comunicación:', err);
      if (project.PlanesComunicacion) setPlans(project.PlanesComunicacion);
    } finally {
      setLoading(false);
    }
  }, [project?.id_proyecto]);

  useEffect(() => {
    fetchCommunicationData();
  }, [fetchCommunicationData]);

  const raciContacts = project.InvolvedContacts || [];

  const handleOpenCreateModal = () => {
    setSelectedPlanForEdit(null);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setSelectedPlanForEdit(plan);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (planData) => {
    try {
      const isEdit = !!planData.id;
      const url = isEdit
        ? `${API_URL}/projects/${project.id_proyecto}/planes-comunicacion/${planData.id}`
        : `${API_URL}/projects/${project.id_proyecto}/planes-comunicacion`;
      const method = isEdit ? 'PUT' : 'POST';

      const authHeaders = getAuthHeaders ? getAuthHeaders() : {};
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(planData)
      });

      if (res.ok) {
        await fetchCommunicationData();
      }
    } catch (err) {
      console.error('Error guardando plan de comunicación:', err);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm(t('projectDetail.communicationTab.deleteConfirm', '¿Deseas eliminar este plan de comunicación?'))) return;
    try {
      const authHeaders = getAuthHeaders ? getAuthHeaders() : {};
      const res = await fetch(`${API_URL}/projects/${project.id_proyecto}/planes-comunicacion/${planId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        await fetchCommunicationData();
      }
    } catch (err) {
      console.error('Error eliminando plan:', err);
    }
  };

  const handleOpenEmailModal = (plan) => {
    setEmailModalData({
      isOpen: true,
      committeeTitle: plan.titulo,
      contacts: plan.Contactos || [],
      planId: plan.id
    });
  };

  const getLastSendLog = (planId) => {
    return logs.find(l => l.id_plan_comunicacion === planId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={20} color="var(--md-sys-color-primary)" /> {t('projectDetail.communicationTab.title', 'Gobernanza y Planes de Comunicación')}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginTop: 4 }}>
            {t('projectDetail.communicationTab.subtitle', 'Planes dinámicos configurados para reportes de avance y seguimiento relacional con contactos RACI.')}
          </p>
        </div>
        <button
          className="m3-btn m3-btn-primary"
          onClick={handleOpenCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> {t('projectDetail.communicationTab.newPlan', 'Nuevo Plan de Comunicación')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {plans.map((p) => {
          const lastLog = getLastSendLog(p.id);
          const localeCode = i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-PT' : 'es-ES';
          const lastSendDate = lastLog?.fecha_envio
            ? new Date(lastLog.fecha_envio).toLocaleDateString(localeCode)
            : null;

          const freqLabel = p.periodicidad === 'SEMANAL'
            ? t('projectDetail.communicationTab.weekly', { interval: p.intervalo, defaultValue: `Semanal (cada ${p.intervalo} sem)` })
            : t('projectDetail.communicationTab.monthly', { interval: p.intervalo, defaultValue: `Mensual (cada ${p.intervalo} mes)` });

          return (
            <div
              key={p.id}
              className="m3-card glass-panel"
              style={{
                opacity: p.activo ? 1 : 0.55,
                border: p.activo ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.titulo}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`badge ${p.activo ? 'badge-green' : 'badge-red'}`}>
                      {p.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                    <button className="icon-btn" onClick={() => handleOpenEditModal(p)} title={t('common.edit', 'Editar Plan')} style={{ padding: 4 }}>
                      <Edit2 size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => handleDeletePlan(p.id)} title={t('common.delete', 'Eliminar Plan')} style={{ padding: 4, color: 'var(--color-rag-red)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--md-sys-color-primary)', fontWeight: 600, marginBottom: 8 }}>
                  <Clock size={13} /> {freqLabel}
                </div>

                <p style={{ fontSize: '0.83rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 14, minHeight: '36px' }}>
                  {p.finalidad || t('projectDetail.communicationTab.noPurpose', 'Sin finalidad especificada.')}
                </p>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--md-sys-color-outline)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={13} /> {t('projectDetail.communicationTab.participants', { count: p.Contactos?.length || 0, defaultValue: `Participantes (${p.Contactos?.length || 0})` })}
                  </div>
                  {(!p.Contactos || p.Contactos.length === 0) ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-outline)', fontStyle: 'italic' }}>
                      {t('projectDetail.communicationTab.noParticipants', 'Sin participantes asignados.')}
                    </span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {p.Contactos.map(c => (
                        <span key={c.id_contacto} className="badge" style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', fontSize: '0.75rem' }}>
                          {c.nombre} {c.apellidos}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} />
                  {lastSendDate ? t('projectDetail.communicationTab.lastSend', { date: lastSendDate, defaultValue: `Último envío: ${lastSendDate}` }) : t('projectDetail.communicationTab.noSends', 'Sin envíos registrados')}
                </div>
                <button
                  className="m3-btn m3-btn-outline"
                  onClick={() => handleOpenEmailModal(p)}
                  disabled={!p.activo}
                  style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Mail size={13} /> {t('projectDetail.communicationTab.sendReport', 'Enviar Informe')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <CommunicationAuditHistory logs={logs} loading={loading} />

      <CommunicationPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        plan={selectedPlanForEdit}
        raciContacts={raciContacts}
        onSave={handleSavePlan}
      />

      <EmailReportModal
        isOpen={emailModalData.isOpen}
        onClose={() => setEmailModalData({ isOpen: false, committeeTitle: '', contacts: [], planId: null })}
        project={project}
        committeeTitle={emailModalData.committeeTitle}
        contacts={emailModalData.contacts}
        planId={emailModalData.planId}
        getAuthHeaders={getAuthHeaders}
        onLogSent={fetchCommunicationData}
      />
    </div>
  );
}
