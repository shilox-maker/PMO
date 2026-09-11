import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { API_URL } from '../config/api';
import { useAuth } from './AuthContext';

const defaultMetadataValue = {
  pms: [],
  vendors: [],
  sedes: [],
  contactos: [],
  states: [],
  workflows: [],
  portfolios: [],
  tags: [],
  capexTypes: [],
  invoiceTypes: [],
  loadingMetadata: false,
  error: null,
  refreshMetadata: async () => {}
};

const MetadataContext = createContext(defaultMetadataValue);

export const MetadataProvider = ({ children }) => {
  const { token, selectedAmbito } = useAuth();

  const [pms, setPms] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [states, setStates] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [tags, setTags] = useState([]);
  const [capexTypes, setCapexTypes] = useState([]);
  const [invoiceTypes, setInvoiceTypes] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [error, setError] = useState(null);

  const lastFetchedKeyRef = useRef('');
  const isFetchingRef = useRef(false);

  // Fallback function: fetches individual endpoints if /meta/bootstrap is unavailable or fails
  const fetchFallbackIndividualEndpoints = async (savedToken, targetAmbito) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${savedToken}`,
      'X-Ambito-Id': targetAmbito
    };

    console.warn('[MetadataProvider] Falling back to individual endpoints...');
    const results = await Promise.allSettled([
      fetch(`${API_URL}/pms`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/vendors`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/sedes`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/contactos`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/portfolio/states`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/portfolio/workflows`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/portfolios`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/tags`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/capex-types`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/invoice-types`, { headers }).then(r => r.ok ? r.json() : [])
    ]);

    const getValue = (index) => (results[index].status === 'fulfilled' && Array.isArray(results[index].value) ? results[index].value : []);

    setPms(getValue(0));
    setVendors(getValue(1));
    setSedes(getValue(2));
    setContactos(getValue(3));
    setStates(getValue(4));
    setWorkflows(getValue(5));
    setPortfolios(getValue(6));
    setTags(getValue(7));
    setCapexTypes(getValue(8));
    setInvoiceTypes(getValue(9));
  };

  const fetchBootstrapData = useCallback(async (force = false) => {
    const savedToken = token || localStorage.getItem('pm_token');
    if (!savedToken) {
      setPms([]);
      setVendors([]);
      setSedes([]);
      setContactos([]);
      setStates([]);
      setWorkflows([]);
      setPortfolios([]);
      setTags([]);
      setCapexTypes([]);
      setInvoiceTypes([]);
      lastFetchedKeyRef.current = '';
      return;
    }

    const targetAmbito = localStorage.getItem('pmo_selected_ambito_id') || selectedAmbito || '1';
    const currentKey = `${savedToken}_${targetAmbito}`;
    
    // Only skip if not forced AND already fetched this key AND metadata is already populated
    if (!force && lastFetchedKeyRef.current === currentKey && pms.length > 0 && sedes.length > 0) {
      return;
    }

    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoadingMetadata(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/meta/bootstrap`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`,
          'X-Ambito-Id': targetAmbito
        }
      });

      if (!res.ok) {
        throw new Error(`Bootstrap endpoint returned status ${res.status}`);
      }

      const data = await res.json();
      
      const newPms = Array.isArray(data.pms) ? data.pms : [];
      const newVendors = Array.isArray(data.vendors) ? data.vendors : [];
      const newSedes = Array.isArray(data.sedes) ? data.sedes : [];
      const newContactos = Array.isArray(data.contactos) ? data.contactos : [];
      const newStates = Array.isArray(data.states) ? data.states : [];
      const newWorkflows = Array.isArray(data.workflows) ? data.workflows : [];
      const newPortfolios = Array.isArray(data.portfolios) ? data.portfolios : [];
      const newTags = Array.isArray(data.tags) ? data.tags : [];
      const newCapexTypes = Array.isArray(data.capexTypes) ? data.capexTypes : [];
      const newInvoiceTypes = Array.isArray(data.invoiceTypes) ? data.invoiceTypes : [];

      // If bootstrap returned empty data due to partial backend issue, run individual fallback
      if (newPms.length === 0 && newSedes.length === 0 && newVendors.length === 0) {
        console.warn('[MetadataProvider] Bootstrap returned empty payload, falling back...');
        await fetchFallbackIndividualEndpoints(savedToken, targetAmbito);
      } else {
        setPms(newPms);
        setVendors(newVendors);
        setSedes(newSedes);
        setContactos(newContactos);
        setStates(newStates);
        setWorkflows(newWorkflows);
        setPortfolios(newPortfolios);
        setTags(newTags);
        setCapexTypes(newCapexTypes);
        setInvoiceTypes(newInvoiceTypes);
      }
      lastFetchedKeyRef.current = currentKey;
    } catch (err) {
      console.error('[MetadataProvider] Error fetching bootstrap master data:', err);
      setError(err.message);
      // Resilient fallback: fetch individually
      try {
        await fetchFallbackIndividualEndpoints(savedToken, targetAmbito);
        lastFetchedKeyRef.current = currentKey;
      } catch (fallbackErr) {
        console.error('[MetadataProvider] Fallback fetching failed:', fallbackErr);
      }
    } finally {
      setLoadingMetadata(false);
      isFetchingRef.current = false;
    }
  }, [token, selectedAmbito, pms.length, sedes.length]);

  useEffect(() => {
    const activeToken = token || localStorage.getItem('pm_token');
    if (activeToken) {
      fetchBootstrapData(false);
    }
  }, [token, selectedAmbito, fetchBootstrapData]);

  const handleRefresh = useCallback(() => {
    return fetchBootstrapData(true);
  }, [fetchBootstrapData]);

  const value = {
    pms,
    vendors,
    sedes,
    contactos,
    states,
    workflows,
    portfolios,
    tags,
    capexTypes,
    invoiceTypes,
    loadingMetadata,
    error,
    refreshMetadata: handleRefresh
  };

  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
};

export const useMetadata = () => useContext(MetadataContext);

export default MetadataContext;
