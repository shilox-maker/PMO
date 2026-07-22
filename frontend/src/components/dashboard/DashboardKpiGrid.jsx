import React from 'react';
import { AlertOctagon, Coins, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function DashboardKpiGrid({
  overrunCount,
  overrunExtendedCount,
  delayedPartialCount,
  delayedBaseCount,
  delayedExtendedCount,
  nonGovernedCount,
  inactiveCount,
  ragVerde,
  ragAmarillo,
  ragRojo,
  selectedKpi,
  setSelectedKpi
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 8, marginBottom: 24 }}>
      {/* 1. Overrun */}
      <div 
        className="m3-card metric-card glass-panel" 
        onClick={() => setSelectedKpi(selectedKpi === 'overrun' ? null : 'overrun')}
        style={{ 
          cursor: 'pointer', 
          border: selectedKpi === 'overrun' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
          padding: '10px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0
        }}
        title="Suma de facturas recibidas y pendientes de recibir es mayor que el CAPEX inicial aprobado"
      >
        <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
          <AlertOctagon size={16} />
        </div>
        <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span className="metric-value" style={{ color: 'var(--color-rag-red)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{overrunCount}</span>
          <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Exc. coste (CAPEX)</span>
        </div>
      </div>

      {/* 2. Overrun Extended */}
      <div 
        className="m3-card metric-card glass-panel" 
        onClick={() => setSelectedKpi(selectedKpi === 'overrun_extended' ? null : 'overrun_extended')}
        style={{ 
          cursor: 'pointer', 
          border: selectedKpi === 'overrun_extended' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
          padding: '10px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0
        }}
        title="Suma de facturas recibidas y pendientes de recibir es mayor que el CAPEX inicial más los cambios de alcance aprobados"
      >
        <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
          <Coins size={16} />
        </div>
        <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span className="metric-value" style={{ color: 'var(--priority-alta)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{overrunExtendedCount}</span>
          <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Exc. coste ampliado</span>
        </div>
      </div>

      {/* 3. Delayed Partial */}
      <div 
        className="m3-card metric-card glass-panel" 
        onClick={() => setSelectedKpi(selectedKpi === 'delayed_partial' ? null : 'delayed_partial')}
        style={{ 
          cursor: 'pointer', 
          border: selectedKpi === 'delayed_partial' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
          padding: '10px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0
        }}
        title="Proyectos no cerrados con al menos un hito (fecha de control) pendiente y cuya fecha límite ha expirado"
      >
        <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
          <Clock size={16} />
        </div>
        <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span className="metric-value" style={{ color: 'var(--priority-alta)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{delayedPartialCount}</span>
          <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Retrasados (Hitos)</span>
        </div>
      </div>

      {/* 4. Delayed Base */}
      <div 
        className="m3-card metric-card glass-panel" 
        onClick={() => setSelectedKpi(selectedKpi === 'delayed_base' ? null : 'delayed_base')}
        style={{ 
          cursor: 'pointer', 
          border: selectedKpi === 'delayed_base' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
          padding: '10px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0
        }}
        title="Proyectos no cerrados cuya fecha fin original planificada (Base) es anterior a hoy"
      >
        <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
          <AlertTriangle size={16} />
        </div>
        <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span className="metric-value" style={{ color: 'var(--color-rag-red)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{delayedBaseCount}</span>
          <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Retrasados (Base)</span>
        </div>
      </div>

      {/* 5. Delayed Extended */}
      <div 
        className="m3-card metric-card glass-panel" 
        onClick={() => setSelectedKpi(selectedKpi === 'delayed_extended' ? null : 'delayed_extended')}
        style={{ 
          cursor: 'pointer', 
          border: selectedKpi === 'delayed_extended' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
          padding: '10px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0
        }}
        title="Proyectos no cerrados cuya fecha fin estimada es anterior a hoy"
      >
        <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
          <AlertTriangle size={16} />
        </div>
        <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span className="metric-value" style={{ color: 'var(--color-rag-red)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{delayedExtendedCount}</span>
          <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Retrasados (Ampliada)</span>
        </div>
      </div>

      {/* 6. Governance */}
      <div 
        className="m3-card metric-card glass-panel"
        onClick={() => setSelectedKpi(selectedKpi === 'governance' ? null : 'governance')}
        style={{ 
          cursor: 'pointer', 
          border: selectedKpi === 'governance' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
          padding: '10px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0
        }}
        title="Proyectos que no tienen ningún plan de comunicación activo"
      >
        <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
          <ShieldAlert size={16} />
        </div>
        <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span className="metric-value" style={{ color: 'var(--color-rag-red)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{nonGovernedCount}</span>
          <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Sin Gobernanza</span>
        </div>
      </div>

      {/* 7. Inactive */}
      <div 
        className="m3-card metric-card glass-panel"
        onClick={() => setSelectedKpi(selectedKpi === 'inactive' ? null : 'inactive')}
        style={{ 
          cursor: 'pointer', 
          border: selectedKpi === 'inactive' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
          padding: '10px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0
        }}
        title="Proyectos sin modificaciones en los últimos 30 días"
      >
        <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
          <Clock size={16} />
        </div>
        <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span className="metric-value" style={{ color: 'var(--priority-alta)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{inactiveCount}</span>
          <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Proyectos Inactivos</span>
        </div>
      </div>

      {/* 8. RAG Split */}
      <div 
        className="m3-card metric-card glass-panel" 
        style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}
        title="Distribución RAG (Verde, Amarillo, Rojo)"
      >
        <div style={{ display: 'flex', gap: 6, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <div 
            style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: '4px 2px', backgroundColor: selectedKpi === 'rag_verde' ? 'rgba(52, 199, 89, 0.15)' : 'transparent' }}
            onClick={() => setSelectedKpi(selectedKpi === 'rag_verde' ? null : 'rag_verde')}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-rag-green)', lineHeight: 1 }}>{ragVerde}</div>
          </div>
          <div style={{ width: 1, height: '16px', backgroundColor: 'var(--md-sys-color-outline-variant)' }}></div>
          <div 
            style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: '4px 2px', backgroundColor: selectedKpi === 'rag_amarillo' ? 'rgba(255, 159, 10, 0.15)' : 'transparent' }}
            onClick={() => setSelectedKpi(selectedKpi === 'rag_amarillo' ? null : 'rag_amarillo')}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-rag-yellow)', lineHeight: 1 }}>{ragAmarillo}</div>
          </div>
          <div style={{ width: 1, height: '16px', backgroundColor: 'var(--md-sys-color-outline-variant)' }}></div>
          <div 
            style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: '4px 2px', backgroundColor: selectedKpi === 'rag_rojo' ? 'rgba(255, 69, 58, 0.15)' : 'transparent' }}
            onClick={() => setSelectedKpi(selectedKpi === 'rag_rojo' ? null : 'rag_rojo')}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-rag-red)', lineHeight: 1 }}>{ragRojo}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
