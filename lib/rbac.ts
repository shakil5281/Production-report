import { UserRole, PermissionType } from '@prisma/client';
import { UserWithPermissions } from './auth';

// Permission mapping for different roles
export const ROLE_PERMISSIONS: Record<UserRole, PermissionType[]> = {
  [UserRole.USER]: [
    PermissionType.READ_PRODUCTION,
    PermissionType.READ_REPORT,
  ],
  [UserRole.CASHBOOK_MANAGER]: [
    PermissionType.CREATE_CASHBOOK,
    PermissionType.READ_CASHBOOK,
    PermissionType.UPDATE_CASHBOOK,
    PermissionType.DELETE_CASHBOOK,
    PermissionType.CREATE_EXPENSE,
    PermissionType.READ_EXPENSE,
    PermissionType.UPDATE_EXPENSE,
    PermissionType.DELETE_EXPENSE,
    PermissionType.READ_REPORT,
  ],
  [UserRole.PRODUCTION_MANAGER]: [
    PermissionType.CREATE_PRODUCTION,
    PermissionType.READ_PRODUCTION,
    PermissionType.UPDATE_PRODUCTION,
    PermissionType.DELETE_PRODUCTION,
    PermissionType.CREATE_TARGET,
    PermissionType.READ_TARGET,
    PermissionType.UPDATE_TARGET,
    PermissionType.DELETE_TARGET,
    PermissionType.CREATE_LINE,
    PermissionType.READ_LINE,
    PermissionType.UPDATE_LINE,
    PermissionType.DELETE_LINE,
    PermissionType.READ_REPORT,
  ],
  [UserRole.CUTTING_MANAGER]: [
    PermissionType.CREATE_CUTTING,
    PermissionType.READ_CUTTING,
    PermissionType.UPDATE_CUTTING,
    PermissionType.DELETE_CUTTING,
    PermissionType.READ_PRODUCTION,
    PermissionType.READ_REPORT,
  ],
  [UserRole.REPORT_VIEWER]: [
    PermissionType.READ_REPORT,
    PermissionType.READ_PRODUCTION,
    PermissionType.READ_CASHBOOK,
    PermissionType.READ_CUTTING,
    PermissionType.READ_TARGET,
    PermissionType.READ_EXPENSE,
    PermissionType.READ_SHIPMENT,
  ],
  [UserRole.MANAGER]: [
    PermissionType.READ_PRODUCTION,
    PermissionType.UPDATE_PRODUCTION,
    PermissionType.CREATE_REPORT,
    PermissionType.READ_REPORT,
    PermissionType.UPDATE_REPORT,
    PermissionType.READ_CASHBOOK,
    PermissionType.READ_CUTTING,
    PermissionType.READ_TARGET,
    PermissionType.READ_EXPENSE,
  ],
  [UserRole.ADMIN]: [
    PermissionType.CREATE_PRODUCTION,
    PermissionType.READ_PRODUCTION,
    PermissionType.UPDATE_PRODUCTION,
    PermissionType.DELETE_PRODUCTION,
    PermissionType.CREATE_CUTTING,
    PermissionType.READ_CUTTING,
    PermissionType.UPDATE_CUTTING,
    PermissionType.DELETE_CUTTING,
    PermissionType.CREATE_CASHBOOK,
    PermissionType.READ_CASHBOOK,
    PermissionType.UPDATE_CASHBOOK,
    PermissionType.DELETE_CASHBOOK,
    PermissionType.CREATE_REPORT,
    PermissionType.READ_REPORT,
    PermissionType.UPDATE_REPORT,
    PermissionType.DELETE_REPORT,
    PermissionType.CREATE_USER,
    PermissionType.READ_USER,
    PermissionType.UPDATE_USER,
    PermissionType.CREATE_EXPENSE,
    PermissionType.READ_EXPENSE,
    PermissionType.UPDATE_EXPENSE,
    PermissionType.DELETE_EXPENSE,
    PermissionType.CREATE_TARGET,
    PermissionType.READ_TARGET,
    PermissionType.UPDATE_TARGET,
    PermissionType.DELETE_TARGET,
    PermissionType.CREATE_LINE,
    PermissionType.READ_LINE,
    PermissionType.UPDATE_LINE,
    PermissionType.DELETE_LINE,
  ],
  [UserRole.SUPER_ADMIN]: [
    PermissionType.CREATE_PRODUCTION,
    PermissionType.READ_PRODUCTION,
    PermissionType.UPDATE_PRODUCTION,
    PermissionType.DELETE_PRODUCTION,
    PermissionType.CREATE_CUTTING,
    PermissionType.READ_CUTTING,
    PermissionType.UPDATE_CUTTING,
    PermissionType.DELETE_CUTTING,
    PermissionType.CREATE_CASHBOOK,
    PermissionType.READ_CASHBOOK,
    PermissionType.UPDATE_CASHBOOK,
    PermissionType.DELETE_CASHBOOK,
    PermissionType.CREATE_REPORT,
    PermissionType.READ_REPORT,
    PermissionType.UPDATE_REPORT,
    PermissionType.DELETE_REPORT,
    PermissionType.CREATE_USER,
    PermissionType.READ_USER,
    PermissionType.UPDATE_USER,
    PermissionType.DELETE_USER,
    PermissionType.CREATE_EXPENSE,
    PermissionType.READ_EXPENSE,
    PermissionType.UPDATE_EXPENSE,
    PermissionType.DELETE_EXPENSE,
    PermissionType.CREATE_TARGET,
    PermissionType.READ_TARGET,
    PermissionType.UPDATE_TARGET,
    PermissionType.DELETE_TARGET,
    PermissionType.CREATE_LINE,
    PermissionType.READ_LINE,
    PermissionType.UPDATE_LINE,
    PermissionType.DELETE_LINE,
    PermissionType.CREATE_SHIPMENT,
    PermissionType.READ_SHIPMENT,
    PermissionType.UPDATE_SHIPMENT,
    PermissionType.DELETE_SHIPMENT,
    PermissionType.MANAGE_SYSTEM,
    PermissionType.MANAGE_ROLES,
    PermissionType.MANAGE_PERMISSIONS,
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: UserWithPermissions, permission: PermissionType): boolean {
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.role === UserRole.SUPER_ADMIN) return true;
  
  // Check user's explicit permissions
  if (user.permissions.includes(permission)) return true;
  
  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user can access a specific page
 */
export function canAccessPage(user: UserWithPermissions, page: string): boolean {
  if (!user) return false;
  
  // Define page access rules
  const pageAccess: Record<string, UserRole[]> = {
    '/dashboard': [UserRole.USER, UserRole.CASHBOOK_MANAGER, UserRole.PRODUCTION_MANAGER, UserRole.CUTTING_MANAGER, UserRole.REPORT_VIEWER, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    '/production-list': [UserRole.PRODUCTION_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.REPORT_VIEWER],
    '/cashbook': [UserRole.CASHBOOK_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.REPORT_VIEWER],
    '/cutting': [UserRole.CUTTING_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.REPORT_VIEWER],
    '/admin/users': [UserRole.SUPER_ADMIN],
    '/admin/settings': [UserRole.SUPER_ADMIN],
  };
  
  const allowedRoles = pageAccess[page];
  if (!allowedRoles) return true; // No specific roles required
  
  return allowedRoles.includes(user.role);
}

/**
 * Get user-specific permissions for UI rendering
 */
export function getUserPermissions(user: UserWithPermissions) {
  if (!user) return {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canManageUsers: false,
    canManageSystem: false,
  };

  return {
    canCreateProduction: hasPermission(user, PermissionType.CREATE_PRODUCTION),
    canReadProduction: hasPermission(user, PermissionType.READ_PRODUCTION),
    canUpdateProduction: hasPermission(user, PermissionType.UPDATE_PRODUCTION),
    canDeleteProduction: hasPermission(user, PermissionType.DELETE_PRODUCTION),
    canCreateCashbook: hasPermission(user, PermissionType.CREATE_CASHBOOK),
    canReadCashbook: hasPermission(user, PermissionType.READ_CASHBOOK),
    canUpdateCashbook: hasPermission(user, PermissionType.UPDATE_CASHBOOK),
    canDeleteCashbook: hasPermission(user, PermissionType.DELETE_CASHBOOK),
    canCreateUser: hasPermission(user, PermissionType.CREATE_USER),
    canReadUser: hasPermission(user, PermissionType.READ_USER),
    canUpdateUser: hasPermission(user, PermissionType.UPDATE_USER),
    canDeleteUser: hasPermission(user, PermissionType.DELETE_USER),
    canManageSystem: hasPermission(user, PermissionType.MANAGE_SYSTEM),
  };
}

/**
 * Check if user role can edit/create (opposite of read-only)
 */
export function isReadOnlyRole(role: UserRole): boolean {
  return role === UserRole.REPORT_VIEWER;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.MANAGER]: 'Manager',
    [UserRole.USER]: 'User',
    [UserRole.CASHBOOK_MANAGER]: 'Cashbook Manager',
    [UserRole.PRODUCTION_MANAGER]: 'Production Manager',
    [UserRole.CUTTING_MANAGER]: 'Cutting Manager',
    [UserRole.REPORT_VIEWER]: 'Report Viewer',
  };
  
  return displayNames[role] || role;
}

// Export helper for route/permission validation
export const canExportReport = (role: UserRole): boolean => {
  const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN, UserRole.REPORT_VIEWER];
  return allowedRoles.includes(role);
};
