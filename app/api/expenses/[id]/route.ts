import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { PaymentMethod } from '@prisma/client';

// GET /api/expenses/[id] - Optional: fetch a specific expense
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        line: true,
        category: true,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const normalizedExpense = {
      ...expense,
      date: expense.date.toISOString().split('T')[0],
      amount: Number(expense.amount),
    };

    return NextResponse.json(normalizedExpense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/expenses/[id] - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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
      date?: string;
      lineId?: string | null;
      categoryId?: string;
      amount?: number;
      description?: string | null;
      paymentMethod?: PaymentMethod;
    };

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (amount !== undefined && amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    if (categoryId) {
      const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
      if (!category) {
        return NextResponse.json({ error: 'Expense category not found' }, { status: 404 });
      }
    }

    if (lineId) {
      const line = await prisma.line.findUnique({ where: { id: lineId } });
      if (!line) {
        return NextResponse.json({ error: 'Production line not found' }, { status: 404 });
      }
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        lineId: lineId === '' ? null : lineId,
        categoryId: categoryId ?? undefined,
        amount: amount ?? undefined,
        description: description ?? undefined,
        paymentMethod: paymentMethod ?? undefined,
      },
      include: {
        line: true,
        category: true,
      },
    });

    const normalized = {
      ...updated,
      date: updated.date.toISOString().split('T')[0],
      amount: Number(updated.amount),
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await prisma.expense.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}