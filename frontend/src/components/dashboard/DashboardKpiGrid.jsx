import React from 'react';
import { Clock, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function TrendPill({ trendData, timeframe = 7 }) {
  if (!trendData || trendData.delta === undefined || trendData.delta === 0) return null;
  const { delta, isPositive, direction, previous, current } = trendData;

  let Icon = Minus;
  let color = 'var(--md-sys-color-outline)';
  let bgColor = 'rgba(255,255,255,0.06)';

  if (direction === 'up') {
    Icon = TrendingUp;
    color = isPositive ? '#34c759' : '#ff3547';
    bgColor = isPositive ? 'rgba(52,199,89,0.15)' : 'rgba(255,53,71,0.15)';
  } else if (direction === 'down') {
    Icon = TrendingDown;
    color = isPositive ? '#34c759' : '#ff3547';
    bgColor = isPositive ? 'rgba(52,199,89,0.15)' : 'rgba(255,53,71,0.15)';
  }

  const sign = delta > 0 ? '+' : '';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 2,
        padding: '1px 5px', borderRadius: 10,
        fontSize: '0.65rem', fontWeight: 700,
        color, backgroundColor: bgColor,
        border: `1px solid ${color}44`, flexShrink: 0
      }}
      title={`Hace ${timeframe} días: ${previous} → Hoy: ${current} (${sign}${delta})`}
    >
      <Icon size={10} />{sign}{delta}
    </span>
  );
}

function VDivider() {
  return <div style={{ width: 1, alignSelf: 'stretch', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '4px 0' }} />;
}

function KpiSegment({ id, icon, color, bgColor, value, label, trendData, timeframe, isSelected, onClick, title }) {
  return (
    <div
      onClick={onClick}
      title={title}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
        backgroundColor: isSelected ? bgColor : 'transparent',
        outline: isSelected ? `1.5px solid ${color}` : '1.5px solid transparent',
        transition: 'all 0.15s ease', minWidth: 0
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        backgroundColor: bgColor, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.45rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
          <TrendPill trendData={trendData} timeframe={timeframe} />
        </div>
        <div style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function RagSegment({ id, dot, color, bgColor, value, label, trendData, timeframe, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '6px 8px', borderRadius: 8,
        cursor: 'pointer', gap: 3,
        backgroundColor: isSelected ? bgColor : 'transparent',
        outline: isSelected ? `1.5px solid ${color}` : '1.5px solid transparent',
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: '1.35rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
        <TrendPill trendData={trendData} timeframe={timeframe} />
      </div>
      <div style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--md-sys-color-outline)', letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  );
}

export default function DashboardKpiGrid({
  delayedPartialCount = 0, inactiveCount = 0,
  ragVerde = 0, ragAmarillo = 0, ragRojo = 0,
  selectedKpi, setSelectedKpi,
  trends = {}, timeframe = 7, setTimeframe,
  customDate = null, setCustomDate
}) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>

      {/* Timeframe selector */}
      {setTimeframe && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
          <span style={{ fontWeight: 600 }}>Comparar variación:</span>
          {[7, 30, 180].map(days => {
            const isActive = customDate === null && timeframe === days;
            return (
              <button key={days} type="button" className="m3-button-text"
                onClick={() => { setTimeframe(days); if (setCustomDate) setCustomDate(null); }}
                style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', border: 'none', cursor: 'pointer', fontWeight: isActive ? 700 : 500, backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent', color: isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)' }}
              >{days} Días</button>
            );
          })}
          {setCustomDate && (
            <>
              <button type="button" className="m3-button-text"
                onClick={() => { if (setCustomDate) setCustomDate(customDate || today); }}
                style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', border: 'none', cursor: 'pointer', fontWeight: customDate !== null ? 700 : 500, backgroundColor: customDate !== null ? 'rgba(255,255,255,0.12)' : 'transparent', color: customDate !== null ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)' }}
              >📅 Personalizado</button>
              {customDate !== null && (
                <input type="date" value={customDate} max={today}
                  onChange={e => { if (setCustomDate) setCustomDate(e.target.value); }}
                  style={{ background: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-primary)', borderRadius: 6, color: 'var(--md-sys-color-on-surface)', fontSize: '0.72rem', padding: '2px 6px', cursor: 'pointer', colorScheme: 'dark' }}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* KPI Bar – all in one row */}
      <div className="m3-card glass-panel" style={{ display: 'flex', alignItems: 'stretch', padding: '6px', gap: 4, borderRadius: 12 }}>

        <KpiSegment id="delayed_partial" isSelected={selectedKpi === 'delayed_partial'}
          onClick={() => setSelectedKpi(selectedKpi === 'delayed_partial' ? null : 'delayed_partial')}
          icon={<Clock size={18} />} color="var(--priority-alta)" bgColor="rgba(255,159,10,0.15)"
          value={delayedPartialCount} label="Retrasados (Hitos)"
          trendData={trends.delayed_partial} timeframe={timeframe}
          title="Proyectos no cerrados con al menos un hito vencido pendiente"
        />

        <VDivider />

        <KpiSegment id="inactive" isSelected={selectedKpi === 'inactive'}
          onClick={() => setSelectedKpi(selectedKpi === 'inactive' ? null : 'inactive')}
          icon={<AlertTriangle size={18} />} color="#ff9500" bgColor="rgba(255,149,0,0.15)"
          value={inactiveCount} label="Inactivos (+14 días)"
          trendData={trends.inactive} timeframe={timeframe}
          title="Proyectos sin actualizar en más de 14 días"
        />

        <VDivider />

        {/* RAG block */}
        <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <div style={{ padding: '0 8px 0 4px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--md-sys-color-outline)', letterSpacing: '0.08em', textTransform: 'uppercase', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>RAG</span>
          </div>
          <RagSegment id="rag_verde" isSelected={selectedKpi === 'rag_verde'}
            onClick={() => setSelectedKpi(selectedKpi === 'rag_verde' ? null : 'rag_verde')}
            color="var(--color-rag-green, #34c759)" bgColor="rgba(52,199,89,0.15)"
            value={ragVerde} label="VERDE" trendData={trends.rag_verde} timeframe={timeframe}
          />
          <RagSegment id="rag_amarillo" isSelected={selectedKpi === 'rag_amarillo'}
            onClick={() => setSelectedKpi(selectedKpi === 'rag_amarillo' ? null : 'rag_amarillo')}
            color="var(--color-rag-yellow, #ffd60a)" bgColor="rgba(255,214,10,0.15)"
            value={ragAmarillo} label="AMARILLO" trendData={trends.rag_amarillo} timeframe={timeframe}
          />
          <RagSegment id="rag_rojo" isSelected={selectedKpi === 'rag_rojo'}
            onClick={() => setSelectedKpi(selectedKpi === 'rag_rojo' ? null : 'rag_rojo')}
            color="var(--color-rag-red, #ff3b30)" bgColor="rgba(255,59,48,0.15)"
            value={ragRojo} label="ROJO" trendData={trends.rag_rojo} timeframe={timeframe}
          />
        </div>

      </div>
    </div>
  );
}
