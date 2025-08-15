import { UserRole, PermissionType } from '@prisma/client';

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, PermissionType[]> = {
  SUPER_ADMIN: [
    // All permissions - SuperAdmin has access to everything
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
  ADMIN: [
    'READ_USER', 'CREATE_USER', 'UPDATE_USER',
    'READ_PRODUCTION', 'CREATE_PRODUCTION', 'UPDATE_PRODUCTION', 'DELETE_PRODUCTION',
    'READ_CUTTING', 'CREATE_CUTTING', 'UPDATE_CUTTING', 'DELETE_CUTTING',
    'READ_CASHBOOK', 'CREATE_CASHBOOK', 'UPDATE_CASHBOOK', 'DELETE_CASHBOOK',
    'READ_EXPENSE', 'CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE',
    'READ_TARGET', 'CREATE_TARGET', 'UPDATE_TARGET', 'DELETE_TARGET',
    'READ_LINE', 'CREATE_LINE', 'UPDATE_LINE', 'DELETE_LINE',
    'READ_SHIPMENT', 'CREATE_SHIPMENT', 'UPDATE_SHIPMENT', 'DELETE_SHIPMENT',
    'READ_REPORT', 'CREATE_REPORT', 'UPDATE_REPORT'
  ],
  MANAGER: [
    'READ_PRODUCTION', 'CREATE_PRODUCTION', 'UPDATE_PRODUCTION',
    'READ_CUTTING', 'CREATE_CUTTING', 'UPDATE_CUTTING',
    'READ_CASHBOOK', 'CREATE_CASHBOOK', 'UPDATE_CASHBOOK',
    'READ_EXPENSE', 'CREATE_EXPENSE', 'UPDATE_EXPENSE',
    'READ_TARGET', 'CREATE_TARGET', 'UPDATE_TARGET',
    'READ_LINE', 'CREATE_LINE', 'UPDATE_LINE',
    'READ_SHIPMENT', 'CREATE_SHIPMENT', 'UPDATE_SHIPMENT',
    'READ_REPORT', 'CREATE_REPORT'
  ],
  PRODUCTION_MANAGER: [
    'READ_PRODUCTION', 'CREATE_PRODUCTION', 'UPDATE_PRODUCTION',
    'READ_TARGET', 'CREATE_TARGET', 'UPDATE_TARGET',
    'READ_LINE', 'CREATE_LINE', 'UPDATE_LINE',
    'READ_REPORT'
  ],
  CASHBOOK_MANAGER: [
    'READ_CASHBOOK', 'CREATE_CASHBOOK', 'UPDATE_CASHBOOK',
    'READ_EXPENSE', 'CREATE_EXPENSE', 'UPDATE_EXPENSE',
    'READ_REPORT'
  ],
  CUTTING_MANAGER: [
    'READ_PRODUCTION', 'CREATE_PRODUCTION', 'UPDATE_PRODUCTION',
    'READ_CUTTING', 'CREATE_CUTTING', 'UPDATE_CUTTING',
    'READ_REPORT'
  ],
  REPORT_VIEWER: [
    'READ_PRODUCTION',
    'READ_CUTTING',
    'READ_CASHBOOK',
    'READ_EXPENSE',
    'READ_TARGET',
    'READ_LINE',
    'READ_SHIPMENT',
    'READ_REPORT'
  ],
  USER: [
    'READ_PRODUCTION',
    'READ_REPORT'
  ]
};

// Navigation permission mapping
export const NAV_PERMISSIONS: Record<string, string[]> = {
  // Main navigation
  '/dashboard': ['READ_PRODUCTION', 'READ_REPORT'],
  '/platform': ['READ_PRODUCTION', 'READ_REPORT'],
  '/production-reports': ['READ_REPORT'],
  '/profit-loss': ['READ_REPORT'],
  
  // Production group
  '/production-list': ['READ_PRODUCTION'],
  '/target': ['READ_TARGET'],
  '/target/daily-report': ['READ_TARGET', 'READ_REPORT'],
  '/target/comprehensive-report': ['READ_TARGET', 'READ_REPORT'],
  '/lines': ['READ_LINE'],
  '/daily-production': ['READ_PRODUCTION'],
  
  // Expense group
  '/expenses/manpower': ['READ_EXPENSE'],
  '/expenses/daily-salary': ['READ_EXPENSE'],
  '/expenses/daily-expense': ['READ_EXPENSE'],
  
  // Cashbook group
  '/cashbook': ['READ_CASHBOOK'],
  '/cashbook/cash-received': ['READ_CASHBOOK'],
  '/cashbook/daily-expense': ['READ_CASHBOOK'],
  '/cashbook/monthly-express-report': ['READ_CASHBOOK', 'READ_REPORT'],
  
  // Cutting group
  '/cutting': ['READ_CUTTING'],
  '/cutting/daily-input': ['CREATE_CUTTING'],
  '/cutting/daily-output': ['CREATE_CUTTING'],
  '/cutting/monthly-report': ['READ_REPORT'],
  
  // Shipments
  '/shipments': ['READ_SHIPMENT'],
  '/shipments/create': ['CREATE_SHIPMENT'],
  '/shipments/reports': ['READ_SHIPMENT', 'READ_REPORT'],
  
  // Administration (SuperAdmin only)
  '/admin/dashboard': ['MANAGE_SYSTEM'],
  '/admin/users': ['READ_USER', 'CREATE_USER', 'UPDATE_USER'],
  '/admin/permissions': ['MANAGE_PERMISSIONS'],
  '/admin/roles': ['MANAGE_ROLES'],
  '/admin/settings': ['MANAGE_SYSTEM'],
  '/admin/api-routes': ['MANAGE_SYSTEM'],
  '/admin/logs': ['MANAGE_SYSTEM'],
  '/admin/database': ['MANAGE_SYSTEM'],
  '/admin/backup': ['MANAGE_SYSTEM'],
  
  // Profile (all users)
  '/profile': [],
};

// Check if user has permission
export function hasPermission(
  userRole: UserRole,
  userPermissions: PermissionType[],
  requiredPermission: PermissionType
): boolean {
  // SuperAdmin has all permissions
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }
  
  // Check if user has explicit permission
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }
  
  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(requiredPermission);
}

