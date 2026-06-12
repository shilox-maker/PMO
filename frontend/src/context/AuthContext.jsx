import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [pms, setPms] = useState([]);
  const [currentPm, setCurrentPm] = useState(() => {
    const saved = localStorage.getItem('pm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Toggle Theme (Light / Dark)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const fetchActiveUsers = () => {
    fetch(\${import.meta.env.VITE_API_URL}\)
      .then(res => res.json())
      .then(data => {
        setPms(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch PMs. Ensure the backend is running.', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchActiveUsers();
  }, [currentPm]); // Re-fetch when user changes

  const login = async (correo, password) => {
    const res = await fetch(\${import.meta.env.VITE_API_URL}\, {
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
    
    localStorage.setItem('pm_user', JSON.stringify(data));
    setCurrentPm(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('pm_user');
    setCurrentPm(null);
  };

  // Helper to fetch options with x-pm-id auth header
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'x-pm-id': currentPm ? currentPm.id_usuario.toString() : ''
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
      login,
      logout,
      refreshUsers: fetchActiveUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
