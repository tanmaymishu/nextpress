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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// API functions
async function fetchRoles(page: number = 1, limit: number = 10, search?: string): Promise<ACLPaginatedResponse<Role>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search })
  });

  const response = await fetch(`${API_BASE}/api/v1/roles?${params}`, {
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

async function fetchRole(id: number): Promise<ACLApiResponse<Role>> {
  const response = await fetch(`${API_BASE}/api/v1/roles/${id}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch role');
  }

  return response.json();
}

async function createRole(data: CreateRoleRequest): Promise<ACLApiResponse<Role>> {
  const response = await fetch(`${API_BASE}/api/v1/roles`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create role');
  }

  return response.json();
}

async function updateRole(id: number, data: UpdateRoleRequest): Promise<ACLApiResponse<Role>> {
  const response = await fetch(`${API_BASE}/api/v1/roles/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update role');
  }

  return response.json();
}

async function deleteRole(id: number): Promise<ACLApiResponse<null>> {
  const response = await fetch(`${API_BASE}/api/v1/roles/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete role');
  }

  return response.json();
}

async function assignPermissions(roleId: number, data: AssignPermissionsRequest): Promise<ACLApiResponse<null>> {
  const response = await fetch(`${API_BASE}/api/v1/roles/${roleId}/permissions`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to assign permissions');
  }

  return response.json();
}

async function fetchAvailablePermissions(): Promise<ACLApiResponse<Permission[]>> {
  const response = await fetch(`${API_BASE}/api/v1/roles/permissions/available`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch permissions');
  }

  return response.json();
}

// Hooks
export function useRoles(page: number = 1, limit: number = 10, search?: string) {
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