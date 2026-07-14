import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { msalInstance } from './config/msal';
import Projects from './pages/Projects';
import GovernanceDashboard from './pages/GovernanceDashboard';
import ProjectDetail from './pages/ProjectDetail';
import Timeline from './pages/Timeline';
import Vendor360 from './pages/Vendor360';
import VendorDirectory from './pages/VendorDirectory';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard';
import PortfolioReport from './pages/PortfolioReport';
import GeneralLessonsPage from './pages/GeneralLessonsPage';
import {
  Briefcase, BookOpen, Sun, Moon, Activity, Calendar, Building,
  Settings, LogOut, RefreshCw, User, Lock, Mail, Building2, Key, Info
} from 'lucide-react';
import pkg from '../package.json';

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
  const { login, loginAzure, theme, toggleTheme } = useAuth();
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

  const handleAzureLogin = () => {
    setError('');
    setLoading(true);
    if (import.meta.env.VITE_AZURE_MOCK === 'true') {
      loginAzure('mock-token-rmoreno')
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      msalInstance.loginPopup({
        scopes: ['user.read']
      })
      .then(response => {
        return loginAzure(response.idToken);
      })
      .catch(err => {
        setError(err.message || 'Error en la autenticación de Azure AD.');
        setLoading(false);
      });
    }
  };

  return (
    <div className="login-container" style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '20px',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Top Header Bar Banner */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        zIndex: 10
      }}>
        <div style={{
          backgroundColor: '#FFB800',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.85rem',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRight: '1px solid rgba(255, 255, 255, 0.4)'
        }}>
          PMO Control Tower
        </div>
        <div style={{
          backgroundColor: '#1A5B36',
          flexGrow: 1,
          height: '100%'
        }}></div>
      </div>

      <div style={{
        maxWidth: '440px',
        width: '100%',
        padding: '36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        borderRadius: '16px',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e4ec',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
        textAlign: 'center',
        marginTop: '42px'
      }}>
        {/* SVG Dacsa Group Logo */}
        <div style={{ margin: '0 auto' }}>
          <svg width="220" height="70" viewBox="0 0 220 70">
            <g transform="translate(5, 5)">
              <g transform="translate(30, 30)">
                {/* 5 Petals of DACSA Star */}
                <path d="M -4,-8 L -15,-20 L -8,-25 L 0,-15 L 8,-25 L 15,-20 L 4,-8 L 0,-12 Z" fill="#1A5B36" transform="rotate(-60)" />
                <path d="M -4,-8 L -15,-20 L -8,-25 L 0,-15 L 8,-25 L 15,-20 L 4,-8 L 0,-12 Z" fill="#FFB800" transform="rotate(12)" />
                <path d="M -4,-8 L -15,-20 L -8,-25 L 0,-15 L 8,-25 L 15,-20 L 4,-8 L 0,-12 Z" fill="#E28C00" transform="rotate(84)" />
                <path d="M -4,-8 L -15,-20 L -8,-25 L 0,-15 L 8,-25 L 15,-20 L 4,-8 L 0,-12 Z" fill="#FFB800" transform="rotate(156)" />
                <path d="M -4,-8 L -15,-20 L -8,-25 L 0,-15 L 8,-25 L 15,-20 L 4,-8 L 0,-12 Z" fill="#FFA800" transform="rotate(228)" />
              </g>
            </g>
            <text x="75" y="36" fill="#1A5B36" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '26px', fontWeight: 'bold', letterSpacing: '0.05em' }}>DACSA</text>
            <text x="75" y="52" fill="#757575" style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', fontWeight: '300', letterSpacing: '0.25em' }}>GROUP</text>
          </svg>
        </div>

        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3c4858', margin: '4px 0 2px 0' }}>Dacsa Group – PMO Control Tower</h3>
          <p style={{ fontSize: '0.75rem', color: '#8898aa', margin: 0 }}>PMO governance tool by SopraSteria</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 69, 58, 0.1)',
            color: '#ff3b30',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 500,
            border: '1px solid rgba(255, 69, 58, 0.2)'
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#525f7f' }}>
              <Mail size={12} /> Correo Electrónico
            </label>
            <input
              type="email"
              required
              className="m3-input"
              style={{ padding: '10px 14px', fontSize: '0.9rem', color: '#333', backgroundColor: '#f4f5f7', border: '1px solid #cad1d7' }}
              placeholder="usuario@dacsa.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#525f7f' }}>
              <Lock size={12} /> Contraseña
            </label>
            <input
              type="password"
              required
              className="m3-input"
              style={{ padding: '10px 14px', fontSize: '0.9rem', color: '#333', backgroundColor: '#f4f5f7', border: '1px solid #cad1d7' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="m3-btn" style={{ marginTop: '8px', height: '42px', backgroundColor: '#1A5B36', color: '#ffffff', borderRadius: '6px', fontSize: '0.9rem', width: '100%' }}>
            {loading ? 'Accediendo...' : 'Entrar'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, borderTop: '1px solid #e9ecef', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8898aa' }}>Sign in with</span>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8, 
              cursor: 'pointer', 
              color: '#0078d4', 
              fontWeight: 600, 
              fontSize: '0.85rem' 
            }} 
            onClick={handleAzureLogin}
          >
            <svg width="14" height="14" viewBox="0 0 16 16">
              <rect x="0" y="0" width="7" height="7" fill="#f25022" />
              <rect x="9" y="0" width="7" height="7" fill="#7fba00" />
              <rect x="0" y="9" width="7" height="7" fill="#00a4ef" />
              <rect x="9" y="9" width="7" height="7" fill="#ffb900" />
            </svg>
            <span style={{ textDecoration: 'underline' }}>Azure AD</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <button 
            className="m3-btn m3-btn-tonal" 
            onClick={toggleTheme} 
            style={{ 
              borderRadius: '6px', 
              fontSize: '0.75rem', 
              padding: '6px 12px', 
              backgroundColor: '#f4f5f7', 
              color: '#525f7f',
              border: '1px solid #cad1d7'
            }}
          >
            Tema: {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Corporativo Dacsa'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangelogModal({ isOpen, onClose }) {
  const { getAuthHeaders } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`${import.meta.env.VITE_API_URL}/changelog`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(data => {
          setContent(data.content);
          setLoading(false);
        })
        .catch(() => {
          setContent('Error cargando el changelog.');
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
        <div className="modal-header">
          <h3 className="modal-title">Notas de Versión (Changelog)</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '0 8px', overflowY: 'auto', maxHeight: '60vh', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface)' }}>
          {loading ? 'Cargando...' : content}
        </div>
      </div>
    </div>,
    document.body
  );
}

function NavigationRail() {
  const { currentPm, logout, theme, toggleTheme, isGlobalWorking } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="nav-rail">
      <div className="brand-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-icon" style={{ fontSize: '1rem', position: 'relative' }}>
            CT
            {isGlobalWorking && (
              <span style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 10,
                height: 10,
                backgroundColor: 'var(--color-rag-green)',
                borderRadius: '50%',
                border: '2px solid var(--md-sys-color-surface-container)',
                boxShadow: '0 0 8px var(--color-rag-green)'
              }} className="animate-pulse" />
            )}
          </div>
          <span className="brand-name">PMO Control Tower</span>
        </div>
        {isGlobalWorking && (
          <RefreshCw className="animate-spin" size={14} style={{ color: 'var(--md-sys-color-primary)', opacity: 0.8 }} />
        )}
      </div>

      <div className="nav-links">
        <a
          className={`nav-link ${isActive('/proyectos') || location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/proyectos')}
        >
          <Briefcase className="nav-link-icon" />
          <span>Proyectos</span>
        </a>

        <a
          className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <Activity className="nav-link-icon" />
          <span>Dashboard</span>
        </a>

        <a
          className={`nav-link ${isActive('/portfolios/report') ? 'active' : ''}`}
          onClick={() => navigate('/portfolios/report')}
        >
          <Briefcase className="nav-link-icon" />
          <span>PIPs</span>
        </a>

        <a
          className={`nav-link ${isActive('/timeline') ? 'active' : ''}`}
          onClick={() => navigate('/timeline')}
        >
          <Calendar className="nav-link-icon" />
          <span>Timeline</span>
        </a>
        <hr />
        <a
          className={`nav-link ${isActive('/proveedores') || isActive('/proveedor/') ? 'active' : ''}`}
          onClick={() => navigate('/proveedores')}
        >
          <Building className="nav-link-icon" />
          <span>Partners</span>
        </a>

        <a
          className={`nav-link ${isActive('/lecciones') ? 'active' : ''}`}
          onClick={() => navigate('/lecciones')}
        >
          <BookOpen className="nav-link-icon" />
          <span>Lecciones aprendidas</span>
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
          {theme === 'dark' && <Moon size={18} />}
          {theme === 'dacsa' && <Building2 size={18} />}
          <span>Tema {theme === 'dark' ? 'Oscuro' : 'Dacsa'}</span>
        </button>

        {/* Version / Changelog */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            onClick={() => setIsChangelogOpen(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--md-sys-color-outline)',
              fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%'
            }}
          >
            <Info size={12} />
            v{pkg.version} — Notas de versión
          </button>
        </div>

        <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />
      </div>
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
    if (location.pathname.startsWith('/proyectos') || location.pathname === '/') return 'Proyectos';
    if (location.pathname.startsWith('/governance')) return 'Control Ejecutivo de Cartera';
    if (location.pathname.startsWith('/dashboard')) return 'Dashboard';
    if (location.pathname.startsWith('/timeline')) return 'Timeline de Portfolio';
    if (location.pathname.startsWith('/portfolios/report')) return 'Control Presupuestario de Portfolios';
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
            {/* Topbar profile removed as per Rebranding requirements */}
          </div>
        </div>

        {/* Dynamic content rendering */}
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<Navigate to="/proyectos" replace />} />
            
            <Route path="/proyectos" element={
              <Projects onViewProject={handleViewProject} onViewVendor={handleViewVendor} />
            } />
            
            <Route path="/governance" element={
              <GovernanceDashboard onViewProject={handleViewProject} onViewVendor={handleViewVendor} />
            } />

            <Route path="/dashboard" element={
              <Dashboard onViewProject={handleViewProject} onViewVendor={handleViewVendor} />
            } />

            <Route path="/timeline" element={
              <Timeline onViewProject={handleViewProject} />
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
            
            <Route path="/portfolios/report" element={<PortfolioReport />} />
            
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
