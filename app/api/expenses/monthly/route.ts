import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '1');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const expenses = await prisma.monthlyExpense.findMany({
      where: {
        month,
        year
      },
      orderBy: [
        { category: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: expenses.map(expense => ({
        ...expense,
        amount: Number(expense.amount)
      }))
    });
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monthly expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, year, category, amount, description, paymentDate, paymentStatus, remarks } = body;

    // Validate required fields
    if (!month || !year || !category || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if expense already exists for this month, year, and category
    const existingExpense = await prisma.monthlyExpense.findUnique({
      where: {
        month_year_category: {
          month,
          year,
          category
        }
      }
    });

    if (existingExpense) {
      return NextResponse.json(
        { success: false, error: 'Expense already exists for this category in the selected month and year' },
        { status: 400 }
      );
    }

    const expense = await prisma.monthlyExpense.create({
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
    console.error('Error creating monthly expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create monthly expense' },
      { status: 500 }
    );
  }
}
