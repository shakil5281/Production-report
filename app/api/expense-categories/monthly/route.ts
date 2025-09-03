import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/expense-categories/monthly - Get all monthly expense categories
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all unique categories from existing monthly expenses
    const categories = await prisma.monthlyExpense.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc'
      }
    });

    // Also include default categories that might not have expenses yet
    const defaultCategories = [
      'Insurance',
      'License',
      'Transport',
      'Generator Fuel',
      'Electric bill',
      'Rent Building',
      'Others',
      'Salary Administration',
      'Profit bank Term loan',
      'Celling and Distribution',
      'Dericiation'
    ];

    // Combine and deduplicate categories
    const allCategories = [...new Set([
      ...defaultCategories,
      ...categories.map(c => c.category)
    ])].sort();

    return NextResponse.json({
      success: true,
      data: allCategories
    });
  } catch (error) {
    console.error('Error fetching monthly expense categories:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/expense-categories/monthly - Add new monthly expense category
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, overwrite } = body;

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const trimmedCategory = category.trim();
    if (!trimmedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category name cannot be empty' },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingExpense = await prisma.monthlyExpense.findFirst({
      where: {
        category: trimmedCategory
      }
    });

    if (existingExpense && !overwrite) {
      return NextResponse.json(
        { success: false, error: 'Category already exists. Use overwrite=true to replace existing entries.' },
        { status: 400 }
      );
    }

    // If overwrite is true, update all existing expenses with this category name
    if (existingExpense && overwrite) {
      // This is handled by the frontend when creating new expenses
      // The category will be updated when new expenses are created
    }

    return NextResponse.json({
      success: true,
      message: overwrite ? 'Category will be overwritten when used' : 'Category added successfully',
      data: { category: trimmedCategory }
    });
  } catch (error) {
    console.error('Error adding monthly expense category:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/expense-categories/monthly - Delete a monthly expense category
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if there are any expenses with this category
    const expensesWithCategory = await prisma.monthlyExpense.findMany({
      where: {
        category: category
      }
    });

    if (expensesWithCategory.length > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category "${category}" as it has ${expensesWithCategory.length} expense entries. Please delete the expenses first.` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting monthly expense category:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
