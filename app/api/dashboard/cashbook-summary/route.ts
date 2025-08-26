import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const date = new Date(dateParam);

    // Get start and end of month for monthly summary
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Get cashbook data for the month
    const cashbookData = await prisma.cashbookEntry.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        line: true
      }
    });

    // Calculate summary statistics
    const summary = {
      totalDebits: 0,
      totalCredits: 0,
      netCashFlow: 0,
      byCategory: [] as Array<{
        category: string;
        totalAmount: number;
        transactionCount: number;
        type: 'DEBIT' | 'CREDIT';
      }>,
      byLine: [] as Array<{
        lineId: string;
        lineName: string;
        lineCode: string;
        totalDebits: number;
        totalCredits: number;
        netAmount: number;
      }>,
      monthlyTrend: {
        currentMonth: 0,
        previousMonth: 0,
        change: 0,
        changePercentage: 0
      },
      topCategories: [] as Array<{
        category: string;
        totalAmount: number;
        type: 'DEBIT' | 'CREDIT';
      }>
    };

    // Calculate totals
    cashbookData.forEach(entry => {
      if (entry.type === 'DEBIT') {
        summary.totalDebits += Number(entry.amount);
      } else {
        summary.totalCredits += Number(entry.amount);
      }
    });

    summary.netCashFlow = summary.totalCredits - summary.totalDebits;

    // Calculate by category
    const categoryMap = new Map();
    cashbookData.forEach(entry => {
      const key = `${entry.category}-${entry.type}`;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          category: entry.category,
          totalAmount: 0,
          transactionCount: 0,
          type: entry.type
        });
      }
      
      const categoryData = categoryMap.get(key);
      categoryData.totalAmount += Number(entry.amount);
      categoryData.transactionCount += 1;
    });

    categoryMap.forEach(categoryData => {
      summary.byCategory.push(categoryData);
    });

    // Sort categories by amount
    summary.byCategory.sort((a, b) => b.totalAmount - a.totalAmount);

    // Get top categories
    summary.topCategories = summary.byCategory.slice(0, 5);

    // Calculate by line
    const lineMap = new Map();
    cashbookData.forEach(entry => {
      if (entry.lineId) {
        if (!lineMap.has(entry.lineId)) {
          lineMap.set(entry.lineId, {
            lineId: entry.lineId,
            lineName: entry.line?.name || 'Unknown',
            lineCode: entry.line?.code || 'Unknown',
            totalDebits: 0,
            totalCredits: 0,
            netAmount: 0
          });
        }
        
        const lineData = lineMap.get(entry.lineId);
        if (entry.type === 'DEBIT') {
          lineData.totalDebits += Number(entry.amount);
        } else {
          lineData.totalCredits += Number(entry.amount);
        }
      }
    });

    // Calculate net amount for each line
    lineMap.forEach(lineData => {
      lineData.netAmount = lineData.totalCredits - lineData.totalDebits;
      summary.byLine.push(lineData);
    });

    // Sort lines by net amount
    summary.byLine.sort((a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount));

    // Get previous month data for trend calculation
    const previousMonthStart = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const previousMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);

    const previousMonthData = await prisma.cashbookEntry.findMany({
      where: {
        date: {
          gte: previousMonthStart,
          lte: previousMonthEnd
        }
      }
    });

    let previousMonthTotal = 0;
    previousMonthData.forEach(entry => {
      if (entry.type === 'CREDIT') {
        previousMonthTotal += Number(entry.amount);
      } else {
        previousMonthTotal -= Number(entry.amount);
      }
    });

    summary.monthlyTrend.currentMonth = summary.netCashFlow;
    summary.monthlyTrend.previousMonth = previousMonthTotal;
    summary.monthlyTrend.change = summary.netCashFlow - previousMonthTotal;
    summary.monthlyTrend.changePercentage = previousMonthTotal !== 0 
      ? Math.round((summary.monthlyTrend.change / Math.abs(previousMonthTotal)) * 100) 
      : 0;

    return NextResponse.json({
      date: dateParam,
      month: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
      summary
    });
  } catch (error) {
    console.error('Error fetching cashbook summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
