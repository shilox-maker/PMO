import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#8dd1e1', '#a4de6c'];

const RAG_COLORS = {
  'VERDE': '#2e7d32',
  'AMARILLO': '#ed6c02',
  'ROJO': '#d32f2f'
};

export default function DashboardChartsSection({
  projects = [],
  statesList = [],
  selectedChartFilter,
  setSelectedChartFilter
}) {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState('estado');

  const chartData = useMemo(() => {
    if (!projects || projects.length === 0) return [];

    const counts = {};
    const stateOrders = {};
    const rawToTranslated = {};

    if (statesList && statesList.length > 0) {
      statesList.forEach((s, idx) => {
        if (s.nombre_estado) {
          stateOrders[s.nombre_estado] = s.orden !== undefined ? s.orden : idx;
        }
      });
    }

    projects.forEach(p => {
      let key = 'Sin datos';
      let translatedName = 'Sin datos';

      if (chartType === 'estado') {
        key = p.estado_proyecto || p.Estado?.nombre_estado || 'Sin Estado';
        const code = p.Estado?.code || key.toUpperCase().replace(/\s+/g, '_');
        translatedName = t(`status.${code}`) !== `status.${code}` ? t(`status.${code}`) : key;
        if (p.Estado?.orden !== undefined && stateOrders[key] === undefined) {
          stateOrders[key] = p.Estado.orden;
        }
      } else if (chartType === 'rag') {
        key = p.indicador_rag || 'Sin RAG';
        translatedName = t(`status.${key}`) !== `status.${key}` ? t(`status.${key}`) : key;
      } else if (chartType === 'pm') {
        key = `${p.PM?.nombre || ''} ${p.PM?.apellidos || ''}`.trim() || 'Sin PM';
        translatedName = key;
      } else if (chartType === 'vendor') {
        key = p.Proveedor?.nombre_razon_social || p.vendor_nombre || 'Sin Partner';
        translatedName = key;
      }

      counts[key] = (counts[key] || 0) + 1;
      rawToTranslated[key] = translatedName;
    });

    const items = Object.keys(counts).map(name => ({
      name,
      displayName: rawToTranslated[name] || name,
      value: counts[name]
    }));

    if (chartType === 'estado') {
      return items.sort((a, b) => {
        const orderA = stateOrders[a.name] !== undefined ? stateOrders[a.name] : 999;
        const orderB = stateOrders[b.name] !== undefined ? stateOrders[b.name] : 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    }

    return items.sort((a, b) => b.value - a.value);
  }, [projects, statesList, chartType, t]);

  const handleBarClick = (entry) => {
    if (!entry || !entry.name) return;
    const filterType = chartType === 'estado' ? 'state' : chartType;
    setSelectedChartFilter(prev => {
      if (prev && prev.type === filterType && prev.value === entry.name) {
        return null;
      }
      return { type: filterType, value: entry.name };
    });
  };

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
          {t('dashboards.projectDistribution')}
        </span>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="user-select"
          style={{ width: 'auto', minWidth: '240px', height: '36px', fontSize: '0.85rem' }}
        >
          <option value="estado">{t('dashboards.chartByState')}</option>
          <option value="rag">{t('dashboards.chartByRag')}</option>
          <option value="pm">{t('dashboards.chartByPm')}</option>
          <option value="vendor">{t('dashboards.chartByVendor')}</option>
        </select>
      </div>

      <div style={{ height: 320, width: '100%', marginTop: 8 }}>
        {chartData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--md-sys-color-outline)', fontSize: '0.85rem' }}>
            {t('dashboards.noChartData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="displayName" 
                tick={{ fontSize: 11, fill: 'var(--md-sys-color-on-surface)' }} 
                angle={-25} 
                textAnchor="end" 
                interval={0} 
                height={50} 
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--md-sys-color-on-surface)' }} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--md-sys-color-surface-container-high)', 
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  borderRadius: 8,
                  fontSize: '0.85rem'
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => {
                  const activeType = chartType === 'estado' ? 'state' : chartType;
                  const isSelected = selectedChartFilter && (selectedChartFilter.type === activeType || selectedChartFilter.type === chartType) && selectedChartFilter.value === entry.name;
                  let fillColor = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                  if (chartType === 'rag' && RAG_COLORS[entry.name]) {
                    fillColor = RAG_COLORS[entry.name];
                  }
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isSelected ? 'var(--md-sys-color-primary-container)' : fillColor} 
                      stroke={isSelected ? 'var(--md-sys-color-primary)' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

