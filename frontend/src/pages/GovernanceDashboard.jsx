import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Filter, Search, ChevronDown, ChevronUp, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useTableColumns } from '../hooks/useTableColumns';
import ColumnSelector from '../components/ColumnSelector';
import GovernanceKpiHeader from '../components/governance/GovernanceKpiHeader';
import GovernanceCommitteesSection from '../components/governance/GovernanceCommitteesSection';
import GovernanceHealthSection from '../components/governance/GovernanceHealthSection';

const DEFAULT_GOV_COLUMNS = [
  { id: 'id_proyecto', label: 'Código', fixed: true, visible: true },
  { id: 'nombre_proyecto', label: 'Proyecto', fixed: true, visible: true },
  { id: 'pm_nombre', label: 'PM', fixed: false, visible: true },
  { id: 'indicador_rag', label: 'RAG', fixed: false, visible: true },
  { id: 'fecha_inicio', label: 'Fecha de Inicio', fixed: false, visible: true },
  { id: 'fecha_fin_inicial', label: 'Fecha Fin Base', fixed: false, visible: true },
  { id: 'fecha_fin_estimada', label: 'Fecha Fin Estimada', fixed: false, visible: true },
  { id: 'gasto_total_facturas', label: 'Gasto Facturado', fixed: false, visible: true },
  { id: 'alerta_tiempo', label: 'Alerta de Tiempo', fixed: false, visible: true },
  { id: 'alerta_dinero', label: 'Alerta de Dinero', fixed: false, visible: true },
  { id: 'proximo_hito', label: 'Próximo Hito', fixed: false, visible: true },
  { id: 'ultimo_comentario', label: 'Último Comentario', fixed: false, visible: true },
  { id: 'accion', label: 'Ficha', fixed: true, visible: true }
];

