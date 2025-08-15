import { NextRequest, NextResponse } from 'next/server';
import { PermissionType, UserRole } from '@prisma/client';
import { getCurrentUser, UserWithPermissions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

/**
 * Permission guard middleware for API routes
 */
export function withPermission(
  requiredPermissions: PermissionType[],
  options: {
    requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission.
    allowedRoles?: UserRole[]; // Additional role-based check
  } = {}
) {
  return function (handler: (req: NextRequest, user: UserWithPermissions) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      try {
        // Get current user
        const user = await getCurrentUser(req);
        
        if (!user) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        if (!user.isActive) {
          return NextResponse.json(
            { error: 'Account is inactive' },
            { status: 403 }
          );
        }

        // Check role-based access if specified
        if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
          return NextResponse.json(
            { error: 'Insufficient role permissions' },
            { status: 403 }
          );
        }

        // Check permissions
        const hasRequiredPermissions = options.requireAll
          ? requiredPermissions.every(permission => hasPermission(user, permission))
          : requiredPermissions.some(permission => hasPermission(user, permission));

        if (!hasRequiredPermissions) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        // Call the actual handler with the authenticated user
        return await handler(req, user);
      } catch (error) {
        console.error('Permission guard error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Super Admin only guard
 */
export function withSuperAdminOnly(handler: (req: NextRequest, user: UserWithPermissions) => Promise<NextResponse>) {
  return withPermission([], { allowedRoles: [UserRole.SUPER_ADMIN] })(handler);
}

/**
 * Admin or Super Admin guard
 */
export function withAdminAccess(handler: (req: NextRequest, user: UserWithPermissions) => Promise<NextResponse>) {
  return withPermission([], { allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })(handler);
}

/**
 * Read-only permission guard for report viewers
 */
export function withReadAccess(permissions: PermissionType[]) {
  const readPermissions = permissions.filter(p => p.toString().includes('READ'));
  return withPermission(readPermissions, { requireAll: false });
}

/**
 * Write permission guard (Create, Update, Delete)
 */
export function withWriteAccess(permissions: PermissionType[]) {
  const writePermissions = permissions.filter(p => 
    p.toString().includes('CREATE') || 
    p.toString().includes('UPDATE') || 
    p.toString().includes('DELETE')
  );
  return withPermission(writePermissions, { requireAll: false });
}

/**
 * Role-specific guards
 */
export function withCashbookManagerAccess(handler: (req: NextRequest, user: UserWithPermissions) => Promise<NextResponse>) {
  return withPermission([], { 
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] 
  })(handler);
}

export function withProductionManagerAccess(handler: (req: NextRequest, user: UserWithPermissions) => Promise<NextResponse>) {
  return withPermission([], { 
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] 
  })(handler);
}

export function withCuttingManagerAccess(handler: (req: NextRequest, user: UserWithPermissions) => Promise<NextResponse>) {
  return withPermission([], { 
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] 
  })(handler);
}

/**
 * Check if operation is allowed for user
 */
export function isOperationAllowed(user: UserWithPermissions, operation: 'create' | 'read' | 'update' | 'delete', resource: string): boolean {
  if (!user || !user.isActive) return false;

  // Super admin can do everything
  if (user.role === UserRole.SUPER_ADMIN) return true;

  // Users can only read (basic permission check)
  if (user.role === UserRole.USER && operation !== 'read') return false;

  // Map operation to permission type
  const permissionMap: Record<string, Record<string, PermissionType>> = {
    production: {
      create: PermissionType.CREATE_PRODUCTION,
      read: PermissionType.READ_PRODUCTION,
      update: PermissionType.UPDATE_PRODUCTION,
      delete: PermissionType.DELETE_PRODUCTION,
    },
    cashbook: {
      create: PermissionType.CREATE_CASHBOOK,
      read: PermissionType.READ_CASHBOOK,
      update: PermissionType.UPDATE_CASHBOOK,
      delete: PermissionType.DELETE_CASHBOOK,
    },
    cutting: {
      create: PermissionType.CREATE_CUTTING,
      read: PermissionType.READ_CUTTING,
      update: PermissionType.UPDATE_CUTTING,
      delete: PermissionType.DELETE_CUTTING,
    },
    expense: {
      create: PermissionType.CREATE_EXPENSE,
      read: PermissionType.READ_EXPENSE,
      update: PermissionType.UPDATE_EXPENSE,
      delete: PermissionType.DELETE_EXPENSE,
    },
    target: {
      create: PermissionType.CREATE_TARGET,
      read: PermissionType.READ_TARGET,
      update: PermissionType.UPDATE_TARGET,
      delete: PermissionType.DELETE_TARGET,
    },
    line: {
      create: PermissionType.CREATE_LINE,
      read: PermissionType.READ_LINE,
      update: PermissionType.UPDATE_LINE,
      delete: PermissionType.DELETE_LINE,
    },
    user: {
      create: PermissionType.CREATE_USER,
      read: PermissionType.READ_USER,
      update: PermissionType.UPDATE_USER,
      delete: PermissionType.DELETE_USER,
    },
    report: {
      create: PermissionType.CREATE_REPORT,
      read: PermissionType.READ_REPORT,
      update: PermissionType.UPDATE_REPORT,
      delete: PermissionType.DELETE_REPORT,
    },
    shipment: {
      create: PermissionType.CREATE_SHIPMENT,
      read: PermissionType.READ_SHIPMENT,
      update: PermissionType.UPDATE_SHIPMENT,
      delete: PermissionType.DELETE_SHIPMENT,
    },
  };

  const permission = permissionMap[resource]?.[operation];
  if (!permission) return false;

  return hasPermission(user, permission);
}
