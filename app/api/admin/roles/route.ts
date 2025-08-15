import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { UserRole, PermissionType } from '@prisma/client';

// GET /api/admin/roles - Get all roles with their permissions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has SUPER_ADMIN role
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Get available permissions for role creation
    if (action === 'permissions') {
      const permissions = await prisma.permissionModel.findMany({
        orderBy: { name: 'asc' }
      });

      return NextResponse.json({
        permissions: permissions.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description
        }))
      });
    }

    // Get all roles with basic info
    if (action === 'basic') {
      const roles = Object.values(UserRole).map(role => ({
        name: role,
        displayName: role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
        isSystemRole: true
      }));

      return NextResponse.json({ roles });
    }

    // Get all roles with their permissions
    const roleEntries = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    // Group permissions by role
    const roleMap = new Map<UserRole, any>();
    
    // Initialize all roles
    Object.values(UserRole).forEach(role => {
      roleMap.set(role, {
        name: role,
        displayName: role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
        permissions: [],
        isSystemRole: true,
        userCount: 0
      });
    });

    // Add permissions to roles from database
    roleEntries.forEach(role => {
      const roleData = roleMap.get(role.name);
      if (roleData) {
        roleData.permissions = role.rolePermissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description
        }));
      }
    });

    // Get user counts for each role
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    userCounts.forEach(count => {
      const role = roleMap.get(count.role);
      if (role) {
        role.userCount = count._count.role;
      }
    });

    const roles = Array.from(roleMap.values());

    return NextResponse.json({
      roles,
      total: roles.length
    });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Update role permissions
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has SUPER_ADMIN role
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { role, permissions, action } = body;

    if (!role || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Role and permissions array are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
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
      where: { name: role as UserRole }
    });

    if (!roleEntry) {
      roleEntry = await prisma.role.create({
        data: {
          name: role as UserRole,
          description: `${role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())} role`
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
      role,
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

// PUT /api/admin/roles - Bulk update role permissions
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has SUPER_ADMIN role
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { roleUpdates } = body;

    if (!Array.isArray(roleUpdates)) {
      return NextResponse.json(
        { error: 'roleUpdates array is required' },
        { status: 400 }
      );
    }

    // Validate all role updates
    for (const update of roleUpdates) {
      if (!update.role || !Array.isArray(update.permissions)) {
        return NextResponse.json(
          { error: 'Each role update must have role and permissions array' },
          { status: 400 }
        );
      }

      if (!Object.values(UserRole).includes(update.role as UserRole)) {
        return NextResponse.json(
          { error: `Invalid role: ${update.role}` },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const update of roleUpdates) {
        const { role, permissions } = update;

        // Get or create role entry
        let roleEntry = await tx.role.findUnique({
          where: { name: role as UserRole }
        });

        if (!roleEntry) {
          roleEntry = await tx.role.create({
            data: {
              name: role as UserRole,
              description: `${role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())} role`
            }
          });
        }

        // Delete existing role permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: roleEntry.id }
        });

        // Get valid permissions
        if (permissions.length > 0) {
          const validPermissions = await tx.permissionModel.findMany({
            where: {
              name: {
                in: permissions
              }
            }
          });

          // Create new role permissions
          const rolePermissions = validPermissions.map(permission => ({
            roleId: roleEntry!.id,
            permissionId: permission.id
          }));

          await tx.rolePermission.createMany({
            data: rolePermissions
          });
        }
      }
    });

    return NextResponse.json({
      message: 'Bulk role permissions updated successfully',
      updatedRoles: roleUpdates.length
    });
  } catch (error) {
    console.error('Bulk update role permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
