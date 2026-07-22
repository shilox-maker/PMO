import React from 'react';
import { Eye } from 'lucide-react';

export default function GovernanceCommitteesSection({ projects, onViewProject }) {
  const weeklyProjects = projects.filter(p => p.com_semanal_activo);
  const monthlyProjects = projects.filter(p => p.com_mensual_activo);
  const steerCoProjects = projects.filter(p => p.com_steerco_activo);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24, marginBottom: 24 }}>
      {/* Comité Semanal */}
      <div className="m3-card glass-panel" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📅 Comités Semanales</span>
          <span className="badge" style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>{weeklyProjects.length}</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {weeklyProjects.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontStyle: 'italic' }}>Sin proyectos asignados.</p>
          ) : weeklyProjects.map(p => (
            <div key={p.id_proyecto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--md-sys-color-surface-container)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.nombre_proyecto}</span>
              <button className="icon-btn" onClick={() => onViewProject(p.id_proyecto)}><Eye size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Comité Mensual */}
      <div className="m3-card glass-panel" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📆 Comités Mensuales</span>
          <span className="badge" style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>{monthlyProjects.length}</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {monthlyProjects.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontStyle: 'italic' }}>Sin proyectos asignados.</p>
          ) : monthlyProjects.map(p => (
            <div key={p.id_proyecto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--md-sys-color-surface-container)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.nombre_proyecto}</span>
              <button className="icon-btn" onClick={() => onViewProject(p.id_proyecto)}><Eye size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* SteerCo */}
      <div className="m3-card glass-panel" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🏛️ Steering Committees</span>
          <span className="badge" style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>{steerCoProjects.length}</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {steerCoProjects.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontStyle: 'italic' }}>Sin proyectos asignados.</p>
          ) : steerCoProjects.map(p => (
            <div key={p.id_proyecto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--md-sys-color-surface-container)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.nombre_proyecto}</span>
              <button className="icon-btn" onClick={() => onViewProject(p.id_proyecto)}><Eye size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
