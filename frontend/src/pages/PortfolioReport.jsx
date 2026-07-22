import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import PortfolioReportKpis from '../components/portfolio-report/PortfolioReportKpis';
import PortfolioBudgetChart from '../components/portfolio-report/PortfolioBudgetChart';
import PortfolioBudgetSection from '../components/portfolio-report/PortfolioBudgetSection';

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
    .filter(sec => sec.id_presupuesto !== 'sin_presupuesto')
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
          <PortfolioReportKpis 
            resumen={reportData.resumen} 
            formatCurrency={formatCurrency} 
          />

          {/* Budget distribution chart */}
          <PortfolioBudgetChart 
            chartData={chartData} 
            formatCurrency={formatCurrency} 
          />

          {/* Detailed table and project lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', margin: '8px 0 0 0' }}>Desglose por Secciones Presupuestarias</h3>

            {reportData.secciones.length === 0 ? (
              <div className="m3-card glass-panel" style={{ textAlign: 'center', padding: '32px', color: 'var(--md-sys-color-outline)' }}>
                No se han definido presupuestos para este portfolio en el panel de administración.
              </div>
            ) : (
              reportData.secciones.map(sec => (
                <PortfolioBudgetSection 
                  key={sec.id_presupuesto}
                  sec={sec}
                  isExpanded={!!expandedSections[sec.id_presupuesto]}
                  onToggle={() => toggleSection(sec.id_presupuesto)}
                  formatCurrency={formatCurrency}
                  onNavigateProject={(id) => navigate(`/proyecto/${id}`)}
                />
              ))
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
