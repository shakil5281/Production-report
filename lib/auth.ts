import { PrismaClient, UserRole, PermissionType } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserWithPermissions, PermissionCheck } from './types/auth';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  // Password hashing
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // JWT token management
  static generateToken(userId: string, role: UserRole): string {
    return jwt.sign(
      { userId, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  static verifyToken(token: string): { userId: string; role: UserRole } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: UserRole };
      return decoded;
    } catch {
      return null;
    }
  }

  // User authentication
  static async authenticateUser(email: string, password: string): Promise<UserWithPermissions | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email, isActive: true },
        include: {
          userPermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      if (!user) {
        return null;
      }

      const isPasswordValid = await this.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // Get user permissions
      const permissions = user.userPermissions
        .filter(up => up.granted)
        .map(up => up.permission.name);

      // Add role-based permissions
      const rolePermissions = await this.getRolePermissions(user.role);
      const allPermissions = [...new Set([...permissions, ...rolePermissions])];

      const userWithPermissions: UserWithPermissions = {
        ...user,
        permissions: allPermissions
      };

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      return userWithPermissions;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  // Get role-based permissions
  static async getRolePermissions(role: UserRole): Promise<PermissionType[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: { name: role }
      },
      include: {
        permission: true
      }
    });

    return rolePermissions.map(rp => rp.permission.name);
  }

  // Create user session
  static async createSession(userId: string, token: string): Promise<void> {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 days

    await prisma.session.create({
      data: {
        userId,
        token,
        expires
      }
    });
  }

  // Validate session
  static async validateSession(token: string): Promise<UserWithPermissions | null> {
    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              userPermissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      if (!session || session.expires < new Date()) {
        return null;
      }

      // Get user permissions
      const permissions = session.user.userPermissions
        .filter(up => up.granted)
        .map(up => up.permission.name);

      // Add role-based permissions
      const rolePermissions = await this.getRolePermissions(session.user.role);
      const allPermissions = [...new Set([...permissions, ...rolePermissions])];

      return {
        ...session.user,
        permissions: allPermissions
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  // Delete session
  static async deleteSession(token: string): Promise<void> {
    await prisma.session.delete({
      where: { token }
    });
  }

  // Clean expired sessions
  static async cleanExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });
  }
}

export class PermissionService implements PermissionCheck {
  constructor(private user: UserWithPermissions) {}

  hasPermission(permission: PermissionType): boolean {
    return this.user.permissions.includes(permission);
  }

  hasRole(role: UserRole): boolean {
    return this.user.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.user.role);
  }

  hasAllRoles(roles: UserRole[]): boolean {
    return roles.every(role => this.user.role === role);
  }

  // Check if user can access a specific resource
  canAccessResource(resource: string, action: string): boolean {
    const permission = `${action.toUpperCase()}_${resource.toUpperCase()}` as PermissionType;
    return this.hasPermission(permission);
  }

  // Get user's effective permissions
  getEffectivePermissions(): PermissionType[] {
    return this.user.permissions;
  }

  // Check if user is admin or higher
  isAdminOrHigher(): boolean {
    return this.hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
  }

  // Check if user is manager or higher
  isManagerOrHigher(): boolean {
    return this.hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
  }
}
