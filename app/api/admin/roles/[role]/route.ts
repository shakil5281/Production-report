import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

// GET /api/admin/roles/[role] - Get specific role details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has SUPER_ADMIN role
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const roleName = resolvedParams.role.toUpperCase() as UserRole;

    // Validate role
    if (!Object.values(UserRole).includes(roleName)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Get or create role entry
    let roleEntry = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!roleEntry) {
      roleEntry = await prisma.role.create({
        data: {
          name: roleName,
          description: `${roleName.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())} role`
        }
      });
    }

    // Get role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: roleEntry.id },
      include: {
        permission: true
      }
    });

    // Get user count for this role
    const userCount = await prisma.user.count({
      where: { role: roleName }
    });

    // Get users with this role
    const users = await prisma.user.findMany({
      where: { role: roleName },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    const roleDetails = {
      name: roleName,
      displayName: roleName.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
      permissions: rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description
      })),
      userCount,
      users,
      isSystemRole: true
    };

    return NextResponse.json({ role: roleDetails });
  } catch (error) {
    console.error('Get role details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/roles/[role] - Update specific role permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has SUPER_ADMIN role
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const roleName = resolvedParams.role.toUpperCase() as UserRole;
    const body = await request.json();
    const { permissions } = body;

    // Validate role
    if (!Object.values(UserRole).includes(roleName)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions array is required' },
        { status: 400 }
      );
    }

    // Validate permissions exist
    const validPermissions = await prisma.permissionModel.findMany({
      where: {
        name: {
          in: permissions
        }
      }
    });

    if (validPermissions.length !== permissions.length) {
      return NextResponse.json(
        { error: 'Some permissions are invalid' },
        { status: 400 }
      );
    }

    // Get or create role entry
    let roleEntry = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!roleEntry) {
      roleEntry = await prisma.role.create({
        data: {
          name: roleName,
          description: `${roleName.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())} role`
        }
      });
    }

    await prisma.$transaction(async (tx) => {
      // Delete existing role permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: roleEntry!.id }
      });

      // Create new role permissions
      if (permissions.length > 0) {
        const rolePermissions = validPermissions.map(permission => ({
          roleId: roleEntry!.id,
          permissionId: permission.id
        }));

        await tx.rolePermission.createMany({
          data: rolePermissions
        });
      }
    });

    return NextResponse.json({
      message: 'Role permissions updated successfully',
      role: roleName,
      permissions: permissions.length
    });
  } catch (error) {
    console.error('Update role permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
