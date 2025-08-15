import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/navigation - Get navigation items for current user based on role
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role
    const userRole = await prisma.role.findUnique({
      where: { name: user.role }
    });

    if (!userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 404 });
    }

    // Get navigation items based on user's role or public items
    const navigationItems = await prisma.navigationItem.findMany({
      where: {
        isActive: true,
        OR: [
          { isPublic: true },
          {
            navigationPermissions: {
              some: {
                roleId: userRole.id,
                canAccess: true
              }
            }
          }
        ],
        parentId: null // Only top-level items
      },
      include: {
        children: {
          where: {
            isActive: true,
            OR: [
              { isPublic: true },
              {
                navigationPermissions: {
                  some: {
                    roleId: userRole.id,
                    canAccess: true
                  }
                }
              }
            ]
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: navigationItems
    });
  } catch (error) {
    console.error('Error fetching user navigation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
