import React from 'react';
import { ChevronDown, ChevronUp, AlertCircle, ArrowRight, FileText } from 'lucide-react';

export default function PortfolioBudgetSection({ sec, isExpanded, onToggle, formatCurrency, onNavigateProject }) {
  const pctReservado = sec.aprobado > 0 ? (sec.reservado / sec.aprobado) * 100 : 0;
  const pctEjecutado = sec.aprobado > 0 ? (sec.ejecutado / sec.aprobado) * 100 : 0;
  const isExceeded = sec.disponible < 0;

  return (
    <div className="m3-card glass-panel" style={{ padding: 0, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
      
      {/* Header Row */}
      <div 
        onClick={onToggle}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 1.2fr 1.8fr 40px', 
          alignItems: 'center', 
          padding: '16px 20px', 
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: isExpanded ? 'var(--md-sys-color-surface-container-low)' : 'transparent',
          borderBottom: isExpanded ? '1px solid var(--md-sys-color-outline-variant)' : 'none'
        }}
      >
        {/* Section Title */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            {sec.tipo}
            {sec.subtipo && (
              <span className="badge badge-blue" style={{ fontSize: '0.7rem', padding: '2px 8px', fontWeight: 600 }}>{sec.subtipo}</span>
            )}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', marginTop: 2 }}>
            {sec.proyectos.length} proyecto{sec.proyectos.length === 1 ? '' : 's'} asociado{sec.proyectos.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Approved */}
        <div>
          <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--md-sys-color-outline)' }}>Aprobado</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            {sec.id_presupuesto === 'sin_presupuesto' ? '—' : formatCurrency(sec.aprobado)}
          </span>
        </div>

        {/* Reserved */}
        <div>
          <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--md-sys-color-outline)' }}>Reservado</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: sec.reservado > 0 ? '#e8a600' : 'inherit' }}>{formatCurrency(sec.reservado)}</span>
        </div>

        {/* Executed */}
        <div>
          <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--md-sys-color-outline)' }}>Ejecutado</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: sec.ejecutado > 0 ? '#00c7b2' : 'inherit' }}>{formatCurrency(sec.ejecutado)}</span>
        </div>

        {/* Disp. Compromiso */}
        <div>
          <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--md-sys-color-outline)' }}>Disp. Proy</span>
          <span style={{ 
            fontWeight: 700, 
            fontSize: '0.9rem', 
            color: sec.disponible_compromiso < 0 ? 'var(--color-rag-red)' : 'var(--color-rag-green)' 
          }}>
            {sec.id_presupuesto === 'sin_presupuesto' ? `-${formatCurrency(sec.reservado)}` : formatCurrency(sec.disponible_compromiso)}
          </span>
        </div>

        {/* Disp. Ejecución */}
        <div>
          <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--md-sys-color-outline)' }}>Disp. Caja</span>
          <span style={{ 
            fontWeight: 700, 
            fontSize: '0.9rem', 
            color: sec.disponible_ejecutado < 0 ? 'var(--color-rag-red)' : 'var(--color-rag-green)' 
          }}>
            {sec.id_presupuesto === 'sin_presupuesto' ? `-${formatCurrency(sec.ejecutado)}` : formatCurrency(sec.disponible_ejecutado)}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ paddingRight: 16 }}>
          {sec.id_presupuesto !== 'sin_presupuesto' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Reservado progress */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 600 }}>
                  <span>Reserva: {pctReservado.toFixed(0)}%</span>
                </div>
                <div style={{ height: 4, backgroundColor: 'var(--md-sys-color-outline-variant)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min(100, pctReservado)}%`, 
                    backgroundColor: isExceeded ? 'var(--color-rag-red)' : '#e8a600',
                    borderRadius: 2
                  }} />
                </div>
              </div>
              {/* Ejecutado progress */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 600 }}>
                  <span>Ejecutado: {pctEjecutado.toFixed(0)}%</span>
                </div>
                <div style={{ height: 4, backgroundColor: 'var(--md-sys-color-outline-variant)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min(100, pctEjecutado)}%`, 
                    backgroundColor: '#00c7b2',
                    borderRadius: 2
                  }} />
                </div>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-rag-red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={14} /> Gasto Sin Presupuesto
            </span>
          )}
        </div>

        {/* Expand Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--md-sys-color-outline)' }}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Collapsible Project List */}
      {isExpanded && (
        <div style={{ padding: '8px 20px 20px 20px', backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
          {sec.proyectos.length === 0 ? (
            <p style={{ fontSize: '0.8rem', opacity: 0.6, fontStyle: 'italic', margin: '8px 0 0 0' }}>No hay proyectos asignados a esta sección en el portfolio.</p>
          ) : (
            <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '12px', marginTop: 8 }}>
              <table className="m3-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Código</th>
                    <th>Nombre del Proyecto</th>
                    <th>Project Manager</th>
                    <th>Fase Workflow</th>
                    <th>Subtipo</th>
                    <th style={{ textAlign: 'center', width: '80px' }}>RAG</th>
                    <th style={{ textAlign: 'right', width: '120px' }}>Reservado (Budget)</th>
                    <th style={{ textAlign: 'right', width: '120px' }}>Ejecutado (Facturas)</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sec.proyectos.map(p => (
                    <tr key={p.id_proyecto}>
                      <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{p.id_proyecto}</td>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {p.nombre_proyecto}
                          {p.budget_notas && (
                            <FileText 
                              size={14} 
                              style={{ color: 'var(--md-sys-color-primary)', cursor: 'help', flexShrink: 0 }} 
                              title={p.budget_notas}
                            />
                          )}
                        </div>
                      </td>
                      <td>{p.pm}</td>
                      <td>{p.estado || '—'}</td>
                      <td>
                        {p.subtipo_capex ? (
                          <span className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                            {p.subtipo_capex}
                          </span>
                        ) : (
                          <span style={{ opacity: 0.4 }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <span style={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            backgroundColor: p.indicador_rag === 'VERDE' ? 'var(--color-rag-green, #34c759)' : p.indicador_rag === 'AMARILLO' ? 'var(--color-rag-yellow, #ffcc00)' : 'var(--color-rag-red, #ff453a)',
                            boxShadow: `0 0 8px ${p.indicador_rag === 'VERDE' ? '#34c759' : p.indicador_rag === 'AMARILLO' ? '#ffcc00' : '#ff453a'}`
                          }} title={`RAG: ${p.indicador_rag}`} />
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(p.budget_inicial)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00c7b2' }}>{formatCurrency(p.ejecutado)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="icon-btn" 
                          style={{ color: 'var(--md-sys-color-primary)', padding: 4 }}
                          onClick={() => onNavigateProject(p.id_proyecto)}
                          title="Ver Ficha de Proyecto"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
