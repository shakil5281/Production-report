import { UserRole, PermissionType } from '@prisma/client';

export { UserRole, PermissionType };

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPermissions extends User {
  permissions: PermissionType[];
  password?: string; // Optional for when we need to handle password from database
}

export interface UserWithPassword extends UserWithPermissions {
  password: string; // Required when we have password from database
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: UserWithPermissions;
  token: string;
  expires: Date;
}

export interface SessionData {
  userId: string;
  user: UserWithPermissions;
  token: string;
  expires: Date;
}

export interface PermissionCheck {
  hasPermission: (permission: PermissionType) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
}

// Utility functions for role checking
export const hasAdminAccess = (user: UserWithPermissions): boolean => {
  return user.role === UserRole.SUPER_ADMIN;
};

export const hasSuperAdminAccess = (user: UserWithPermissions): boolean => {
  return user.role === UserRole.SUPER_ADMIN;
};

export const hasManagerAccess = (user: UserWithPermissions): boolean => {
  return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.USER;
};

export const hasCashbookAccess = (user: UserWithPermissions): boolean => {
  if (user.role === UserRole.SUPER_ADMIN) return true;
  return user.permissions?.some(p => 
    p.includes('CREATE_CASHBOOK') || p.includes('READ_CASHBOOK') || 
    p.includes('UPDATE_CASHBOOK') || p.includes('DELETE_CASHBOOK')
  ) || false;
};

export const hasProductionAccess = (user: UserWithPermissions): boolean => {
  if (user.role === UserRole.SUPER_ADMIN) return true;
  return user.permissions?.some(p => 
    p.includes('CREATE_PRODUCTION') || p.includes('READ_PRODUCTION') || 
    p.includes('UPDATE_PRODUCTION') || p.includes('DELETE_PRODUCTION')
  ) || false;
};

export const hasCuttingAccess = (user: UserWithPermissions): boolean => {
  if (user.role === UserRole.SUPER_ADMIN) return true;
  return user.permissions?.some(p => 
    p.includes('CREATE_CUTTING') || p.includes('READ_CUTTING') || 
    p.includes('UPDATE_CUTTING') || p.includes('DELETE_CUTTING')
  ) || false;
};

export const isReadOnlyUser = (user: UserWithPermissions): boolean => {
  if (user.role === UserRole.SUPER_ADMIN) return false;
  return user.permissions?.every(p => p.includes('READ')) || false;
};
