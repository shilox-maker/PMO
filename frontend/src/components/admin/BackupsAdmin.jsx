import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, Upload, RefreshCw, AlertTriangle, Cloud, CheckCircle2, Clock, FileText } from 'lucide-react';
import { API_URL } from '../../config/api';
import BackupsListTable from './backups/BackupsListTable';
import RestoreConfirmModal from './backups/RestoreConfirmModal';

export default function BackupsAdmin({ getAuthHeaders }) {
  const { t } = useTranslation();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [restoreConfirmFile, setRestoreConfirmFile] = useState(null);
  const fileInputRef = useRef(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/backups`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBackups(data.data || []);
      }
    } catch (err) {
      console.error('Error cargando lista de backups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleGenerateBackup = async () => {
    setActionLoading(true); setMessage(null);
    try {
      const res = await fetch(`${API_URL}/admin/backups/export`, { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) { setMessage({ type: 'success', text: t('backupsAdmin.successGenerate') }); fetchBackups(); }
      else setMessage({ type: 'error', text: data.error || data.message || t('backupsAdmin.errorGenerate') });
    } catch (err) { setMessage({ type: 'error', text: t('backupsAdmin.errorGenerate') }); }
    finally { setActionLoading(false); }
  };

  const handleRestoreBackup = async (filename) => {
    setActionLoading(true); setMessage(null);
    try {
      const res = await fetch(`${API_URL}/admin/backups/restore`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (res.ok) { setMessage({ type: 'success', text: t('backupsAdmin.successRestore') }); setRestoreConfirmFile(null); }
      else setMessage({ type: 'error', text: data.error || data.message || t('backupsAdmin.errorRestore') });
    } catch (err) { setMessage({ type: 'error', text: t('backupsAdmin.errorRestore') }); }
    finally { setActionLoading(false); }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const text = await file.text();
      const backupJson = JSON.parse(text);

      const res = await fetch(`${API_URL}/admin/backups/upload`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(backupJson)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('backupsAdmin.successRestore') });
        fetchBackups();
      } else {
        setMessage({ type: 'error', text: data.error || data.message || t('backupsAdmin.errorRestore') });
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('backupsAdmin.errorRestore') });
    } finally {
      setActionLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = (filename) => {
    const link = document.createElement('a');
    link.href = `${API_URL}/admin/backups/download/${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const latestBackup = backups[0];
  const hasCloudBackups = backups.some(b => b.source === 'azure');

  return (
    <div className="layout-col-gap-lg" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: 28, borderRadius: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(3, 105, 161, 0.15))',
              border: '1px solid rgba(14, 165, 233, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              boxShadow: '0 8px 24px -6px rgba(14, 165, 233, 0.3)',
              flexShrink: 0
            }}>
              <Database size={28} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                {t('backupsAdmin.title')}
              </h3>
              <p style={{ margin: '4px 0 0', color: 'var(--md-sys-color-outline)', fontSize: '0.88rem' }}>
                {t('backupsAdmin.subtitle')}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerateBackup}
              disabled={actionLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: '0.9rem',
                border: 'none',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                color: '#ffffff',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
                transition: 'all 0.2s ease',
                opacity: actionLoading ? 0.7 : 1
              }}
            >
              <Database size={16} />
              {actionLoading ? t('common.loading') : t('backupsAdmin.generateBtn')}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={actionLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: '0.9rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--md-sys-color-on-surface)',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease'
              }}
            >
              <Upload size={16} />
              {t('backupsAdmin.uploadBtn')}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            <button
              onClick={fetchBackups}
              disabled={loading}
              title={t('backupsAdmin.refreshBtn')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--md-sys-color-on-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={17} className={loading ? 'spin-animation' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Pill Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-outline)', marginBottom: 4 }}>Total Copias Disponibles</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} className="text-accent" />
              {backups.length}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-outline)', marginBottom: 4 }}>Nube Azure Storage</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: hasCloudBackups ? '#38bdf8' : '#94a3b8' }}>
              <Cloud size={18} />
              {hasCloudBackups ? 'Conectado & Sincronizado' : 'Modo Local / Azure Config.'}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-outline)', marginBottom: 4 }}>Último Respaldo</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} style={{ color: '#10b981' }} />
              {latestBackup ? new Date(latestBackup.updatedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 12,
            marginBottom: 20,
            fontSize: '0.9rem',
            fontWeight: 500,
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: message.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Backups List */}
        <div>
          <h4 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
            {t('backupsAdmin.listTitle')}
          </h4>
          <BackupsListTable
            backups={backups}
            loading={loading}
            onDownload={handleDownload}
            onRestore={(file) => setRestoreConfirmFile(file)}
          />
        </div>
      </div>

      {/* Confirmation Restore Modal */}
      <RestoreConfirmModal
        filename={restoreConfirmFile}
        actionLoading={actionLoading}
        onClose={() => setRestoreConfirmFile(null)}
        onConfirm={handleRestoreBackup}
      />
    </div>
  );
}
