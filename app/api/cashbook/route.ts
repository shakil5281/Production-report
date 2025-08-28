import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Prisma, CashbookType } from '@prisma/client';
import { ProfitLossService } from '@/lib/services/profit-loss-service';

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
    if (lineId) {
      where.lineId = lineId;
    }

    // Fetch base entries first (without category contains filter if provided)
    let entries = await prisma.cashbookEntry.findMany({
      where,
      include: {
        line: true,
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    });

    // Apply case-insensitive category filter in memory if provided (SQLite lacks mode)
    if (category) {
      const q = category.toLowerCase();
      entries = entries.filter((e) => e.category.toLowerCase().includes(q));
    }

    // Calculate running balance
    let runningBalance = 0;
    const entriesWithBalance = entries.map((entry) => {
      if (entry.type === 'CREDIT') {
        runningBalance += Number(entry.amount);
      } else {
        runningBalance -= Number(entry.amount);
      }
      return {
        ...entry,
        date: entry.date.toISOString().split('T')[0],
        amount: Number(entry.amount),
        runningBalance,
      };
    });

    // Get total count for pagination using same base where; if category provided, adjust count in-memory
    const totalBase = await prisma.cashbookEntry.count({ where });
    const total = category
      ? (await prisma.cashbookEntry.findMany({ where })).filter((e) =>
          e.category.toLowerCase().includes(category.toLowerCase())
        ).length
      : totalBase;

    return NextResponse.json({
      entries: entriesWithBalance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
    if (!user.role || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions - SUPER_ADMIN access required' }, { status: 403 });
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
      description,
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
        where: { id: lineId },
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
        description,
      },
      include: {
        line: true,
      },
    });

    // Update Profit & Loss Statement automatically (only for DEBIT entries that affect expenses)
    if (type === 'DEBIT') {
      try {
        await ProfitLossService.handleProfitLossUpdate({
          date: date,
          type: 'CASHBOOK',
          action: 'CREATE',
          recordId: entry.id
        });
      } catch (error) {
        console.warn('Failed to update Profit & Loss Statement:', error);
        // Continue with cashbook creation even if P&L update fails
      }
    }

    const normalizedEntry = {
      ...entry,
      date: entry.date.toISOString().split('T')[0],
      amount: Number(entry.amount),
    };

    return NextResponse.json(normalizedEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating cashbook entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
