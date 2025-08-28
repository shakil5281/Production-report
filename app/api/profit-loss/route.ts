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
    let testQuery = 0;
    try {
      testQuery = await prisma.dailyProductionReport.count();
      console.log('Database connection test successful, count:', testQuery);
    } catch (error) {
      console.error('Database connection test failed:', error);
      testQuery = 0;
    }

    // Fetch Daily Production Reports (Earnings) - simplified query
    let dailyProduction: any[] = [];
    try {
      dailyProduction = await prisma.dailyProductionReport.findMany({
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
    } catch (error) {
      console.error('Daily production query failed:', error);
      dailyProduction = [];
    }

      // Fetch Daily Salary Records using Prisma ORM
      let dailySalary: any[] = [];
      try {
        dailySalary = await prisma.dailySalary.findMany({
          where: {
            date: {
              gte: new Date(dateFilter.gte),
              lte: new Date(dateFilter.lte)
            }
          },
          select: {
            id: true,
            date: true,
            section: true,
            workerCount: true,
            regularRate: true,
            overtimeHours: true,
            overtimeRate: true,
            regularAmount: true,
            overtimeAmount: true,
            totalAmount: true,
            remarks: true
          },
          orderBy: [
            { date: 'asc' },
            { section: 'asc' }
          ]
        });
        console.log('Daily salary query successful, count:', dailySalary.length);
      } catch (error) {
        console.error('Daily salary query failed:', error);
        dailySalary = [];
      }

      // Fetch Monthly Expenses for the period
      let monthlyExpenses: any[] = [];
      try {
        monthlyExpenses = await prisma.monthlyExpense.findMany({
          where: {
            OR: [
              {
                year: parseInt(month.split('-')[0]),
                month: parseInt(month.split('-')[1])
              }
            ]
          },
          select: {
            id: true,
            month: true,
            year: true,
            amount: true,
            category: true
          }
        });
        console.log('Monthly expenses query successful, count:', monthlyExpenses.length);
      } catch (error) {
        console.error('Monthly expenses query failed:', error);
        monthlyExpenses = [];
      }

      // Fetch Daily Cash Expenses from Cashbook - simplified query
      let dailyCashExpenses: any[] = [];
      try {
        dailyCashExpenses = await prisma.cashbookEntry.findMany({
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
      } catch (error) {
        console.error('Cash expenses query failed:', error);
        dailyCashExpenses = [];
      }

      // Calculate totals with default values for missing data
      const totalEarnings = dailyProduction.length > 0 ? dailyProduction.reduce((sum, item) => sum + Number(item.netAmount || 0), 0) : 0;
      const totalDailySalary = dailySalary.length > 0 ? dailySalary.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0) : 0;
      const totalMonthlyExpenses = monthlyExpenses.length > 0 ? monthlyExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
      const totalDailyCashExpenses = dailyCashExpenses.length > 0 ? dailyCashExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
      
      // Calculate daily equivalent of monthly expenses (Total Monthly Expense / 30)
      const dailyEquivalentMonthlyExpenses = totalMonthlyExpenses / 30;
      
      // Net Profit = Earnings - Cash Expenses - Daily Equivalent Monthly Expenses - Daily Salary
      const totalExpenses = totalDailyCashExpenses + dailyEquivalentMonthlyExpenses + totalDailySalary;
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
          totalEarnings: Number(totalEarnings) || 0,
          totalExpenses: Number(totalExpenses) || 0,
          netProfit: Number(netProfit) || 0,
          profitMargin: Number(profitMargin) || 0,
          breakdown: {
            monthlyExpenses: Number(totalMonthlyExpenses) || 0,
            dailyEquivalentMonthlyExpenses: Number(dailyEquivalentMonthlyExpenses) || 0,
            dailyCashExpenses: Number(totalDailyCashExpenses) || 0,
            dailySalary: Number(totalDailySalary) || 0
          }
        },
        dailyBreakdown: createDailyBreakdown(dailyProduction, monthlyExpenses, dailyCashExpenses, dailySalary),
        lineBreakdown: createSectionBreakdown(dailyProduction, monthlyExpenses),
        topPerformingLines: createSectionBreakdown(dailyProduction, monthlyExpenses).slice(0, 5),
        worstPerformingLines: createSectionBreakdown(dailyProduction, monthlyExpenses).slice(-5).reverse()
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
function createDailyBreakdown(dailyProduction: any[], monthlyExpenses: any[], dailyCashExpenses: any[], dailySalary: any[] = []) {
  const dailyBreakdown = new Map();
  
  // Calculate total monthly expenses with default value 0 if no data
  const totalMonthlyExpenses = monthlyExpenses.length > 0 ? monthlyExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
  
  // Calculate daily equivalent of monthly expenses (Total Monthly Expense / 30)
  const dailyEquivalentMonthlyExpenses = totalMonthlyExpenses / 30;

  // Add production data
  dailyProduction.forEach(item => {
    try {
      const date = item.date ? format(new Date(item.date), 'yyyy-MM-dd') : 'unknown';
      if (!dailyBreakdown.has(date)) {
        dailyBreakdown.set(date, {
          date,
          earnings: 0,
          monthlyExpenses: dailyEquivalentMonthlyExpenses, // Show daily equivalent in Others expense column
          dailyCashExpenses: 0,
          dailySalary: 0,
          netProfit: 0,
          productionCount: 0,
          cashExpenseCount: 0,
          salaryCount: 0
        });
      }
      const day = dailyBreakdown.get(date);
      day.earnings += Number(item.netAmount || 0);
      day.productionCount += 1;
    } catch (error) {
      console.error('Error processing production item:', error, item);
    }
  });

  // Add cash expense data
  dailyCashExpenses.forEach(item => {
    try {
      const date = item.date ? format(new Date(item.date), 'yyyy-MM-dd') : 'unknown';
      if (!dailyBreakdown.has(date)) {
        dailyBreakdown.set(date, {
          date,
          earnings: 0,
          monthlyExpenses: dailyEquivalentMonthlyExpenses, // Show daily equivalent in Others expense column
          dailyCashExpenses: 0,
          dailySalary: 0,
          netProfit: 0,
          productionCount: 0,
          cashExpenseCount: 0,
          salaryCount: 0
        });
      }
      const day = dailyBreakdown.get(date);
      day.dailyCashExpenses += Number(item.amount || 0);
      day.cashExpenseCount += 1;
    } catch (error) {
      console.error('Error processing cash expense item:', error, item);
    }
  });

  // Add salary data
  dailySalary.forEach(item => {
    try {
      const date = item.date ? format(new Date(item.date), 'yyyy-MM-dd') : 'unknown';
      if (!dailyBreakdown.has(date)) {
        dailyBreakdown.set(date, {
          date,
          earnings: 0,
          monthlyExpenses: dailyEquivalentMonthlyExpenses, // Show daily equivalent in Others expense column
          dailyCashExpenses: 0,
          dailySalary: 0,
          netProfit: 0,
          productionCount: 0,
          cashExpenseCount: 0,
          salaryCount: 0
        });
      }
      const day = dailyBreakdown.get(date);
      day.dailySalary += Number(item.totalAmount || 0);
      day.salaryCount += 1;
    } catch (error) {
      console.error('Error processing salary item:', error, item);
    }
  });

  // Calculate daily net profit: Earnings - Daily Equivalent Monthly Expenses - Daily Cash Expenses - Daily Salary
  return Array.from(dailyBreakdown.values()).map(day => ({
    ...day,
    earnings: Number(day.earnings) || 0,
    monthlyExpenses: Number(day.monthlyExpenses) || 0,
    dailyCashExpenses: Number(day.dailyCashExpenses) || 0,
    dailySalary: Number(day.dailySalary) || 0,
    netProfit: Number(day.earnings - day.monthlyExpenses - day.dailyCashExpenses - day.dailySalary) || 0,
    productionCount: Number(day.productionCount) || 0,
    cashExpenseCount: Number(day.cashExpenseCount) || 0,
    salaryCount: Number(day.salaryCount) || 0
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Helper function to create section breakdown
function createSectionBreakdown(dailyProduction: any[], monthlyExpenses: any[]) {
  const sectionBreakdown = new Map();
  
  // Calculate total monthly expenses with default value 0 if no data
  const totalMonthlyExpenses = monthlyExpenses.length > 0 ? monthlyExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
  
  // Calculate daily equivalent of monthly expenses (Total Monthly Expense / 30)
  const dailyEquivalentMonthlyExpenses = totalMonthlyExpenses / 30;

  // Add production by section (using line numbers)
  dailyProduction.forEach(item => {
    try {
      const section = item.lineNo || 'General';
      if (!sectionBreakdown.has(section)) {
        sectionBreakdown.set(section, {
          sectionId: section,
          sectionName: section,
          earnings: 0,
          monthlyExpenses: dailyEquivalentMonthlyExpenses, // Show daily equivalent in Others expense column
          netProfit: 0,
          productionCount: 0
        });
      }
      const sectionData = sectionBreakdown.get(section);
      sectionData.earnings += Number(item.netAmount || 0);
      sectionData.productionCount += 1;
    } catch (error) {
      console.error('Error processing section item:', error, item);
    }
  });

  // Calculate section-wise net profit: Earnings - Daily Equivalent Monthly Expenses
  return Array.from(sectionBreakdown.values()).map(section => ({
    ...section,
    earnings: Number(section.earnings) || 0,
    monthlyExpenses: Number(section.monthlyExpenses) || 0,
    netProfit: Number(section.earnings - section.monthlyExpenses) || 0,
    productionCount: Number(section.productionCount) || 0
  })).sort((a, b) => b.netProfit - a.netProfit);
}
