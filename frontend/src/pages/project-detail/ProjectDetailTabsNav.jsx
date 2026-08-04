import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Target, DollarSign, TrendingUp, ShieldAlert, MessageSquare, CheckSquare, BookOpen, Award, ChevronDown 
} from 'lucide-react';

export default function ProjectDetailTabsNav({ activeTab, setActiveTab, project }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mainTabs = [
    { id: 'ficha', label: 'Ficha', icon: FileText },
    { id: 'alcance', label: 'Alcance', icon: Target },
    !project.es_iniciativa_ligera && { id: 'finanzas', label: 'Facturas', icon: DollarSign, badge: project.Facturas?.length },
    { id: 'checklist', label: 'Tareas', icon: CheckSquare, badge: project.Tareas?.length },
    { id: 'riesgos', label: 'Riesgos e incidencias', icon: ShieldAlert, badge: (project.Riesgos?.length || 0) + (project.Incidencias?.length || 0) }
  ].filter(Boolean);

  const moreTabs = [
    { id: 'cambios', label: 'Cambios', icon: TrendingUp, badge: project.CambiosAlcance?.length },
    { id: 'comunicaciones', label: 'Comunicación', icon: MessageSquare },
    { id: 'encuestas', label: 'Encuestas', icon: Award, badge: project.Encuestas?.length },
    { id: 'lecciones', label: 'Lecciones aprendidas', icon: BookOpen, badge: project.LeccionesAprendidas?.length }
  ].filter(Boolean);

  const isMoreActive = moreTabs.some(t => t.id === activeTab);
  const activeMoreTab = moreTabs.find(t => t.id === activeTab);
  const moreBadgeTotal = moreTabs.reduce((sum, t) => sum + (t.badge || 0), 0);
  return (
    <div className="m3-tabs-container" style={{ marginBottom: 24, borderBottom: '1px solid var(--md-sys-color-outline-variant)', overflow: 'visible', position: 'relative', zIndex: 30 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', paddingBottom: 2, overflow: 'visible' }}>
        {mainTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMoreOpen(false);
              }}
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

        {/* Dropdown "Más ▾" */}
        <div ref={moreRef} style={{ position: 'relative', zIndex: 100 }}>
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`m3-tab-btn ${isMoreActive ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 16px',
              border: 'none',
              borderBottom: isMoreActive ? '3px solid var(--md-sys-color-primary)' : '3px solid transparent',
              backgroundColor: isMoreOpen ? 'var(--md-sys-color-surface-container-high)' : 'transparent',
              color: isMoreActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
              fontWeight: isMoreActive ? 600 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.9rem',
              transition: 'var(--transition-smooth)'
            }}
          >
            <span>{isMoreActive && activeMoreTab ? `Más (${activeMoreTab.label})` : 'Más'}</span>
            {moreBadgeTotal > 0 && (
              <span 
                className="badge" 
                style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 6px',
                  backgroundColor: isMoreActive ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-highest)',
                  color: isMoreActive ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)'
                }}
              >
                {moreBadgeTotal}
              </span>
            )}
            <ChevronDown size={16} style={{ transform: isMoreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {isMoreOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                minWidth: 210,
                backgroundColor: 'var(--md-sys-color-surface-container-highest, #232b38)',
                border: '1px solid var(--md-sys-color-outline-variant, rgba(255, 255, 255, 0.15))',
                borderRadius: 8,
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(16px)',
                zIndex: 1000,
                padding: '6px 0',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {moreTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMoreOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 16px',
                      border: 'none',
                      backgroundColor: isActive ? 'var(--md-sys-color-primary-container, rgba(0, 168, 204, 0.15))' : 'transparent',
                      color: isActive ? 'var(--md-sys-color-primary, #00a8cc)' : 'var(--md-sys-color-on-surface, #e1e2e5)',
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high, rgba(255, 255, 255, 0.08))';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span 
                        className="badge" 
                        style={{ 
                          fontSize: '0.7rem', 
                          padding: '2px 6px',
                          backgroundColor: isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container)',
                          color: isActive ? '#ffffff' : 'var(--md-sys-color-on-surface-variant)'
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

