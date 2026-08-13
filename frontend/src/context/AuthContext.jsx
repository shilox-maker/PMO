import React, { createContext, useState, useEffect, useContext } from 'react';
import i18n from '../i18n';
import { API_URL } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [pms, setPms] = useState([]);
  const [currentPm, setCurrentPm] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRequests, setActiveRequests] = useState(0);
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Ámbitos / Multi-tenancy
  const [selectedAmbito, setSelectedAmbitoState] = useState(() => localStorage.getItem('pmo_selected_ambito_id') || '');
  const [availableAmbitos, setAvailableAmbitos] = useState([]);
  const [canSelectAll, setCanSelectAll] = useState(false);
  const [isFirstLoginSelection, setIsFirstLoginSelection] = useState(false);

  const changeAmbito = (newAmbitoId) => {
    const strVal = String(newAmbitoId || '');
    setSelectedAmbitoState(strVal);
    if (strVal) {
      localStorage.setItem('pmo_selected_ambito_id', strVal);
    } else {
      localStorage.removeItem('pmo_selected_ambito_id');
    }
  };

  const fetchUserAmbitos = async (userObj, tokenOverride, isFreshLogin = false) => {
    const savedToken = tokenOverride || token || localStorage.getItem('pm_token');
    if (!savedToken) return;
    try {
      const storedPmStr = localStorage.getItem('pm_user');
      const storedPm = storedPmStr ? JSON.parse(storedPmStr) : null;
      const activePm = userObj || currentPm || storedPm;
      const isUserAdminOrDirector = activePm && ['ADMINISTRADOR', 'DIRECTOR'].includes(activePm.perfil);

      if (activePm?.Ambitos && activePm.Ambitos.length > 0) {
        setAvailableAmbitos(activePm.Ambitos);
      }

      const res = await fetch(`${API_URL}/ambitos`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'X-Ambito-Id': localStorage.getItem('pmo_selected_ambito_id') || '1'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const userAmbitosList = (data.ambitos && data.ambitos.length > 0)
          ? data.ambitos
          : (activePm?.Ambitos || []);
        const allowAll = Boolean(isUserAdminOrDirector && data.canSelectAll);

        setAvailableAmbitos(userAmbitosList);
        setCanSelectAll(allowAll);

        const storedAmbito = localStorage.getItem('pmo_selected_ambito_id');

        if (isFreshLogin || !storedAmbito) {
          setIsFirstLoginSelection(true);
        } else if (storedAmbito) {
          const isValidStored = allowAll || storedAmbito === 'ALL' || userAmbitosList.some(a => String(a.id_ambito) === String(storedAmbito));
          if (!isValidStored && userAmbitosList.length > 0) {
            changeAmbito(String(userAmbitosList[0].id_ambito));
          }
        }
      }
    } catch (err) {
      console.error('Error cargando ámbitos:', err);
    }
  };

  const checkMaintenanceStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/maintenance/status`);
      if (res.ok) {
        const data = await res.json();
        setIsMaintenanceActive(!!data.maintenance_mode);
        if (data.maintenance_message) setMaintenanceMessage(data.maintenance_message);
        return data;
      }
    } catch (err) {
      console.error('Error verificación mantenimiento:', err);
    }
  };

  // Interceptar fetch global para monitorear actividad e inyectar X-Ambito-Id
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let [resource, config] = args;
      const url = typeof resource === 'string' ? resource : (resource?.url || '');

      if (url.includes('/api/')) {
        config = config || {};
        config.headers = {
          ...(config.headers || {}),
          'X-Ambito-Id': localStorage.getItem('pmo_selected_ambito_id') || '1'
        };
        args = [resource, config];
      }

      setActiveRequests(prev => prev + 1);
      try {
        const response = await originalFetch(...args);
        if (response.status === 503) {
          response.clone().json().then(data => {
            if (data?.maintenance) {
              setIsMaintenanceActive(true);
              if (data.error) setMaintenanceMessage(data.error);
            }
          }).catch(() => {});
        } else if (response.status === 401 && !url.includes('/login') && !url.includes('/auth/verify')) {
          setIsSessionExpired(true);
        }
        return response;
      } finally {
        setActiveRequests(prev => Math.max(0, prev - 1));
      }
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  useEffect(() => { checkMaintenanceStatus(); }, []);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'dacsa' : 'dark'));

  const fetchActiveUsers = () => {
    const savedToken = token || localStorage.getItem('pm_token');
    fetch(`${API_URL}/pms`, {
      headers: savedToken ? { 'Authorization': `Bearer ${savedToken}` } : {}
    })
      .then(res => res.json())
      .then(data => setPms(data))
      .catch(err => console.error('Failed to fetch PMs.', err));
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('pm_token');
    if (savedToken) {
      fetch(`${API_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Token expired');
        return res.json();
      })
      .then(data => {
        setCurrentPm(data.user);
        setToken(savedToken);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('pm_token');
        localStorage.removeItem('pm_user');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentPm) {
      fetchActiveUsers();
      fetchUserAmbitos(currentPm);
    }
  }, [currentPm]);

  const handleLoginResponse = async (data) => {
    localStorage.removeItem('pmo_selected_ambito_id');
    setSelectedAmbitoState('');
    setIsFirstLoginSelection(true);
    if (data.user?.Ambitos && data.user.Ambitos.length > 0) {
      setAvailableAmbitos(data.user.Ambitos);
    }
    localStorage.setItem('pm_token', data.token);
    localStorage.setItem('pm_user', JSON.stringify(data.user));
    setToken(data.token);
    setCurrentPm(data.user);
    await fetchUserAmbitos(data.user, data.token, true);
    return data;
  };

  const login = async (correo, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error de credenciales.');
    return handleLoginResponse(data);
  };

  const loginAzure = async (azureToken) => {
    const res = await fetch(`${API_URL}/login/azure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: azureToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión con Azure AD.');
    return handleLoginResponse(data);
  };

  useEffect(() => {
    if (currentPm?.idioma) {
      i18n.changeLanguage(currentPm.idioma);
      localStorage.setItem('user_language', currentPm.idioma);
    }
  }, [currentPm?.idioma]);

  const changeLanguage = async (newLang) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('user_language', newLang);
    if (currentPm) {
      setCurrentPm(prev => (prev ? { ...prev, idioma: newLang } : null));
      try {
        const savedToken = token || localStorage.getItem('pm_token');
        await fetch(`${API_URL}/users/me/language`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': savedToken ? `Bearer ${savedToken}` : ''
          },
          body: JSON.stringify({ idioma: newLang })
        });
      } catch (err) {
        console.error('Error preferencia idioma:', err);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    localStorage.removeItem('pmo_selected_ambito_id');
    setToken(null);
    setCurrentPm(null);
    setSelectedAmbitoState('');
    setIsSessionExpired(false);
    setAvailableAmbitos([]);
    setCanSelectAll(false);
    setIsFirstLoginSelection(false);
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'X-Ambito-Id': localStorage.getItem('pmo_selected_ambito_id') || '1'
  });

  return (
    <AuthContext.Provider value={{
      pms,
      currentPm,
      loading,
      getAuthHeaders,
      theme,
      toggleTheme,
      language: i18n.language || 'es',
      changeLanguage,
      login,
      loginAzure,
      logout,
      refreshUsers: fetchActiveUsers,
      isGlobalWorking: activeRequests > 0,
      isMaintenanceActive,
      maintenanceMessage,
      checkMaintenanceStatus,
      setIsMaintenanceActive,
      isSessionExpired,
      setIsSessionExpired,
      selectedAmbito,
      changeAmbito,
      availableAmbitos,
      canSelectAll,
      isFirstLoginSelection,
      setIsFirstLoginSelection,
      refreshAmbitos: fetchUserAmbitos
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
