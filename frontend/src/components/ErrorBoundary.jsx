import React from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: 'var(--md-sys-color-background, #0f172a)',
          color: 'var(--md-sys-color-on-background, #f8fafc)',
          padding: 24,
          boxSizing: 'border-box'
        }}>
          <div className="glass-panel" style={{
            maxWidth: 520,
            width: '100%',
            padding: 36,
            borderRadius: 24,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 69, 58, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-rag-red, #ff453a)'
            }}>
              <AlertOctagon size={36} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
              Ha ocurrido un error inesperado
            </h1>

            <p style={{ fontSize: '0.92rem', color: 'var(--md-sys-color-on-surface-variant, #94a3b8)', lineHeight: 1.5, margin: 0 }}>
              La aplicación ha detectado un fallo al renderizar la vista. Puedes intentar recargar la página o volver al panel principal.
            </p>

            {this.state.error && (
              <div style={{
                width: '100%',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: 12,
                padding: 12,
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                color: '#ff8a80',
                textAlign: 'left',
                overflowX: 'auto',
                maxHeight: 120
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
              <button
                onClick={this.handleReload}
                className="m3-btn m3-btn-outline"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px' }}
              >
                <RefreshCw size={18} />
                Recargar página
              </button>
              <button
                onClick={this.handleGoHome}
                className="m3-btn m3-btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px' }}
              >
                <Home size={18} />
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