// Check if user can access a route
export function canAccessRoute(
  userRole: UserRole,
  userPermissions: PermissionType[],
  route: string
): boolean {
  // SuperAdmin can access everything
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }
  
  const requiredPermissions = NAV_PERMISSIONS[route];
  
  // If no specific permissions required, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  
  // Check if user has any of the required permissions
  return requiredPermissions.some(permission => 
    hasPermission(userRole, userPermissions, permission as PermissionType)
  );
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): PermissionType[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Check if user has any admin permissions
export function isAdmin(userRole: UserRole): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(userRole);
}

// Check if user is SuperAdmin
export function isSuperAdmin(userRole: UserRole): boolean {
  return userRole === 'SUPER_ADMIN';
}

// Filter navigation items based on permissions
export function filterNavItemsByPermissions(
  items: any[],
  userRole: UserRole,
  userPermissions: PermissionType[]
): any[] {
  return items.filter(item => {
    // Check main item access
    if (item.url && !canAccessRoute(userRole, userPermissions, item.url)) {
      return false;
    }
    
    // Check role-based access
    if (item.roles && !item.roles.includes(userRole)) {
      return false;
    }
    
    // Filter sub-items if they exist
    if (item.items) {
      item.items = item.items.filter((subItem: any) => {
        if (subItem.url && !canAccessRoute(userRole, userPermissions, subItem.url)) {
          return false;
        }
        
        if (subItem.roles && !subItem.roles.includes(userRole)) {
          return false;
        }
        
        return true;
      });
      
      // If no sub-items remain and main item has no direct URL, hide the group
      if (item.items.length === 0 && !item.url) {
        return false;
      }
    }
    
    return true;
  });
}

