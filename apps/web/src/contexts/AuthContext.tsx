'use client';

import { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMe } from '@/hooks/api/useAuth';
import { MeResponse } from '@repo/shared';

interface AuthContextType {
  user: MeResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, error } = useMe();

  const isAuthenticated = !!user && !error;

  // Guest routes that should redirect if authenticated
  const guestRoutes = ['/login', '/register'];
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard'];

  useEffect(() => {
    if (isLoading) return;

    const isGuestRoute = guestRoutes.includes(pathname);
    const isProtectedRoute = protectedRoutes.includes(pathname);

    if (isAuthenticated && isGuestRoute) {
      // User is authenticated but on a guest route, redirect to dashboard
      router.push('/dashboard');
    } else if (!isAuthenticated && isProtectedRoute) {
      // User is not authenticated but on a protected route, redirect to login
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const contextValue: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}