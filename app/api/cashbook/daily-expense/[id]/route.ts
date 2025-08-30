import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/cashbook/daily-expense/[id] - Get single daily expense entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const entry = await prisma.cashbookEntry.findUnique({
      where: {
        id,
        type: 'DEBIT' // Ensure it's a daily expense entry
      },
      include: {
        line: true
      }
    });

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Daily expense entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entry
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch daily expense entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/cashbook/daily-expense/[id] - Update daily expense entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      date,
      amount,
      description,
      referenceId // Volume number
    } = body;

    // Check if entry exists and is a daily expense entry
    const existingEntry = await prisma.cashbookEntry.findUnique({
      where: {
        id,
        type: 'DEBIT'
      }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Daily expense entry not found' },
        { status: 404 }
      );
    }

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

    // Update daily expense entry
    const updatedEntry = await prisma.cashbookEntry.update({
      where: { id },
      data: {
        date: entryDate,
        amount: amountNum,
        description: description.trim(),
        referenceId: referenceId?.trim() || null,
        updatedAt: new Date()
      },
      include: {
        line: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'Daily expense entry updated successfully'
    });

      } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update daily expense entry',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
}

// DELETE /api/cashbook/daily-expense/[id] - Delete daily expense entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if entry exists and is a daily expense entry
    const existingEntry = await prisma.cashbookEntry.findUnique({
      where: {
        id,
        type: 'DEBIT'
      }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Daily expense entry not found' },
        { status: 404 }
      );
    }

    // Delete the entry
    await prisma.cashbookEntry.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Daily expense entry deleted successfully',
      data: { id }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete daily expense entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
