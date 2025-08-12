import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Role,
  ACLPaginatedResponse,
  ACLApiResponse,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRolesRequest 
} from '@repo/shared';
import { normalizeUser } from '@/lib/dataUtils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// API functions
async function fetchUsers(
  page: number = 1, 
  limit: number = 10, 
  search?: string, 
  role?: string
): Promise<ACLPaginatedResponse<User>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(role && { role })
  });

  const response = await fetch(`${API_BASE}/api/v1/users?${params}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || error.message || `Failed to fetch users (${response.status})`);
    } catch (jsonError) {
      throw new Error(`Failed to fetch users: ${response.statusText} (${response.status})`);
    }
  }

  const data = await response.json();
  // Normalize user data for consistent types
  return {
    ...data,
    data: data.data?.map(normalizeUser) || []
  };
}

async function fetchUser(id: number): Promise<ACLApiResponse<User>> {
  const response = await fetch(`${API_BASE}/api/v1/users/${id}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user');
  }

  return response.json();
}

async function createUser(data: CreateUserRequest): Promise<ACLApiResponse<User>> {
  const response = await fetch(`${API_BASE}/api/v1/users`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create user');
  }

  return response.json();
}

async function updateUser(id: number, data: UpdateUserRequest): Promise<ACLApiResponse<User>> {
  const response = await fetch(`${API_BASE}/api/v1/users/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user');
  }

  return response.json();
}

async function deleteUser(id: number): Promise<ACLApiResponse<null>> {
  const response = await fetch(`${API_BASE}/api/v1/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete user');
  }

  return response.json();
}

async function assignRoles(userId: number, data: AssignRolesRequest): Promise<ACLApiResponse<null>> {
  const response = await fetch(`${API_BASE}/api/v1/users/${userId}/roles`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to assign roles');
  }

  return response.json();
}

async function fetchUserPermissions(userId: number): Promise<ACLApiResponse<{ userId: number; roles: string[]; permissions: string[] }>> {
  const response = await fetch(`${API_BASE}/api/v1/users/${userId}/permissions`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user permissions');
  }

  return response.json();
}

async function fetchAvailableRoles(): Promise<ACLApiResponse<Role[]>> {
  const response = await fetch(`${API_BASE}/api/v1/users/roles/available`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch roles');
  }

  return response.json();
}

// Hooks
export function useUsers(options: { 
  page?: number; 
  limit?: number; 
  search?: string; 
  role?: string 
} = {}) {
  const { page = 1, limit = 10, search, role } = options;
  return useQuery({
    queryKey: ['users', page, limit, search, role],
    queryFn: () => fetchUsers(page, limit, search, role)
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
    enabled: !!id
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & UpdateUserRequest) => 
      updateUser(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useAssignRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, ...data }: { userId: number } & AssignRolesRequest) =>
      assignRoles(userId, data),
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    }
  });
}

export function useUserPermissions(userId: number) {
  return useQuery({
    queryKey: ['user', userId, 'permissions'],
    queryFn: () => fetchUserPermissions(userId),
    enabled: !!userId
  });
}

export function useAvailableRoles() {
  return useQuery({
    queryKey: ['roles', 'available'],
    queryFn: fetchAvailableRoles
  });
}