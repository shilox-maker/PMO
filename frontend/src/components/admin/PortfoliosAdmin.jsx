import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, RefreshCw, XCircle, CheckCircle, Coins } from 'lucide-react';
import PortfolioBudgetsAdmin from './PortfolioBudgetsAdmin';

export default function PortfoliosAdmin({ getAuthHeaders }) {
  // Portfolios state
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({ id: '', nombre: '', descripcion: '' });
  const [editingPortfolioId, setEditingPortfolioId] = useState(null);
  const [portfolioError, setPortfolioError] = useState('');
  const [portfolioSuccess, setPortfolioSuccess] = useState('');

  // Selected portfolio for budgets view
  const [selectedPortfolioForBudgets, setSelectedPortfolioForBudgets] = useState(null);

  const fetchPortfolios = () => {
    setPortfoliosLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/portfolios`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar portfolios');
        return res.json();
      })
      .then(data => {
        setPortfolios(data);
        setPortfoliosLoading(false);
      })
      .catch(err => {
        setPortfolioError(err.message);
        setPortfoliosLoading(false);
      });
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handleOpenBudgets = (portfolio) => {
    setSelectedPortfolioForBudgets(portfolio);
  };

  const handlePortfolioSubmit = (e) => {
    e.preventDefault();
    setPortfolioError('');
    setPortfolioSuccess('');

    if (!portfolioForm.nombre) {
      setPortfolioError('El nombre del portfolio es obligatorio.');
      return;
    }

    const isEdit = editingPortfolioId !== null;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/admin/portfolios/${editingPortfolioId}` 
      : `${import.meta.env.VITE_API_URL}/admin/portfolios`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        nombre: portfolioForm.nombre, 
        descripcion: portfolioForm.descripcion 
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar el portfolio.');
        return data;
      })
      .then(() => {
        setPortfolioSuccess(isEdit ? 'Portfolio actualizado correctamente.' : 'Portfolio creado correctamente.');
        setPortfolioForm({ id: '', nombre: '', descripcion: '' });
        setEditingPortfolioId(null);
        fetchPortfolios();
      })
      .catch(err => setPortfolioError(err.message));
  };

  const handleEditPortfolioClick = (p) => {
    setPortfolioForm({ id: p.id, nombre: p.nombre, descripcion: p.descripcion || '' });
    setEditingPortfolioId(p.id);
    setPortfolioError('');
    setPortfolioSuccess('');
  };

  const handleDeletePortfolioClick = (id) => {
    if (!window.confirm('¿Seguro que desea eliminar este portfolio?')) return;
    setPortfolioError('');
    setPortfolioSuccess('');

    fetch(`${import.meta.env.VITE_API_URL}/admin/portfolios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar el portfolio.');
        return data;
      })
      .then(() => {
        setPortfolioSuccess('Portfolio eliminado del sistema.');
        fetchPortfolios();
      })
      .catch(err => setPortfolioError(err.message));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
      <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>Mantenimiento de Portfolios ({portfolios.length})</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Lista de portfolios de proyectos.</p>
        </div>

        {portfoliosLoading ? (
          <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--md-sys-color-primary)', alignSelf: 'center' }} />
        ) : portfolios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>No hay portfolios creados.</div>
        ) : (
          <div className="m3-table-wrapper">
            <table className="m3-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th style={{ width: '110px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {portfolios.map(p => (
                  <tr key={p.id} style={{ backgroundColor: selectedPortfolioForBudgets?.id === p.id ? 'rgba(104, 84, 138, 0.15)' : 'transparent' }}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.descripcion || 'Sin descripción'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn" onClick={() => handleOpenBudgets(p)} style={{ color: 'var(--md-sys-color-tertiary, #9c27b0)' }} title="Presupuestos">
                          <Coins size={15} />
                        </button>
                        <button className="icon-btn" onClick={() => handleEditPortfolioClick(p)} style={{ color: 'var(--md-sys-color-primary)' }} title="Editar">
                          <Edit2 size={15} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDeletePortfolioClick(p.id)} style={{ color: 'var(--color-rag-red)' }} title="Eliminar">
                          <Trash2 size={15} />
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

      <div className="m3-card glass-panel" style={{ position: 'sticky', top: 24 }}>
        {selectedPortfolioForBudgets ? (
          <PortfolioBudgetsAdmin 
            portfolio={selectedPortfolioForBudgets}
            getAuthHeaders={getAuthHeaders}
            onBack={() => setSelectedPortfolioForBudgets(null)}
          />
        ) : (
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 16 }}>
              {editingPortfolioId ? 'Editar Portfolio' : 'Añadir Nuevo Portfolio'}
            </h3>
            
            {portfolioError && (
              <div className="status-alert alert-error" style={{ marginBottom: 16 }}>
                <XCircle size={18} />
                <span>{portfolioError}</span>
              </div>
            )}

            {portfolioSuccess && (
              <div className="status-alert alert-success" style={{ marginBottom: 16 }}>
                <CheckCircle size={18} />
                <span>{portfolioSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePortfolioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nombre del Portfolio *</label>
                <input 
                  type="text" 
                  value={portfolioForm.nombre}
                  onChange={(e) => setPortfolioForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="m3-input"
                  placeholder="Ej: Transformación Digital"
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea 
                  value={portfolioForm.descripcion}
                  onChange={(e) => setPortfolioForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="m3-input"
                  placeholder="Descripción del portfolio..."
                  rows={4}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {editingPortfolioId && (
                  <button 
                    type="button" 
                    className="m3-btn m3-btn-outline" 
                    style={{ flexGrow: 1 }}
                    onClick={() => {
                      setEditingPortfolioId(null);
                      setPortfolioForm({ id: '', nombre: '', descripcion: '' });
                    }}
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1 }} disabled={!portfolioForm.nombre}>
                  {editingPortfolioId ? 'Guardar Cambios' : 'Registrar Portfolio'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
