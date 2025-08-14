import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Prisma, StyleStatus } from '@prisma/client';

// GET /api/styles - Get styles with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const buyer = searchParams.get('buyer');
    const poNumber = searchParams.get('poNumber');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: Prisma.StyleWhereInput = {};
    
    if (statusParam) {
      const statusUpper = statusParam.toUpperCase() as StyleStatus;
      const allowedStatuses: StyleStatus[] = ['PENDING','RUNNING','WAITING','COMPLETE','CANCELLED'];
      if (allowedStatuses.includes(statusUpper)) {
        where.status = statusUpper;
      }
    }
    if (buyer) {
      where.buyer = { contains: buyer, mode: 'insensitive' };
    }
    if (poNumber) {
      where.poNumber = { contains: poNumber, mode: 'insensitive' };
    }

    const [styles, total] = await Promise.all([
      prisma.style.findMany({
        where,
        include: {
          styleAssignments: {
            include: {
              line: true
            }
          },
          _count: {
            select: {
              productionEntries: true,
              shipments: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.style.count({ where })
    ]);

    return NextResponse.json({
      styles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching styles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/styles - Create new style
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create styles
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      styleNumber,
      buyer,
      poNumber,
      orderQty,
      unitPrice,
      plannedStart,
      plannedEnd
    } = body as {
      styleNumber: string;
      buyer: string;
      poNumber: string;
      orderQty: number;
      unitPrice: number;
      plannedStart: string;
      plannedEnd?: string | null;
    };

    // Validate required fields
    if (!styleNumber || !buyer || !poNumber || !orderQty || !unitPrice || !plannedStart) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate quantities and prices
    if (orderQty <= 0) {
      return NextResponse.json(
        { error: 'Order quantity must be greater than 0' },
        { status: 400 }
      );
    }

    if (unitPrice <= 0) {
      return NextResponse.json(
        { error: 'Unit price must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if style with same number already exists
    const existingStyle = await prisma.style.findUnique({
      where: { styleNumber }
    });

    if (existingStyle) {
      return NextResponse.json(
        { error: 'Style with this number already exists' },
        { status: 409 }
      );
    }

    // Check if PO number already exists
    const existingPO = await prisma.style.findFirst({
      where: { poNumber }
    });

    if (existingPO) {
      return NextResponse.json(
        { error: 'PO number already exists' },
        { status: 409 }
      );
    }

    const style = await prisma.style.create({
      data: {
        styleNumber,
        buyer,
        poNumber,
        orderQty,
        unitPrice,
        plannedStart: new Date(plannedStart + 'T00:00:00Z'),
        plannedEnd: plannedEnd ? new Date(plannedEnd + 'T00:00:00Z') : new Date(plannedStart + 'T00:00:00Z') // Default to plannedStart if no end date
      },
      include: {
        styleAssignments: true
      }
    });

    return NextResponse.json(style, { status: 201 });
  } catch (error) {
    console.error('Error creating style:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
