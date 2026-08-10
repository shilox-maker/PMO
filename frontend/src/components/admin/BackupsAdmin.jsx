import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, Download, Upload, RefreshCw, AlertTriangle, Cloud, HardDrive, CheckCircle2 } from 'lucide-react';

export default function BackupsAdmin({ getAuthHeaders }) {
  const { t } = useTranslation();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: string }
  const [restoreConfirmFile, setRestoreConfirmFile] = useState(null);
  const fileInputRef = useRef(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backups', { headers: getAuthHeaders() });
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
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/backups/export', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: t('backupsAdmin.successGenerate') });
        fetchBackups();
      } else {
        setMessage({ type: 'error', text: data.message || t('backupsAdmin.errorGenerate') });
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('backupsAdmin.errorGenerate') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBackup = async (filename) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/backups/restore', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: t('backupsAdmin.successRestore') });
        setRestoreConfirmFile(null);
      } else {
        setMessage({ type: 'error', text: data.message || t('backupsAdmin.errorRestore') });
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('backupsAdmin.errorRestore') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const text = await file.text();
      const backupJson = JSON.parse(text);

      const res = await fetch('/api/admin/backups/upload', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(backupJson)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('backupsAdmin.successRestore') });
        fetchBackups();
      } else {
        setMessage({ type: 'error', text: data.message || t('backupsAdmin.errorRestore') });
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
    link.href = `/api/admin/backups/download/${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="layout-col-gap-lg">
      <div className="m3-card glassmorphism p-4">
        <div className="flex-between flex-wrap gap-md mb-3">
          <div>
            <h2 className="text-xl font-bold flex-align-center gap-sm">
              <Database className="text-accent" size={22} />
              {t('backupsAdmin.title')}
            </h2>
            <p className="text-secondary text-sm mt-1">{t('backupsAdmin.subtitle')}</p>
          </div>

          <div className="flex-align-center gap-sm">
            <button
              className="m3-button m3-button-primary flex-align-center gap-xs"
              onClick={handleGenerateBackup}
              disabled={actionLoading}
            >
              <Database size={16} />
              {t('backupsAdmin.generateBtn')}
            </button>

            <button
              className="m3-button m3-button-secondary flex-align-center gap-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={actionLoading}
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
              className="m3-button m3-button-ghost"
              onClick={fetchBackups}
              disabled={loading}
              title={t('backupsAdmin.refreshBtn')}
            >
              <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
            </button>
          </div>
        </div>

        {message && (
          <div className={`m3-alert ${message.type === 'success' ? 'm3-alert-success' : 'm3-alert-error'} mb-3`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2">{t('backupsAdmin.listTitle')}</h3>
          {loading ? (
            <p className="text-secondary text-sm">{t('common.loading')}</p>
          ) : backups.length === 0 ? (
            <p className="text-secondary text-sm">No hay copias de seguridad disponibles.</p>
          ) : (
            <div className="table-responsive">
              <table className="m3-table">
                <thead>
                  <tr>
                    <th>{t('backupsAdmin.filename')}</th>
                    <th>{t('backupsAdmin.size')}</th>
                    <th>{t('backupsAdmin.updatedAt')}</th>
                    <th>{t('backupsAdmin.source')}</th>
                    <th className="text-right">{t('backupsAdmin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((item) => (
                    <tr key={item.filename}>
                      <td className="font-mono text-sm">{item.filename}</td>
                      <td>{item.sizeKB} KB</td>
                      <td>{new Date(item.updatedAt).toLocaleString()}</td>
                      <td>
                        <span className="badge flex-align-center gap-xs inline-flex">
                          {item.source === 'azure' ? (
                            <>
                              <Cloud size={14} className="text-accent" /> Azure Blob
                            </>
                          ) : (
                            <>
                              <HardDrive size={14} /> Local
                            </>
                          )}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex-align-center justify-end gap-xs">
                          <button
                            className="m3-button-icon"
                            title={t('backupsAdmin.download')}
                            onClick={() => handleDownload(item.filename)}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className="m3-button m3-button-danger-ghost m3-button-xs"
                            onClick={() => setRestoreConfirmFile(item.filename)}
                          >
                            {t('backupsAdmin.restore')}
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
      </div>

      {/* Modal de confirmacion de restauracion */}
      {restoreConfirmFile && (
        <div className="m3-modal-overlay">
          <div className="m3-modal-card glassmorphism p-4 max-w-md">
            <h3 className="text-lg font-bold flex-align-center gap-sm text-danger mb-2">
              <AlertTriangle size={20} />
              {t('backupsAdmin.confirmRestoreTitle')}
            </h3>
            <p className="text-sm text-secondary mb-3">{t('backupsAdmin.confirmRestoreMsg')}</p>
            <p className="text-xs font-mono bg-surface p-2 rounded mb-4">{restoreConfirmFile}</p>
            <div className="flex-between justify-end gap-sm">
              <button className="m3-button m3-button-ghost" onClick={() => setRestoreConfirmFile(null)}>
                {t('common.cancel')}
              </button>
              <button
                className="m3-button m3-button-danger"
                onClick={() => handleRestoreBackup(restoreConfirmFile)}
                disabled={actionLoading}
              >
                {t('backupsAdmin.restore')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
