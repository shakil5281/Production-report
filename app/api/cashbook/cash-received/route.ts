import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/cashbook/cash-received - Get all cash received entries
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
    const category = searchParams.get('category');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      type: 'CREDIT' // Cash received is credit entry
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

    // Category filter
    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive'
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
    console.error('Error fetching cash received entries:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cash received entries',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/cashbook/cash-received - Create new cash received entry
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
      category,
      description,
      referenceType,
      referenceId,
      lineId
    } = body;

    // Validation
    if (!date || !amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: date, amount' 
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

    // Create cash received entry
    const entry = await prisma.cashbookEntry.create({
      data: {
        date: entryDate,
        type: 'CREDIT',
        amount: amountNum,
        category: category?.trim() || 'Cash Received',
        description: description?.trim() || null,
        referenceType: referenceType?.trim() || null,
        referenceId: referenceId?.trim() || null,
        lineId: lineId || null
      },
      include: {
        line: true
      }
    });

    return NextResponse.json({
      success: true,
      data: entry,
      message: 'Cash received entry created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating cash received entry:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create cash received entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
