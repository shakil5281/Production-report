import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/cashbook/cash-received/[id] - Get single cash received entry
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
        type: 'CREDIT' // Ensure it's a cash received entry
      },
      include: {
        line: true
      }
    });

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Cash received entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entry
    });

  } catch (error) {
    console.error('Error fetching cash received entry:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cash received entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/cashbook/cash-received/[id] - Update cash received entry
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
      category,
      description,
      referenceType,
      referenceId,
      lineId
    } = body;

    // Check if entry exists and is a cash received entry
    const existingEntry = await prisma.cashbookEntry.findUnique({
      where: {
        id,
        type: 'CREDIT'
      }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Cash received entry not found' },
        { status: 404 }
      );
    }

    // Validation
    if (!date || !amount || !category) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: date, amount, category' 
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

    // Update cash received entry
    const updatedEntry = await prisma.cashbookEntry.update({
      where: { id },
      data: {
        date: entryDate,
        amount: amountNum,
        category: category.trim(),
        description: description?.trim() || null,
        referenceType: referenceType?.trim() || null,
        referenceId: referenceId?.trim() || null,
        lineId: lineId || null,
        updatedAt: new Date()
      },
      include: {
        line: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'Cash received entry updated successfully'
    });

  } catch (error) {
    console.error('Error updating cash received entry:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update cash received entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/cashbook/cash-received/[id] - Delete cash received entry
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

    // Check if entry exists and is a cash received entry
    const existingEntry = await prisma.cashbookEntry.findUnique({
      where: {
        id,
        type: 'CREDIT'
      }
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Cash received entry not found' },
        { status: 404 }
      );
    }

    // Delete the entry
    await prisma.cashbookEntry.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Cash received entry deleted successfully',
      data: { id }
    });

  } catch (error) {
    console.error('Error deleting cash received entry:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete cash received entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
