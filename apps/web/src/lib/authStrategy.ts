// Authentication strategy detection based on domain configuration

/**
 * Determines if we're in cross-domain mode based on API and frontend URLs
 * Returns true if different domains, false if same domain/localhost
 */
export function isCrossDomain(): boolean {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  console.log('🔍 Domain Detection Debug:');
  console.log('  API_URL:', apiUrl);

  if (!apiUrl) {
    console.log('  Result: Same-domain (no API URL configured)');
    return false;
  }

  try {
    const apiDomain = new URL(apiUrl).hostname;
    const frontendDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    console.log('  API Domain:', apiDomain);
    console.log('  Frontend Domain:', frontendDomain);
    
    const isCross = apiDomain !== frontendDomain;
    console.log('  Result:', isCross ? 'Cross-domain' : 'Same-domain');
    
    return isCross;
  } catch (error) {
    console.error('  Error parsing domain URLs:', error);
    console.log('  Result: Cross-domain (fallback due to error)');
    return true;
  }
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
