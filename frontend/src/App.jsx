import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import GovernanceDashboard from './pages/GovernanceDashboard';
import ProjectDetail from './pages/ProjectDetail';
import Vendor360 from './pages/Vendor360';
import VendorDirectory from './pages/VendorDirectory';
import { 
  Briefcase, BookOpen, Sun, Moon, Activity, Calendar, Building 
} from 'lucide-react';

function NavigationRail({ activeView, setActiveView }) {
  const { pms, currentPm, handlePmChange, theme, toggleTheme } = useAuth();

  return (
    <div className="nav-rail">
      <div className="brand-section">
        <div className="brand-icon">P</div>
        <span className="brand-name">Gobernanza PPM</span>
      </div>

      <div className="nav-links">
        <a 
          className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          <Briefcase className="nav-link-icon" />
          <span>Gestión Técnica</span>
        </a>
        
        {/* New route for executive governance (Control Ejecutivo) */}
        <a 
          className={`nav-link ${activeView === 'governance' ? 'active' : ''}`}
          onClick={() => setActiveView('governance')}
        >
          <Activity className="nav-link-icon" />
          <span>Control Ejecutivo</span>
        </a>

        <a 
          className={`nav-link ${activeView === 'vendors' ? 'active' : ''}`}
          onClick={() => setActiveView('vendors')}
        >
          <Building className="nav-link-icon" />
          <span>Socios Tecnológicos</span>
        </a>
        
        <a 
          className={`nav-link ${activeView === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveView('lessons')}
        >
          <BookOpen className="nav-link-icon" />
          <span>Lecciones</span>
        </a>
      </div>

      {/* Profile/PM Switcher (Section 3 - Local tests conmutador) */}
      <div className="user-switcher-panel">
        <div className="user-switcher-label">Prueba Perfil PM</div>
        <select 
          className="user-select"
          value={currentPm ? currentPm.id_usuario : ''}
          onChange={(e) => handlePmChange(e.target.value)}
        >
          {pms.map(p => (
            <option key={p.id_usuario} value={p.id_usuario}>
              {p.nombre} {p.apellidos} ({p.rol})
            </option>
          ))}
        </select>
        
        <div style={{ padding: '4px 12px', fontSize: '0.7rem', color: 'var(--md-sys-color-outline)' }}>
          Pruebas Locales (v1) • Listo para Entra ID (v2)
        </div>

        {/* Theme Toggle */}
        <button 
          className="m3-btn m3-btn-tonal"
          onClick={toggleTheme}
          style={{ marginTop: 8, justifyContent: 'flex-start', padding: '10px 16px', width: '100%' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Sun size={18} />}
          <span>Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
        </button>
      </div>
    </div>
  );
}

function GeneralLessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/lessons')
      .then(res => res.json())
      .then(data => {
        setLessons(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching lessons:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Lecciones Aprendidas de la Cartera</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)' }}>
          Historial de buenas prácticas y errores a evitar documentados por los gestores de proyectos.
        </p>
      </div>

      {loading ? (
        <span>Cargando base de conocimiento...</span>
      ) : lessons.length === 0 ? (
        <p style={{ color: 'var(--md-sys-color-outline)' }}>No se registran lecciones en el histórico.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
          {lessons.map(lesson => (
            <div key={lesson.id_leccion} style={{ padding: 20, backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '16px', border: '1px solid var(--md-sys-color-outline-variant)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="project-id-badge">{lesson.id_leccion}</span>
                <span className={`badge ${lesson.tipo_leccion === 'BUENA_PRACTICA' ? 'badge-green' : 'badge-red'}`}>
                  {lesson.tipo_leccion.replace(/_/g, ' ')}
                </span>
              </div>
              <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 8 }}>{lesson.titulo}</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-outline)', marginBottom: 12 }}>
                <strong>Contexto:</strong> {lesson.contexto}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)' }}>
                <strong>Recomendación futura:</strong> {lesson.recomendacion_futura}
              </p>
              
              <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                {lesson.Proyecto && <span>Proyecto: {lesson.Proyecto.nombre_proyecto}</span>}
                {lesson.Proveedore && <span>Partner: {lesson.Proveedore.nombre_razon_social}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper for hooks inside Provider
function MainAppContent() {
  const [activeView, setActiveView] = useState('dashboard');
  const [backView, setBackView] = useState('dashboard'); // Tracks previous page for navigation stack
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  
  const { currentPm } = useAuth();

  const handleViewProject = (id) => {
    setSelectedProjectId(id);
    setBackView(activeView);
    setActiveView('project_detail');
  };

  const handleViewVendor = (id) => {
    setSelectedVendorId(id);
    if (activeView !== 'project_detail') {
      setSelectedProjectId(null);
    }
    setBackView(activeView);
    setActiveView('vendor_360');
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Gobernanza Técnica (Listado de Cartera)';
      case 'governance':
        return 'Control Ejecutivo de Cartera';
      case 'vendors':
        return 'Socios Tecnológicos (Directorio)';
      case 'project_detail':
        return 'Detalle de Proyecto';
      case 'vendor_360':
        return 'Vista 360º de Partner';
      case 'lessons':
        return 'Lecciones Aprendidas';
      default:
        return 'Gobernanza Dashboard';
    }
  };

  return (
    <div className="app-container">
      <NavigationRail 
        activeView={activeView} 
        setActiveView={setActiveView}
      />
      
      <div className="main-viewport">
        {/* Sticky Top Bar */}
        <div className="top-bar">
          <h1 className="page-title">{getPageTitle()}</h1>
          
          <div className="top-bar-actions">
            {currentPm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-rag-green)' }}></div>
                <span>PM: {currentPm.nombre} {currentPm.apellidos}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic content rendering */}
        <div className="content-wrapper">
          {activeView === 'dashboard' && (
            <Dashboard 
              onViewProject={handleViewProject} 
              onViewVendor={handleViewVendor} 
            />
          )}

          {activeView === 'governance' && (
            <GovernanceDashboard 
              onViewProject={handleViewProject}
              onViewVendor={handleViewVendor}
            />
          )}

          {activeView === 'vendors' && (
            <VendorDirectory 
              onViewVendor={handleViewVendor}
            />
          )}

          {activeView === 'project_detail' && (
            <ProjectDetail 
              projectId={selectedProjectId}
              onBack={() => setActiveView(backView)}
              onViewVendor={handleViewVendor}
            />
          )}

          {activeView === 'vendor_360' && (
            <Vendor360 
              vendorId={selectedVendorId}
              onBack={() => {
                // If we came from details, go back there, else go to dashboard
                if (selectedProjectId) {
                  setActiveView('project_detail');
                } else {
                  setActiveView(backView);
                }
              }}
              onViewProject={handleViewProject}
            />
          )}

          {activeView === 'lessons' && (
            <GeneralLessonsPage />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
