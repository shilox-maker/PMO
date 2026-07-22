import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, RefreshCw, XCircle, CheckCircle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { getSortedData } from '../../utils/sorting';
import { validatePassword } from '../../utils/passwordValidation';
import UserFormAdmin from './UserFormAdmin';

export default function UsersAdmin({ getAuthHeaders, refreshUsers }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSort, setUsersSort] = useState({ key: 'nombre', direction: 'asc' });
  const [userForm, setUserForm] = useState({ id_usuario: '', nombre: '', apellidos: '', correo: '', password: '', perfil: 'PM', activo: true, metodo_acceso: 'PASSWORD' });
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

  useEffect(() => {
    fetchUsers();
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
      metodo_acceso: accessMethod
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
        setUserForm({ id_usuario: '', nombre: '', apellidos: '', correo: '', password: '', perfil: 'PM', activo: true, metodo_acceso: 'PASSWORD' });
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
      metodo_acceso: usr.metodo_acceso || 'PASSWORD'
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
      <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>Personal Interno / Gestores</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Lista de usuarios con acceso a la plataforma.</p>
        </div>

        {usersLoading ? (
          <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--md-sys-color-primary)', alignSelf: 'center' }} />
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>No hay usuarios en la base de datos.</div>
        ) : (
          <div className="m3-table-wrapper">
            <table className="m3-table">
              <thead>
                <tr>
                  {renderSortHeader('Nombre y Apellidos', 'nombre', usersSort, handleUsersSort)}
                  {renderSortHeader('Correo', 'correo', usersSort, handleUsersSort)}
                  {renderSortHeader('Perfil', 'perfil', usersSort, handleUsersSort)}
                  {renderSortHeader('Método', 'metodo_acceso', usersSort, handleUsersSort)}
                  {renderSortHeader('Estado', 'activo', usersSort, handleUsersSort, { width: '100px', textAlign: 'center' })}
                  <th style={{ width: '90px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {getSortedData(users, usersSort).map(usr => (
                  <tr key={usr.id_usuario} style={{ backgroundColor: editingUserId === usr.id_usuario ? 'var(--md-sys-color-primary-container)' : 'transparent' }}>
                    <td style={{ fontWeight: 600 }}>{usr.nombre} {usr.apellidos}</td>
                    <td style={{ fontSize: '0.85rem' }}>{usr.correo}</td>
                    <td>
                      <span className="badge badge-blue" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {usr.perfil}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold', 
                        backgroundColor: usr.metodo_acceso === 'ENTRA_ID' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(0, 122, 255, 0.15)',
                        color: usr.metodo_acceso === 'ENTRA_ID' ? 'var(--color-rag-green, #34c759)' : 'var(--md-sys-color-primary, #007aff)'
                      }}>
                        {usr.metodo_acceso === 'ENTRA_ID' ? 'Entra ID' : 'Contraseña'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {usr.activo ? (
                        <CheckCircle size={18} style={{ color: 'var(--color-rag-green)' }} title="Activo" />
                      ) : (
                        <XCircle size={18} style={{ color: 'var(--color-rag-red)' }} title="Inactivo" />
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn" onClick={() => handleEditUserClick(usr)} style={{ color: 'var(--md-sys-color-primary)' }} title="Editar">
                          <Edit2 size={15} />
                        </button>
                        <button className="icon-btn" onClick={() => handleDeleteUserClick(usr.id_usuario)} style={{ color: 'var(--color-rag-red)' }} title="Eliminar">
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
      />
    </div>
  );
}
