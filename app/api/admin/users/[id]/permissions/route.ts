import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole, PermissionType } from '@prisma/client';
import { AuthService } from '@/lib/auth';

const prisma = new PrismaClient();

// PUT - Update user permissions (Super Admin and Admin only)
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

    // Validate session and check if user has permission
    const authService = new AuthService();
    const currentUser = await authService.validateSession(token);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Only Super Admin can update permissions
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    const body = await request.json();
    const { permissions } = body;

    // Validate permissions array
    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    // Validate each permission
    const validPermissions = Object.values(PermissionType);
    for (const permission of permissions) {
      if (!validPermissions.includes(permission)) {
        return NextResponse.json(
          { error: `Invalid permission: ${permission}` },
          { status: 400 }
        );
      }
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, email: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent modifying Super Admin permissions (only Super Admin can modify another Super Admin)
    if (targetUser.role === UserRole.SUPER_ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Cannot modify Super Admin permissions' },
        { status: 403 }
      );
    }

    // Start transaction to update permissions
    await prisma.$transaction(async (tx) => {
      // First, delete all existing user permissions
      await tx.userPermission.deleteMany({
        where: { userId }
      });

      // Get permission IDs for the new permissions
      const permissionRecords = await tx.permissionModel.findMany({
        where: {
          name: {
            in: permissions,
          },
        },
        select: { id: true, name: true },
      });

      // Create new user permissions
      if (permissionRecords.length > 0) {
        const userPermissions = permissionRecords.map(permission => ({
          userId,
          permissionId: permission.id,
        }));

        await tx.userPermission.createMany({
          data: userPermissions,
        });
      }
    });

    // Fetch updated user with permissions
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
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

    // Transform data to include permissions array
    const userWithPermissions = {
      ...updatedUser,
      permissions: updatedUser?.userPermissions.map(up => up.permission.name) || [],
      userPermissions: undefined // Remove the nested object
    };

    return NextResponse.json({
      success: true,
      message: 'User permissions updated successfully',
      user: userWithPermissions
    });

  } catch (error) {
    console.error('Update user permissions error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: params ? (await params).id : 'unknown'
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - Get user permissions (Super Admin and Admin only)
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

    // Validate session and check if user has permission
    const authService = new AuthService();
    const currentUser = await authService.validateSession(token);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Only Super Admin can view permissions
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Get user with permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Transform data to include permissions array
    const userWithPermissions = {
      ...user,
      permissions: user.userPermissions.map(up => up.permission.name),
      userPermissions: undefined // Remove the nested object
    };

    return NextResponse.json({
      success: true,
      user: userWithPermissions
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
