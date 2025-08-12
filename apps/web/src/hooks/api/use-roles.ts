import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Role, 
  Permission,
  ACLPaginatedResponse,
  ACLApiResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignPermissionsRequest 
} from '@repo/shared';
import { apiRequest } from '@/lib/api-request';

// API functions
async function fetchRoles(page: number = 1, limit: number = 10, search?: string): Promise<ACLPaginatedResponse<Role>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search })
  });

  return apiRequest<ACLPaginatedResponse<Role>>(`/api/v1/roles?${params}`);
}

async function fetchRole(id: number): Promise<ACLApiResponse<Role>> {
  return apiRequest<ACLApiResponse<Role>>(`/api/v1/roles/${id}`);
}

async function createRole(data: CreateRoleRequest): Promise<ACLApiResponse<Role>> {
  return apiRequest<ACLApiResponse<Role>>(`/api/v1/roles`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function updateRole(id: number, data: UpdateRoleRequest): Promise<ACLApiResponse<Role>> {
  return apiRequest<ACLApiResponse<Role>>(`/api/v1/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function deleteRole(id: number): Promise<ACLApiResponse<null>> {
  return apiRequest<ACLApiResponse<null>>(`/api/v1/roles/${id}`, {
    method: 'DELETE'
  });
}

async function assignPermissions(roleId: number, data: AssignPermissionsRequest): Promise<ACLApiResponse<null>> {
  return apiRequest<ACLApiResponse<null>>(`/api/v1/roles/${roleId}/permissions`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function fetchAvailablePermissions(): Promise<ACLApiResponse<Permission[]>> {
  return apiRequest<ACLApiResponse<Permission[]>>(`/api/v1/roles/permissions/available`);
}

// Hooks
export function useRoles(options: { page?: number; limit?: number; search?: string } = {}) {
  const { page = 1, limit = 10, search } = options;
  return useQuery({
    queryKey: ['roles', page, limit, search],
    queryFn: () => fetchRoles(page, limit, search)
  });
}

export function useRole(id: number) {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => fetchRole(id),
    enabled: !!id
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    }
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & UpdateRoleRequest) => 
      updateRole(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', id] });
    }
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    }
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, ...data }: { roleId: number } & AssignPermissionsRequest) =>
      assignPermissions(roleId, data),
    onSuccess: (data, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', roleId] });
    }
  });
}

export function useAvailablePermissions() {
  return useQuery({
    queryKey: ['permissions', 'available'],
    queryFn: fetchAvailablePermissions
  });
}