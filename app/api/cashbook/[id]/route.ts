import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { CashbookType } from '@prisma/client';

// GET /api/cashbook/[id] - Optional: fetch a specific cashbook entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = await prisma.cashbookEntry.findUnique({
      where: { id },
      include: {
        line: true,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Cashbook entry not found' }, { status: 404 });
    }

    const normalized = {
      ...entry,
      date: entry.date.toISOString().split('T')[0],
      amount: Number(entry.amount),
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching cashbook entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/cashbook/[id] - Update cashbook entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
      type,
      amount,
      category,
      referenceType,
      referenceId,
      lineId,
      description
    } = body as {
      date?: string;
      type?: CashbookType;
      amount?: number;
      category?: string;
      referenceType?: string | null;
      referenceId?: string | null;
      lineId?: string | null;
      description?: string | null;
    };

    const existing = await prisma.cashbookEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Cashbook entry not found' }, { status: 404 });
    }

    if (amount !== undefined && amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    if (type && !['DEBIT', 'CREDIT'].includes(type)) {
      return NextResponse.json({ error: 'Type must be either DEBIT or CREDIT' }, { status: 400 });
    }

    if (lineId) {
      const line = await prisma.line.findUnique({ where: { id: lineId } });
      if (!line) {
        return NextResponse.json({ error: 'Production line not found' }, { status: 404 });
      }
    }

    const updated = await prisma.cashbookEntry.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        type: type ?? undefined,
        amount: amount ?? undefined,
        category: category ?? undefined,
        referenceType: referenceType ?? undefined,
        referenceId: referenceId ?? undefined,
        lineId: lineId === '' ? null : lineId,
        description: description ?? undefined,
      },
      include: {
        line: true,
      },
    });

    const normalized = {
      ...updated,
      date: updated.date.toISOString().split('T')[0],
      amount: Number(updated.amount),
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error updating cashbook entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/cashbook/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existing = await prisma.cashbookEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Cashbook entry not found' }, { status: 404 });
    }

    await prisma.cashbookEntry.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Cashbook entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting cashbook entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}