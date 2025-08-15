import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/admin/navigation - Get all navigation items with permissions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const navigationItems = await prisma.navigationItem.findMany({
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
      },
      where: {
        parentId: null // Get only top-level items first
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: navigationItems
    });
  } catch (error) {
    console.error('Error fetching navigation items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/navigation - Create new navigation item
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, url, icon, parentId, order, isActive, isPublic, rolePermissions } = body;

    // Validate required fields
    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      );
    }

    // Check if URL already exists
    const existingItem = await prisma.navigationItem.findUnique({
      where: { url }
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'URL already exists' },
        { status: 400 }
      );
    }

    // Create navigation item
    const navigationItem = await prisma.navigationItem.create({
      data: {
        title,
        url,
        icon,
        parentId,
        order: order || 0,
        isActive: isActive !== false,
        isPublic: isPublic || false
      }
    });

    // Create role permissions if provided
    if (rolePermissions && Array.isArray(rolePermissions)) {
      const permissions = rolePermissions.map((roleId: string) => ({
        navigationId: navigationItem.id,
        roleId,
        canAccess: true
      }));

      await prisma.navigationPermission.createMany({
        data: permissions
      });
    }

    // Fetch the created item with relations
    const createdItem = await prisma.navigationItem.findUnique({
      where: { id: navigationItem.id },
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
      data: createdItem,
      message: 'Navigation item created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating navigation item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
