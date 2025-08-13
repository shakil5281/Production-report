import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

interface UserWithPermissions {
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

export class AuthService {
  // Hash password using bcrypt (server-side only)
  async hashPassword(password: string): Promise<string> {
    if (typeof window !== 'undefined') {
      throw new Error('Password hashing must be done on the server');
    }
    
    const bcrypt = await import('bcrypt');
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Compare password using bcrypt (server-side only)
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    if (typeof window !== 'undefined') {
      throw new Error('Password comparison must be done on the server');
    }
    
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token (server-side only)
  async generateToken(userId: string, role: UserRole): Promise<string> {
    if (typeof window !== 'undefined') {
      throw new Error('Token generation must be done on the server');
    }
    
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    return jwt.sign(
      { userId, role },
      secret,
      { expiresIn: '7d' }
    );
  }

  // Validate JWT token (server-side only)
  async validateToken(token: string): Promise<{ userId: string; role: UserRole } | null> {
    if (typeof window !== 'undefined') {
      throw new Error('Token validation must be done on the server');
    }
    
    try {
      const jwt = await import('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      
      return jwt.verify(token, secret) as { userId: string; role: UserRole };
    } catch {
      return null;
    }
  }

  // Authenticate user (server-side only)
  async authenticateUser(email: string, password: string): Promise<UserWithPermissions | null> {
    if (typeof window !== 'undefined') {
      throw new Error('User authentication must be done on the server');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
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

      const isPasswordValid = await this.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Generate token
      const token = await this.generateToken(user.id, user.role);

      // Create session
      await this.createSession(user.id, token);

      // Transform user data
      const userWithPermissions: UserWithPermissions = {
        ...user,
        permissions: user.userPermissions.map(up => up.permission.name),
        token,
        userPermissions: undefined,
      };

      return userWithPermissions;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  // Create session (server-side only)
  async createSession(userId: string, token: string): Promise<void> {
    if (typeof window !== 'undefined') {
      throw new Error('Session creation must be done on the server');
    }

    try {
      const expires = new Date();
      expires.setDate(expires.getDate() + 7); // 7 days

      await prisma.session.create({
        data: {
          userId,
          token,
          expires,
        },
      });
    } catch (error) {
      console.error('Session creation error:', error);
    }
  }

  // Validate session (server-side only)
  async validateSession(token: string): Promise<UserWithPermissions | null> {
    if (typeof window !== 'undefined') {
      throw new Error('Session validation must be done on the server');
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

      if (!session || session.expires < new Date()) {
        // Delete expired session
        await this.deleteSession(token);
        return null;
      }

      // Transform user data
      const userWithPermissions: UserWithPermissions = {
        ...session.user,
        permissions: session.user.userPermissions.map(up => up.permission.name),
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

  // Get current user from request headers
  async getCurrentUser(request: Request): Promise<UserWithPermissions | null> {
    if (typeof window !== 'undefined') {
      throw new Error('getCurrentUser must be called on the server');
    }

    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.substring(7);
      return await this.validateSession(token);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}

// Export standalone getCurrentUser function for API routes
export async function getCurrentUser(request: Request): Promise<UserWithPermissions | null> {
  const authService = new AuthService();
  return await authService.getCurrentUser(request);
}
