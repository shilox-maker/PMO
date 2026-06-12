import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [pms, setPms] = useState([]);
  const [currentPm, setCurrentPm] = useState(null);
  const [token, setToken] = useState(null);
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
    setTheme((prevTheme) => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'dacsa';
      return 'light';
    });
  };

  const fetchActiveUsers = () => {
    fetch(`${import.meta.env.VITE_API_URL}/pms`)
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

  const logout = () => {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    setToken(null);
    setCurrentPm(null);
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
      login,
      logout,
      refreshUsers: fetchActiveUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
