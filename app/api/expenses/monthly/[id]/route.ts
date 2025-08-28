import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expense = await prisma.monthlyExpense.findUnique({
      where: { id }
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...expense,
        amount: Number(expense.amount)
      }
    });
  } catch (error) {
    console.error('Error fetching monthly expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monthly expense' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { month, year, category, amount, description, paymentDate, paymentStatus, remarks } = body;

    // Validate required fields
    if (!month || !year || !category || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if expense already exists for this month, year, and category (excluding current expense)
    const existingExpense = await prisma.monthlyExpense.findFirst({
      where: {
        month,
        year,
        category,
        id: { not: id }
      }
    });

    if (existingExpense) {
      return NextResponse.json(
        { success: false, error: 'Expense already exists for this category in the selected month and year' },
        { status: 400 }
      );
    }

    const expense = await prisma.monthlyExpense.update({
      where: { id },
      data: {
        month,
        year,
        category,
        amount,
        description,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        paymentStatus: paymentStatus || 'PENDING',
        remarks
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...expense,
        amount: Number(expense.amount)
      }
    });
  } catch (error) {
    console.error('Error updating monthly expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update monthly expense' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.monthlyExpense.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting monthly expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete monthly expense' },
      { status: 500 }
    );
  }
}
