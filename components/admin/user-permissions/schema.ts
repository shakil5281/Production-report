import { UserRole, PermissionType } from '@prisma/client';

export interface UserPermissionData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: PermissionType[];
}

export interface UserPermissionFormData {
  permissions: PermissionType[];
}

export function formatLastLogin(lastLogin?: string | null): string {
  if (!lastLogin) return 'Never';
  
  const now = new Date();
  const loginDate = new Date(lastLogin);
  const diffMs = now.getTime() - loginDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'Super Admin';
    case UserRole.ADMIN:
      return 'Admin';
    case UserRole.MANAGER:
      return 'Manager';
    case UserRole.PRODUCTION_MANAGER:
      return 'Production Manager';
    case UserRole.CASHBOOK_MANAGER:
      return 'Cashbook Manager';
    case UserRole.CUTTING_MANAGER:
      return 'Cutting Manager';
    case UserRole.REPORT_VIEWER:
      return 'Report Viewer';
    case UserRole.USER:
      return 'User';
    default:
      return role;
  }
}

export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400';
    case UserRole.ADMIN:
      return 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400';
    case UserRole.MANAGER:
      return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400';
    case UserRole.CASHBOOK_MANAGER:
      return 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400';
    case UserRole.PRODUCTION_MANAGER:
      return 'bg-orange-500/10 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400';
    case UserRole.CUTTING_MANAGER:
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400';
    case UserRole.REPORT_VIEWER:
      return 'bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400';
    case UserRole.USER:
      return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400';
  }
}

export function getPermissionColor(permission: PermissionType): string {
  if (permission.toString().includes('CREATE')) return 'text-green-600 dark:text-green-400';
  if (permission.toString().includes('READ')) return 'text-blue-600 dark:text-blue-400';
  if (permission.toString().includes('UPDATE')) return 'text-yellow-600 dark:text-yellow-400';
  if (permission.toString().includes('DELETE')) return 'text-red-600 dark:text-red-400';
  if (permission.toString().includes('MANAGE')) return 'text-purple-600 dark:text-purple-400';
  return 'text-gray-600 dark:text-gray-400';
}
