import { KeycloakOptions } from 'keycloak-angular';

export const keycloakConfig: KeycloakOptions = {
  config: {
    url: 'http://localhost:8080',
    realm: 'kidneyCare-realm',
    clientId: 'kidneycare-app'
    // No secret needed for public clients
  },
  initOptions: {
    onLoad: 'login-required',
    checkLoginIframe: false,
    pkceMethod: 'S256',   // ← add this, more secure for public clients
  }
};