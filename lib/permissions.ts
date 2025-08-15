import { UserRole, PermissionType } from '@prisma/client';

// Define permissions for each role - simplified 3-role system
export const ROLE_PERMISSIONS: Record<UserRole, PermissionType[]> = {
  SUPER_ADMIN: [
    // All permissions - SuperAdmin has access to everything
    PermissionType.READ_USER,
    PermissionType.CREATE_USER,
    PermissionType.UPDATE_USER,
    PermissionType.DELETE_USER,
    PermissionType.READ_PRODUCTION,
    PermissionType.CREATE_PRODUCTION,
    PermissionType.UPDATE_PRODUCTION,
    PermissionType.DELETE_PRODUCTION,
    PermissionType.READ_CUTTING,
    PermissionType.CREATE_CUTTING,
    PermissionType.UPDATE_CUTTING,
    PermissionType.DELETE_CUTTING,
    PermissionType.READ_CASHBOOK,
    PermissionType.CREATE_CASHBOOK,
    PermissionType.UPDATE_CASHBOOK,
    PermissionType.DELETE_CASHBOOK,
    PermissionType.READ_EXPENSE,
    PermissionType.CREATE_EXPENSE,
    PermissionType.UPDATE_EXPENSE,
    PermissionType.DELETE_EXPENSE,
    PermissionType.READ_TARGET,
    PermissionType.CREATE_TARGET,
    PermissionType.UPDATE_TARGET,
    PermissionType.DELETE_TARGET,
    PermissionType.READ_LINE,
    PermissionType.CREATE_LINE,
    PermissionType.UPDATE_LINE,
    PermissionType.DELETE_LINE,
    PermissionType.READ_SHIPMENT,
    PermissionType.CREATE_SHIPMENT,
    PermissionType.UPDATE_SHIPMENT,
    PermissionType.DELETE_SHIPMENT,
    PermissionType.READ_REPORT,
    PermissionType.CREATE_REPORT,
    PermissionType.UPDATE_REPORT,
    PermissionType.DELETE_REPORT,
    PermissionType.MANAGE_SYSTEM,
    PermissionType.MANAGE_ROLES,
    PermissionType.MANAGE_PERMISSIONS,
  ],
  
  ADMIN: [
    // Admin has access to all functional areas but not user/system management
    PermissionType.READ_PRODUCTION,
    PermissionType.CREATE_PRODUCTION,
    PermissionType.UPDATE_PRODUCTION,
    PermissionType.DELETE_PRODUCTION,
    PermissionType.READ_CUTTING,
    PermissionType.CREATE_CUTTING,
    PermissionType.UPDATE_CUTTING,
    PermissionType.DELETE_CUTTING,
    PermissionType.READ_CASHBOOK,
    PermissionType.CREATE_CASHBOOK,
    PermissionType.UPDATE_CASHBOOK,
    PermissionType.DELETE_CASHBOOK,
    PermissionType.READ_EXPENSE,
    PermissionType.CREATE_EXPENSE,
    PermissionType.UPDATE_EXPENSE,
    PermissionType.DELETE_EXPENSE,
    PermissionType.READ_TARGET,
    PermissionType.CREATE_TARGET,
    PermissionType.UPDATE_TARGET,
    PermissionType.DELETE_TARGET,
    PermissionType.READ_LINE,
    PermissionType.CREATE_LINE,
    PermissionType.UPDATE_LINE,
    PermissionType.DELETE_LINE,
    PermissionType.READ_SHIPMENT,
    PermissionType.CREATE_SHIPMENT,
    PermissionType.UPDATE_SHIPMENT,
    PermissionType.DELETE_SHIPMENT,
    PermissionType.READ_REPORT,
    PermissionType.CREATE_REPORT,
    PermissionType.UPDATE_REPORT,
    PermissionType.DELETE_REPORT,
  ],
  
  USER: [
    // User has limited read-only access
    PermissionType.READ_PRODUCTION,
    PermissionType.READ_REPORT,
  ],
};

// Helper function to check if user has permission
export function hasPermission(userRole: UserRole, permission: PermissionType): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

// Helper function to check if user has any of the specified permissions
export function hasAnyPermission(userRole: UserRole, permissions: PermissionType[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Helper function to check if user has all of the specified permissions
export function hasAllPermissions(userRole: UserRole, permissions: PermissionType[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Helper function to get all permissions for a role
export function getRolePermissions(userRole: UserRole): PermissionType[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

// Helper function to check if user can perform CRUD operations on a resource
export function canPerformOperation(
  userRole: UserRole, 
  operation: 'create' | 'read' | 'update' | 'delete',
  resource: 'USER' | 'PRODUCTION' | 'CUTTING' | 'CASHBOOK' | 'EXPENSE' | 'TARGET' | 'LINE' | 'SHIPMENT' | 'REPORT'
): boolean {
  const permissionName = `${operation.toUpperCase()}_${resource}` as PermissionType;
  return hasPermission(userRole, permissionName);
}

// Helper function to get user role display name
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.USER]: 'User',
  };
  
  return displayNames[role] || role;
}

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    PermissionType.CREATE_USER,
    PermissionType.READ_USER,
    PermissionType.UPDATE_USER,
    PermissionType.DELETE_USER,
  ],
  PRODUCTION: [
    PermissionType.CREATE_PRODUCTION,
    PermissionType.READ_PRODUCTION,
    PermissionType.UPDATE_PRODUCTION,
    PermissionType.DELETE_PRODUCTION,
  ],
  CUTTING: [
    PermissionType.CREATE_CUTTING,
    PermissionType.READ_CUTTING,
    PermissionType.UPDATE_CUTTING,
    PermissionType.DELETE_CUTTING,
  ],
  CASHBOOK: [
    PermissionType.CREATE_CASHBOOK,
    PermissionType.READ_CASHBOOK,
    PermissionType.UPDATE_CASHBOOK,
    PermissionType.DELETE_CASHBOOK,
  ],
  EXPENSES: [
    PermissionType.CREATE_EXPENSE,
    PermissionType.READ_EXPENSE,
    PermissionType.UPDATE_EXPENSE,
    PermissionType.DELETE_EXPENSE,
  ],
  TARGETS: [
    PermissionType.CREATE_TARGET,
    PermissionType.READ_TARGET,
    PermissionType.UPDATE_TARGET,
    PermissionType.DELETE_TARGET,
  ],
  LINES: [
    PermissionType.CREATE_LINE,
    PermissionType.READ_LINE,
    PermissionType.UPDATE_LINE,
    PermissionType.DELETE_LINE,
  ],
  SHIPMENTS: [
    PermissionType.CREATE_SHIPMENT,
    PermissionType.READ_SHIPMENT,
    PermissionType.UPDATE_SHIPMENT,
    PermissionType.DELETE_SHIPMENT,
  ],
  REPORTS: [
    PermissionType.CREATE_REPORT,
    PermissionType.READ_REPORT,
    PermissionType.UPDATE_REPORT,
    PermissionType.DELETE_REPORT,
  ],
  SYSTEM: [
    PermissionType.MANAGE_SYSTEM,
    PermissionType.MANAGE_ROLES,
    PermissionType.MANAGE_PERMISSIONS,
  ],
};

// Backward compatibility - alias for PERMISSION_GROUPS
export const PERMISSION_CATEGORIES = PERMISSION_GROUPS;

// Helper function to get permission label
export function getPermissionLabel(permission: PermissionType): string {
  return permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

export default {
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canPerformOperation,
  getRoleDisplayName,
  PERMISSION_GROUPS,
  PERMISSION_CATEGORIES,
  getPermissionLabel,
};