import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function PortfolioBudgetChart({ chartData, formatCurrency }) {
  const { t } = useTranslation();
  if (!chartData || chartData.length === 0) return null;

  const approvedKey = t('portfolioReport.approved');
  const reservedKey = t('portfolioReport.reserved');
  const executedKey = t('portfolioReport.executed');

  return (
    <div className="m3-card glass-panel" style={{ padding: 24 }}>
      <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 20 }}>
        {t('portfolioReport.budgetDistribution')}
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
            <Bar dataKey={approvedKey} fill="var(--md-sys-color-primary, #007aff)" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey={reservedKey} fill="#e8a600" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey={executedKey} fill="#00c7b2" radius={[4, 4, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
