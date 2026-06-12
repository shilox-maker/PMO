import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sliders, Users, Plus, Edit2, Trash2, Shield, 
  CheckCircle, XCircle, RefreshCw, AlertTriangle,
  ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import { getSortedData } from '../utils/sorting';

const validatePassword = (pwd) => {
  if (!pwd) return [];
  const errors = [];
  if (pwd.length < 10) errors.push('Mínimo 10 caracteres');
  if (!/[A-Z]/.test(pwd)) errors.push('Al menos una mayúscula');
  if (!/[a-z]/.test(pwd)) errors.push('Al menos una minúscula');
  if (!/\d/.test(pwd)) errors.push('Al menos un número');
  if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]/.test(pwd)) errors.push('Al menos un carácter especial');
  return errors;
};

export default function AdminPanel() {
  const { getAuthHeaders, refreshUsers } = useAuth();
  const [activeTab, setActiveTab] = useState('states'); // 'states' or 'users'

  // Sort states
  const [statesSort, setStatesSort] = useState({ key: 'orden', direction: 'asc' });
  const [usersSort, setUsersSort] = useState({ key: 'nombre', direction: 'asc' });

  const handleStatesSort = (key) => {
    setStatesSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

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


  // States list
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [stateForm, setStateForm] = useState({ id_estado: '', nombre_estado: '', icono: '', orden: '', proyecto_cerrado: false });
  const [editingStateId, setEditingStateId] = useState(null);
  const [stateError, setStateError] = useState('');
  const [stateSuccess, setStateSuccess] = useState('');

  // Users list
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState({ id_usuario: '', nombre: '', apellidos: '', correo: '', password: '', perfil: 'PM', activo: true });
  const [editingUserId, setEditingUserId] = useState(null);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  const pwdErrors = validatePassword(userForm.password);
  const isUserSubmitDisabled = (!editingUserId && !userForm.password) || (userForm.password && pwdErrors.length > 0);

  // Fetch States from backend
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
      })
      .catch(err => {
        setStateError(err.message);
        setStatesLoading(false);
      });
  };

  // Fetch Users from backend
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
    if (activeTab === 'states') {
      fetchStates();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  // Handle State Form Submit
  const handleStateSubmit = (e) => {
    e.preventDefault();
    setStateError('');
    setStateSuccess('');

    if (!stateForm.nombre_estado || stateForm.orden === '') {
      setStateError('El nombre del estado y el orden son obligatorios.');
      return;
    }

    const payload = {
      nombre_estado: stateForm.nombre_estado,
      icono: stateForm.icono || null,
      orden: parseInt(stateForm.orden, 10),
      proyecto_cerrado: !!stateForm.proyecto_cerrado
    };

    const isEdit = editingStateId !== null;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/admin/states/${editingStateId}` 
      : `${import.meta.env.VITE_API_URL}/admin/states`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar el estado.');
        return data;
      })
      .then(() => {
        setStateSuccess(isEdit ? 'Estado actualizado correctamente.' : 'Estado creado correctamente.');
        setStateForm({ id_estado: '', nombre_estado: '', icono: '', orden: '', proyecto_cerrado: false });
        setEditingStateId(null);
        fetchStates();
      })
      .catch(err => setStateError(err.message));
  };

  const handleEditStateClick = (state) => {
    setStateForm({
      id_estado: state.id_estado,
      nombre_estado: state.nombre_estado,
      icono: state.icono || '',
      orden: state.orden.toString(),
      proyecto_cerrado: !!state.proyecto_cerrado
    });
    setEditingStateId(state.id_estado);
    setStateError('');
    setStateSuccess('');
  };

  const handleDeleteStateClick = (id) => {
    if (!window.confirm('¿Seguro que desea eliminar este estado?')) return;
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

  // Handle User Form Submit
  const handleUserSubmit = (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    const isEdit = editingUserId !== null;

    if (!userForm.nombre || !userForm.apellidos || !userForm.correo || !userForm.perfil) {
      setUserError('Todos los campos excepto la contraseña son obligatorios.');
      return;
    }

    if (!isEdit && !userForm.password) {
      setUserError('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    if (userForm.password && validatePassword(userForm.password).length > 0) {
      setUserError('La contraseña no cumple con la política de seguridad requerida.');
      return;
    }

    const payload = {
      nombre: userForm.nombre,
      apellidos: userForm.apellidos,
      correo: userForm.correo,
      perfil: userForm.perfil,
      activo: userForm.activo
    };

    if (userForm.password && userForm.password.trim() !== '') {
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
        setUserForm({ id_usuario: '', nombre: '', apellidos: '', correo: '', password: '', perfil: 'PM', activo: true });
        setEditingUserId(null);
        fetchUsers();
        refreshUsers(); // Refresh active user options in AuthContext
      })
      .catch(err => setUserError(err.message));
  };

  const handleEditUserClick = (usr) => {
    setUserForm({
      id_usuario: usr.id_usuario,
      nombre: usr.nombre,
      apellidos: usr.apellidos,
      correo: usr.correo,
      password: '', // Leave empty for security, edit only if typed
      perfil: usr.perfil,
      activo: usr.activo
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Sub tabs switcher */}
      <div className="m3-tabs-container">
        <button className={`m3-tab ${activeTab === 'states' ? 'active' : ''}`} onClick={() => setActiveTab('states')}>
          <Sliders size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Mantenimiento de Estados
        </button>
        <button className={`m3-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Mantenimiento de Usuarios
        </button>
      </div>

      {activeTab === 'states' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
          {/* List of States */}
          <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>Workflow del Portfolio ({states.length} estados)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Lista de estados ordenados secuencialmente.</p>
            </div>

            {statesLoading ? (
              <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--md-sys-color-primary)', alignSelf: 'center' }} />
            ) : states.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>No hay estados creados en la base de datos.</div>
            ) : (
              <div className="m3-table-wrapper">
                <table className="m3-table">
                  <thead>
                    <tr>
                      {renderSortHeader('Orden', 'orden', statesSort, handleStatesSort, { width: '80px', textAlign: 'center' })}
                      {renderSortHeader('Estado', 'nombre_estado', statesSort, handleStatesSort)}
                      {renderSortHeader('Icono', 'icono', statesSort, handleStatesSort, { width: '80px', textAlign: 'center' })}
                      {renderSortHeader('Tipo', 'proyecto_cerrado', statesSort, handleStatesSort, { width: '100px', textAlign: 'center' })}
                      <th style={{ width: '90px' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedData(states, statesSort).map(st => (
                      <tr key={st.id_estado} style={{ backgroundColor: editingStateId === st.id_estado ? 'var(--md-sys-color-primary-container)' : 'transparent' }}>
                        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{st.orden}</td>
                        <td style={{ fontWeight: 600 }}>{st.nombre_estado}</td>
                        <td style={{ fontSize: '1.2rem', textAlign: 'center' }}>{st.icono || '❓'}</td>
                        <td style={{ textAlign: 'center' }}>
                          {st.proyecto_cerrado ? (
                            <span className="badge badge-red" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Cerrado</span>
                          ) : (
                            <span className="badge badge-blue" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Abierto</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="icon-btn" onClick={() => handleEditStateClick(st)} style={{ color: 'var(--md-sys-color-primary)' }} title="Editar">
                              <Edit2 size={15} />
                            </button>
                            <button className="icon-btn" onClick={() => handleDeleteStateClick(st.id_estado)} style={{ color: 'var(--color-rag-red)' }} title="Eliminar">
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

          {/* Create / Edit Form */}
          <div className="m3-card glass-panel" style={{ position: 'sticky', top: '24px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 16 }}>
              {editingStateId ? 'Modificar Estado' : 'Nuevo Estado Workflow'}
            </h3>

            {stateError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem', fontWeight: 500 }}>
                {stateError}
              </div>
            )}

            {stateSuccess && (
              <div style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--color-rag-green)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem', fontWeight: 500 }}>
                {stateSuccess}
              </div>
            )}

            <form onSubmit={handleStateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nombre del Estado *</label>
                <input 
                  type="text" 
                  value={stateForm.nombre_estado}
                  onChange={(e) => setStateForm(prev => ({ ...prev, nombre_estado: e.target.value }))}
                  required
                  placeholder="Ej: Validación Técnica"
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emoji / Icono (Opcional)</label>
                <input 
                  type="text" 
                  maxLength={5}
                  value={stateForm.icono}
                  onChange={(e) => setStateForm(prev => ({ ...prev, icono: e.target.value }))}
                  placeholder="Ej: 🔍, ⚙️, 📦"
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número de Orden Semántico *</label>
                <input 
                  type="number" 
                  required
                  value={stateForm.orden}
                  onChange={(e) => setStateForm(prev => ({ ...prev, orden: e.target.value }))}
                  placeholder="Ej: 6"
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={stateForm.proyecto_cerrado}
                    onChange={(e) => setStateForm(prev => ({ ...prev, proyecto_cerrado: e.target.checked }))}
                    className="m3-checkbox"
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Proyecto cerrado</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {editingStateId && (
                  <button 
                    type="button" 
                    className="m3-btn m3-btn-outline" 
                    style={{ flexGrow: 1 }}
                    onClick={() => {
                      setEditingStateId(null);
                      setStateForm({ id_estado: '', nombre_estado: '', icono: '', orden: '', proyecto_cerrado: false });
                    }}
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1 }}>
                  {editingStateId ? 'Guardar Cambios' : 'Registrar Estado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
          {/* List of Users */}
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

          {/* Create / Edit User Form */}
          <div className="m3-card glass-panel" style={{ position: 'sticky', top: '24px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 16 }}>
              {editingUserId ? 'Modificar Usuario' : 'Nuevo Usuario Interno'}
            </h3>

            {userError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem', fontWeight: 500 }}>
                {userError}
              </div>
            )}

            {userSuccess && (
              <div style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--color-rag-green)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem', fontWeight: 500 }}>
                {userSuccess}
              </div>
            )}

            <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input 
                    type="text" 
                    value={userForm.nombre}
                    onChange={(e) => setUserForm(prev => ({ ...prev, nombre: e.target.value }))}
                    required
                    placeholder="Jaime"
                    className="m3-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos *</label>
                  <input 
                    type="text" 
                    value={userForm.apellidos}
                    onChange={(e) => setUserForm(prev => ({ ...prev, apellidos: e.target.value }))}
                    required
                    placeholder="Martínez"
                    className="m3-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico *</label>
                <input 
                  type="email" 
                  value={userForm.correo}
                  onChange={(e) => setUserForm(prev => ({ ...prev, correo: e.target.value }))}
                  required
                  placeholder="jmartinez@dacsa.com"
                  className="m3-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Contraseña {editingUserId ? '(Dejar vacío para mantener actual)' : '*'}
                </label>
                <input 
                  type="password" 
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  required={!editingUserId}
                  placeholder="Ej: Tr4ctor.2026!"
                  className="m3-input"
                  style={{ borderColor: userForm.password && pwdErrors.length > 0 ? 'var(--color-rag-red)' : '' }}
                />
                {userForm.password && pwdErrors.length > 0 && (
                  <ul style={{ color: 'var(--color-rag-red)', fontSize: '0.75rem', marginTop: 4, paddingLeft: 16 }}>
                    {pwdErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Perfil / Rol *</label>
                <select 
                  value={userForm.perfil}
                  onChange={(e) => setUserForm(prev => ({ ...prev, perfil: e.target.value }))}
                  className="user-select"
                >
                  <option value="PM">PM (Gestor Técnico)</option>
                  <option value="DIRECTOR">DIRECTOR (Control Ejecutivo)</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR (Acceso Total)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="m3-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={userForm.activo}
                    onChange={(e) => setUserForm(prev => ({ ...prev, activo: e.target.checked }))}
                    className="m3-checkbox"
                  />
                  <span>Usuario Activo (Permitir acceso)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {editingUserId && (
                  <button 
                    type="button" 
                    className="m3-btn m3-btn-outline" 
                    style={{ flexGrow: 1 }}
                    onClick={() => {
                      setEditingUserId(null);
                      setUserForm({ id_usuario: '', nombre: '', apellidos: '', correo: '', password: '', perfil: 'PM', activo: true });
                    }}
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1 }} disabled={isUserSubmitDisabled}>
                  {editingUserId ? 'Guardar Cambios' : 'Registrar PM / User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
