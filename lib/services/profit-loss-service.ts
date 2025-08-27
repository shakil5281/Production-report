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
      console.log(`🔄 Processing ${action} for ${type} record ${recordId} on ${date}`);
      
      // Parse the date to get month for profit loss calculation
      const [year, month] = date.split('-').map(Number);
      const monthStart = startOfMonth(new Date(year, month - 1, 1));
      const monthEnd = endOfMonth(monthStart);
      
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      
      console.log(`📅 Updating Profit & Loss for month: ${startDate} to ${endDate}`);
      
      // Fetch updated data for the month
      const updatedData = await this.calculateMonthlyProfitLoss(startDate, endDate);
      
      if (updatedData) {
        console.log(`✅ Profit & Loss updated successfully for ${type} ${action}`);
        console.log(`📊 New totals: Earnings=${updatedData.totalEarnings}, Expenses=${updatedData.totalExpenses}, Net Profit=${updatedData.netProfit}`);
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

      // Fetch Daily Salary Expenses (includes both regular and overtime amounts)
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
          totalAmount: true,
          section: true
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

      // Calculate totals
      const totalEarnings = dailyProduction.reduce((sum, item) => sum + Number(item.netAmount || 0), 0);
      const totalDailySalary = dailySalary.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
      const totalDailyCashExpenses = dailyCashExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

      // Net Profit = Daily Production (Grand Total) - Daily Salary (Grand Total) - Daily Cashbook Expense
      const totalExpenses = totalDailySalary + totalDailyCashExpenses;
      const netProfit = totalEarnings - totalExpenses;
      const profitMargin = totalEarnings > 0 ? (netProfit / totalEarnings) * 100 : 0;

      return {
        totalEarnings,
        totalExpenses,
        netProfit,
        profitMargin,
        breakdown: {
          dailySalary: totalDailySalary,
          dailyCashExpenses: totalDailyCashExpenses
        },
        dailyBreakdown: this.createDailyBreakdown(dailyProduction, dailySalary, dailyCashExpenses),
        lineBreakdown: this.createSectionBreakdown(dailyProduction, dailySalary)
      };
    } catch (error) {
      console.error('Error calculating monthly profit and loss:', error);
      throw error;
    }
  }
  
  /**
   * Create daily breakdown data
   */
  private static createDailyBreakdown(dailyProduction: any[], dailySalary: any[], dailyCashExpenses: any[]) {
    const dailyBreakdown = new Map();

    // Add production data
    dailyProduction.forEach(item => {
      const date = format(item.date, 'yyyy-MM-dd');
      if (!dailyBreakdown.has(date)) {
        dailyBreakdown.set(date, {
          date,
          earnings: 0,
          dailySalary: 0,
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
  
  /**
   * Create section breakdown data
   */
  private static createSectionBreakdown(dailyProduction: any[], dailySalary: any[]) {
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
}
