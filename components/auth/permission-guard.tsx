'use client';

import { ReactNode } from 'react';
import { UserRole, PermissionType, UserWithPermissions } from '@/lib/types/auth';
import { PermissionService } from '@/lib/auth';

interface PermissionGuardProps {
  children: ReactNode;
  user: UserWithPermissions;
  requiredPermission?: PermissionType;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
  mode?: 'all' | 'any'; // 'all' means user must have ALL required roles, 'any' means user must have ANY of the required roles
}

export function PermissionGuard({
  children,
  user,
  requiredPermission,
  requiredRole,
  requiredRoles,
  fallback = null,
  mode = 'any',
}: PermissionGuardProps) {
  if (!user) {
    return fallback;
  }

  const permissionService = new PermissionService(user);

  // Check permission if specified
  if (requiredPermission && !permissionService.hasPermission(requiredPermission)) {
    return fallback;
  }

  // Check single role if specified
  if (requiredRole && !permissionService.hasRole(requiredRole)) {
    return fallback;
  }

  // Check multiple roles if specified
  if (requiredRoles && requiredRoles.length > 0) {
    if (mode === 'all') {
      if (!permissionService.hasAllRoles(requiredRoles)) {
        return fallback;
      }
    } else {
      if (!permissionService.hasAnyRole(requiredRoles)) {
        return fallback;
      }
    }
  }

  return <>{children}</>;
}

// Convenience components for common role checks
export function SuperAdminOnly({ children, user, fallback }: Omit<PermissionGuardProps, 'requiredRole'>) {
  return (
    <PermissionGuard user={user} requiredRole={UserRole.SUPER_ADMIN} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function AdminOrHigher({ children, user, fallback }: Omit<PermissionGuardProps, 'requiredRoles'>) {
  return (
    <PermissionGuard 
      user={user} 
      requiredRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

export function ManagerOrHigher({ children, user, fallback }: Omit<PermissionGuardProps, 'requiredRoles'>) {
  return (
    <PermissionGuard 
      user={user} 
      requiredRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

export function HasPermission({ 
  children, 
  user, 
  permission, 
  fallback 
}: Omit<PermissionGuardProps, 'requiredPermission'> & { permission: PermissionType }) {
  return (
    <PermissionGuard user={user} requiredPermission={permission} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
