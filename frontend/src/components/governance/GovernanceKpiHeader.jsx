import React from 'react';
import { AlertOctagon, Coins, Clock, TrendingUp, TrendingDown, Minus, ShieldOff, CalendarX } from 'lucide-react';

function TrendPill({ trendData, timeframe = 7 }) {
  if (!trendData || trendData.delta === undefined) return null;
  const { delta, isPositive, direction, previous, current } = trendData;
  
  let Icon = Minus;
  let color = 'var(--md-sys-color-outline)';
  let bgColor = 'rgba(255,255,255,0.06)';

  if (direction === 'up') {
    Icon = TrendingUp;
    color = isPositive ? 'var(--color-rag-green, #34c759)' : 'var(--color-rag-red, #ff3547)';
    bgColor = isPositive ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 53, 71, 0.15)';
  } else if (direction === 'down') {
    Icon = TrendingDown;
    color = isPositive ? 'var(--color-rag-green, #34c759)' : 'var(--color-rag-red, #ff3547)';
    bgColor = isPositive ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 53, 71, 0.15)';
  }

  const sign = delta > 0 ? '+' : '';
  const text = `${sign}${delta}`;

  return (
    <span 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 7px',
        borderRadius: 12,
        fontSize: '0.68rem',
        fontWeight: 700,
        color,
        backgroundColor: bgColor,
        border: `1px solid ${color}33`,
        flexShrink: 0
      }}
      title={`Hace ${timeframe} días: ${previous} → Hoy: ${current} (Diferencia: ${sign}${delta})`}
    >
      <Icon size={12} />
      {text}
    </span>
  );
}

export default function GovernanceKpiHeader({
  overrunCount = 0,
  overrunExtendedCount = 0,
  delayedBaseCount = 0,
  delayedExtendedCount = 0,
  nonGovernedCount = 0,
  scopeVolatilityPercent = 0,
  volatilityCount = 0,
  activeKpiFilter,
  setActiveKpiFilter,
  trends = {},
  timeframe = 7,
  setTimeframe,
  customDate = null,
  setCustomDate
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
      trend: trends.scope_volatility,
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
      trend: trends.overrun,
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
      trend: trends.overrun_extended,
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
      trend: trends.delayed_base,
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
      trend: trends.delayed_extended,
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
      trend: trends.non_governed,
      tooltip: 'Proyectos activos que carecen de plan de comunicación o canales de gobernanza configurados.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
      {setTimeframe && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
          <span style={{ fontWeight: 600 }}>Comparar variación:</span>
          {[7, 30, 180].map(days => {
            const isActive = customDate === null && timeframe === days;
            return (
              <button
                key={days}
                type="button"
                onClick={() => { setTimeframe(days); if (setCustomDate) setCustomDate(null); }}
                className="m3-button-text"
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {days} Días
              </button>
            );
          })}
          {setCustomDate && (
            <>
              <button
                type="button"
                className="m3-button-text"
                onClick={() => { if (setCustomDate) setCustomDate(customDate || new Date().toISOString().split('T')[0]); }}
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  fontWeight: customDate !== null ? 700 : 500,
                  backgroundColor: customDate !== null ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: customDate !== null ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                📅 Personalizado
              </button>
              {customDate !== null && (
                <input
                  type="date"
                  value={customDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => { if (setCustomDate) setCustomDate(e.target.value); }}
                  style={{
                    background: 'var(--md-sys-color-surface-container)',
                    border: '1px solid var(--md-sys-color-primary)',
                    borderRadius: 6,
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: '0.72rem',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    colorScheme: 'dark'
                  }}
                />
              )}
            </>
          )}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 14
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
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="metric-value" style={{ color: kpi.color, fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1 }}>
                      {kpi.value}
                    </span>
                    <TrendPill trendData={kpi.trend} timeframe={timeframe} />
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
    </div>
  );
}
