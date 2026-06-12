import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import GovernanceDashboard from './pages/GovernanceDashboard';
import ProjectDetail from './pages/ProjectDetail';
import Vendor360 from './pages/Vendor360';
import VendorDirectory from './pages/VendorDirectory';
import AdminPanel from './pages/AdminPanel';
import {
  Briefcase, BookOpen, Sun, Moon, Activity, Calendar, Building,
  Settings, LogOut, RefreshCw, User, Lock, Mail, Building2, Key
} from 'lucide-react';

function ChangePasswordModal({ isOpen, onClose }) {
  const { getAuthHeaders } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validatePassword = (pwd) => {
    if (!pwd) return [];
    const errors = [];
    if (pwd.length < 10) errors.push('Mínimo 10 caracteres');
    if (!/[A-Z]/.test(pwd)) errors.push('Al menos una mayúscula');
    if (!/[a-z]/.test(pwd)) errors.push('Al menos una minúscula');
    if (!/\d/.test(pwd)) errors.push('Al menos un número');
    if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]/.test(pwd)) errors.push('Al menos un carácter especial');
    return errors;
  };

  const pwdErrors = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword;
  
  const isSubmitDisabled = !currentPassword || !newPassword || !confirmPassword || pwdErrors.length > 0 || !passwordsMatch || loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar la contraseña');
      
      setSuccess('Contraseña actualizada correctamente.');
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, padding: 32 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 20 }}>Cambiar Contraseña</h2>
        
        {error && <div style={{ backgroundColor: 'rgba(255,69,58,0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem' }}>{error}</div>}
        {success && <div style={{ backgroundColor: 'rgba(52,199,89,0.1)', color: 'var(--color-rag-green)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem' }}>{success}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Contraseña Actual *</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="m3-input" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Nueva Contraseña *</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="m3-input" style={{ borderColor: newPassword && pwdErrors.length > 0 ? 'var(--color-rag-red)' : '' }} />
            {newPassword && pwdErrors.length > 0 && (
              <ul style={{ color: 'var(--color-rag-red)', fontSize: '0.75rem', marginTop: 4, paddingLeft: 16 }}>
                {pwdErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">Confirmar Nueva Contraseña *</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="m3-input" style={{ borderColor: confirmPassword && !passwordsMatch ? 'var(--color-rag-red)' : '' }} />
            {confirmPassword && !passwordsMatch && (
              <span style={{ color: 'var(--color-rag-red)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>Las contraseñas no coinciden.</span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose} style={{ flexGrow: 1 }}>Cancelar</button>
            <button type="submit" className="m3-btn m3-btn-primary" disabled={isSubmitDisabled} style={{ flexGrow: 1 }}>{loading ? 'Guardando...' : 'Actualizar'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function LoginScreen() {
  const { login, theme, toggleTheme } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    login(correo, password)
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="login-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--md-sys-color-background)',
      padding: '20px'
    }}>
      <div className="m3-card glass-panel" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        borderRadius: '28px',
        border: '1px solid var(--md-sys-color-outline-variant)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: '0 auto 16px auto'
          }}>P</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>DACSA IT PPM</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', marginTop: '4px' }}>Inicia sesión en tu cuenta de Dacsa</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 69, 58, 0.1)',
            color: 'var(--color-rag-red)',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 500,
            border: '1px solid rgba(255, 69, 58, 0.2)'
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} /> Correo Electrónico
            </label>
            <input
              type="email"
              required
              className="m3-input"
              placeholder="usuario@dacsa.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} /> Contraseña
            </label>
            <input
              type="password"
              required
              className="m3-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="m3-btn m3-btn-primary" style={{ marginTop: '8px', height: '48px', borderRadius: '100px', width: '100%' }}>
            {loading ? 'Accediendo...' : 'Entrar'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="m3-btn m3-btn-tonal" onClick={toggleTheme} style={{ borderRadius: '100px', width: '100%' }}>
            Tema Actual: {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Corporativo Dacsa'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NavigationRail() {
  const { currentPm, logout, theme, toggleTheme } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="nav-rail">
      <div className="brand-section">
        <div className="brand-icon">P</div>
        <span className="brand-name">Gobernanza PPM</span>
      </div>

      <div className="nav-links">
        <a
          className={`nav-link ${isActive('/dashboard') || location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <Briefcase className="nav-link-icon" />
          <span>Proyectos</span>
        </a>

        <a
          className={`nav-link ${isActive('/governance') ? 'active' : ''}`}
          onClick={() => navigate('/governance')}
        >
          <Activity className="nav-link-icon" />
          <span>KPIs de Portfolio</span>
        </a>
        <hr />
        <a
          className={`nav-link ${isActive('/proveedores') || isActive('/proveedor/') ? 'active' : ''}`}
          onClick={() => navigate('/proveedores')}
        >
          <Building className="nav-link-icon" />
          <span>Socios Tecnológicos</span>
        </a>

        <a
          className={`nav-link ${isActive('/lecciones') ? 'active' : ''}`}
          onClick={() => navigate('/lecciones')}
        >
          <BookOpen className="nav-link-icon" />
          <span>Lecciones</span>
        </a>

        {currentPm && currentPm.perfil === 'ADMINISTRADOR' && (
          <a
            className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
            onClick={() => navigate('/admin')}
          >
            <Settings className="nav-link-icon" />
            <span>Administración</span>
          </a>
        )}
      </div>

      {/* User profile card & Logout */}
      <div className="user-switcher-panel" style={{ marginTop: 'auto', padding: '16px 12px' }}>
        {currentPm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              borderRadius: 14,
              border: '1px solid var(--md-sys-color-outline-variant)'
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                {currentPm.nombre[0]}{currentPm.apellidos[0]}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentPm.nombre} {currentPm.apellidos}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--md-sys-color-outline)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {currentPm.perfil}
                </div>
              </div>
            </div>

            <button
              className="m3-btn m3-btn-tonal"
              onClick={() => setIsChangePasswordOpen(true)}
              style={{ padding: '8px 12px', justifyContent: 'flex-start', gap: 8, fontSize: '0.8rem', borderRadius: '12px', width: '100%' }}
            >
              <Key size={16} />
              <span>Cambiar Contraseña</span>
            </button>
            <button
              className="m3-btn m3-btn-tonal"
              onClick={logout}
              style={{ padding: '8px 12px', justifyContent: 'flex-start', gap: 8, fontSize: '0.8rem', borderRadius: '12px', width: '100%' }}
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}

        <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />

        {/* Theme Toggle */}
        <button
          className="m3-btn m3-btn-tonal"
          onClick={toggleTheme}
          style={{ justifyContent: 'flex-start', padding: '10px 16px', width: '100%', borderRadius: '12px' }}
        >
          {theme === 'light' && <Sun size={18} />}
          {theme === 'dark' && <Moon size={18} />}
          {theme === 'dacsa' && <Building2 size={18} />}
          <span>Tema {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Dacsa'}</span>
        </button>
      </div>
    </div>
  );
}

function GeneralLessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/lessons`)
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

function ProjectDetailWrapper({ onBack }) {
  const { id } = useParams();
  const navigate = useNavigate();
  return <ProjectDetail projectId={id} onBack={onBack} onViewVendor={(vid) => navigate('/proveedor/' + vid)} />;
}

function Vendor360Wrapper({ onBack }) {
  const { id } = useParams();
  const navigate = useNavigate();
  return <Vendor360 vendorId={id} onBack={onBack} onViewProject={(pid) => navigate('/proyecto/' + pid)} />;
}

function MainAppContent() {
  const { currentPm } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleViewProject = (id) => navigate('/proyecto/' + id);
  const handleViewVendor = (id) => navigate('/proveedor/' + id);
  const handleBack = () => navigate(-1);

  const getPageTitle = () => {
    if (location.pathname.startsWith('/dashboard') || location.pathname === '/') return 'Gobernanza Técnica (Listado de Cartera)';
    if (location.pathname.startsWith('/governance')) return 'Control Ejecutivo de Cartera';
    if (location.pathname === '/proveedores') return 'Socios Tecnológicos (Directorio)';
    if (location.pathname.startsWith('/proyecto/')) return 'Detalle de Proyecto';
    if (location.pathname.startsWith('/proveedor/')) return 'Vista 360º de Partner';
    if (location.pathname.startsWith('/lecciones')) return 'Lecciones Aprendidas';
    if (location.pathname.startsWith('/admin')) return 'Módulo de Administración (Exclusivo)';
    return 'Gobernanza Dashboard';
  };

  return (
    <div className="app-container">
      <NavigationRail />

      <div className="main-viewport">
        {/* Sticky Top Bar */}
        <div className="top-bar">
          <h1 className="page-title">{getPageTitle()}</h1>

          <div className="top-bar-actions">
            {currentPm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-rag-green)' }}></div>
                <span>Usuario: {currentPm.nombre} {currentPm.apellidos} ({currentPm.perfil})</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic content rendering */}
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={
              <Dashboard onViewProject={handleViewProject} onViewVendor={handleViewVendor} />
            } />
            
            <Route path="/governance" element={
              <GovernanceDashboard onViewProject={handleViewProject} onViewVendor={handleViewVendor} />
            } />
            
            <Route path="/proveedores" element={
              <VendorDirectory onViewVendor={handleViewVendor} />
            } />
            
            <Route path="/proyecto/:id" element={
              <ProjectDetailWrapper onBack={handleBack} />
            } />
            
            <Route path="/proveedor/:id" element={
              <Vendor360Wrapper onBack={handleBack} />
            } />
            
            <Route path="/lecciones" element={<GeneralLessonsPage />} />
            
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function AppConsumer() {
  const { currentPm, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--md-sys-color-background)', gap: 16 }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-outline)' }}>Iniciando plataforma...</span>
      </div>
    );
  }

  if (!currentPm) {
    return <LoginScreen />;
  }

  return <MainAppContent />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppConsumer />
      </AuthProvider>
    </BrowserRouter>
  );
}
