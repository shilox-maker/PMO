import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { 
  Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';

export default function DashboardChartsSection({
  isChartOpen,
  setIsChartOpen,
  dataStatus,
  selectedChartFilter,
  setSelectedChartFilter,
  COLORS
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 24 }}>
      <div className="m3-card glass-panel" style={{ padding: 24 }}>
        <div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setIsChartOpen(!isChartOpen)}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Proyectos por Fase / Estado</h3>
          <div style={{ color: 'var(--md-sys-color-outline)' }}>
            {isChartOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
        
        {isChartOpen && (
          <div style={{ height: 350, marginTop: 16 }}>
            {dataStatus.length === 0 ? <p style={{ color: '#999' }}>Sin datos</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataStatus} margin={{ bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} height={50} />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar 
                    dataKey="value" 
                    fill="var(--md-sys-color-primary)" 
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      if (data && data.name) {
                        setSelectedChartFilter(prev => 
                          prev && prev.type === 'estado' && prev.value === data.name ? null : { type: 'estado', value: data.name }
                        );
                      }
                    }}
                  >
                    {dataStatus.map((entry, index) => {
                      const isSelected = selectedChartFilter && selectedChartFilter.type === 'estado' && selectedChartFilter.value === entry.name;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={isSelected ? 'var(--md-sys-color-primary-container)' : COLORS[index % COLORS.length]} 
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
        )}
      </div>
    </div>
  );
}
