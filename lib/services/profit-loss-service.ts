import { prisma } from '@/lib/db/prisma';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export interface ProfitLossUpdateData {
  date: string;
  type: 'PRODUCTION' | 'SALARY' | 'CASHBOOK';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  recordId: string;
}

export class ProfitLossService {
  
  /**
   * Handle automatic Profit & Loss Statement updates
   * Called when changes are made to Cashbook, Daily Production, or Daily Salary
   */
  static async handleProfitLossUpdate(data: ProfitLossUpdateData) {
    const { date, type, action, recordId } = data;
    
    try {
      
      // Parse the date to get month for profit loss calculation
      const [year, month] = date.split('-').map(Number);
      const monthStart = startOfMonth(new Date(year, month - 1, 1));
      const monthEnd = endOfMonth(monthStart);
      
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      
      
      // Fetch updated data for the month
      const updatedData = await this.calculateMonthlyProfitLoss(startDate, endDate);
      
      if (updatedData) {
        
      }
      
      return updatedData;
    } catch (error) {
      console.error(`❌ Error updating Profit & Loss for ${type} ${action}:`, error);
      // Don't throw error - this is a background update
      return null;
    }
  }
  
  /**
   * Calculate monthly profit and loss data
   */
  static async calculateMonthlyProfitLoss(startDate: string, endDate: string) {
    try {
      // Fetch Daily Production Reports (Earnings)
      const dailyProduction = await prisma.dailyProductionReport.findMany({
        where: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
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

      // Fetch Daily Salary Records using Prisma ORM
      const dailySalary = await prisma.dailySalary.findMany({
        where: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
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

      // Fetch Monthly Expenses for the period
      const monthlyExpenses = await prisma.monthlyExpense.findMany({
        where: {
          OR: [
            {
              year: parseInt(startDate.split('-')[0]),
              month: parseInt(startDate.split('-')[1])
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

      // Fetch Daily Cash Expenses from Cashbook
      const dailyCashExpenses = await prisma.cashbookEntry.findMany({
        where: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
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

      // Calculate totals with default values for missing data
      const totalEarnings = dailyProduction.length > 0 ? dailyProduction.reduce((sum, item) => sum + Number(item.netAmount || 0), 0) : 0;
      const totalDailySalary = dailySalary.length > 0 ? dailySalary.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0) : 0;
      const totalMonthlyExpenses = monthlyExpenses.length > 0 ? monthlyExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
      const totalDailyCashExpenses = dailyCashExpenses.length > 0 ? dailyCashExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
      
      // Calculate daily equivalent of monthly expenses (Total Monthly Expense / 30)
      const dailyEquivalentMonthlyExpenses = totalMonthlyExpenses / 30;
      
      // Net Profit = Earnings - Daily Equivalent Monthly Expenses - Daily Cash Expenses - Daily Salary
      const totalExpenses = dailyEquivalentMonthlyExpenses + totalDailyCashExpenses + totalDailySalary;
      const netProfit = totalEarnings - totalExpenses;
      const profitMargin = totalEarnings > 0 ? (netProfit / totalEarnings) * 100 : 0;

      return {
        totalEarnings: Number(totalEarnings) || 0,
        totalExpenses: Number(totalExpenses) || 0,
        netProfit: Number(netProfit) || 0,
        profitMargin: Number(profitMargin) || 0,
        breakdown: {
          monthlyExpenses: Number(totalMonthlyExpenses) || 0,
          dailyEquivalentMonthlyExpenses: Number(dailyEquivalentMonthlyExpenses) || 0,
          dailyCashExpenses: Number(totalDailyCashExpenses) || 0,
          dailySalary: Number(totalDailySalary) || 0
        },
        dailyBreakdown: this.createDailyBreakdown(dailyProduction, monthlyExpenses, dailyCashExpenses, dailySalary),
        lineBreakdown: this.createSectionBreakdown(dailyProduction, monthlyExpenses)
      };
    } catch (error) {
      console.error('Error calculating monthly profit and loss:', error);
      throw error;
    }
  }
  
    /**
   * Create daily breakdown data
   */
  private static createDailyBreakdown(dailyProduction: any[], monthlyExpenses: any[], dailyCashExpenses: any[], dailySalary: any[] = []) {
    const dailyBreakdown = new Map();
    
    // Calculate total monthly expenses with default value 0 if no data
    const totalMonthlyExpenses = monthlyExpenses.length > 0 ? monthlyExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    
    // Calculate daily equivalent of monthly expenses (Total Monthly Expense / 30)
    const dailyEquivalentMonthlyExpenses = totalMonthlyExpenses / 30;

    // Add production data
    dailyProduction.forEach(item => {
      const date = format(item.date, 'yyyy-MM-dd');
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
    });

    // Add cash expense data
    dailyCashExpenses.forEach(item => {
      const date = format(item.date, 'yyyy-MM-dd');
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
      day.dailyCashExpenses += Number(item.amount);
      day.cashExpenseCount += 1;
    });

    // Add salary data
    dailySalary.forEach(item => {
      const date = format(item.date, 'yyyy-MM-dd');
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
  
  /**
   * Create section breakdown data
   */
  private static createSectionBreakdown(dailyProduction: any[], monthlyExpenses: any[]) {
    const sectionBreakdown = new Map();
    
    // Calculate total monthly expenses with default value 0 if no data
    const totalMonthlyExpenses = monthlyExpenses.length > 0 ? monthlyExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) : 0;
    
    // Calculate daily equivalent of monthly expenses (Total Monthly Expense / 30)
    const dailyEquivalentMonthlyExpenses = totalMonthlyExpenses / 30;

    // Add production by section (using line numbers)
    dailyProduction.forEach(item => {
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
}
