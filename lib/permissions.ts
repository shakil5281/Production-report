import { UserRole, PermissionType } from '@prisma/client';

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  'User Management': [
    PermissionType.CREATE_USER,
    PermissionType.READ_USER,
    PermissionType.UPDATE_USER,
    PermissionType.DELETE_USER,
  ],
  'Production': [
    PermissionType.CREATE_PRODUCTION,
    PermissionType.READ_PRODUCTION,
    PermissionType.UPDATE_PRODUCTION,
    PermissionType.DELETE_PRODUCTION,
  ],
  'Cutting': [
    PermissionType.CREATE_CUTTING,
    PermissionType.READ_CUTTING,
    PermissionType.UPDATE_CUTTING,
    PermissionType.DELETE_CUTTING,
  ],
  'Cashbook': [
    PermissionType.CREATE_CASHBOOK,
    PermissionType.READ_CASHBOOK,
    PermissionType.UPDATE_CASHBOOK,
    PermissionType.DELETE_CASHBOOK,
  ],
  'Expenses': [
    PermissionType.CREATE_EXPENSE,
    PermissionType.READ_EXPENSE,
    PermissionType.UPDATE_EXPENSE,
    PermissionType.DELETE_EXPENSE,
  ],
  'Targets': [
    PermissionType.CREATE_TARGET,
    PermissionType.READ_TARGET,
    PermissionType.UPDATE_TARGET,
    PermissionType.DELETE_TARGET,
  ],
  'Lines': [
    PermissionType.CREATE_LINE,
    PermissionType.READ_LINE,
    PermissionType.UPDATE_LINE,
    PermissionType.DELETE_LINE,
  ],
  'Reports': [
    PermissionType.CREATE_REPORT,
    PermissionType.READ_REPORT,
    PermissionType.UPDATE_REPORT,
    PermissionType.DELETE_REPORT,
  ],
  'Shipments': [
    PermissionType.CREATE_SHIPMENT,
    PermissionType.READ_SHIPMENT,
    PermissionType.UPDATE_SHIPMENT,
    PermissionType.DELETE_SHIPMENT,
  ],
  'System': [
    PermissionType.MANAGE_SYSTEM,
    PermissionType.MANAGE_ROLES,
    PermissionType.MANAGE_PERMISSIONS,
  ],
};

// Define permissions for each role
// SuperAdmin: Has access to all features including user management and system administration
// User: Has access to all business features except user management and system administration
export const ROLE_PERMISSIONS: Record<UserRole, PermissionType[]> = {
  SUPER_ADMIN: [
    // All permissions - SuperAdmin has access to everything including administration
    'READ_USER', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
    'READ_PRODUCTION', 'CREATE_PRODUCTION', 'UPDATE_PRODUCTION', 'DELETE_PRODUCTION',
    'READ_CUTTING', 'CREATE_CUTTING', 'UPDATE_CUTTING', 'DELETE_CUTTING',
    'READ_CASHBOOK', 'CREATE_CASHBOOK', 'UPDATE_CASHBOOK', 'DELETE_CASHBOOK',
    'READ_EXPENSE', 'CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE',
    'READ_TARGET', 'CREATE_TARGET', 'UPDATE_TARGET', 'DELETE_TARGET',
    'READ_LINE', 'CREATE_LINE', 'UPDATE_LINE', 'DELETE_LINE',
    'READ_SHIPMENT', 'CREATE_SHIPMENT', 'UPDATE_SHIPMENT', 'DELETE_SHIPMENT',
    'READ_REPORT', 'CREATE_REPORT', 'UPDATE_REPORT', 'DELETE_REPORT',
    'MANAGE_SYSTEM', 'MANAGE_ROLES', 'MANAGE_PERMISSIONS'
  ],
  USER: [
    // Users have access to all business operations except administration
    'READ_PRODUCTION', 'CREATE_PRODUCTION', 'UPDATE_PRODUCTION', 'DELETE_PRODUCTION',
    'READ_CUTTING', 'CREATE_CUTTING', 'UPDATE_CUTTING', 'DELETE_CUTTING',
    'READ_CASHBOOK', 'CREATE_CASHBOOK', 'UPDATE_CASHBOOK', 'DELETE_CASHBOOK',
    'READ_EXPENSE', 'CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE',
    'READ_TARGET', 'CREATE_TARGET', 'UPDATE_TARGET', 'DELETE_TARGET',
    'READ_LINE', 'CREATE_LINE', 'UPDATE_LINE', 'DELETE_LINE',
    'READ_SHIPMENT', 'CREATE_SHIPMENT', 'UPDATE_SHIPMENT', 'DELETE_SHIPMENT',
    'READ_REPORT', 'CREATE_REPORT', 'UPDATE_REPORT', 'DELETE_REPORT'
    // Note: USER role excludes user management and system administration permissions
  ]
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: { role: UserRole; permissions?: string[] }, permission: PermissionType): boolean {
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.role === UserRole.SUPER_ADMIN) return true;
  
  // Check user's explicit permissions (if any)
  if (user.permissions && user.permissions.includes(permission)) return true;
  
  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user can access administration features
 */
