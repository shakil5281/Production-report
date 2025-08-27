import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || format(new Date(), 'yyyy-MM');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateFilter: { gte: string; lte: string };

    if (startDate && endDate) {
      dateFilter = {
        gte: startDate,
        lte: endDate
      };
    } else {
      const monthStart = startOfMonth(parseISO(`${month}-01`));
      const monthEnd = endOfMonth(monthStart);
      dateFilter = {
        gte: format(monthStart, 'yyyy-MM-dd'),
        lte: format(monthEnd, 'yyyy-MM-dd')
      };
    }

    // Test basic database connection first
    const testQuery = await prisma.dailyProductionReport.count();
    console.log('Database connection test successful, count:', testQuery);

    // Fetch Daily Production Reports (Earnings) - simplified query
    const dailyProduction = await prisma.dailyProductionReport.findMany({
      where: {
        date: {
          gte: new Date(dateFilter.gte),
          lte: new Date(dateFilter.lte)
        }
      },
      select: {
        id: true,
        date: true,
        netAmount: true,
        lineNo: true,
        styleNo: true
      }
    });

    console.log('Daily production query successful, count:', dailyProduction.length);

    // Fetch Daily Salary Expenses - simplified query
    const dailySalary = await prisma.dailySalary.findMany({
      where: {
        date: {
          gte: new Date(dateFilter.gte),
          lte: new Date(dateFilter.lte)
        }
      },
      select: {
        id: true,
        date: true,
        totalAmount: true,
        section: true
      }
    });

    console.log('Daily salary query successful, count:', dailySalary.length);

    // Note: Overtime is now included in Daily Salary total, so we don't fetch it separately
    console.log('Overtime is included in Daily Salary total');

    // Fetch Daily Cash Expenses from Cashbook - simplified query
    const dailyCashExpenses = await prisma.cashbookEntry.findMany({
      where: {
        date: {
          gte: new Date(dateFilter.gte),
          lte: new Date(dateFilter.lte)
        },
        type: 'DEBIT',
        category: 'Daily Expense'
      },
      select: {
        id: true,
        date: true,
        amount: true,
        description: true
      }
    });

    console.log('Cash expenses query successful, count:', dailyCashExpenses.length);

    // Calculate totals
    const totalEarnings = dailyProduction.reduce((sum, item) => sum + Number(item.netAmount || 0), 0);
    const totalDailySalary = dailySalary.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
    
    // Note: Overtime is now included in Daily Salary total (regular + overtime amounts)
    const totalDailyCashExpenses = dailyCashExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

    // Net Profit = Daily Production (Grand Total) - Daily Salary (Grand Total) - Daily Cashbook Expense
    const totalExpenses = totalDailySalary + totalDailyCashExpenses;
    const netProfit = totalEarnings - totalExpenses;
    const profitMargin = totalEarnings > 0 ? (netProfit / totalEarnings) * 100 : 0;

    // Create a simple response for now
    const response = {
      success: true,
      data: {
        period: {
          month: month,
          startDate: dateFilter.gte,
          endDate: dateFilter.lte
        },
        summary: {
          totalEarnings,
          totalExpenses,
          netProfit,
          profitMargin,
          breakdown: {
            dailySalary: totalDailySalary,
            dailyOvertime: 0, // Overtime is included in dailySalary total
            dailyCashExpenses: totalDailyCashExpenses
          }
        },
        dailyBreakdown: createDailyBreakdown(dailyProduction, dailySalary, dailyCashExpenses),
        lineBreakdown: createSectionBreakdown(dailyProduction, dailySalary),
        topPerformingLines: createSectionBreakdown(dailyProduction, dailySalary).slice(0, 5),
        worstPerformingLines: createSectionBreakdown(dailyProduction, dailySalary).slice(-5).reverse()
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching profit and loss data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profit and loss data', details: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to create daily breakdown
function createDailyBreakdown(dailyProduction: any[], dailySalary: any[], dailyCashExpenses: any[]) {
  const dailyBreakdown = new Map();

  // Add production data
  dailyProduction.forEach(item => {
    const date = format(item.date, 'yyyy-MM-dd');
    if (!dailyBreakdown.has(date)) {
      dailyBreakdown.set(date, {
        date,
        earnings: 0,
        dailySalary: 0,
        dailyOvertime: 0,
        dailyCashExpenses: 0,
        netProfit: 0,
        productionCount: 0,
        salaryCount: 0,
        cashExpenseCount: 0
      });
    }
    const day = dailyBreakdown.get(date);
    day.earnings += Number(item.netAmount || 0);
    day.productionCount += 1;
  });

  // Add salary data (includes both regular and overtime amounts)
  dailySalary.forEach(item => {
    const date = format(item.date, 'yyyy-MM-dd');
    if (!dailyBreakdown.has(date)) {
      dailyBreakdown.set(date, {
        date,
        earnings: 0,
        dailySalary: 0,
        dailyOvertime: 0,
        dailyCashExpenses: 0,
        netProfit: 0,
        productionCount: 0,
        salaryCount: 0,
        cashExpenseCount: 0
      });
    }
    const day = dailyBreakdown.get(date);
    day.dailySalary += Number(item.totalAmount || 0);
    day.salaryCount += 1;
  });

  // Add cash expense data
  dailyCashExpenses.forEach(item => {
    const date = format(item.date, 'yyyy-MM-dd');
    if (!dailyBreakdown.has(date)) {
      dailyBreakdown.set(date, {
        date,
        earnings: 0,
        dailySalary: 0,
        dailyOvertime: 0,
        dailyCashExpenses: 0,
        netProfit: 0,
        productionCount: 0,
        salaryCount: 0,
        cashExpenseCount: 0
      });
    }
    const day = dailyBreakdown.get(date);
    day.dailyCashExpenses += Number(item.amount);
    day.cashExpenseCount += 1;
  });

  // Calculate daily net profit: Earnings - Daily Salary - Daily Cash Expenses
  return Array.from(dailyBreakdown.values()).map(day => ({
    ...day,
    netProfit: day.earnings - day.dailySalary - day.dailyCashExpenses
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Helper function to create section breakdown
function createSectionBreakdown(dailyProduction: any[], dailySalary: any[]) {
  const sectionBreakdown = new Map();

  // Add production by section (using line numbers)
  dailyProduction.forEach(item => {
    const section = item.lineNo || 'General';
    if (!sectionBreakdown.has(section)) {
      sectionBreakdown.set(section, {
        sectionId: section,
        sectionName: section,
        earnings: 0,
        dailySalary: 0,
        dailyOvertime: 0,
        netProfit: 0,
        productionCount: 0,
        salaryCount: 0
      });
    }
    const sectionData = sectionBreakdown.get(section);
    sectionData.earnings += Number(item.netAmount || 0);
    sectionData.productionCount += 1;
  });

  // Add salary by section (includes both regular and overtime amounts)
  dailySalary.forEach(item => {
    const section = item.section;
    if (!sectionBreakdown.has(section)) {
      sectionBreakdown.set(section, {
        sectionId: section,
        sectionName: section,
        earnings: 0,
        dailySalary: 0,
        dailyOvertime: 0,
        netProfit: 0,
        productionCount: 0,
        salaryCount: 0
      });
    }
    const sectionData = sectionBreakdown.get(section);
    sectionData.dailySalary += Number(item.totalAmount || 0);
    sectionData.salaryCount += 1;
  });

  // Calculate section-wise net profit: Earnings - Daily Salary
  return Array.from(sectionBreakdown.values()).map(section => ({
    ...section,
    netProfit: section.earnings - section.dailySalary
  })).sort((a, b) => b.netProfit - a.netProfit);
}
