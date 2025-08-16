import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';

// GET /api/cashbook/summary - Get cashbook summary with comprehensive metrics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current_month'; // current_month, last_month, all_time, today
    
    let startDate: Date;
    let endDate: Date;
    let periodName: string;

    // Determine date range based on period
    switch (period) {
      case 'today':
        startDate = startOfDay(new Date());
        endDate = endOfDay(new Date());
        periodName = format(new Date(), 'MMM dd, yyyy');
        break;
      case 'last_month':
        const lastMonth = subMonths(new Date(), 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        periodName = format(lastMonth, 'MMMM yyyy');
        break;
      case 'all_time':
        startDate = new Date('2020-01-01'); // Far past date
        endDate = new Date();
        periodName = 'All Time';
        break;
      case 'current_month':
      default:
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        periodName = format(new Date(), 'MMMM yyyy');
        break;
    }

    // Fetch all cashbook entries for the period
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
        date: 'desc'
      }
    });

    // Separate cash received and expenses
    const cashReceived = allEntries.filter(entry => entry.type === 'CREDIT' && entry.category === 'Cash Received');
    const dailyExpenses = allEntries.filter(entry => entry.type === 'DEBIT' && entry.category === 'Daily Expense');

    // Calculate totals
    const totalCashReceived = cashReceived.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const totalDailyExpenses = dailyExpenses.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const netAmount = totalCashReceived - totalDailyExpenses;

    // Get expense categories and their totals
    const expenseCategories = dailyExpenses.reduce((acc, entry) => {
      const category = entry.description || 'Other';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(entry.amount);
      return acc;
    }, {} as Record<string, number>);

    // Sort expense categories by amount (highest first)
    const topExpenseCategories = Object.entries(expenseCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 categories

    // Recent transactions (last 10)
    const recentTransactions = allEntries.slice(0, 10);

    // Daily summary for the period (last 30 days or period length)
    const dailySummary = allEntries.reduce((acc, entry) => {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          cashReceived: 0,
          expenses: 0,
          net: 0,
          transactionCount: 0
        };
      }
      
      if (entry.type === 'CREDIT' && entry.category === 'Cash Received') {
        acc[dateKey].cashReceived += Number(entry.amount);
      } else if (entry.type === 'DEBIT' && entry.category === 'Daily Expense') {
        acc[dateKey].expenses += Number(entry.amount);
      }
      
      acc[dateKey].net = acc[dateKey].cashReceived - acc[dateKey].expenses;
      acc[dateKey].transactionCount += 1;
      
      return acc;
    }, {} as Record<string, {
      date: string;
      cashReceived: number;
      expenses: number;
      net: number;
      transactionCount: number;
    }>);

    // Convert daily summary to array and sort by date (most recent first)
    const dailySummaryArray = Object.values(dailySummary)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30); // Last 30 days

    // Calculate averages
    const daysWithTransactions = Object.keys(dailySummary).length;
    const avgDailyReceived = daysWithTransactions > 0 ? totalCashReceived / daysWithTransactions : 0;
    const avgDailyExpenses = daysWithTransactions > 0 ? totalDailyExpenses / daysWithTransactions : 0;

    // Find highest and lowest transaction days
    const highestReceiptDay = cashReceived.length > 0 
      ? cashReceived.reduce((max, entry) => Number(entry.amount) > Number(max.amount) ? entry : max)
      : null;
    
    const highestExpenseDay = dailyExpenses.length > 0
      ? dailyExpenses.reduce((max, entry) => Number(entry.amount) > Number(max.amount) ? entry : max)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        period: periodName,
        periodType: period,
        dateRange: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        },
        totals: {
          cashReceived: totalCashReceived,
          expenses: totalDailyExpenses,
          netAmount: netAmount,
          totalTransactions: allEntries.length
        },
        breakdown: {
          cashReceivedCount: cashReceived.length,
          expensesCount: dailyExpenses.length,
          daysWithTransactions,
          averages: {
            dailyReceived: avgDailyReceived,
            dailyExpenses: avgDailyExpenses
          }
        },
        topExpenseCategories,
        recentTransactions,
        dailySummary: dailySummaryArray,
        insights: {
          highestReceiptDay,
          highestExpenseDay,
          isProfit: netAmount > 0,
          profitMargin: totalCashReceived > 0 ? ((netAmount / totalCashReceived) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching cashbook summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cashbook summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
