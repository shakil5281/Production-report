import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

// GET /api/lines - Get all production lines
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const factoryId = searchParams.get('factoryId');
    const isActive = searchParams.get('isActive');

    const where: Prisma.LineWhereInput = {};
    
    if (factoryId) {
      where.factoryId = factoryId;
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const lines = await prisma.line.findMany({
      where,
      include: {
        factory: true,
        _count: {
          select: {
            styleAssignments: true,
            productionEntries: true
          }
        }
      },
      orderBy: [
        { factory: { name: 'asc' } },
        { code: 'asc' }
      ]
    });

    return NextResponse.json(lines);
  } catch (error) {
    console.error('Error fetching lines:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/lines - Create new production line
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create lines
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { factoryId, name, code } = body as { factoryId: string; name: string; code: string };

    if (!factoryId || !name || !code) {
      return NextResponse.json(
        { error: 'Factory ID, name, and code are required' },
        { status: 400 }
      );
    }

    // Check if factory exists
    const factory = await prisma.factory.findUnique({
      where: { id: factoryId }
    });

    if (!factory) {
      return NextResponse.json(
        { error: 'Factory not found' },
        { status: 404 }
      );
    }

    // Check if line with same code already exists
    const existingLine = await prisma.line.findUnique({
      where: { code }
    });

    if (existingLine) {
      return NextResponse.json(
        { error: 'Line with this code already exists' },
        { status: 409 }
      );
    }

    const line = await prisma.line.create({
      data: {
        factoryId,
        name,
        code
      },
      include: {
        factory: true
      }
    });

    return NextResponse.json(line, { status: 201 });
  } catch (error) {
    console.error('Error creating line:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