export default function GovernanceDashboard({ onViewProject, onViewVendor }) {
  const { getAuthHeaders } = useAuth();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Column visibility
  const { columns: tableCols, visibleColumnsMap, toggleColumn, resetColumns } = useTableColumns('ppm-governance-columns', DEFAULT_GOV_COLUMNS);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'id_proyecto', direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortHeader = (label, key, extraStyle = {}) => {
    const isSorted = sortConfig.key === key;
    return (
      <th 
        onClick={() => handleSort(key)} 
        style={{ cursor: 'pointer', userSelect: 'none', ...extraStyle }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          {isSorted ? (
            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          ) : (
            <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
          )}
        </div>
      </th>
    );
  };

  const [exportingExcel, setExportingExcel] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const [filters, setFilters] = useState({
    pm: '',
    vendor: '',
    rag: '',
    search: '',
    fechaDesde: '2026-01-01',
    fechaHasta: '2026-12-31',
    states: []
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const [isStatesOpen, setIsStatesOpen] = useState(false);
  const [activeKpiFilter, setActiveKpiFilter] = useState(null);

  // Dropdowns lists
  const [pmsList, setPmsList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [statesList, setStatesList] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/pms`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPmsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/vendors`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setVendorsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/portfolio/states`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setStatesList(data));
  }, []);

  const fetchDashboardData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.pm) params.append('pm', filters.pm);
    if (filters.vendor) params.append('vendor', filters.vendor);
    if (filters.rag) params.append('rag', filters.rag);
    if (filters.search) params.append('search', filters.search);
    if (filters.fechaDesde) params.append('fecha_desde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fecha_hasta', filters.fechaHasta);
    if (filters.states && filters.states.length > 0) params.append('state', filters.states.join(','));

    fetch(`${import.meta.env.VITE_API_URL}/portfolio/dashboard?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching governance dashboard data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
    setActiveKpiFilter(null);
  }, [filters]);

  const handleExportExcel = () => {
    setExportingExcel(true);
    const params = new URLSearchParams();
    if (filters.pm) params.append('pm', filters.pm);
    if (filters.vendor) params.append('vendor', filters.vendor);
    if (filters.rag) params.append('rag', filters.rag);
    if (filters.search) params.append('search', filters.search);
    if (filters.states && filters.states.length > 0) params.append('state', filters.states.join(','));
    if (filters.fechaDesde) params.append('fecha_desde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fecha_hasta', filters.fechaHasta);

    const visibleKeys = tableCols.filter(c => c.visible).map(c => c.id).join(',');
    if (visibleKeys) params.append('cols', visibleKeys);

    fetch(`${import.meta.env.VITE_API_URL}/projects/export?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al exportar a Excel');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Reporte_Portfolio.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('Error al descargar el Excel:', err);
        alert(err.message);
      })
      .finally(() => {
        setExportingExcel(false);
      });
  };

  const generatePortfolioReport = async () => {
    if (filteredGridData.length === 0) {
      alert('No hay proyectos filtrados para generar el informe de portfolio.');
      return;
    }
    setGeneratingReport(true);

    const formatDate = (d) => {
      if (!d) return '—';
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth()+1).padStart(2, '0')}/${dt.getFullYear()}`;
    };
    const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
    const formatDateTime = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()} a las ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    };

    try {
      // Fetch full detail + comments for each project
      const projectBlocks = [];
      for (const p of filteredGridData) {
        const [detailRes, commentsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/projects/${p.id_proyecto}`, { headers: getAuthHeaders() }),
          fetch(`${import.meta.env.VITE_API_URL}/projects/${p.id_proyecto}/comments`, { headers: getAuthHeaders() })
        ]);
        const detail = await detailRes.json();
        const comments = await commentsRes.json();
        const importantComments = comments.filter(c => c.es_importante);

        const calc = detail.calculations || {};
        const budgetInitial = parseFloat(detail.budget_inicial) || 0;
        const gastoTotal = calc.gasto_comprometido || 0;
        const budgetOverrun = gastoTotal > budgetInitial;
        const budgetPercent = budgetInitial > 0 ? ((gastoTotal / budgetInitial) * 100).toFixed(1) : 0;
        const fechaFinInicial = detail.fecha_fin_inicial || '—';
        const fechaFinEstimada = calc.fecha_fin_estimada || fechaFinInicial;
        const diasRetraso = calc.dias_retraso_aprobados || 0;
        const hasDelay = diasRetraso > 0;

        const allTasks = detail.Tareas || [];
        const milestones = allTasks.filter(t => t.es_hito);
        const completed = milestones.filter(t => t.estado === 'COMPLETADA').sort((a,b) => new Date(b.fecha_limite) - new Date(a.fecha_limite)).slice(0,3);
        const pending = milestones.filter(t => t.estado === 'PENDIENTE').sort((a,b) => new Date(a.fecha_limite) - new Date(b.fecha_limite)).slice(0,3);

        const milestoneRows = (list, type) => {
          if (list.length === 0) return `<tr><td colspan="3" style="text-align:center;color:#999;padding:8px;">Sin hitos ${type}</td></tr>`;
          return list.map(m => `
            <tr>
              <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;font-size:12px;">${m.titulo_tarea}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;font-size:12px;">${formatDate(m.fecha_limite)}</td>
              <td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;"><span style="padding:2px 6px;border-radius:10px;font-size:10px;font-weight:600;background:${m.estado==='COMPLETADA'?'#e8f5e9':'#fff3e0'};color:${m.estado==='COMPLETADA'?'#2e7d32':'#e65100'};">${m.estado==='COMPLETADA'?'✅ Completado':'⏳ Pendiente'}</span></td>
            </tr>
          `).join('');
        };

        const commentsHtml = importantComments.length === 0
          ? '<p style="color:#999;text-align:center;padding:12px;font-size:12px;">Sin comentarios ejecutivos.</p>'
          : importantComments.map(c => `
            <div style="padding:12px;margin-bottom:8px;background:#fffbf0;border-left:3px solid #f59e0b;border-radius:6px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <strong style="font-size:12px;">${c.Autor?.nombre||''} ${c.Autor?.apellidos||''}</strong>
                <span style="font-size:10px;color:#888;">${formatDate(c.fecha_registro)}</span>
              </div>
              <div style="font-size:12px;line-height:1.5;color:#333;">${c.texto_comentario}</div>
              ${c.editado ? `<div style="font-size:10px;color:#999;margin-top:4px;font-style:italic;">Editado por ${c.Editor?.nombre||''} ${c.Editor?.apellidos||''} el ${formatDateTime(c.fecha_modificacion)}</div>` : ''}
            </div>
          `).join('');

        projectBlocks.push(`
          <div class="project-block" style="page-break-after: always;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #1a1a2e;">
              <div>
                <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0;">${detail.Estado?.icono||''} ${detail.nombre_proyecto}</h2>
                <p style="font-size:12px;color:#666;margin:4px 0 0;">${detail.id_proyecto} · ${detail.Estado?.nombre_estado||'Sin Estado'}</p>
              </div>
              <div style="text-align:right;font-size:11px;color:#666;">
                <p><strong>PM:</strong> ${detail.PM?.nombre||''} ${detail.PM?.apellidos||''}</p>
                <p><strong>Partner:</strong> ${detail.Proveedor?.nombre_razon_social||'—'}</p>
                <p><strong>Sede:</strong> ${detail.Sede?.nombre_sede||'—'}</p>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
              <div style="padding:12px;border-radius:8px;background:#f8f9fa;border:1px solid #e9ecef;">
                <div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:600;">Fecha Fin Inicial</div>
                <div style="font-size:16px;font-weight:700;">${formatDate(fechaFinInicial)}</div>
              </div>
              <div style="padding:12px;border-radius:8px;background:#f8f9fa;border:1px solid #e9ecef;">
                <div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:600;">Fecha Fin Estimada</div>
                <div style="font-size:16px;font-weight:700;${hasDelay?'color:#dc2626;':''}">${formatDate(fechaFinEstimada)} ${hasDelay?`<span style="font-size:11px;">(+${diasRetraso} días)</span>`:''}</div>
              </div>
              <div style="padding:12px;border-radius:8px;background:#f8f9fa;border:1px solid #e9ecef;">
                <div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:600;">Presupuesto Inicial</div>
                <div style="font-size:16px;font-weight:700;">${formatCurrency(budgetInitial)}</div>
              </div>
              <div style="padding:12px;border-radius:8px;background:#f8f9fa;border:1px solid #e9ecef;">
                <div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:600;">Gasto Comprometido (${budgetPercent}%)</div>
                <div style="font-size:16px;font-weight:700;${budgetOverrun?'color:#dc2626;':'color:#16a34a;'}">${formatCurrency(gastoTotal)} ${budgetOverrun?'<span style="font-size:11px;">⚠️ SOBRECOSTO</span>':''}</div>
              </div>
            </div>

            <div style="margin-bottom:20px;">
              <h3 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid #eee;">🏁 Hitos</h3>
              <table style="width:100%;border-collapse:collapse;"><thead><tr><th style="padding:8px 10px;background:#f1f3f5;font-size:10px;text-transform:uppercase;font-weight:700;color:#555;text-align:left;border-bottom:2px solid #dee2e6;">Hito</th><th style="padding:8px 10px;background:#f1f3f5;font-size:10px;text-transform:uppercase;font-weight:700;color:#555;text-align:left;border-bottom:2px solid #dee2e6;">Fecha</th><th style="padding:8px 10px;background:#f1f3f5;font-size:10px;text-transform:uppercase;font-weight:700;color:#555;text-align:left;border-bottom:2px solid #dee2e6;">Estado</th></tr></thead><tbody>${milestoneRows(completed,'completados')}${milestoneRows(pending,'pendientes')}</tbody></table>
            </div>

            <div>
              <h3 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid #eee;">⭐ Muro Ejecutivo</h3>
              ${commentsHtml}
            </div>
          </div>
        `);
      }

      const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe de Portfolio — PPM Dashboard</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; font-size: 13px; line-height: 1.6; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      .project-block { page-break-after: always; }
      .project-block:last-child { page-break-after: auto; }
    }
    .print-btn { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #1a1a2e; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; z-index: 100; }
    .print-btn:hover { background: #2d2d4e; }
    .cover-page { text-align: center; padding: 120px 40px; page-break-after: always; }
    .cover-page h1 { font-size: 32px; font-weight: 800; color: #1a1a2e; margin-bottom: 16px; }
    .cover-page p { font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

  <div class="cover-page">
    <h1>📊 Informe de Portfolio</h1>
    <p>PPM Dashboard — Dossier ejecutivo consolidado</p>
    <p style="margin-top:8px;font-size:13px;">Proyectos incluidos: <strong>${filteredGridData.length}</strong></p>
    <p style="margin-top:4px;font-size:12px;color:#999;">Generado el ${formatDate(new Date().toISOString())} a las ${new Date().toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}</p>
  </div>

  ${projectBlocks.join('\n')}

  <div style="margin-top:40px;padding-top:16px;border-top:2px solid #eee;font-size:11px;color:#999;text-align:center;">
    PPM Dashboard — Informe de Portfolio generado automáticamente
  </div>
</body>
</html>`;

      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(fullHtml);
        reportWindow.document.close();
      }
    } catch (err) {
      console.error('Error generating portfolio report:', err);
      alert('Error al generar el informe de portfolio. Revise la consola.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Metrics
  const overrunCount = projects.filter(p => p.gasto_total_facturas > p.budget_inicial).length;
  const capexWarnCount = projects.filter(p => p.es_capex && p.gasto_total_facturas >= (p.budget_inicial * 0.90)).length;
  const coveredCount = projects.filter(p => p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo).length;
  const coveragePercent = projects.length > 0 ? Math.round((coveredCount / projects.length) * 100) : 0;
  
  const inactiveProjects = projects.filter(p => {
    const hasPlan = p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo;
    if (!hasPlan) return false;
    const diffMs = Date.now() - new Date(p.ultima_actualizacion).getTime();
    return (diffMs / (1000 * 60 * 60 * 24)) > 30;
  });

  const filteredGridData = projects.filter(p => {
    if (activeKpiFilter === 'overrun') {
      if (p.gasto_total_facturas <= p.budget_inicial) return false;
    }
    if (activeKpiFilter === 'capex_warn') {
      if (!p.es_capex || p.gasto_total_facturas < (p.budget_inicial * 0.90)) return false;
    }
    if (activeKpiFilter === 'inactive') {
      const hasPlan = p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo;
      if (!hasPlan) return false;
      const diffMs = Date.now() - new Date(p.ultima_actualizacion).getTime();
      if ((diffMs / (1000 * 60 * 60 * 24)) <= 30) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Filters Bar */}
      <div className="m3-card glass-panel" style={{ padding: '20px 24px', marginBottom: 24, position: 'relative', zIndex: 10, overflow: 'visible' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-sys-color-outline)' }}>
            <Filter size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filtros de Gobernanza:</span>
          </div>

          <div style={{ position: 'relative', flexGrow: 1, minWidth: '180px' }}>
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={filters.search} 
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="m3-input"
              style={{ paddingLeft: '40px', height: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--md-sys-color-outline)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select 
              value={filters.pm} 
              onChange={(e) => handleFilterChange('pm', e.target.value)}
              className="user-select"
              style={{ width: 'auto', minWidth: '140px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
            >
              <option value="">Todos los PM</option>
              {pmsList.map(p => (
                <option key={p.id_usuario} value={p.id_usuario}>{p.nombre} {p.apellidos}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select 
              value={filters.vendor} 
              onChange={(e) => handleFilterChange('vendor', e.target.value)}
              className="user-select"
              style={{ width: 'auto', minWidth: '140px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
            >
              <option value="">Todos los Partners</option>
              {vendorsList.map(v => (
                <option key={v.id_proveedor} value={v.id_proveedor}>{v.nombre_razon_social}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
            <ColumnSelector columns={tableCols} toggleColumn={toggleColumn} resetColumns={resetColumns} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
        </div>
      ) : (
        <>
          <GovernanceKpiHeader 
            projects={projects}
            overrunCount={overrunCount}
            capexWarnCount={capexWarnCount}
            coveragePercent={coveragePercent}
            inactiveProjects={inactiveProjects}
            activeKpiFilter={activeKpiFilter}
            setActiveKpiFilter={setActiveKpiFilter}
          />

          <GovernanceCommitteesSection 
            projects={projects}
            onViewProject={onViewProject}
          />

          <GovernanceHealthSection 
            filteredGridData={filteredGridData}
            visibleColumnsMap={visibleColumnsMap}
            sortConfig={sortConfig}
            renderSortHeader={renderSortHeader}
            onViewProject={onViewProject}
            onViewVendor={onViewVendor}
            handleExportExcel={handleExportExcel}
            generatePortfolioReport={generatePortfolioReport}
            exportingExcel={exportingExcel}
            generatingReport={generatingReport}
          />
        </>
      )}
    </div>
  );
}
