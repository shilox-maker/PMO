import { PublicClientApplication } from '@azure/msal-browser';

const getRedirectUri = () => {
  if (import.meta.env.VITE_AZURE_REDIRECT_URI) {
    return import.meta.env.VITE_AZURE_REDIRECT_URI;
  }
  return `${window.location.origin}/auth-callback.html`;
};

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'dummy-client-id',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: getRedirectUri(),
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  }
};

let _msalPromise = null;

export function getMsalInstance() {
  if (_msalPromise) return _msalPromise;

  _msalPromise = (async () => {
    try {
      if (!(window.isSecureContext || (window.crypto && window.crypto.subtle))) {
        console.warn('Web Crypto API no disponible. Azure AD login deshabilitado.');
        return null;
      }
      const instance = new PublicClientApplication(msalConfig);
      await instance.initialize();
      return instance;
    } catch (error) {
      console.error('[MSAL] Initialization failed:', error);
      _msalPromise = null;
      return null;
    }
  })();

  return _msalPromise;
}
