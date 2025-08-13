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
    const stage = searchParams.get('stage') as ProductionStage | 'all' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000' },
        { status: 400 }
      );
    }
    
    const skip = (page - 1) * limit;

    const where: Prisma.ProductionEntryWhereInput = {};
    
    if (startDate && endDate) {
      try {
        const startDateTime = new Date(startDate + 'T00:00:00Z');
        const endDateTime = new Date(endDate + 'T23:59:59Z');
        
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format' },
            { status: 400 }
          );
        }
        
        where.date = { 
          gte: startDateTime, 
          lte: endDateTime
        };
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    } else if (date) {
      try {
        const dateTime = new Date(date + 'T00:00:00Z');
        if (isNaN(dateTime.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format' },
            { status: 400 }
          );
        }
        where.date = dateTime;
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    }
    if (lineId && lineId !== 'all') {
      where.lineId = lineId;
    }
    if (styleId && styleId !== 'all') {
      where.styleId = styleId;
    }
    if (stage && stage !== 'all') {
      const validStages: ProductionStage[] = ['CUTTING', 'SEWING', 'FINISHING'];
      if (!validStages.includes(stage)) {
        return NextResponse.json(
          { error: 'Invalid stage parameter' },
          { status: 400 }
        );
      }
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

    // Ensure entries is always an array
    if (!Array.isArray(entries)) {
      console.error('Unexpected entries format:', entries);
      return NextResponse.json(
        { error: 'Invalid data format returned from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entries: entries || [],
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

    // Validate stage is a valid ProductionStage
    if (!['CUTTING', 'SEWING', 'FINISHING'].includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage parameter' },
        { status: 400 }
      );
    }

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
    const existingEntry = await prisma.productionEntry.findFirst({
      where: {
        date: new Date(date + 'T00:00:00Z'),
        hourIndex,
        lineId,
        styleId,
        stage
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
        date: new Date(date + 'T00:00:00Z'),
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
