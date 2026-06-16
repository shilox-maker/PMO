import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Calendar, Building, User, MapPin, DollarSign, 
  TrendingUp, Activity, CheckSquare, ShieldAlert, AlertTriangle, 
  MessageSquare, FileText, Plus, Trash2, Edit2, Check, X, RefreshCw,
  Star, FileDown, Printer, ArrowUp, ArrowDown, ArrowUpDown, BookOpen
} from 'lucide-react';
import SearchableKeyUserSelect from '../components/SearchableKeyUserSelect';
import Timeline from './Timeline';
import RichTextEditor from '../components/RichTextEditor';
import { getSortedData } from '../utils/sorting';


export default function ProjectDetail({ projectId, onBack, onViewVendor }) {
  const { getAuthHeaders } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ficha');

  // Sorting configs
  const [invoicesSort, setInvoicesSort] = useState({ key: 'id_interno_factura', direction: 'desc' });
  const [crSort, setCrSort] = useState({ key: 'id_cambio', direction: 'desc' });
  const [issuesSort, setIssuesSort] = useState({ key: 'id_incidencia', direction: 'desc' });
  const [risksSort, setRisksSort] = useState({ key: 'id_riesgo', direction: 'desc' });
  const [tasksSort, setTasksSort] = useState({ key: 'fecha_limite', direction: 'asc' });
  const [lessonsSort, setLessonsSort] = useState({ key: 'fecha_registro', direction: 'desc' });
  // 7. Report Generator Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    resumen: true,
    hitos: true,
    riesgos: true,
    incidencias: true,
    cambios: true,
    lecciones: true
  });


  const renderSortHeader = (label, key, sortConfig, setSortConfig, extraStyle = {}) => {
    const isSorted = sortConfig.key === key;
    return (
      <th 
        onClick={() => setSortConfig(prev => ({
          key,
          direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))} 
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


  // Metadata list for dropdowns
  const [sedes, setSedes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [keyUsers, setKeyUsers] = useState([]);
  const [pms, setPms] = useState([]);
  const [workflowStates, setWorkflowStates] = useState([]);

  // Comments states
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentImportant, setNewCommentImportant] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingCommentImportant, setEditingCommentImportant] = useState(false);

  // ==========================================
  // EDIT STATE MODALS
  // ==========================================
  
  // 1. Edit Project Modal
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProjectForm, setEditProjectForm] = useState({});
  const [editProjectError, setEditProjectError] = useState('');

  // 2. Log / Edit Invoice Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null); // If null: creating new, if object: editing existing
  const [invoiceForm, setInvoiceForm] = useState({ id_interno_factura: '', id_proveedor: '', numero_factura: '', concepto: '', fecha_factura: '', importe: '', estado: 'PENDIENTE_DE_RECIBIR', PO: '' });
  const [invoiceError, setInvoiceError] = useState('');

  // 3. Log / Edit CR Modal
  const [showCrModal, setShowCrModal] = useState(false);
  const [editingCr, setEditingCr] = useState(null); // If null: creating, if object: editing
  const [crForm, setCrForm] = useState({ id_cambio: '', fecha_solicitud: '', id_solicitante_ku: '', id_aprobador_ku: '', descripcion_motivo: '', impacta_importe: false, importe_impacto: '0', impacta_tiempo: false, dias_impacto: '0', estado_cambio: 'SOLICITADO' });
  const [crError, setCrError] = useState('');

  // 4. Log / Edit Risk Modal
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [riskForm, setRiskForm] = useState({ id_riesgo: '', titulo_riesgo: '', descripcion: '', probabilidad: 'MEDIA', impacto: 'MEDIA', plan_mitigacion: '', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '' });
  const [riskError, setRiskError] = useState('');

  // 5. Log / Edit Incident (Issue) Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [issueForm, setIssueForm] = useState({ id_incidencia: '', titulo: '', descripcion: '', tipo_incidencias: 'TECNICA', criticidad: 'MEDIA', estado: 'ABIERTA', fecha_apertura: '', solucion_aplicada: '' });
  const [issueError, setIssueError] = useState('');

  // 6. Log / Edit Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ id_tarea: '', titulo_tarea: '', descripcion: '', es_hito: false, estado: 'PENDIENTE', fecha_limite: '' });
  const [taskError, setTaskError] = useState('');

  const fetchProjectData = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setProject(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching project detail:', err);
        setLoading(false);
      });
  };

  const fetchComments = () => {
    setCommentsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/comments`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setComments(data);
        setCommentsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching comments:', err);
        setCommentsLoading(false);
      });
  };

  const fetchMetadata = () => {
    fetch(`${import.meta.env.VITE_API_URL}/sedes`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setSedes(data));
    fetch(`${import.meta.env.VITE_API_URL}/vendors`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setVendors(data));
    fetch(`${import.meta.env.VITE_API_URL}/key-users`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setKeyUsers(data));
    fetch(`${import.meta.env.VITE_API_URL}/pms`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPms(data));
    fetch(`${import.meta.env.VITE_API_URL}/portfolio/states`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setWorkflowStates(data));
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
      fetchMetadata();
      fetchComments();
    }
  }, [projectId]);

  const handleAddComment = () => {
    if (!newCommentText || newCommentText.trim() === '' || newCommentText === '<br>') return;
    fetch(`${import.meta.env.VITE_API_URL}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id_proyecto: projectId,
        texto_comentario: newCommentText,
        es_importante: newCommentImportant
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al publicar comentario');
        return res.json();
      })
      .then(() => {
        setNewCommentText('');
        setNewCommentImportant(false);
        fetchComments();
      })
      .catch(err => alert(err.message));
  };

  const handleUpdateComment = (id) => {
    if (!editingCommentText || editingCommentText.trim() === '' || editingCommentText === '<br>') return;
    fetch(`${import.meta.env.VITE_API_URL}/comments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        texto_comentario: editingCommentText,
        es_importante: editingCommentImportant
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al actualizar comentario');
        return res.json();
      })
      .then(() => {
        setEditingCommentId(null);
        setEditingCommentText('');
        setEditingCommentImportant(false);
        fetchComments();
      })
      .catch(err => alert(err.message));
  };

  const handleDeleteComment = (id) => {
    if (!window.confirm('¿Seguro que desea eliminar este comentario?')) return;
    fetch(`${import.meta.env.VITE_API_URL}/comments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al eliminar comentario');
        return res.json();
      })
      .then(() => {
        fetchComments();
      })
      .catch(err => alert(err.message));
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} a las ${hours}:${minutes}`;
  };

  // ==========================================
  // REPORT ENGINE: Atomic Project Report
  // ==========================================
  const generateProjectReport = (e) => {
    if (e) e.preventDefault();
    setShowReportModal(false);
    if (!project) return;

    const importantComments = comments.filter(c => c.es_importante);
    const calc = project.calculations || {};
    const budgetInitial = parseFloat(project.budget_inicial) || 0;
    const gastoTotal = calc.gasto_comprometido || 0;
    const budgetOverrun = gastoTotal > budgetInitial;
    const budgetPercent = budgetInitial > 0 ? ((gastoTotal / budgetInitial) * 100).toFixed(1) : 0;

    const fechaFinInicial = project.fecha_fin_inicial || '—';
    const fechaFinEstimada = calc.fecha_fin_estimada || fechaFinInicial;
    const diasRetraso = calc.dias_retraso_aprobados || 0;
    const hasDelay = diasRetraso > 0;

    // Milestones (from tasks that are hitos)
    const allTasks = project.Tareas || [];
    const milestones = allTasks.filter(t => t.es_hito);
    const completed = milestones.filter(t => t.estado === 'COMPLETADA')
      .sort((a, b) => new Date(b.fecha_limite) - new Date(a.fecha_limite))
      .slice(0, 3);
    const pending = milestones.filter(t => t.estado === 'PENDIENTE')
      .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite))
      .slice(0, 3);

    const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
    const formatDate = (d) => {
      if (!d) return '—';
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth()+1).padStart(2, '0')}/${dt.getFullYear()}`;
    };

    const milestoneRows = (list, type) => {
      if (list.length === 0) return `<tr><td colspan="3" style="text-align:center;color:#999;padding:12px;">Sin hitos ${type}</td></tr>`;
      return list.map(m => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;">${m.titulo_tarea}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;">${formatDate(m.fecha_limite)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;">
            <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${m.estado === 'COMPLETADA' ? '#e8f5e9' : '#fff3e0'};color:${m.estado === 'COMPLETADA' ? '#2e7d32' : '#e65100'};">
              ${m.estado === 'COMPLETADA' ? '✅ Completado' : '⏳ Pendiente'}
            </span>
          </td>
        </tr>
      `).join('');
    };

    const commentsHtml = reportOptions.resumen ? (importantComments.length === 0
      ? '<p style="color:#999;text-align:center;padding:20px;">No hay comentarios ejecutivos marcados como importantes.</p>'
      : importantComments.map(c => `
        <div style="padding:16px;margin-bottom:12px;background:#fffbf0;border-left:4px solid #f59e0b;border-radius:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong style="font-size:13px;color:#1a1a2e;">
              ${c.Autor?.nombre || ''} ${c.Autor?.apellidos || ''}
            </strong>
            <span style="font-size:11px;color:#888;">${formatDate(c.fecha_registro)}</span>
          </div>
          <div style="font-size:13px;line-height:1.6;color:#333;">${c.texto_comentario}</div>
          ${c.editado ? `<div style="font-size:11px;color:#999;margin-top:6px;font-style:italic;">Editado por ${c.Editor?.nombre || ''} ${c.Editor?.apellidos || ''} el ${formatDateTime(c.fecha_modificacion)}</div>` : ''}
        </div>
      `).join('')) : '';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Ejecutivo — ${project.id_proyecto}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; font-size: 13px; line-height: 1.6; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #1a1a2e; }
    .report-header h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; }
    .report-header .meta { font-size: 12px; color: #666; text-align: right; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 2px solid #eee; text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 8px; }
    .kpi-box { padding: 16px; border-radius: 10px; background: #f8f9fa; border: 1px solid #e9ecef; }
    .kpi-box .label { font-size: 11px; color: #888; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px; }
    .kpi-box .value { font-size: 18px; font-weight: 700; }
    .alert-red { color: #dc2626 !important; }
    .alert-green { color: #16a34a !important; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { padding: 10px 12px; background: #f1f3f5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #555; text-align: left; border-bottom: 2px solid #dee2e6; }
    .print-btn { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #1a1a2e; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; z-index: 100; }
    .print-btn:hover { background: #2d2d4e; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

  <div class="report-header">
    <div>
      <h1>${project.Estado?.icono || ''} ${project.nombre_proyecto}</h1>
      <p style="font-size:13px;color:#666;margin-top:4px;">${project.id_proyecto} · ${project.Estado?.nombre_estado || 'Sin Estado'}</p>
    </div>
    <div class="meta">
      <p><strong>PM:</strong> ${project.PM?.nombre || ''} ${project.PM?.apellidos || ''}</p>
      <p><strong>Partner:</strong> ${project.Proveedor?.nombre_razon_social || '—'}</p>
      <p><strong>Sede:</strong> ${project.Sede?.nombre_sede || '—'}</p>
      <p><strong>Generado:</strong> ${formatDate(new Date().toISOString())}</p>
    </div>
  </div>

  <div class="section">
    <h2>📊 KPIs de Control</h2>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="label">Fecha Fin Inicial</div>
        <div class="value">${formatDate(fechaFinInicial)}</div>
      </div>
      <div class="kpi-box">
        <div class="label">Fecha Fin Estimada</div>
        <div class="value ${hasDelay ? 'alert-red' : ''}">${formatDate(fechaFinEstimada)} ${hasDelay ? `<span style="font-size:12px;font-weight:500;">(+${diasRetraso} días)</span>` : ''}</div>
      </div>
      <div class="kpi-box">
        <div class="label">Presupuesto Inicial</div>
        <div class="value">${formatCurrency(budgetInitial)}</div>
      </div>
      <div class="kpi-box">
        <div class="label">Gasto Comprometido (${budgetPercent}%)</div>
        <div class="value ${budgetOverrun ? 'alert-red' : 'alert-green'}">${formatCurrency(gastoTotal)} ${budgetOverrun ? '<span style="font-size:12px;">⚠️ SOBRECOSTO</span>' : ''}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>🏁 Hitos del Proyecto</h2>
    <table>
      <thead><tr><th>Hito</th><th>Fecha</th><th>Estado</th></tr></thead>
      <tbody>
        ${milestoneRows(completed, 'completados')}
        ${milestoneRows(pending, 'pendientes')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>⭐ Muro Ejecutivo — Comentarios Importantes</h2>
    ${commentsHtml}
  </div>

  <div style="margin-top:40px;padding-top:16px;border-top:2px solid #eee;font-size:11px;color:#999;text-align:center;">
    PPM Dashboard — Informe generado automáticamente el ${formatDate(new Date().toISOString())} a las ${new Date().toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}
  </div>
</body>
</html>`;

    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(html);
      reportWindow.document.close();
    }
  };

  // Open Edit Project Modal with prepopulated values
  const openEditProject = () => {
    setEditProjectForm({
      ...project,
      involvedKus: project.InvolvedKeyUsers?.map(k => k.id_ku) || [],
      comSemanalKus: project.ComSemanalKUs?.map(k => k.id_ku) || [],
      comMensualKus: project.ComMensualKUs?.map(k => k.id_ku) || [],
      comSteercoKus: project.ComSteerCoKUs?.map(k => k.id_ku) || []
    });
    setEditProjectError('');
    setShowEditProjectModal(true);
  };

  // Submit Project Updates
  const handleUpdateProjectSubmit = (e) => {
    e.preventDefault();
    setEditProjectError('');

    if (editProjectForm.es_capex && (!editProjectForm.codigo_capex || editProjectForm.codigo_capex.trim() === '')) {
      setEditProjectError('El código CAPEX es obligatorio para proyectos CAPEX.');
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(editProjectForm)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al actualizar el proyecto');
        return d;
      })
      .then(() => {
        setShowEditProjectModal(false);
        fetchProjectData();
      })
      .catch(err => setEditProjectError(err.message));
  };

  // Quick updates for dropdown changes (RAG / State)
  const handleUpdateProject = (fieldsToUpdate) => {
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(fieldsToUpdate)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al actualizar el proyecto');
        return d;
      })
      .then(() => {
        fetchProjectData();
      })
      .catch(err => alert(err.message));
  };

  // Handle updates to key users selections in project edit form
  const handleKeyUserToggle = (listName, kuId) => {
    setEditProjectForm(prev => {
      const list = prev[listName] || [];
      const updated = list.includes(kuId) 
        ? list.filter(id => id !== kuId) 
        : [...list, kuId];
      return { ...prev, [listName]: updated };
    });
  };

  // ==========================================
  // INVOICES (Facturas) CRUD
  // ==========================================
  const openAddInvoice = () => {
    setEditingInvoice(null);
    setInvoiceForm({ id_interno_factura: '', id_proveedor: project.id_proveedor.toString(), numero_factura: '', concepto: '', fecha_factura: new Date().toISOString().split('T')[0], importe: '', estado: 'PENDIENTE_DE_RECIBIR', PO: '' });
    setInvoiceError('');
    setShowInvoiceModal(true);
  };

  const openEditInvoice = (fac) => {
    setEditingInvoice(fac);
    setInvoiceForm({
      id_interno_factura: fac.id_interno_factura,
      id_proveedor: fac.id_proveedor.toString(),
      numero_factura: fac.numero_factura,
      concepto: fac.concepto,
      fecha_factura: fac.fecha_factura,
      importe: fac.importe.toString(),
      estado: fac.estado,
      PO: fac.PO || ''
    });
    setInvoiceError('');
    setShowInvoiceModal(true);
  };

  const handleInvoiceSubmit = (e) => {
    e.preventDefault();
    setInvoiceError('');

    if (!invoiceForm.numero_factura || !invoiceForm.id_proveedor || !invoiceForm.concepto || !invoiceForm.fecha_factura || !invoiceForm.importe) {
      setInvoiceError('Todos los campos son obligatorios.');
      return;
    }

    const payload = {
      ...invoiceForm,
      id_proyecto: projectId,
      id_proveedor: parseInt(invoiceForm.id_proveedor, 10),
      importe: parseFloat(invoiceForm.importe)
    };

    const isEdit = !!editingInvoice;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/invoices/${editingInvoice.id_interno_factura}` 
      : `${import.meta.env.VITE_API_URL}/invoices`;
    const method = isEdit ? 'PUT' : 'POST';

    // Clean up empty ID if creating to trigger auto-generation
    if (!isEdit && (!payload.id_interno_factura || payload.id_interno_factura.trim() === '')) {
      delete payload.id_interno_factura;
    }

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al guardar factura');
        return d;
      })
      .then(() => {
        setShowInvoiceModal(false);
        fetchProjectData();
      })
      .catch(err => setInvoiceError(err.message));
  };

  const handleDeleteInvoice = (facId) => {
    if (!window.confirm('¿Seguro que desea eliminar esta factura?')) return;
    fetch(`${import.meta.env.VITE_API_URL}/invoices/${facId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(() => fetchProjectData())
      .catch(err => console.error(err));
  };

  // ==========================================
  // SCOPE CHANGES (CR) CRUD
  // ==========================================
  const openAddCr = () => {
    setEditingCr(null);
    setCrForm({ id_cambio: '', fecha_solicitud: new Date().toISOString().split('T')[0], id_solicitante_ku: '', id_aprobador_ku: '', descripcion_motivo: '', impacta_importe: false, importe_impacto: '0', impacta_tiempo: false, dias_impacto: '0', estado_cambio: 'SOLICITADO' });
    setCrError('');
    setShowCrModal(true);
  };

  const openEditCr = (cr) => {
    setEditingCr(cr);
    setCrForm({
      id_cambio: cr.id_cambio,
      fecha_solicitud: cr.fecha_solicitud,
      id_solicitante_ku: cr.id_solicitante_ku.toString(),
      id_aprobador_ku: cr.id_aprobador_ku.toString(),
      descripcion_motivo: cr.descripcion_motivo,
      impacta_importe: cr.impacta_importe,
      importe_impacto: cr.importe_impacto.toString(),
      impacta_tiempo: cr.impacta_tiempo,
      dias_impacto: cr.dias_impacto.toString(),
      estado_cambio: cr.estado_cambio
    });
    setCrError('');
    setShowCrModal(true);
  };

  const handleCrSubmit = (e) => {
    e.preventDefault();
    setCrError('');

    if (!crForm.fecha_solicitud || !crForm.id_solicitante_ku || !crForm.id_aprobador_ku || !crForm.descripcion_motivo) {
      setCrError('Rellene los campos obligatorios.');
      return;
    }

    const payload = {
      ...crForm,
      id_proyecto: projectId,
      id_solicitante_ku: parseInt(crForm.id_solicitante_ku, 10),
      id_aprobador_ku: parseInt(crForm.id_aprobador_ku, 10),
      importe_impacto: crForm.impacta_importe ? parseFloat(crForm.importe_impacto) : 0,
      dias_impacto: crForm.impacta_tiempo ? parseInt(crForm.dias_impacto, 10) : 0
    };

    const isEdit = !!editingCr;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/scope-changes/${editingCr.id_cambio}` 
      : `${import.meta.env.VITE_API_URL}/scope-changes`;
    const method = isEdit ? 'PUT' : 'POST';

    if (!isEdit && (!payload.id_cambio || payload.id_cambio.trim() === '')) {
      delete payload.id_cambio;
    }

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al guardar cambio de alcance');
        return d;
      })
      .then(() => {
        setShowCrModal(false);
        fetchProjectData();
      })
      .catch(err => setCrError(err.message));
  };

  // Quick Resolve CR (approve/reject from list buttons)
  const handleResolveCr = (crId, newState) => {
    fetch(`${import.meta.env.VITE_API_URL}/scope-changes/${crId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        estado_cambio: newState, 
        fecha_resolucion: new Date().toISOString().split('T')[0] 
      })
    })
      .then(() => fetchProjectData())
      .catch(err => console.error(err));
  };

  // ==========================================
  // RISKS (Riesgos) CRUD
  // ==========================================
  const openAddRisk = () => {
    setEditingRisk(null);
    setRiskForm({ id_riesgo: '', titulo_riesgo: '', descripcion: '', probabilidad: 'MEDIA', impacto: 'MEDIA', plan_mitigacion: '', estado_riesgo: 'ACTIVO', fecha_proxima_revision: new Date().toISOString().split('T')[0] });
    setRiskError('');
    setShowRiskModal(true);
  };

  const openEditRisk = (rsg) => {
    setEditingRisk(rsg);
    setRiskForm({
      id_riesgo: rsg.id_riesgo,
      titulo_riesgo: rsg.titulo_riesgo,
      descripcion: rsg.descripcion,
      probabilidad: rsg.probabilidad,
      impacto: rsg.impacto,
      plan_mitigacion: rsg.plan_mitigacion,
      estado_riesgo: rsg.estado_riesgo,
      fecha_proxima_revision: rsg.fecha_proxima_revision
    });
    setRiskError('');
    setShowRiskModal(true);
  };

  const handleRiskSubmit = (e) => {
    e.preventDefault();
    setRiskError('');

    if (!riskForm.titulo_riesgo || !riskForm.descripcion || !riskForm.plan_mitigacion || !riskForm.fecha_proxima_revision) {
      setRiskError('Todos los campos obligatorios son necesarios.');
      return;
    }

    const payload = { ...riskForm, id_proyecto: projectId };
    const isEdit = !!editingRisk;
    const url = isEdit ? `${import.meta.env.VITE_API_URL}/risks/${editingRisk.id_riesgo}` : `${import.meta.env.VITE_API_URL}/risks`;
    const method = isEdit ? 'PUT' : 'POST';

    if (!isEdit && (!payload.id_riesgo || payload.id_riesgo.trim() === '')) {
      delete payload.id_riesgo;
    }

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        return d;
      })
      .then(() => {
        setShowRiskModal(false);
        fetchProjectData();
      })
      .catch(err => setRiskError(err.message));
  };

  const handleToggleRiskState = (riskId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVO' ? 'CERRADO' : 'ACTIVO';
    fetch(`${import.meta.env.VITE_API_URL}/risks/${riskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado_riesgo: nextStatus })
    })
      .then(() => fetchProjectData())
      .catch(err => console.error(err));
  };

  // ==========================================
  // INCIDENCIAS (Issues) CRUD
  // ==========================================
  const openAddIssue = () => {
    setEditingIssue(null);
    setIssueForm({ id_incidencia: '', titulo: '', descripcion: '', tipo_incidencias: 'TECNICA', criticidad: 'MEDIA', estado: 'ABIERTA', fecha_apertura: new Date().toISOString().split('T')[0], fecha_cierre: '', solucion_aplicada: '' });
    setIssueError('');
    setShowIssueModal(true);
  };

  const openEditIssue = (inc) => {
    setEditingIssue(inc);
    setIssueForm({
      id_incidencia: inc.id_incidencia,
      titulo: inc.titulo,
      descripcion: inc.descripcion,
      tipo_incidencias: inc.tipo_incidencias,
      criticidad: inc.criticidad,
      estado: inc.estado,
      fecha_apertura: inc.fecha_apertura,
      fecha_cierre: inc.fecha_cierre || '',
      solucion_aplicada: inc.solucion_aplicada || ''
    });
    setIssueError('');
    setShowIssueModal(true);
  };

  const handleIssueSubmit = (e) => {
    e.preventDefault();
    setIssueError('');

    if (!issueForm.titulo || !issueForm.descripcion || !issueForm.fecha_apertura) {
      setIssueError('Rellene los campos obligatorios.');
      return;
    }

    if (issueForm.estado === 'RESUELTA' && (!issueForm.solucion_aplicada || issueForm.solucion_aplicada.trim() === '')) {
      setIssueError('La solución aplicada es obligatoria cuando la incidencia está RESUELTA.');
      return;
    }

    const payload = { ...issueForm, id_proyecto: projectId };
    const isEdit = !!editingIssue;
    const url = isEdit ? `${import.meta.env.VITE_API_URL}/issues/${editingIssue.id_incidencia}` : `${import.meta.env.VITE_API_URL}/issues`;
    const method = isEdit ? 'PUT' : 'POST';

    if (!isEdit && (!payload.id_incidencia || payload.id_incidencia.trim() === '')) {
      delete payload.id_incidencia;
    }

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        return d;
      })
      .then(() => {
        setShowIssueModal(false);
        fetchProjectData();
      })
      .catch(err => setIssueError(err.message));
  };

  // ==========================================
  // CHECKLIST PM TASKS CRUD
  // ==========================================
  const openAddTask = () => {
    setEditingTask(null);
    setTaskForm({ id_tarea: '', titulo_tarea: '', descripcion: '', es_hito: false, estado: 'PENDIENTE', fecha_limite: new Date().toISOString().split('T')[0] });
    setTaskError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      id_tarea: task.id_tarea,
      titulo_tarea: task.titulo_tarea,
      descripcion: task.descripcion || '',
      es_hito: task.es_hito,
      estado: task.estado,
      fecha_limite: task.fecha_limite
    });
    setTaskError('');
    setShowTaskModal(true);
  };

  
  // 8. Log / Edit Lesson Modal
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({ titulo: '', descripcion: '' });
  const [lessonError, setLessonError] = useState('');

  const openAddLesson = () => {
    setEditingLesson(null);
    setLessonForm({ titulo: '', descripcion: '' });
    setLessonError('');
    setShowLessonModal(true);
  };

  const openEditLesson = (les) => {
    setEditingLesson(les);
    setLessonForm({ titulo: les.titulo, descripcion: les.descripcion || '' });
    setLessonError('');
    setShowLessonModal(true);
  };

  const handleLessonSubmit = (e) => {
    e.preventDefault();
    setLessonError('');
    if (!lessonForm.titulo) {
      setLessonError('El título es obligatorio.');
      return;
    }
    const payload = { ...lessonForm, id_proyecto: projectId };
    const isEdit = !!editingLesson;
    const url = isEdit ? `${import.meta.env.VITE_API_URL}/lessons/${editingLesson.id}` : `${import.meta.env.VITE_API_URL}/lessons`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        return d;
      })
      .then(() => {
        setShowLessonModal(false);
        fetchProjectData();
      })
      .catch(err => setLessonError(err.message));
  };

  const handleDeleteLesson = (lessonId) => {
    if (!window.confirm('¿Seguro que desea eliminar esta lección?')) return;
    fetch(`${import.meta.env.VITE_API_URL}/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(() => fetchProjectData())
      .catch(err => console.error(err));
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    setTaskError('');

    if (!taskForm.titulo_tarea || !taskForm.fecha_limite) {
      setTaskError('Rellene los campos obligatorios.');
      return;
    }

    const payload = { ...taskForm, id_proyecto: projectId };
    const isEdit = !!editingTask;
    const url = isEdit ? `${import.meta.env.VITE_API_URL}/tasks/${editingTask.id_tarea}` : `${import.meta.env.VITE_API_URL}/tasks`;
    const method = isEdit ? 'PUT' : 'POST';

    if (!isEdit) {
      delete payload.id_tarea;
    }

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        return d;
      })
      .then(() => {
        setShowTaskModal(false);
        fetchProjectData();
      })
      .catch(err => setTaskError(err.message));
  };

  const handleToggleTask = (taskId, currentState) => {
    const nextState = currentState === 'PENDIENTE' ? 'COMPLETADA' : 'PENDIENTE';
    fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado: nextState })
    })
      .then(() => fetchProjectData())
      .catch(err => console.error(err));
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm('¿Seguro que desea eliminar esta tarea checklist?')) return;
    fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(() => fetchProjectData())
      .catch(err => console.error(err));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: 16 }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
        <span>Cargando ficha de gobernanza de proyecto...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="m3-card" style={{ textAlign: 'center', padding: 32 }}>
        No se pudo recuperar la ficha del proyecto.
        <button className="m3-btn m3-btn-primary" onClick={onBack} style={{ marginTop: 16 }}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>
    );
  }

  const calc = project.calculations;

  return (
    <div>
      {/* Header with actions & switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="icon-btn" onClick={onBack}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="project-id-badge">{project.id_proyecto}</span>
              {project.es_capex ? (
                <span className="badge badge-blue">CAPEX: {project.codigo_capex || 'Pendiente'}</span>
              ) : (
                <span className="badge badge-orange">OPEX</span>
              )}
            </div>
            <h2 className="page-title" style={{ marginTop: 4 }}>{project.nombre_proyecto}</h2>
          </div>
        </div>

        {/* Global Controls & Edit Project Trigger */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          
          <button 
            className="m3-btn" 
            onClick={() => setShowReportModal(true)}
            style={{ 
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
              color: '#fff', 
              border: 'none',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            title="Generar informe ejecutivo del proyecto"
          >
            <Printer size={16} />
            📄 Generar Informe
          </button>

          <button className="m3-btn m3-btn-primary" onClick={openEditProject}>
            <Edit2 size={16} />
            Editar Proyecto
          </button>

          {/* RAG select quick control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>RAG:</span>
            <select 
              value={project.indicador_rag}
              onChange={(e) => handleUpdateProject({ indicador_rag: e.target.value })}
              className="user-select"
              style={{ width: 'auto', padding: '6px 12px', height: '36px' }}
            >
              <option value="VERDE">VERDE 🟢</option>
              <option value="AMARILLO">AMARILLO 🟡</option>
              <option value="ROJO">ROJO 🔴</option>
            </select>
          </div>

          {/* Estado Workflow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>Fase:</span>
            <select 
              value={project.id_estado || ''}
              onChange={(e) => handleUpdateProject({ id_estado: parseInt(e.target.value, 10) })}
              className="user-select"
              style={{ width: 'auto', padding: '6px 12px', height: '36px' }}
            >
              {workflowStates.map(state => (
                <option key={state.id_estado} value={state.id_estado}>
                  {state.icono} {state.nombre_estado}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="m3-tabs-container">
        <button className={`m3-tab ${activeTab === 'ficha' ? 'active' : ''}`} onClick={() => setActiveTab('ficha')}>
          <FileText size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Ficha General
        </button>
        <button className={`m3-tab ${activeTab === 'finanzas' ? 'active' : ''}`} onClick={() => setActiveTab('finanzas')}>
          <DollarSign size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Control Financiero
        </button>
        <button className={`m3-tab ${activeTab === 'cambios' ? 'active' : ''}`} onClick={() => setActiveTab('cambios')}>
          <TrendingUp size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Cambios de Alcance (CR)
        </button>
        <button className={`m3-tab ${activeTab === 'riesgos' ? 'active' : ''}`} onClick={() => setActiveTab('riesgos')}>
          <ShieldAlert size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Riesgos e Incidencias
        </button>
        <button className={`m3-tab ${activeTab === 'comunicaciones' ? 'active' : ''}`} onClick={() => setActiveTab('comunicaciones')}>
          <MessageSquare size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Comunicaciones
        </button>
        <button className={`m3-tab ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')}>
          <CheckSquare size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Checklist PM
        </button>
        <button className={`m3-tab ${activeTab === 'lecciones' ? 'active' : ''}`} onClick={() => setActiveTab('lecciones')}>
          <BookOpen size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Lecciones Aprendidas
        </button>
      </div>

      {/* Tab Panels */}
      <div className="content-panel" style={{ marginTop: 8 }}>
        
        {/* PANEL: FICHA GENERAL */}
        {activeTab === 'ficha' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="detail-grid-split">
              {/* Left Info */}
              <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 8 }}>Descripción</h3>
                  <p style={{ color: 'var(--md-sys-color-on-surface)', whiteSpace: 'pre-line' }}>{project.descripcion}</p>
                </div>

                <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 20 }}>
                  <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 12 }}>Atributos de Gobernanza</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MapPin size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Sede</div>
                        <div style={{ fontWeight: 500 }}>{project.Sede?.nombre_sede}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Building size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Partner Adjudicatario</div>
                        <span 
                          style={{ fontWeight: 500, textDecoration: 'underline', cursor: 'pointer', color: 'var(--md-sys-color-primary)' }}
                          onClick={() => onViewVendor(project.id_proveedor)}
                        >
                          {project.Proveedor?.nombre_razon_social}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <User size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Gestor Interno PM</div>
                        <div style={{ fontWeight: 500 }}>{project.PM?.nombre} {project.PM?.apellidos}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <User size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Sponsor / Key User Líder</div>
                        <div style={{ fontWeight: 500 }}>{project.Sponsor?.nombre} {project.Sponsor?.apellidos}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Calendar size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Fechas de Proyecto</div>
                        <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                          Inicio: {project.fecha_inicio} <br />
                          Fin Base: {project.fecha_fin_inicial} <br />
                          Fin Est.: <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 'bold' }}>{calc?.fecha_fin_estimada}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Key Users Involved */}
              <div className="m3-card glass-panel">
                <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 16 }}>Key Users Involucrados</h3>
                {project.InvolvedKeyUsers?.length === 0 ? (
                  <p style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.9rem' }}>No se han asignado Key Users de negocio a este proyecto.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {project.InvolvedKeyUsers?.map(ku => (
                      <div key={ku.id_ku} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '12px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {ku.nombre[0]}{ku.apellidos[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{ku.nombre} {ku.apellidos}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>{ku.correo}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* TIMELINE MINIATURE */}
            <div className="m3-card glass-panel" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 16 }}>Cronología del Proyecto (Timeline)</h3>
              <div style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12, overflow: 'hidden', height: 400 }}>
                <Timeline projectId={projectId} hideHeader={true} />
              </div>
            </div>

            {/* FEED DE COMENTARIOS AUDITADOS */}
            <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Muro de Comunicación del Proyecto</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)' }}>
                  Historial de comunicaciones y comentarios del proyecto. Soporta pegado de texto enriquecido e imágenes directamente desde Microsoft Outlook.
                </p>
              </div>

              {/* Editor to Add Comment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <RichTextEditor 
                  value={newCommentText} 
                  onChange={setNewCommentText} 
                  placeholder="Escribe un comentario importante o pega contenido directamente aquí..."
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: newCommentImportant ? '2px solid #f59e0b' : '2px solid var(--md-sys-color-outline-variant)',
                      background: newCommentImportant ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                      transition: 'all 0.2s ease',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      userSelect: 'none'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={newCommentImportant} 
                      onChange={(e) => setNewCommentImportant(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <Star size={16} fill={newCommentImportant ? '#f59e0b' : 'none'} color={newCommentImportant ? '#f59e0b' : 'var(--md-sys-color-outline)'} />
                    <span style={{ color: newCommentImportant ? '#d97706' : 'var(--md-sys-color-outline)' }}>
                      {newCommentImportant ? '⭐ Importante (se incluirá en Informe)' : 'Marcar como Importante (Incluir en Informe)'}
                    </span>
                  </label>
                  <button 
                    className="m3-btn m3-btn-primary" 
                    onClick={handleAddComment}
                    disabled={!newCommentText || newCommentText.trim() === '' || newCommentText === '<br>'}
                  >
                    Publicar Comentario
                  </button>
                </div>
              </div>

              {/* Timeline comments feed */}
              <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {commentsLoading ? (
                  <span>Cargando comentarios...</span>
                ) : comments.length === 0 ? (
                  <p style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.9rem', textAlign: 'center', padding: '12px 0' }}>
                    No hay comentarios registrados para este proyecto.
                  </p>
                ) : (
                  comments.map(c => (
                    <div 
                      key={c.id_comentario} 
                      className="comment-bubble"
                      style={{
                        padding: 16,
                        backgroundColor: c.es_importante ? 'rgba(245, 158, 11, 0.06)' : 'var(--md-sys-color-surface-container-high)',
                        borderRadius: '16px',
                        border: c.es_importante ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--md-sys-color-outline-variant)',
                        borderLeft: c.es_importante ? '4px solid #f59e0b' : '1px solid var(--md-sys-color-outline-variant)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        position: 'relative'
                      }}
                    >
                      {/* Comment Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: c.es_importante ? 'rgba(245, 158, 11, 0.2)' : 'var(--md-sys-color-primary-container)',
                            color: c.es_importante ? '#d97706' : 'var(--md-sys-color-on-primary-container)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }}>
                            {c.Autor?.nombre[0] || 'U'}{c.Autor?.apellidos[0] || ''}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.Autor?.nombre} {c.Autor?.apellidos}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', marginLeft: 8 }}>{formatDateTime(c.fecha_registro)}</span>
                          </div>
                          {c.es_importante && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 10px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              color: '#fff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              letterSpacing: '0.03em',
                              textTransform: 'uppercase'
                            }}>
                              <Star size={10} fill="#fff" /> Informe
                            </span>
                          )}
                        </div>

                        {/* Actions: Edit & Delete (Visible to all users) */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            className="icon-btn" 
                            onClick={() => {
                              setEditingCommentId(c.id_comentario);
                              setEditingCommentText(c.texto_comentario);
                              setEditingCommentImportant(!!c.es_importante);
                            }}
                            style={{ width: 28, height: 28, color: 'var(--md-sys-color-primary)' }}
                            title="Editar comentario"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            className="icon-btn" 
                            onClick={() => handleDeleteComment(c.id_comentario)}
                            style={{ width: 28, height: 28, color: 'var(--color-rag-red)' }}
                            title="Eliminar comentario"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Comment Body */}
                      {editingCommentId === c.id_comentario ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                          <RichTextEditor 
                            value={editingCommentText} 
                            onChange={setEditingCommentText} 
                            placeholder="Edita tu comentario..."
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label 
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                padding: '4px 10px', borderRadius: '16px',
                                border: editingCommentImportant ? '2px solid #f59e0b' : '2px solid var(--md-sys-color-outline-variant)',
                                background: editingCommentImportant ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                transition: 'all 0.2s ease', fontSize: '0.8rem', fontWeight: 500, userSelect: 'none'
                              }}
                            >
                              <input type="checkbox" checked={editingCommentImportant} onChange={(e) => setEditingCommentImportant(e.target.checked)} style={{ display: 'none' }} />
                              <Star size={14} fill={editingCommentImportant ? '#f59e0b' : 'none'} color={editingCommentImportant ? '#f59e0b' : 'var(--md-sys-color-outline)'} />
                              <span style={{ color: editingCommentImportant ? '#d97706' : 'var(--md-sys-color-outline)' }}>Importante</span>
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button 
                                className="m3-btn m3-btn-outline" 
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentText('');
                                  setEditingCommentImportant(false);
                                }}
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              >
                                Cancelar
                              </button>
                              <button 
                                className="m3-btn m3-btn-primary" 
                                onClick={() => handleUpdateComment(c.id_comentario)}
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="comment-rich-text"
                          dangerouslySetInnerHTML={{ __html: c.texto_comentario }}
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--md-sys-color-on-surface)',
                            lineHeight: '1.5',
                            wordBreak: 'break-word'
                          }}
                        />
                      )}

                      {/* Audit stamp tooltip / label */}
                      {c.editado && (
                        <div 
                          style={{
                            alignSelf: 'flex-start',
                            fontSize: '0.75rem',
                            color: 'var(--md-sys-color-outline)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'help'
                          }}
                          title={`Editado por ${c.Editor?.nombre} ${c.Editor?.apellidos} el ${formatDateTime(c.fecha_modificacion)}`}
                        >
                          <span style={{ fontStyle: 'italic', textDecoration: 'underline dashed' }}>(Editado)</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PANEL: CONTROL FINANCIERO */}
        {activeTab === 'finanzas' && (
          <div className="detail-grid-split">
            {/* Invoices sub-table */}
            <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Facturas del Proyecto ({project.Facturas?.length || 0})</h3>
                <button className="m3-btn m3-btn-primary" onClick={openAddInvoice}>
                  <Plus size={16} /> Registrar Factura
                </button>
              </div>

              {project.Facturas?.length === 0 ? (
                <p style={{ color: 'var(--md-sys-color-outline)' }}>No se registran facturas emitidas ni cobros pendientes.</p>
              ) : (
                <div className="m3-table-wrapper">
                  <table className="m3-table">
                    <thead>
                      <tr>
                        {renderSortHeader('Cód Interno', 'id_interno_factura', invoicesSort, setInvoicesSort)}
                        {renderSortHeader('Nº Factura', 'numero_factura', invoicesSort, setInvoicesSort)}
                        {renderSortHeader('PO', 'PO', invoicesSort, setInvoicesSort)}
                        {renderSortHeader('Concepto', 'concepto', invoicesSort, setInvoicesSort)}
                        {renderSortHeader('Fecha', 'fecha_factura', invoicesSort, setInvoicesSort)}
                        {renderSortHeader('Importe', 'importe', invoicesSort, setInvoicesSort)}
                        {renderSortHeader('Estado', 'estado', invoicesSort, setInvoicesSort)}
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedData(project.Facturas || [], invoicesSort).map(fac => (
                        <tr key={fac.id_interno_factura}>
                          <td style={{ fontWeight: 700 }}>{fac.id_interno_factura}</td>
                          <td>{fac.numero_factura}</td>
                          <td>{fac.PO || '—'}</td>
                          <td style={{ fontWeight: 500 }}>{fac.concepto}</td>
                          <td>{fac.fecha_factura}</td>
                          <td style={{ fontWeight: 600 }}>{fac.importe.toLocaleString('es-ES')} €</td>
                          <td>
                            <span className={`badge ${fac.estado === 'PAGADA' ? 'badge-green' : 'badge-orange'}`}>
                              {fac.estado.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {/* Edit invoice button (Corrigiendo: permite editar facturas y cambiar estado) */}
                              <button className="icon-btn" onClick={() => openEditInvoice(fac)} style={{ color: 'var(--md-sys-color-primary)' }} title="Editar Factura">
                                <Edit2 size={16} />
                              </button>
                              <button className="icon-btn" onClick={() => handleDeleteInvoice(fac.id_interno_factura)} style={{ color: 'var(--color-rag-red)' }} title="Eliminar Factura">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Financial Calculations metrics */}
            <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Resumen Presupuestario</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--md-sys-color-outline)' }}>Presupuesto Inicial:</span>
                  <span style={{ fontWeight: 600 }}>{parseFloat(project.budget_inicial).toLocaleString('es-ES')} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--md-sys-color-primary)' }}>
                  <span>Desviación Aprobada:</span>
                  <span style={{ fontWeight: 600 }}>
                    {(calc?.budget_actualizado - parseFloat(project.budget_inicial)).toLocaleString('es-ES', { signDisplay: 'always' })} €
                  </span>
                </div>
                <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                  <span style={{ fontWeight: 600 }}>Presupuesto Actualizado:</span>
                  <span style={{ fontWeight: 700 }}>{calc?.budget_actualizado.toLocaleString('es-ES')} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--priority-alta)' }}>
                  <span>Consumo Real Total:</span>
                  <span style={{ fontWeight: 600 }}>{calc?.consumo_real.toLocaleString('es-ES')} €</span>
                </div>
                <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '12px' }}>
                  <span style={{ fontWeight: 600 }}>Presupuesto Disponible:</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: calc?.presupuesto_disponible < 0 ? 'var(--color-rag-red)' : 'var(--color-rag-green)' 
                  }}>
                    {calc?.presupuesto_disponible.toLocaleString('es-ES')} €
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL: CAMBIOS DE ALCANCE (CR) */}
        {activeTab === 'cambios' && (
          <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Registro de Cambios de Alcance (CR)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)' }}>
                  Permite editar cualquier CR existente. Cambiar su estado a APROBADO o actualizar el importe impacta automáticamente al instante los números financieros del proyecto.
                </p>
              </div>
              <button className="m3-btn m3-btn-primary" onClick={openAddCr}>
                <Plus size={16} /> Solicitar Cambio
              </button>
            </div>

            {project.Cambios_Alcances?.length === 0 ? (
              <p style={{ color: 'var(--md-sys-color-outline)' }}>No se registran solicitudes de cambio de alcance para este proyecto.</p>
            ) : (
              <div className="m3-table-wrapper">
                <table className="m3-table">
                  <thead>
                    <tr>
                      {renderSortHeader('Código', 'id_cambio', crSort, setCrSort)}
                      {renderSortHeader('Solicitante / Aprobador', 'Solicitante.nombre', crSort, setCrSort)}
                      {renderSortHeader('Descripción / Motivo', 'descripcion_motivo', crSort, setCrSort)}
                      {renderSortHeader('Importe Impacto', 'importe_impacto', crSort, setCrSort)}
                      {renderSortHeader('Plazo Impacto', 'dias_impacto', crSort, setCrSort)}
                      {renderSortHeader('Estado', 'estado_cambio', crSort, setCrSort)}
                      <th>Acción / Edición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedData(project.Cambios_Alcances || [], crSort).map(cr => (
                      <tr key={cr.id_cambio}>
                        <td style={{ fontWeight: 700 }}>{cr.id_cambio}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>S: {cr.Solicitante?.nombre} {cr.Solicitante?.apellidos}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>A: {cr.Aprobador?.nombre} {cr.Aprobador?.apellidos}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: '0.9rem', maxWidth: '280px' }}>{cr.descripcion_motivo}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', marginTop: 4 }}>Sol: {cr.fecha_solicitud} | Res: {cr.fecha_resolucion || '-'}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: cr.impacta_importe ? (parseFloat(cr.importe_impacto) >= 0 ? 'var(--priority-alta)' : 'var(--color-rag-green)') : 'inherit' }}>
                          {cr.impacta_importe ? `${parseFloat(cr.importe_impacto).toLocaleString('es-ES', { signDisplay: 'always' })} €` : 'Sin impacto'}
                        </td>
                        <td style={{ fontWeight: 600, color: cr.impacta_tiempo ? (parseInt(cr.dias_impacto) >= 0 ? 'var(--priority-alta)' : 'var(--color-rag-green)') : 'inherit' }}>
                          {cr.impacta_tiempo ? `${parseInt(cr.dias_impacto, 10).toLocaleString('es-ES', { signDisplay: 'always' })} días` : 'Sin impacto'}
                        </td>
                        <td>
                          <span className={`badge ${
                            cr.estado_cambio === 'APROBADO' 
                              ? 'badge-green' 
                              : cr.estado_cambio === 'RECHAZADO' 
                                ? 'badge-red' 
                                : 'badge-orange'
                          }`}>
                            {cr.estado_cambio}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {/* Edit CR button (Corrigiendo: permite editar un CR que se haya aprobado o no y cambie el importe/todo) */}
                            <button className="icon-btn" onClick={() => openEditCr(cr)} style={{ color: 'var(--md-sys-color-primary)' }} title="Editar Solicitud">
                              <Edit2 size={16} />
                            </button>

                            {(cr.estado_cambio === 'SOLICITADO') && (
                              <>
                                <button 
                                  className="icon-btn" 
                                  onClick={() => handleResolveCr(cr.id_cambio, 'APROBADO')}
                                  style={{ backgroundColor: 'rgba(48, 209, 88, 0.2)', color: 'var(--color-rag-green)', width: 28, height: 28 }}
                                  title="Aprobar de inmediato"
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  className="icon-btn" 
                                  onClick={() => handleResolveCr(cr.id_cambio, 'RECHAZADO')}
                                  style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)', width: 28, height: 28 }}
                                  title="Rechazar de inmediato"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PANEL: RIESGOS E INCIDENCIAS */}
        {activeTab === 'riesgos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Incidencias (Issues) List */}
            <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Incidencias Técnicas o de Plazos</h3>
                <button className="m3-btn m3-btn-primary" onClick={openAddIssue}>
                  <Plus size={16} /> Registrar Incidencia
                </button>
              </div>

              {project.Incidencias?.length === 0 ? (
                <p style={{ color: 'var(--md-sys-color-outline)' }}>No hay incidencias reportadas.</p>
              ) : (
                <div className="m3-table-wrapper">
                  <table className="m3-table">
                    <thead>
                      <tr>
                        {renderSortHeader('Código', 'id_incidencia', issuesSort, setIssuesSort)}
                        {renderSortHeader('Incidencia / Descripción', 'titulo', issuesSort, setIssuesSort)}
                        {renderSortHeader('Tipo', 'tipo_incidencias', issuesSort, setIssuesSort)}
                        {renderSortHeader('Criticidad', 'criticidad', issuesSort, setIssuesSort)}
                        {renderSortHeader('Estado', 'estado', issuesSort, setIssuesSort)}
                        {renderSortHeader('Apertura / Cierre', 'fecha_apertura', issuesSort, setIssuesSort)}
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedData(project.Incidencias || [], issuesSort).map(inc => (
                        <tr key={inc.id_incidencia}>
                          <td style={{ fontWeight: 700 }}>{inc.id_incidencia}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{inc.titulo}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginTop: 4 }}>{inc.descripcion}</div>
                            {inc.estado === 'RESUELTA' && (
                              <div style={{ marginTop: 8, fontSize: '0.8rem', padding: 8, backgroundColor: 'rgba(48, 209, 88, 0.1)', borderRadius: 8, color: 'var(--color-rag-green)' }}>
                                <strong>Solución:</strong> {inc.solucion_aplicada}
                              </div>
                            )}
                          </td>
                          <td>{inc.tipo_incidencias}</td>
                          <td>
                            <span className={`badge ${
                              inc.criticidad === 'BLOQUEANTE' || inc.criticidad === 'ALTA' 
                                ? 'badge-red' 
                                : inc.criticidad === 'MEDIA' 
                                  ? 'badge-orange' 
                                  : 'badge-green'
                            }`}>
                              {inc.criticidad}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${inc.estado === 'RESUELTA' ? 'badge-green' : inc.estado === 'CANCELADA' ? 'badge-blue' : 'badge-orange'}`}>
                              {inc.estado}
                            </span>
                          </td>
                          <td>
                            <div>A: {inc.fecha_apertura}</div>
                            <div>C: {inc.fecha_cierre || '-'}</div>
                          </td>
                          <td>
                            <button className="m3-btn m3-btn-outline" onClick={() => openEditIssue(inc)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                              <Edit2 size={12} style={{ marginRight: 4 }} /> Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Riesgos list */}
            <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Matriz Preventiva de Riesgos</h3>
                <button className="m3-btn m3-btn-primary" onClick={openAddRisk}>
                  <Plus size={16} /> Identificar Riesgo
                </button>
              </div>

              {project.Riesgos?.length === 0 ? (
                <p style={{ color: 'var(--md-sys-color-outline)' }}>Sin riesgos cargados.</p>
              ) : (
                <div className="m3-table-wrapper">
                  <table className="m3-table">
                    <thead>
                      <tr>
                        {renderSortHeader('Código', 'id_riesgo', risksSort, setRisksSort)}
                        {renderSortHeader('Riesgo / Descripción', 'titulo_riesgo', risksSort, setRisksSort)}
                        {renderSortHeader('Prob. / Imp.', 'probabilidad', risksSort, setRisksSort)}
                        {renderSortHeader('Plan Mitigación', 'plan_mitigacion', risksSort, setRisksSort)}
                        {renderSortHeader('Prox. Rev.', 'fecha_proxima_revision', risksSort, setRisksSort)}
                        {renderSortHeader('Estado', 'estado_riesgo', risksSort, setRisksSort)}
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedData(project.Riesgos || [], risksSort).map(rsg => (
                        <tr key={rsg.id_riesgo} style={{ opacity: rsg.estado_riesgo === 'CERRADO' ? 0.6 : 1 }}>
                          <td style={{ fontWeight: 700 }}>{rsg.id_riesgo}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{rsg.titulo_riesgo}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{rsg.descripcion}</div>
                          </td>
                          <td>P: {rsg.probabilidad} | I: {rsg.impacto}</td>
                          <td style={{ maxWidth: '250px', fontSize: '0.85rem' }}>{rsg.plan_mitigacion}</td>
                          <td>{rsg.fecha_proxima_revision}</td>
                          <td>
                            <button 
                              className={`badge ${rsg.estado_riesgo === 'ACTIVO' ? 'badge-red' : 'badge-green'}`}
                              onClick={() => handleToggleRiskState(rsg.id_riesgo, rsg.estado_riesgo)}
                              style={{ border: 'none', cursor: 'pointer' }}
                            >
                              {rsg.estado_riesgo}
                            </button>
                          </td>
                          <td>
                            <button className="icon-btn" onClick={() => openEditRisk(rsg)} style={{ color: 'var(--md-sys-color-primary)' }}>
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* PANEL: PLANES COMUNICACIONES */}
        {activeTab === 'comunicaciones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {/* Weekly */}
              <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>Plan de Comunicación Semanal</h3>
                  <span className={`badge ${project.com_semanal_activo ? 'badge-green' : 'badge-orange'}`}>
                    {project.com_semanal_activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                {project.com_semanal_activo ? (
                  <>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Finalidad:</div>
                      <p style={{ fontSize: '0.9rem', marginTop: 4 }}>{project.com_semanal_finalidad}</p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 12 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginBottom: 8 }}>Participantes de Negocio:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {project.ComSemanalKUs?.length === 0 ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Sin participantes asignados.</span>
                        ) : (
                          project.ComSemanalKUs?.map(ku => (
                            <div key={ku.id_ku} style={{ fontSize: '0.85rem', fontWeight: 500 }}>• {ku.nombre} {ku.apellidos}</div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.9rem' }}>No se ha configurado seguimiento semanal.</p>
                )}
              </div>

              {/* Monthly */}
              <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>Plan de Comunicación Mensual</h3>
                  <span className={`badge ${project.com_mensual_activo ? 'badge-green' : 'badge-orange'}`}>
                    {project.com_mensual_activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                {project.com_mensual_activo ? (
                  <>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Finalidad:</div>
                      <p style={{ fontSize: '0.9rem', marginTop: 4 }}>{project.com_mensual_finalidad}</p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 12 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginBottom: 8 }}>Participantes de Negocio:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {project.ComMensualKUs?.length === 0 ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Sin participantes asignados.</span>
                        ) : (
                          project.ComMensualKUs?.map(ku => (
                            <div key={ku.id_ku} style={{ fontSize: '0.85rem', fontWeight: 500 }}>• {ku.nombre} {ku.apellidos}</div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.9rem' }}>No se ha configurado seguimiento mensual.</p>
                )}
              </div>

              {/* SteerCo */}
              <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>Comité de Dirección (SteerCo)</h3>
                  <span className={`badge ${project.com_steerco_activo ? 'badge-green' : 'badge-orange'}`}>
                    {project.com_steerco_activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                {project.com_steerco_activo ? (
                  <>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Finalidad:</div>
                      <p style={{ fontSize: '0.9rem', marginTop: 4 }}>{project.com_steerco_finalidad}</p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 12 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginBottom: 8 }}>Participantes de Negocio:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {project.ComSteerCoKUs?.length === 0 ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Sin participantes asignados.</span>
                        ) : (
                          project.ComSteerCoKUs?.map(ku => (
                            <div key={ku.id_ku} style={{ fontSize: '0.85rem', fontWeight: 500 }}>• {ku.nombre} {ku.apellidos}</div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.9rem' }}>No se ha configurado comité ejecutivo SteerCo.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PANEL: CHECKLIST TAREAS */}
        {activeTab === 'checklist' && (
          <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Checklist Interno PM</h3>
              <button className="m3-btn m3-btn-primary" onClick={openAddTask}>
                <Plus size={16} /> Crear Tarea
              </button>
            </div>

            {project.Tareas?.length === 0 ? (
              <p style={{ color: 'var(--md-sys-color-outline)' }}>No hay tareas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 16, padding: '0 12px 8px 12px', borderBottom: '1px solid var(--md-sys-color-outline-variant)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span onClick={() => setTasksSort(prev => ({ key: 'titulo_tarea', direction: prev.key === 'titulo_tarea' && prev.direction === 'asc' ? 'desc' : 'asc' }))} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Tarea {tasksSort.key === 'titulo_tarea' ? (tasksSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.3 }} />}
                  </span>
                  <span style={{ marginLeft: 'auto' }}></span>
                  <span onClick={() => setTasksSort(prev => ({ key: 'fecha_limite', direction: prev.key === 'fecha_limite' && prev.direction === 'asc' ? 'desc' : 'asc' }))} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Fecha Límite {tasksSort.key === 'fecha_limite' ? (tasksSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.3 }} />}
                  </span>
                </div>
                {getSortedData(project.Tareas || [], tasksSort).map(task => (
                  <div key={task.id_tarea} className={`task-item ${task.estado === 'COMPLETADA' ? 'completed' : ''}`}>
                    <div className="task-left">
                      <input 
                        type="checkbox" 
                        checked={task.estado === 'COMPLETADA'} 
                        onChange={() => handleToggleTask(task.id_tarea, task.estado)}
                        className="m3-checkbox"
                        style={{ width: 18, height: 18 }}
                      />
                      <div>
                        <span className={`task-title ${task.estado === 'COMPLETADA' ? 'completed' : ''}`}>
                          {task.titulo_tarea}
                        </span>
                        {task.descripcion && <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>{task.descripcion}</div>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {task.es_hito && <span className="badge badge-blue">HITO</span>}
                      <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Limite: {task.fecha_limite}</span>
                      <button className="icon-btn" onClick={() => openEditTask(task)} style={{ color: 'var(--md-sys-color-primary)', width: 28, height: 28 }}>
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-btn" onClick={() => handleDeleteTask(task.id_tarea)} style={{ color: 'var(--color-rag-red)', width: 28, height: 28 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANEL: LECCIONES APRENDIDAS */}
        {activeTab === 'lecciones' && (
          <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Lecciones Aprendidas del Proyecto</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)' }}>
                  Buenas prácticas y errores a evitar documentados en este proyecto.
                </p>
              </div>
              <button className="m3-btn m3-btn-primary" onClick={openAddLesson}>
                <Plus size={16} style={{ marginRight: 8 }} /> Registrar Lección
              </button>
            </div>

            {(!project.Lecciones_Aprendidas && !project.LeccionesAprendidas || (project.Lecciones_Aprendidas || project.LeccionesAprendidas || []).length === 0) ? (
              <p style={{ color: 'var(--md-sys-color-outline)', textAlign: 'center', padding: '24px 0' }}>
                No se han registrado lecciones aprendidas en este proyecto.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
                {getSortedData(project.Lecciones_Aprendidas || project.LeccionesAprendidas || [], lessonsSort).map(lesson => (
                  <div key={lesson.id_leccion} style={{ padding: 20, backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '16px', border: '1px solid var(--md-sys-color-outline-variant)', position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', gap: 8 }}>
                      <button className="icon-btn" onClick={() => openEditLesson(lesson)} style={{ color: 'var(--md-sys-color-primary)', width: 24, height: 24 }} title="Editar lección">
                        <Edit2 size={12} />
                      </button>
                      <button className="icon-btn" onClick={() => handleDeleteLesson(lesson.id_leccion)} style={{ color: 'var(--color-rag-red)', width: 24, height: 24 }} title="Eliminar lección">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                      <span className="project-id-badge">{lesson.id_leccion}</span>
                      <span className={`badge ${lesson.tipo_leccion === 'BUENA_PRACTICA' ? 'badge-green' : 'badge-red'}`}>
                        {lesson.tipo_leccion === 'BUENA_PRACTICA' ? 'Buena Práctica' : 'Error a Evitar'}
                      </span>
                    </div>
                    <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 8 }}>{lesson.titulo}</h4>
                    {lesson.contexto && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', marginBottom: 8 }}>
                        <strong>Contexto:</strong> {lesson.contexto}
                      </p>
                    )}
                    {lesson.recomendacion_futura && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface)' }}>
                        <strong>Recomendación futura:</strong> {lesson.recomendacion_futura}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* --- ALL EDIT & CREATE MODAL DIALOGS --- */}
      {/* ======================================================== */}

      {/* 1. Edit Project Settings Modal ("Editar todo" - capex, ku, com plan...) */}
      {showEditProjectModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Ficha de Gobernanza del Proyecto</h3>
              <button className="icon-btn" onClick={() => setShowEditProjectModal(false)}>✕</button>
            </div>

            {editProjectError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
                {editProjectError}
              </div>
            )}

            <form onSubmit={handleUpdateProjectSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
                
                {/* Nombre */}
                <div className="form-group">
                  <label className="form-label">Nombre del Proyecto *</label>
                  <input 
                    type="text" 
                    value={editProjectForm.nombre_proyecto || ''}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, nombre_proyecto: e.target.value })}
                    required
                    className="m3-input"
                  />
                </div>

                {/* Sede */}
                <div className="form-group">
                  <label className="form-label">Sede *</label>
                  <select 
                    value={editProjectForm.id_sede || ''}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, id_sede: parseInt(e.target.value, 10) })}
                    required
                    className="user-select"
                  >
                    {sedes.map(s => (
                      <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>
                    ))}
                  </select>
                </div>

                {/* Proveedor */}
                <div className="form-group">
                  <label className="form-label">Socio Tecnológico *</label>
                  <select 
                    value={editProjectForm.id_proveedor || ''}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, id_proveedor: parseInt(e.target.value, 10) })}
                    required
                    className="user-select"
                  >
                    {vendors.map(v => (
                      <option key={v.id_proveedor} value={v.id_proveedor}>{v.nombre_razon_social}</option>
                    ))}
                  </select>
                </div>

                {/* PM Asignado */}
                <div className="form-group">
                  <label className="form-label">PM Asignado *</label>
                  <select 
                    value={editProjectForm.id_pm || ''}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, id_pm: parseInt(e.target.value, 10) })}
                    required
                    className="user-select"
                  >
                    {pms.map(p => (
                      <option key={p.id_usuario} value={p.id_usuario}>{p.nombre} {p.apellidos}</option>
                    ))}
                  </select>
                </div>

                {/* Sponsor */}
                <div className="form-group">
                  <label className="form-label">Sponsor / KU Líder *</label>
                  <SearchableKeyUserSelect 
                    keyUsers={keyUsers}
                    selected={editProjectForm.id_sponsor_ku}
                    onChange={(val) => setEditProjectForm(prev => ({ ...prev, id_sponsor_ku: val }))}
                    multiple={false}
                    placeholder="Seleccione Sponsor / Key User Líder..."
                  />
                </div>

                {/* Fechas */}
                <div className="form-group">
                  <label className="form-label">Fecha de Inicio *</label>
                  <input 
                    type="date" 
                    value={editProjectForm.fecha_inicio || ''}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, fecha_inicio: e.target.value })}
                    required
                    className="m3-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha Fin Inicial (Inmutable Línea Base) *</label>
                  <input 
                    type="date" 
                    value={editProjectForm.fecha_fin_inicial || ''}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, fecha_fin_inicial: e.target.value })}
                    required
                    className="m3-input"
                  />
                </div>

                {/* Presupuesto Inicial */}
                <div className="form-group">
                  <label className="form-label">Presupuesto Inicial (€) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editProjectForm.budget_inicial || ''}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, budget_inicial: parseFloat(e.target.value) })}
                    required
                    className="m3-input"
                  />
                </div>

                {/* CAPEX Toggle (Corrigiendo: cambiar Nº Capex si no lo se) */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="m3-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={!!editProjectForm.es_capex}
                      onChange={(e) => setEditProjectForm({ ...editProjectForm, es_capex: e.target.checked })}
                      className="m3-checkbox"
                    />
                    <span>¿Es Proyecto CAPEX?</span>
                  </label>
                </div>

                {editProjectForm.es_capex && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Código CAPEX *</label>
                    <input 
                      type="text" 
                      value={editProjectForm.codigo_capex || ''}
                      onChange={(e) => setEditProjectForm({ ...editProjectForm, codigo_capex: e.target.value })}
                      placeholder="CPX-9988"
                      required={editProjectForm.es_capex}
                      className="m3-input"
                    />
                  </div>
                )}

                {/* Involved Key Users */}
                <div className="form-group" style={{ gridColumn: 'span 2', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16 }}>
                  <label className="form-label" style={{ marginBottom: 8 }}>Key Users de negocio Involucrados</label>
                  <SearchableKeyUserSelect 
                    keyUsers={keyUsers}
                    selected={editProjectForm.involvedKus || []}
                    onChange={(val) => setEditProjectForm(prev => ({ ...prev, involvedKus: val }))}
                    multiple={true}
                    placeholder="Seleccione Key Users Involucrados..."
                  />
                </div>

                {/* Weekly Plan */}
                <div className="form-group" style={{ gridColumn: 'span 2', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16 }}>
                  <label className="m3-checkbox-label" style={{ fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={!!editProjectForm.com_semanal_activo}
                      onChange={(e) => setEditProjectForm({ ...editProjectForm, com_semanal_activo: e.target.checked })}
                      className="m3-checkbox"
                    />
                    <span>Activar Plan de Comunicación Semanal</span>
                  </label>
                  {editProjectForm.com_semanal_activo && (
                    <>
                      <input 
                        type="text" 
                        value={editProjectForm.com_semanal_finalidad || ''}
                        onChange={(e) => setEditProjectForm({ ...editProjectForm, com_semanal_finalidad: e.target.value })}
                        placeholder="Finalidad del seguimiento semanal..."
                        className="m3-input"
                        style={{ marginTop: 6 }}
                      />
                      <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginBottom: 8 }}>Participantes Semanales:</div>
                      <SearchableKeyUserSelect 
                        keyUsers={keyUsers}
                        selected={editProjectForm.comSemanalKus || []}
                        onChange={(val) => setEditProjectForm(prev => ({ ...prev, comSemanalKus: val }))}
                        multiple={true}
                        placeholder="Seleccione Participantes Semanales..."
                      />
                    </>
                  )}
                </div>

                {/* Monthly Plan */}
                <div className="form-group" style={{ gridColumn: 'span 2', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16 }}>
                  <label className="m3-checkbox-label" style={{ fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={!!editProjectForm.com_mensual_activo}
                      onChange={(e) => setEditProjectForm({ ...editProjectForm, com_mensual_activo: e.target.checked })}
                      className="m3-checkbox"
                    />
                    <span>Activar Plan de Comunicación Mensual</span>
                  </label>
                  {editProjectForm.com_mensual_activo && (
                    <>
                      <input 
                        type="text" 
                        value={editProjectForm.com_mensual_finalidad || ''}
                        onChange={(e) => setEditProjectForm({ ...editProjectForm, com_mensual_finalidad: e.target.value })}
                        placeholder="Finalidad del seguimiento mensual..."
                        className="m3-input"
                        style={{ marginTop: 6 }}
                      />
                      <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginBottom: 8 }}>Participantes Mensuales:</div>
                      <SearchableKeyUserSelect 
                        keyUsers={keyUsers}
                        selected={editProjectForm.comMensualKus || []}
                        onChange={(val) => setEditProjectForm(prev => ({ ...prev, comMensualKus: val }))}
                        multiple={true}
                        placeholder="Seleccione Participantes Mensuales..."
                      />
                    </>
                  )}
                </div>

                {/* SteerCo Plan */}
                <div className="form-group" style={{ gridColumn: 'span 2', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16 }}>
                  <label className="m3-checkbox-label" style={{ fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={!!editProjectForm.com_steerco_activo}
                      onChange={(e) => setEditProjectForm({ ...editProjectForm, com_steerco_activo: e.target.checked })}
                      className="m3-checkbox"
                    />
                    <span>Activar Comité de Dirección (SteerCo)</span>
                  </label>
                  {editProjectForm.com_steerco_activo && (
                    <>
                      <input 
                        type="text" 
                        value={editProjectForm.com_steerco_finalidad || ''}
                        onChange={(e) => setEditProjectForm({ ...editProjectForm, com_steerco_finalidad: e.target.value })}
                        placeholder="Finalidad del comité directivo..."
                        className="m3-input"
                        style={{ marginTop: 6 }}
                      />
                      <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginBottom: 8 }}>Participantes SteerCo:</div>
                      <SearchableKeyUserSelect 
                        keyUsers={keyUsers}
                        selected={editProjectForm.comSteercoKus || []}
                        onChange={(val) => setEditProjectForm(prev => ({ ...prev, comSteercoKus: val }))}
                        multiple={true}
                        placeholder="Seleccione Participantes SteerCo..."
                      />
                    </>
                  )}
                </div>

                {/* Descripción */}
                <div className="form-group" style={{ gridColumn: 'span 2', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16 }}>
                  <label className="form-label">Descripción Detallada *</label>
                  <textarea 
                    value={editProjectForm.descripcion || ''}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, descripcion: e.target.value })}
                    required
                    rows={4}
                    className="m3-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="m3-btn m3-btn-outline" onClick={() => setShowEditProjectModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="m3-btn m3-btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Log / Edit Invoice Modal (Corrigiendo: permite crear y editar facturas e importes con códigos automáticos) */}
      {showInvoiceModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingInvoice ? 'Editar Factura / Cobro' : 'Registrar Factura / Cobro'}</h3>
              <button className="icon-btn" onClick={() => setShowInvoiceModal(false)}>✕</button>
            </div>

            {invoiceError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
                {invoiceError}
              </div>
            )}

            <form onSubmit={handleInvoiceSubmit}>
              
              {/* ID Factura (Opcional si es creación, deshabilitado si es edición) */}
              <div className="form-group">
                <label className="form-label">ID Factura Interno (Format: FAC-YYYY-XXX)</label>
                <input 
                  type="text" 
                  value={invoiceForm.id_interno_factura}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, id_interno_factura: e.target.value })}
                  placeholder="Auto-generado (Ej. FAC-2026-005)"
                  disabled={!!editingInvoice}
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Socio Emisor (Proveedor) *</label>
                <select 
                  value={invoiceForm.id_proveedor}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, id_proveedor: e.target.value })}
                  required
                  className="user-select"
                >
                  <option value="">Seleccione Emisor</option>
                  {vendors.map(v => (
                    <option key={v.id_proveedor} value={v.id_proveedor}>{v.nombre_razon_social}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nº Factura Oficial del Socio *</label>
                <input 
                  type="text" 
                  value={invoiceForm.numero_factura}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, numero_factura: e.target.value })}
                  placeholder="FAC-SOP-2026-022"
                  required
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">PO (Purchase Order) ERP</label>
                <input 
                  type="text" 
                  value={invoiceForm.PO}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, PO: e.target.value })}
                  placeholder="Ej. PO-2026-00145"
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Concepto de Cobro *</label>
                <input 
                  type="text" 
                  value={invoiceForm.concepto}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, concepto: e.target.value })}
                  placeholder="Entregable del Core Contable"
                  required
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Emisión *</label>
                <input 
                  type="date" 
                  value={invoiceForm.fecha_factura}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, fecha_factura: e.target.value })}
                  required
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Importe Facturado (€) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={invoiceForm.importe}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, importe: e.target.value })}
                  placeholder="15000.00"
                  required
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estado de Cobro (Corrigiendo: facturas para cambiarles el estado) *</label>
                <select 
                  value={invoiceForm.estado}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, estado: e.target.value })}
                  className="user-select"
                >
                  <option value="PENDIENTE_DE_RECIBIR">PENDIENTE DE RECIBIR</option>
                  <option value="PAGADA">PAGADA</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="m3-btn m3-btn-outline" onClick={() => setShowInvoiceModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="m3-btn m3-btn-primary">
                  {editingInvoice ? 'Guardar Cambios' : 'Registrar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Log / Edit Scope Change (CR) Modal (Corrigiendo: un CR que se haya aprobado o no y cambie el importe) */}
      {showCrModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCr ? 'Editar Solicitud de Cambio (CR)' : 'Registrar Solicitud de Cambio (CR)'}</h3>
              <button className="icon-btn" onClick={() => setShowCrModal(false)}>✕</button>
            </div>

            {crError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
                {crError}
              </div>
            )}

            <form onSubmit={handleCrSubmit}>
              
              {/* ID Cambio de Alcance (Opcional en creación, deshabilitado en edición) */}
              <div className="form-group">
                <label className="form-label">ID Cambio de Alcance (Format: CR-YYYY-XXX)</label>
                <input 
                  type="text" 
                  value={crForm.id_cambio}
                  onChange={(e) => setCrForm({ ...crForm, id_cambio: e.target.value })}
                  placeholder="Auto-generado (Ej. CR-2026-005)"
                  disabled={!!editingCr}
                  className="m3-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Key User Solicitante *</label>
                  <select 
                    value={crForm.id_solicitante_ku}
                    onChange={(e) => setCrForm({ ...crForm, id_solicitante_ku: e.target.value })}
                    required
                    className="user-select"
                  >
                    <option value="">Seleccione Solicitante</option>
                    {keyUsers.map(ku => (
                      <option key={ku.id_ku} value={ku.id_ku}>{ku.nombre} {ku.apellidos}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Key User Aprobador *</label>
                  <select 
                    value={crForm.id_aprobador_ku}
                    onChange={(e) => setCrForm({ ...crForm, id_aprobador_ku: e.target.value })}
                    required
                    className="user-select"
                  >
                    <option value="">Seleccione Aprobador</option>
                    {keyUsers.map(ku => (
                      <option key={ku.id_ku} value={ku.id_ku}>{ku.nombre} {ku.apellidos}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Solicitud *</label>
                  <input 
                    type="date" 
                    value={crForm.fecha_solicitud}
                    onChange={(e) => setCrForm({ ...crForm, fecha_solicitud: e.target.value })}
                    required
                    className="m3-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estado de Solicitud (Corrigiendo: cambiar si está aprobado o no) *</label>
                  <select 
                    value={crForm.estado_cambio}
                    onChange={(e) => setCrForm({ ...crForm, estado_cambio: e.target.value })}
                    className="user-select"
                  >
                    <option value="SOLICITADO">SOLICITADO</option>
                    <option value="APROBADO">APROBADO</option>
                    <option value="RECHAZADO">RECHAZADO</option>
                  </select>
                </div>
              </div>

              {/* Switches of impact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '16px 0' }}>
                <div className="form-group">
                  <label className="m3-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={crForm.impacta_importe}
                      onChange={(e) => setCrForm({ ...crForm, impacta_importe: e.target.checked })}
                      className="m3-checkbox"
                    />
                    <span>¿Impacta Importe?</span>
                  </label>
                  {crForm.impacta_importe && (
                    <input 
                      type="number" 
                      step="0.01"
                      value={crForm.importe_impacto}
                      onChange={(e) => setCrForm({ ...crForm, importe_impacto: e.target.value })}
                      placeholder="Importe +/- (€)"
                      required={crForm.impacta_importe}
                      className="m3-input"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="m3-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={crForm.impacta_tiempo}
                      onChange={(e) => setCrForm({ ...crForm, impacta_tiempo: e.target.checked })}
                      className="m3-checkbox"
                    />
                    <span>¿Impacta Plazos?</span>
                  </label>
                  {crForm.impacta_tiempo && (
                    <input 
                      type="number" 
                      value={crForm.dias_impacto}
                      onChange={(e) => setCrForm({ ...crForm, dias_impacto: e.target.value })}
                      placeholder="Días +/-"
                      required={crForm.impacta_tiempo}
                      className="m3-input"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción Detallada / Justificación *</label>
                <textarea 
                  value={crForm.descripcion_motivo}
                  onChange={(e) => setCrForm({ ...crForm, descripcion_motivo: e.target.value })}
                  placeholder="Detalles sobre por qué se solicita esta ampliación del alcance y sus impactos técnicos..."
                  required
                  rows={3}
                  className="m3-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="m3-btn m3-btn-outline" onClick={() => setShowCrModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="m3-btn m3-btn-primary">
                  {editingCr ? 'Guardar Cambios' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Log / Edit Risk Modal */}
      {showRiskModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingRisk ? 'Editar Riesgo Preventivo' : 'Identificar Riesgo Preventivo'}</h3>
              <button className="icon-btn" onClick={() => setShowRiskModal(false)}>✕</button>
            </div>

            {riskError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
                {riskError}
              </div>
            )}

            <form onSubmit={handleRiskSubmit}>
              <div className="form-group">
                <label className="form-label">ID Riesgo (Format: RSG-YYYY-XXX)</label>
                <input 
                  type="text" 
                  value={riskForm.id_riesgo}
                  onChange={(e) => setRiskForm({ ...riskForm, id_riesgo: e.target.value })}
                  placeholder="Auto-generado (Ej. RSG-2026-004)"
                  disabled={!!editingRisk}
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Título del Riesgo *</label>
                <input 
                  type="text" 
                  value={riskForm.titulo_riesgo}
                  onChange={(e) => setRiskForm({ ...riskForm, titulo_riesgo: e.target.value })}
                  placeholder="Fuga de perfiles clave"
                  required
                  className="m3-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Probabilidad *</label>
                  <select 
                    value={riskForm.probabilidad}
                    onChange={(e) => setRiskForm({ ...riskForm, probabilidad: e.target.value })}
                    className="user-select"
                  >
                    <option value="BAJA">BAJA</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="ALTA">ALTA</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Impacto *</label>
                  <select 
                    value={riskForm.impacto}
                    onChange={(e) => setRiskForm({ ...riskForm, impacto: e.target.value })}
                    className="user-select"
                  >
                    <option value="BAJA">BAJA</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="ALTA">ALTA</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado *</label>
                  <select 
                    value={riskForm.estado_riesgo}
                    onChange={(e) => setRiskForm({ ...riskForm, estado_riesgo: e.target.value })}
                    className="user-select"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="CERRADO">CERRADO</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción del Evento de Riesgo</label>
                <textarea 
                  value={riskForm.descripcion}
                  onChange={(e) => setRiskForm({ ...riskForm, descripcion: e.target.value })}
                  placeholder="Detalles sobre qué podría pasar..."
                  rows={2}
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Plan de Mitigación / Contingencia *</label>
                <textarea 
                  value={riskForm.plan_mitigacion}
                  onChange={(e) => setRiskForm({ ...riskForm, plan_mitigacion: e.target.value })}
                  placeholder="Qué se hará..."
                  required
                  rows={2}
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Próxima Revisión *</label>
                <input 
                  type="date" 
                  value={riskForm.fecha_proxima_revision}
                  onChange={(e) => setRiskForm({ ...riskForm, fecha_proxima_revision: e.target.value })}
                  required
                  className="m3-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="m3-btn m3-btn-outline" onClick={() => setShowRiskModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="m3-btn m3-btn-primary">
                  {editingRisk ? 'Guardar Cambios' : 'Registrar Riesgo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Log / Edit Incident Modal (with solution applied required validations) */}
      {showIssueModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingIssue ? 'Editar Incidencia' : 'Registrar Incidencia'}</h3>
              <button className="icon-btn" onClick={() => setShowIssueModal(false)}>✕</button>
            </div>

            {issueError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
                {issueError}
              </div>
            )}

            <form onSubmit={handleIssueSubmit}>
              <div className="form-group">
                <label className="form-label">ID Incidencia (Format: INC-YYYY-XXX)</label>
                <input 
                  type="text" 
                  value={issueForm.id_incidencia}
                  onChange={(e) => setIssueForm({ ...issueForm, id_incidencia: e.target.value })}
                  placeholder="Auto-generado (Ej. INC-2026-004)"
                  disabled={!!editingIssue}
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Título de Incidencia *</label>
                <input 
                  type="text" 
                  value={issueForm.titulo}
                  onChange={(e) => setIssueForm({ ...issueForm, titulo: e.target.value })}
                  placeholder="Bloqueo de base de datos"
                  required
                  className="m3-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Incidencia *</label>
                  <select 
                    value={issueForm.tipo_incidencias}
                    onChange={(e) => setIssueForm({ ...issueForm, tipo_incidencias: e.target.value })}
                    className="user-select"
                  >
                    <option value="TECNICA">TECNICA</option>
                    <option value="RETRASO_PLAZOS">RETRASO PLAZOS</option>
                    <option value="PROVEEDOR_DESAPARECIDO">PROVEEDOR DESAPARECIDO</option>
                    <option value="PRESUPUESTARIA">PRESUPUESTARIA</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Criticidad *</label>
                  <select 
                    value={issueForm.criticidad}
                    onChange={(e) => setIssueForm({ ...issueForm, criticidad: e.target.value })}
                    className="user-select"
                  >
                    <option value="BAJA">BAJA</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="ALTA">ALTA</option>
                    <option value="BLOQUEANTE">BLOQUEANTE</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Apertura *</label>
                  <input 
                    type="date" 
                    value={issueForm.fecha_apertura}
                    onChange={(e) => setIssueForm({ ...issueForm, fecha_apertura: e.target.value })}
                    required
                    className="m3-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Cierre (Manual)</label>
                  <input 
                    type="date" 
                    value={issueForm.fecha_cierre}
                    onChange={(e) => setIssueForm({ ...issueForm, fecha_cierre: e.target.value })}
                    className="m3-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estado de la Incidencia *</label>
                  <select 
                    value={issueForm.estado}
                    onChange={(e) => setIssueForm({ ...issueForm, estado: e.target.value })}
                    className="user-select"
                  >
                    <option value="ABIERTA">ABIERTA</option>
                    <option value="EN_PROCESO">EN PROCESO</option>
                    <option value="RESUELTA">RESUELTA 🟢</option>
                    <option value="CANCELADA">CANCELADA</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción detallada *</label>
                <textarea 
                  value={issueForm.descripcion}
                  onChange={(e) => setIssueForm({ ...issueForm, descripcion: e.target.value })}
                  placeholder="Detalles sobre qué está bloqueando el desarrollo..."
                  required
                  rows={3}
                  className="m3-input"
                />
              </div>

              {/* Solution Description (Mandatory if RESUELTA) */}
              {issueForm.estado === 'RESUELTA' && (
                <div className="form-group">
                  <label className="form-label">Solución Aplicada (Obligatorio) *</label>
                  <textarea 
                    value={issueForm.solucion_aplicada}
                    onChange={(e) => setIssueForm({ ...issueForm, solucion_aplicada: e.target.value })}
                    placeholder="Describa la solución técnica para resolver esta incidencia..."
                    required={issueForm.estado === 'RESUELTA'}
                    rows={2}
                    className="m3-input"
                    style={{ borderColor: 'var(--color-rag-green)' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="m3-btn m3-btn-outline" onClick={() => setShowIssueModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="m3-btn m3-btn-primary">
                  {editingIssue ? 'Guardar Cambios' : 'Registrar Incidencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Add / Edit Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingTask ? 'Editar Tarea' : 'Crear Tarea Checklist PM'}</h3>
              <button className="icon-btn" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>

            {taskError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
                {taskError}
              </div>
            )}

            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label className="form-label">Título de Tarea *</label>
                <input 
                  type="text" 
                  value={taskForm.titulo_tarea}
                  onChange={(e) => setTaskForm({ ...taskForm, titulo_tarea: e.target.value })}
                  placeholder="Reunión técnica"
                  required
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input 
                  type="text" 
                  value={taskForm.descripcion}
                  onChange={(e) => setTaskForm({ ...taskForm, descripcion: e.target.value })}
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha Límite *</label>
                <input 
                  type="date" 
                  value={taskForm.fecha_limite}
                  onChange={(e) => setTaskForm({ ...taskForm, fecha_limite: e.target.value })}
                  required
                  className="m3-input"
                />
              </div>

              <div className="form-group" style={{ margin: '12px 0' }}>
                <label className="m3-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={taskForm.es_hito}
                    onChange={(e) => setTaskForm({ ...taskForm, es_hito: e.target.checked })}
                    className="m3-checkbox"
                  />
                  <span>¿Es un Hito? (Visible en Dashboard de Cartera)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="m3-btn m3-btn-outline" onClick={() => setShowTaskModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="m3-btn m3-btn-primary">
                  {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Add / Edit Lesson Modal */}
      {showLessonModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingLesson ? 'Editar Lección Aprendida' : 'Registrar Lección Aprendida'}</h3>
              <button className="icon-btn" onClick={() => setShowLessonModal(false)}>✕</button>
            </div>

            {lessonError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
                {lessonError}
              </div>
            )}

            <form onSubmit={handleLessonSubmit}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input 
                  type="text" 
                  value={lessonForm.titulo}
                  onChange={(e) => setLessonForm({ ...lessonForm, titulo: e.target.value })}
                  placeholder="Ej. Realizar pruebas integradas tempranas"
                  required
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Lección *</label>
                <select
                  value={lessonForm.tipo_leccion}
                  onChange={(e) => setLessonForm({ ...lessonForm, tipo_leccion: e.target.value })}
                  className="user-select"
                  required
                >
                  <option value="BUENA_PRACTICA">Buena Práctica</option>
                  <option value="ERROR_A_EVITAR">Error a Evitar</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Contexto (Problema/Situación)</label>
                <textarea 
                  value={lessonForm.contexto}
                  onChange={(e) => setLessonForm({ ...lessonForm, contexto: e.target.value })}
                  placeholder="Explica qué sucedió..."
                  className="m3-input"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Recomendación Futura</label>
                <textarea 
                  value={lessonForm.recomendacion_futura}
                  onChange={(e) => setLessonForm({ ...lessonForm, recomendacion_futura: e.target.value })}
                  placeholder="Cómo proceder en el futuro..."
                  className="m3-input"
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="m3-btn m3-btn-outline" onClick={() => setShowLessonModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="m3-btn m3-btn-primary">
                  {editingLesson ? 'Guardar Cambios' : 'Registrar Lección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
