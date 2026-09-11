import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import WorkflowsList from './WorkflowsList';
import WorkflowDetailForm from './WorkflowDetailForm';
import { useMetadata } from '../../context/MetadataContext';

export default function WorkflowsAdmin({ getAuthHeaders }) {
  const { t } = useTranslation();
  const { refreshMetadata } = useMetadata();
  const [workflows, setWorkflows] = useState([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 'list' | 'detail'
  const [viewMode, setViewMode] = useState('list');
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  const fetchWorkflows = () => {
    setWorkflowsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/admin/workflows`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar flujos de trabajo.');
        return res.json();
      })
      .then(data => {
        setWorkflows(Array.isArray(data) ? data : []);
        setWorkflowsLoading(false);
        if (editingWorkflow) {
          const updated = data.find(w => w.id === editingWorkflow.id);
          if (updated) setEditingWorkflow(updated);
        }
      })
      .catch(err => {
        setError(err.message);
        setWorkflowsLoading(false);
      });
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleNewWorkflowClick = () => {
    setEditingWorkflow(null);
    setError('');
    setSuccess('');
    setViewMode('detail');
  };

  const handleEditWorkflowClick = (wf) => {
    setEditingWorkflow(wf);
    setError('');
    setSuccess('');
    setViewMode('detail');
  };

  const handleDeleteWorkflowClick = (id) => {
    if (!window.confirm(t('workflowsAdmin.confirmDelete', '¿Seguro que deseas eliminar este flujo de trabajo?'))) return;
    setError('');
    setSuccess('');

    fetch(`${import.meta.env.VITE_API_URL}/admin/workflows/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar el flujo de trabajo.');
        return data;
      })
      .then(() => {
        setSuccess(t('workflowsAdmin.deleteSuccess', 'Flujo de trabajo eliminado correctamente.'));
        fetchWorkflows();
        if (refreshMetadata) refreshMetadata();
      })
      .catch(err => setError(err.message));
  };

  return (
    <div>
      {error && (
        <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--color-rag-green)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem' }}>
          {success}
        </div>
      )}

      {viewMode === 'list' ? (
        <WorkflowsList
          workflows={workflows}
          loading={workflowsLoading}
          onNewWorkflowClick={handleNewWorkflowClick}
          onEditWorkflowClick={handleEditWorkflowClick}
          onDeleteWorkflowClick={handleDeleteWorkflowClick}
        />
      ) : (
        <WorkflowDetailForm
          initialWorkflow={editingWorkflow}
          onBack={() => setViewMode('list')}
          onWorkflowSaved={() => {
            fetchWorkflows();
            if (refreshMetadata) refreshMetadata();
          }}
          getAuthHeaders={getAuthHeaders}
        />
      )}
    </div>
  );
}
