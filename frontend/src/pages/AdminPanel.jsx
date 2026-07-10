import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sliders, Users, Plus, Edit2, Trash2, Shield, 
  CheckCircle, XCircle, RefreshCw, AlertTriangle,
  ArrowUp, ArrowDown, ArrowUpDown, Briefcase, Coins
} from 'lucide-react';
import { getSortedData } from '../utils/sorting';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import CapexTypesAdmin from '../components/admin/CapexTypesAdmin';

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
  const [stateForm, setStateForm] = useState({ id_estado: '', nombre_estado: '', icono: '', orden: '', proyecto_cerrado: false, pasos: '', descripcion: '' });
  const [editingStateId, setEditingStateId] = useState(null);
  const [stateError, setStateError] = useState('');
  const [stateSuccess, setStateSuccess] = useState('');

  // Users list
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState({ id_usuario: '', nombre: '', apellidos: '', correo: '', password: '', perfil: 'PM', activo: true, metodo_acceso: 'PASSWORD' });
  const [editingUserId, setEditingUserId] = useState(null);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  const pwdErrors = userForm.metodo_acceso === 'ENTRA_ID' ? [] : validatePassword(userForm.password);
  const isUserSubmitDisabled = userForm.metodo_acceso === 'ENTRA_ID'
    ? false
    : ((!editingUserId && !userForm.password) || (userForm.password && pwdErrors.length > 0));

  // Sedes list
  const [sedes, setSedes] = useState([]);
  const [sedesLoading, setSedesLoading] = useState(false);
  const [sedeForm, setSedeForm] = useState({ id_sede: '', nombre_sede: '' });
  const [editingSedeId, setEditingSedeId] = useState(null);
  const [sedeError, setSedeError] = useState('');
  const [sedeSuccess, setSedeSuccess] = useState('');

  // Portfolios list
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({ id: '', nombre: '', descripcion: '' });
  const [editingPortfolioId, setEditingPortfolioId] = useState(null);
  const [portfolioError, setPortfolioError] = useState('');
  const [portfolioSuccess, setPortfolioSuccess] = useState('');

  // Portfolio budgets state
  const [selectedPortfolioForBudgets, setSelectedPortfolioForBudgets] = useState(null);
  const [portfolioBudgets, setPortfolioBudgets] = useState([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ id_tipo_capex: '', id_subtipo_capex: '', importe: '' });
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

  const handleOpenBudgets = (portfolio) => {
    setSelectedPortfolioForBudgets(portfolio);
    setBudgetForm({ id_tipo_capex: '', id_subtipo_capex: '', importe: '' });
    setBudgetError('');
    setBudgetSuccess('');
    fetchPortfolioBudgets(portfolio.id);
    if (capexTypes.length === 0) {
      fetchCapexTypes();
    }
  };

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    setBudgetError('');
    setBudgetSuccess('');

    if (!budgetForm.id_tipo_capex || !budgetForm.importe) {
      setBudgetError('El tipo de CAPEX y el importe son obligatorios.');
      return;
    }

    const payload = {
      id_tipo_capex: parseInt(budgetForm.id_tipo_capex, 10),
      id_subtipo_capex: budgetForm.id_subtipo_capex ? parseInt(budgetForm.id_subtipo_capex, 10) : null,
      importe: parseFloat(budgetForm.importe)
    };

    fetch(`${import.meta.env.VITE_API_URL}/admin/portfolios/${selectedPortfolioForBudgets.id}/budgets`, {
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
        fetchPortfolioBudgets(selectedPortfolioForBudgets.id);
      })
      .catch(err => setBudgetError(err.message));
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
        fetchPortfolioBudgets(selectedPortfolioForBudgets.id);
      })
      .catch(err => setBudgetError(err.message));
  };

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

  // Fetch Sedes from backend
  const fetchSedes = () => {
    setSedesLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/sedes`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar sedes');
        return res.json();
      })
      .then(data => {
        setSedes(data);
        setSedesLoading(false);
      })
      .catch(err => {
        setSedeError(err.message);
        setSedesLoading(false);
      });
  };

  // Fetch Portfolios from backend
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
    if (activeTab === 'states') {
      fetchStates();
    } else if (activeTab === 'sedes') {
      fetchSedes();
    } else if (activeTab === 'portfolios') {
      fetchPortfolios();
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
      proyecto_cerrado: !!stateForm.proyecto_cerrado,
      pasos: stateForm.pasos || '',
      descripcion: stateForm.descripcion || ''
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
        setStateForm({ id_estado: '', nombre_estado: '', icono: '', orden: '', proyecto_cerrado: false, pasos: '', descripcion: '' });
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
      proyecto_cerrado: !!state.proyecto_cerrado,
      pasos: state.pasos || '',
      descripcion: state.descripcion || ''
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

  // Sedes handlers
  const handleSedeSubmit = (e) => {
    e.preventDefault();
    setSedeError('');
    setSedeSuccess('');

    if (!sedeForm.nombre_sede) {
      setSedeError('El nombre de la sede es obligatorio.');
      return;
    }

    const isEdit = editingSedeId !== null;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/admin/sedes/${editingSedeId}` 
      : `${import.meta.env.VITE_API_URL}/admin/sedes`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({ nombre_sede: sedeForm.nombre_sede })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar la sede.');
        return data;
      })
      .then(() => {
        setSedeSuccess(isEdit ? 'Sede actualizada correctamente.' : 'Sede creada correctamente.');
        setSedeForm({ id_sede: '', nombre_sede: '' });
        setEditingSedeId(null);
        fetchSedes();
      })
      .catch(err => setSedeError(err.message));
  };

  const handleEditSedeClick = (s) => {
    setSedeForm({ id_sede: s.id_sede, nombre_sede: s.nombre_sede });
    setEditingSedeId(s.id_sede);
    setSedeError('');
    setSedeSuccess('');
  };

  const handleDeleteSedeClick = (id) => {
    if (!window.confirm('¿Seguro que desea eliminar esta sede?')) return;
    setSedeError('');
    setSedeSuccess('');

    fetch(`${import.meta.env.VITE_API_URL}/admin/sedes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar la sede.');
        return data;
      })
      .then(() => {
        setSedeSuccess('Sede eliminada del sistema.');
        fetchSedes();
      })
      .catch(err => setSedeError(err.message));
  };

  // Portfolios handlers
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
        <button className={`m3-tab ${activeTab === 'sedes' ? 'active' : ''}`} onClick={() => setActiveTab('sedes')}>
          <Edit2 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Sedes
        </button>
        <button className={`m3-tab ${activeTab === 'portfolios' ? 'active' : ''}`} onClick={() => setActiveTab('portfolios')}>
          <Briefcase size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Portfolios
        </button>
        <button className={`m3-tab ${activeTab === 'capex' ? 'active' : ''}`} onClick={() => setActiveTab('capex')}>
          <Sliders size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Tipos CAPEX
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
                      {renderSortHeader('Estado', 'nombre_estado', statesSort, handleStatesSort, { width: '180px' })}
                      <th>Descripción</th>
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
                        <td style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{st.descripcion || <em style={{ opacity: 0.5 }}>Sin descripción</em>}</td>
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

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea 
                  value={stateForm.descripcion || ''}
                  onChange={(e) => setStateForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Describe brevemente este estado del proyecto..."
                  className="m3-input"
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '40px' }}>
                <label className="form-label">Pasos a seguir en esta fase (Guía para el usuario)</label>
                <div style={{ background: 'var(--md-sys-color-surface)' }}>
                  <ReactQuill 
                    theme="snow"
                    value={stateForm.pasos || ''}
                    onChange={(val) => setStateForm(prev => ({ ...prev, pasos: val }))}
                    placeholder="Describe las acciones, entregables o checklist para esta fase..."
                    style={{ height: '150px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {editingStateId && (
                  <button 
                    type="button" 
                    className="m3-btn m3-btn-outline" 
                    style={{ flexGrow: 1 }}
                    onClick={() => {
                      setEditingStateId(null);
                      setStateForm({ id_estado: '', nombre_estado: '', icono: '', orden: '', proyecto_cerrado: false, pasos: '', descripcion: '' });
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
                  Contraseña {userForm.metodo_acceso === 'ENTRA_ID' ? '(No requerida para Entra ID)' : (editingUserId ? '(Dejar vacío para mantener actual)' : '*')}
                </label>
                <input 
                  type="password" 
                  value={userForm.metodo_acceso === 'ENTRA_ID' ? '' : userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  required={userForm.metodo_acceso === 'PASSWORD' && !editingUserId}
                  disabled={userForm.metodo_acceso === 'ENTRA_ID'}
                  placeholder={userForm.metodo_acceso === 'ENTRA_ID' ? "Autenticación externa gestionada por Microsoft Entra ID" : "Ej: Tr4ctor.2026!"}
                  className="m3-input"
                  style={{ 
                    borderColor: userForm.metodo_acceso === 'PASSWORD' && userForm.password && pwdErrors.length > 0 ? 'var(--color-rag-red)' : '',
                    opacity: userForm.metodo_acceso === 'ENTRA_ID' ? 0.6 : 1
                  }}
                />
                {userForm.metodo_acceso === 'PASSWORD' && userForm.password && pwdErrors.length > 0 && (
                  <ul style={{ color: 'var(--color-rag-red)', fontSize: '0.75rem', marginTop: 4, paddingLeft: 16 }}>
                    {pwdErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Método de Acceso *</label>
                <select 
                  value={userForm.metodo_acceso || 'PASSWORD'}
                  onChange={(e) => setUserForm(prev => ({ ...prev, metodo_acceso: e.target.value, password: e.target.value === 'ENTRA_ID' ? '' : prev.password }))}
                  className="user-select"
                >
                  <option value="PASSWORD">Contraseña Local</option>
                  <option value="ENTRA_ID">Microsoft Entra ID (SSO)</option>
                </select>
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
                      setUserForm({ id_usuario: '', nombre: '', apellidos: '', correo: '', password: '', perfil: 'PM', activo: true, metodo_acceso: 'PASSWORD' });
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

      {activeTab === 'sedes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
          {/* List of Sedes */}
          <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>Sedes ({sedes.length})</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Listado de oficinas y sedes corporativas.</p>
            </div>

            {sedesLoading ? (
              <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--md-sys-color-primary)', alignSelf: 'center' }} />
            ) : sedes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>No hay sedes creadas.</div>
            ) : (
              <div className="m3-table-wrapper">
                <table className="m3-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>ID</th>
                      <th>Nombre de Sede</th>
                      <th style={{ width: '90px' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sedes.map(s => (
                      <tr key={s.id_sede}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{s.id_sede}</td>
                        <td style={{ fontWeight: 500 }}>{s.nombre_sede}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="icon-btn" onClick={() => handleEditSedeClick(s)} title="Editar Sede">
                              <Edit2 size={16} />
                            </button>
                            <button className="icon-btn danger" onClick={() => handleDeleteSedeClick(s.id_sede)} title="Eliminar Sede">
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

          {/* Sede Form */}
          <div className="m3-card glass-panel" style={{ position: 'sticky', top: 24 }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 16 }}>
              {editingSedeId ? 'Editar Sede' : 'Añadir Nueva Sede'}
            </h3>
            
            {sedeError && (
              <div className="status-alert alert-error" style={{ marginBottom: 16 }}>
                <XCircle size={18} />
                <span>{sedeError}</span>
              </div>
            )}

            {sedeSuccess && (
              <div className="status-alert alert-success" style={{ marginBottom: 16 }}>
                <CheckCircle size={18} />
                <span>{sedeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSedeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nombre de Sede *</label>
                <input 
                  type="text" 
                  value={sedeForm.nombre_sede}
                  onChange={(e) => setSedeForm(prev => ({ ...prev, nombre_sede: e.target.value }))}
                  className="m3-input"
                  placeholder="Ej: Oficinas Centrales"
                  autoComplete="off"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {editingSedeId && (
                  <button 
                    type="button" 
                    className="m3-btn m3-btn-outline" 
                    style={{ flexGrow: 1 }}
                    onClick={() => {
                      setEditingSedeId(null);
                      setSedeForm({ id_sede: '', nombre_sede: '' });
                    }}
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1 }} disabled={!sedeForm.nombre_sede}>
                  {editingSedeId ? 'Guardar Cambios' : 'Registrar Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'portfolios' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
          {/* List of Portfolios */}
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

          {/* Portfolio Form / Budget Form */}
          <div className="m3-card glass-panel" style={{ position: 'sticky', top: 24 }}>
            {selectedPortfolioForBudgets ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>
                    Presupuesto: {selectedPortfolioForBudgets.nombre}
                  </h3>
                  <button 
                    className="m3-btn m3-btn-outline" 
                    style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '8px', minHeight: 'unset', height: '28px' }}
                    onClick={() => setSelectedPortfolioForBudgets(null)}
                  >
                    Volver
                  </button>
                </div>

                {/* List of budgets configured */}
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
                            <th style={{ width: '40px' }}></th>
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
                                <button className="icon-btn danger" onClick={() => handleDeleteBudget(b.id)} style={{ color: 'var(--color-rag-red)', padding: 2 }} title="Eliminar Presupuesto">
                                  <Trash2 size={13} />
                                </button>
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

                {/* Form to add a new budget line */}
                <form onSubmit={handleBudgetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16 }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, color: 'var(--md-sys-color-primary)' }}>
                    Añadir Línea de Presupuesto
                  </h4>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Tipo de CAPEX *</label>
                    <select
                      value={budgetForm.id_tipo_capex}
                      onChange={(e) => setBudgetForm(prev => ({ ...prev, id_tipo_capex: e.target.value, id_subtipo_capex: '' }))}
                      className="user-select"
                      style={{ height: '36px', fontSize: '0.85rem' }}
                      required
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
                      disabled={!budgetForm.id_tipo_capex}
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

                  <button type="submit" className="m3-btn m3-btn-primary" style={{ marginTop: 8, height: '36px', fontSize: '0.85rem' }}>
                    <Plus size={14} style={{ marginRight: 6 }} /> Añadir Presupuesto
                  </button>
                </form>
              </div>
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
      )}
      {activeTab === 'capex' && (
        <CapexTypesAdmin getAuthHeaders={getAuthHeaders} />
      )}
    </div>
  );
}

