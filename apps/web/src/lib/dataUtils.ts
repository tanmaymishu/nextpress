// Utility functions for handling data consistency between client and server

/**
 * Safely parse a date string or return current date if invalid
 */
export function safeParseDateString(dateStr: unknown): string {
  if (typeof dateStr === 'string') {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  
  if (dateStr instanceof Date) {
    return dateStr.toISOString();
  }
  
  console.warn('Invalid date received, using current date:', dateStr);
  return new Date().toISOString();
}

/**
 * Safely convert ID to number, handling both string and number inputs
 */
export function safeParseId(id: unknown): number {
  if (typeof id === 'number') return id;
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    if (!isNaN(parsed)) return parsed;
  }
  
  console.warn('Invalid ID received:', id);
  return 0;
}

/**
 * Normalize user data from API response to ensure consistent types
 */
export function normalizeUser(user: any): any {
  if (!user) return user;
  
  return {
    ...user,
    id: safeParseId(user.id),
    createdAt: safeParseDateString(user.createdAt),
    updatedAt: safeParseDateString(user.updatedAt),
    roles: user.roles?.map((role: any) => ({
      ...role,
      id: safeParseId(role.id),
      createdAt: safeParseDateString(role.createdAt),
      updatedAt: safeParseDateString(role.updatedAt)
    })) || []
  };
}

/**
 * Normalize role data from API response to ensure consistent types
 */
export function normalizeRole(role: any): any {
  if (!role) return role;
  
  return {
    ...role,
    id: safeParseId(role.id),
    createdAt: safeParseDateString(role.createdAt),
    updatedAt: safeParseDateString(role.updatedAt),
    permissions: role.permissions?.map((perm: any) => ({
      ...perm,
      id: safeParseId(perm.id)
    })) || []
  };
}