import React from 'react';

export default function UserFormAdmin({
  userForm,
  setUserForm,
  editingUserId,
  setEditingUserId,
  userError,
  userSuccess,
  onSubmit,
  isUserSubmitDisabled,
  pwdErrors
}) {
  return (
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

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
  );
}
