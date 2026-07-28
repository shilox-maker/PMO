import React from 'react';
import { Clock, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function DashboardKpiGrid({
  delayedPartialCount = 0,
  inactiveCount = 0,
  ragVerde = 0,
  ragAmarillo = 0,
  ragRojo = 0,
  selectedKpi,
  setSelectedKpi
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
      {/* 1. Retrasados (Hitos) */}
      <div 
        className="m3-card metric-card glass-panel" 
        onClick={() => setSelectedKpi(selectedKpi === 'delayed_partial' ? null : 'delayed_partial')}
        style={{ 
          cursor: 'pointer', 
          border: selectedKpi === 'delayed_partial' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 0
        }}
        title="Proyectos no cerrados con al menos un hito vencido pendiente de cierre"
      >
        <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)', width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={20} />
        </div>
        <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span className="metric-value" style={{ color: 'var(--priority-alta)', fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.1 }}>{delayedPartialCount}</span>
          <span className="metric-label" style={{ fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.1, color: 'var(--md-sys-color-on-surface)' }}>Retrasados (Hitos)</span>
        </div>
      </div>

      {/* 3. Proyectos Inactivos */}
      <div 
        className="m3-card metric-card glass-panel"
        onClick={() => setSelectedKpi(selectedKpi === 'inactive' ? null : 'inactive')}
        style={{ 
          cursor: 'pointer', 
          border: selectedKpi === 'inactive' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 0
        }}
        title="Proyectos desactualizados (más de 14 días sin registros)"
      >
        <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 149, 0, 0.2)', color: '#ff9500', width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={20} />
        </div>
        <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span className="metric-value" style={{ color: '#ff9500', fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.1 }}>{inactiveCount}</span>
          <span className="metric-label" style={{ fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.1, color: 'var(--md-sys-color-on-surface)' }}>Proyectos Inactivos</span>
        </div>
      </div>

      {/* 4. RAG Breakdown */}
      <div 
        className="m3-card metric-card glass-panel" 
        style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, border: '1px solid var(--md-sys-color-outline-variant)' }}
        title="Distribución RAG de la cartera (Verde, Amarillo, Rojo)"
      >
        <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <div 
            style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: '4px', backgroundColor: selectedKpi === 'rag_verde' ? 'rgba(52, 199, 89, 0.2)' : 'transparent' }}
            onClick={() => setSelectedKpi(selectedKpi === 'rag_verde' ? null : 'rag_verde')}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-rag-green)', lineHeight: 1 }}>{ragVerde}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--md-sys-color-outline)', fontWeight: 600, marginTop: 2 }}>VERDE</div>
          </div>
          <div style={{ width: 1, height: '24px', backgroundColor: 'var(--md-sys-color-outline-variant)' }}></div>
          <div 
            style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: '4px', backgroundColor: selectedKpi === 'rag_amarillo' ? 'rgba(255, 159, 10, 0.2)' : 'transparent' }}
            onClick={() => setSelectedKpi(selectedKpi === 'rag_amarillo' ? null : 'rag_amarillo')}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-rag-yellow)', lineHeight: 1 }}>{ragAmarillo}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--md-sys-color-outline)', fontWeight: 600, marginTop: 2 }}>AMARILLO</div>
          </div>
          <div style={{ width: 1, height: '24px', backgroundColor: 'var(--md-sys-color-outline-variant)' }}></div>
          <div 
            style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: '4px', backgroundColor: selectedKpi === 'rag_rojo' ? 'rgba(255, 69, 58, 0.2)' : 'transparent' }}
            onClick={() => setSelectedKpi(selectedKpi === 'rag_rojo' ? null : 'rag_rojo')}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-rag-red)', lineHeight: 1 }}>{ragRojo}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--md-sys-color-outline)', fontWeight: 600, marginTop: 2 }}>ROJO</div>
          </div>
        </div>
      </div>
    </div>
  );
}
