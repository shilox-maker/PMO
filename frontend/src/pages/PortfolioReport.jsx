import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Coins, TrendingUp, ChevronDown, ChevronUp, AlertCircle, CheckCircle2,
  RefreshCw, ArrowRight, DollarSign, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

export default function PortfolioReport() {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Collapse state for sections
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    // Fetch portfolios
    fetch(`${import.meta.env.VITE_API_URL}/portfolios`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        // Sort portfolios by ID desc (recent first) or name desc
        const sorted = data.sort((a, b) => b.nombre.localeCompare(a.nombre));
        setPortfolios(sorted);
        setPortfoliosLoading(false);
        if (sorted.length > 0) {
          setSelectedPortfolioId(sorted[0].id);
        }
      })
      .catch(err => {
        setError('Error al cargar portfolios: ' + err.message);
        setPortfoliosLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedPortfolioId) return;
    setLoadingReport(true);
    setError('');
    
    fetch(`${import.meta.env.VITE_API_URL}/portfolios/${selectedPortfolioId}/budget-report`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar el informe del portfolio.');
        return res.json();
      })
      .then(data => {
        setReportData(data);
        // Expand all sections by default
        const initialExpand = {};
        data.secciones.forEach(sec => {
          initialExpand[sec.id_presupuesto] = true;
        });
        setExpandedSections(initialExpand);
        setLoadingReport(false);
      })
      .catch(err => {
        setError(err.message);
        setLoadingReport(false);
      });
  }, [selectedPortfolioId]);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  if (portfoliosLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
      </div>
    );
  }

  // Prep chart data
  const chartData = reportData ? reportData.secciones
    .filter(sec => sec.id_presupuesto !== 'sin_presupuesto') // Hide the virtual section in chart
    .map(sec => {
      const label = sec.subtipo ? `${sec.tipo} (${sec.subtipo})` : sec.tipo;
      return {
        name: label,
        Aprobado: sec.aprobado,
        Reservado: sec.reservado,
        Ejecutado: sec.ejecutado
      };
    }) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      
      {/* Top Filter and Info Panel */}
      <div className="m3-card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Calendar size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Seleccionar Cartera de Portfolio:</span>
          <select 
            value={selectedPortfolioId}
            onChange={(e) => setSelectedPortfolioId(e.target.value)}
            className="user-select"
            style={{ width: '220px', height: '38px', margin: 0, padding: '0 12px' }}
          >
            <option value="">Seleccione un Portfolio...</option>
            {portfolios.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        {reportData?.portfolio?.descripcion && (
          <div style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', maxWidth: '400px', textAlign: 'right' }}>
            {reportData.portfolio.descripcion}
          </div>
        )}
      </div>

      {error && (
        <div className="status-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loadingReport ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <RefreshCw className="animate-spin" size={28} style={{ color: 'var(--md-sys-color-primary)' }} />
        </div>
      ) : reportData ? (
        <>
          {/* Executive KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {/* KPI: Aprobado */}
            <div className="m3-card glass-panel" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              padding: '16px 20px', 
              background: 'linear-gradient(135deg, rgba(var(--md-sys-color-primary-rgb, 0, 122, 255), 0.08) 0%, rgba(var(--md-sys-color-surface-rgb, 255, 255, 255), 0) 100%)',
              borderLeft: '4px solid var(--md-sys-color-primary, #007aff)'
            }}>
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0' }}>{formatCurrency(reportData.resumen.aprobado_total)}</h2>
              </div>
            </div>

            {/* KPI: Reservado */}
            <div className="m3-card glass-panel" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              padding: '16px 20px', 
              background: 'linear-gradient(135deg, rgba(232, 166, 0, 0.08) 0%, rgba(var(--md-sys-color-surface-rgb, 255, 255, 255), 0) 100%)',
              borderLeft: '4px solid #e8a600'
            }}>
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0' }}>{formatCurrency(reportData.resumen.reservado_total)}</h2>
              </div>
            </div>

            {/* KPI: Ejecutado */}
            <div className="m3-card glass-panel" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              padding: '16px 20px', 
              background: 'linear-gradient(135deg, rgba(0, 199, 178, 0.08) 0%, rgba(var(--md-sys-color-surface-rgb, 255, 255, 255), 0) 100%)',
              borderLeft: '4px solid #00c7b2'
            }}>
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0' }}>{formatCurrency(reportData.resumen.ejecutado_total)}</h2>
              </div>
            </div>

            {/* KPI: Disp. Compromiso */}
            <div className="m3-card glass-panel" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              padding: '16px 20px', 
              background: reportData.resumen.disponible_compromiso_total >= 0
                ? 'linear-gradient(135deg, rgba(52, 199, 89, 0.08) 0%, rgba(var(--md-sys-color-surface-rgb, 255, 255, 255), 0) 100%)'
                : 'linear-gradient(135deg, rgba(255, 69, 58, 0.08) 0%, rgba(var(--md-sys-color-surface-rgb, 255, 255, 255), 0) 100%)',
              borderLeft: reportData.resumen.disponible_compromiso_total >= 0 
                ? '4px solid var(--color-rag-green, #34c759)'
                : '4px solid var(--color-rag-red, #ff453a)'
            }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: reportData.resumen.disponible_compromiso_total >= 0 ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 69, 58, 0.12)',
                color: reportData.resumen.disponible_compromiso_total >= 0 ? 'var(--color-rag-green, #34c759)' : 'var(--color-rag-red, #ff453a)',
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
                  color: reportData.resumen.disponible_compromiso_total >= 0 ? 'var(--color-rag-green)' : 'var(--color-rag-red)'
                }}>{formatCurrency(reportData.resumen.disponible_compromiso_total)}</h2>
              </div>
            </div>

            {/* KPI: Disp. Ejecución */}
            <div className="m3-card glass-panel" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              padding: '16px 20px', 
              background: reportData.resumen.disponible_ejecutado_total >= 0
                ? 'linear-gradient(135deg, rgba(52, 199, 89, 0.08) 0%, rgba(var(--md-sys-color-surface-rgb, 255, 255, 255), 0) 100%)'
                : 'linear-gradient(135deg, rgba(255, 69, 58, 0.08) 0%, rgba(var(--md-sys-color-surface-rgb, 255, 255, 255), 0) 100%)',
              borderLeft: reportData.resumen.disponible_ejecutado_total >= 0 
                ? '4px solid var(--color-rag-green, #34c759)'
                : '4px solid var(--color-rag-red, #ff453a)'
            }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: reportData.resumen.disponible_ejecutado_total >= 0 ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 69, 58, 0.12)',
                color: reportData.resumen.disponible_ejecutado_total >= 0 ? 'var(--color-rag-green, #34c759)' : 'var(--color-rag-red, #ff453a)',
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
                  color: reportData.resumen.disponible_ejecutado_total >= 0 ? 'var(--color-rag-green)' : 'var(--color-rag-red)'
                }}>{formatCurrency(reportData.resumen.disponible_ejecutado_total)}</h2>
              </div>
            </div>
          </div>

          {/* Budget distribution chart */}
          {chartData.length > 0 && (
            <div className="m3-card glass-panel" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 20 }}>Distribución Presupuestaria: Aprobado vs Reservado vs Ejecutado</h3>
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
          )}

          {/* Detailed table and project lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', margin: '8px 0 0 0' }}>Desglose por Secciones Presupuestarias</h3>

            {reportData.secciones.length === 0 ? (
              <div className="m3-card glass-panel" style={{ textAlign: 'center', padding: '32px', color: 'var(--md-sys-color-outline)' }}>
                No se han definido presupuestos para este portfolio en el panel de administración.
              </div>
            ) : (
              reportData.secciones.map(sec => {
                const isExpanded = !!expandedSections[sec.id_presupuesto];
                const pctReservado = sec.aprobado > 0 ? (sec.reservado / sec.aprobado) * 100 : 0;
                const pctEjecutado = sec.aprobado > 0 ? (sec.ejecutado / sec.aprobado) * 100 : 0;
                const isExceeded = sec.disponible < 0;

                return (
                  <div key={sec.id_presupuesto} className="m3-card glass-panel" style={{ padding: 0, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                    
                    {/* Header Row */}
                    <div 
                      onClick={() => toggleSection(sec.id_presupuesto)}
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
                                    <td style={{ fontWeight: 600 }}>{p.nombre_proyecto}</td>
                                    <td>{p.pm}</td>
                                    <td>{p.estado || '—'}</td>
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
                                        onClick={() => navigate(`/proyecto/${p.id_proyecto}`)}
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
              })
            )}
          </div>
        </>
      ) : (
        <div className="m3-card glass-panel" style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Briefcase size={40} style={{ opacity: 0.3 }} />
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>No hay información disponible</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', marginTop: 4 }}>Por favor, seleccione un portfolio para cargar su informe.</p>
          </div>
        </div>
      )}
    </div>
  );
}
