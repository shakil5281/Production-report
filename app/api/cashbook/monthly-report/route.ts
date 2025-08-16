import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { format } from 'date-fns';

// GET /api/cashbook/monthly-report - Get monthly cashbook report
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

    // Fetch all cashbook entries for the month (both income and expenses)
    const allEntries = await prisma.cashbookEntry.findMany({
      where: {
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
        type: true,
        category: true,
        referenceId: true,
        createdAt: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Separate income and expenses
    const cashReceived = allEntries.filter(entry => entry.type === 'CREDIT' && entry.category === 'Cash Received');
    const dailyExpenses = allEntries.filter(entry => entry.type === 'DEBIT' && entry.category === 'Daily Expense');

    // Calculate totals
    const totalCashReceived = cashReceived.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const totalDailyExpenses = dailyExpenses.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const netAmount = totalCashReceived - totalDailyExpenses;

    // Group entries by date for better organization
    const groupedByDate = allEntries.reduce((acc, entry) => {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          cashReceived: [],
          dailyExpenses: [],
          dailyCashTotal: 0,
          dailyExpenseTotal: 0,
          dailyNet: 0
        };
      }
      
      if (entry.type === 'CREDIT' && entry.category === 'Cash Received') {
        acc[dateKey].cashReceived.push(entry);
        acc[dateKey].dailyCashTotal += Number(entry.amount);
      } else if (entry.type === 'DEBIT' && entry.category === 'Daily Expense') {
        acc[dateKey].dailyExpenses.push(entry);
        acc[dateKey].dailyExpenseTotal += Number(entry.amount);
      }
      
      acc[dateKey].dailyNet = acc[dateKey].dailyCashTotal - acc[dateKey].dailyExpenseTotal;
      
      return acc;
    }, {} as Record<string, {
      date: string;
      cashReceived: typeof allEntries;
      dailyExpenses: typeof allEntries;
      dailyCashTotal: number;
      dailyExpenseTotal: number;
      dailyNet: number;
    }>);

    // Convert to array and sort by date
    const dailyReports = Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: {
        allEntries,
        cashReceived,
        dailyExpenses,
        dailyReports
      },
      summary: {
        month: month,
        monthName: format(startDate, 'MMMM yyyy'),
        totalCashReceived,
        totalDailyExpenses,
        netAmount,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        totalEntries: allEntries.length,
        daysWithTransactions: dailyReports.length
      }
    });

  } catch (error) {
    console.error('Error fetching monthly cashbook report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch monthly cashbook report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
