import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/admin/navigation/[id] - Get specific navigation item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const navigationItem = await prisma.navigationItem.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            navigationPermissions: {
              include: {
                role: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        navigationPermissions: {
          include: {
            role: true
          }
        }
      }
    });

    if (!navigationItem) {
      return NextResponse.json(
        { error: 'Navigation item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: navigationItem
    });
  } catch (error) {
    console.error('Error fetching navigation item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/navigation/[id] - Update navigation item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, url, icon, parentId, order, isActive, isPublic, rolePermissions } = body;

    // Check if navigation item exists
    const existingItem = await prisma.navigationItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Navigation item not found' },
        { status: 404 }
      );
    }

    // Check if URL is being changed and if it conflicts with another item
    if (url && url !== existingItem.url) {
      const urlExists = await prisma.navigationItem.findFirst({
        where: {
          url,
          id: { not: id }
        }
      });

      if (urlExists) {
        return NextResponse.json(
          { error: 'URL already exists' },
          { status: 400 }
        );
      }
    }

    // Update navigation item
    const navigationItem = await prisma.navigationItem.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(url && { url }),
        ...(icon !== undefined && { icon }),
        ...(parentId !== undefined && { parentId }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
        ...(isPublic !== undefined && { isPublic })
      }
    });

    // Update role permissions if provided
    if (rolePermissions && Array.isArray(rolePermissions)) {
      // Delete existing permissions
      await prisma.navigationPermission.deleteMany({
        where: { navigationId: id }
      });

      // Create new permissions
      if (rolePermissions.length > 0) {
        const permissions = rolePermissions.map((roleId: string) => ({
          navigationId: id,
          roleId,
          canAccess: true
        }));

        await prisma.navigationPermission.createMany({
          data: permissions
        });
      }
    }

    // Fetch updated item with relations
    const updatedItem = await prisma.navigationItem.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        navigationPermissions: {
          include: {
            role: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Navigation item updated successfully'
    });
  } catch (error) {
    console.error('Error updating navigation item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/navigation/[id] - Delete navigation item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if navigation item exists
    const existingItem = await prisma.navigationItem.findUnique({
      where: { id },
      include: {
        children: true
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Navigation item not found' },
        { status: 404 }
      );
    }

    // Check if item has children
    if (existingItem.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete navigation item with children. Delete children first.' },
        { status: 400 }
      );
    }

    // Delete the navigation item (permissions will be deleted automatically due to cascade)
    await prisma.navigationItem.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Navigation item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting navigation item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
