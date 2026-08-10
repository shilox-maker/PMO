import React, { createContext, useState, useEffect, useContext } from 'react';
import i18n from '../i18n';

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

  const checkMaintenanceStatus = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/maintenance/status`);
      if (res.ok) {
        const data = await res.json();
        setIsMaintenanceActive(!!data.maintenance_mode);
        if (data.maintenance_message) setMaintenanceMessage(data.maintenance_message);
        return data;
      }
    } catch (err) {
      console.error('Error al verificar estado de mantenimiento:', err);
    }
  };

  // Interceptar fetch global para monitorear actividad en segundo plano, 503 y 401 (sesión expirada)
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      setActiveRequests(prev => prev + 1);
      try {
        const response = await originalFetch(...args);
        if (response.status === 503) {
          const clone = response.clone();
          clone.json().then(data => {
            if (data && data.maintenance) {
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
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Comprobar estado de mantenimiento al cargar
  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  // Toggle Theme (Light / Dark)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === 'dark') return 'dacsa';
      return 'dark';
    });
  };

  const fetchActiveUsers = () => {
    const savedToken = token || localStorage.getItem('pm_token');
    fetch(`${import.meta.env.VITE_API_URL}/pms`, {
      headers: savedToken ? { 'Authorization': `Bearer ${savedToken}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        setPms(data);
      })
      .catch(err => {
        console.error('Failed to fetch PMs. Ensure the backend is running.', err);
      });
  };

  // Verify JWT token on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('pm_token');
    if (savedToken) {
      fetch(`${import.meta.env.VITE_API_URL}/auth/verify`, {
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
    if (currentPm) fetchActiveUsers();
  }, [currentPm]);

  const login = async (correo, password) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ correo, password })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error de credenciales.');
    }
    
    localStorage.setItem('pm_token', data.token);
    localStorage.setItem('pm_user', JSON.stringify(data.user));
    setToken(data.token);
    setCurrentPm(data.user);
    return data;
  };

  const loginAzure = async (azureToken) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/login/azure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: azureToken })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error al iniciar sesión con Azure AD.');
    }
    
    localStorage.setItem('pm_token', data.token);
    localStorage.setItem('pm_user', JSON.stringify(data.user));
    setToken(data.token);
    setCurrentPm(data.user);
    return data;
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
      setCurrentPm(prev => prev ? { ...prev, idioma: newLang } : null);
      try {
        const savedToken = token || localStorage.getItem('pm_token');
        await fetch(`${import.meta.env.VITE_API_URL}/users/me/language`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': savedToken ? `Bearer ${savedToken}` : ''
          },
          body: JSON.stringify({ idioma: newLang })
        });
      } catch (err) {
        console.error('Error guardando preferencia de idioma:', err);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    setToken(null);
    setCurrentPm(null);
    setIsSessionExpired(false);
  };

  // Helper to fetch options with Authorization JWT header
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

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
      setIsSessionExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
