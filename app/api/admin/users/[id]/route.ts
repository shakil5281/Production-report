import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole, PermissionType } from '@prisma/client';
import { AuthService } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get specific user (Super Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get the user
    const { id } = await params;
    const targetUser = await prisma.user.findUnique({
      where: { id },
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
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Transform data to include permissions array
    const userWithPermissions = {
      ...targetUser,
      permissions: targetUser.userPermissions.map(up => up.permission.name),
      userPermissions: undefined // Remove the nested object
    };

    return NextResponse.json({
      success: true,
      user: userWithPermissions
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update user (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { name, email, role, isActive, password } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get params and check if user exists
    const { id } = await params;
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is taken by another user
    if (email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });

      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role: role as UserRole,
      isActive: isActive ?? true,
    };

    // Hash password if provided
    if (password && password.trim() !== '') {
      updateData.password = await authService.hashPassword(password);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Update user permissions based on new role if role changed
    if (role !== existingUser.role) {
      // Delete existing permissions
      await prisma.userPermission.deleteMany({
        where: { userId: id }
      });

      // Create new permissions based on role
      await createDefaultUserPermissions(id, role as UserRole);
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete user (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get params and check if user exists
    const { id } = await params;
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent self-deletion
    if (user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user (this will cascade delete sessions and permissions)
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to create default permissions for a role
async function createDefaultUserPermissions(userId: string, role: UserRole) {
  try {
    // Get default permissions for the role
    const defaultPermissions = await getDefaultPermissionsForRole(role);
    
    // Create user permissions
    const userPermissions = defaultPermissions.map(permissionId => ({
      userId,
      permissionId,
    }));

    if (userPermissions.length > 0) {
      await prisma.userPermission.createMany({
        data: userPermissions,
      });
    }
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
    [UserRole.CASHBOOK_MANAGER]: [
      PermissionType.CREATE_CASHBOOK,
      PermissionType.READ_CASHBOOK,
      PermissionType.UPDATE_CASHBOOK,
      PermissionType.DELETE_CASHBOOK,
      PermissionType.CREATE_EXPENSE,
      PermissionType.READ_EXPENSE,
      PermissionType.UPDATE_EXPENSE,
      PermissionType.DELETE_EXPENSE,
      PermissionType.READ_REPORT,
    ],
    [UserRole.PRODUCTION_MANAGER]: [
      PermissionType.CREATE_PRODUCTION,
      PermissionType.READ_PRODUCTION,
      PermissionType.UPDATE_PRODUCTION,
      PermissionType.DELETE_PRODUCTION,
      PermissionType.CREATE_TARGET,
      PermissionType.READ_TARGET,
      PermissionType.UPDATE_TARGET,
      PermissionType.DELETE_TARGET,
      PermissionType.CREATE_LINE,
      PermissionType.READ_LINE,
      PermissionType.UPDATE_LINE,
      PermissionType.DELETE_LINE,
      PermissionType.READ_REPORT,
    ],
    [UserRole.CUTTING_MANAGER]: [
      PermissionType.CREATE_CUTTING,
      PermissionType.READ_CUTTING,
      PermissionType.UPDATE_CUTTING,
      PermissionType.DELETE_CUTTING,
      PermissionType.READ_PRODUCTION,
      PermissionType.READ_REPORT,
    ],
    [UserRole.REPORT_VIEWER]: [
      PermissionType.READ_REPORT,
      PermissionType.READ_PRODUCTION,
      PermissionType.READ_CASHBOOK,
      PermissionType.READ_CUTTING,
      PermissionType.READ_TARGET,
      PermissionType.READ_EXPENSE,
      PermissionType.READ_SHIPMENT,
    ],
    [UserRole.MANAGER]: [
      PermissionType.READ_PRODUCTION,
      PermissionType.UPDATE_PRODUCTION,
      PermissionType.CREATE_REPORT,
      PermissionType.READ_REPORT,
      PermissionType.UPDATE_REPORT,
      PermissionType.READ_CASHBOOK,
      PermissionType.READ_CUTTING,
      PermissionType.READ_TARGET,
      PermissionType.READ_EXPENSE,
    ],
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