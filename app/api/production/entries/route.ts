import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Prisma, ProductionStage } from '@prisma/client';

// GET /api/production/entries - Get production entries with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const lineId = searchParams.get('lineId');
    const styleId = searchParams.get('styleId');
    const stage = searchParams.get('stage') as ProductionStage | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: Prisma.ProductionEntryWhereInput = {};
    
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (date) {
      where.date = new Date(date);
    }
    if (lineId) {
      where.lineId = lineId;
    }
    if (styleId) {
      where.styleId = styleId;
    }
    if (stage) {
      where.stage = stage;
    }

    const [entries, total] = await Promise.all([
      prisma.productionEntry.findMany({
        where,
        include: {
          line: {
            include: {
              factory: true
            }
          },
          style: true
        },
        orderBy: [
          { date: 'desc' },
          { hourIndex: 'desc' },
          { lineId: 'asc' },
          { styleId: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.productionEntry.count({ where })
    ]);

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching production entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/production/entries - Create new production entry
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create production entries
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      date,
      hourIndex,
      lineId,
      styleId,
      stage,
      inputQty,
      outputQty,
      defectQty,
      reworkQty,
      notes
    } = body as {
      date: string;
      hourIndex: number;
      lineId: string;
      styleId: string;
      stage: ProductionStage;
      inputQty?: number | null;
      outputQty?: number | null;
      defectQty?: number | null;
      reworkQty?: number | null;
      notes?: string | null;
    };

    // Validate required fields
    if (!date || hourIndex === undefined || !lineId || !styleId || !stage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate hour index
    if (hourIndex < 0 || hourIndex > 23) {
      return NextResponse.json(
        { error: 'Hour index must be between 0 and 23' },
        { status: 400 }
      );
    }

    // Check if entry already exists for this hour/line/style/stage
    const existingEntry = await prisma.productionEntry.findUnique({
      where: {
        date_hourIndex_lineId_styleId_stage: {
          date: new Date(date),
          hourIndex,
          lineId,
          styleId,
          stage
        }
      }
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Production entry already exists for this hour, line, style, and stage' },
        { status: 409 }
      );
    }

    // Create the production entry
    const entry = await prisma.productionEntry.create({
      data: {
        date: new Date(date),
        hourIndex,
        lineId,
        styleId,
        stage,
        inputQty: inputQty || 0,
        outputQty: outputQty || 0,
        defectQty: defectQty || 0,
        reworkQty: reworkQty || 0,
        notes
      },
      include: {
        line: {
          include: {
            factory: true
          }
        },
        style: true
      }
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating production entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
