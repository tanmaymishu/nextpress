import type { ApiUser, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, MeResponse } from '@repo/shared';
import { normalizeUser } from './dataUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('Making API request to:', url);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    };

    try {
      const response = await fetch(url, config);
      console.log('API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use generic error message
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      // Check if it's a network error (fetch failed)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Load failed - Cannot connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Typed API methods
  async getUsers(): Promise<ApiUser[]> {
    return this.get<ApiUser[]>('/api/v1/users');
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.post<LoginResponse>('/api/v1/login', credentials);
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.post<RegisterResponse>('/api/v1/register', userData);
  }

  async me(): Promise<MeResponse> {
    const response = await this.get<MeResponse>('/api/v1/me');
    return normalizeUser(response);
  }

  async logout(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/api/v1/logout');
  }
}