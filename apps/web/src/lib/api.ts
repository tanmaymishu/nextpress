import type { ApiUser, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, MeResponse } from '@repo/shared';
import { getAuthToken, isCrossDomain } from './authStrategy';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add Authorization header for cross-domain requests
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
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
    return this.get<MeResponse>('/api/v1/me');
  }

  async logout(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/api/v1/logout');
  }
}