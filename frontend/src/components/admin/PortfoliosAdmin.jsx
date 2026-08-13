import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Edit2, Trash2, RefreshCw, Coins } from 'lucide-react';
import PortfolioBudgetsAdmin from './PortfolioBudgetsAdmin';

export default function PortfoliosAdmin({ getAuthHeaders }) {
  const { t } = useTranslation();
  const { selectedAmbito } = useAuth();
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
  }, [selectedAmbito]);

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
          <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>{t('portfoliosAdmin.title', { count: portfolios.length })}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{t('portfoliosAdmin.subtitle')}</p>
        </div>

        {portfoliosLoading ? (
          <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--md-sys-color-primary)', alignSelf: 'center' }} />
        ) : portfolios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>{t('portfoliosAdmin.noPortfolios')}</div>
        ) : (
          <div className="m3-table-wrapper">
            <table className="m3-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>ID</th>
                  <th>{t('portfoliosAdmin.portfolioName')}</th>
                  <th>{t('statesAdmin.description')}</th>
                  <th style={{ width: '110px' }}>{t('usersAdmin.action')}</th>
                </tr>
              </thead>
              <tbody>
                {portfolios.map(p => (
                  <tr key={p.id} style={{ backgroundColor: selectedPortfolioForBudgets?.id === p.id ? 'rgba(104, 84, 138, 0.15)' : 'transparent' }}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.descripcion || t('statesAdmin.noDesc')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn" onClick={() => handleOpenBudgets(p)} style={{ color: 'var(--md-sys-color-tertiary, #9c27b0)' }} title={t('portfoliosAdmin.budgetsBtn')}>
                          <Coins size={15} />
                        </button>
                        <button className="icon-btn" onClick={() => handleEditPortfolioClick(p)} style={{ color: 'var(--md-sys-color-primary)' }} title={t('common.edit')}>
                          <Edit2 size={15} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDeletePortfolioClick(p.id)} style={{ color: 'var(--color-rag-red)' }} title={t('common.delete')}>
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
        {!selectedPortfolioForBudgets && (
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 16 }}>
              {editingPortfolioId ? t('portfoliosAdmin.editPortfolio') : t('portfoliosAdmin.addPortfolio')}
            </h3>
            
            {portfolioError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem' }}>
                {portfolioError}
              </div>
            )}

            {portfolioSuccess && (
              <div style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--color-rag-green)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem' }}>
                {portfolioSuccess}
              </div>
            )}

            <form onSubmit={handlePortfolioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">{t('portfoliosAdmin.portfolioName')} *</label>
                <input 
                  type="text" 
                  value={portfolioForm.nombre}
                  onChange={(e) => setPortfolioForm(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                  className="m3-input"
                  placeholder="Ej: Transformación Digital"
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('statesAdmin.description')}</label>
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
                    {t('usersAdmin.cancel')}
                  </button>
                )}
                <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1 }}>
                  {editingPortfolioId ? t('usersAdmin.saveChanges') : t('portfoliosAdmin.addPortfolio')}
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedPortfolioForBudgets && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 20 }}>
            <PortfolioBudgetsAdmin 
              portfolio={selectedPortfolioForBudgets}
              getAuthHeaders={getAuthHeaders}
              onClose={() => setSelectedPortfolioForBudgets(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
