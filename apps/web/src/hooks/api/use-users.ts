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
import { apiRequest } from '@/lib/api-request';

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

  return apiRequest<ACLPaginatedResponse<User>>(`/api/v1/users?${params}`);
}

async function fetchUser(id: number): Promise<ACLApiResponse<User>> {
  return apiRequest<ACLApiResponse<User>>(`/api/v1/users/${id}`);
}

async function createUser(data: CreateUserRequest): Promise<ACLApiResponse<User>> {
  return apiRequest<ACLApiResponse<User>>(`/api/v1/users`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function updateUser(id: number, data: UpdateUserRequest): Promise<ACLApiResponse<User>> {
  return apiRequest<ACLApiResponse<User>>(`/api/v1/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function deleteUser(id: number): Promise<ACLApiResponse<null>> {
  return apiRequest<ACLApiResponse<null>>(`/api/v1/users/${id}`, {
    method: 'DELETE'
  });
}

async function assignRoles(userId: number, data: AssignRolesRequest): Promise<ACLApiResponse<null>> {
  return apiRequest<ACLApiResponse<null>>(`/api/v1/users/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function fetchUserPermissions(userId: number): Promise<ACLApiResponse<{ userId: number; roles: string[]; permissions: string[] }>> {
  return apiRequest<ACLApiResponse<{ userId: number; roles: string[]; permissions: string[] }>>(`/api/v1/users/${userId}/permissions`);
}

async function fetchAvailableRoles(): Promise<ACLApiResponse<Role[]>> {
  return apiRequest<ACLApiResponse<Role[]>>(`/api/v1/users/roles/available`);
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