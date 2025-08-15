import { UserRole, PermissionType } from '@prisma/client';

export class PermissionService {
  // Check if user has a specific permission
  static hasPermission(userPermissions: PermissionType[], requiredPermission: PermissionType): boolean {
    return userPermissions.includes(requiredPermission);
  }

  // Check if user has any of the required permissions
  static hasAnyPermission(userPermissions: PermissionType[], requiredPermissions: PermissionType[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  // Check if user has all required permissions
  static hasAllPermissions(userPermissions: PermissionType[], requiredPermissions: PermissionType[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  // Check if user role is sufficient
  static hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.USER]: 1,
      [UserRole.CASHBOOK_MANAGER]: 2,
      [UserRole.PRODUCTION_MANAGER]: 2,
      [UserRole.CUTTING_MANAGER]: 2,
      [UserRole.REPORT_VIEWER]: 2,
      [UserRole.MANAGER]: 3,
      [UserRole.ADMIN]: 4,
      [UserRole.SUPER_ADMIN]: 5,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  // Check if user role is higher than or equal to required role
  static isRoleOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
    return this.hasRole(userRole, requiredRole);
  }

  // Get role hierarchy level
  static getRoleLevel(role: UserRole): number {
    const roleHierarchy = {
      [UserRole.USER]: 1,
      [UserRole.CASHBOOK_MANAGER]: 2,
      [UserRole.PRODUCTION_MANAGER]: 2,
      [UserRole.CUTTING_MANAGER]: 2,
      [UserRole.REPORT_VIEWER]: 2,
      [UserRole.MANAGER]: 3,
      [UserRole.ADMIN]: 4,
      [UserRole.SUPER_ADMIN]: 5,
    };

    return roleHierarchy[role] || 0;
  }
}
