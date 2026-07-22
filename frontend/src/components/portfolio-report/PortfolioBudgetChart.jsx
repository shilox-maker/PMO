import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function PortfolioBudgetChart({ chartData, formatCurrency }) {
  if (!chartData || chartData.length === 0) return null;

  return (
    <div className="m3-card glass-panel" style={{ padding: 24 }}>
      <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 20 }}>
        Distribución Presupuestaria: Aprobado vs Reservado vs Ejecutado
      </h3>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" opacity={0.3} />
            <XAxis dataKey="name" stroke="var(--md-sys-color-outline)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--md-sys-color-outline)" fontSize={11} tickLine={false} tickFormatter={(val) => `${(val / 1000)}k€`} />
            <Tooltip 
              formatter={(value) => [formatCurrency(value), '']}
              contentStyle={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', borderColor: 'var(--md-sys-color-outline-variant)', borderRadius: 12, color: 'var(--md-sys-color-on-surface)' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Aprobado" fill="var(--md-sys-color-primary, #007aff)" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey="Reservado" fill="#e8a600" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey="Ejecutado" fill="#00c7b2" radius={[4, 4, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
