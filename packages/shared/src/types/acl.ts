// ACL Types
export interface Permission {
  id: number;
  name: string;
  label?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: number;
  name: string;
  label?: string;
  description?: string;
  permissions?: Permission[];
  users?: User[];
  permissionsCount?: number;
  usersCount?: number;
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response types
export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleIds?: number[];
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  roleIds?: number[];
}

export interface AssignRolesRequest {
  roles: string[];
}

export interface AssignPermissionsRequest {
  permissions: string[];
}

// API Response types specific to ACL (extending common types)
export interface ACLPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ACLApiResponse<T> {
  data: T;
  message?: string;
}

export interface ACLApiError {
  error: string;
  code: string;
  required?: string | string[];
}