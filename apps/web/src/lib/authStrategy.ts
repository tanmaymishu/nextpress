// Authentication strategy detection based on domain configuration

/**
 * Determines if we're in cross-domain mode based on API and frontend URLs
 * Returns true if different domains, false if same domain/localhost
 */
export function isCrossDomain(): boolean {
  return false;
  // const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  //
  // if (!apiUrl) {
  //   // No API URL configured, assume localhost same-domain
  //   return false;
  // }
  //
  // try {
  //   const apiDomain = new URL(apiUrl).hostname;
  //   const frontendDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  //   // If domains are different, we're cross-domain
  //   return apiDomain !== frontendDomain;
  // } catch (error) {
  //   console.error('Error parsing domain URLs:', error);
  //   // Default to cross-domain for safety
  //   return true;
  // }
}

/**
 * Gets the auth token based on the current strategy
 * Cross-domain: localStorage, Same-domain: not needed (uses cookies)
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  if (isCrossDomain()) {
    return localStorage.getItem('auth_token');
  }

  // Same-domain uses cookies, no token needed
  return null;
}

/**
 * Stores the auth token based on the current strategy
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;

  if (isCrossDomain()) {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Removes the auth token
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;

  if (isCrossDomain()) {
    localStorage.removeItem('auth_token');
  }
}
