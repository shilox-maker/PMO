import React from 'react';
import { AlertOctagon, Coins, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function GovernanceKpiHeader({
  projects,
  overrunCount,
  capexWarnCount,
  coveragePercent,
  inactiveProjects,
  activeKpiFilter,
  setActiveKpiFilter
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}>
      {/* KPI 1: Overrun */}
      <div 
        className="m3-card metric-card glass-panel" 
        onClick={() => setActiveKpiFilter(activeKpiFilter === 'overrun' ? null : 'overrun')}
        style={{ 
          cursor: 'pointer', 
          border: activeKpiFilter === 'overrun' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
          padding: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)' }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <div className="metric-value" style={{ color: 'var(--color-rag-red)', fontSize: '1.75rem', fontWeight: 800 }}>{overrunCount}</div>
            <div className="metric-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Exc. coste (CAPEX)</div>
          </div>
        </div>
      </div>

      {/* KPI 2: Capex Warning */}
      <div 
        className="m3-card metric-card glass-panel" 
        onClick={() => setActiveKpiFilter(activeKpiFilter === 'capex_warn' ? null : 'capex_warn')}
        style={{ 
          cursor: 'pointer', 
          border: activeKpiFilter === 'capex_warn' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
          padding: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)' }}>
            <Coins size={24} />
          </div>
          <div>
            <div className="metric-value" style={{ color: 'var(--priority-alta)', fontSize: '1.75rem', fontWeight: 800 }}>{capexWarnCount}</div>
            <div className="metric-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Alerta Presupuesto (&gt;90%)</div>
          </div>
        </div>
      </div>

      {/* KPI 3: Governance Compliance */}
      <div className="m3-card metric-card glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(52, 199, 89, 0.2)', color: 'var(--color-rag-green)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="metric-value" style={{ color: 'var(--color-rag-green)', fontSize: '1.75rem', fontWeight: 800 }}>{coveragePercent}%</div>
            <div className="metric-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Cobertura de Gobernanza</div>
          </div>
        </div>
      </div>

      {/* KPI 4: Inactivity Warnings */}
      <div 
        className="m3-card metric-card glass-panel" 
        onClick={() => setActiveKpiFilter(activeKpiFilter === 'inactive' ? null : 'inactive')}
        style={{ 
          cursor: 'pointer', 
          border: activeKpiFilter === 'inactive' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
          padding: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="metric-value" style={{ color: 'var(--priority-alta)', fontSize: '1.75rem', fontWeight: 800 }}>{inactiveProjects.length}</div>
            <div className="metric-label" style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Inactivos (&gt;30 días con plan)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
