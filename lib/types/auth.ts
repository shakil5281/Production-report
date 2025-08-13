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
