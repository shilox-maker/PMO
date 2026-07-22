import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, RefreshCw, XCircle, CheckCircle } from 'lucide-react';

export default function PortfolioBudgetsAdmin({ portfolio, getAuthHeaders, onBack }) {
  const [portfolioBudgets, setPortfolioBudgets] = useState([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ id_tipo_capex: '', id_subtipo_capex: '', importe: '' });
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [budgetError, setBudgetError] = useState('');
  const [budgetSuccess, setBudgetSuccess] = useState('');
  const [capexTypes, setCapexTypes] = useState([]);

  const fetchCapexTypes = () => {
    fetch(`${import.meta.env.VITE_API_URL}/capex-types`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => setCapexTypes(data))
      .catch(err => console.error("Error al cargar tipos de capex:", err));
  };

  const fetchPortfolioBudgets = (portfolioId) => {
    setBudgetsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/portfolios/${portfolioId}/budgets`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar presupuestos.');
        return res.json();
      })
      .then(data => {
        setPortfolioBudgets(data);
        setBudgetsLoading(false);
      })
      .catch(err => {
        setBudgetError(err.message);
        setBudgetsLoading(false);
      });
  };

  useEffect(() => {
    fetchPortfolioBudgets(portfolio.id);
    fetchCapexTypes();
  }, [portfolio.id]);

  const handleEditBudgetClick = (b) => {
    setEditingBudgetId(b.id);
    setBudgetForm({
      id_tipo_capex: b.id_tipo_capex || '',
      id_subtipo_capex: b.id_subtipo_capex || '',
      importe: b.importe
    });
    setBudgetError('');
    setBudgetSuccess('');
  };

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    setBudgetError('');
    setBudgetSuccess('');

    if (editingBudgetId) {
      if (!budgetForm.importe) {
        setBudgetError('El importe es obligatorio.');
        return;
      }

      const payload = {
        importe: parseFloat(budgetForm.importe)
      };

      fetch(`${import.meta.env.VITE_API_URL}/admin/portfolio-budgets/${editingBudgetId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al actualizar el presupuesto.');
          return data;
        })
        .then(() => {
          setBudgetSuccess('Línea de presupuesto actualizada correctamente.');
          setBudgetForm({ id_tipo_capex: '', id_subtipo_capex: '', importe: '' });
          setEditingBudgetId(null);
          fetchPortfolioBudgets(portfolio.id);
        })
        .catch(err => setBudgetError(err.message));
    } else {
      if (!budgetForm.id_tipo_capex || !budgetForm.importe) {
        setBudgetError('El tipo de CAPEX y el importe son obligatorios.');
        return;
      }

      const payload = {
        id_tipo_capex: parseInt(budgetForm.id_tipo_capex, 10),
        id_subtipo_capex: budgetForm.id_subtipo_capex ? parseInt(budgetForm.id_subtipo_capex, 10) : null,
        importe: parseFloat(budgetForm.importe)
      };

      fetch(`${import.meta.env.VITE_API_URL}/admin/portfolios/${portfolio.id}/budgets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Error al registrar el presupuesto.');
          return data;
        })
        .then(() => {
          setBudgetSuccess('Línea de presupuesto registrada correctamente.');
          setBudgetForm({ id_tipo_capex: '', id_subtipo_capex: '', importe: '' });
          fetchPortfolioBudgets(portfolio.id);
        })
        .catch(err => setBudgetError(err.message));
    }
  };

  const handleDeleteBudget = (budgetId) => {
    if (!window.confirm('¿Seguro que desea eliminar esta línea de presupuesto?')) return;
    setBudgetError('');
    setBudgetSuccess('');

    fetch(`${import.meta.env.VITE_API_URL}/admin/portfolio-budgets/${budgetId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar el presupuesto.');
        return data;
      })
      .then(() => {
        setBudgetSuccess('Línea de presupuesto eliminada correctamente.');
        fetchPortfolioBudgets(portfolio.id);
      })
      .catch(err => setBudgetError(err.message));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>
          Presupuesto: {portfolio.nombre}
        </h3>
        <button 
          className="m3-btn m3-btn-outline" 
          style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '8px', minHeight: 'unset', height: '28px' }}
          onClick={onBack}
        >
          Volver
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--md-sys-color-outline)' }}>
          Líneas de Presupuesto Aprobadas
        </h4>
        {budgetsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
            <RefreshCw className="animate-spin" size={16} style={{ color: 'var(--md-sys-color-primary)' }} />
          </div>
        ) : portfolioBudgets.length === 0 ? (
          <p style={{ fontSize: '0.8rem', opacity: 0.6, fontStyle: 'italic', padding: '8px 0' }}>Sin líneas de presupuesto asignadas.</p>
        ) : (
          <div className="m3-table-wrapper" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '8px' }}>
            <table className="m3-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Tipo CAPEX</th>
                  <th>Subtipo</th>
                  <th style={{ textAlign: 'right' }}>Importe (€)</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {portfolioBudgets.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.TipoCapex ? b.TipoCapex.nombre : 'Desconocido'}</td>
                    <td>{b.SubtipoCapex ? b.SubtipoCapex.nombre : <em style={{ opacity: 0.5 }}>General</em>}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {parseFloat(b.importe).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button type="button" className="icon-btn" onClick={() => handleEditBudgetClick(b)} style={{ color: 'var(--md-sys-color-primary)', padding: 2 }} title="Editar Presupuesto">
                          <Edit2 size={13} />
                        </button>
                        <button type="button" className="icon-btn danger" onClick={() => handleDeleteBudget(b.id)} style={{ color: 'var(--color-rag-red)', padding: 2 }} title="Eliminar Presupuesto">
                          <Trash2 size={13} />
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

      {budgetError && (
        <div className="status-alert alert-error" style={{ marginBottom: 16, padding: '8px 12px' }}>
          <XCircle size={16} />
          <span style={{ fontSize: '0.8rem' }}>{budgetError}</span>
        </div>
      )}
      {budgetSuccess && (
        <div className="status-alert alert-success" style={{ marginBottom: 16, padding: '8px 12px' }}>
          <CheckCircle size={16} />
          <span style={{ fontSize: '0.8rem' }}>{budgetSuccess}</span>
        </div>
      )}

      <form onSubmit={handleBudgetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16 }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, color: 'var(--md-sys-color-primary)' }}>
          {editingBudgetId ? 'Editar Importe de Presupuesto' : 'Añadir Línea de Presupuesto'}
        </h4>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Tipo de CAPEX *</label>
          <select
            value={budgetForm.id_tipo_capex}
            onChange={(e) => setBudgetForm(prev => ({ ...prev, id_tipo_capex: e.target.value, id_subtipo_capex: '' }))}
            className="user-select"
            style={{ height: '36px', fontSize: '0.85rem' }}
            required
            disabled={editingBudgetId !== null}
          >
            <option value="">Selecciona Tipo...</option>
            {capexTypes.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Subtipo de CAPEX (Opcional)</label>
          <select
            value={budgetForm.id_subtipo_capex}
            onChange={(e) => setBudgetForm(prev => ({ ...prev, id_subtipo_capex: e.target.value }))}
            className="user-select"
            style={{ height: '36px', fontSize: '0.85rem' }}
            disabled={!budgetForm.id_tipo_capex || editingBudgetId !== null}
          >
            <option value="">Todo el tipo (General)</option>
            {budgetForm.id_tipo_capex && capexTypes.find(t => t.id === parseInt(budgetForm.id_tipo_capex, 10))?.Subtipos?.map(st => (
              <option key={st.id} value={st.id}>{st.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Importe Aprobado (€) *</label>
          <input
            type="number"
            value={budgetForm.importe}
            onChange={(e) => setBudgetForm(prev => ({ ...prev, importe: e.target.value }))}
            className="m3-input"
            placeholder="Ej: 500000"
            min="0"
            step="any"
            required
            style={{ height: '36px', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {editingBudgetId && (
            <button 
              type="button" 
              className="m3-btn m3-btn-outline" 
              style={{ flexGrow: 1, height: '36px', fontSize: '0.85rem' }}
              onClick={() => {
                setEditingBudgetId(null);
                setBudgetForm({ id_tipo_capex: '', id_subtipo_capex: '', importe: '' });
              }}
            >
              Cancelar
            </button>
          )}
          <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1, height: '36px', fontSize: '0.85rem' }}>
            {editingBudgetId ? 'Guardar Cambios' : 'Añadir Presupuesto'}
          </button>
        </div>
      </form>
    </div>
  );
}
