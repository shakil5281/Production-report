import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Prisma, PaymentMethod } from '@prisma/client';

// GET /api/expenses - Get expenses with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const lineId = searchParams.get('lineId');
    const categoryId = searchParams.get('categoryId');
    const paymentMethod = searchParams.get('paymentMethod') as PaymentMethod | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {};
    
    if (date) {
      where.date = new Date(date);
    }
    if (lineId) {
      where.lineId = lineId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          line: true,
          category: true
        },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.expense.count({ where })
    ]);

    const normalizedExpenses = expenses.map((expense) => ({
      ...expense,
      date: expense.date.toISOString().split('T')[0],
      amount: Number(expense.amount),
    }));

    return NextResponse.json({
      expenses: normalizedExpenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create expenses
    if (!user.role || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions - SUPER_ADMIN access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      date,
      lineId,
      categoryId,
      amount,
      description,
      paymentMethod
    } = body as {
      date: string;
      lineId?: string | null;
      categoryId: string;
      amount: number;
      description?: string | null;
      paymentMethod: PaymentMethod;
    };

    // Validate required fields
    if (!date || !categoryId || !amount || !paymentMethod) {
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

    // Check if category exists
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Expense category not found' },
        { status: 404 }
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

    // Create the expense
    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        lineId: lineId || null,
        categoryId,
        amount,
        description,
        paymentMethod
      },
      include: {
        line: true,
        category: true
      }
    });

    const normalizedExpense = {
      ...expense,
      date: expense.date.toISOString().split('T')[0],
      amount: Number(expense.amount),
    };

    return NextResponse.json(normalizedExpense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
