import { UserRole, PermissionType } from '@prisma/client';
import { UserWithPermissions } from './auth';

// Permission mapping for different roles
// SuperAdmin: Full system access including user management
// User: Business operations access only (no user management or system administration)
export const ROLE_PERMISSIONS: Record<UserRole, PermissionType[]> = {
  [UserRole.USER]: [
    // Business operations - all CRUD operations except user management
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
  [UserRole.SUPER_ADMIN]: [
    // All permissions including system administration
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
  
  // Define admin-only page patterns
  const adminOnlyPages = [
    '/admin/users',
    '/admin/permissions',
    '/admin/roles',
    '/admin/settings',
    '/admin/database',
    '/admin/backup',
    '/admin/logs',
    '/admin/api-routes'
  ];
  
  // Check if page requires admin access
  const isAdminPage = adminOnlyPages.some(adminPage => page.startsWith(adminPage));
  
  if (isAdminPage) {
    return user.role === UserRole.SUPER_ADMIN;
  }
  
  // All other pages are accessible to both roles
  const allowedRoles = [UserRole.USER, UserRole.SUPER_ADMIN];
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
    canCreateCutting: hasPermission(user, PermissionType.CREATE_CUTTING),
    canReadCutting: hasPermission(user, PermissionType.READ_CUTTING),
    canUpdateCutting: hasPermission(user, PermissionType.UPDATE_CUTTING),
    canDeleteCutting: hasPermission(user, PermissionType.DELETE_CUTTING),
    canCreateExpense: hasPermission(user, PermissionType.CREATE_EXPENSE),
    canReadExpense: hasPermission(user, PermissionType.READ_EXPENSE),
    canUpdateExpense: hasPermission(user, PermissionType.UPDATE_EXPENSE),
    canDeleteExpense: hasPermission(user, PermissionType.DELETE_EXPENSE),
    canCreateTarget: hasPermission(user, PermissionType.CREATE_TARGET),
    canReadTarget: hasPermission(user, PermissionType.READ_TARGET),
    canUpdateTarget: hasPermission(user, PermissionType.UPDATE_TARGET),
    canDeleteTarget: hasPermission(user, PermissionType.DELETE_TARGET),
    canCreateLine: hasPermission(user, PermissionType.CREATE_LINE),
    canReadLine: hasPermission(user, PermissionType.READ_LINE),
    canUpdateLine: hasPermission(user, PermissionType.UPDATE_LINE),
    canDeleteLine: hasPermission(user, PermissionType.DELETE_LINE),
    canCreateShipment: hasPermission(user, PermissionType.CREATE_SHIPMENT),
    canReadShipment: hasPermission(user, PermissionType.READ_SHIPMENT),
    canUpdateShipment: hasPermission(user, PermissionType.UPDATE_SHIPMENT),
    canDeleteShipment: hasPermission(user, PermissionType.DELETE_SHIPMENT),
    canCreateReport: hasPermission(user, PermissionType.CREATE_REPORT),
    canReadReport: hasPermission(user, PermissionType.READ_REPORT),
    canUpdateReport: hasPermission(user, PermissionType.UPDATE_REPORT),
    canDeleteReport: hasPermission(user, PermissionType.DELETE_REPORT),
    canCreateUser: hasPermission(user, PermissionType.CREATE_USER),
    canReadUser: hasPermission(user, PermissionType.READ_USER),
    canUpdateUser: hasPermission(user, PermissionType.UPDATE_USER),
    canDeleteUser: hasPermission(user, PermissionType.DELETE_USER),
    canManageSystem: hasPermission(user, PermissionType.MANAGE_SYSTEM),
    canManageUsers: hasPermission(user, PermissionType.CREATE_USER) || hasPermission(user, PermissionType.UPDATE_USER) || hasPermission(user, PermissionType.DELETE_USER),
  };
}

/**
 * Check if user role can edit/create (opposite of read-only)
 */
export function isReadOnlyRole(role: UserRole): boolean {
  // Both roles can create/edit, SuperAdmin has additional admin privileges
  return false;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.USER]: 'User',
  };
  
  return displayNames[role] || role;
}

// Export helper for route/permission validation
export const canExportReport = (role: UserRole): boolean => {
  // Both roles can export reports
  const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.USER];
  return allowedRoles.includes(role);
};

/**
 * Check if user is admin (SuperAdmin)
 */
export function isAdmin(user: UserWithPermissions): boolean {
  return user.role === UserRole.SUPER_ADMIN;
}

/**
 * Get available roles for user creation
 */
export function getAvailableRoles(currentUserRole: UserRole): UserRole[] {
  if (currentUserRole === UserRole.SUPER_ADMIN) {
    return [UserRole.SUPER_ADMIN, UserRole.USER];
  }
  return []; // Regular users cannot create other users
}