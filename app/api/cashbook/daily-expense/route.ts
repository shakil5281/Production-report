import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/cashbook/daily-expense - Get all daily expense entries
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const description = searchParams.get('description');
    const volumeNumber = searchParams.get('volumeNumber');

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      type: 'DEBIT' // Daily expense is debit entry
    };

    // Date filter
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate + 'T00:00:00Z'),
        lte: new Date(endDate + 'T23:59:59Z')
      };
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate + 'T00:00:00Z')
      };
    } else if (endDate) {
      where.date = {
        lte: new Date(endDate + 'T23:59:59Z')
      };
    }

    // Amount filters
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount);
      }
    }

    // Description filter
    if (description) {
      where.description = {
        contains: description,
        mode: 'insensitive'
      };
    }

    // Volume number filter
    if (volumeNumber) {
      where.referenceId = {
        contains: volumeNumber,
        mode: 'insensitive'
      };
    }

    const [entries, total] = await Promise.all([
      prisma.cashbookEntry.findMany({
        where,
        include: {
          line: true
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

    // Calculate total amount for current filter
    const totalAmount = await prisma.cashbookEntry.aggregate({
      where,
      _sum: {
        amount: true
      }
    });

    return NextResponse.json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalAmount: totalAmount._sum.amount || 0,
        totalEntries: total
      }
    });

  } catch (error) {
    console.error('Error fetching daily expense entries:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch daily expense entries',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/cashbook/daily-expense - Create new daily expense entry
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      amount,
      description,
      referenceId // This will be the volume number
    } = body;

    // Validation
    if (!date || !amount || !description) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: date, amount, description' 
        },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Amount must be a positive number' 
        },
        { status: 400 }
      );
    }

    // Validate date
    let entryDate: Date;
    try {
      entryDate = new Date(date);
      if (isNaN(entryDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid date format' 
        },
        { status: 400 }
      );
    }

    // Create daily expense entry
    const entry = await prisma.cashbookEntry.create({
      data: {
        date: entryDate,
        type: 'DEBIT',
        amount: amountNum,
        category: 'Daily Expense',
        description: description.trim(),
        referenceType: 'Volume',
        referenceId: referenceId?.trim() || null,
        lineId: null
      },
      include: {
        line: true
      }
    });

    return NextResponse.json({
      success: true,
      data: entry,
      message: 'Daily expense entry created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating daily expense entry:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create daily expense entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
