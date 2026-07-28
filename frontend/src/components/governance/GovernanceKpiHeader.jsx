import React from 'react';
import { AlertOctagon, Coins, Clock, TrendingUp, ShieldOff, CalendarX } from 'lucide-react';

export default function GovernanceKpiHeader({
  overrunCount = 0,
  overrunExtendedCount = 0,
  delayedBaseCount = 0,
  delayedExtendedCount = 0,
  nonGovernedCount = 0,
  scopeVolatilityPercent = 0,
  volatilityCount = 0,
  activeKpiFilter,
  setActiveKpiFilter
}) {
  const kpis = [
    {
      id: 'scope_volatility',
      title: 'Volatilidad Alcance',
      value: `+${scopeVolatilityPercent}%`,
      subtitle: `${volatilityCount} proy. con CRs`,
      icon: <TrendingUp size={22} />,
      color: '#32ade6',
      bgColor: 'rgba(50, 173, 230, 0.15)',
      tooltip: 'Porcentaje de variación presupuestaria introducida por Cambios de Alcance (CRs) aprobados frente a la línea base inicial.'
    },
    {
      id: 'overrun',
      title: 'Exc. coste (CAPEX Inicial)',
      value: overrunCount,
      subtitle: 'Proyectos > Pres. Inicial',
      icon: <AlertOctagon size={22} />,
      color: 'var(--color-rag-red)',
      bgColor: 'rgba(255, 69, 58, 0.15)',
      tooltip: 'Proyectos cuyo gasto real supera la línea base de presupuesto inicial autorizada.'
    },
    {
      id: 'overrun_extended',
      title: 'Exc. coste (CAPEX Ampliado)',
      value: overrunExtendedCount,
      subtitle: 'Proyectos > Pres. Ampliado',
      icon: <Coins size={22} />,
      color: '#ff9f0a',
      bgColor: 'rgba(255, 159, 10, 0.15)',
      tooltip: 'Proyectos cuyo gasto real supera el presupuesto ampliado aprobado tras Cambios de Alcance.'
    },
    {
      id: 'delayed_base',
      title: 'Retrasados (L.Base Original)',
      value: delayedBaseCount,
      subtitle: 'Exceden Fin Inicial',
      icon: <Clock size={22} />,
      color: '#ff453a',
      bgColor: 'rgba(255, 69, 58, 0.15)',
      tooltip: 'Proyectos que han excedido la fecha de finalización originalmente planificada.'
    },
    {
      id: 'delayed_extended',
      title: 'Retrasados (L.Base Ampliada)',
      value: delayedExtendedCount,
      subtitle: 'Exceden Fin Ampliada',
      icon: <CalendarX size={22} />,
      color: '#ac5dd9',
      bgColor: 'rgba(172, 93, 217, 0.15)',
      tooltip: 'Proyectos que han superado la fecha de finalización extendida aprobada por Cambios de Alcance.'
    },
    {
      id: 'non_governed',
      title: 'Sin Gobernanza',
      value: nonGovernedCount,
      subtitle: 'Sin plan ni comités',
      icon: <ShieldOff size={22} />,
      color: '#ff3b30',
      bgColor: 'rgba(255, 59, 48, 0.15)',
      tooltip: 'Proyectos activos que carecen de plan de comunicación o canales de gobernanza configurados.'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: 14,
      marginBottom: 20
    }}>
      {kpis.map(kpi => {
        const isSelected = activeKpiFilter === kpi.id;
        return (
          <div
            key={kpi.id}
            className="m3-card metric-card glass-panel"
            onClick={() => setActiveKpiFilter(isSelected ? null : kpi.id)}
            title={kpi.tooltip}
            style={{
              cursor: 'pointer',
              border: isSelected ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: isSelected ? 'var(--md-sys-color-surface-container-high)' : undefined,
              padding: '14px 16px',
              borderRadius: 12,
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.15)' : undefined
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                className="metric-icon-wrapper"
                style={{
                  backgroundColor: kpi.bgColor,
                  color: kpi.color,
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {kpi.icon}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div className="metric-value" style={{ color: kpi.color, fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1 }}>
                  {kpi.value}
                </div>
                <div className="metric-label" style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {kpi.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-outline)', marginTop: 1 }}>
                  {kpi.subtitle}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

