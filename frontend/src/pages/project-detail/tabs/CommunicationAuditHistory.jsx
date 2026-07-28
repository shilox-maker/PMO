import React from 'react';
import { History, Mail, Calendar, User, CheckCircle2 } from 'lucide-react';

export default function CommunicationAuditHistory({ logs = [], loading = false }) {
  if (loading) {
    return (
      <div style={{ padding: 16, textAlign: 'center', opacity: 0.7, fontSize: '0.9rem' }}>
        Cargando historial de envíos de auditoría...
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="m3-card glass-panel" style={{ padding: 20, textAlign: 'center', opacity: 0.7 }}>
        <History size={24} style={{ marginBottom: 6 }} color="var(--md-sys-color-outline)" />
        <p style={{ fontSize: '0.85rem', margin: 0 }}>No hay registros de envíos de informe para este proyecto.</p>
      </div>
    );
  }

  return (
    <div className="m3-card glass-panel" style={{ padding: 20 }}>
      <h4 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <History size={18} color="var(--md-sys-color-primary)" /> Historial de Auditoría de Envíos y Cumplimiento
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '280px', overflowY: 'auto' }}>
        {logs.map((log) => {
          const dateStr = log.fecha_envio ? new Date(log.fecha_envio).toLocaleString('es-ES', {
            dateStyle: 'medium',
            timeStyle: 'short'
          }) : 'Sin fecha';

          const planName = log.PlanComunicacion?.titulo || 'Informe General';
          const userName = log.Usuario ? `${log.Usuario.nombre} ${log.Usuario.apellidos}` : 'PM / Sistema';

          return (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                border: '1px solid var(--md-sys-color-outline-variant)'
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ padding: 6, borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', marginTop: 2 }}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{planName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-outline)', display: 'flex', gap: 12, marginTop: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> {dateStr}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} /> {userName}
                    </span>
                  </div>
                  {log.destinatarios && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={12} /> Destinatarios: {log.destinatarios}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
