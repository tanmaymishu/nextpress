// Shared API request utility with flexible authentication
import { getAuthToken } from './authStrategy';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Add Authorization header if we have a token (cross-domain mode)
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    headers,
    credentials: 'include', // Always include cookies as fallback
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    // Try to parse error message
    try {
      const error = await response.json();
      throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
    } catch (jsonError) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  return response.json();
}