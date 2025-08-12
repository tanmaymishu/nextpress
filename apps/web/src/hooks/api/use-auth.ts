import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';
import { LoginRequest, RegisterRequest, MeResponse } from '@repo/shared';
import { setAuthToken, removeAuthToken } from '@/lib/auth-strategy';

const api = new ApiClient();

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

// Get current user
export const useMe = () => {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => api.me(),
    retry: false, // Don't retry auth failures
  });
};

// Login mutation
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => api.login(credentials),
    onSuccess: (data) => {
      // Store token if we received one (for cross-domain auth)
      if (data.token) {
        setAuthToken(data.token);
      }

      // Cache the user data
      queryClient.setQueryData(authKeys.me(), data.user);
      // Redirect to dashboard
      router.push('/dashboard');
    },
  });
};

// Register mutation
export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => api.register(userData),
    onSuccess: () => {
      // Redirect to login after successful registration
      router.push('/login');
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // Remove stored token
      removeAuthToken();
      // Clear all auth-related cache
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      queryClient.removeQueries({ queryKey: authKeys.all });
      // Redirect to login
      router.push('/login');
    },
    onError: () => {
      // Even if logout fails on server, clear client state and redirect
      removeAuthToken();
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      queryClient.removeQueries({ queryKey: authKeys.all });
      router.push('/login');
    },
  });
};
