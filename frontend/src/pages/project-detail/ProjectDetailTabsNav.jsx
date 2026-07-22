import React from 'react';
import { 
  FileText, Target, DollarSign, TrendingUp, ShieldAlert, MessageSquare, CheckSquare, BookOpen 
} from 'lucide-react';

export default function ProjectDetailTabsNav({ activeTab, setActiveTab, project }) {
  const tabs = [
    { id: 'ficha', label: 'Ficha Principal', icon: FileText },
    { id: 'alcance', label: 'Alcance y Justificación', icon: Target },
    { id: 'finanzas', label: 'Finanzas y Facturas', icon: DollarSign, badge: project.Facturas?.length },
    { id: 'cambios', label: 'Control de Cambios', icon: TrendingUp, badge: project.CambiosAlcance?.length },
    { id: 'riesgos', label: 'Riesgos e Incidencias', icon: ShieldAlert, badge: (project.Riesgos?.length || 0) + (project.Incidencias?.length || 0) },
    { id: 'comunicaciones', label: 'Plan de Comunicación', icon: MessageSquare },
    { id: 'checklist', label: 'Checklist / Tareas', icon: CheckSquare, badge: project.Tareas?.length },
    { id: 'lecciones', label: 'Lecciones Aprendidas', icon: BookOpen, badge: project.LeccionesAprendidas?.length }
  ];

  return (
    <div className="m3-tabs-container" style={{ marginBottom: 24, borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`m3-tab-btn ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--md-sys-color-primary)' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '0.9rem',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span 
                  className="badge" 
                  style={{ 
                    fontSize: '0.7rem', 
                    padding: '2px 6px',
                    backgroundColor: isActive ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-highest)',
                    color: isActive ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
