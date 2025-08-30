import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const testQuery = await prisma.dailyProductionReport.count();
    
    if (testQuery === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed' 
      }, { status: 500 });
    }

    // Get month parameter from query string
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    
    let targetDate: Date;
    if (monthParam) {
      // Parse the month parameter (format: yyyy-MM)
      const [year, month] = monthParam.split('-').map(Number);
      targetDate = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
    } else {
      targetDate = new Date();
    }
    
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    // Get start and end of target month
    const startOfMonthDate = new Date(targetYear, targetMonth, 1);
    const endOfMonthDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Fetch daily production data for current month
    const dailyProduction = await prisma.dailyProductionReport.findMany({
      where: {
        date: {
          gte: startOfMonthDate,
          lte: endOfMonthDate
        }
      },
      select: {
        productionQty: true,
        date: true,
        netAmount: true,
        lineNo: true
      }
    });

    // Fetch daily salary data for current month
    const dailySalary = await prisma.dailySalary.findMany({
      where: {
        date: {
          gte: startOfMonthDate,
          lte: endOfMonthDate
        }
      },
      select: {
        totalAmount: true,
        date: true
      }
    });

    // Fetch monthly expenses for target month
    const monthlyExpenses = await prisma.monthlyExpense.findMany({
      where: {
        month: targetMonth + 1,
        year: targetYear
      },
      select: {
        amount: true,
        category: true
      }
    });

    // Fetch daily cash expenses for current month
    const dailyCashExpenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startOfMonthDate,
          lte: endOfMonthDate
        }
      },
      select: {
        amount: true,
        date: true
      }
    });

    // Calculate totals
    const totalProduction = dailyProduction.reduce((sum, record) => sum + record.productionQty, 0);
    const totalSalary = dailySalary.reduce((sum, record) => sum + Number(record.totalAmount), 0);
    const totalMonthlyExpenses = monthlyExpenses.reduce((sum, record) => sum + Number(record.amount), 0);
    const totalDailyCashExpenses = dailyCashExpenses.reduce((sum, record) => sum + Number(record.amount), 0);
    const totalExpenses = totalSalary + totalMonthlyExpenses + totalDailyCashExpenses;

    // Calculate earnings from production (using netAmount if available, otherwise estimate)
    const totalEarnings = dailyProduction.reduce((sum, record) => {
      return sum + Number(record.netAmount || 0);
    }, 0);

    // Calculate net profit
    const netProfit = totalEarnings - totalExpenses;
    const profitMargin = totalEarnings > 0 ? (netProfit / totalEarnings) * 100 : 0;

    // Create daily breakdown
    const dailyBreakdown = createDailyBreakdown(dailyProduction, monthlyExpenses, dailyCashExpenses, dailySalary);
    
    // Create line breakdown
    const lineBreakdown = createSectionBreakdown(dailyProduction, monthlyExpenses);
    
    // Sort lines by performance
    const sortedLines = [...lineBreakdown].sort((a, b) => b.netProfit - a.netProfit);
    const topPerformingLines = sortedLines.slice(0, 5);
    const worstPerformingLines = sortedLines.slice(-5).reverse();

    return NextResponse.json({
      success: true,
      data: {
        period: {
          month: format(targetDate, 'MMMM yyyy'),
          startDate: format(startOfMonthDate, 'yyyy-MM-dd'),
          endDate: format(endOfMonthDate, 'yyyy-MM-dd')
        },
        summary: {
          totalEarnings: totalEarnings,
          totalExpenses: totalExpenses,
          netProfit: netProfit,
          profitMargin: profitMargin,
          breakdown: {
            monthlyExpenses: totalMonthlyExpenses,
            dailyEquivalentMonthlyExpenses: totalMonthlyExpenses / 30,
            dailyCashExpenses: totalDailyCashExpenses,
            dailySalary: totalSalary
          }
        },
        dailyBreakdown: dailyBreakdown,
        lineBreakdown: lineBreakdown,
        topPerformingLines: topPerformingLines,
        worstPerformingLines: worstPerformingLines
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
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
          monthlyExpenses: dailyEquivalentMonthlyExpenses,
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
      // Silently handle errors
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
          monthlyExpenses: dailyEquivalentMonthlyExpenses,
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
      // Silently handle errors
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
          monthlyExpenses: dailyEquivalentMonthlyExpenses,
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
      // Silently handle errors
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
          monthlyExpenses: dailyEquivalentMonthlyExpenses,
          netProfit: 0,
          productionCount: 0
        });
      }
      const sectionData = sectionBreakdown.get(section);
      sectionData.earnings += Number(item.netAmount || 0);
      sectionData.productionCount += 1;
    } catch (error) {
      // Silently handle errors
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
