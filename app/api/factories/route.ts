import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/factories - Get all factories with their lines
export async function GET(request: NextRequest) {
  try {
    const factories = await prisma.factory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: factories,
      total: factories.length
    });
  } catch (error) {
    console.error('Error fetching factories:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/factories - Create new factory
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create factories
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Factory name is required' },
        { status: 400 }
      );
    }

    // Check if factory with same name already exists
    const existingFactory = await prisma.factory.findFirst({
      where: { name: { equals: name } }
    });

    if (existingFactory) {
      return NextResponse.json(
        { error: 'Factory with this name already exists' },
        { status: 409 }
      );
    }

    const factory = await prisma.factory.create({
      data: { name }
    });

    return NextResponse.json(factory, { status: 201 });
  } catch (error) {
    console.error('Error creating factory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
