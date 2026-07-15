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

let msalInstance = null;

try {
  // MSAL requires window.crypto.subtle which is only available in secure contexts (HTTPS or localhost)
  if (window.isSecureContext || (window.crypto && window.crypto.subtle)) {
    msalInstance = new PublicClientApplication(msalConfig);
  } else {
    console.warn("Web Crypto API (window.crypto.subtle) is not available in this insecure context. Azure AD login will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize MSAL:", error);
}

export { msalInstance };
