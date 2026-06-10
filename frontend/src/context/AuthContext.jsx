import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [pms, setPms] = useState([]);
  const [currentPm, setCurrentPm] = useState(null);
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

  useEffect(() => {
    // Fetch PMs from backend
    fetch('http://localhost:5000/api/pms')
      .then(res => res.json())
      .then(data => {
        setPms(data);
        if (data.length > 0) {
          // Set "Jaime" as default if found, otherwise the first PM
          const defaultPm = data.find(p => p.nombre.toLowerCase() === 'jaime') || data[0];
          setCurrentPm(defaultPm);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch PMs. Ensure the backend is running.', err);
        setLoading(false);
      });
  }, []);

  // Helper to fetch options with x-pm-id auth header
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'x-pm-id': currentPm ? currentPm.id_usuario.toString() : ''
    };
  };

  const handlePmChange = (pmId) => {
    const pm = pms.find(p => p.id_usuario === parseInt(pmId, 10));
    if (pm) {
      setCurrentPm(pm);
    }
  };

  return (
    <AuthContext.Provider value={{
      pms,
      currentPm,
      loading,
      getAuthHeaders,
      handlePmChange,
      theme,
      toggleTheme
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
