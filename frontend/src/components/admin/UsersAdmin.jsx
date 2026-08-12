import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { getSortedData } from '../../utils/sorting';
import { validatePassword } from '../../utils/passwordValidation';
import UserFormAdmin from './UserFormAdmin';

export default function UsersAdmin({ getAuthHeaders, refreshUsers }) {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [availableAmbitos, setAvailableAmbitos] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSort, setUsersSort] = useState({ key: 'nombre', direction: 'asc' });
  const [userForm, setUserForm] = useState({ id_usuario: '', nombre: '', apellidos: '', correo: '', password: '', perfil: 'PM', activo: true, metodo_acceso: 'PASSWORD', ambitos: [1] });
  const [editingUserId, setEditingUserId] = useState(null);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  const pwdErrors = userForm.metodo_acceso === 'ENTRA_ID' ? [] : validatePassword(userForm.password);
  const isUserSubmitDisabled = userForm.metodo_acceso === 'ENTRA_ID'
    ? false
    : ((!editingUserId && !userForm.password) || (userForm.password && pwdErrors.length > 0));

  const fetchUsers = () => {
    setUsersLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar usuarios');
        return res.json();
      })
      .then(data => {
        setUsers(data);
        setUsersLoading(false);
      })
      .catch(err => {
        setUserError(err.message);
        setUsersLoading(false);
      });
  };

  const fetchAmbitosList = () => {
    fetch(`${import.meta.env.VITE_API_URL}/ambitos/admin`, {
      headers: getAuthHeaders()
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setAvailableAmbitos(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUsers();
    fetchAmbitosList();
  }, []);

  const handleUsersSort = (key) => {
    setUsersSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortHeader = (label, key, sortConfig, onSort, extraStyle = {}) => {
    const isSorted = sortConfig.key === key;
    return (
      <th 
        onClick={() => onSort(key)} 
        style={{ cursor: 'pointer', userSelect: 'none', ...extraStyle }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: extraStyle.textAlign === 'center' ? 'center' : 'flex-start' }}>
          {label}
          {isSorted ? (
            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          ) : (
            <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
          )}
        </div>
      </th>
    );
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    const isEdit = editingUserId !== null;
    const accessMethod = userForm.metodo_acceso || 'PASSWORD';

    if (!userForm.nombre || !userForm.apellidos || !userForm.correo || !userForm.perfil) {
      setUserError('Todos los campos excepto la contraseña son obligatorios.');
      return;
    }

    if (accessMethod === 'PASSWORD') {
      if (!isEdit && !userForm.password) {
        setUserError('La contraseña es obligatoria para nuevos usuarios con acceso local.');
        return;
      }

      if (userForm.password && validatePassword(userForm.password).length > 0) {
        setUserError('La contraseña no cumple con la política de seguridad requerida.');
        return;
      }
    }

    const payload = {
      nombre: userForm.nombre,
      apellidos: userForm.apellidos,
      correo: userForm.correo,
      perfil: userForm.perfil,
      activo: userForm.activo,
      metodo_acceso: accessMethod,
      ambitos: userForm.ambitos || [1]
    };

    if (accessMethod === 'PASSWORD' && userForm.password && userForm.password.trim() !== '') {
      payload.password = userForm.password;
    }

    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/admin/users/${editingUserId}` 
      : `${import.meta.env.VITE_API_URL}/admin/users`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar el usuario.');
        return data;
      })
      .then(() => {
        setUserSuccess(isEdit ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
        setUserForm({ id_usuario: '', nombre: '', apellidos: '', correo: '', password: '', perfil: 'PM', activo: true, metodo_acceso: 'PASSWORD', ambitos: [1] });
        setEditingUserId(null);
        fetchUsers();
        refreshUsers();
      })
      .catch(err => setUserError(err.message));
  };

  const handleEditUserClick = (usr) => {
    setUserForm({
      id_usuario: usr.id_usuario,
      nombre: usr.nombre,
      apellidos: usr.apellidos,
      correo: usr.correo,
      password: '',
      perfil: usr.perfil,
      activo: usr.activo,
      metodo_acceso: usr.metodo_acceso || 'PASSWORD',
      ambitos: usr.Ambitos ? usr.Ambitos.map(a => a.id_ambito) : [1]
    });
    setEditingUserId(usr.id_usuario);
    setUserError('');
    setUserSuccess('');
  };

  const handleDeleteUserClick = (id) => {
    if (!window.confirm('¿Seguro que desea eliminar de forma permanente este usuario? Se recomienda desactivarlo en su lugar.')) return;
    setUserError('');
    setUserSuccess('');

    fetch(`${import.meta.env.VITE_API_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar el usuario.');
        return data;
      })
      .then(() => {
        setUserSuccess('Usuario eliminado del sistema.');
        fetchUsers();
        refreshUsers();
      })
      .catch(err => setUserError(err.message));
  };

  const sortedUsers = getSortedData(users, usersSort.key, usersSort.direction);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
      <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>{t('usersAdmin.title', { count: users.length })}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{t('usersAdmin.subtitle')}</p>
        </div>

        {usersLoading ? (
          <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--md-sys-color-primary)', alignSelf: 'center' }} />
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>{t('usersAdmin.noUsers')}</div>
        ) : (
          <div className="m3-table-wrapper">
            <table className="m3-table">
              <thead>
                <tr>
                  {renderSortHeader(t('usersAdmin.name'), 'nombre', usersSort, handleUsersSort)}
                  {renderSortHeader(t('usersAdmin.email'), 'correo', usersSort, handleUsersSort)}
                  {renderSortHeader(t('usersAdmin.role'), 'perfil', usersSort, handleUsersSort, { textAlign: 'center' })}
                  <th style={{ textAlign: 'center' }}>Ámbitos</th>
                  {renderSortHeader(t('usersAdmin.status'), 'activo', usersSort, handleUsersSort, { textAlign: 'center', width: '80px' })}
                  <th style={{ width: '90px' }}>{t('usersAdmin.action')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map(u => (
                  <tr key={u.id_usuario} style={{ opacity: u.activo ? 1 : 0.6 }}>
                    <td style={{ fontWeight: 500 }}>{u.nombre} {u.apellidos}</td>
                    <td style={{ fontSize: '0.85rem' }}>{u.correo}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`m3-badge ${u.perfil === 'ADMINISTRADOR' ? 'badge-primary' : (u.perfil === 'DIRECTOR' ? 'badge-amber' : 'badge-secondary')}`}>
                        {u.perfil}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {(u.Ambitos && u.Ambitos.length > 0) ? (
                          u.Ambitos.map(a => (
                            <span key={a.id_ambito} style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(0,200,83,0.15)', color: '#00c853', fontWeight: 600 }}>
                              {a.code || a.nombre}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#888' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`m3-badge ${u.activo ? 'badge-green' : 'badge-red'}`}>
                        {u.activo ? t('usersAdmin.active') : t('usersAdmin.inactive')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn" onClick={() => handleEditUserClick(u)} title={t('common.edit')}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDeleteUserClick(u.id_usuario)} title={t('common.delete')}>
                          <Trash2 size={16} />
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

      <UserFormAdmin 
        userForm={userForm}
        setUserForm={setUserForm}
        editingUserId={editingUserId}
        setEditingUserId={setEditingUserId}
        userError={userError}
        userSuccess={userSuccess}
        onSubmit={handleUserSubmit}
        isUserSubmitDisabled={isUserSubmitDisabled}
        pwdErrors={pwdErrors}
        availableAmbitos={availableAmbitos}
      />
    </div>
  );
}
