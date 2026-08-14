import { PublicClientApplication } from '@azure/msal-browser';

const apiUrl = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
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
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  }
};

(async () => {
  const clearMsalLocks = () => {
    try {
      localStorage.removeItem('msal.interaction.status');
      sessionStorage.removeItem('msal.interaction.status');
      localStorage.removeItem('pmo_debug_login_log');
    } catch (_) {}
  };

  try {
    const instance = new PublicClientApplication(msalConfig);
    await instance.initialize();
    const response = await instance.handleRedirectPromise();
    
    if (response && response.idToken) {
      const res = await fetch(`${apiUrl}/login/azure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.idToken })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('pm_token', data.token);
        localStorage.setItem('pm_user', JSON.stringify(data.user));
        clearMsalLocks();
        window.location.href = '/';
        return;
      } else {
        clearMsalLocks();
        alert(data.error || 'Error al autenticar con el servidor de PMO Control Tower.');
        window.location.href = '/';
        return;
      }
    }
  } catch (e) {
    console.error('[Auth Callback Error]', e);
    clearMsalLocks();
    alert(e?.message || 'Error al procesar la respuesta de autenticación con Microsoft.');
    window.location.href = '/';
    return;
  } finally {
    clearMsalLocks();
  }
  window.location.href = '/';
})();
