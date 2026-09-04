import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Sparkles, CheckSquare, Square, MinusSquare } from 'lucide-react';

const MACRO_ETAPAS_CONFIG = [
  { key: 'INICIATIVA', icon: '💡', defaultColor: '#6366f1', bgHover: 'rgba(99, 102, 241, 0.08)' },
  { key: 'PLANIFICACION', icon: '📅', defaultColor: '#0ea5e9', bgHover: 'rgba(14, 165, 233, 0.08)' },
  { key: 'EJECUCION', icon: '🛠️', defaultColor: '#10b981', bgHover: 'rgba(16, 185, 129, 0.08)' },
  { key: 'PAUSA', icon: '⏸️', defaultColor: '#f59e0b', bgHover: 'rgba(245, 158, 11, 0.08)' },
  { key: 'CIERRE', icon: '🏁', defaultColor: '#64748b', bgHover: 'rgba(100, 116, 139, 0.08)' }
];

export default function MacroEtapasFilter({
  effectiveStates = [],
  filterStates = [],
  setFilterStates,
  projects = []
}) {
  const { t } = useTranslation();
  const [expandedMacro, setExpandedMacro] = useState(null);

  // Agrupar los estados efectivos por Macro-Etapa
  const groupedStates = useMemo(() => {
    const groups = {
      INICIATIVA: [],
      PLANIFICACION: [],
      EJECUCION: [],
      PAUSA: [],
      CIERRE: []
    };

    effectiveStates.forEach(st => {
      const macro = (st.macro_etapa || (st.proyecto_cerrado ? 'CIERRE' : 'EJECUCION')).toUpperCase();
      if (groups[macro]) {
        groups[macro].push(st);
      } else {
        groups.EJECUCION.push(st);
      }
    });

    return groups;
  }, [effectiveStates]);

  // Contadores de proyectos por estado y por macro-etapa
  const counts = useMemo(() => {
    const stateCounts = {};
    const macroCounts = { INICIATIVA: 0, PLANIFICACION: 0, EJECUCION: 0, PAUSA: 0, CIERRE: 0 };

    projects.forEach(p => {
      const stateName = p.Estado?.nombre_estado;
      if (stateName) {
        stateCounts[stateName] = (stateCounts[stateName] || 0) + 1;
        const macro = (p.Estado?.macro_etapa || (p.Estado?.proyecto_cerrado ? 'CIERRE' : 'EJECUCION')).toUpperCase();
        if (macroCounts[macro] !== undefined) {
          macroCounts[macro] += 1;
        }
      }
    });

    return { stateCounts, macroCounts };
  }, [projects]);

  const toggleMacroSelection = (macroKey) => {
    const macroStates = groupedStates[macroKey].map(s => s.nombre_estado);
    if (macroStates.length === 0) return;

    const currentSelected = Array.isArray(filterStates) ? filterStates : [];
    const allSelected = macroStates.every(s => currentSelected.includes(s));

    if (allSelected) {
      setFilterStates(currentSelected.filter(s => !macroStates.includes(s)));
    } else {
      const toAdd = macroStates.filter(s => !currentSelected.includes(s));
      setFilterStates([...currentSelected, ...toAdd]);
    }
  };

  const toggleStateSelection = (stateName) => {
    const current = Array.isArray(filterStates) ? filterStates : [];
    if (current.includes(stateName)) {
      setFilterStates(current.filter(s => s !== stateName));
    } else {
      setFilterStates([...current, stateName]);
    }
  };

  // Presets
  const applyPresetActive = () => {
    const activeMacroStates = [
      ...groupedStates.INICIATIVA,
      ...groupedStates.PLANIFICACION,
      ...groupedStates.EJECUCION
    ].map(s => s.nombre_estado);
    setFilterStates(activeMacroStates);
  };

  const applyPresetExecution = () => {
    const execStates = groupedStates.EJECUCION.map(s => s.nombre_estado);
    setFilterStates(execStates);
  };

  const applyPresetOpen = () => {
    const openStates = effectiveStates.filter(s => !s.proyecto_cerrado).map(s => s.nombre_estado);
    setFilterStates(openStates);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Presets Toolbar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={applyPresetActive}
          className="m3-btn m3-btn-outline"
          style={{ height: '30px', fontSize: '0.78rem', borderRadius: '16px', padding: '0 12px' }}
        >
          🚀 {t('macroEtapas.presetActive', 'Proyectos Activos')}
        </button>
        <button
          type="button"
          onClick={applyPresetExecution}
          className="m3-btn m3-btn-outline"
          style={{ height: '30px', fontSize: '0.78rem', borderRadius: '16px', padding: '0 12px' }}
        >
          🛠️ {t('macroEtapas.presetExecution', 'Solo en Ejecución')}
        </button>
        <button
          type="button"
          onClick={applyPresetOpen}
          className="m3-btn m3-btn-outline"
          style={{ height: '30px', fontSize: '0.78rem', borderRadius: '16px', padding: '0 12px' }}
        >
          📂 {t('macroEtapas.presetOpen', 'Proyectos Abiertos')}
        </button>
        <button
          type="button"
          onClick={() => setFilterStates([])}
          className="m3-btn m3-btn-tonal"
          style={{ height: '30px', fontSize: '0.78rem', borderRadius: '16px', padding: '0 10px', color: 'var(--md-sys-color-outline)' }}
        >
          🧹 {t('macroEtapas.presetClear', 'Limpiar')}
        </button>
      </div>

      {/* 5 Macro-Etapas Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        {MACRO_ETAPAS_CONFIG.map(macro => {
          const statesInMacro = groupedStates[macro.key] || [];
          const stateNames = statesInMacro.map(s => s.nombre_estado);
          const selectedCount = stateNames.filter(name => filterStates.includes(name)).length;
          const isFullySelected = statesInMacro.length > 0 && selectedCount === statesInMacro.length;
          const isPartiallySelected = selectedCount > 0 && !isFullySelected;
          const isExpanded = expandedMacro === macro.key;
          const projectCount = counts.macroCounts[macro.key] || 0;

          return (
            <div
              key={macro.key}
              style={{
                borderRadius: '14px',
                border: isFullySelected
                  ? `2px solid ${macro.defaultColor}`
                  : isPartiallySelected
                  ? `2px dashed ${macro.defaultColor}`
                  : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: isFullySelected
                  ? 'var(--md-sys-color-primary-container)'
                  : isPartiallySelected
                  ? 'var(--md-sys-color-surface-container-high)'
                  : 'var(--md-sys-color-surface-container)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Card Header (Click to toggle whole macro-stage) */}
              <div
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => toggleMacroSelection(macro.key)}
                title={t(`macroEtapas.desc_${macro.key}`, '')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>{macro.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {t(`macroEtapas.${macro.key}`, macro.key)}
                    </div>
                    {isPartiallySelected && (
                      <span style={{ fontSize: '0.7rem', color: macro.defaultColor, fontWeight: 600 }}>
                        ({selectedCount}/{statesInMacro.length})
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      color: 'var(--md-sys-color-on-surface)'
                    }}
                  >
                    {projectCount}
                  </span>
                </div>
              </div>

              {/* Sub-states Drilldown Toggle Header */}
              {statesInMacro.length > 0 && (
                <div
                  style={{
                    borderTop: '1px solid var(--md-sys-color-outline-variant)',
                    padding: '4px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.72rem',
                    color: 'var(--md-sys-color-outline)',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(0,0,0,0.02)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedMacro(isExpanded ? null : macro.key);
                  }}
                >
                  <span>{t('macroEtapas.drilldownStates', { count: statesInMacro.length })}</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              )}

              {/* Expanded States List */}
              {isExpanded && statesInMacro.length > 0 && (
                <div
                  style={{
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                    borderTop: '1px solid var(--md-sys-color-outline-variant)'
                  }}
                >
                  {statesInMacro.map(st => {
                    const stSelected = filterStates.includes(st.nombre_estado);
                    const stCount = counts.stateCounts[st.nombre_estado] || 0;
                    return (
                      <div
                        key={st.id_estado}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStateSelection(st.nombre_estado);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: stSelected ? 'var(--md-sys-color-secondary-container)' : 'transparent',
                          color: stSelected ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface)',
                          fontSize: '0.78rem',
                          fontWeight: stSelected ? 600 : 400
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span>{st.icono || '❓'}</span>
                          <span>{st.nombre_estado}</span>
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem', opacity: 0.8 }}>{stCount}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
