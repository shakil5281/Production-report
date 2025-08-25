import { UserRole } from '@prisma/client';
import { prisma } from './db/prisma';

export interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
  token: string;
  userPermissions?: unknown;
}

function extractTokenFromRequest(request: Request): string | null {
  try {
    // 1) Authorization header: Bearer <token>
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2) Cookie header: auth-token=<token>
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map((c) => c.trim());
      for (const cookie of cookies) {
        if (cookie.startsWith('auth-token=')) {
          return decodeURIComponent(cookie.substring('auth-token='.length));
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting token from request:', error);
    return null;
  }
}

export class AuthService {
  // Hash password using bcrypt (server-side only)
  async hashPassword(password: string): Promise<string> {
    if (typeof window !== 'undefined') {
      throw new Error('Password hashing must be done on the server');
    }
    
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    try {
      const bcrypt = await import('bcrypt');
      const saltRounds = 12;
      return bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  // Compare password using bcrypt (server-side only)
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    if (typeof window !== 'undefined') {
      throw new Error('Password comparison must be done on the server');
    }
    
    if (!password || !hashedPassword) {
      return false;
    }
    
    try {
      const bcrypt = await import('bcrypt');
      return bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return false;
    }
  }

  // Generate JWT token (server-side only)
  async generateToken(userId: string, role: UserRole): Promise<string> {
    if (typeof window !== 'undefined') {
      throw new Error('Token generation must be done on the server');
    }
    
    if (!userId || !role) {
      throw new Error('User ID and role are required for token generation');
    }
    
    try {
      const jwt = await import('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      
      return jwt.sign(
        { userId, role },
        secret,
        { expiresIn: '7d' }
      );
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  // Validate JWT token (server-side only)
  async validateToken(token: string): Promise<{ userId: string; role: UserRole } | null> {
    if (typeof window !== 'undefined') {
      throw new Error('Token validation must be done on the server');
    }
    
    if (!token) {
      return null;
    }
    
    try {
      const jwt = await import('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      
      return jwt.verify(token, secret) as { userId: string; role: UserRole };
    } catch (error) {
      console.error('Error validating token:', error);
      return null;
    }
  }

  // Authenticate user (server-side only)
  async authenticateUser(email: string, password: string): Promise<UserWithPermissions | null> {
    if (typeof window !== 'undefined') {
      throw new Error('User authentication must be done on the server');
    }

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          userPermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        return null;
      }

      const isValidPassword = await this.comparePassword(password, user.password);
      if (!isValidPassword) {
        return null;
      }

      // Generate token
      const token = await this.generateToken(user.id, user.role);

      // Create or update session
      await this.createOrUpdateSession(user.id, token);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Transform user data
      const userWithPermissions: UserWithPermissions = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        permissions: user.userPermissions.map(up => up.permission.name),
        token,
        userPermissions: undefined,
      };

      return userWithPermissions;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw new Error('Authentication failed');
    }
  }

  // Create or update session
  async createOrUpdateSession(userId: string, token: string): Promise<void> {
    if (typeof window !== 'undefined') {
      throw new Error('Session management must be done on the server');
    }

    try {
      const expires = new Date();
      expires.setDate(expires.getDate() + 7); // 7 days from now

      await prisma.session.upsert({
        where: { token },
        update: {
          expires,
        },
        create: {
          token,
          userId,
          expires,
        },
      });
    } catch (error) {
      console.error('Error creating/updating session:', error);
      throw new Error('Failed to create session');
    }
  }

  // Validate session (server-side only)
  async validateSession(token: string): Promise<UserWithPermissions | null> {
    if (typeof window !== 'undefined') {
      throw new Error('Session validation must be done on the server');
    }

    if (!token) {
      return null;
    }

    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              userPermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!session || !session.user || session.expires < new Date()) {
        // Delete expired session
        if (session) {
          await this.deleteSession(token);
        }
        return null;
      }

      // Pick only allowed fields and transform
      const userCore = (({ id, name, email, role, isActive, lastLogin, createdAt, updatedAt }) => ({
        id,
        name,
        email,
        role,
        isActive,
        lastLogin,
        createdAt,
        updatedAt,
      }))(session.user);
      const userPermissionsRelation = session.user.userPermissions;

      const userWithPermissions: UserWithPermissions = {
        ...userCore,
        permissions: userPermissionsRelation.map(up => up.permission.name),
        token,
        userPermissions: undefined,
      };

      return userWithPermissions;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  // Delete session (server-side only)
  async deleteSession(token: string): Promise<void> {
    if (typeof window !== 'undefined') {
      throw new Error('Session deletion must be done on the server');
    }

    try {
      await prisma.session.delete({
        where: { token },
      });
    } catch (error) {
      console.error('Session deletion error:', error);
    }
  }

  // Delete all sessions for a user (server-side only)
  async deleteAllUserSessions(userId: string): Promise<void> {
    if (typeof window !== 'undefined') {
      throw new Error('Session deletion must be done on the server');
    }

    try {
      await prisma.session.deleteMany({
        where: { userId },
      });
    } catch (error) {
      console.error('Session deletion error:', error);
    }
  }

  // Get current user from request headers or cookies
  async getCurrentUser(request: Request): Promise<UserWithPermissions | null> {
    if (typeof window !== 'undefined') {
      throw new Error('getCurrentUser must be called on the server');
    }

    try {
      const token = extractTokenFromRequest(request);
      if (!token) {
        return null;
      }

      return await this.validateSession(token);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}

// Export standalone getCurrentUser function for API routes
export async function getCurrentUser(request: Request): Promise<UserWithPermissions | null> {
  try {
    const authService = new AuthService();
    return await authService.getCurrentUser(request);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}