// Permission categories for UI
export const PERMISSION_CATEGORIES = {
  'User Management': ['READ_USER', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER'],
  'Production Management': ['READ_PRODUCTION', 'CREATE_PRODUCTION', 'UPDATE_PRODUCTION', 'DELETE_PRODUCTION'],
  'Cutting Management': ['READ_CUTTING', 'CREATE_CUTTING', 'UPDATE_CUTTING', 'DELETE_CUTTING'],
  'Cashbook Management': ['READ_CASHBOOK', 'CREATE_CASHBOOK', 'UPDATE_CASHBOOK', 'DELETE_CASHBOOK'],
  'Expense Management': ['READ_EXPENSE', 'CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE'],
  'Target Management': ['READ_TARGET', 'CREATE_TARGET', 'UPDATE_TARGET', 'DELETE_TARGET'],
  'Line Management': ['READ_LINE', 'CREATE_LINE', 'UPDATE_LINE', 'DELETE_LINE'],
  'Shipment Management': ['READ_SHIPMENT', 'CREATE_SHIPMENT', 'UPDATE_SHIPMENT', 'DELETE_SHIPMENT'],
  'Report Management': ['READ_REPORT', 'CREATE_REPORT', 'UPDATE_REPORT', 'DELETE_REPORT'],
  'System Administration': ['MANAGE_SYSTEM', 'MANAGE_ROLES', 'MANAGE_PERMISSIONS'],
};

// Get permission label
export function getPermissionLabel(permission: PermissionType): string {
  const labels: Record<PermissionType, string> = {
    READ_USER: 'View Users',
    CREATE_USER: 'Create Users',
    UPDATE_USER: 'Edit Users',
    DELETE_USER: 'Delete Users',
    READ_PRODUCTION: 'View Production',
    CREATE_PRODUCTION: 'Create Production',
    UPDATE_PRODUCTION: 'Edit Production',
    DELETE_PRODUCTION: 'Delete Production',
    READ_CUTTING: 'View Cutting',
    CREATE_CUTTING: 'Create Cutting',
    UPDATE_CUTTING: 'Edit Cutting',
    DELETE_CUTTING: 'Delete Cutting',
    READ_CASHBOOK: 'View Cashbook',
    CREATE_CASHBOOK: 'Create Cashbook Entries',
    UPDATE_CASHBOOK: 'Edit Cashbook',
    DELETE_CASHBOOK: 'Delete Cashbook Entries',
    READ_EXPENSE: 'View Expenses',
    CREATE_EXPENSE: 'Create Expenses',
    UPDATE_EXPENSE: 'Edit Expenses',
    DELETE_EXPENSE: 'Delete Expenses',
    READ_TARGET: 'View Targets',
    CREATE_TARGET: 'Create Targets',
    UPDATE_TARGET: 'Edit Targets',
    DELETE_TARGET: 'Delete Targets',
    READ_LINE: 'View Lines',
    CREATE_LINE: 'Create Lines',
    UPDATE_LINE: 'Edit Lines',
    DELETE_LINE: 'Delete Lines',
    READ_SHIPMENT: 'View Shipments',
    CREATE_SHIPMENT: 'Create Shipments',
    UPDATE_SHIPMENT: 'Edit Shipments',
    DELETE_SHIPMENT: 'Delete Shipments',
    READ_REPORT: 'View Reports',
    CREATE_REPORT: 'Create Reports',
    UPDATE_REPORT: 'Edit Reports',
    DELETE_REPORT: 'Delete Reports',
    MANAGE_SYSTEM: 'System Management',
    MANAGE_ROLES: 'Role Management',
    MANAGE_PERMISSIONS: 'Permission Management',
  };
  
  return labels[permission] || permission;
}