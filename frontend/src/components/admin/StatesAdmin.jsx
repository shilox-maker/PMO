import React, { useState, useEffect } from 'react';
import StatesList from './StatesList';
import StateDetailForm from './StateDetailForm';

export default function StatesAdmin({ getAuthHeaders }) {
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [stateError, setStateError] = useState('');
  const [stateSuccess, setStateSuccess] = useState('');

  // 'list' | 'detail'
  const [viewMode, setViewMode] = useState('list');
  const [editingState, setEditingState] = useState(null);

  const fetchStates = () => {
    setStatesLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/admin/states`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar estados');
        return res.json();
      })
      .then(data => {
        setStates(data);
        setStatesLoading(false);
        // Si estábamos en detalle editando, actualizar la referencia local de editingState
        if (editingState) {
          const updated = data.find(s => s.id_estado === editingState.id_estado);
          if (updated) setEditingState(updated);
        }
      })
      .catch(err => {
        setStateError(err.message);
        setStatesLoading(false);
      });
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleNewStateClick = () => {
    setEditingState(null);
    setStateError('');
    setStateSuccess('');
    setViewMode('detail');
  };

  const handleEditStateClick = (state) => {
    setEditingState(state);
    setStateError('');
    setStateSuccess('');
    setViewMode('detail');
  };

  const handleDeleteStateClick = (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este estado?')) return;
    setStateError('');
    setStateSuccess('');

    fetch(`${import.meta.env.VITE_API_URL}/admin/states/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar el estado.');
        return data;
      })
      .then(() => {
        setStateSuccess('Estado eliminado correctamente.');
        fetchStates();
      })
      .catch(err => setStateError(err.message));
  };

  return (
    <div>
      {stateError && (
        <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem' }}>
          {stateError}
        </div>
      )}

      {stateSuccess && (
        <div style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--color-rag-green)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem' }}>
          {stateSuccess}
        </div>
      )}

      {viewMode === 'list' ? (
        <StatesList 
          states={states}
          loading={statesLoading}
          onNewStateClick={handleNewStateClick}
          onEditStateClick={handleEditStateClick}
          onDeleteStateClick={handleDeleteStateClick}
        />
      ) : (
        <StateDetailForm 
          initialState={editingState}
          onBack={() => setViewMode('list')}
          onStateSaved={fetchStates}
          getAuthHeaders={getAuthHeaders}
        />
      )}
    </div>
  );
}
