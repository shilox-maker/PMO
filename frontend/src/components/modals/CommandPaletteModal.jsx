import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  Search, LayoutDashboard, Briefcase, Activity, Calendar, Building,
  BookOpen, Settings, AlertTriangle, AlertCircle, FileText, ArrowRight, X, PieChart
} from 'lucide-react';

const STATIC_ROUTES = [
  { id: 'nav-projects', category: 'Navegación', title: 'Gestión de Proyectos', path: '/proyectos', icon: Briefcase },
  { id: 'nav-dash-proj', category: 'Navegación', title: 'Dashboard Proyectos', path: '/dashboard-proyectos', icon: LayoutDashboard },
  { id: 'nav-dash-port', category: 'Navegación', title: 'Dashboard Portfolio', path: '/dashboard-portfolio', icon: PieChart },
  { id: 'nav-pips', category: 'Navegación', title: 'Control Presupuestario (PIPs)', path: '/portfolios/report', icon: FileText },
  { id: 'nav-timeline', category: 'Navegación', title: 'Timeline de Portfolio', path: '/timeline', icon: Calendar },
  { id: 'nav-vendors', category: 'Navegación', title: 'Socios Tecnológicos (Partners)', path: '/proveedores', icon: Building },
  { id: 'nav-lessons', category: 'Navegación', title: 'Lecciones Aprendidas', path: '/lecciones', icon: BookOpen },
  { id: 'nav-admin', category: 'Navegación', title: 'Panel de Administración', path: '/admin', icon: Settings }
];

export default function CommandPaletteModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({ projects: [], risks: [], incidencias: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced Search API query
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults({ projects: [], risks: [], incidencias: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/search/global?q=${encodeURIComponent(query.trim())}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Error fetching command palette search:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Compute all flat navigable items for keyboard arrow navigation
  const filteredStatic = STATIC_ROUTES.filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase())
  );

  const dynamicProjects = (searchResults.projects || []).map(p => ({
    id: `proj-${p.id_proyecto}`,
    category: 'Proyectos',
    title: `${p.codigo_proyecto} - ${p.nombre_proyecto}`,
    subtitle: `Cliente: ${p.cliente || 'N/A'} | PM: ${p.pm_nombre || 'N/A'}`,
    path: `/proyecto/${p.id_proyecto}`,
    icon: Briefcase
  }));

  const dynamicRisks = (searchResults.risks || []).map(r => ({
    id: `risk-${r.id_riesgo}`,
    category: 'Riesgos',
    title: `${r.codigo_riesgo || 'RIESGO'} - ${r.titulo}`,
    subtitle: `Impacto: ${r.nivel_impacto || 'N/A'}`,
    path: `/proyecto/${r.id_proyecto}`,
    icon: AlertTriangle
  }));

  const dynamicIncidencias = (searchResults.incidencias || []).map(i => ({
    id: `inc-${i.id_incidencia}`,
    category: 'Incidencias',
    title: `${i.codigo_incidencia || 'INC'} - ${i.titulo}`,
    subtitle: `Prioridad: ${i.prioridad || 'N/A'}`,
    path: `/proyecto/${i.id_proyecto}`,
    icon: AlertCircle
  }));

  const allItems = [...filteredStatic, ...dynamicProjects, ...dynamicRisks, ...dynamicIncidencias];

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, searchResults]);

  const handleSelect = (item) => {
    if (!item) return;
    navigate(item.path);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        handleSelect(allItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 999999, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.75)' }}>
      <div 
        className="modal-content glass-panel" 
        onClick={e => e.stopPropagation()} 
        style={{
          maxWidth: 680,
          width: '90%',
          padding: 0,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'var(--color-bg-dark, #0f172a)'
        }}
      >
        {/* Search Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', gap: 12 }}>
          <Search size={20} style={{ color: 'var(--color-primary, #6366f1)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar proyectos, riesgos, incidencias o secciones (Ctrl + K)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '1.05rem',
              fontFamily: 'inherit'
            }}
          />
          {loading && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Buscando...</span>}
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '12px 8px' }}>
          {allItems.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
              No se encontraron resultados para "{query}".
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    marginBottom: 4,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                    <div style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: isSelected ? 'var(--color-primary, #6366f1)' : 'rgba(255,255,255,0.05)',
                      color: isSelected ? '#fff' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComp size={18} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#cbd5e1',
                      fontWeight: 500
                    }}>
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight size={16} style={{ color: 'var(--color-primary, #6366f1)' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: '#64748b',
          backgroundColor: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, color: '#cbd5e1' }}>↑↓</kbd> Navegar</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, color: '#cbd5e1' }}>↵</kbd> Seleccionar</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, color: '#cbd5e1' }}>ESC</kbd> Cerrar</span>
          </div>
          <span>PMO Control Tower</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
