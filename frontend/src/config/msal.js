import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'dummy-client-id',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  }
};

// Instancia lazy: solo se crea cuando se llama por primera vez (al hacer click en "Login Azure")
let _msalInstance = null;

export function getMsalInstance() {
  if (_msalInstance) return _msalInstance;

  try {
    if (window.isSecureContext || (window.crypto && window.crypto.subtle)) {
      _msalInstance = new PublicClientApplication(msalConfig);
    } else {
      console.warn('Web Crypto API no disponible. Azure AD login deshabilitado.');
    }
  } catch (error) {
    console.error('Failed to initialize MSAL:', error);
  }

  return _msalInstance;
}

// Mantener compatibilidad con código existente que usa msalInstance directamente
export { _msalInstance as msalInstance };
