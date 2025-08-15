import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole, PermissionType } from '@prisma/client';
import { AuthService } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get all users (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate session and check if user is Super Admin
    const authService = new AuthService();
    const user = await authService.validateSession(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all users with their permissions
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        userPermissions: {
          include: {
            permission: {
              select: {
                name: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to include permissions array
    const usersWithPermissions = users.map(user => ({
      ...user,
      permissions: user.userPermissions.map(up => up.permission.name),
      userPermissions: undefined // Remove the nested object
    }));

    return NextResponse.json({
      success: true,
      users: usersWithPermissions,
      total: usersWithPermissions.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new user (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate session and check if user is Super Admin
    const authService = new AuthService();
    const user = await authService.validateSession(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, isActive = true } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await authService.hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Create default user permissions based on role
    await createDefaultUserPermissions(newUser.id, role as UserRole);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function createDefaultUserPermissions(userId: string, role: UserRole) {
  try {
    // Get default permissions for the role
    const defaultPermissions = await getDefaultPermissionsForRole(role);
    
    // Create user permissions
    const userPermissions = defaultPermissions.map(permissionId => ({
      userId,
      permissionId,
      granted: true,
    }));

    await prisma.userPermission.createMany({
      data: userPermissions,
    });
  } catch (error) {
    console.error('Error creating default user permissions:', error);
  }
}

async function getDefaultPermissionsForRole(role: UserRole): Promise<string[]> {
  // Define default permissions for each role
  const rolePermissions: Record<UserRole, PermissionType[]> = {
    [UserRole.USER]: [
      PermissionType.READ_PRODUCTION,
      PermissionType.READ_REPORT,
    ],
    // Old roles removed - now using simplified 3-role system
    [UserRole.ADMIN]: [
      PermissionType.CREATE_PRODUCTION,
      PermissionType.READ_PRODUCTION,
      PermissionType.UPDATE_PRODUCTION,
      PermissionType.DELETE_PRODUCTION,
      PermissionType.CREATE_CUTTING,
      PermissionType.READ_CUTTING,
      PermissionType.UPDATE_CUTTING,
      PermissionType.DELETE_CUTTING,
      PermissionType.CREATE_CASHBOOK,
      PermissionType.READ_CASHBOOK,
      PermissionType.UPDATE_CASHBOOK,
      PermissionType.DELETE_CASHBOOK,
      PermissionType.CREATE_REPORT,
      PermissionType.READ_REPORT,
      PermissionType.UPDATE_REPORT,
      PermissionType.DELETE_REPORT,
      PermissionType.CREATE_USER,
      PermissionType.READ_USER,
      PermissionType.UPDATE_USER,
      PermissionType.CREATE_EXPENSE,
      PermissionType.READ_EXPENSE,
      PermissionType.UPDATE_EXPENSE,
      PermissionType.DELETE_EXPENSE,
      PermissionType.CREATE_TARGET,
      PermissionType.READ_TARGET,
      PermissionType.UPDATE_TARGET,
      PermissionType.DELETE_TARGET,
      PermissionType.CREATE_LINE,
      PermissionType.READ_LINE,
      PermissionType.UPDATE_LINE,
      PermissionType.DELETE_LINE,
    ],
    [UserRole.SUPER_ADMIN]: [
      PermissionType.CREATE_PRODUCTION,
      PermissionType.READ_PRODUCTION,
      PermissionType.UPDATE_PRODUCTION,
      PermissionType.DELETE_PRODUCTION,
      PermissionType.CREATE_CUTTING,
      PermissionType.READ_CUTTING,
      PermissionType.UPDATE_CUTTING,
      PermissionType.DELETE_CUTTING,
      PermissionType.CREATE_CASHBOOK,
      PermissionType.READ_CASHBOOK,
      PermissionType.UPDATE_CASHBOOK,
      PermissionType.DELETE_CASHBOOK,
      PermissionType.CREATE_REPORT,
      PermissionType.READ_REPORT,
      PermissionType.UPDATE_REPORT,
      PermissionType.DELETE_REPORT,
      PermissionType.CREATE_USER,
      PermissionType.READ_USER,
      PermissionType.UPDATE_USER,
      PermissionType.DELETE_USER,
      PermissionType.CREATE_EXPENSE,
      PermissionType.READ_EXPENSE,
      PermissionType.UPDATE_EXPENSE,
      PermissionType.DELETE_EXPENSE,
      PermissionType.CREATE_TARGET,
      PermissionType.READ_TARGET,
      PermissionType.UPDATE_TARGET,
      PermissionType.DELETE_TARGET,
      PermissionType.CREATE_LINE,
      PermissionType.READ_LINE,
      PermissionType.UPDATE_LINE,
      PermissionType.DELETE_LINE,
      PermissionType.CREATE_SHIPMENT,
      PermissionType.READ_SHIPMENT,
      PermissionType.UPDATE_SHIPMENT,
      PermissionType.DELETE_SHIPMENT,
      PermissionType.MANAGE_SYSTEM,
      PermissionType.MANAGE_ROLES,
      PermissionType.MANAGE_PERMISSIONS,
    ],
  };

  const permissions = rolePermissions[role] || [];
  
  // Get permission IDs from database
  const permissionRecords = await prisma.permissionModel.findMany({
    where: {
      name: {
        in: permissions,
      },
    },
    select: { id: true },
  });

  return permissionRecords.map(p => p.id);
}
