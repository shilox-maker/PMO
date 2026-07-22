import React from 'react';
import { DollarSign, Briefcase, TrendingUp, Coins } from 'lucide-react';

export default function PortfolioReportKpis({ resumen, formatCurrency }) {
  if (!resumen) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, overflow: 'visible' }}>
      {/* KPI: Aprobado */}
      <div
        className="m3-card glass-panel"
        title="Suma del campo 'Presupuesto Aprobado' de todos los proyectos del portfolio seleccionado."
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(0,122,255,0.08) 0%, transparent 100%)', borderLeft: '4px solid var(--md-sys-color-primary)', cursor: 'help' }}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: 'rgba(0, 122, 255, 0.12)',
          color: 'var(--md-sys-color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <DollarSign size={18} />
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--md-sys-color-outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aprobado</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0' }}>{formatCurrency(resumen.aprobado_total)}</h2>
        </div>
      </div>

      {/* KPI: Reservado */}
      <div
        className="m3-card glass-panel"
        title="Suma de todos los registros de Budget (líneas de gasto comprometido) de los proyectos del portfolio."
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(232,166,0,0.08) 0%, transparent 100%)', borderLeft: '4px solid #e8a600', cursor: 'help' }}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: 'rgba(232, 166, 0, 0.12)',
          color: '#e8a600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Briefcase size={18} />
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--md-sys-color-outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reservado (Budgets)</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0' }}>{formatCurrency(resumen.reservado_total)}</h2>
        </div>
      </div>

      {/* KPI: Ejecutado */}
      <div
        className="m3-card glass-panel"
        title="Suma del importe de todas las facturas registradas (pagadas o pendientes) en los proyectos del portfolio."
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(0,199,178,0.08) 0%, transparent 100%)', borderLeft: '4px solid #00c7b2', cursor: 'help' }}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: 'rgba(0, 199, 178, 0.12)',
          color: '#00c7b2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <TrendingUp size={18} />
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--md-sys-color-outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ejecutado (Facturas)</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0' }}>{formatCurrency(resumen.ejecutado_total)}</h2>
        </div>
      </div>

      {/* KPI: Disp. Compromiso */}
      <div
        className="m3-card glass-panel"
        title="Aprobado − Reservado (Budgets). Margen presupuestario aún no comprometido en ningún proyecto."
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: resumen.disponible_compromiso_total >= 0 ? 'linear-gradient(135deg, rgba(52,199,89,0.08) 0%, transparent 100%)' : 'linear-gradient(135deg, rgba(255,69,58,0.08) 0%, transparent 100%)', borderLeft: resumen.disponible_compromiso_total >= 0 ? '4px solid var(--color-rag-green)' : '4px solid var(--color-rag-red)', cursor: 'help' }}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: resumen.disponible_compromiso_total >= 0 ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 69, 58, 0.12)',
          color: resumen.disponible_compromiso_total >= 0 ? 'var(--color-rag-green, #34c759)' : 'var(--color-rag-red, #ff453a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Coins size={18} />
        </div>
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--md-sys-color-outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disponible (Proyectos)</span>
          </div>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            margin: '2px 0 0 0',
            color: resumen.disponible_compromiso_total >= 0 ? 'var(--color-rag-green)' : 'var(--color-rag-red)'
          }}>{formatCurrency(resumen.disponible_compromiso_total)}</h2>
        </div>
      </div>

      {/* KPI: Disp. Ejecución */}
      <div
        className="m3-card glass-panel"
        title="Aprobado − Ejecutado (Facturas). Dinero real pendiente de pago según las facturas registradas."
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: resumen.disponible_ejecutado_total >= 0 ? 'linear-gradient(135deg, rgba(52,199,89,0.08) 0%, transparent 100%)' : 'linear-gradient(135deg, rgba(255,69,58,0.08) 0%, transparent 100%)', borderLeft: resumen.disponible_ejecutado_total >= 0 ? '4px solid var(--color-rag-green)' : '4px solid var(--color-rag-red)', cursor: 'help' }}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: resumen.disponible_ejecutado_total >= 0 ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 69, 58, 0.12)',
          color: resumen.disponible_ejecutado_total >= 0 ? 'var(--color-rag-green, #34c759)' : 'var(--color-rag-red, #ff453a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Coins size={18} />
        </div>
        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--md-sys-color-outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disponible (Caja)</span>
          </div>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            margin: '2px 0 0 0',
            color: resumen.disponible_ejecutado_total >= 0 ? 'var(--color-rag-green)' : 'var(--color-rag-red)'
          }}>{formatCurrency(resumen.disponible_ejecutado_total)}</h2>
        </div>
      </div>
    </div>
  );
}
