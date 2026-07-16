import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function ExportProjectsModal({ isOpen, onClose, projects, getAuthHeaders }) {
  const [exporting, setExporting] = useState(false);
  const [fields, setFields] = useState({
    id_proyecto: true,
    nombre_proyecto: true,
    estado_proyecto: true,
    indicador_rag: true,
    proveedor: true,
    pm: true,
    sede: true,
    budget_inicial: true,
    budget_actualizado: true,
    consumo_real: true,
    presupuesto_disponible: true,
    fecha_inicio: true,
    fecha_fin_inicial: true,
    fecha_fin_estimada: true
  });

  if (!isOpen) return null;

  const handleExport = () => {
    if (!projects || projects.length === 0) return;
    setExporting(true);

    const params = new URLSearchParams();
    const ids = projects.map(p => p.id_proyecto).join(',');
    params.append('ids', ids);

    const selectedCols = Object.keys(fields)
      .filter(k => fields[k])
      .join(',');
    
    if (selectedCols) {
      params.append('cols', selectedCols);
    }

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
        a.download = 'Reporte_Proyectos_Seleccionados.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        onClose();
      })
      .catch(err => {
        console.error('Error al exportar:', err);
        alert(err.message);
      })
      .finally(() => {
        setExporting(false);
      });
  };

  const fieldList = [
    { id: 'id_proyecto', label: 'Código de Proyecto' },
    { id: 'nombre_proyecto', label: 'Nombre del Proyecto' },
    { id: 'estado_proyecto', label: 'Estado / Fase' },
    { id: 'indicador_rag', label: 'Indicador RAG' },
    { id: 'proveedor', label: 'Socio Tecnológico' },
    { id: 'pm', label: 'Gestor PM' },
    { id: 'sede', label: 'Sede' },
    { id: 'budget_inicial', label: 'Presupuesto Inicial' },
    { id: 'budget_actualizado', label: 'Budget Actualizado' },
    { id: 'consumo_real', label: 'Consumo Real' },
    { id: 'presupuesto_disponible', label: 'Presupuesto Disponible' },
    { id: 'fecha_inicio', label: 'Fecha de Inicio' },
    { id: 'fecha_fin_inicial', label: 'Fecha Fin Base' },
    { id: 'fecha_fin_estimada', label: 'Fecha Fin Estimada' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Exportar Proyectos a Excel</h3>
          <button className="icon-btn" onClick={onClose} disabled={exporting}>✕</button>
        </div>

        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: 16, color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.9rem' }}>
            Selecciona los campos que deseas incluir en el archivo Excel exportado ({projects.length} proyectos):
          </p>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px 24px', 
            maxHeight: '320px', 
            overflowY: 'auto', 
            padding: '4px' 
          }}>
            {fieldList.map((f) => (
              <label 
                key={f.id} 
                className="m3-checkbox-label" 
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                <input
                  type="checkbox"
                  checked={fields[f.id]}
                  onChange={(e) => setFields({ ...fields, [f.id]: e.target.checked })}
                  disabled={exporting}
                  className="m3-checkbox"
                />
                <span>{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
          <button 
            type="button" 
            className="m3-btn m3-btn-outline" 
            onClick={onClose} 
            disabled={exporting}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="m3-btn m3-btn-primary" 
            onClick={handleExport}
            disabled={exporting || !Object.values(fields).some(Boolean)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {exporting && <RefreshCw className="animate-spin" size={16} />}
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}
