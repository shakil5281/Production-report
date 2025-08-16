import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { format } from 'date-fns';

// GET /api/cashbook/monthly-expense-report - Get monthly expense report
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Expected format: YYYY-MM

    if (!month) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Month parameter is required (format: YYYY-MM)' 
        },
        { status: 400 }
      );
    }

    // Parse the month parameter
    let year: number;
    let monthIndex: number;
    try {
      const [yearStr, monthStr] = month.split('-');
      year = parseInt(yearStr);
      monthIndex = parseInt(monthStr) - 1; // Month is 0-indexed in JavaScript Date
      
      if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        throw new Error('Invalid month format');
      }
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid month format. Use YYYY-MM format (e.g., 2024-01)' 
        },
        { status: 400 }
      );
    }

    // Calculate start and end dates for the month
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0); // Last day of the month

    // Fetch all daily expense entries for the month
    const entries = await prisma.cashbookEntry.findMany({
      where: {
        type: 'DEBIT', // Daily expenses are debit entries
        category: 'Daily Expense',
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        date: true,
        amount: true,
        description: true,
        referenceId: true, // Volume number
        createdAt: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Get unique expense categories (descriptions) for dynamic columns
    const categories = [...new Set(entries.map(entry => entry.description || 'Other'))].sort();

    // Group entries by date and category
    const groupedByDate = entries.reduce((acc, entry) => {
      const dateKey = format(new Date(entry.date), 'dd-MM-yyyy');
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          categories: {},
          dailyTotal: 0
        };
      }
      
      const category = entry.description || 'Other';
      if (!acc[dateKey].categories[category]) {
        acc[dateKey].categories[category] = 0;
      }
      
      acc[dateKey].categories[category] += Number(entry.amount);
      acc[dateKey].dailyTotal += Number(entry.amount);
      
      return acc;
    }, {} as Record<string, {
      date: string;
      categories: Record<string, number>;
      dailyTotal: number;
    }>);

    // Convert to array and sort by date
    const dailyData = Object.values(groupedByDate).sort((a, b) => {
      // Convert DD-MM-YYYY to Date for proper sorting
      const [dayA, monthA, yearA] = a.date.split('-');
      const [dayB, monthB, yearB] = b.date.split('-');
      const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
      const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
      return dateA.getTime() - dateB.getTime();
    });

    // Calculate category totals
    const categoryTotals = categories.reduce((acc, category) => {
      acc[category] = dailyData.reduce((sum, day) => sum + (day.categories[category] || 0), 0);
      return acc;
    }, {} as Record<string, number>);

    // Calculate overall total
    const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    const totalEntries = entries.length;

    return NextResponse.json({
      success: true,
      data: {
        entries,
        dailyData,
        categories,
        categoryTotals
      },
      summary: {
        month: month,
        monthName: format(startDate, 'MMMM yyyy'),
        totalAmount,
        totalEntries,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        daysWithExpenses: dailyData.length
      }
    });

  } catch (error) {
    console.error('Error fetching monthly expense report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch monthly expense report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
