'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, PermissionType } from '@prisma/client';
import { UserWithPermissions } from '@/lib/auth';
import { hasPermission, canAccessPage, isReadOnlyRole } from '@/lib/rbac';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react';

interface PermissionGuardProps {
  user: UserWithPermissions | null;
  children: React.ReactNode;
  
  // Permission-based access
  requiredPermissions?: PermissionType[];
  requireAllPermissions?: boolean; // Default: false (requires ANY permission)
  
  // Role-based access
  allowedRoles?: UserRole[];
  
  // Page-based access
  page?: string;
  
  // Behavior options
  fallback?: React.ReactNode;
  redirectTo?: string;
  showError?: boolean; // Default: true
  
  // UI customization
  errorTitle?: string;
  errorMessage?: string;
}

export function PermissionGuard({
  user,
  children,
  requiredPermissions = [],
  requireAllPermissions = false,
  allowedRoles = [],
  page,
  fallback,
  redirectTo,
  showError = true,
  errorTitle = "Access Denied",
  errorMessage = "You don't have permission to access this resource."
}: PermissionGuardProps) {
  const router = useRouter();

  // Check if user is authenticated
  if (!user) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    
    if (fallback) return <>{fallback}</>;
    
    if (showError) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Authentication required. Please sign in to access this page.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => router.push('/login')} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </div>
      );
    }
    
    return null;
  }

  // Check if user account is active
  if (!user.isActive) {
    if (showError) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your account is inactive. Please contact an administrator.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return fallback || null;
  }

  // Check page-based access
  if (page && !canAccessPage(user, page)) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    
    if (fallback) return <>{fallback}</>;
    
    if (showError) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">{errorTitle}</p>
                <p>{errorMessage}</p>
                <p className="text-sm text-muted-foreground">
                  Your role: <span className="font-medium">{getRoleDisplayName(user.role)}</span>
                </p>
              </div>
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => router.back()} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      );
    }
    
    return null;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    
    if (fallback) return <>{fallback}</>;
    
    if (showError) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">{errorTitle}</p>
                <p>This feature requires one of the following roles:</p>
                <ul className="list-disc list-inside ml-4">
                  {allowedRoles.map(role => (
                    <li key={role} className="text-sm">{getRoleDisplayName(role)}</li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">
                  Your role: <span className="font-medium">{getRoleDisplayName(user.role)}</span>
                </p>
              </div>
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => router.back()} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      );
    }
    
    return null;
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? requiredPermissions.every(permission => hasPermission(user, permission))
      : requiredPermissions.some(permission => hasPermission(user, permission));

    if (!hasRequiredPermissions) {
      if (redirectTo) {
        router.push(redirectTo);
        return null;
      }
      
      if (fallback) return <>{fallback}</>;
      
      if (showError) {
        return (
          <div className="container mx-auto px-4 py-8">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">{errorTitle}</p>
                  <p>{errorMessage}</p>
                  <p className="text-sm text-muted-foreground">
                    Required permissions: {requiredPermissions.join(', ')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your role: <span className="font-medium">{getRoleDisplayName(user.role)}</span>
                  </p>
                </div>
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.back()} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        );
      }
      
      return null;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Helper component for read-only mode
interface ReadOnlyWrapperProps {
  user: UserWithPermissions | null;
  children: React.ReactNode;
  showNotice?: boolean;
}

export function ReadOnlyWrapper({ user, children, showNotice = true }: ReadOnlyWrapperProps) {
  const isReadOnly = user && isReadOnlyRole(user.role);

  return (
    <div className={isReadOnly ? 'pointer-events-none opacity-75' : ''}>
      {showNotice && isReadOnly && (
        <Alert className="mb-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You are in read-only mode. You can view data but cannot make changes.
          </AlertDescription>
        </Alert>
      )}
      {children}
    </div>
  );
}

// Helper component for conditional rendering based on permissions
interface ConditionalRenderProps {
  user: UserWithPermissions | null;
  permission?: PermissionType;
  permissions?: PermissionType[];
  requireAllPermissions?: boolean;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ConditionalRender({
  user,
  permission,
  permissions = [],
  requireAllPermissions = false,
  allowedRoles = [],
  fallback = null,
  children
}: ConditionalRenderProps) {
  if (!user) return <>{fallback}</>;

  // Single permission check
  if (permission && !hasPermission(user, permission)) {
    return <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? permissions.every(p => hasPermission(user, p))
      : permissions.some(p => hasPermission(user, p));

    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  // Role check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Utility function for role display names
function getRoleDisplayName(role: UserRole): string {
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