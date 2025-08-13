import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Prisma, CashbookType } from '@prisma/client';

// GET /api/cashbook - Get cashbook entries with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type') as CashbookType | null;
    const category = searchParams.get('category');
    const lineId = searchParams.get('lineId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: Prisma.CashbookEntryWhereInput = {};
    
    if (date) {
      where.date = new Date(date);
    }
    if (type) {
      where.type = type;
    }
    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }
    if (lineId) {
      where.lineId = lineId;
    }

    const [entries, total] = await Promise.all([
      prisma.cashbookEntry.findMany({
        where,
        include: {
          line: {
            include: {
              factory: true
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.cashbookEntry.count({ where })
    ]);

    // Calculate running balance
    let runningBalance = 0;
    const entriesWithBalance = entries.map(entry => {
      if (entry.type === 'CREDIT') {
        runningBalance += Number(entry.amount);
      } else {
        runningBalance -= Number(entry.amount);
      }
      return {
        ...entry,
        runningBalance
      };
    });

    return NextResponse.json({
      entries: entriesWithBalance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching cashbook entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/cashbook - Create new cashbook entry
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create cashbook entries
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      date,
      type,
      amount,
      category,
      referenceType,
      referenceId,
      lineId,
      description
    } = body as {
      date: string;
      type: CashbookType;
      amount: number;
      category: string;
      referenceType?: string | null;
      referenceId?: string | null;
      lineId?: string | null;
      description?: string | null;
    };

    // Validate required fields
    if (!date || !type || !amount || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['DEBIT', 'CREDIT'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either DEBIT or CREDIT' },
        { status: 400 }
      );
    }

    // Check if line exists (if provided)
    if (lineId) {
      const line = await prisma.line.findUnique({
        where: { id: lineId }
      });

      if (!line) {
        return NextResponse.json(
          { error: 'Production line not found' },
          { status: 404 }
        );
      }
    }

    // Create the cashbook entry
    const entry = await prisma.cashbookEntry.create({
      data: {
        date: new Date(date),
        type,
        amount,
        category,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
        lineId: lineId || null,
        description
      },
      include: {
        line: {
          include: {
            factory: true
          }
        }
      }
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating cashbook entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