export function canAccessAdministration(user: { role: UserRole }): boolean {
  return user.role === UserRole.SUPER_ADMIN;
}

/**
 * Check if user can access a specific page
 */
export function canAccessPage(user: { role: UserRole }, page: string): boolean {
  if (!user) return false;
  
  // Define page access rules
  const adminPages = [
    '/admin/users',
    '/admin/permissions', 
    '/admin/roles',
    '/admin/settings',
    '/admin/database',
    '/admin/backup',
    '/admin/logs',
    '/admin/api-routes'
  ];
  
  // Only SuperAdmin can access admin pages
  if (adminPages.some(adminPage => page.startsWith(adminPage))) {
    return user.role === UserRole.SUPER_ADMIN;
  }
  
  // All other pages are accessible to both roles
  return true;
}

/**
 * Get user-specific permissions for UI rendering
 */
export function getUserPermissions(user: { role: UserRole; permissions?: string[] }) {
  if (!user) return {
    canCreateProduction: false,
    canReadProduction: false,
    canUpdateProduction: false,
    canDeleteProduction: false,
    canCreateCashbook: false,
    canReadCashbook: false,
    canUpdateCashbook: false,
    canDeleteCashbook: false,
    canCreateUser: false,
    canReadUser: false,
    canUpdateUser: false,
    canDeleteUser: false,
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
    canManageRoles: hasPermission(user, PermissionType.MANAGE_ROLES),
    canManagePermissions: hasPermission(user, PermissionType.MANAGE_PERMISSIONS),
  };
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

/**
 * Check if user role is admin (for backwards compatibility)
 */
export function isAdminRole(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

/**
 * Check if user can export reports
 */
export const canExportReport = (role: UserRole): boolean => {
  // Both roles can export reports
  return role === UserRole.SUPER_ADMIN || role === UserRole.USER;
};

/**
 * Get available roles for user creation (only SuperAdmin can create users)
 */
export function getAvailableRoles(currentUserRole: UserRole): UserRole[] {
  if (currentUserRole === UserRole.SUPER_ADMIN) {
    return [UserRole.SUPER_ADMIN, UserRole.USER];
  }
  return []; // Regular users cannot create other users
}

/**
 * Get human-readable label for permission type
 */
export function getPermissionLabel(permission: PermissionType): string {
  const labels: Record<PermissionType, string> = {
    // User Management
    CREATE_USER: 'Create User',
    READ_USER: 'Read User',
    UPDATE_USER: 'Update User',
    DELETE_USER: 'Delete User',
    
    // Production
    CREATE_PRODUCTION: 'Create Production',
    READ_PRODUCTION: 'Read Production',
    UPDATE_PRODUCTION: 'Update Production',
    DELETE_PRODUCTION: 'Delete Production',
    
    // Cutting
    CREATE_CUTTING: 'Create Cutting',
    READ_CUTTING: 'Read Cutting',
    UPDATE_CUTTING: 'Update Cutting',
    DELETE_CUTTING: 'Delete Cutting',
    
    // Cashbook
    CREATE_CASHBOOK: 'Create Cashbook',
    READ_CASHBOOK: 'Read Cashbook',
    UPDATE_CASHBOOK: 'Update Cashbook',
    DELETE_CASHBOOK: 'Delete Cashbook',
    
    // Expenses
    CREATE_EXPENSE: 'Create Expense',
    READ_EXPENSE: 'Read Expense',
    UPDATE_EXPENSE: 'Update Expense',
    DELETE_EXPENSE: 'Delete Expense',
    
    // Targets
    CREATE_TARGET: 'Create Target',
    READ_TARGET: 'Read Target',
    UPDATE_TARGET: 'Update Target',
    DELETE_TARGET: 'Delete Target',
    
    // Lines
    CREATE_LINE: 'Create Line',
    READ_LINE: 'Read Line',
    UPDATE_LINE: 'Update Line',
    DELETE_LINE: 'Delete Line',
    
    // Reports
    CREATE_REPORT: 'Create Report',
    READ_REPORT: 'Read Report',
    UPDATE_REPORT: 'Update Report',
    DELETE_REPORT: 'Delete Report',
    
    // Shipments
    CREATE_SHIPMENT: 'Create Shipment',
    READ_SHIPMENT: 'Read Shipment',
    UPDATE_SHIPMENT: 'Update Shipment',
    DELETE_SHIPMENT: 'Delete Shipment',
    
    // System
    MANAGE_SYSTEM: 'Manage System',
    MANAGE_ROLES: 'Manage Roles',
    MANAGE_PERMISSIONS: 'Manage Permissions',
  };
  
  return labels[permission] || permission;
}